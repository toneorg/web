import { SAMPLE_RESULT } from "@/lib/sample";
import { MONK, shadeRange } from "@/lib/tones";

const SHADE_HEXES = shadeRange(40);
const CLOSE = [21, 22, 23];

/** What a foundation page looks like today: forty dots and a guess. */
export function ShadeGrid() {
  return (
    <figure className="rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)] sm:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-semibold">Base líquida matte</p>
        <p className="text-[0.9rem] text-graphite tabular-nums">40 cores</p>
      </div>
      <ul
        className="mt-5 grid grid-cols-8 gap-x-2.5 gap-y-3"
        aria-label="Quarenta cores de base em círculos pequenos"
      >
        {SHADE_HEXES.map((hex, i) => {
          const close = CLOSE.includes(i);
          return (
            <li key={hex + i} className="flex justify-center">
              <span
                className={`block size-6 rounded-full outline outline-1 -outline-offset-1 outline-black/10 sm:size-7 ${
                  close ? "ring-2 ring-ink ring-offset-2 ring-offset-white" : ""
                }`}
                style={{ background: hex }}
              />
            </li>
          );
        })}
      </ul>
      <figcaption className="mt-6 border-t border-rule pt-4 text-[0.95rem] leading-relaxed text-graphite">
        <span className="font-semibold text-ink">Cor 22, 23 ou 24?</span> Na tela,
        quase iguais. Na pele, não.
      </figcaption>
    </figure>
  );
}

const rows: [string, string][] = [
  ["Seu tom", `${SAMPLE_RESULT.tone} de 10`],
  ["Subtom", SAMPLE_RESULT.undertone],
  ["Cor desta marca", SAMPLE_RESULT.shade],
  ["Se quiser mais cobertura", SAMPLE_RESULT.alternative],
];

/** Illustrative result, labelled as such. */
export function ResultCard() {
  return (
    <figure className="rounded-[28px] bg-white p-2 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)]">
      <div
        className="flex h-36 items-end justify-between rounded-[20px] p-4 sm:h-44"
        style={{ background: MONK[SAMPLE_RESULT.tone - 1] }}
      >
        <p className="rounded-full bg-white/90 px-3 py-1 text-[0.85rem] font-semibold">
          Confiança alta
        </p>
        {/* The matched shade sits on the skin and nearly disappears: that is the point. */}
        <div className="flex items-center gap-2 self-start">
          <span className="text-[0.85rem] font-semibold text-white/90">{SAMPLE_RESULT.shade}</span>
          <span
            className="size-10 rounded-full shadow-[0_0_0_2px_rgb(255_255_255/0.9)]"
            style={{ background: SAMPLE_RESULT.shadeHex }}
          />
        </div>
      </div>
      <dl className="px-4 pb-3 pt-2">
        {rows.map(([term, value]) => (
          <div
            key={term}
            className="flex items-baseline justify-between gap-4 border-b border-rule py-3 last:border-0"
          >
            <dt className="text-graphite">{term}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <figcaption className="px-4 pb-4 text-[0.8rem] text-graphite">
        Exemplo ilustrativo. Imagem gerada por IA; a cor real pode variar.
      </figcaption>
    </figure>
  );
}
