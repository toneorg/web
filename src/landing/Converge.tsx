// Many sources, one answer: thin lines leaving the whole width and meeting at a
// coral point, drawn by the scroll where the browser has a view timeline
// (`line-draw` in globals.css) and simply drawn where it has not. A server
// component: no script, nothing to hydrate.

const LINES = 9;
/** The two lines in coral: the reasons that make it to the answer. */
const LIT = new Set([2, 6]);

export function Converge({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-48 w-full [view-timeline-name:--converge] sm:h-72 ${className}`}>
      <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        {Array.from({ length: LINES }, (_, index) => {
          const x = (index * 1000) / (LINES - 1);
          return (
            <path
              key={index}
              d={`M${x} 0 C${x} 170, 500 120, 500 300`}
              pathLength="1"
              fill="none"
              strokeWidth={LIT.has(index) ? 1.5 : 1}
              vectorEffect="non-scaling-stroke"
              className={`line-draw ${LIT.has(index) ? "stroke-accent" : "stroke-edge"}`}
              style={{ ["--i" as string]: Math.abs(index - (LINES - 1) / 2) }}
            />
          );
        })}
      </svg>
      <span className="absolute bottom-0 left-1/2 size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-accent shadow-glow" />
    </div>
  );
}
