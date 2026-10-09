import { MONK } from "@/lib/tones";
import { SWATCH } from "./swatch";

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

/**
 * One pass of the list. Each question is followed by a swatch dot instead of
 * a bullet. The `seam` pass exists only so the loop has no visible join.
 */
function Pass({ seam }: { seam?: boolean }) {
  return (
    <ul
      aria-hidden={seam}
      className={`flex shrink-0 items-center motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-4 ${
        seam ? "motion-reduce:hidden" : ""
      }`}
    >
      {QUESTIONS.map((question, i) => (
        <li key={question} className="flex items-center">
          <span className="display-md px-6 italic sm:px-8">{question}</span>
          <span
            aria-hidden
            className={`size-3.5 ${SWATCH}`}
            style={{ background: MONK[(i * 3 + 4) % MONK.length] }}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * The noise in her head, passing by. Hovering pauses it. With reduced motion
 * the questions stand still and wrap, so all ten can still be read.
 */
export function QuestionsMarquee() {
  return (
    <div className="overflow-hidden text-muted">
      <div className="marquee flex w-max hover:[animation-play-state:paused] motion-reduce:w-auto">
        <Pass />
        <Pass seam />
      </div>
    </div>
  );
}
