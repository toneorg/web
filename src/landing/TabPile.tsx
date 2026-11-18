"use client";
// "Comprar ficou fácil. Escolher, não.": one purchase, a strip of browser tabs that
// keeps filling while the section scrolls by. The work tone takes off your hands.
// New tabs come in with the step-in entrance and the strip squeezes them, as a
// browser does; nothing moves frame by frame but the count.
import { span, useScrollProgress } from "./scroll";

const TABS = [
  "Top 10 de 2026",
  "Review sincero",
  "Reclamações",
  "Loja A",
  "Loja B",
  "Comparativo",
  "Teste de 30 dias",
  "Ficha técnica",
  "Fórum",
  "Loja C",
];

export function TabPile() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>("view");
  const grown = span(progress, 0.15, 0.6);
  const open = 3 + Math.round((TABS.length - 3) * grown);
  const more = 6 + Math.round(20 * grown);

  return (
    <div ref={ref} aria-hidden className="reveal relative flex flex-col overflow-hidden rounded-panel bg-paper shadow-raised">
      <div className="flex items-end px-2 pt-2">
        {TABS.slice(0, open).map((tab, index) => (
          <span
            key={tab}
            data-tab
            className={`step-in -me-px flex items-center gap-1.5 rounded-t-thumb px-2.5 py-2 text-caption whitespace-nowrap ${
              index === 0 ? "shrink-0 bg-surface text-ink" : "min-w-0 flex-1 basis-0 bg-sunken text-graphite"
            }`}
          >
            <span className="size-2.5 shrink-0 rounded-full bg-edge" />
            <span className="truncate">{tab}</span>
          </span>
        ))}
      </div>
      <div className="relative flex flex-col gap-2.5 bg-surface p-5 [mask-image:linear-gradient(to_bottom,black_45%,transparent)]">
        <span className="absolute top-4 right-4 rounded-full bg-accent-soft px-2.5 py-1 text-caption font-semibold text-accent-text tabular-nums">
          +{more} abas
        </span>
        <span className="h-2 w-3/5 rounded-full bg-edge" />
        <span className="h-1.5 w-full rounded-full bg-sunken" />
        <span className="h-1.5 w-11/12 rounded-full bg-sunken" />
        <span className="h-1.5 w-4/5 rounded-full bg-sunken" />
        <span className="h-1.5 w-full rounded-full bg-sunken" />
      </div>
    </div>
  );
}
