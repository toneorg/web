"use client";
// "Toda recomendação vem com o porquê": four everyday purchases, one at a time.
// A segmented control on the bench (components/selection.md), changed by the
// person only: nothing advances by itself.
import { useId, useRef, useState } from "react";
import { CheckMark, CrossMark } from "./icons";

type Example = {
  tab: string;
  asked: string;
  /** "pela" or "pelo", as the name asks. */
  by: string;
  pick: string;
  price: string;
  why: string[];
  other: { name: string; tradeoff: string };
};

const EXAMPLES: Example[] = [
  {
    tab: "Cadeira",
    asked: "Trabalho 8 horas sentado, tenho 1,85 m e dor nas costas. Até R$ 1.500.",
    by: "pela",
    pick: "Cadeira Apoio Pro",
    price: "R$ 1.390",
    why: ["Assento sobe até 54 cm, para a sua altura", "Apoio lombar com ajuste de altura", "Dentro do seu limite"],
    other: { name: "a Linha Flex", tradeoff: "R$ 210 mais barata, mas o assento para em 48 cm." },
  },
  {
    tab: "Tênis de corrida",
    asked: "Corro 5 km três vezes por semana, piso pronado, até R$ 600.",
    by: "pelo",
    pick: "Ritmo 4",
    price: "R$ 549",
    why: ["Controle de pisada para pronação", "Amortecimento para treino diário", "Dentro do seu limite"],
    other: { name: "o Leve 2", tradeoff: "Pesa menos, mas não corrige a pronação." },
  },
  {
    tab: "Jaqueta",
    asked: "Jaqueta para o inverno de Curitiba. Uso M, mas tenho ombro largo. Até R$ 450.",
    by: "pela",
    pick: "Jaqueta Serra",
    price: "R$ 419",
    why: ["Forro térmico para dias de 5 °C", "Ombro mais largo no M, segundo as avaliações", "Dentro do seu limite"],
    other: { name: "a Parka Leve", tradeoff: "Custa menos, mas as avaliações dizem que aperta nos ombros." },
  },
  {
    tab: "Fone",
    asked: "Quero um fone para o metrô e para chamadas no trabalho.",
    by: "pelo",
    pick: "Quieto 300",
    price: "R$ 899",
    why: ["O cancelamento de ruído mais forte da faixa", "Dois microfones por lado, para chamadas", "30 horas de bateria"],
    other: { name: "o Pulse", tradeoff: "Custa menos, mas o microfone some em lugar barulhento." },
  },
  {
    tab: "Hidratante",
    asked: "Pele sensível, quero algo leve e sem perfume.",
    by: "pelo",
    pick: "Gel Calma",
    price: "R$ 79",
    why: ["Sem fragrância", "Textura em gel, a mais leve dos três", "Feito para pele sensível"],
    other: { name: "o Creme Nutri", tradeoff: "Hidrata mais, mas pode pesar no calor." },
  },
];

export function ExampleTabs() {
  const id = useId();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const example = EXAMPLES[active];

  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (active + delta + EXAMPLES.length) % EXAMPLES.length;
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Exemplos de compra"
        onKeyDown={onKeyDown}
        className="flex max-w-full gap-1 self-start overflow-x-auto rounded-full bg-sunken p-1 [scrollbar-width:none]"
      >
        {EXAMPLES.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.tab}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              className={`press min-h-11 shrink-0 rounded-full px-5 text-ui whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                selected ? "bg-surface font-semibold text-ink shadow-raised" : "text-graphite hover:text-ink"
              }`}
            >
              {item.tab}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-tab-${active}`}
        className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch"
      >
        <div key={`q-${active}`} className="step-in flex flex-col justify-between gap-6 rounded-card bg-surface p-6 shadow-raised sm:p-8">
          <p className="text-caption font-medium text-graphite">Você pede</p>
          <q className="font-display text-[1.75rem] leading-[1.15] text-ink italic sm:text-[2rem]">{example.asked}</q>
        </div>

        <div key={`a-${active}`} className="step-in flex flex-col gap-5 rounded-card bg-surface p-6 shadow-raised sm:p-8 [animation-delay:100ms]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <div>
              <p className="text-caption font-medium text-graphite">A tone responde</p>
              <p className="mt-1 font-display text-[1.75rem] leading-tight text-ink">
                Eu começaria {example.by} {example.pick}.
              </p>
            </div>
            <p className="text-ui text-ink tabular-nums">{example.price}</p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {example.why.map((reason) => (
              <li key={reason} className="flex items-start gap-3 text-body text-ink">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                  <CheckMark className="size-3" />
                </span>
                {reason}
              </li>
            ))}
          </ul>
          <div className="flex items-start gap-3 rounded-panel bg-paper p-4 text-small text-graphite">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sunken text-graphite">
              <CrossMark className="size-3" />
            </span>
            <p>
              <span className="font-medium text-ink">Por que não {example.other.name}?</span> {example.other.tradeoff}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
