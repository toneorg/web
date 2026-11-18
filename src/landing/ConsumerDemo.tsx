"use client";
// The opening demo of the home page: a person asks for a chair, tone reads and
// compares, and answers with the why and what the other option gives up. It plays
// the steps of the product, not a decoration (DESIGN.md: movement with a motive).
import { BellIcon, CheckMark } from "./icons";
import { useSequence } from "./motion";

const REASONS = [
  "O assento sobe até 54 cm: cabe na sua altura.",
  "Apoio lombar com ajuste de altura, para as costas.",
  "Fica dentro do seu limite.",
];

// ms after each step: question, reading reviews, comparing, verdict, three reasons, then the trade-off.
const STEPS = [900, 1100, 1300, 700, 500, 500, 600];

export function ConsumerDemo() {
  const { ref, step } = useSequence<HTMLDivElement>(STEPS, 5200);
  const shows = (n: number) => step >= n;

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-xl">
      <div className="overflow-hidden rounded-card bg-surface shadow-raised ring-4 ring-ink/5">
        <div className="flex items-center gap-2 border-b border-rule px-5 py-3">
          <span aria-hidden className="size-2.5 rounded-full bg-rule" />
          <span aria-hidden className="size-2.5 rounded-full bg-rule" />
          <span aria-hidden className="size-2.5 rounded-full bg-rule" />
          <span className="ms-2 text-caption text-graphite">Conversa com a tone</span>
        </div>

        <div aria-hidden className="flex min-h-[29rem] flex-col gap-4 p-5 sm:min-h-[27rem] sm:p-6">
          {shows(1) ? (
            <p className="step-in max-w-[85%] self-end rounded-panel rounded-ee-md bg-ink px-4 py-3 text-small text-on-ink">
              Preciso de uma cadeira para trabalhar 8 horas por dia. Tenho 1,85 m e dor nas costas. Até R$ 1.500.
            </p>
          ) : (
            <p className="max-w-[85%] self-end rounded-panel rounded-ee-md bg-sunken px-4 py-3 text-small text-graphite">
              <span className="inline-flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="dot-pulse size-1.5 rounded-full bg-graphite" style={{ ["--i" as string]: i }} />
                ))}
              </span>
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            {shows(2) ? <Progress done={shows(3)}>Lendo 214 avaliações</Progress> : null}
            {shows(3) ? <Progress done={shows(4)}>Comparando 12 cadeiras em 6 lojas</Progress> : null}
          </div>

          {shows(4) ? (
            <div className="step-in flex flex-col gap-4 rounded-panel bg-paper p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-thumb bg-sunken text-graphite">
                  <ChairDrawing />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-caption text-graphite">Eu começaria pela</p>
                  <p className="font-display text-[1.5rem] leading-tight text-ink">Cadeira Apoio Pro</p>
                  <p className="text-small text-ink tabular-nums">R$ 1.390</p>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {REASONS.map((reason, index) =>
                  shows(5 + index) ? (
                    <li key={reason} className="step-in flex items-start gap-2.5 text-small text-ink">
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                        <CheckMark className="size-2.5" />
                      </span>
                      {reason}
                    </li>
                  ) : null,
                )}
              </ul>
              {shows(7) ? (
                <p className="step-in border-t border-rule pt-3 text-small text-graphite">
                  <span className="font-medium text-ink">Por que não a Linha Flex?</span> É R$ 210 mais barata, mas o assento
                  para em 48 cm.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      {/* After the answer: she keeps watching the price. A satellite over the window's corner, wide screens only. */}
      <div
        aria-hidden
        className={`absolute -bottom-20 -left-10 hidden w-60 flex-col gap-2 rounded-panel bg-surface p-4 shadow-[var(--shadow-raised),0_18px_40px_-18px_var(--color-scrim)] transition-[opacity,translate] duration-300 ease-soft lg:flex ${
          shows(7) ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-full bg-accent-soft text-accent-text">
            <BellIcon className="size-3.5" />
          </span>
          <p className="text-caption font-medium text-ink">De olho no preço</p>
        </div>
        <svg viewBox="0 0 200 40" className="h-9 w-full overflow-visible text-accent">
          <defs>
            <linearGradient id="demo-watch" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="currentColor" stopOpacity="0.25" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 12 L40 14 L80 10 L120 16 L160 15 L200 30 L200 40 L0 40 Z" fill="url(#demo-watch)" />
          <path d="M0 12 L40 14 L80 10 L120 16 L160 15 L200 30" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="200" cy="30" r="3.5" fill="currentColor" />
        </svg>
        <p className="text-caption text-graphite">Avisa se baixar de R$ 1.300.</p>
      </div>
      {/* The same story for screen readers, once. */}
      <p className="sr-only">
        Exemplo: a pessoa pede uma cadeira para trabalhar 8 horas por dia, com 1,85 m, dor nas costas e até R$ 1.500. A tone
        lê 214 avaliações, compara 12 cadeiras em 6 lojas e recomenda a Cadeira Apoio Pro, de R$ 1.390, porque o assento
        sobe até 54 cm, o apoio lombar tem ajuste de altura e o preço cabe no limite. A Linha Flex é R$ 210 mais barata,
        mas o assento para em 48 cm.
      </p>
    </div>
  );
}

function Progress({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <p className="step-in flex items-center gap-2 text-caption text-graphite">
      {done ? (
        <CheckMark className="size-3.5 text-accent-text" />
      ) : (
        <span className="inline-flex w-3.5 justify-center gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="dot-pulse size-1 rounded-full bg-graphite" style={{ ["--i" as string]: i }} />
          ))}
        </span>
      )}
      {children}
    </p>
  );
}

function ChairDrawing() {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className="size-9" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 6h14a2 2 0 0 1 2 2v11H11V8a2 2 0 0 1 2-2Z" />
      <path d="M9 22h22M20 22v8M13 34l7-4 7 4M14 26l-3-4M26 26l3-4" />
    </svg>
  );
}
