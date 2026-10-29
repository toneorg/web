// What someone asks themselves with twelve product tabs open, in their words.
const QUESTIONS = [
  "Qual desses vale a pena?",
  "Tá caro?",
  "Tem em outro lugar?",
  "Esse vendedor entrega?",
  "Serve pra mim?",
  "Essas avaliações são de verdade?",
  "E se baixar semana que vem?",
  "Qual a diferença entre esses dois?",
  "Chega antes de sábado?",
  "Tem algo melhor pelo mesmo preço?",
];

/**
 * One pass of the list, each question followed by a small dot instead of a
 * bullet. The `seam` pass exists only so the loop has no visible join.
 */
function Pass({ seam }: { seam?: boolean }) {
  return (
    <ul
      aria-hidden={seam}
      className={`flex shrink-0 items-center motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-4 ${
        seam ? "motion-reduce:hidden" : ""
      }`}
    >
      {QUESTIONS.map((question) => (
        <li key={question} className="flex items-center">
          <span className="display-md px-6 italic sm:px-8">{question}</span>
          <span aria-hidden className="size-2.5 rounded-full bg-coral-300" />
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
