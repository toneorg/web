// Gerado de toneorg/server@45eb127c73fd (packages/shared/src/price-signal.ts). Não edite aqui.
// What a price means against its own history (20/11/2026, after researching how price trackers and
// Google Flights judge a deal). One series per product: the lowest confirmed price of each day.
// - The normal price is the median of those daily lows, up to 90 days back (Google Flights: the
//   median of the cheapest prices of the last 12 months).
// - A real drop also matches or beats the lowest price of the previous 30 days: the "prior price"
//   the EU's Omnibus rule demands of a promotion, which defeats "metade do dobro" (raising the price
//   before a sale so the old price looks like a discount).
// - The noise of the product is measured robustly (median absolute deviation), so a price that
//   always swings 15% does not alert on an ordinary dip.
// The alert, the panel's verdict, its card and its page all read this one function.
import * as z from "zod";
import { SIGNIFICANT_DROP, WatchPricePoint, type WatchRule } from "./watch";

export const PRICE_SIGNAL = {
  /** A drop is at least this far below the normal price. */
  drop: SIGNIFICANT_DROP,
  /** Above normal from this far above it. */
  high: 0.05,
  /** A drop or a rise also leaves the ordinary noise: this many spreads from normal. */
  spreadK: 2,
  /** Turns a median absolute deviation into a standard-deviation-like spread. */
  madScale: 1.4826,
  normalDays: 90,
  lowDays: 30,
  /** Days of history before the full method applies. */
  minDays: 3,
  /** After an alert, a new one only this far below the price already announced... */
  realertStep: 0.03,
  /** ...or after the price came back to this share of normal. */
  reset: 0.95,
} as const;

export type DailyLow = { day: string; amount: number };

export const PriceSignal = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("learning"), days: z.number().int().nonnegative() }),
  z.object({
    kind: z.enum(["drop", "normal", "high"]),
    days: z.number().int().nonnegative(),
    normal: z.number(),
    low30: z.number(),
    spread: z.number(),
    /** (normal − current) / normal. */
    belowNormal: z.number(),
  }),
]);
export type PriceSignal = z.infer<typeof PriceSignal>;

const ZONE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar day of an instant in Brazil, as "2026-11-20". */
export function brazilDay(iso: string): string {
  return ZONE.format(new Date(iso));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[middle] as number)
    : ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

const daysBefore = (day: string, count: number) => {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - count);
  return date.toISOString().slice(0, 10);
};

/** Where `current` stands against the daily lows before `today`. */
export function priceSignal(
  current: number,
  history: DailyLow[],
  today: string,
  limits: { drop: number; high: number; spreadK: number } = PRICE_SIGNAL,
): PriceSignal {
  const since = daysBefore(today, PRICE_SIGNAL.normalDays);
  const lowSince = daysBefore(today, PRICE_SIGNAL.lowDays);
  const past = history.filter((point) => point.day < today && point.day >= since && point.amount > 0);
  if (past.length < PRICE_SIGNAL.minDays) return { kind: "learning", days: past.length };
  const amounts = past.map((point) => point.amount);
  const normal = median(amounts);
  const spread = PRICE_SIGNAL.madScale * median(amounts.map((amount) => Math.abs(amount - normal)));
  const recent = past.filter((point) => point.day >= lowSince).map((point) => point.amount);
  const low30 = recent.length ? Math.min(...recent) : Math.min(...amounts);
  const beyondNoise = (distance: number) => spread === 0 || distance >= limits.spreadK * spread;
  const kind =
    current <= normal * (1 - limits.drop) && current <= low30 && beyondNoise(normal - current)
      ? "drop"
      : current >= normal * (1 + limits.high) && beyondNoise(current - normal)
        ? "high"
        : "normal";
  return { kind, days: past.length, normal, low30, spread, belowNormal: (normal - current) / normal };
}

export const WatchSummaryProduct = z.object({
  title: z.string(),
  variantLabel: z.string().nullable(),
  /** The cheapest offer of the reading with nothing that keeps it from counting. */
  best: z
    .object({
      title: z.string(),
      priceText: z.string(),
      amount: z.number(),
      store: z.string(),
      url: z.string(),
      imageUrl: z.string().nullable(),
    })
    .nullable(),
  /** The lowest confirmed price of the last day with a reading before this one. */
  previous: z.number().nullable(),
  signal: PriceSignal.nullable(),
  /** The product's daily lows, the last 30 days. */
  points: z.array(WatchPricePoint),
});
export type WatchSummaryProduct = z.infer<typeof WatchSummaryProduct>;

export const WatchVerdict = z.object({
  kind: z.enum(["good", "normal", "high", "learning", "none"]),
  productIndex: z.number().int().nullable(),
  reason: z.string(),
});
export type WatchVerdict = z.infer<typeof WatchVerdict>;

export const WatchSummary = z.object({
  observedAt: z.string().nullable(),
  verdict: WatchVerdict,
  products: z.array(WatchSummaryProduct),
});
export type WatchSummary = z.infer<typeof WatchSummary>;

/** "R$ 80", "R$ 1.299", "R$ 89,90". */
export function reais(amount: number): string {
  const whole = Number.isInteger(amount);
  return `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 })}`;
}

function goodReason(rule: WatchRule, product: WatchSummaryProduct): string {
  const amount = product.best?.amount ?? 0;
  const condition = rule.condition;
  if (condition.kind === "new_match") return "Apareceram alternativas novas.";
  if (condition.kind === "near_price" || condition.kind === "target_price")
    return amount <= condition.amount
      ? `Abaixo do seu valor de ${reais(condition.amount)}.`
      : `Perto do seu valor de ${reais(condition.amount)}.`;
  const signal = product.signal;
  if (signal && signal.kind !== "learning")
    return `O menor preço em 30 dias, ${reais(Math.round(signal.normal - amount))} abaixo do normal.`;
  return "Caiu desde o primeiro preço que eu vi.";
}

/** What the panel says first: whether this is a good moment, and for which product. */
export function verdictOf(input: {
  rule: WatchRule;
  conditionMet: boolean;
  hitProduct: number | null;
  products: WatchSummaryProduct[];
}): WatchVerdict {
  const { products } = input;
  const priced = products.map((product, index) => ({ product, index })).filter(({ product }) => product.best);
  if (!priced.length) return { kind: "none", productIndex: null, reason: "" };
  const hit = input.hitProduct === null ? undefined : priced.find(({ index }) => index === input.hitProduct);
  if (input.conditionMet && hit)
    return { kind: "good", productIndex: hit.index, reason: goodReason(input.rule, hit.product) };
  const ranked = priced
    .filter(({ product }) => product.signal && product.signal.kind !== "learning")
    .sort((a, b) => ratio(a.product) - ratio(b.product));
  const chosen = ranked[0] ?? priced[0];
  if (!chosen) return { kind: "none", productIndex: null, reason: "" };
  const signal = chosen.product.signal;
  if (input.conditionMet || signal?.kind === "drop")
    return { kind: "good", productIndex: chosen.index, reason: goodReason(input.rule, chosen.product) };
  if (!signal || signal.kind === "learning")
    return {
      kind: "learning",
      productIndex: chosen.index,
      reason: "Com 3 dias de leitura eu digo se o preço está bom.",
    };
  const window = Math.min(signal.days, PRICE_SIGNAL.normalDays);
  return signal.kind === "high"
    ? { kind: "high", productIndex: chosen.index, reason: `Acima do normal dos últimos ${window} dias: vale esperar.` }
    : {
        kind: "normal",
        productIndex: chosen.index,
        reason: `Dentro do normal dos últimos ${window} dias. Eu aviso quando cair.`,
      };
}

const ratio = (product: WatchSummaryProduct) => {
  const signal = product.signal;
  return signal && signal.kind !== "learning" && product.best
    ? product.best.amount / signal.normal
    : Number.POSITIVE_INFINITY;
};
