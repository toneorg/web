// Gerado de toneorg/extension@bc3273ad0a23 (packages/shared/src/budget.ts). Não edite aqui.
import * as z from "zod";

const Money = z.number().nonnegative();
export const CostCategory = z.enum([
  "model",
  "search",
  "details",
  "extraction",
  "image",
  "storage",
  "traffic",
  "email",
  "fees",
  "fixed",
]);
export const BudgetStatement = z.object({
  windowStart: z.iso.datetime(),
  windowEnd: z.iso.datetime(),
  weeklyCapUsd: Money,
  spentUsd: Money,
  reservedUsd: Money,
  availableUsd: Money,
  overheadUsd: Money.nullable(),
  complete: z.boolean(),
  pending: z.array(z.string()),
  resumesAt: z.iso.datetime().nullable(),
  categories: z.array(z.object({ category: CostCategory, spentUsd: Money, reservedUsd: Money })),
  totalsByBasis: z.object({ measuredUsd: Money, estimatedUsd: Money, allocatedUsd: Money }),
  tokens: z.object({ inputTokens: z.number().int().nonnegative(), outputTokens: z.number().int().nonnegative() }),
  indirectCosts: z.array(
    z.object({
      category: CostCategory,
      weeklyUsd: Money.nullable(),
      basis: z.enum(["measured", "estimated", "allocated"]),
      allowance: z.string(),
    }),
  ),
});
export type BudgetStatement = z.infer<typeof BudgetStatement>;
