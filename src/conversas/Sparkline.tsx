// The small line on a panel card: the shape of the lowest price per day, no axes, no numbers (the
// card says the price; the panel's page has the full chart). Decorative for screen readers.
import type { WatchPricePoint } from "@/tone/shared";

const WIDTH = 100;
const HEIGHT = 28;
const PAD = 2;

export function Sparkline(props: { points: WatchPricePoint[] }) {
  const { points } = props;
  if (points.length < 2) return null;
  const amounts = points.map((point) => point.amount);
  const min = Math.min(...amounts);
  const span = Math.max(...amounts) - min || 1;
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * WIDTH;
      const y = PAD + (1 - (point.amount - min) / span) * (HEIGHT - PAD * 2);
      return `${index ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg aria-hidden="true" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-7 w-full overflow-visible text-ink">
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
