"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { joinWaitlist, type FormState } from "@/app/actions";
import { MONK, isDeep } from "@/lib/tones";
import {
  AttributionFields,
  Checkbox,
  FieldError,
  Honeypot,
  Label,
  inputClass,
} from "./form-parts";
import { TonePicker } from "./tone-picker";

const WRONG_SHADE = [
  ["nunca", "Nunca"],
  ["1-2", "Uma ou duas"],
  ["3+", "Três ou mais"],
  ["desisti", "Desisti de comprar base online"],
] as const;

const initial: FormState = { status: "idle" };

export function WaitlistForm() {
  const [state, action, pending] = useActionState(joinWaitlist, initial);
  const [tone, setTone] = useState("");
  const [foundation, setFoundation] = useState("");
  const [wrongShade, setWrongShade] = useState("");
  const [email, setEmail] = useState("");
  const [test, setTest] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [consent, setConsent] = useState(false);
  const alertRef = useRef<HTMLParagraphElement>(null);

  const errors = state.status === "error" ? state.fieldErrors : {};

  useEffect(() => {
    if (state.status === "error") alertRef.current?.focus();
  }, [state]);

  if (state.status === "ok") return <Passport tone={tone} />;

  return (
    <form action={action} noValidate className="relative flex flex-col gap-9">
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
          id="foundation"
          name="foundation"
          value={foundation}
          onChange={(e) => setFoundation(e.target.value)}
          autoComplete="off"
          placeholder="Ex.: marca, cor 24"
          className={inputClass}
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold">
          Quantas vezes você já comprou base no tom errado?
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {WRONG_SHADE.map(([v, label]) => (
            <label key={v} className="cursor-pointer">
              <input
                type="radio"
                name="wrong_shade"
                value={v}
                checked={wrongShade === v}
                onChange={() => setWrongShade(v)}
                className="peer sr-only"
              />
              <span className="press flex min-h-11 items-center rounded-full bg-white px-4 shadow-[inset_0_0_0_1px_var(--color-rule)] transition-[background-color,color,box-shadow] duration-150 hover:shadow-[inset_0_0_0_1px_#b9b7b4] peer-checked:bg-ink peer-checked:text-paper peer-checked:shadow-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3">
        <Label htmlFor="email">Seu e-mail</Label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email || undefined}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={inputClass}
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
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 90000-0000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              aria-invalid={!!errors.whatsapp || undefined}
              aria-describedby={errors.whatsapp ? "whatsapp-error" : undefined}
              className={inputClass}
            />
            <FieldError id="whatsapp-error" message={errors.whatsapp} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Checkbox
          name="consent"
          checked={consent}
          onChange={setConsent}
          invalid={!!errors.consent}
          describedBy={errors.consent ? "consent-error" : undefined}
        >
          <span className="text-graphite">
            Autorizo a tone a guardar meu tom e minhas respostas para me avisar do
            lançamento e melhorar o produto. Posso pedir para apagar quando quiser.{" "}
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
          {pending ? "Entrando na lista…" : "Entrar na lista"}
        </button>
      </div>
    </form>
  );
}

function Passport({ tone }: { tone: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);
  const hex = tone && tone !== "nd" ? MONK[Number(tone) - 1] : null;
  const deep = hex ? isDeep(hex) : false;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const shareUrl =
    typeof window === "undefined" ? "" : `${window.location.origin}/?ref=convite`;
  const message = `Entrei na lista da tone: ela mostra o tom certo de base de cada marca a partir de uma selfie. ${shareUrl}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-8" aria-live="polite">
      <div
        className="flex aspect-[1.6] w-full max-w-md flex-col justify-between rounded-[28px] p-6 outline outline-1 -outline-offset-1 outline-black/10 sm:p-7"
        style={{
          background:
            hex ??
            `linear-gradient(90deg, ${MONK.map((c, i) => `${c} ${i * 10}% ${(i + 1) * 10}%`).join(", ")})`,
          color: deep ? "#fff" : "var(--color-ink)",
        }}
      >
        <p className="display text-[1.5rem]">tone</p>
        <div>
          <p className="text-[0.95rem] opacity-80">Passaporte de tom</p>
          <p className="display-sm text-[2.25rem] tabular-nums">
            {hex ? `Tom ${tone}` : "Tom a descobrir"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="display-sm text-[1.75rem] focus:outline-none"
        >
          Seu lugar está guardado.
        </h3>
        <p className="max-w-[34rem] text-[1.05rem] leading-relaxed text-graphite">
          Vamos escrever para o seu e-mail quando a tone abrir. Se você marcou o teste,
          a gente chama no WhatsApp.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-semibold">Conhece alguém que já errou a base?</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex min-h-13 items-center rounded-full bg-ink px-6 font-semibold text-paper hover:bg-[#3d3631]"
          >
            Mandar no WhatsApp
          </a>
          <button
            type="button"
            onClick={copy}
            className="press inline-flex min-h-13 items-center rounded-full bg-white px-6 font-semibold shadow-[inset_0_0_0_1px_var(--color-rule)] hover:shadow-[inset_0_0_0_1px_#b9b7b4]"
          >
            <span aria-live="polite">{copied ? "Link copiado" : "Copiar link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
