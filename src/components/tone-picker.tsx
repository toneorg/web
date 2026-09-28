"use client";

import { TONE_UNKNOWN } from "@/lib/forms";
import { MONK, isDeep } from "@/lib/tones";

/**
 * The hero's bands, reused as a radio group. Native radios keep arrow-key
 * movement and screen-reader semantics; the bands are only their skin.
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
        <span className="font-semibold">Qual destes tons é mais parecido com o seu?</span>
        <span className="text-[0.95rem] text-graphite">
          Compare com o pescoço, não com o rosto.
        </span>
      </legend>

      <div
        className={`mt-3 flex gap-1 rounded-[18px] p-1 transition-shadow duration-150 sm:gap-1.5 ${
          invalid ? "shadow-[inset_0_0_0_2px_var(--color-alert)]" : ""
        }`}
      >
        {MONK.map((hex, i) => {
          const n = String(i + 1);
          const selected = value === n;
          return (
            <label key={hex} className="relative flex-1 cursor-pointer">
              <input
                type="radio"
                name="tone"
                value={n}
                checked={selected}
                onChange={() => onChange(n)}
                aria-label={`Tom ${n} de 10`}
                className="peer sr-only"
              />
              <span
                className={`flex h-24 items-end justify-center rounded-[14px] pb-2 text-[0.85rem] font-semibold tabular-nums outline outline-1 -outline-offset-1 outline-black/10 transition-[translate,box-shadow] duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink sm:h-28 ${
                  selected
                    ? "-translate-y-1.5 shadow-[0_0_0_2px_var(--color-paper),0_0_0_4px_var(--color-ink)]"
                    : ""
                } ${isDeep(hex) ? "text-white/90" : "text-ink/70"}`}
                style={{ background: hex }}
              >
                {n}
              </span>
            </label>
          );
        })}
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-3 py-1">
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
          className="grid size-6 place-items-center rounded-full bg-white shadow-[inset_0_0_0_1.5px_var(--color-control)] transition-shadow duration-150 peer-checked:shadow-[inset_0_0_0_7px_var(--color-ink)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
        />
        <span>Não sei dizer</span>
      </label>
    </fieldset>
  );
}
