"use client";

import { useState } from "react";
import { requestPilot } from "@/app/actions";
import { type BrandField, type PilotStep, PILOT_STEPS, PLATFORMS } from "@/lib/forms";
import {
  AttributionFields,
  Checkbox,
  ConsentField,
  Field,
  FieldError,
  Honeypot,
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
  piloto: "Um piloto de 60 dias com grupo de controle",
};

const TEXT_FIELDS = {
  name: "",
  email: "",
  brand: "",
  site: "",
  platform: "",
} satisfies Partial<Record<BrandField, string>>;

const PAIR = "grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6";

export function BrandForm() {
  const { state, formAction, pending, errors, formRef, alertRef, doneRef } =
    useFormAction(requestPilot);
  const fields = useFields(TEXT_FIELDS);
  const [steps, setSteps] = useState<PilotStep[]>(["conversa"]);
  const [consent, setConsent] = useState(false);

  if (state.status === "ok") {
    return (
      <div className="flex flex-col gap-4">
        <h3 ref={doneRef} tabIndex={-1} className="display-md focus:outline-none">
          Pedido recebido.
        </h3>
        <p className="max-w-[34rem] leading-relaxed text-muted">
          A gente responde no seu e-mail para marcar a conversa. Se puder, separe quantos tons de
          base a cartela tem e onde a cliente mais trava hoje.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-8">
      <Honeypot />
      <AttributionFields />

      <div className={PAIR}>
        <Field fields={fields} name="name" label="Seu nome" required error={errors.name}>
          {(control) => <input autoComplete="name" className={inputClass} {...control} />}
        </Field>
        <Field fields={fields} name="email" label="E-mail de trabalho" required error={errors.email}>
          {(control) => (
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              className={inputClass}
              {...control}
            />
          )}
        </Field>
      </div>

      <div className={PAIR}>
        <Field fields={fields} name="brand" label="Marca" required error={errors.brand}>
          {(control) => <input autoComplete="organization" className={inputClass} {...control} />}
        </Field>
        <Field fields={fields} name="site" label="Site da loja" optional>
          {(control) => (
            <input
              type="url"
              inputMode="url"
              placeholder="suamarca.com.br"
              className={inputClass}
              {...control}
            />
          )}
        </Field>
      </div>

      <div className={PAIR}>
        <Field fields={fields} name="platform" label="Plataforma da loja" optional>
          {(control) => <Select options={PLATFORMS} {...control} />}
        </Field>
      </div>

      <fieldset aria-describedby={errors.steps ? "steps-error" : undefined}>
        <legend className="flex flex-col gap-1">
          <span className="font-medium">Até onde vocês topariam ir agora?</span>
          <span className="text-[0.9375rem] text-muted">Marque tudo que fizer sentido.</span>
        </legend>
        <div className="mt-3 flex flex-col">
          {PILOT_STEPS.map((step) => (
            <Checkbox
              key={step}
              name="steps"
              value={step}
              checked={steps.includes(step)}
              invalid={!!errors.steps}
              onChange={(on) =>
                setSteps((chosen) => (on ? [...chosen, step] : chosen.filter((s) => s !== step)))
              }
            >
              {PILOT_STEP_LABELS[step]}
            </Checkbox>
          ))}
        </div>
        <FieldError id="steps-error" message={errors.steps} />
      </fieldset>

      <div className="flex flex-col gap-6">
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
      </div>
    </form>
  );
}
