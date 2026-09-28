"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { requestPilot, type FormState } from "@/app/actions";
import {
  AttributionFields,
  Checkbox,
  FieldError,
  Honeypot,
  Label,
  inputClass,
} from "./form-parts";

const PLATFORMS = ["Shopify", "VTEX", "Nuvemshop", "Tray", "Outra", "Não sei"];
const SHADES = ["Até 10", "11 a 25", "26 a 40", "Mais de 40", "Não vendemos base"];

// The commitment ladder from the interview script, lowest cost first.
const STEPS = [
  ["conversa", "Uma conversa de 30 minutos"],
  ["amostras", "Enviar fotos das amostras da nossa cartela"],
  ["piloto", "Um piloto de 60 dias com teste A/B"],
] as const;

const initial: FormState = { status: "idle" };

type Values = Record<
  "name" | "role" | "email" | "brand" | "site" | "platform" | "shades" | "last_complaint",
  string
>;

const empty: Values = {
  name: "",
  role: "",
  email: "",
  brand: "",
  site: "",
  platform: "",
  shades: "",
  last_complaint: "",
};

export function BrandForm() {
  const [state, action, pending] = useActionState(requestPilot, initial);
  const [values, setValues] = useState<Values>(empty);
  const [steps, setSteps] = useState<string[]>(["conversa"]);
  const [consent, setConsent] = useState(false);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  const errors = state.status === "error" ? state.fieldErrors : {};

  useEffect(() => {
    if (state.status === "error") alertRef.current?.focus();
    if (state.status === "ok") doneRef.current?.focus();
  }, [state]);

  const bind = (key: keyof Values) => ({
    id: key,
    name: key,
    value: values[key],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => setValues((v) => ({ ...v, [key]: e.target.value })),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });

  if (state.status === "ok") {
    return (
      <div className="flex flex-col gap-4" aria-live="polite">
        <h3
          ref={doneRef}
          tabIndex={-1}
          className="display-sm text-[2rem] focus:outline-none"
        >
          Pedido recebido.
        </h3>
        <p className="max-w-[34rem] text-[1.1rem] leading-relaxed text-graphite">
          Vamos responder no seu e-mail para marcar a conversa. Se puder, separe o
          número de tons de base da sua cartela e onde a cliente mais trava hoje.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative flex flex-col gap-8">
      <Honeypot />
      <AttributionFields />

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-3">
          <Label htmlFor="name">Seu nome</Label>
          <input autoComplete="name" className={inputClass} {...bind("name")} />
          <FieldError id="name-error" message={errors.name} />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="role" optional>
            Seu cargo
          </Label>
          <input
            autoComplete="organization-title"
            placeholder="Ex.: fundadora, e-commerce"
            className={inputClass}
            {...bind("role")}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="email">E-mail de trabalho</Label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          className={inputClass}
          {...bind("email")}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-3">
          <Label htmlFor="brand">Marca</Label>
          <input autoComplete="organization" className={inputClass} {...bind("brand")} />
          <FieldError id="brand-error" message={errors.brand} />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="site" optional>
            Site da loja
          </Label>
          <input
            type="url"
            inputMode="url"
            placeholder="suamarca.com.br"
            className={inputClass}
            {...bind("site")}
          />
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-3">
          <Label htmlFor="platform">Plataforma da loja</Label>
          <Select options={PLATFORMS} {...bind("platform")} />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="shades">Tons de base na cartela</Label>
          <Select options={SHADES} {...bind("shades")} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label
          htmlFor="last_complaint"
          optional
          hint="O que aconteceu da última vez que uma cliente reclamou de tom errado?"
        >
          A última reclamação de tom
        </Label>
        <textarea
          rows={4}
          className={`${inputClass} py-3 leading-relaxed`}
          {...bind("last_complaint")}
        />
      </div>

      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={errors.steps ? "steps-error" : undefined}
      >
        <legend className="flex flex-col gap-1">
          <span className="font-semibold">Até onde vocês topariam ir agora?</span>
          <span className="text-[0.95rem] text-graphite">Marque tudo que fizer sentido.</span>
        </legend>
        <div className="mt-3 flex flex-col gap-1">
          {STEPS.map(([value, label]) => (
            <Checkbox
              key={value}
              name="steps"
              value={value}
              checked={steps.includes(value)}
              invalid={!!errors.steps}
              onChange={(on) =>
                setSteps((s) => (on ? [...s, value] : s.filter((x) => x !== value)))
              }
            >
              {label}
            </Checkbox>
          ))}
        </div>
        <FieldError id="steps-error" message={errors.steps} />
      </fieldset>

      <div className="flex flex-col gap-2">
        <Checkbox
          name="consent"
          checked={consent}
          onChange={setConsent}
          invalid={!!errors.consent}
          describedBy={errors.consent ? "consent-error" : undefined}
        >
          <span className="text-graphite">
            Autorizo a tone a entrar em contato sobre o piloto.{" "}
            <a href="/privacidade" className="font-medium text-ink underline underline-offset-4">
              Como tratamos seus dados
            </a>
          </span>
        </Checkbox>
        <FieldError id="consent-error" message={errors.consent} />
      </div>

      <div className="flex flex-col gap-4">
        {state.status === "error" ? (
          <p
            ref={alertRef}
            tabIndex={-1}
            role="alert"
            className="font-semibold text-alert focus:outline-none"
          >
            {state.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="press min-h-14 w-full rounded-full bg-ink px-8 text-[1.05rem] font-semibold text-paper transition-[scale,background-color] duration-150 hover:bg-[#3d3631] disabled:cursor-progress disabled:bg-[#5b534d] sm:w-fit"
        >
          {pending ? "Enviando pedido…" : "Pedir uma conversa"}
        </button>
      </div>
    </form>
  );
}

function Select({
  options,
  ...props
}: { options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={`${inputClass} appearance-none pe-11`} {...props}>
        <option value="">Escolha</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-graphite"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </div>
  );
}
