// The change of a product's price since the day before (20/11/2026), as the panel card and page say
// it: "↓ R$ 80", "↑ R$ 30", "igual". Only a drop is good news; the copy carries the direction, so the
// color never has to (the tone has no green or red for status).
import { reais } from "@/tone/shared";

export function priceDelta(best: number | null, previous: number | null): { text: string; good: boolean } | null {
  if (best === null || previous === null) return null;
  const difference = Math.round((best - previous) * 100) / 100;
  if (Math.abs(difference) < 0.5) return { text: "igual", good: false };
  return difference < 0
    ? { text: `↓ ${reais(-difference)}`, good: true }
    : { text: `↑ ${reais(difference)}`, good: false };
}
