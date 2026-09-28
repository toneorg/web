"use client";

import { useEffect, useState } from "react";

export const inputClass =
  "block w-full min-h-13 rounded-[14px] bg-white px-4 text-[1rem] text-ink shadow-[inset_0_0_0_1px_var(--color-rule)] transition-shadow duration-150 placeholder:text-graphite/70 hover:shadow-[inset_0_0_0_1px_#b9b7b4] focus:shadow-[inset_0_0_0_2px_var(--color-ink)] focus:outline-none aria-[invalid=true]:shadow-[inset_0_0_0_2px_var(--color-alert)]";

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
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-[7px] bg-white shadow-[inset_0_0_0_1.5px_#8f8b87] transition-colors duration-150 peer-checked:bg-ink peer-checked:shadow-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-aria-[invalid=true]:shadow-[inset_0_0_0_2px_var(--color-alert)]"
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

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "ref"] as const;

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
    for (const key of UTM_KEYS) {
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
      {[...UTM_KEYS, "referrer" as const].map((key) => (
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
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
