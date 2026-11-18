"use client";
// "Comprar ficou fácil. Escolher, não.": one purchase, a browser across the whole
// width whose tab strip keeps filling while the section scrolls by, squeezing
// the tabs until they are only icons, and a count that runs up to thirty. The
// work tone takes off your hands. New tabs come in with the step-in entrance;
// nothing moves frame by frame but the count.
import { span, useScrollProgress } from "./scroll";

const TABS = [
  "As 10 melhores cadeiras de 2026",
  "Cadeira Apoio Pro vale a pena?",
  "Reclamações: Ergo Max",
  "Loja A: Cadeira Apoio Pro",
  "Loja B: Linha Flex",
  "Comparativo de apoio lombar",
  "Teste de 30 dias",
  "Ficha técnica: Comfy Plus",
  "Fórum: dor nas costas",
  "Loja C: Executiva Prime",
  "Cupom de desconto",
  "Altura ideal do assento",
  "Review em vídeo",
  "Loja D: Ergo Max",
  "Garantia e troca",
  "Frete para São Paulo",
];

const RESULTS = [
  { site: "blog de ergonomia", title: "As 10 melhores cadeiras ergonômicas de 2026" },
  { site: "vídeo, 18 min", title: "Cadeira Apoio Pro vale a pena? Review depois de 6 meses" },
  { site: "site de reclamações", title: "Ergo Max: encosto quebrou com 4 meses de uso" },
  { site: "fórum", title: "Linha Flex ou Apoio Pro para quem tem 1,85 m?" },
];

/** Tabs open at the end, most of them past the strip. */
const OPEN = 30;

export function TabPile() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>("view");
  const grown = span(progress, 0.12, 0.5);
  const shown = 3 + Math.round((TABS.length - 3) * grown);
  const open = 3 + Math.round((OPEN - 3) * grown);

  return (
    <div ref={ref} aria-hidden className="reveal overflow-hidden rounded-card bg-paper shadow-raised">
      <div className="flex items-end gap-px px-3 pt-3">
        {TABS.slice(0, shown).map((tab, index) => (
          <span
            key={tab}
            data-tab
            className={`step-in flex min-w-0 items-center gap-2 rounded-t-thumb px-3 py-2.5 text-caption whitespace-nowrap ${
              index === 0 ? "max-w-56 flex-[2_1_0] bg-surface text-ink" : "max-w-48 flex-1 basis-0 bg-sunken text-graphite"
            }`}
          >
            <span className="size-3 shrink-0 rounded-full bg-edge" />
            <span className="truncate">{tab}</span>
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-6 bg-surface p-5 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex min-h-10 min-w-0 flex-1 items-center rounded-full bg-paper px-4 text-small text-graphite">
            <span className="truncate">cadeira ergonômica para quem é alto e tem dor nas costas</span>
          </span>
          <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1.5 text-caption font-semibold text-accent-text tabular-nums">
            {open} abas abertas
          </span>
        </div>
        <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {RESULTS.map((result) => (
            <li key={result.title} className="flex flex-col gap-1">
              <span className="text-caption text-graphite">{result.site}</span>
              <span className="text-body text-ink">{result.title}</span>
              <span className="mt-1 h-1.5 w-4/5 rounded-full bg-sunken" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
