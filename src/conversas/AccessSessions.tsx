"use client";
// The places where the person is signed in, on the profile: the current one is marked, the others
// can be ended after a confirmation. Ending the current one is the "Sair" button, not this list.
import { useEffect, useState } from "react";
import type { AccessSession } from "@/tone/shared";
import { api } from "./api";

const quiet =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const danger =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-alert shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

type Ask = {
  title: string;
  text: string;
  confirm: string;
  busy?: string;
  run: () => Promise<void>;
};

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

/** What the person recognizes: when it started and when it was last used. */
const describe = (session: AccessSession) =>
  `Entrou em ${day(session.createdAt)}${session.lastUsedAt ? ` · usada em ${day(session.lastUsedAt)}` : ""}`;

export const withoutSession = (list: AccessSession[], id: string) =>
  list.filter((entry) => entry.id !== id);

export const endSession = (id: string) => api.endAccessSession(id);

export function AccessSessionsView(props: {
  sessions: AccessSession[];
  onEnd: (session: AccessSession) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {props.sessions.map((session) => (
        <li
          key={session.id}
          className="flex flex-wrap items-center justify-between gap-2"
        >
          <div className="min-w-0 flex-1">
            <p className="text-ui text-ink">
              {session.current ? "Este aparelho" : "Outro aparelho"}
            </p>
            <p className="text-small text-graphite">{describe(session)}</p>
          </div>
          {session.current ? null : (
            <button
              type="button"
              className={danger}
              onClick={() => props.onEnd(session)}
            >
              Encerrar
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Always mounted, so the readers announce the text that arrives after the load fails. */
export function SessionsStatus(props: {
  failed: boolean;
  onRetry: () => void;
}) {
  return (
    <div role="status" className="flex flex-wrap items-center gap-2">
      {props.failed ? (
        <>
          <p className="text-small text-graphite">
            Não deu para carregar as sessões.
          </p>
          <button type="button" className={quiet} onClick={props.onRetry}>
            Tentar de novo
          </button>
        </>
      ) : null}
    </div>
  );
}

export function AccessSessions(props: { ask: (pending: Ask) => void }) {
  const [sessions, setSessions] = useState<AccessSession[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let live = true;
    api
      .accessSessions()
      .then((list) => {
        if (!live) return;
        setSessions(list);
        setFailed(false);
      })
      .catch((error: unknown) => {
        console.error("access sessions", error);
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [round]);

  // A single session (this one) has nothing to end.
  const listed = sessions && sessions.length >= 2 ? sessions : null;
  return (
    <div className="flex flex-col gap-2">
      <SessionsStatus
        failed={failed && !listed}
        onRetry={() => {
          setFailed(false);
          setRound((value) => value + 1);
        }}
      />
      {listed ? (
        <h3 className="mt-2 text-ui text-ink">Onde você está conectado</h3>
      ) : null}
      {listed ? (
        <AccessSessionsView
          sessions={listed}
          onEnd={(session) =>
            props.ask({
              title: "Encerrar esta sessão?",
              text: "Quem estiver usando esse aparelho precisa entrar de novo.",
              confirm: "Encerrar sessão",
              busy: "Encerrando…",
              run: async () => {
                await endSession(session.id);
                setSessions((list) => withoutSession(list ?? [], session.id));
              },
            })
          }
        />
      ) : null}
    </div>
  );
}
