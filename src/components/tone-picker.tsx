"use client";

import { TONE_UNKNOWN } from "@/lib/forms";
import { MONK } from "@/lib/tones";

/**
 * The product page's color dot, made large enough to be useful. A radio
 * group: native radios keep arrow-key movement and screen-reader semantics,
 * the circles are only their skin.
 */
export function TonePicker({
  value,
  onChange,
  invalid,
  describedBy,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <fieldset aria-describedby={describedBy} className="flex flex-col gap-3">
      <legend className="flex flex-col gap-1">
        <span className="font-medium">
          Qual faixa é mais parecida com o seu tom?
          <span className="font-normal text-muted"> (opcional)</span>
        </span>
        <span className="text-[0.9375rem] text-muted">Compare com o pescoço, não com o rosto.</span>
      </legend>

      <div
        className={`mt-3 grid grid-cols-5 gap-x-2 gap-y-4 rounded-3xl sm:grid-cols-10 ${
          invalid ? "outline-2 outline-offset-8 outline-coral-700" : ""
        }`}
      >
        {MONK.map((hex, i) => {
          const n = String(i + 1);
          const selected = value === n;
          return (
            <label key={hex} className="flex cursor-pointer flex-col items-center gap-2">
              <input
                type="radio"
                name="tone"
                value={n}
                checked={selected}
                onChange={() => onChange(n)}
                aria-label={`Faixa ${n} de 10`}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={`press block size-11 rounded-full outline-1 -outline-offset-1 outline-black/10 peer-focus-visible:shadow-[0_0_0_3px_#fff,0_0_0_5px_var(--color-wine)] sm:size-12 ${
                  selected ? "shadow-[0_0_0_3px_#fff,0_0_0_5px_var(--color-wine)]" : ""
                }`}
                style={{ background: hex }}
              />
              <span
                aria-hidden
                className={`text-[0.875rem] tabular-nums ${selected ? "font-medium" : "text-muted"}`}
              >
                {n}
              </span>
            </label>
          );
        })}
      </div>

      <label className="mt-1 flex w-fit cursor-pointer items-center gap-3 py-1.5">
        <input
          type="radio"
          name="tone"
          value={TONE_UNKNOWN}
          checked={value === TONE_UNKNOWN}
          onChange={() => onChange(TONE_UNKNOWN)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="grid size-6 place-items-center rounded-full bg-white shadow-[inset_0_0_0_1.5px_var(--color-muted)] transition-shadow duration-150 peer-checked:shadow-[inset_0_0_0_7px_var(--color-wine)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-wine"
        />
        <span>Não sei dizer</span>
      </label>
    </fieldset>
  );
}
