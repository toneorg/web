"use client";
// "Enquanto você espera, ela faz o trabalho pesado": the research behind the
// opening demo's answer, played at the pace of the scroll. The section is three
// screens tall with a sticky stage: the request, then reviews, prices and spec
// lines arriving from far away, the ones that do not fit leaving with their
// reason, the ones in favour converging into the answer
// (docs/superpowers/specs/2026-11-18-landing-rolagem-design.md).
//
// Only transform and opacity move. The server draws the end, so without script
// or with reduced motion the section is the three steps and the answer.
import { CheckMark, CrossMark } from "./icons";
import { useEffect, useState } from "react";
import { countUp, phaseAt, span, useScrollProgress } from "./scroll";
import { Container } from "./ui";

const STEPS = [
  {
    title: "Você conta.",
    body: "O que você precisa, para quê e quanto quer gastar. Pode colar o link de um produto que já está olhando.",
  },
  {
    title: "Ela pesquisa.",
    body: "Lê fichas técnicas, avaliações e vídeos em várias lojas e descarta o que não serve para você.",
  },
  {
    title: "Você decide.",
    body: "Poucas opções, com o motivo de cada uma e o que você abre mão em cada escolha.",
  },
];

/** Where the phases begin: you tell, she researches, she discards, you decide. */
const CUTS = [0.2, 0.6, 0.85];

type Card = {
  id: string;
  /** keep: the pick. support: reasons for it, which merge into it. discard: leaves with `reason`. */
  role: "keep" | "support" | "discard";
  label: string;
  text: string;
  price?: string;
  quote?: true;
  reason?: string;
  /** Centre on the stage, in % of its width and height, and depth in px. */
  x: number;
  y: number;
  z: number;
  /** Shown on a phone too: eight of the fourteen. */
  phone?: true;
};

// In order of arrival.
const CARDS: Card[] = [
  { id: "apoio", role: "keep", label: "Loja A", text: "Cadeira Apoio Pro", price: "R$ 1.390", x: 50, y: 48, z: 0, phone: true },
  { id: "flex", role: "discard", label: "Loja B", text: "Linha Flex", price: "R$ 1.180", reason: "Assento para em 48 cm", x: 26, y: 22, z: -140, phone: true },
  { id: "alto", role: "support", label: "Avaliação, 5 de 5", text: "“Ótima para quem é alto.”", quote: true, x: 75, y: 17, z: -60, phone: true },
  { id: "encosto", role: "discard", label: "Avaliação, 2 de 5 · Ergo Max", text: "“O encosto quebrou em 4 meses.”", quote: true, reason: "Encosto frágil em 31 avaliações", x: 76, y: 52, z: -200, phone: true },
  { id: "executiva", role: "discard", label: "Loja C", text: "Executiva Prime", price: "R$ 2.290", reason: "Acima do seu limite", x: 27, y: 80, z: -120, phone: true },
  { id: "assento", role: "support", label: "Ficha · Apoio Pro", text: "Assento sobe até 54 cm", x: 50, y: 13, z: -260, phone: true },
  { id: "comfy", role: "discard", label: "Ficha · Comfy Plus", text: "Assento de 42 a 49 cm", reason: "Baixa para 1,85 m", x: 74, y: 85, z: -80, phone: true },
  { id: "ergo", role: "discard", label: "Loja D", text: "Ergo Max", price: "R$ 990", reason: "Sem ajuste lombar", x: 24, y: 50, z: -320 },
  { id: "gamer", role: "discard", label: "Loja E", text: "Gamer Turbo", price: "R$ 1.250", reason: "Lombar é só uma almofada", x: 52, y: 82, z: -280, phone: true },
  { id: "lombar", role: "support", label: "Ficha · Apoio Pro", text: "Lombar com ajuste de altura", x: 34, y: 36, z: -380 },
  { id: "verao", role: "discard", label: "Avaliação, 3 de 5 · Office Air", text: "“Esquenta muito no verão.”", quote: true, reason: "Esquenta, segundo 18 avaliações", x: 68, y: 34, z: -420 },
  { id: "basic", role: "discard", label: "Ficha · Basic 2", text: "Apoio de braço fixo", reason: "Sem ajuste de braço", x: 38, y: 66, z: -460 },
  { id: "peca", role: "discard", label: "Avaliação, 1 de 5 · Loja F", text: "“Chegou com peça faltando.”", quote: true, reason: "Loja com muitas reclamações", x: 80, y: 68, z: -360 },
  { id: "garantia", role: "discard", label: "Ficha · Office Air", text: "Garantia de 3 meses", reason: "Garantia curta", x: 22, y: 64, z: -500 },
];

const KEEP = CARDS.find((card) => card.role === "keep")!;

/** Where the pick rises to when the answer opens below it, in % of the stage: higher on a phone's short stage. */
function useKeepRise() {
  const [rise, setRise] = useState(32);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 48rem)");
    const apply = () => setRise(wide.matches ? 32 : 13);
    apply();
    wide.addEventListener("change", apply);
    return () => wide.removeEventListener("change", apply);
  }, []);
  return rise;
}

const REASONS = ["Assento sobe até 54 cm, para a sua altura.", "Apoio lombar com ajuste de altura.", "Dentro do seu limite."];

export function Research() {
  const { ref, progress: p } = useScrollProgress<HTMLElement>("pin");
  const phase = phaseAt(p, CUTS);
  const step = phase === 0 ? 0 : phase < 3 ? 1 : 2;

  const counters = [
    { label: "Avaliações", value: countUp(p, 0.2, 0.6, 214) },
    { label: "Cadeiras", value: countUp(p, 0.2, 0.6, 12) },
    { label: "Lojas", value: countUp(p, 0.2, 0.5, 6) },
    { label: "Descartadas", value: countUp(p, 0.6, 0.85, 11) },
  ];

  return (
    <section
      ref={ref}
      id="como-funciona"
      aria-labelledby="como"
      className="relative h-[200vh] bg-ink text-on-ink md:h-[300vh] motion-reduce:h-auto"
    >
      <div className="sticky top-0 isolate flex h-dvh items-center overflow-hidden pt-16 motion-reduce:static motion-reduce:h-auto motion-reduce:py-24">
        <div aria-hidden className="glow-ink pointer-events-none absolute inset-0 -z-10" />
        <Container className="grid gap-6 md:gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
          <div className="flex flex-col gap-5 md:gap-8">
            <h2 id="como" className="display-sm text-on-ink/75">
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
                    <p className="hidden max-w-md text-body text-on-ink/75 sm:block">{item.body}</p>
                  </li>
                );
              })}
            </ol>
            <dl className="grid grid-cols-4 gap-3 border-t border-on-ink/15 pt-5">
              {counters.map((counter) => (
                <div key={counter.label} className="flex flex-col-reverse gap-1">
                  <dt className="text-caption text-on-ink/70">{counter.label}</dt>
                  <dd className="display-sm tabular-nums">{counter.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Stage p={p} />
        </Container>
      </div>
    </section>
  );
}

function Stage({ p }: { p: number }) {
  const keepRise = useKeepRise();
  // The request, in the middle until the cards start arriving.
  const asked = 1 - span(p, 0.15, 0.24);
  // The pick rises and the answer opens under it.
  const rise = span(p, 0.86, 0.94);
  const answer = span(p, 0.88, 0.97);
  let discardIndex = 0;

  return (
    <div
      data-stage
      aria-hidden="true"
      className="relative h-[21rem] w-full [container-type:size] sm:h-[26rem] md:h-[min(46rem,72dvh)] md:[perspective:900px]"
    >
      <p
        className="absolute top-1/2 left-1/2 w-[min(22rem,90%)] rounded-panel rounded-ee-md bg-surface px-4 py-3 text-small text-ink shadow-raised"
        style={{ opacity: asked, transform: `translate(-50%, -50%) translateY(${-40 * (1 - asked)}px)` }}
      >
        Cadeira para 8 horas por dia. Tenho 1,85 m e dor nas costas. Até R$ 1.500.
      </p>

      {CARDS.map((card, index) => {
        const start = 0.18 + index * 0.022;
        const arrive = span(p, start, start + 0.12);
        let opacity = arrive;
        let x = card.x;
        let y = card.y;
        let lift = 0;
        let scale = 0.86 + 0.14 * arrive;
        let marked = 0;

        if (card.role === "discard") {
          const at = 0.6 + discardIndex++ * 0.02;
          marked = span(p, at, at + 0.03);
          const fall = span(p, at + 0.035, at + 0.09);
          opacity *= (1 - 0.35 * marked) * (1 - fall);
          lift = 90 * fall;
        } else if (card.role === "support") {
          const merge = span(p, 0.84, 0.92);
          x += (KEEP.x - x) * merge;
          y += (keepRise - y) * merge;
          scale *= 1 - 0.5 * merge;
          opacity *= 1 - merge;
        } else {
          y += (keepRise - y) * rise;
        }

        const depth = card.z - 900 * (1 - arrive);
        return (
          <div
            key={card.id}
            data-card={card.role}
            className={`absolute top-0 left-0 ${card.phone ? "" : "hidden md:block"}`}
            style={{
              opacity,
              zIndex: card.role === "keep" ? 2 : 1,
              transform: `translate(${x}cqw, ${y}cqh) translate(-50%, -50%) translate3d(0, ${lift}px, ${depth}px) scale(${scale})`,
            }}
          >
            <CardFace card={card} marked={marked} answer={card.role === "keep" ? answer : 0} />
          </div>
        );
      })}

      {/* The answer, opening under the pick. */}
      <div
        className="absolute left-1/2 flex w-[min(21rem,92%)] flex-col gap-3 rounded-panel bg-surface p-4 text-ink shadow-raised"
        style={{
          top: `calc(${keepRise}% + 4.25rem)`,
          opacity: answer,
          transform: `translate(-50%, ${12 * (1 - answer)}px)`,
        }}
      >
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
        <p className="border-t border-rule pt-3 text-caption text-graphite">
          <span className="font-medium text-ink">Por que não a Linha Flex?</span> É R$ 210 mais barata, mas o assento para
          em 48 cm.
        </p>
      </div>
    </div>
  );
}

function CardFace({ card, marked, answer }: { card: Card; marked: number; answer: number }) {
  const keep = card.role === "keep";
  return (
    <div className={`relative flex flex-col gap-1 rounded-panel bg-surface p-3 text-ink shadow-raised ${keep ? "w-[min(21rem,86cqw)]" : "w-[min(14rem,42cqw)]"}`}>
      {keep ? (
        <span className="text-caption font-medium text-accent-text" style={{ opacity: answer }}>
          Eu começaria pela
        </span>
      ) : null}
      <span className="text-caption text-graphite">{card.label}</span>
      <div className="flex items-baseline justify-between gap-3">
        <span className={card.quote ? "font-display text-[1.0625rem] leading-snug italic" : keep ? "font-display text-[1.375rem] leading-tight" : "text-small font-medium"}>
          {card.text}
        </span>
        {card.price ? <span className="shrink-0 text-small tabular-nums">{card.price}</span> : null}
      </div>
      {card.reason ? (
        <span
          className="absolute -bottom-3 left-3 inline-flex items-center gap-1.5 rounded-tag bg-accent px-2 py-1 text-caption font-medium whitespace-nowrap text-on-accent"
          style={{ opacity: marked, transform: `scale(${0.9 + 0.1 * marked})` }}
        >
          <CrossMark className="size-3" />
          {card.reason}
        </span>
      ) : null}
    </div>
  );
}
