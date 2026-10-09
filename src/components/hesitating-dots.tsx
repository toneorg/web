"use client";

import { useEffect, useRef, useState } from "react";
import { useLoopAllowed } from "@/lib/motion";
import { shadeRange } from "@/lib/tones";

const SHADES = shadeRange(20);

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
 * What a product page gives her to decide with: twenty dots and a name. The
 * selection wanders between neighbors, which is what the insecurity looks like.
 */
export function HesitatingDots() {
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
        {SHADES.map((hex, i) => (
          <span
            key={hex}
            className={`size-5 rounded-full outline-1 -outline-offset-1 outline-black/10 transition-shadow duration-150 ${
              i === selected ? "shadow-[0_0_0_2px_#fff,0_0_0_3.5px_var(--color-wine)]" : ""
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
