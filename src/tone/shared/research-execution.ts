// Gerado de toneorg/extension@e74f243ee87c (packages/shared/src/research-execution.ts). Não edite aqui.
import * as z from "zod";
import { evaluateRequirements, ResearchIntent, ResearchResult } from "./research";

export const ResearchRequest = z
  .object({
    intent: ResearchIntent.extend({
      query: z.string().trim().min(1).max(200),
      requirements: ResearchIntent.shape.requirements.refine((items) => items.length <= 12),
    }),
    constraints: z
      .array(
        z.object({
          requirementId: z.string().min(1),
          operator: z.enum(["equals", "contains", "lte", "gte"]),
          value: z.union([z.string().min(1).max(200), z.number().finite()]),
          currency: z
            .string()
            .regex(/^[A-Z]{3}$/)
            .optional(),
        }),
      )
      .max(12),
  })
  .superRefine((request, context) => {
    if (request.intent.storeScope.kind === "explicit" && request.intent.storeScope.stores.length > 5)
      context.addIssue({ code: "custom", message: "No máximo cinco lojas." });
    const seen = new Set<string>();
    for (const [index, constraint] of request.constraints.entries()) {
      const requirement = request.intent.requirements.find((entry) => entry.id === constraint.requirementId);
      if (!requirement || seen.has(constraint.requirementId))
        context.addIssue({
          code: "custom",
          path: ["constraints", index],
          message: "Requisito inexistente ou repetido.",
        });
      seen.add(constraint.requirementId);
      if (constraint.operator === "contains" && typeof constraint.value !== "string")
        context.addIssue({
          code: "custom",
          path: ["constraints", index],
          message: "Texto contido exige valor textual.",
        });
      if (
        requirement?.field === "price" &&
        (typeof constraint.value !== "number" || constraint.value < 0 || !constraint.currency)
      )
        context.addIssue({
          code: "custom",
          path: ["constraints", index],
          message: "Preço exige valor não negativo e moeda.",
        });
      if (["lte", "gte"].includes(constraint.operator) && typeof constraint.value !== "number")
        context.addIssue({ code: "custom", path: ["constraints", index], message: "Comparação exige número." });
    }
  });
export type ResearchRequest = z.infer<typeof ResearchRequest>;
export const ResearchExecution = z
  .object({
    result: ResearchResult,
    outcome: z.enum(["completed", "partial", "budget_exceeded", "cancelled", "unavailable"]),
    diagnostics: z.array(
      z.object({
        source: z.string(),
        code: z.enum([
          "empty",
          "blocked",
          "stale",
          "unavailable",
          "budget_exceeded",
          "cancelled",
          "scope_limited",
          "partial",
        ]),
        message: z.string(),
      }),
    ),
    localComplement: z.object({ needed: z.boolean(), reason: z.string() }),
    recommendedOfferIds: z.array(z.string()),
    unknownOfferIds: z.array(z.string()),
    costUsd: z.number().nonnegative(),
  })
  .superRefine((execution, context) => {
    for (const id of [...execution.recommendedOfferIds, ...execution.unknownOfferIds])
      if (!execution.result.offers.some((offer) => offer.id === id))
        context.addIssue({ code: "custom", message: "Oferta referenciada inexistente." });
    for (const [field, classification] of [
      ["recommendedOfferIds", "meets_required"],
      ["unknownOfferIds", "unknown"],
    ] as const) {
      const ids = execution[field];
      if (new Set(ids).size !== ids.length)
        context.addIssue({ code: "custom", path: [field], message: "Ofertas repetidas." });
      for (const id of ids) {
        const offer = execution.result.offers.find((entry) => entry.id === id);
        if (
          offer &&
          evaluateRequirements(execution.result.intent.requirements, offer.assessments).classification !==
            classification
        )
          context.addIssue({
            code: "custom",
            path: [field],
            message: "Classificação incompatível com os requisitos da oferta.",
          });
      }
    }
  });
export type ResearchExecution = z.infer<typeof ResearchExecution>;
export const ResearchApiRequest = z.object({ sessionId: z.string().min(1), request: ResearchRequest });
