"use client";

import { useEffect, useReducer, useRef } from "react";
import { useLoopAllowed } from "@/lib/motion";
import { order } from "@/lib/stagger";
import { ChatIcon } from "./icons";

// Invented requests and tone's reply to each. Together they show what the
// product does: it remembers, it browses the store, it reads the calendar
// when connected, it watches a price, and it never pays.
const EXCHANGES = [
  {
    request: "Um relógio até R$ 800 que não pareça esportivo",
    reply: "Abri 14 na Amazon. Três combinam com o que você já usa.",
  },
  {
    request: "Tênis de corrida pra treino leve",
    reply: "No seu 42, com amortecimento macio como o último que você comprou. Separei quatro.",
  },
  {
    request: "Uma cafeteira de presente, até R$ 300",
    reply: "O aniversário é no sábado. Estas duas chegam até sexta.",
  },
  {
    request: "Me avisa se esse fone baixar de R$ 400",
    reply: "Combinado. Eu olho todo dia e te escrevo quando baixar.",
  },
  {
    request: "Pode comprar pra mim?",
    reply: "Eu deixo no carrinho. Quem paga é sempre você.",
  },
];

type Ticker = { turn: number; typed: number; replied: boolean };
type Phase = "typing" | "reading" | "replied";

/** How long each phase lasts before the next tick. */
const DELAY: Record<Phase, number> = { typing: 38, reading: 1300, replied: 3800 };

/** Starts on a finished exchange, so the first paint already shows the whole idea. */
const START: Ticker = { turn: 0, typed: EXCHANGES[0].request.length, replied: true };

function phaseOf({ turn, typed, replied }: Ticker): Phase {
  if (typed < EXCHANGES[turn].request.length) return "typing";
  return replied ? "replied" : "reading";
}

/** One step of the loop: type a character, then answer, then move to the next request. */
function tick(state: Ticker): Ticker {
  const phase = phaseOf(state);
  if (phase === "typing") return { ...state, typed: state.typed + 1 };
  if (phase === "reading") return { ...state, replied: true };
  return { turn: (state.turn + 1) % EXCHANGES.length, typed: 0, replied: false };
}

/** tone's side of the exchange. Every bubble shares one grid cell (see below). */
const BUBBLE = "col-start-1 row-start-1 w-fit self-start rounded-panel rounded-ss-md bg-white";

/**
 * The product in miniature: she asks for something, tone goes looking, tone
 * answers. Decorative, so it is hidden from assistive tech and described once
 * in plain words instead.
 */
export function RequestTicker() {
  const ref = useRef<HTMLDivElement>(null);
  const running = useLoopAllowed(ref);
  const [state, advance] = useReducer(tick, START);
  const phase = phaseOf(state);

  // `state` is a new object after every tick, so each tick schedules the next.
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(advance, DELAY[phase]);
    return () => clearTimeout(timer);
  }, [running, state, phase]);

  return (
    <div ref={ref} className="w-full max-w-[26rem]">
      <p className="sr-only">
        Exemplo: você pede um relógio até R$ 800 e a tone responde que abriu 14 na Amazon e que
        três combinam com o que você já usa.
      </p>

      <div aria-hidden className="flex flex-col gap-2.5">
        {/* Fixed width, like a field: only the text inside it changes. */}
        <p className="flex min-h-12 max-w-full items-center gap-2.5 rounded-full bg-wine px-5 text-ui text-coral-50">
          <ChatIcon className="size-4 shrink-0" />
          <span className="truncate font-normal">
            {EXCHANGES[state.turn].request.slice(0, state.typed)}
          </span>
          <span
            className={`-ms-2 h-4 w-px shrink-0 bg-coral-50 ${phase === "typing" ? "" : "blink"}`}
          />
        </p>

        {/*
          Every reply is laid out in the same cell and only the current one is
          shown, so the cell is always as tall as the longest reply and the
          headline below never moves, at any screen width.
        */}
        <div className="grid">
          {EXCHANGES.map(({ reply }, turn) => (
            <p
              key={reply}
              className={`${BUBBLE} display-sm max-w-[22rem] px-5 py-3.5 ${
                phase === "replied" && turn === state.turn ? "rise" : "invisible"
              }`}
            >
              {reply}
            </p>
          ))}
          {phase === "reading" ? (
            <p className={`${BUBBLE} rise flex items-center gap-1.5 px-5 py-5`}>
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="thinking size-1.5 rounded-full bg-wine"
                  style={order(dot)}
                />
              ))}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
