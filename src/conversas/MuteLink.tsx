"use client";
// T11: where the "stop these e-mails" link of a watch notice leads. Opening the
// page changes nothing (mail scanners open links); the person confirms with a
// click, and the signed token in the link is the only credential.
import Link from "next/link";
import { useState } from "react";
import { api } from "./api";

type State = "idle" | "busy" | "done" | "failed";

export function MuteLink(props: { token: string | null }) {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const token = props.token;
  if (!token)
    return (
      <p className="text-ui text-graphite">
        Este link está incompleto. Silencie o acompanhamento pela{" "}
        <Link href="/conversas" className="text-ink underline underline-offset-2">
          central de acompanhamentos
        </Link>
        .
      </p>
    );
  if (state === "done")
    return (
      <div className="flex flex-col gap-3" role="status">
        <p className="text-ui text-ink">Pronto. Você não vai mais receber e-mails deste acompanhamento.</p>
        <p className="text-small text-graphite">
          Ele continua rodando e aparece na{" "}
          <Link href="/conversas" className="text-ink underline underline-offset-2">
            central de acompanhamentos
          </Link>
          , onde dá para voltar a receber os avisos.
        </p>
      </div>
    );
  return (
    <div className="flex flex-col gap-4">
      <p className="text-ui text-graphite">
        O acompanhamento continua rodando e aparecendo na central. Só os e-mails dele param.
      </p>
      <button
        type="button"
        disabled={state === "busy"}
        onClick={() => {
          setState("busy");
          setError(null);
          api
            .muteByLink(token)
            .then(() => setState("done"))
            .catch((failure: unknown) => {
              setError(failure instanceof Error ? failure.message : "Não deu certo agora. Tente de novo.");
              setState("failed");
            });
        }}
        className="press min-h-11 self-start rounded-full bg-ink px-5 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {state === "busy" ? "Silenciando…" : "Parar os e-mails deste acompanhamento"}
      </button>
      {error ? (
        <p role="alert" className="text-small font-medium text-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
