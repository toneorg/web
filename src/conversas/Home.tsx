"use client";
// T06: the person's start page on the web: conversations of the same account
// (from the web or the extension), what the tone remembers, the balance and
// what the extension adds.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LinkCodeCreated, Me, Memory, SessionSummary } from "@/tone/shared";
import { ApiError, api } from "./api";
import { SignIn } from "./SignIn";

const primary =
  "min-h-11 rounded-full bg-ink px-5 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quiet =
  "min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const usd = (value: number) =>
  `US$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;
const when = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function Home() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "signed_out" | "expired" | "error">("loading");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [code, setCode] = useState<LinkCodeCreated | null>(null);
  const [starting, setStarting] = useState(false);
  // Each change of `round` loads everything again (after signing in, deleting a memory, retrying).
  const [round, setRound] = useState(0);
  const load = () => setRound((value) => value + 1);
  useEffect(() => {
    let live = true;
    Promise.all([api.me(), api.sessions(), api.memories()])
      .then(([person, list, notes]) => {
        if (!live) return;
        setMe(person);
        setSessions(list);
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
  const start = async () => {
    setStarting(true);
    try {
      const { sessionId } = await api.newSession();
      router.push(`/conversas/${sessionId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setState("expired");
      setStarting(false);
    }
  };
  return (
    <main id="conteudo" className="mx-auto grid w-full max-w-5xl gap-8 px-5 py-10 md:grid-cols-[2fr_1fr]">
      <section className="flex flex-col gap-4" aria-labelledby="titulo-conversas">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 id="titulo-conversas" className="display-sm font-display text-ink">
            Suas conversas
          </h1>
          <button type="button" className={primary} disabled={starting} onClick={() => void start()}>
            {starting ? "Abrindo…" : "Nova conversa"}
          </button>
        </div>
        {sessions.length === 0 ? (
          <p className="text-body text-graphite">
            Nenhuma conversa ainda. Comece uma nova: eu pesquiso nas lojas pelo servidor, mesmo sem a extensão aberta.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/conversas/${session.id}`}
                  className="flex flex-col gap-1 rounded-panel bg-surface p-4 shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="text-body text-ink">{session.onboarding ? "Primeira conversa" : session.title}</span>
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
      <aside className="flex flex-col gap-6">
        <section aria-labelledby="titulo-memoria" className="flex flex-col gap-2">
          <h2 id="titulo-memoria" className="text-subheading text-ink">
            O que eu sei sobre você
          </h2>
          {memories.length === 0 ? (
            <p className="text-small text-graphite">Nada ainda. Converse comigo e eu vou anotando.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {memories.map((memory) => (
                <li key={memory.id} className="flex items-center justify-between gap-2 text-small text-ink">
                  <span>
                    {memory.key.replace(/[._]/g, " ")}: {memory.value}
                  </span>
                  <button
                    type="button"
                    className="min-h-11 rounded-full px-3 text-caption text-graphite focus-visible:outline-2 focus-visible:outline-ink"
                    aria-label={`Apagar ${memory.key}`}
                    onClick={() => void api.deleteMemory(memory.id).then(load)}
                  >
                    Apagar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        {me.budget ? (
          <section aria-labelledby="titulo-saldo" className="flex flex-col gap-1">
            <h2 id="titulo-saldo" className="text-subheading text-ink">
              Saldo dos últimos sete dias
            </h2>
            <p className="text-small text-graphite">
              Disponível: {usd(me.budget.availableUsd)} de {usd(me.budget.weeklyCapUsd)}. É o mesmo saldo da extensão.
            </p>
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
          <button type="button" className={quiet} onClick={() => void api.linkCode().then(setCode)}>
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
          className={`${quiet} self-start`}
          onClick={() => void api.logout().finally(() => setState("signed_out"))}
        >
          Sair desta web
        </button>
      </aside>
    </main>
  );
}
