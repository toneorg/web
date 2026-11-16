"use client";
// The person's own corner of the web: who they are, what the tone knows about them, their
// occasions and the keys to their data. Since 15/11/2026 it is not a tab: the avatar in the top
// bar opens it as a drawer over the chat (a folha on a phone).
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import {
  canRecordOutcome,
  episodeLine,
  type Me,
  type Memory,
  memoryLabel,
  OUTCOME_LABELS,
  OWNED_CATEGORY,
  type PurchaseSituation,
  type SituationOutcomeVerdict,
  todayInBrazil,
} from "@/tone/shared";
import { track } from "./analytics";
import { ApiError, api, peek } from "./api";
import { AccessSessions } from "./AccessSessions";
import { Connections } from "./Connections";
import { Sheet, useSheetClose } from "./Sheet";
import { initialOf } from "./Shell";
import { dangerButton, field, outlineButton } from "./ui";

const quiet = outlineButton;
const danger = dangerButton;
const small =
  "press min-h-11 rounded-full px-3 text-caption text-graphite focus-visible:outline-2 focus-visible:outline-ink";

/** What a destructive button asks for before it runs. */
type Pending = { title: string; text: string; confirm: string; busy?: string; run: () => Promise<void> } | null;

/** What the person wrote as it is ("já tenho…", a loose note): no name to put before it. */
const shownAsIs = (memory: Memory) => memory.category === OWNED_CATEGORY || memory.key.startsWith("nota.");

/** What the tone remembers: a guess can be confirmed, everything can be deleted. */
function MemoryList(props: { memories: Memory[]; onChange: () => void }) {
  return (
    <ul className="flex flex-col gap-1" data-ph-mask>
      {props.memories.map((memory) => (
        <li key={memory.id} className="flex items-center justify-between gap-2 text-small text-ink">
          <span>
            {shownAsIs(memory) ? memory.value : `${memoryLabel(memory.key, memory.condition)}: ${memory.value}`}
            {memory.condition ? <span className="text-graphite"> · quando: {memory.condition}</span> : null}
            {memory.inferred ? <span className="text-graphite"> · palpite da tone</span> : null}
          </span>
          <span className="flex shrink-0">
            {memory.inferred ? (
              <button
                type="button"
                className={small}
                aria-label={`Confirmar ${memoryLabel(memory.key, memory.condition)}`}
                onClick={() =>
                  void api.confirmMemory(memory.id).then(() => {
                    track("memory_confirmed");
                    props.onChange();
                  })
                }
              >
                Confirmar
              </button>
            ) : null}
            <button
              type="button"
              className={small}
              aria-label={`Apagar ${memoryLabel(memory.key, memory.condition)}`}
              onClick={() =>
                void api.deleteMemory(memory.id).then(() => {
                  track("memory_deleted");
                  props.onChange();
                })
              }
            >
              Apagar
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The confirmation of a destructive action, inside the folha. */
function Confirm(props: { pending: NonNullable<Pending> }) {
  const close = useSheetClose();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await props.pending.run();
      close();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não deu certo. Tente de novo.");
      setBusy(false);
    }
  };
  return (
    <>
      <p className="text-body text-ink">{props.pending.text}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={quiet} disabled={busy} onClick={close}>
          Cancelar
        </button>
        <button type="button" className={danger} disabled={busy} onClick={() => void confirm()}>
          {busy ? (props.pending.busy ?? "Apagando…") : props.pending.confirm}
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-small font-medium text-alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

/** A purchase situation; once something was chosen or the day passed, "did it work?" in one tap. */
function SituationItem(props: { situation: PurchaseSituation; onChange: () => void; onOpen: (sessionId: string) => void }) {
  const { situation } = props;
  const [busy, setBusy] = useState(false);
  const record = (verdict: SituationOutcomeVerdict) => {
    setBusy(true);
    void api
      .recordOutcome(situation.id, verdict)
      .then(() => {
        track("situation_outcome_recorded", { verdict });
        props.onChange();
      })
      .finally(() => setBusy(false));
  };
  return (
    <li className="flex flex-col gap-2 text-small text-ink">
      <button
        type="button"
        onClick={() => props.onOpen(situation.sessionId)}
        className="min-h-11 text-start underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {episodeLine(situation)}
      </button>
      {canRecordOutcome(situation, todayInBrazil()) ? (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Funcionou?</legend>
          {(Object.entries(OUTCOME_LABELS) as [SituationOutcomeVerdict, string][]).map(([verdict, label]) => (
            <button key={verdict} type="button" className={quiet} disabled={busy} onClick={() => record(verdict)}>
              {label}
            </button>
          ))}
        </fieldset>
      ) : null}
    </li>
  );
}

export function ProfileBody(props: {
  /** The session ended or the person left: the chat goes back to the sign-in. */
  onSignedOut: () => void;
  /** "Rever o tour": the drawer closes and the tour opens. */
  onTour: () => void;
  /** "Responder perguntas rápidas": the welcome conversation starts in the chat. */
  onWelcome: () => void;
  /** An occasion: the chat goes to its conversation. */
  onOpen: (sessionId: string) => void;
}) {
  const close = useSheetClose();
  // The last copy draws at once; the fresh one replaces it.
  const [me, setMe] = useState<Me | null>(() => peek<Me>("me") ?? null);
  const [memories, setMemories] = useState<Memory[]>(() => peek<Memory[]>("memories") ?? []);
  const [situations, setSituations] = useState<PurchaseSituation[]>(() => peek<PurchaseSituation[]>("situations") ?? []);
  const [state, setState] = useState<"loading" | "ready" | "error">(() => (peek("me") && peek("memories") ? "ready" : "loading"));
  const [pending, setPending] = useState<Pending>(null);
  const [newFact, setNewFact] = useState("");
  const [adding, setAdding] = useState(false);
  // Each answer next to the control that asked for it: the note's under its field, the file's under "Seus dados".
  const [factNotice, setFactNotice] = useState<string | null>(null);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
  const factField = useRef<HTMLInputElement>(null);
  // Each change of `round` loads everything again (after deleting a note, retrying).
  const [round, setRound] = useState(0);
  const load = () => setRound((value) => value + 1);
  const { onSignedOut } = props;
  useEffect(() => {
    let live = true;
    Promise.all([api.me(), api.memories(), api.situations().catch(() => [])])
      .then(([person, notes, occasions]) => {
        if (!live) return;
        setMe(person);
        setMemories(notes);
        setSituations(occasions);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!live) return;
        if (error instanceof ApiError && error.status === 401) onSignedOut();
        else setState("error");
      });
    return () => {
      live = false;
    };
  }, [round, onSignedOut]);

  if (state === "loading")
    return (
      <p role="status" className="text-small text-graphite">
        Carregando…
      </p>
    );
  if (state === "error" || !me)
    return (
      <div className="flex flex-col gap-3">
        <p role="alert" className="text-body text-ink">
          Não consegui abrir o seu perfil agora.
        </p>
        <button type="button" className={`${quiet} self-start`} onClick={load}>
          Tentar de novo
        </button>
      </div>
    );

  /** Something the person tells the tone about themselves. "já tenho: X" goes to the light wardrobe. */
  const addFact = async (event: FormEvent) => {
    event.preventDefault();
    const text = newFact.trim();
    if (adding) return;
    if (!text) {
      factField.current?.focus();
      return;
    }
    setAdding(true);
    setFactNotice(null);
    try {
      const owned = /^(j[aá] )?tenho:?\s+(.+)$/i.exec(text);
      if (owned?.[2]) {
        await api.addMemory(`${OWNED_CATEGORY}.${Date.now().toString(36)}`, owned[2].trim().slice(0, 200), OWNED_CATEGORY);
        track("memory_added", { kind: "owned" });
      } else {
        const [rawKey, ...rest] = text.split(":");
        const key = (rest.length ? (rawKey ?? "nota") : `nota.${Date.now().toString(36)}`).trim().slice(0, 60) || "nota";
        await api.addMemory(key, (rest.length ? rest.join(":").trim() : text).slice(0, 200), "geral");
        track("memory_added", { kind: rest.length ? "key_value" : "note" });
      }
      setNewFact("");
      setFactNotice("Anotei.");
      load();
    } catch (failure) {
      setFactNotice(failure instanceof ApiError ? failure.message : "Não consegui anotar agora. Tente de novo.");
    } finally {
      setAdding(false);
    }
  };

  const exportData = async () => {
    setDataNotice(null);
    try {
      const data = await api.exportData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "meus-dados-tone.json";
      link.click();
      URL.revokeObjectURL(url);
      track("data_exported");
    } catch (failure) {
      setDataNotice(failure instanceof ApiError ? failure.message : "Não consegui preparar o arquivo agora. Tente de novo.");
    }
  };

  const owned = memories.filter((memory) => memory.category === OWNED_CATEGORY);
  const rest = memories.filter((memory) => memory.category !== OWNED_CATEGORY);
  return (
    <>
      <div className="flex flex-col gap-10 pb-2">
        <header className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-13 shrink-0 place-items-center rounded-full bg-ink text-subheading text-on-ink" data-ph-mask>
            {initialOf(me.name)}
          </span>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-body font-medium text-ink" data-ph-mask>
              {me.name}
            </p>
            <p className="truncate text-small text-graphite" data-ph-mask>
              {me.email}
            </p>
          </div>
        </header>

        <section aria-labelledby="titulo-memoria" className="flex flex-col gap-3">
          <h3 id="titulo-memoria" className="text-subheading text-ink">
            O que eu sei sobre você
          </h3>
          <p className="text-small text-graphite">
            Tudo o que uso para te ajudar está aqui. Confirme o que for palpite e apague o que não quiser.
          </p>
          {memories.length === 0 ? (
            <p className="text-small text-graphite">Nada ainda. Me conte algo abaixo e eu vou anotando.</p>
          ) : (
            <>
              <MemoryList memories={rest} onChange={load} />
              {owned.length ? (
                <>
                  <h4 className="mt-2 text-ui text-ink">Você já tem</h4>
                  <MemoryList memories={owned} onChange={load} />
                </>
              ) : null}
            </>
          )}
          <form className="flex flex-col gap-2" onSubmit={addFact}>
            <label htmlFor="novo-fato" className="text-ui text-ink">
              Quer me contar algo?
            </label>
            <p id="novo-fato-dica" className="text-small text-graphite">
              Um fato por vez, como “tamanho de tênis: 40” ou “já tenho: sandália dourada”.
            </p>
            <div className="flex items-center gap-2">
              <input
                ref={factField}
                id="novo-fato"
                type="text"
                maxLength={200}
                value={newFact}
                onChange={(event) => setNewFact(event.target.value)}
                aria-describedby="novo-fato-dica"
                placeholder="tamanho de tênis: 40"
                className={`${field} min-w-0 flex-1`}
              />
              <button type="submit" className={`${quiet} shrink-0`} disabled={adding}>
                {adding ? "Anotando…" : "Anotar"}
              </button>
            </div>
            <p role="status" className="text-small text-graphite empty:hidden">
              {factNotice}
            </p>
          </form>
          <div className="flex flex-col gap-2">
            <p className="text-small text-graphite">Ou responda cinco perguntas rápidas, uma por vez, e eu anoto.</p>
            <div>
              <button
                type="button"
                className={quiet}
                onClick={() => {
                  track("welcome_chat_started", { from: "profile", memories: memories.length });
                  props.onWelcome();
                  close();
                }}
              >
                Responder perguntas rápidas
              </button>
            </div>
          </div>
        </section>

        {situations.length > 0 ? (
          <section aria-labelledby="titulo-ocasioes" className="flex flex-col gap-3">
            <h3 id="titulo-ocasioes" className="text-subheading text-ink">
              Ocasiões
            </h3>
            <p className="text-small text-graphite">Conte como foi cada uma: assim eu aprendo o que funciona para você.</p>
            <ul className="flex flex-col gap-3" data-ph-mask>
              {situations.map((situation) => (
                <SituationItem
                  key={situation.id}
                  situation={situation}
                  onChange={load}
                  onOpen={(sessionId) => {
                    props.onOpen(sessionId);
                    close();
                  }}
                />
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="titulo-conexoes" className="flex flex-col gap-3">
          <h3 id="titulo-conexoes" className="text-subheading text-ink">
            Conexões
          </h3>
          <p className="text-small text-graphite">
            Opcional. Conecte para eu conhecer melhor o que você compra e quando precisa. Você desconecta quando quiser.
          </p>
          <Connections ask={setPending} />
        </section>

        <section aria-labelledby="titulo-dados" className="flex flex-col gap-3">
          <h3 id="titulo-dados" className="text-subheading text-ink">
            Seus dados
          </h3>
          <p className="text-small text-graphite">
            Baixe ou apague o que eu guardei, quando quiser. O que for apagado não volta.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={quiet} onClick={() => void exportData()}>
              Baixar meus dados
            </button>
            <button
              type="button"
              className={danger}
              onClick={() =>
                setPending({
                  title: "Apagar o que sei sobre você?",
                  text: "As anotações somem. As conversas continuam, até você apagar a conta.",
                  confirm: "Apagar anotações",
                  run: async () => {
                    await api.deleteAllMemories();
                    track("memories_cleared", { count: memories.length });
                    load();
                  },
                })
              }
            >
              Apagar o que sei sobre você
            </button>
          </div>
          <p role="status" className="text-small text-graphite empty:hidden">
            {dataNotice}
          </p>
        </section>

        <section aria-labelledby="titulo-conta" className="flex flex-col gap-3">
          <h3 id="titulo-conta" className="text-subheading text-ink">
            Sua conta
          </h3>
          <AccessSessions ask={setPending} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={quiet}
              onClick={() => {
                props.onTour();
                close();
              }}
            >
              Rever o tour
            </button>
            <button type="button" className={quiet} onClick={() => void api.logout().finally(onSignedOut)}>
              Sair
            </button>
          </div>
        </section>

        <section aria-labelledby="titulo-apagar-conta" className="flex flex-col gap-3">
          <h3 id="titulo-apagar-conta" className="text-subheading text-ink">
            Apagar a conta
          </h3>
          <p className="text-small text-graphite">Apaga conversas, anotações, conexões e eventos. Não dá para desfazer.</p>
          <div>
            <button
              type="button"
              className={danger}
              onClick={() =>
                setPending({
                  title: "Apagar sua conta?",
                  text: "Apago conversas, anotações, conexões e eventos. Não dá para desfazer.",
                  confirm: "Apagar minha conta",
                  run: async () => {
                    track("account_deleted");
                    await api.deleteAccount();
                    onSignedOut();
                  },
                })
              }
            >
              Apagar minha conta
            </button>
          </div>
        </section>
      </div>
      {pending ? (
        <Sheet title={pending.title} onClose={() => setPending(null)}>
          <Confirm pending={pending} />
        </Sheet>
      ) : null}
    </>
  );
}

/** The profile, opened from the avatar: a drawer at the trailing edge, a folha on a phone. */
export function ProfileSheet(props: Parameters<typeof ProfileBody>[0] & { onClose: () => void; aside?: ReactNode }) {
  const { onClose, aside, ...body } = props;
  return (
    <Sheet title="Seu perfil" placement="side" closeButton aside={aside} onClose={onClose}>
      <ProfileBody {...body} />
    </Sheet>
  );
}
