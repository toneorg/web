"use client";

import { useState } from "react";
import { saveProfile } from "@/app/actions";
import {
  type FormState,
  type ProfileField,
  type WrongShade,
  WRONG_SHADE_VALUES,
} from "@/lib/forms";
import { SITE_URL } from "@/lib/site";
import { buttonClass } from "./button";
import {
  AttributionFields,
  Checkbox,
  Choice,
  ConsentField,
  Field,
  FieldError,
  Honeypot,
  SubmitRow,
  inputClass,
  useFields,
  useFormAction,
} from "./form-parts";
import { useSignup } from "./signup-context";
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

const TEXT_FIELDS = { foundation: "", whatsapp: "" } satisfies Partial<Record<ProfileField, string>>;

/** The e-mail from step one, carried along so the two rows can be matched. */
const EMAIL = "email" satisfies ProfileField;

const SHARE_TEXT =
  "Antes de comprar base online, manda o link para a tone. Ela diz se a loja é confiável e se o tom serve em você. A lista de espera está aberta:";

/** WhatsApp share link. Only called in the browser, after the answers are saved. */
function shareUrl() {
  const invite = `${SITE_URL ?? window.location.origin}/?ref=convite`;
  return `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${invite}`)}`;
}

/** Step two of the list: optional answers that help assemble the beta group. */
export function ProfileForm({ email }: { email: string }) {
  const { profileSaved, markProfileSaved } = useSignup();

  async function saveAndRemember(prev: FormState<ProfileField>, data: FormData) {
    const result = await saveProfile(prev, data);
    if (result.status === "ok") markProfileSaved();
    return result;
  }

  const { state, formAction, pending, errors, formRef, alertRef, doneRef } =
    useFormAction(saveAndRemember);
  const fields = useFields(TEXT_FIELDS);
  const [tone, setTone] = useState("");
  const [wrongShade, setWrongShade] = useState("");
  const [test, setTest] = useState(false);
  const [consent, setConsent] = useState(false);

  if (profileSaved) {
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
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-10">
      <Honeypot />
      <AttributionFields />
      <input type="hidden" name={EMAIL} value={email} />

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

      <Field
        fields={fields}
        name="foundation"
        label="Qual base você usa hoje?"
        hint="Marca e nome ou número do tom, se lembrar."
        optional
      >
        {(control) => (
          <input
            autoComplete="off"
            placeholder="Ex.: marca, tom 30"
            className={inputClass}
            {...control}
          />
        )}
      </Field>

      <div className="flex flex-col gap-3">
        <Checkbox name="test" checked={test} onChange={setTest}>
          <span className="font-medium">Quero testar o beta.</span>{" "}
          <span className="text-muted">
            São de 30 a 50 vagas, metade para as faixas de tom 7 a 10.
          </span>
        </Checkbox>
        {test ? (
          <Field
            fields={fields}
            name="whatsapp"
            label="Seu WhatsApp"
            hint="Só para combinar o teste."
            required
            error={errors.whatsapp}
            className="ps-9"
          >
            {(control) => (
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(11) 90000-0000"
                className={inputClass}
                {...control}
              />
            )}
          </Field>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        <FieldError id="profile-email-error" message={errors.email} />
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
