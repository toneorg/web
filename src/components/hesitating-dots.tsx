"use client";

import { useEffect, useRef, useState } from "react";
import { useLoopAllowed } from "@/lib/motion";
import { SWATCH, SWATCH_PICKED_SMALL } from "./swatch";

// The path her eye takes across the swatches: close shades, back and forth,
// never settling. Names are invented, in the style product pages use.
const HESITATION = [
  { dot: 11, name: "Bege médio 03" },
  { dot: 12, name: "Mel 04" },
  { dot: 10, name: "Bege claro 02" },
  { dot: 11, name: "Bege médio 03" },
  { dot: 13, name: "Caramelo 05" },
  { dot: 12, name: "Mel 04" },
  { dot: 9, name: "Areia 01" },
];

const HOP_MS = 850;

/**
 * What a product page gives her to decide with: a row of dots and a name. The
 * selection wanders between neighbors, which is what the insecurity looks
 * like. `shades` comes from the server, so the colors are computed once.
 */
export function HesitatingDots({ shades }: { shades: readonly string[] }) {
  const ref = useRef<HTMLElement>(null);
  const running = useLoopAllowed(ref);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setStep((s) => (s + 1) % HESITATION.length), HOP_MS);
    return () => clearInterval(timer);
  }, [running]);

  const { dot: selected, name } = HESITATION[step];

  return (
    <figure ref={ref} className="rounded-4xl bg-coral-50 p-6 sm:p-8">
      <p className="text-[0.9375rem] text-muted">
        Cor: <span className="text-wine">{name}</span>
      </p>
      <div aria-hidden className="mt-4 flex flex-wrap gap-2.5">
        {shades.map((hex, i) => (
          <span
            key={hex}
            className={`size-5 transition-shadow duration-150 ${SWATCH} ${
              i === selected ? SWATCH_PICKED_SMALL : ""
            }`}
            style={{ background: hex }}
          />
        ))}
      </div>
      <figcaption className="mt-6 leading-snug">
        É isto que a página te dá para decidir: vinte bolinhas e um nome.
      </figcaption>
    </figure>
  );
}
