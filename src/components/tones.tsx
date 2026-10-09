import { MONK } from "@/lib/tones";
import { SWATCH } from "./swatch";

/** First of the four bands the beta reserves half of its seats for. */
const DEEP_FROM = 7;

/** The ten-band scale, with the bands the beta over-samples marked. */
export function ToneScale() {
  return (
    <figure>
      <div aria-hidden className="grid grid-cols-10 gap-1.5 sm:gap-2">
        {MONK.map((hex, i) => (
          <div key={hex} className="flex flex-col items-center gap-2">
            <span className={`aspect-square w-full ${SWATCH}`} style={{ background: hex }} />
            <span className="text-[0.8125rem] tabular-nums text-muted">{i + 1}</span>
          </div>
        ))}
        <span className="mt-1 h-px bg-wine" style={{ gridColumn: `${DEEP_FROM} / -1` }} />
      </div>
      <figcaption className="mt-3 text-end leading-snug">
        Metade das vagas do beta é para as faixas {DEEP_FROM} a {MONK.length}.
      </figcaption>
    </figure>
  );
}
