"use client";
// "Enquanto você espera, ela faz o trabalho pesado": the research behind the
// opening demo's answer, played at the pace of the scroll
// (docs/superpowers/specs/2026-11-18-landing-rolagem-design.md).
//
// The whole screen fills with the windows a person would open for this one
// chair (stores, reviews, spec sheets, videos, forums) and they blur behind the
// steps. In step 2 she picks what matters: a few windows come forward, sharp,
// with a coral ring and the fact she took from each. In step 3 those facts merge
// into the answer and the rest goes dark.
//
// One blur layer sits over the windows (backdrop-filter, constant); a picked
// window rises above it by z-index, so no filter is animated. Only transform and
// opacity move. The server draws the end, so without script or with reduced
// motion the section is the three steps and the answer over the blurred desk.
import { useEffect, useState } from "react";
import { CheckMark } from "./icons";
import { countUp, phaseAt, span, useScrollProgress } from "./scroll";
import { Container } from "./ui";

const STEPS = [
  {
    title: "Você conta.",
    body: "O que você precisa, para quê e quanto quer gastar. Pode colar o link de um produto que já está olhando.",
  },
  {
    title: "Ela pesquisa.",
    body: "Lê fichas técnicas, avaliações e vídeos em várias lojas e separa o que importa para você.",
  },
  {
    title: "Você decide.",
    body: "Poucas opções, com o motivo de cada uma e o que você abre mão em cada escolha.",
  },
];

/** Where the steps change: she starts researching, you decide. */
const CUTS = [0.2, 0.78];

type Desk = {
  id: string;
  kind: "store" | "review" | "spec" | "video" | "article";
  /** What the window's bar says: a store's address, "Avaliações · …", "Ficha técnica · …". */
  bar: string;
  title?: string;
  price?: string;
  meta?: string;
  rows?: [string, string][];
  /** The fact she takes from it: only the picked windows have one. */
  fact?: string;
  /** Centre, in % of the screen; `phone` moves a picked window clear of the text on a phone. */
  x: number;
  y: number;
  phone?: { x: number; y: number };
  /** Shown on a phone: nine of the eighteen. */
  small?: true;
};

// In order of arrival: four loose rows across the whole screen.
const WINDOWS: Desk[] = [
  { id: "top10", kind: "article", bar: "blog · ranking", title: "As 10 melhores cadeiras de 2026", x: 8, y: 13, small: true },
  { id: "flex", kind: "store", bar: "loja-b.com.br", title: "Linha Flex", price: "R$ 1.180", x: 30, y: 15 },
  { id: "encosto", kind: "review", bar: "Avaliações · Ergo Max", meta: "2 de 5", title: "“O encosto quebrou em 4 meses.”", x: 52, y: 12, small: true },
  { id: "apoio", kind: "store", bar: "loja-a.com.br", title: "Cadeira Apoio Pro", price: "R$ 1.390", fact: "Dentro do seu limite", x: 74, y: 15 },
  { id: "executiva", kind: "store", bar: "loja-c.com.br", title: "Executiva Prime", price: "R$ 2.290", x: 95, y: 18, small: true },
  { id: "forum", kind: "article", bar: "fórum · dor nas costas", title: "Qual cadeira para dor lombar?", x: 15, y: 42 },
  { id: "comfy", kind: "spec", bar: "Ficha técnica · Comfy Plus", rows: [["Altura do assento", "42 a 49 cm"], ["Garantia", "3 meses"]], x: 39, y: 41, small: true },
  { id: "assento", kind: "spec", bar: "Ficha técnica · Apoio Pro", rows: [["Altura do assento", "até 54 cm"], ["Encosto", "malha"]], fact: "Cabe na sua altura", x: 62, y: 43, phone: { x: 27, y: 58 }, small: true },
  { id: "alto", kind: "review", bar: "Avaliações · Apoio Pro", meta: "5 de 5", title: "“Ótima para quem é alto.”", fact: "Quem é alto aprova", x: 87, y: 40, phone: { x: 73, y: 71 }, small: true },
  { id: "gamer", kind: "store", bar: "loja-e.com.br", title: "Gamer Turbo", price: "R$ 1.250", x: 6, y: 69 },
  { id: "verao", kind: "review", bar: "Avaliações · Office Air", meta: "3 de 5", title: "“Esquenta muito no verão.”", x: 29, y: 70, small: true },
  { id: "video", kind: "video", bar: "Vídeo · 12 min", title: "Apoio Pro: 30 dias de uso", fact: "Sem desgaste em 30 dias", x: 53, y: 70 },
  { id: "lombar", kind: "spec", bar: "Ficha técnica · Apoio Pro", rows: [["Apoio lombar", "ajuste de altura"], ["Braços", "4 ajustes"]], fact: "Ajuda nas costas", x: 77, y: 69, phone: { x: 38, y: 88 }, small: true },
  { id: "ergo", kind: "store", bar: "loja-d.com.br", title: "Ergo Max", price: "R$ 990", x: 97, y: 72 },
  { id: "comparativo", kind: "article", bar: "blog · comparativo", title: "Linha Flex ou Apoio Pro?", x: 17, y: 94, small: true },
  { id: "peca", kind: "review", bar: "Avaliações · Loja F", meta: "1 de 5", title: "“Chegou com peça faltando.”", x: 41, y: 95 },
  { id: "basic", kind: "spec", bar: "Ficha técnica · Basic 2", rows: [["Braços", "fixos"], ["Lombar", "almofada"]], x: 65, y: 96, small: true },
  { id: "barata", kind: "video", bar: "Vídeo · 8 min", title: "Cadeiras baratas valem a pena?", x: 89, y: 95 },
];

const PICKED = WINDOWS.filter((window) => window.fact);

const REASONS = ["Assento sobe até 54 cm, para a sua altura.", "Apoio lombar com ajuste de altura.", "Dentro do seu limite."];

/** Whether the screen is wider than a phone, where the steps sit beside the answer instead of above it. */
function useWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 48rem)");
    const apply = () => setWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return wide;
}

export function Research() {
  const { ref, progress: p } = useScrollProgress<HTMLElement>("pin");
  const wide = useWide();
  const step = phaseAt(p, CUTS);

  const counters = [
    { label: "Avaliações", value: countUp(p, 0.12, 0.72, 214) },
    { label: "Cadeiras", value: countUp(p, 0.12, 0.6, 12) },
    { label: "Lojas", value: countUp(p, 0.12, 0.5, 6) },
    { label: "Descartes", value: countUp(p, 0.55, 0.85, 11) },
  ];
  const asked = 1 - span(p, 0.16, 0.26);
  const answer = span(p, 0.86, 0.96);

  return (
    <section
      ref={ref}
      id="como-funciona"
      aria-labelledby="como"
      className="relative h-[220vh] bg-ink text-on-ink md:h-[320vh] motion-reduce:h-auto!"
    >
      <div className="sticky top-0 isolate h-dvh overflow-hidden motion-reduce:static motion-reduce:h-auto">
        <DeskLayer p={p} wide={wide} />

        {/* Keeps the steps readable over the windows. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-ink from-30% via-ink/70 via-50% to-transparent to-75% md:bg-linear-to-r md:from-ink md:from-25% md:via-ink/75 md:via-45% md:to-transparent md:to-65%"
        />

        <Container className="relative z-20 grid h-full content-start gap-6 pt-20 pb-8 md:content-center md:gap-10 md:pt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16 motion-reduce:h-auto motion-reduce:py-24">
          <div className="flex flex-col gap-5 md:gap-8">
            <h2 id="como" className="display-sm text-on-ink/75 max-md:[@media(max-height:44rem)]:sr-only">
              Enquanto você espera, ela faz o trabalho pesado.
            </h2>
            <ol className="grid motion-reduce:flex motion-reduce:flex-col motion-reduce:gap-8">
              {STEPS.map((item, index) => {
                const active = index === step;
                return (
                  <li
                    key={item.title}
                    className="flex flex-col gap-2 transition-[opacity,translate] duration-300 ease-soft motion-reduce:translate-0! motion-reduce:opacity-100! motion-reduce:[grid-area:auto]!"
                    style={{ gridArea: "1 / 1", opacity: active ? 1 : 0, translate: active ? "0 0" : `0 ${index < step ? -12 : 12}px` }}
                  >
                    <span className="text-caption text-accent-on-ink tabular-nums">{index + 1} de 3</span>
                    <h3 className="display-md">{item.title}</h3>
                    <p className="hidden max-w-md text-body text-on-ink/80 sm:block">{item.body}</p>
                  </li>
                );
              })}
            </ol>
            <dl className="grid grid-cols-4 gap-3 border-t border-on-ink/15 pt-5">
              {counters.map((counter) => (
                <div key={counter.label} className="flex min-w-0 flex-col-reverse gap-1">
                  <dt className="truncate text-caption text-on-ink/70">{counter.label}</dt>
                  <dd className="display-sm tabular-nums">{counter.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* The request at the start, the answer at the end, in the same place. */}
          <div aria-hidden className="relative grid min-h-[17rem] place-items-center md:min-h-[22rem]">
            <p
              className="col-start-1 row-start-1 w-[min(24rem,100%)] rounded-panel rounded-ee-md bg-surface px-5 py-4 text-body text-ink shadow-raised"
              style={{ opacity: asked, transform: `translateY(${-24 * (1 - asked)}px)` }}
            >
              Cadeira para 8 horas por dia. Tenho 1,85 m e dor nas costas. Até R$ 1.500.
            </p>
            <div
              className="col-start-1 row-start-1 flex w-[min(24rem,100%)] flex-col gap-4 rounded-card bg-surface p-5 text-ink shadow-[var(--shadow-raised),0_24px_60px_-24px_var(--color-scrim)] sm:p-6"
              style={{ opacity: answer, transform: `translateY(${16 * (1 - answer)}px) scale(${0.96 + 0.04 * answer})` }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-caption font-medium text-accent-text">Eu começaria pela</span>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-[1.5rem] leading-tight">Cadeira Apoio Pro</span>
                  <span className="text-small tabular-nums">R$ 1.390</span>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {REASONS.map((reason) => (
                  <li key={reason} className="flex items-start gap-2.5 text-small">
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                      <CheckMark className="size-2.5" />
                    </span>
                    {reason}
                  </li>
                ))}
              </ul>
              <p className="border-t border-rule pt-3 text-caption text-graphite max-md:[@media(max-height:44rem)]:hidden">
                <span className="font-medium text-ink">Por que não a Linha Flex?</span> É R$ 210 mais barata, mas o assento
                para em 48 cm.
              </p>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}

/** The windows over the whole screen, the blur over them, and the picked ones above the blur. */
function DeskLayer({ p, wide }: { p: number; wide: boolean }) {
  // Where the picked facts go: the answer's place, beside the steps or under them.
  const target = wide ? { x: 66, y: 52 } : { x: 50, y: 74 };
  const blur = span(p, 0.08, 0.3);
  const dim = span(p, 0.8, 0.94);

  return (
    <div data-desk aria-hidden="true" className="absolute inset-0 [container-type:size] md:[perspective:1100px]">
      {WINDOWS.map((window, index) => {
        const start = 0.03 + index * 0.017;
        const arrive = span(p, start, start + 0.1);
        const pickIndex = PICKED.indexOf(window);
        const picked = pickIndex >= 0;
        const at = picked && !wide && window.phone ? window.phone : window;

        let x = at.x;
        let y = at.y;
        let opacity = arrive;
        let scale = 0.9 + 0.1 * arrive;
        let lit = 0;
        if (picked) {
          lit = span(p, 0.36 + pickIndex * 0.07, 0.43 + pickIndex * 0.07);
          const merge = span(p, 0.8, 0.9);
          scale *= 1 + 0.06 * lit - 0.5 * merge;
          x += (target.x - x) * merge;
          y += (target.y - y) * merge;
          opacity *= 1 - merge;
        }
        const depth = -700 * (1 - arrive);

        return (
          <div
            key={window.id}
            data-window={picked ? "picked" : window.kind}
            className={`absolute top-0 left-0 ${window.small ? "" : "hidden md:block"}`}
            style={{
              opacity,
              // A picked window rises above the blur while it is lit.
              zIndex: lit > 0.01 ? 3 : 1,
              transform: `translate(${x}cqw, ${y}cqh) translate(-50%, -50%) translate3d(0, 0, ${depth}px) scale(${scale})`,
            }}
          >
            <Window window={window} lit={lit} />
          </div>
        );
      })}

      {/* One blur for every window under it, then a darker veil once the answer arrives. */}
      <div className="absolute inset-0 z-[2] bg-ink/45 backdrop-blur-sm" style={{ opacity: blur }} />
      <div className="absolute inset-0 z-[2] bg-ink" style={{ opacity: 0.45 * dim }} />
    </div>
  );
}

function Window({ window, lit }: { window: Desk; lit: number }) {
  return (
    <div className="relative w-[min(17rem,44cqw)] text-ink md:w-[min(17rem,20cqw)]">
      <div className="overflow-hidden rounded-panel bg-surface shadow-[var(--shadow-raised),0_18px_40px_-20px_var(--color-scrim)]">
        <div className="flex items-center gap-1.5 border-b border-rule bg-paper px-3 py-2">
          <span className="size-1.5 rounded-full bg-edge" />
          <span className="size-1.5 rounded-full bg-edge" />
          <span className="size-1.5 rounded-full bg-edge" />
          <span className="ms-1.5 truncate text-caption text-graphite">{window.bar}</span>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {window.kind === "video" ? (
            <span className="grid aspect-video place-items-center rounded-thumb bg-ink text-on-ink">
              <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
                <path d="M8 5.5v13l11-6.5z" />
              </svg>
            </span>
          ) : null}
          {window.meta ? <span className="text-caption text-graphite">{window.meta}</span> : null}
          {window.title ? (
            <div className="flex items-baseline justify-between gap-3">
              <span className={window.kind === "review" ? "font-display text-[1.0625rem] leading-snug italic" : "text-small font-medium"}>
                {window.title}
              </span>
              {window.price ? <span className="shrink-0 text-small tabular-nums">{window.price}</span> : null}
            </div>
          ) : null}
          {window.rows?.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 border-b border-rule pb-1.5 text-caption last:border-0 last:pb-0">
              <span className="text-graphite">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
          {window.kind === "store" || window.kind === "article" ? (
            <span className="flex flex-col gap-1.5 pt-1">
              <span className="h-1.5 w-full rounded-full bg-sunken" />
              <span className="h-1.5 w-2/3 rounded-full bg-sunken" />
            </span>
          ) : null}
        </div>
      </div>
      {window.fact ? (
        <>
          <span className="pointer-events-none absolute -inset-1 rounded-[calc(var(--radius-panel)+4px)] ring-2 ring-accent" style={{ opacity: lit }} />
          <span
            className="absolute -bottom-3.5 left-3 inline-flex items-center gap-1.5 rounded-tag bg-accent px-2 py-1 text-caption font-medium whitespace-nowrap text-on-accent shadow-glow"
            style={{ opacity: lit, transform: `translateY(${6 * (1 - lit)}px)` }}
          >
            <CheckMark className="size-3" />
            {window.fact}
          </span>
        </>
      ) : null}
    </div>
  );
}
