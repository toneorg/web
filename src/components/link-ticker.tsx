"use client";

import { useEffect, useReducer, useRef } from "react";
import { useLoopAllowed } from "@/lib/motion";
import { order } from "@/lib/stagger";
import { LinkPill } from "./link-pill";

// Invented links and tone's reply to each. Together they cover every kind of
// answer: yes, no, a store it does not trust, something it has not learned
// yet, and "can't say".
const EXCHANGES = [
  {
    link: "lojaexemplo.com.br/base-liquida-matte",
    reply: "Loja confiável. E serve em você: seu tom é o 35.",
  },
  {
    link: "outraloja.com.br/base-stick-fps30",
    reply: "Nenhum tom desta base é o seu. Achei duas melhores pelo mesmo preço.",
  },
  {
    link: "marketplace.com.br/vendedor-novo/base",
    reply: "Não conheço esse vendedor. A mesma base está numa loja confiável por R$ 82,90.",
  },
  {
    link: "lojaexemplo.com.br/shampoo-cachos",
    reply: "Loja confiável. De cabelo eu ainda não entendo. Quer que eu aprenda?",
  },
  {
    link: "marcanova.com.br/base-fluida",
    reply: "Não dá para afirmar. Essa marca só lista os tons pelo nome.",
  },
];

type Ticker = { turn: number; typed: number; replied: boolean };
type Phase = "typing" | "reading" | "replied";

/** How long each phase lasts before the next tick. */
const DELAY: Record<Phase, number> = { typing: 38, reading: 1100, replied: 3800 };

/** Starts on a finished exchange, so the first paint already shows the whole idea. */
const START: Ticker = { turn: 0, typed: EXCHANGES[0].link.length, replied: true };

function phaseOf({ turn, typed, replied }: Ticker): Phase {
  if (typed < EXCHANGES[turn].link.length) return "typing";
  return replied ? "replied" : "reading";
}

/** One step of the loop: type a character, then answer, then move to the next link. */
function tick(state: Ticker): Ticker {
  const phase = phaseOf(state);
  if (phase === "typing") return { ...state, typed: state.typed + 1 };
  if (phase === "reading") return { ...state, replied: true };
  return { turn: (state.turn + 1) % EXCHANGES.length, typed: 0, replied: false };
}

/** tone's side of the exchange. Every bubble shares one grid cell (see below). */
const BUBBLE = "col-start-1 row-start-1 w-fit self-start rounded-3xl rounded-ss-lg bg-white";

/**
 * The product in miniature: a link gets pasted, tone reads it, tone answers.
 * Decorative, so it is hidden from assistive tech and described once in plain
 * words instead.
 */
export function LinkTicker() {
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
        Exemplo: você manda o link de um produto e a tone responde se a loja é confiável e, se
        for base, qual tom serve em você.
      </p>

      <div aria-hidden className="flex flex-col gap-2.5">
        {/* Fixed width, like a field: only the text inside it changes. */}
        <LinkPill className="bg-wine text-coral-50">
          <span className="truncate">{EXCHANGES[state.turn].link.slice(0, state.typed)}</span>
          <span
            className={`-ms-2 h-4 w-px shrink-0 bg-coral-50 ${phase === "typing" ? "" : "blink"}`}
          />
        </LinkPill>

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
