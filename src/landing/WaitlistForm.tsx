"use client";
// The waiting list (components/field.md, "campo com ação"): a white pill with
// the field and the button inside; focus and error ring the whole pill.
import Link from "next/link";
import { useId, useState } from "react";
import { track } from "@/conversas/analytics";
import { APP_PATH, CONTACT_EMAIL } from "@/lib/site";

type State = "idle" | "sending" | "done" | "invalid" | "failed";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function WaitlistForm({ source, showSignIn = false }: { source: string; showSignIn?: boolean }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trap = (new FormData(event.currentTarget).get("website") as string) ?? "";
    if (!EMAIL.test(email.trim())) {
      setState("invalid");
      return;
    }
    setState("sending");
    try {
      const response = await fetch("/api/lista", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source, website: trap }),
      });
      if (response.status === 422) {
        setState("invalid");
        return;
      }
      if (!response.ok) throw new Error(String(response.status));
      setState("done");
      track("waitlist_joined", { source });
    } catch (error) {
      setState("failed");
      track("waitlist_failed", { source, status: error instanceof Error ? error.message : null });
    }
  }

  if (state === "done")
    return (
      <p role="status" className="step-in flex min-h-13 items-center gap-3 rounded-full bg-surface px-5 text-body text-ink shadow-raised">
        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-on-ink">
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.25 3.25L13 4.75" />
          </svg>
        </span>
        Pronto, você está na lista. Avisamos por e-mail quando o seu convite sair.
      </p>
    );

  const invalid = state === "invalid";
  const hint = `${id}-hint`;
  return (
    <form onSubmit={submit} noValidate className="flex w-full max-w-md flex-col gap-3">
      <label htmlFor={`${id}-email`} className="sr-only">
        Seu e-mail
      </label>
      <div
        className={`flex items-center gap-1 rounded-full bg-surface p-1 ps-5 shadow-raised transition-[outline-color] duration-150 focus-within:outline-2 focus-within:outline-ink ${
          invalid ? "outline-2 outline-alert" : ""
        }`}
      >
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state === "invalid" || state === "failed") setState("idle");
          }}
          aria-invalid={invalid || undefined}
          aria-describedby={hint}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-body text-ink placeholder:text-graphite focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="press inline-flex min-h-11 shrink-0 items-center rounded-full bg-ink px-5 text-ui text-on-ink hover:bg-ink-pressed disabled:bg-ink-disabled focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {state === "sending" ? "Entrando na lista…" : "Entrar na lista"}
        </button>
      </div>
      {/* People never see this field; bots fill it. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <p id={hint} role={invalid || state === "failed" ? "alert" : undefined} className={`ps-5 text-small ${invalid || state === "failed" ? "font-medium text-alert" : "text-graphite"}`}>
        {invalid
          ? "Escreva um e-mail no formato voce@email.com."
          : state === "failed"
            ? `Não deu para entrar na lista agora. Tente de novo em instantes${CONTACT_EMAIL ? ` ou escreva para ${CONTACT_EMAIL}` : ""}.`
            : "Os convites saem aos poucos. Seu e-mail serve só para isso."}
      </p>
      {showSignIn ? (
        <p className="ps-5 text-small text-graphite">
          Já tem convite?{" "}
          <Link href={APP_PATH} className="font-medium text-ink underline underline-offset-4 hover:no-underline">
            Entrar
          </Link>
        </p>
      ) : null}
    </form>
  );
}
