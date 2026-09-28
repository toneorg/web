import { ILLUSTRATIVE_COVERED as COVERED } from "@/lib/sample";
import { MONK } from "@/lib/tones";

// Illustrative share of visitors per tone (one value per Monk tone).
const SHARE = [3, 5, 8, 12, 16, 18, 15, 11, 7, 5];
const MAX = Math.max(...SHARE);
const UNMET = SHARE.slice(COVERED).reduce((a, b) => a + b, 0);

// Tailwind can't generate grid classes from runtime numbers, so the grid comes from the data.
const columns = { gridTemplateColumns: `repeat(${SHARE.length}, minmax(0, 1fr))` };
const span = (n: number) => ({ gridColumn: `span ${n} / span ${n}` });

/** The brand-side view: who visits, by tone, and who the range leaves out. */
export function CoverageChart() {
  return (
    <figure className="rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)] sm:p-7">
      <p className="font-semibold">Quem visitou sua página de base, por tom</p>
      <p className="mt-1 text-[0.95rem] text-graphite">Últimos 30 dias</p>

      <div
        className="mt-8 grid h-48 items-end gap-1.5 sm:h-56 sm:gap-2"
        style={columns}
        role="img"
        aria-label={`Visitas por tom de pele. Os tons 1 a ${COVERED} têm cor na cartela; os tons ${COVERED + 1} a ${SHARE.length} somam ${UNMET}% das visitas e não têm.`}
      >
        {SHARE.map((share, i) => {
          // Uncovered tones keep their color; stripes say "no shade for this skin".
          const background =
            i < COVERED
              ? MONK[i]
              : `repeating-linear-gradient(135deg, ${MONK[i]} 0 7px, #ffffff 7px 11px)`;
          return (
            <div
              key={i}
              className="rounded-t-[8px]"
              style={{ height: `${(share / MAX) * 100}%`, background }}
            />
          );
        })}
      </div>

      <div
        className="mt-2 grid gap-1.5 text-center text-[0.8rem] text-graphite tabular-nums sm:gap-2"
        style={columns}
      >
        {SHARE.map((_, i) => (
          <span key={i}>{i + 1}</span>
        ))}
      </div>

      <div className="mt-3 grid gap-1.5 sm:gap-2" style={columns} aria-hidden>
        <span className="h-1 rounded-full bg-ink" style={span(COVERED)} />
        <span className="h-1 rounded-full bg-rule" style={span(SHARE.length - COVERED)} />
      </div>
      <div className="mt-2 grid gap-1.5 text-[0.85rem] sm:gap-2" style={columns} aria-hidden>
        <span style={span(COVERED)}>Com cor na sua cartela</span>
        <span className="text-graphite" style={span(SHARE.length - COVERED)}>
          Sem cor
        </span>
      </div>

      <figcaption className="mt-6 border-t border-rule pt-4 leading-relaxed">
        <span className="font-semibold tabular-nums">{UNMET}% das visitas</span>{" "}
        <span className="text-graphite">
          têm um tom que a sua cartela ainda não cobre. Exemplo ilustrativo.
        </span>
      </figcaption>
    </figure>
  );
}
