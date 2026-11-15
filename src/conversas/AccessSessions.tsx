"use client";
// The places where the person is signed in, on the profile: the current one is marked, the others
// can be ended after a confirmation. Ending the current one is the "Sair" button, not this list.
import { useEffect, useState } from "react";
import type { AccessSession } from "@/tone/shared";
import { api } from "./api";

const danger =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-alert shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

type Ask = {
  title: string;
  text: string;
  confirm: string;
  busy?: string;
  run: () => Promise<void>;
};

const day = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

/** What the person recognizes: when it started and when it was last used. */
const describe = (session: AccessSession) =>
  `Entrou em ${day(session.createdAt)}${session.lastUsedAt ? ` · usada em ${day(session.lastUsedAt)}` : ""}`;

export const withoutSession = (list: AccessSession[], id: string) => list.filter((entry) => entry.id !== id);

export const endSession = (id: string) => api.endAccessSession(id);

export function AccessSessionsView(props: {
  sessions: AccessSession[];
  /** The session with a call in flight. */
  busy: string | null;
  onEnd: (session: AccessSession) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {props.sessions.map((session) => (
        <li key={session.id} className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-ui text-ink">{session.current ? "Este aparelho" : "Outro aparelho"}</p>
            <p className="text-small text-graphite">{describe(session)}</p>
          </div>
          {session.current ? null : (
            <button
              type="button"
              className={danger}
              disabled={props.busy === session.id}
              onClick={() => props.onEnd(session)}
            >
              {props.busy === session.id ? "Encerrando…" : "Encerrar"}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function AccessSessions(props: { ask: (pending: Ask) => void }) {
  const [sessions, setSessions] = useState<AccessSession[] | null>(null);

  useEffect(() => {
    let live = true;
    api
      .accessSessions()
      .then((list) => {
        if (live) setSessions(list);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  // Nothing to show until the list arrives, and a single session (this one) has nothing to end.
  if (!sessions || sessions.length < 2) return null;
  return (
    <div className="flex flex-col gap-2">
      <h3 className="mt-2 text-ui text-ink">Onde você está conectado</h3>
      <AccessSessionsView
        sessions={sessions}
        busy={null}
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
    </div>
  );
}
