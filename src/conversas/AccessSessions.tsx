"use client";
// The places where the person is signed in, on the profile: the current one is marked, the others
// can be ended after a confirmation. Ending the current one is the "Sair" button, not this list.
import { useEffect, useState } from "react";
import type { AccessSession } from "@/tone/shared";
import { api } from "./api";
import { outlineButton } from "./ui";

const quiet = outlineButton;
/** Other places shown before "Ver todos": a long list of identical rows buried the rest of the profile. */
const FIRST_OTHERS = 3;

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
  `Entrou em ${day(session.createdAt)}${session.lastUsedAt ? ` · último uso em ${day(session.lastUsedAt)}` : ""}`;

export const withoutSession = (list: AccessSession[], id: string) =>
  list.filter((entry) => entry.id !== id);

export const endSession = (id: string) => api.endAccessSession(id);

export function AccessSessionsView(props: {
  sessions: AccessSession[];
  onEnd: (session: AccessSession) => void;
}) {
  const [all, setAll] = useState(false);
  // This device first, then the others; the red is kept for the confirmation, not for every row.
  const ordered = [...props.sessions].sort((a, b) => Number(b.current) - Number(a.current));
  const others = ordered.filter((session) => !session.current).length;
  const shown = all ? ordered : ordered.slice(0, ordered.length - others + FIRST_OTHERS);
  return (
    <>
      <ul className="flex flex-col divide-y divide-rule rounded-panel bg-surface px-4 shadow-raised">
        {shown.map((session) => (
          <li key={session.id} className="flex min-h-15 flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-ui text-ink">{session.current ? "Este aparelho" : "Outro aparelho"}</p>
              <p className="text-small text-graphite tabular-nums">{describe(session)}</p>
            </div>
            {session.current ? null : (
              <button type="button" className={`${quiet} px-4`} onClick={() => props.onEnd(session)}>
                Encerrar
              </button>
            )}
          </li>
        ))}
      </ul>
      {others > FIRST_OTHERS ? (
        <button
          type="button"
          aria-expanded={all}
          className="min-h-11 self-start text-ui text-ink underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          onClick={() => setAll((value) => !value)}
        >
          {all ? "Mostrar menos" : `Ver todos os ${others} outros aparelhos`}
        </button>
      ) : null}
    </>
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
        <h4 className="text-ui text-ink">Onde sua conta está aberta</h4>
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
