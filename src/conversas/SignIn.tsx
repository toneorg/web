"use client";
// T05/T06: entering the web with the same account as the extension. The code
// is typed by the person; it never travels in a link.
import { type FormEvent, useState } from "react";
import { ApiError, api } from "./api";

const field =
  "min-h-13 w-full rounded-input border border-rule bg-surface px-4 text-body text-ink focus-visible:outline-2 focus-visible:outline-ink aria-invalid:outline-2 aria-invalid:outline-alert";
const primary =
  "min-h-13 rounded-full bg-ink px-7 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function SignIn(props: { onDone: () => void; expired?: boolean }) {
  const [mode, setMode] = useState<"code" | "email">("code");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (event: FormEvent, action: () => Promise<unknown>) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Não deu certo. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-12">
      <h1 className="display-sm font-display text-ink">Entrar na tone</h1>
      {props.expired ? (
        <p role="status" className="text-small text-ink">
          Sua sessão na web terminou. Entre de novo para continuar suas conversas.
        </p>
      ) : null}
      <div role="tablist" aria-label="Como entrar" className="flex gap-2">
        {(["code", "email"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={mode === option}
            onClick={() => {
              setMode(option);
              setError(null);
            }}
            className="min-h-11 rounded-full px-4 text-ui text-ink aria-selected:bg-ink aria-selected:text-on-ink focus-visible:outline-2 focus-visible:outline-ink"
          >
            {option === "code" ? "Código da extensão" : "Código por e-mail"}
          </button>
        ))}
      </div>
      {mode === "code" ? (
        <form className="flex flex-col gap-3" onSubmit={(event) => void run(event, async () => { await api.link(code); props.onDone(); })}>
          <label htmlFor="link-code" className="text-body font-medium text-ink">
            Código de 8 letras e números
          </label>
          <p id="link-hint" className="text-ui text-graphite">
            Na extensão, abra “Você” e toque em “Gerar código para a web”. O código vale por 10 minutos e funciona uma vez.
          </p>
          <input
            id="link-code"
            className={field}
            autoComplete="one-time-code"
            value={code}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "signin-error" : "link-hint"}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
          <button type="submit" className={primary} disabled={busy || code.replace(/[\s-]/g, "").length !== 8}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      ) : sent ? (
        <form className="flex flex-col gap-3" onSubmit={(event) => void run(event, async () => { await api.emailVerify(email, code); props.onDone(); })}>
          <label htmlFor="email-code" className="text-body font-medium text-ink">
            Código de 6 números
          </label>
          <p className="text-ui text-graphite">Se este e-mail tem conta na tone, o código chegou nele. Vale por 10 minutos.</p>
          <input id="email-code" className={field} inputMode="numeric" autoComplete="one-time-code" value={code} aria-invalid={error ? true : undefined} aria-describedby={error ? "signin-error" : undefined} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
          <button type="submit" className={primary} disabled={busy || code.length !== 6}>
            {busy ? "Conferindo…" : "Entrar"}
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={(event) => void run(event, async () => { await api.emailStart(email); setSent(true); setCode(""); })}>
          <label htmlFor="email" className="text-body font-medium text-ink">
            E-mail da sua conta
          </label>
          <input id="email" type="email" className={field} autoComplete="email" value={email} aria-invalid={error ? true : undefined} aria-describedby={error ? "signin-error" : undefined} onChange={(event) => setEmail(event.target.value)} />
          <button type="submit" className={primary} disabled={busy || !email.includes("@")}>
            {busy ? "Enviando…" : "Receber código"}
          </button>
        </form>
      )}
      {error ? (
        <p id="signin-error" role="alert" className="text-ui font-medium text-alert">
          {error}
        </p>
      ) : null}
      <p className="text-small text-graphite">
        Ainda não tem conta? A tone está em teste fechado: entre pela extensão com o seu convite.
      </p>
    </main>
  );
}
