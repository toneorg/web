import { MONK } from "@/lib/tones";

// What she asks herself with the product page open, in her words
// (../docs/mobile/01 and 02 list them as the jobs she hires tone for).
const QUESTIONS = [
  "Essa loja entrega?",
  "Tá caro?",
  "Tem em outro lugar?",
  "Essa base serve em mim?",
  "Qual tom?",
  "Oxida ao longo do dia?",
  "Pesa na pele oleosa?",
  "Tem algo melhor pra mim?",
  "Me avisa quando baixar?",
  "Qual tom fica entre o 30 e o 40?",
];

/** One pass of the list. Each question is followed by a swatch dot instead of a bullet. */
function Pass({ hidden }: { hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {QUESTIONS.map((question, i) => (
        <li key={question} className="flex items-center">
          <span className="display-md px-6 italic sm:px-8">{question}</span>
          <span
            aria-hidden
            className="size-3.5 rounded-full outline-1 -outline-offset-1 outline-black/10"
            style={{ background: MONK[(i * 3 + 4) % MONK.length] }}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * The noise in her head, passing by. The second pass exists only so the loop
 * has no seam; with reduced motion the band simply stands still.
 */
export function QuestionsMarquee() {
  return (
    <div className="overflow-hidden text-muted">
      <div className="marquee flex w-max">
        <Pass />
        <Pass hidden />
      </div>
    </div>
  );
}
