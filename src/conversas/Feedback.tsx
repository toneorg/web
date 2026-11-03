"use client";
// The feedback button in the top bar: an error, an idea or something missing,
// in the person's words, straight to the team. It goes to the tone server (kept
// with the account, shown in /admin and sent on to PostHog with the session
// replay of the moment). If the server cannot take it, it goes to PostHog from here.
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { type FormEvent, useState } from "react";
import { track } from "./analytics";
import { Sheet, useSheetClose } from "./Sheet";

export const FEEDBACK_KINDS = [
  { value: "bug", label: "Algo deu errado", hint: "O que você fez, o que esperava e o que aconteceu." },
  { value: "idea", label: "Ideia ou opinião", hint: "O que poderia ser melhor, ou o que você achou." },
  { value: "missing", label: "Sinto falta de algo", hint: "O que você queria fazer e não conseguiu." },
] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]["value"];

const MAX = 2000;

/** Sends one piece of feedback. Resolves when it reached the server or PostHog; rejects if neither. */
export async function sendFeedback(kind: FeedbackKind, message: string, path: string, sessionId: string | null) {
  const replaySessionId = posthog.get_session_id?.() || undefined;
  const event = { type: "feedback_submitted", kind, message, path, ...(replaySessionId ? { replaySessionId } : {}) };
  try {
    const response = await fetch("/api/tone/events", {
      method: "POST",
      headers: { "content-type": "application/json", "x-tone-web": "1" },
      credentials: "same-origin",
      body: JSON.stringify({ sessionId, events: [event] }),
    });
    if (response.ok) return "server" as const;
  } catch {
    // Falls through to PostHog.
  }
  if (!posthog.__loaded) throw new Error("feedback not delivered");
  posthog.capture("feedback_submitted", { surface: "web", kind, message, path, delivered: "posthog_only" });
  return "posthog" as const;
}

function FeedbackForm(props: { sessionId: string | null }) {
  const close = useSheetClose();
  const path = usePathname();
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"writing" | "sending" | "sent" | "failed">("writing");
  const hint = FEEDBACK_KINDS.find((item) => item.value === kind)?.hint;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || state === "sending") return;
    setState("sending");
    try {
      const via = await sendFeedback(kind, text, path, props.sessionId);
      if (via === "server") track("feedback_submitted", { kind, length: text.length, path });
      setState("sent");
    } catch {
      track("feedback_failed", { kind });
      setState("failed");
    }
  };

  if (state === "sent")
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="text-body text-ink">
          Recebido. Obrigada por contar: a equipe lê tudo o que chega por aqui.
        </p>
        <button
          type="button"
          onClick={close}
          className="press min-h-11 self-start rounded-full bg-ink px-5 text-ui text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Fechar
        </button>
      </div>
    );

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => void submit(event)}>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-ui text-ink">Sobre o quê?</legend>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_KINDS.map((item) => (
            <label
              key={item.value}
              className={`press flex min-h-11 cursor-pointer items-center rounded-full px-4 text-ui has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink ${
                kind === item.value ? "bg-ink text-on-ink" : "bg-surface text-ink shadow-raised"
              }`}
            >
              <input
                type="radio"
                name="feedback-kind"
                value={item.value}
                checked={kind === item.value}
                onChange={() => setKind(item.value)}
                className="sr-only"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <label htmlFor="feedback-texto" className="text-ui text-ink">
          Conte para a gente
        </label>
        <textarea
          id="feedback-texto"
          rows={5}
          maxLength={MAX}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={hint}
          aria-describedby="feedback-dica"
          className="resize-none rounded-input bg-surface px-4 py-3 text-body text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-ink"
        />
        <p id="feedback-dica" className="text-caption text-graphite">
          Vai com a página em que você está e a gravação da tela deste momento (com o texto mascarado), para a equipe
          entender o que aconteceu.
        </p>
      </div>
      {state === "failed" ? (
        <p role="alert" className="text-ui font-medium text-alert">
          Não consegui enviar agora. Confira a internet e tente de novo.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={!message.trim() || state === "sending"}
          className="press min-h-11 rounded-full bg-ink px-5 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {state === "sending" ? "Enviando…" : "Enviar feedback"}
        </button>
        <button
          type="button"
          onClick={close}
          className="min-h-11 rounded-full px-4 text-ui text-ink focus-visible:outline-2 focus-visible:outline-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/** The button and its folha. `sessionId` ties the feedback to the open conversation, when there is one. */
export function FeedbackButton(props: { sessionId?: string | null; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        data-tour="feedback"
        onClick={() => {
          track("feedback_opened");
          setOpen(true);
        }}
        className={`press flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${props.className ?? ""}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h16v11H9l-5 4z" />
        </svg>
        <span className="max-sm:sr-only">Feedback</span>
      </button>
      {open ? (
        <Sheet title="Fale com a equipe" onClose={() => setOpen(false)}>
          <FeedbackForm sessionId={props.sessionId ?? null} />
        </Sheet>
      ) : null}
    </>
  );
}
