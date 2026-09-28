"use client";

import { useEffect, useRef, useState } from "react";
import { toneNumber } from "@/lib/forms";
import { MONK, isDeep } from "@/lib/tones";
import { buttonClass } from "./button";

function shareUrl() {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window === "undefined" ? "" : window.location.origin);
  return `${origin}/?ref=convite`;
}

// Card background when the person picked "Não sei dizer": all ten tones.
const ALL_TONES = `linear-gradient(90deg, ${MONK.map((c, i) => `${c} ${i * 10}% ${(i + 1) * 10}%`).join(", ")})`;

/** Success state of the waitlist: the person's tone passport and a way to share. */
export function Passport({
  tone,
  headingRef,
}: {
  tone: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const n = toneNumber(tone);
  const hex = n ? MONK[n - 1] : null;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const url = shareUrl();
  const message = `Entrei na lista da tone: ela mostra o tom certo de base de cada marca a partir de uma selfie. ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2400);
    } catch {
      // Clipboard can be blocked (permissions, plain http). The WhatsApp link still works.
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-8" aria-live="polite">
      <div
        className="flex aspect-[1.6] w-full max-w-md flex-col justify-between rounded-[28px] p-6 outline outline-1 -outline-offset-1 outline-black/10 sm:p-7"
        style={{
          background: hex ?? ALL_TONES,
          color: hex && isDeep(hex) ? "#fff" : "var(--color-ink)",
        }}
      >
        <p className="display text-[1.5rem]">tone</p>
        <div>
          <p className="text-[0.95rem] opacity-80">Passaporte de tom</p>
          <p className="display-sm text-[2.25rem] tabular-nums">{n ? `Tom ${n}` : "Tom a descobrir"}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 ref={headingRef} tabIndex={-1} className="display-sm text-[1.75rem] focus:outline-none">
          Seu lugar está guardado.
        </h3>
        <p className="max-w-[34rem] text-[1.05rem] leading-relaxed text-graphite">
          Vamos escrever para o seu e-mail quando a tone abrir. Se você marcou o teste, a gente
          chama no WhatsApp.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <p className="font-semibold">Conhece alguém que já errou a base?</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass({ size: "sm" })}
          >
            Mandar no WhatsApp
          </a>
          <button type="button" onClick={copy} className={buttonClass({ variant: "outline", size: "sm" })}>
            <span aria-live="polite">{copied ? "Link copiado" : "Copiar link"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
