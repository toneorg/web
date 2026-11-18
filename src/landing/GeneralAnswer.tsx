"use client";
// The general chat's side of the comparison: a polite list that keeps growing
// while the section scrolls by, the newest option sliding in at the foot and the
// count rolling up, until the decision is handed back. The tone side, beside it,
// stays one pick. The shape of a typical answer, never one product's words.
import { span, useScrollProgress } from "./scroll";

const OPTIONS = [
  "Fritadeira Turbo 4L",
  "AirChef Max 6L",
  "Cozinha Fácil 3,5L",
  "Duo 7L",
  "Crocante Digital 5L",
  "Mini Chef 3L",
  "Forno Air 12L",
  "Prática Plus 4,5L",
];

/** How many rows the list window shows before older ones slide up out of it. */
const WINDOW = 4;

export function GeneralAnswer() {
  const { ref, progress } = useScrollProgress<HTMLElement>("view");
  const shown = 2 + Math.round((OPTIONS.length - 2) * span(progress, 0.15, 0.55));
  const offset = Math.max(0, shown - WINDOW);

  return (
    <article ref={ref} className="reveal flex flex-col gap-5 rounded-card bg-sunken p-6 sm:p-8">
      <header className="flex items-center justify-between gap-4">
        <h3 className="text-ui text-graphite">Um chat de uso geral</h3>
        <span className="rounded-tag bg-paper px-2.5 py-1 text-caption text-graphite tabular-nums">{shown} opções</span>
      </header>
      <div className="flex flex-1 flex-col gap-4 text-small text-graphite">
        <p className="text-ink">Ótima pergunta! Aqui estão 8 excelentes opções de air fryer para você considerar:</p>
        <div className="max-h-[15rem] overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]">
          <ol
            className="flex flex-col gap-3.5 transition-transform duration-300 ease-soft motion-reduce:transition-none"
            style={{ transform: `translateY(calc(${-offset} * (100% + 0.875rem) / ${OPTIONS.length}))` }}
          >
            {OPTIONS.map((name, index) => (
              <li
                key={name}
                className="flex flex-col gap-1.5 transition-[opacity,translate] duration-300 ease-soft motion-reduce:transition-none"
                style={{ opacity: index < shown ? 1 : 0, translate: index < shown ? "0 0" : "0 8px" }}
              >
                <span className="font-medium text-ink">
                  {index + 1}. {name}
                </span>
                <span aria-hidden className="flex flex-col gap-1.5">
                  <span className="h-1.5 w-11/12 rounded-full bg-edge" />
                  <span className="h-1.5 w-2/3 rounded-full bg-edge" />
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-auto border-t border-rule pt-4">A melhor escolha vai depender das suas necessidades e do seu orçamento.</p>
      </div>
    </article>
  );
}
