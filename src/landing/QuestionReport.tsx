"use client";
// The store page's report of doubts: the questions people asked drop in, one
// after another, and land on their row while the card scrolls by; each bar
// fills once its question is in. Aggregated by design: questions and counts,
// never people.
import { SparkIcon } from "./icons";
import { span, useScrollProgress } from "./scroll";

type Question = { q: string; n: number; gap: string };

export function QuestionReport({ questions }: { questions: Question[] }) {
  const { ref, progress } = useScrollProgress<HTMLDivElement>("view");
  const max = Math.max(...questions.map((item) => item.n));

  return (
    <div ref={ref} className="rounded-card bg-surface p-3 shadow-raised ring-4 ring-ink/5">
      <div className="flex items-center justify-between px-4 pt-3 pb-4">
        <p className="text-subheading text-ink">Esta semana</p>
        <span className="rounded-tag bg-sunken px-2 py-0.5 text-caption font-semibold text-ink">1.284 conversas</span>
      </div>
      <ul className="flex flex-col gap-1">
        {questions.map((item, index) => {
          const landed = span(progress, 0.1 + index * 0.08, 0.28 + index * 0.08);
          const filled = span(progress, 0.22 + index * 0.08, 0.4 + index * 0.08);
          return (
            <li key={item.q} className="flex flex-col gap-2.5 rounded-panel px-4 py-3.5 even:bg-paper">
              <div
                className="flex items-baseline justify-between gap-4"
                style={{ opacity: landed, transform: `translateY(${-32 * (1 - landed)}px)` }}
              >
                <q className="font-display text-[1.25rem] leading-snug text-ink italic">{item.q}</q>
                <span className="shrink-0 text-small text-graphite tabular-nums">{item.n} pessoas</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                <div
                  className="h-full origin-left rounded-full bg-accent"
                  style={{ width: `${(item.n / max) * 100}%`, transform: `scaleX(${filled})` }}
                />
              </div>
              <p className="text-caption text-graphite">{item.gap}</p>
            </li>
          );
        })}
      </ul>
      <div className="m-1 mt-3 flex items-start gap-3 rounded-panel bg-accent-soft p-4 text-ink">
        <SparkIcon className="mt-0.5 size-4 shrink-0 text-accent-text" />
        <p className="text-small">
          <span className="font-semibold">Sugestão:</span> acrescente “sem fragrância” às fichas de 14 produtos.
        </p>
      </div>
    </div>
  );
}
