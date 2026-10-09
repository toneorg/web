"use client";

import { useState } from "react";
import { saveProfile } from "@/app/actions";
import { WRONG_SHADE_VALUES, type WrongShade } from "@/lib/forms";
import { buttonClass } from "./button";
import {
  AttributionFields,
  Checkbox,
  Choice,
  ConsentField,
  FieldError,
  Honeypot,
  Label,
  SubmitRow,
  inputClass,
  useFields,
  useFormAction,
} from "./form-parts";
import { TonePicker } from "./tone-picker";

const WRONG_SHADE_LABELS: Record<WrongShade, string> = {
  nunca: "Nunca",
  "1-2": "Uma ou duas vezes",
  "3+": "Três ou mais",
  desisti: "Desisti de comprar base online",
};

const WRONG_SHADE_OPTIONS = WRONG_SHADE_VALUES.map((value) => ({
  value,
  label: WRONG_SHADE_LABELS[value],
}));

const SHARE_TEXT =
  "Antes de comprar base online, manda o link para a tone. Ela diz se a loja é confiável e se o tom serve em você. A lista de espera está aberta:";

function shareUrl() {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
  const invite = `${origin.replace(/\/$/, "")}/?ref=convite`;
  return `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${invite}`)}`;
}

/** Step two of the list: optional answers that help assemble the beta group. */
export function ProfileForm({ email }: { email: string }) {
  const { state, formAction, pending, errors, alertRef, doneRef } = useFormAction(saveProfile);
  const { bind } = useFields({ foundation: "", whatsapp: "" });
  const [tone, setTone] = useState("");
  const [wrongShade, setWrongShade] = useState("");
  const [test, setTest] = useState(false);
  const [consent, setConsent] = useState(false);

  if (state.status === "ok") {
    return (
      <div className="flex flex-col gap-4">
        <h3 ref={doneRef} tabIndex={-1} className="display-md focus:outline-none">
          Respostas guardadas.
        </h3>
        <p className="max-w-[34rem] leading-relaxed text-muted">
          {test
            ? "Quando o grupo do beta fechar, a gente te chama pelo WhatsApp."
            : "A gente te escreve por e-mail quando a tone abrir."}{" "}
          Conhece alguém que também já errou o tom?
        </p>
        <a
          href={shareUrl()}
          target="_blank"
          rel="noreferrer"
          className={`${buttonClass({ variant: "quiet", size: "lg" })} w-full sm:w-fit`}
        >
          Mandar a tone pelo WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="relative flex flex-col gap-10">
      <Honeypot />
      <AttributionFields />
      <input type="hidden" name="email" value={email} />

      <div className="flex flex-col gap-2">
        <TonePicker
          value={tone}
          onChange={setTone}
          invalid={!!errors.tone}
          describedBy={errors.tone ? "tone-error" : undefined}
        />
        <FieldError id="tone-error" message={errors.tone} />
      </div>

      <Choice
        name="wrong_shade"
        legend="Quantas vezes você já comprou base no tom errado?"
        options={WRONG_SHADE_OPTIONS}
        value={wrongShade}
        onChange={setWrongShade}
      />

      <div className="flex flex-col gap-3">
        <Label htmlFor="foundation" optional hint="Marca e nome ou número do tom, se lembrar.">
          Qual base você usa hoje?
        </Label>
        <input
          autoComplete="off"
          placeholder="Ex.: marca, tom 30"
          className={inputClass}
          {...bind("foundation", errors)}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Checkbox name="test" checked={test} onChange={setTest}>
          <span className="font-medium">Quero testar o beta.</span>{" "}
          <span className="text-muted">
            São de 30 a 50 vagas, metade para as faixas de tom 7 a 10.
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

      <div className="flex flex-col gap-6">
        <FieldError id="email-error" message={errors.email} />
        <ConsentField checked={consent} onChange={setConsent} error={errors.consent}>
          Tenho 18 anos ou mais e autorizo a tone a guardar minha faixa de tom e estas respostas
          para montar o grupo do beta. Posso pedir para apagar quando quiser.
        </ConsentField>
        <SubmitRow
          state={state}
          pending={pending}
          alertRef={alertRef}
          label="Guardar respostas"
          pendingLabel="Guardando…"
        />
      </div>
    </form>
  );
}
