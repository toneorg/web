"use client";
// The pilot request on /lojas. Fields follow components/field.md on the bench:
// white, a 1px rule, 16px radius, 2px ink focus, 2px alert when invalid.
import { useId, useRef, useState } from "react";
import { track } from "@/conversas/analytics";
import { PLATFORMS, TRAFFIC } from "@/lib/leads";
import { CONTACT_EMAIL } from "@/lib/site";

type Field = "name" | "email" | "store" | "platform" | "traffic";
type State = "idle" | "sending" | "done" | "failed";

const MESSAGES: Record<Field, string> = {
  name: "Escreva o seu nome.",
  email: "Escreva um e-mail no formato voce@sualoja.com.br.",
  store: "Escreva o endereço da loja, como www.sualoja.com.br.",
  platform: "Escolha a plataforma da loja.",
  traffic: "Escolha a faixa de visitas por mês.",
};

function validate(data: Record<string, string>): Field[] {
  const wrong: Field[] = [];
  if (data.name.trim().length < 2) wrong.push("name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) wrong.push("email");
  if (data.store.trim().length < 4 || !data.store.includes(".")) wrong.push("store");
  if (!data.platform) wrong.push("platform");
  if (!data.traffic) wrong.push("traffic");
  return wrong;
}

const control =
  "min-h-13 w-full rounded-input bg-surface px-4 text-body text-ink shadow-[inset_0_0_0_1px_var(--color-rule)] transition-[box-shadow] duration-150 placeholder:text-graphite focus:outline-2 focus:outline-offset-0 focus:outline-ink aria-invalid:shadow-[inset_0_0_0_2px_var(--color-alert)]";

export function PilotForm() {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Field[]>([]);
  const [state, setState] = useState<State>("idle");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const wrong = validate(raw);
    setErrors(wrong);
    if (wrong.length) {
      form.current?.querySelector<HTMLElement>(`[name="${wrong[0]}"]`)?.focus();
      return;
    }
    setState("sending");
    try {
      const response = await fetch("/api/piloto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...raw, whatsapp: raw.whatsapp || undefined }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setState("done");
      track("pilot_requested", { platform: raw.platform, traffic: raw.traffic });
    } catch (error) {
      setState("failed");
      track("pilot_failed", { status: error instanceof Error ? error.message : null });
    }
  }

  if (state === "done")
    return (
      <div role="status" className="step-in flex flex-col items-start gap-4 rounded-card bg-surface p-8 shadow-raised">
        <span aria-hidden className="grid size-10 place-items-center rounded-full bg-accent text-on-accent">
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.25 3.25L13 4.75" />
          </svg>
        </span>
        <p className="display-sm text-ink">Recebemos.</p>
        <p className="text-body text-graphite">A gente te escreve em até dois dias úteis.</p>
      </div>
    );

  const error = (field: Field) => (errors.includes(field) ? MESSAGES[field] : null);
  const describedBy = (field: Field) => (errors.includes(field) ? `${id}-${field}-error` : undefined);
  const clear = (field: Field) => errors.includes(field) && setErrors(errors.filter((item) => item !== field));

  return (
    <form ref={form} onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-card bg-surface p-6 shadow-raised sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Labeled id={`${id}-name`} label="Seu nome" error={error("name")}>
          <input id={`${id}-name`} name="name" autoComplete="name" className={control} aria-invalid={!!error("name") || undefined} aria-describedby={describedBy("name")} onChange={() => clear("name")} />
        </Labeled>
        <Labeled id={`${id}-email`} label="E-mail de trabalho" error={error("email")}>
          <input id={`${id}-email`} name="email" type="email" inputMode="email" autoComplete="email" placeholder="voce@sualoja.com.br" className={control} aria-invalid={!!error("email") || undefined} aria-describedby={describedBy("email")} onChange={() => clear("email")} />
        </Labeled>
      </div>
      <Labeled id={`${id}-store`} label="Site da loja" error={error("store")}>
        <input id={`${id}-store`} name="store" inputMode="url" autoComplete="url" placeholder="www.sualoja.com.br" className={control} aria-invalid={!!error("store") || undefined} aria-describedby={describedBy("store")} onChange={() => clear("store")} />
      </Labeled>
      <div className="grid gap-5 sm:grid-cols-2">
        <Labeled id={`${id}-platform`} label="Plataforma" error={error("platform")}>
          <Select id={`${id}-platform`} name="platform" options={PLATFORMS} invalid={!!error("platform")} describedBy={describedBy("platform")} onChange={() => clear("platform")} />
        </Labeled>
        <Labeled id={`${id}-traffic`} label="Visitas por mês" error={error("traffic")}>
          <Select id={`${id}-traffic`} name="traffic" options={TRAFFIC} invalid={!!error("traffic")} describedBy={describedBy("traffic")} onChange={() => clear("traffic")} />
        </Labeled>
      </div>
      <Labeled id={`${id}-whatsapp`} label="WhatsApp" hint="Opcional, se preferir conversar por lá.">
        <input id={`${id}-whatsapp`} name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 90000-0000" className={control} aria-describedby={`${id}-whatsapp-hint`} />
      </Labeled>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={state === "sending"}
          className="press inline-flex min-h-13 items-center justify-center rounded-full bg-accent px-7 text-[1.0625rem] font-medium text-on-accent shadow-glow hover:bg-accent-pressed disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          {state === "sending" ? "Enviando…" : "Quero um piloto"}
        </button>
        <p className="text-small text-graphite">De 30 a 60 dias, sem custo.</p>
      </div>
      {state === "failed" ? (
        <p role="alert" className="text-ui text-alert">
          Não deu para enviar agora. Tente de novo em instantes{CONTACT_EMAIL ? ` ou escreva para ${CONTACT_EMAIL}` : ""}.
        </p>
      ) : null}
    </form>
  );
}

function Labeled({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-body font-medium text-ink">
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className="text-ui font-normal text-graphite">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-ui text-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Select({
  id,
  name,
  options,
  invalid,
  describedBy,
  onChange,
}: {
  id: string;
  name: string;
  options: readonly string[];
  invalid: boolean;
  describedBy?: string;
  onChange: () => void;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        defaultValue=""
        onChange={onChange}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={`${control} appearance-none pe-11`}
      >
        <option value="" disabled>
          Escolha
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-graphite" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
}
