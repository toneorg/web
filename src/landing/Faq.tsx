// Questions and answers: native disclosure, one rule between rows.
import type { ReactNode } from "react";

export function Faq({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="divide-y divide-rule border-y border-rule">
      {items.map((item) => (
        <details key={item.q} className="group">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 text-subheading text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full bg-surface text-ink shadow-raised transition-[rotate] duration-150 ease-soft group-open:rotate-45"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M8 3v10M3 8h10" />
              </svg>
            </span>
          </summary>
          <div className="max-w-2xl pb-6 text-body text-graphite">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
