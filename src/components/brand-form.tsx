"use client";

import { useState } from "react";
import { requestPilot } from "@/app/actions";
import { PILOT_STEPS, PLATFORMS, SHADE_COUNTS, type PilotStep } from "@/lib/forms";
import {
  AttributionFields,
  Checkbox,
  ConsentField,
  FieldError,
  Honeypot,
  Label,
  Select,
  SubmitRow,
  inputClass,
  useFields,
  useFormAction,
} from "./form-parts";

// The commitment ladder from the interview script, lowest cost first.
const PILOT_STEP_LABELS: Record<PilotStep, string> = {
  conversa: "Uma conversa de 30 minutos",
  amostras: "Enviar fotos das amostras da nossa cartela",
  piloto: "Um piloto de 60 dias com teste A/B",
};

export function BrandForm() {
  const { state, formAction, pending, errors, alertRef, doneRef } = useFormAction(requestPilot);
  const { bind } = useFields({
    name: "",
    role: "",
    email: "",
    brand: "",
    site: "",
    platform: "",
    shades: "",
    last_complaint: "",
  });
  const [steps, setSteps] = useState<PilotStep[]>(["conversa"]);
  const [consent, setConsent] = useState(false);

  if (state.status === "ok") {
    return (
      <div className="flex flex-col gap-4" aria-live="polite">
        <h3 ref={doneRef} tabIndex={-1} className="display-sm text-[2rem] focus:outline-none">
          Pedido recebido.
        </h3>
        <p className="max-w-[34rem] text-[1.1rem] leading-relaxed text-graphite">
          Vamos responder no seu e-mail para marcar a conversa. Se puder, separe o número de tons
          de base da sua cartela e onde a cliente mais trava hoje.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="relative flex flex-col gap-8">
      <Honeypot />
      <AttributionFields />

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-3">
          <Label htmlFor="name">Seu nome</Label>
          <input autoComplete="name" className={inputClass} {...bind("name", errors)} />
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
            {...bind("role", errors)}
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
          {...bind("email", errors)}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-3">
          <Label htmlFor="brand">Marca</Label>
          <input autoComplete="organization" className={inputClass} {...bind("brand", errors)} />
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
            {...bind("site", errors)}
          />
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
        <div className="flex flex-col gap-3">
          <Label htmlFor="platform">Plataforma da loja</Label>
          <Select options={PLATFORMS} {...bind("platform", errors)} />
        </div>
        <div className="flex flex-col gap-3">
          <Label htmlFor="shades">Tons de base na cartela</Label>
          <Select options={SHADE_COUNTS} {...bind("shades", errors)} />
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
          {...bind("last_complaint", errors)}
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
          {PILOT_STEPS.map((step) => (
            <Checkbox
              key={step}
              name="steps"
              value={step}
              checked={steps.includes(step)}
              invalid={!!errors.steps}
              onChange={(on) =>
                setSteps((s) => (on ? [...s, step] : s.filter((x) => x !== step)))
              }
            >
              {PILOT_STEP_LABELS[step]}
            </Checkbox>
          ))}
        </div>
        <FieldError id="steps-error" message={errors.steps} />
      </fieldset>

      <ConsentField checked={consent} onChange={setConsent} error={errors.consent}>
        Autorizo a tone a entrar em contato sobre o piloto.
      </ConsentField>

      <SubmitRow
        state={state}
        pending={pending}
        alertRef={alertRef}
        label="Pedir uma conversa"
        pendingLabel="Enviando pedido…"
      />
    </form>
  );
}
