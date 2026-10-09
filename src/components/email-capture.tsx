"use client";

import { useId, useState } from "react";
import { joinWaitlist } from "@/app/actions";
import type { FormState, Placement, WaitlistField } from "@/lib/forms";
import { buttonClass } from "./button";
import { AttributionFields, Honeypot, useFormAction } from "./form-parts";
import { useSignup } from "./signup-context";

/**
 * Step one of the list: one field shaped like the link she will send later.
 * Used on coral grounds only, so the field is white and the text is wine.
 */
export function EmailCapture({ placement }: { placement: Placement }) {
  const { join } = useSignup();
  const [email, setEmail] = useState("");
  const id = useId();

  async function joinAndRemember(prev: FormState<WaitlistField>, form: FormData) {
    const result = await joinWaitlist(prev, form);
    if (result.status === "ok") join(String(form.get("email") ?? "").trim());
    return result;
  }

  const { state, formAction, pending, errors, alertRef } = useFormAction(joinAndRemember);
  const message = state.status === "error" ? (errors.email ?? state.message) : undefined;

  return (
    <form action={formAction} noValidate className="relative flex flex-col gap-3">
      <Honeypot />
      <AttributionFields />
      <input type="hidden" name="placement" value={placement} />

      <div
        className={`flex items-center gap-2 rounded-full bg-white p-1.5 ps-5 transition-shadow duration-150 has-[input:focus-visible]:shadow-[0_0_0_2px_var(--color-wine)] ${
          message ? "shadow-[0_0_0_2px_var(--color-wine)]" : ""
        }`}
      >
        <label htmlFor={id} className="sr-only">
          Seu e-mail
        </label>
        <input
          id={id}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${id}-error` : undefined}
          className="w-full min-w-0 flex-1 bg-transparent text-[1rem] text-wine placeholder:text-muted focus:outline-none"
        />
        <button type="submit" disabled={pending} className={buttonClass()}>
          {pending ? "Entrando…" : "Entrar na lista"}
        </button>
      </div>

      {message ? (
        <p
          id={`${id}-error`}
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="ps-5 text-[0.9375rem] font-medium focus:outline-none"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
