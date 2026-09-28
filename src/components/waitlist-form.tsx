"use client";

import { useState } from "react";
import { joinWaitlist } from "@/app/actions";
import { WRONG_SHADE_VALUES, type WrongShade } from "@/lib/forms";
import {
  AttributionFields,
  Checkbox,
  ConsentField,
  FieldError,
  Honeypot,
  Label,
  SubmitRow,
  inputClass,
  useFields,
  useFormAction,
} from "./form-parts";
import { Passport } from "./passport";
import { TonePicker } from "./tone-picker";

const WRONG_SHADE_LABELS: Record<WrongShade, string> = {
  nunca: "Nunca",
  "1-2": "Uma ou duas",
  "3+": "Três ou mais",
  desisti: "Desisti de comprar base online",
};

export function WaitlistForm() {
  const { state, formAction, pending, errors, alertRef, doneRef } = useFormAction(joinWaitlist);
  const { bind } = useFields({ foundation: "", email: "", whatsapp: "" });
  const [tone, setTone] = useState("");
  const [wrongShade, setWrongShade] = useState("");
  const [test, setTest] = useState(false);
  const [consent, setConsent] = useState(false);

  if (state.status === "ok") return <Passport tone={tone} headingRef={doneRef} />;

  return (
    <form action={formAction} noValidate className="relative flex flex-col gap-9">
      <Honeypot />
      <AttributionFields />

      <div className="flex flex-col gap-2">
        <TonePicker
          value={tone}
          onChange={setTone}
          invalid={!!errors.tone}
          describedBy={errors.tone ? "tone-error" : undefined}
        />
        <FieldError id="tone-error" message={errors.tone} />
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="foundation" optional hint="Marca e nome da cor, se lembrar.">
          Qual base você usa hoje?
        </Label>
        <input
          autoComplete="off"
          placeholder="Ex.: marca, cor 24"
          className={inputClass}
          {...bind("foundation", errors)}
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold">Quantas vezes você já comprou base no tom errado?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {WRONG_SHADE_VALUES.map((v) => (
            <label key={v} className="cursor-pointer">
              <input
                type="radio"
                name="wrong_shade"
                value={v}
                checked={wrongShade === v}
                onChange={() => setWrongShade(v)}
                className="peer sr-only"
              />
              <span className="press flex min-h-11 items-center rounded-full bg-white px-4 shadow-[inset_0_0_0_1px_var(--color-rule)] transition-[background-color,color,box-shadow] duration-150 hover:shadow-[inset_0_0_0_1px_var(--color-edge-hover)] peer-checked:bg-ink peer-checked:text-paper peer-checked:shadow-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                {WRONG_SHADE_LABELS[v]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <Label htmlFor="email">Seu e-mail</Label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          className={inputClass}
          {...bind("email", errors)}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <div className="flex flex-col gap-3 rounded-[20px] bg-white p-4 shadow-[inset_0_0_0_1px_var(--color-rule)] sm:p-5">
        <Checkbox name="test" checked={test} onChange={setTest}>
          <span className="font-semibold">Quero testar a primeira versão.</span>{" "}
          <span className="text-graphite">
            Vamos chamar 5 pessoas de cada tom para testar antes de todo mundo.
          </span>
        </Checkbox>
        {test ? (
          <div className="flex flex-col gap-3 ps-9">
            <Label htmlFor="whatsapp" hint="Só para combinar o teste.">
              Seu WhatsApp
            </Label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 90000-0000"
              className={inputClass}
              {...bind("whatsapp", errors)}
            />
            <FieldError id="whatsapp-error" message={errors.whatsapp} />
          </div>
        ) : null}
      </div>

      <ConsentField checked={consent} onChange={setConsent} error={errors.consent}>
        Autorizo a tone a guardar meu tom e minhas respostas para me avisar do lançamento e
        melhorar o produto. Posso pedir para apagar quando quiser.
      </ConsentField>

      <SubmitRow
        state={state}
        pending={pending}
        alertRef={alertRef}
        label="Entrar na lista"
        pendingLabel="Entrando na lista…"
      />
    </form>
  );
}
