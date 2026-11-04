"use client";
// The person's own page on the web: who they are, what the tone knows about
// them, and the keys to their data. The same account as the extension.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { type Me, type Memory, memoryLabel, OWNED_CATEGORY } from "@/tone/shared";
import { ToneWordmark } from "@/components/tone-logo";
import { track } from "./analytics";
import { ApiError, api, peek } from "./api";
import { Sheet, useSheetClose } from "./Sheet";
import { Shell } from "./Shell";
import { SignIn } from "./SignIn";
import { startWelcomeChat } from "./welcome";

const quiet =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const danger =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-alert shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const small =
  "press min-h-11 rounded-full px-3 text-caption text-graphite focus-visible:outline-2 focus-visible:outline-ink";

/** What a destructive button asks for before it runs. */
type Pending = { title: string; text: string; confirm: string; run: () => Promise<void> } | null;

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
          {busy ? "Apagando…" : props.pending.confirm}
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

export function Profile() {
  // Coming back from another screen, the last copy draws at once; the fresh one replaces it.
  const [me, setMe] = useState<Me | null>(() => peek<Me>("me") ?? null);
  const [memories, setMemories] = useState<Memory[]>(() => peek<Memory[]>("memories") ?? []);
  const [state, setState] = useState<"loading" | "ready" | "signed_out" | "expired" | "error">(() =>
    peek("me") && peek("memories") ? "ready" : "loading",
  );
  const [pending, setPending] = useState<Pending>(null);
  const [newFact, setNewFact] = useState("");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();
  const [openingWelcome, setOpeningWelcome] = useState(false);
  // Each change of `round` loads everything again (after signing in, deleting a note, retrying).
  const [round, setRound] = useState(0);
  const load = () => setRound((value) => value + 1);
  useEffect(() => {
    let live = true;
    Promise.all([api.me(), api.memories()])
      .then(([person, notes]) => {
        if (!live) return;
        setMe(person);
        setMemories(notes);
        setState("ready");
      })
      .catch((error: unknown) => {
        if (!live) return;
        setState((current) =>
          error instanceof ApiError && error.status === 401 ? (current === "ready" ? "expired" : "signed_out") : "error",
        );
      });
    return () => {
      live = false;
    };
  }, [round]);

  if (state === "loading") return <p className="px-5 py-12 text-small text-graphite">Carregando…</p>;
  if (state === "signed_out" || state === "expired") return <SignIn expired={state === "expired"} onDone={load} />;
  if (state === "error" || !me)
    return (
      <main id="conteudo" className="mx-auto max-w-md px-5 py-12">
        <p role="alert" className="text-body text-ink">
          Não consegui abrir o seu perfil agora.
        </p>
        <button type="button" className={`${quiet} mt-4`} onClick={load}>
          Tentar de novo
        </button>
      </main>
    );

  /** Something the person tells the tone about themselves. "já tenho: X" goes to the light wardrobe. */
  const addFact = async (event: FormEvent) => {
    event.preventDefault();
    const text = newFact.trim();
    if (!text || adding) return;
    setAdding(true);
    setNotice(null);
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
      setNotice("Anotei.");
      load();
    } catch (failure) {
      setNotice(failure instanceof ApiError ? failure.message : "Não consegui anotar agora.");
    } finally {
      setAdding(false);
    }
  };

  const welcome = async () => {
    setOpeningWelcome(true);
    setNotice(null);
    try {
      const href = await startWelcomeChat();
      track("welcome_chat_started", { from: "profile", memories: memories.length });
      router.push(href);
    } catch (failure) {
      setNotice(failure instanceof ApiError ? failure.message : "Não consegui abrir a conversa agora.");
      setOpeningWelcome(false);
    }
  };

  const exportData = async () => {
    setNotice(null);
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
      setNotice(failure instanceof ApiError ? failure.message : "Não consegui preparar o arquivo agora.");
    }
  };

  const owned = memories.filter((memory) => memory.category === OWNED_CATEGORY);
  const rest = memories.filter((memory) => memory.category !== OWNED_CATEGORY);
  return (
    <Shell me={me} current="perfil">
      <main id="conteudo" className="flex flex-col gap-8 py-4">
        <header className="flex flex-col gap-2">
          <ToneWordmark className="h-6 w-auto text-ink" />
          <h1 className="mt-2 display-sm font-display text-ink">Meu perfil</h1>
          <p className="text-body text-ink" data-ph-mask>
            {me.name}
          </p>
          <p className="text-small text-graphite" data-ph-mask>
            {me.email}
          </p>
        </header>

        <section aria-labelledby="titulo-memoria" className="flex flex-col gap-3">
          <h2 id="titulo-memoria" className="text-subheading text-ink">
            O que eu sei sobre você
          </h2>
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
                  <h3 className="mt-2 text-ui text-ink">Você já tem</h3>
                  <MemoryList memories={owned} onChange={load} />
                </>
              ) : null}
            </>
          )}
          <form className="flex flex-col gap-2" onSubmit={addFact}>
            <label htmlFor="novo-fato" className="text-ui text-ink">
              Quer me contar algo?
            </label>
            <div className="flex items-center gap-2">
              <input
                id="novo-fato"
                type="text"
                maxLength={200}
                value={newFact}
                onChange={(event) => setNewFact(event.target.value)}
                placeholder="ex.: tamanho de tênis: 40 · já tenho sandália dourada"
                className="min-h-11 flex-1 rounded-input bg-paper px-4 text-body text-ink focus-visible:outline-2 focus-visible:outline-ink"
              />
              <button type="submit" className={quiet} disabled={adding || !newFact.trim()} aria-label="Anotar">
                {adding ? "Anotando…" : "Anotar"}
              </button>
            </div>
          </form>
          <div className="flex flex-col gap-2">
            <p className="text-small text-graphite">Ou responda cinco perguntas rápidas, uma por vez, e eu anoto.</p>
            <div>
              <button type="button" className={quiet} disabled={openingWelcome} onClick={() => void welcome()}>
                {openingWelcome ? "Abrindo…" : "Responder perguntas rápidas"}
              </button>
            </div>
          </div>
        </section>

        <section aria-labelledby="titulo-dados" className="flex flex-col gap-3">
          <h2 id="titulo-dados" className="text-subheading text-ink">
            Seus dados
          </h2>
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
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/conversas?tour=1" className={`${quiet} inline-flex items-center`}>
              Rever o tour
            </Link>
            <button
              type="button"
              className={quiet}
              onClick={() => void api.logout().finally(() => setState("signed_out"))}
            >
              Sair
            </button>
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
                    setState("signed_out");
                  },
                })
              }
            >
              Apagar minha conta
            </button>
          </div>
          {notice ? (
            <p role="status" className="text-small text-graphite">
              {notice}
            </p>
          ) : null}
        </section>
      </main>
      {pending ? (
        <Sheet title={pending.title} onClose={() => setPending(null)}>
          <Confirm pending={pending} />
        </Sheet>
      ) : null}
    </Shell>
  );
}
