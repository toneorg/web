"use client";
// T06: the person's start page on the web: conversations of the same account
// (from the web or the extension), what the tone remembers, the balance and
// what the extension adds.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import posthog from "posthog-js";
import {
  canRecordOutcome,
  episodeLine,
  type LinkCodeCreated,
  type Me,
  type Memory,
  OUTCOME_LABELS,
  OWNED_CATEGORY,
  type PurchaseSituation,
  type SessionSummary,
  type SituationOutcomeVerdict,
  todayInBrazil,
} from "@/tone/shared";
import { ApiError, api } from "./api";
import { Shell } from "./Shell";
import { SignIn } from "./SignIn";

const primary =
  "min-h-11 rounded-full bg-ink px-5 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quiet =
  "min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const when = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const small =
  "min-h-11 rounded-full px-3 text-caption text-graphite focus-visible:outline-2 focus-visible:outline-ink";

/** What the tone remembers: hypotheses can be confirmed, everything can be deleted. */
function MemoryList(props: { memories: Memory[]; onChange: () => void }) {
  return (
    <ul className="flex flex-col gap-1" data-ph-mask>
      {props.memories.map((memory) => (
        <li key={memory.id} className="flex items-center justify-between gap-2 text-small text-ink">
          <span>
            {memory.category === OWNED_CATEGORY ? memory.value : `${memory.key.replace(/[._]/g, " ")}: ${memory.value}`}
            {memory.condition ? <span className="text-graphite"> · quando: {memory.condition}</span> : null}
            {memory.inferred ? <span className="text-graphite"> · palpite da tone</span> : null}
          </span>
          <span className="flex shrink-0">
            {memory.inferred ? (
              <button
                type="button"
                className={small}
                aria-label={`Confirmar ${memory.key}`}
                onClick={() =>
                  void api.confirmMemory(memory.id).then(() => {
                    posthog.capture("memory_confirmed");
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
              aria-label={`Apagar ${memory.key}`}
              onClick={() =>
                void api.deleteMemory(memory.id).then(() => {
                  posthog.capture("memory_deleted");
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

/** A purchase situation; once something was chosen or the day passed, "did it work?" in one tap. */
function SituationItem(props: { situation: PurchaseSituation; onChange: () => void }) {
  const { situation } = props;
  const [busy, setBusy] = useState(false);
  const record = (verdict: SituationOutcomeVerdict) => {
    setBusy(true);
    void api
      .recordOutcome(situation.id, verdict)
      .then(() => {
        posthog.capture("situation_outcome_recorded", { verdict });
        props.onChange();
      })
      .finally(() => setBusy(false));
  };
  return (
    <li className="flex flex-col gap-1 text-small text-ink">
      <Link
        href={`/conversas/${situation.sessionId}`}
        className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {episodeLine(situation)}
      </Link>
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

export function Home() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "signed_out" | "expired" | "error">("loading");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [situations, setSituations] = useState<PurchaseSituation[]>([]);
  const [code, setCode] = useState<LinkCodeCreated | null>(null);
  const [starting, setStarting] = useState(false);
  const [ask, setAsk] = useState("");
  // Each change of `round` loads everything again (after signing in, deleting a memory, retrying).
  const [round, setRound] = useState(0);
  const load = () => setRound((value) => value + 1);
  useEffect(() => {
    let live = true;
    Promise.all([api.me(), api.sessions(), api.memories(), api.situations().catch(() => [])])
      .then(([person, list, notes, occasions]) => {
        if (!live) return;
        setMe(person);
        setSessions(list);
        setMemories(notes);
        setSituations(occasions);
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
  if (state === "signed_out" || state === "expired")
    return <SignIn expired={state === "expired"} onDone={load} />;
  if (state === "error" || !me)
    return (
      <main id="conteudo" className="mx-auto max-w-md px-5 py-12">
        <p role="alert" className="text-body text-ink">
          Não consegui falar com a tone agora.
        </p>
        <button type="button" className={`${quiet} mt-4`} onClick={load}>
          Tentar de novo
        </button>
      </main>
    );
  // T16: the first message goes along with the new conversation, which sends it once it opens.
  const start = async (first = "") => {
    setStarting(true);
    try {
      const { sessionId } = await api.newSession();
      const text = first.trim();
      posthog.capture("conversation_started", { has_initial_query: Boolean(text) });
      router.push(`/conversas/${sessionId}${text ? `?primeira=${encodeURIComponent(text.slice(0, 4000))}` : ""}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setState("expired");
      setStarting(false);
    }
  };
  return (
    <Shell me={me} current="conversas">
    <main id="conteudo" className="flex flex-col gap-8 py-4">
      <form
        className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-raised"
        onSubmit={(event) => {
          event.preventDefault();
          void start(ask);
        }}
      >
        <label htmlFor="pedido" className="display-sm font-display text-ink">
          O que você procura?
        </label>
        <textarea
          id="pedido"
          rows={2}
          maxLength={4000}
          value={ask}
          onChange={(event) => setAsk(event.target.value)}
          placeholder="Ex.: um perfume amadeirado até R$ 600, ou o menor preço do fone que eu vi"
          className="min-h-13 resize-none rounded-input bg-paper px-4 py-3 text-body text-ink focus-visible:outline-2 focus-visible:outline-ink"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-caption text-graphite">
            Eu pesquiso pelo servidor{me.remoteStores?.length ? " e navego nas lojas por um navegador remoto" : ""}, sem abrir
            abas no seu computador.
          </p>
          <button type="submit" className={primary} disabled={starting || !ask.trim()}>
            {starting ? "Abrindo…" : "Pesquisar"}
          </button>
        </div>
      </form>
      <section className="flex flex-col gap-4" aria-labelledby="titulo-conversas">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 id="titulo-conversas" className="text-subheading text-ink">
            Suas conversas
          </h1>
          <button type="button" className={quiet} disabled={starting} onClick={() => void start()}>
            Nova conversa
          </button>
        </div>
        {sessions.length === 0 ? (
          <p className="text-body text-graphite">
            Nenhuma conversa ainda. Comece uma nova: eu pesquiso nas lojas pelo servidor, sem abrir abas, mesmo com a
            extensão fechada.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/conversas/${session.id}`}
                  className="flex flex-col gap-1 rounded-panel bg-surface p-4 shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="text-body text-ink" data-ph-mask>
                    {session.onboarding ? "Primeira conversa" : session.title}
                  </span>
                  <span className="text-caption text-graphite">
                    {when(session.lastAt)} · {session.messages} {session.messages === 1 ? "mensagem" : "mensagens"} ·{" "}
                    {session.surface === "web" ? "começou na web" : "começou na extensão"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="titulo-memoria" className="flex flex-col gap-2">
          <h2 id="titulo-memoria" className="text-subheading text-ink">
            O que eu sei sobre você
          </h2>
          {memories.length === 0 ? (
            <p className="text-small text-graphite">Nada ainda. Converse comigo e eu vou anotando.</p>
          ) : (
            <>
              <MemoryList memories={memories.filter((m) => m.category !== OWNED_CATEGORY)} onChange={load} />
              {memories.some((m) => m.category === OWNED_CATEGORY) ? (
                <>
                  <h3 className="mt-2 text-ui text-ink">Você já tem</h3>
                  <MemoryList memories={memories.filter((m) => m.category === OWNED_CATEGORY)} onChange={load} />
                </>
              ) : null}
            </>
          )}
        </section>
        {situations.length > 0 ? (
          <section aria-labelledby="titulo-ocasioes" className="flex flex-col gap-2">
            <h2 id="titulo-ocasioes" className="text-subheading text-ink">
              Ocasiões
            </h2>
            <p className="text-small text-graphite">
              O que você estava tentando resolver em cada conversa. Contar como foi me ensina o que funciona para você.
            </p>
            <ul className="flex flex-col gap-2" data-ph-mask>
              {situations.map((situation) => (
                <SituationItem key={situation.id} situation={situation} onChange={load} />
              ))}
            </ul>
          </section>
        ) : null}
        <section aria-labelledby="titulo-extensao" className="flex flex-col gap-2">
          <h2 id="titulo-extensao" className="text-subheading text-ink">
            Extensão no Chrome
          </h2>
          <p className="text-small text-graphite">
            Aqui eu pesquiso pelo servidor, mesmo com o Chrome fechado. Ler a página de uma loja, escolher variação ou pôr no
            carrinho continua na extensão, com o Chrome aberto.
          </p>
          <button type="button" className={quiet} onClick={() => void api.linkCode().then((nextCode) => {
            setCode(nextCode);
            posthog.capture("extension_link_code_generated");
          })}>
            Gerar código para a extensão
          </button>
          {code ? (
            <p className="text-small text-ink" aria-live="polite">
              Código: <strong className="tabular-nums">{code.code}</strong>. Na extensão, toque em “Já tenho conta na tone”.
              Vale até {new Date(code.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
            </p>
          ) : null}
        </section>
        <button
          type="button"
          className={`${quiet} justify-self-start`}
          onClick={() => void api.logout().finally(() => setState("signed_out"))}
        >
          Sair desta web
        </button>
      </div>
    </main>
    </Shell>
  );
}
