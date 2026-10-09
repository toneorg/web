"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useAttribution } from "@/lib/attribution";
import {
  ATTRIBUTION_KEYS,
  HONEYPOT_FIELD,
  type BrandField,
  type FieldErrors,
  type FormState,
  type ProfileField,
} from "@/lib/forms";
import { buttonClass } from "./button";
import { CheckIcon, ChevronIcon } from "./icons";

/**
 * Fields that sit on a white panel. 16px text keeps iOS from zooming on
 * focus. The inset ring carries the border and the invalid state; focus is an
 * outline, so the two never fight over one property.
 */
export const inputClass =
  "block w-full min-h-13 rounded-2xl bg-coral-50 px-4 text-[1rem] text-wine inset-ring inset-ring-coral-200 transition-shadow duration-150 placeholder:text-muted hover:inset-ring-coral-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-wine aria-[invalid=true]:inset-ring-2 aria-[invalid=true]:inset-ring-coral-700";

/** Focus ring for a visible stand-in whose real input is hidden just before it. */
export const PEER_FOCUS =
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-wine";

/** Opens the privacy note in a new tab, so a half-filled form is still there on return. */
export function PrivacyLink({ className, children }: { className?: string; children: string }) {
  return (
    <Link href="/privacidade" target="_blank" className={className}>
      {children}
    </Link>
  );
}

const IDLE = { status: "idle" } as const;

/**
 * Server action state for a form, plus focus management. After a failed
 * submit, focus goes to the first field that needs fixing, or to the error
 * summary when no field is to blame. After a good one, to the success heading.
 */
export function useFormAction<F extends string>(
  action: (prev: FormState<F>, form: FormData) => Promise<FormState<F>>,
) {
  const [state, formAction, pending] = useActionState(action, IDLE as FormState<F>);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "ok") doneRef.current?.focus();
    if (state.status === "error") {
      const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      (invalid ?? alertRef.current)?.focus();
    }
  }, [state]);

  const errors: FieldErrors<F> = state.status === "error" ? state.fieldErrors : {};
  return { state, formAction, pending, errors, formRef, alertRef, doneRef };
}

type FieldElement = HTMLInputElement | HTMLSelectElement;

/** What a text control needs from its field: identity, value and its links to hint and error. */
type Control = {
  id: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<FieldElement>) => void;
  required?: boolean;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

type Fields<K extends string> = {
  control: (key: K, options: { error?: string; hinted?: boolean; required?: boolean }) => Control;
};

/**
 * Text fields as controlled state. This is load-bearing: React 19 resets
 * uncontrolled fields after every form action, including one that comes back
 * with validation errors, which would wipe what the person typed.
 *
 * Ids get a per-form prefix, so two forms on one page can both have an
 * "email" field.
 */
export function useFields<K extends string>(initial: Record<K, string>): Fields<K> {
  const [values, setValues] = useState(initial);
  const prefix = useId();

  return {
    control(key, { error, hinted, required }) {
      const id = `${prefix}-${key}`;
      const describedBy = [hinted && `${id}-hint`, error && `${id}-error`].filter(Boolean);
      return {
        id,
        name: key,
        value: values[key],
        onChange: (event) => setValues((v) => ({ ...v, [key]: event.target.value })),
        required: required || undefined,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy.length ? describedBy.join(" ") : undefined,
      };
    },
  };
}

function Optional() {
  return <span className="font-normal text-muted"> (opcional)</span>;
}

/**
 * One labelled text control: label, optional hint, the control itself and its
 * error, wired together by id. The child receives the props to spread.
 */
export function Field<K extends string>({
  fields,
  name,
  label,
  hint,
  optional,
  required,
  error,
  className = "",
  children,
}: {
  fields: Fields<K>;
  name: K;
  label: string;
  hint?: string;
  optional?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  children: (control: Control) => React.ReactNode;
}) {
  const control = fields.control(name, { error, hinted: !!hint, required });
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-col gap-1">
        <label htmlFor={control.id} className="font-medium">
          {label}
          {optional ? <Optional /> : null}
        </label>
        {hint ? (
          <span id={`${control.id}-hint`} className="text-[0.9375rem] text-muted">
            {hint}
          </span>
        ) : null}
      </div>
      {children(control)}
      <FieldError id={`${control.id}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[0.9375rem] font-medium text-coral-700">
      {message}
    </p>
  );
}

export function Checkbox({
  name,
  checked,
  onChange,
  invalid,
  required,
  describedBy,
  children,
  value,
}: {
  name: ProfileField | BrandField;
  checked: boolean;
  onChange: (checked: boolean) => void;
  invalid?: boolean;
  required?: boolean;
  describedBy?: string;
  children: React.ReactNode;
  value?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1.5">
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] bg-white text-white inset-ring-[1.5px] inset-ring-muted transition-[background-color,box-shadow] duration-150 peer-checked:bg-wine peer-checked:inset-ring-0 peer-aria-[invalid=true]:inset-ring-2 peer-aria-[invalid=true]:inset-ring-coral-700 ${PEER_FOCUS}`}
      >
        <CheckIcon
          bold
          className={`size-4 transition-[opacity,scale] duration-150 ${
            checked ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
      </span>
      <span className="leading-snug">{children}</span>
    </label>
  );
}

/**
 * One-of-many answer as a row of pills. Native radios keep arrow-key
 * movement. The question is optional, so choosing the selected pill again
 * clears the answer.
 */
export function Choice<V extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: ProfileField | BrandField;
  legend: string;
  options: readonly { value: V; label: string }[];
  value: string;
  onChange: (value: V | "") => void;
}) {
  return (
    <fieldset>
      <legend className="font-medium">
        {legend}
        <Optional />
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              onClick={() => value === option.value && onChange("")}
              className="peer sr-only"
            />
            <span
              className={`press flex min-h-11 items-center rounded-full bg-coral-50 px-4 inset-ring inset-ring-coral-200 hover:inset-ring-coral-300 peer-checked:bg-wine peer-checked:text-white peer-checked:inset-ring-0 ${PEER_FOCUS}`}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <ChevronIcon className="pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
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
  const errorId = `${useId()}-error`;
  return (
    <div className="flex flex-col gap-2">
      <Checkbox
        name="consent"
        checked={checked}
        onChange={onChange}
        required
        invalid={!!error}
        describedBy={error ? errorId : undefined}
      >
        <span className="text-muted">
          {children}{" "}
          <PrivacyLink className="font-medium text-wine underline underline-offset-4">
            Como tratamos seus dados
          </PrivacyLink>
        </span>
      </Checkbox>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

/** Error summary (focused when no single field is to blame) and the submit button. */
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
          className="font-medium text-coral-700 focus:outline-none"
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

/** Hidden fields with where the visit came from. Empty until hydration. */
export function AttributionFields() {
  const values = useAttribution();
  return (
    <>
      {ATTRIBUTION_KEYS.map((key) => (
        <input key={key} type="hidden" name={key} value={values[key] ?? ""} />
      ))}
    </>
  );
}

/** Invisible to people. A row that arrives with it filled is saved, but flagged. */
export function Honeypot() {
  return (
    <div aria-hidden className="sr-only">
      <label>
        Deixe este campo em branco
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
