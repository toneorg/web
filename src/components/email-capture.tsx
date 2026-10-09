"use client";

import { useId, useState } from "react";
import { joinWaitlist } from "@/app/actions";
import type { FormState, Placement, WaitlistField } from "@/lib/forms";
import { buttonClass } from "./button";
import { AttributionFields, Honeypot, PrivacyLink, useFormAction } from "./form-parts";
import { useSignup } from "./signup-context";

// Checked against the contract here, so the JSX below can use plain names.
const EMAIL = "email" satisfies WaitlistField;
const PLACEMENT = "placement" satisfies WaitlistField;

/**
 * Step one of the list: one field shaped like the link she will send later.
 * Used on coral grounds only, so the field is white and the text is wine.
 *
 * The sentence under it is the consent to be written to, so it lives here,
 * once. `lead` adds a sentence before it.
 */
export function EmailCapture({ placement, lead }: { placement: Placement; lead?: string }) {
  const { join } = useSignup();
  const [email, setEmail] = useState("");
  const id = useId();

  async function joinAndRemember(prev: FormState<WaitlistField>, form: FormData) {
    const result = await joinWaitlist(prev, form);
    if (result.status === "ok") join(String(form.get(EMAIL)).trim(), placement);
    return result;
  }

  const { state, formAction, pending, errors, formRef, alertRef } = useFormAction(joinAndRemember);
  const fieldError = errors.email;
  // A failure that is not about the e-mail (the save did not go through).
  const formError = state.status === "error" && !fieldError ? state.message : undefined;

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-3">
      <Honeypot />
      <AttributionFields />
      <input type="hidden" name={PLACEMENT} value={placement} />

      <div
        className={`flex items-center gap-2 rounded-full bg-white p-1.5 ps-5 transition-shadow duration-150 has-[input:focus-visible]:shadow-[0_0_0_2px_var(--color-wine)] ${
          fieldError ? "shadow-[0_0_0_2px_var(--color-wine)]" : ""
        }`}
      >
        <label htmlFor={id} className="sr-only">
          Seu e-mail
        </label>
        <input
          id={id}
          name={EMAIL}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? `${id}-error` : undefined}
          className="w-full min-w-0 flex-1 bg-transparent text-[1rem] text-wine placeholder:text-muted focus:outline-none"
        />
        <button type="submit" disabled={pending} className={buttonClass()}>
          {pending ? "Entrando…" : "Entrar na lista"}
        </button>
      </div>

      {fieldError ? (
        <p id={`${id}-error`} role="alert" className="ps-5 text-[0.9375rem] font-medium">
          {fieldError}
        </p>
      ) : null}
      {formError ? (
        <p
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="ps-5 text-[0.9375rem] font-medium focus:outline-none"
        >
          {formError}
        </p>
      ) : null}

      <p className="ps-5 text-[0.875rem] leading-snug">
        {lead ? `${lead} ` : null}
        Entrando na lista, você autoriza a tone a te escrever sobre o beta e o lançamento.{" "}
        <PrivacyLink className="underline underline-offset-4">Privacidade</PrivacyLink>
      </p>
    </form>
  );
}
