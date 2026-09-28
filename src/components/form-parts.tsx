"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  ATTRIBUTION_KEYS,
  HONEYPOT_FIELD,
  type FieldErrors,
  type FormState,
} from "@/lib/forms";
import { buttonClass } from "./button";

export const inputClass =
  "block w-full min-h-13 rounded-[14px] bg-white px-4 text-[1rem] text-ink shadow-[inset_0_0_0_1px_var(--color-rule)] transition-shadow duration-150 placeholder:text-graphite/70 hover:shadow-[inset_0_0_0_1px_var(--color-edge-hover)] focus:shadow-[inset_0_0_0_2px_var(--color-ink)] focus:outline-none aria-[invalid=true]:shadow-[inset_0_0_0_2px_var(--color-alert)]";

const IDLE = { status: "idle" } as const;

/**
 * Server action state for a form, plus focus management: the error summary
 * takes focus after a failed submit, the success heading after a good one.
 */
export function useFormAction<F extends string>(
  action: (prev: FormState<F>, form: FormData) => Promise<FormState<F>>,
) {
  const [state, formAction, pending] = useActionState(action, IDLE as FormState<F>);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "error") alertRef.current?.focus();
    if (state.status === "ok") doneRef.current?.focus();
  }, [state]);

  const errors: FieldErrors<F> = state.status === "error" ? state.fieldErrors : {};
  return { state, formAction, pending, errors, alertRef, doneRef };
}

type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Text fields as controlled state. This is load-bearing: React 19 resets
 * uncontrolled fields after every form action, including one that comes back
 * with validation errors, which would wipe what the person typed.
 */
export function useFields<K extends string>(initial: Record<K, string>) {
  const [values, setValues] = useState(initial);

  function bind(key: K, errors: Partial<Record<K, string>>) {
    return {
      id: key,
      name: key,
      value: values[key],
      onChange: (e: React.ChangeEvent<FieldElement>) =>
        setValues((v) => ({ ...v, [key]: e.target.value })),
      "aria-invalid": errors[key] ? true : undefined,
      "aria-describedby": errors[key] ? `${key}-error` : undefined,
    };
  }

  return { values, bind };
}

export function Label({
  htmlFor,
  children,
  hint,
  optional,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1">
      <span className="font-semibold">
        {children}
        {optional ? <span className="font-normal text-graphite"> (opcional)</span> : null}
      </span>
      {hint ? <span className="text-[0.95rem] text-graphite">{hint}</span> : null}
    </label>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[0.95rem] font-medium text-alert">
      {message}
    </p>
  );
}

export function Checkbox({
  name,
  checked,
  onChange,
  invalid,
  describedBy,
  children,
  value,
}: {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  invalid?: boolean;
  describedBy?: string;
  children: React.ReactNode;
  value?: string;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3 py-1">
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] bg-white shadow-[inset_0_0_0_1.5px_var(--color-control)] transition-colors duration-150 peer-checked:bg-ink peer-checked:shadow-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-aria-[invalid=true]:shadow-[inset_0_0_0_2px_var(--color-alert)]"
      >
        <svg
          viewBox="0 0 16 16"
          className={`size-4 text-paper transition-[opacity,scale] duration-150 ${
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      </span>
      <span className="leading-snug">{children}</span>
    </label>
  );
}

export function Select({
  options,
  ...props
}: { options: readonly string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
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

/** The required consent box, with the link to the privacy page. */
export function ConsentField({
  checked,
  onChange,
  error,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        name="consent"
        checked={checked}
        onChange={onChange}
        invalid={!!error}
        describedBy={error ? "consent-error" : undefined}
      >
        <span className="text-graphite">
          {children}{" "}
          <a href="/privacidade" className="font-medium text-ink underline underline-offset-4">
            Como tratamos seus dados
          </a>
        </span>
      </Checkbox>
      <FieldError id="consent-error" message={error} />
    </div>
  );
}

/** Error summary (focused after a failed submit) and the submit button. */
export function SubmitRow<F extends string>({
  state,
  pending,
  alertRef,
  label,
  pendingLabel,
}: {
  state: FormState<F>;
  pending: boolean;
  alertRef: React.RefObject<HTMLParagraphElement | null>;
  label: string;
  pendingLabel: string;
}) {
  return (
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
        className={`${buttonClass({ size: "lg" })} w-full sm:w-fit`}
      >
        {pending ? pendingLabel : label}
      </button>
    </div>
  );
}

// Visit origin read from the URL. "referrer" comes from document.referrer instead.
const URL_KEYS = ATTRIBUTION_KEYS.filter((k) => k !== "referrer");

/**
 * Hidden fields with where the visit came from, so the event QR code
 * (e.g. /?utm_source=evento&utm_medium=qr) can be told apart from shares.
 */
export function AttributionFields() {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let stored: Record<string, string> = {};
    try {
      stored = JSON.parse(sessionStorage.getItem("tone:utm") ?? "{}");
    } catch {}
    const next: Record<string, string> = { ...stored };
    for (const key of URL_KEYS) {
      const v = params.get(key);
      if (v) next[key] = v;
    }
    if (!next.referrer && document.referrer) next.referrer = document.referrer;
    try {
      sessionStorage.setItem("tone:utm", JSON.stringify(next));
    } catch {}
    // Reading the URL is only possible after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(next);
  }, []);

  return (
    <>
      {ATTRIBUTION_KEYS.map((key) => (
        <input key={key} type="hidden" name={key} value={values[key] ?? ""} />
      ))}
    </>
  );
}

/** Invisible to people; bots that fill every field get a silent success. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -start-[9999px] top-auto h-px w-px overflow-hidden">
      <label>
        Empresa
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
