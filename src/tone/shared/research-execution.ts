// Gerado de toneorg/server@185a6325947b (packages/shared/src/research-execution.ts). Não edite aqui.
import * as z from "zod";
import { AUDIENCES } from "./fashion";
import { evaluateRequirements, ResearchIntent, ResearchResult } from "./research";

const Short = z.string().trim().min(1).max(60);

/**
 * The motor de descoberta (19/11/2026): what a request describes, in the words of the fashion
 * taxonomy (`fashion.ts`). Optional and additive: without it a search runs as before. The server
 * normalizes every value (synonym to canonical id) and decides the order; the model only describes.
 */
export const DiscoveryIntent = z.object({
  kind: z
    .enum(["identity", "discovery"])
    .describe(
      "identity: o pedido nomeia um produto exato (modelo, volume, capacidade, cor de base). discovery: descreve o que procura (categoria, caimento, tecido, ocasião, gosto), como em roupa e calçado.",
    ),
  category: Short.optional().describe("Categoria da taxonomia: camisa, camiseta, calca, vestido, jaqueta, tenis…"),
  audience: z.enum(AUDIENCES).optional(),
  constraints: z
    .object({
      priceMax: z.number().positive().max(1_000_000).optional().describe("Teto do orçamento em reais."),
      colors: z.array(Short).max(6).optional(),
      materials: z.array(Short).max(6).optional(),
      sizes: z.array(z.string().trim().min(1).max(12)).max(8).optional(),
    })
    .optional()
    .describe("Só o que a pessoa exigiu: o que não cumprir sai da resposta."),
  preferences: z
    .array(
      z.object({
        attribute: Short.describe(
          "caimento, tecido, gola, manga, comprimento, cintura, estampa, ocasiao, estetica, cor",
        ),
        values: z.array(Short).min(1).max(6),
        weight: z
          .number()
          .min(-1)
          .max(1)
          .describe('1 quer muito, 0.5 prefere, negativo evita ("não tão largas": caimento wide_leg com -0.7).'),
      }),
    )
    .max(12)
    .optional(),
  visualDescription: z
    .string()
    .trim()
    .min(3)
    .max(300)
    .optional()
    .describe("Uma frase do que a peça ideal parece, para a busca por semelhança."),
  reference: z
    .union([
      z.object({ offerId: z.string().trim().min(1).max(200) }),
      z.object({ photoId: z.string().trim().min(1).max(200) }),
    ])
    .optional()
    .describe('Para "parecido com este": a oferta ou a foto de referência.'),
  exclude: z
    .array(z.string().trim().min(1).max(500))
    .max(50)
    .optional()
    .describe("Ids ou links de ofertas que a pessoa descartou."),
});
export type DiscoveryIntent = z.infer<typeof DiscoveryIntent>;

export const ResearchRequest = z
  .object({
    discovery: DiscoveryIntent.optional().describe(
      "Em roupa, calçado e acessório, preencha: a tone ordena pela ficha de cada peça e pela semelhança com a descrição.",
    ),
    /** Direct store reads only; this never narrows the index. Missing asks for selection; [] disables direct reads. */
    remoteSelection: z
      .array(z.string().trim().min(1).max(200))
      .optional()
      .describe(
        "Até três domínios relevantes do catálogo configurado para leitura direta; [] quando nenhum for adequado. Separado do escopo explícito da pessoa, que prevalece e pode ter mais lojas.",
      ),
    /**
     * Other ways to search the same request (synonyms, color names, cut, style). Store searches that
     * rank by words (Shein through a web search) read each one and pool the results, so a request with
     * a color or a style is not left to whatever the first wording happens to bring.
     */
    queryVariants: z
      .array(z.string().trim().min(2).max(100))
      .max(4)
      .optional()
      .describe(
        "Até quatro outras formas de buscar o mesmo pedido, em português, como a pessoa escreveria na loja: sinônimos, nomes da cor (off white, marfim, creme), corte, gola, tecido, estilo. Use sempre em roupa, calçado e acessório; omita em produto com modelo exato (iPhone 18, Sauvage EDP).",
      ),
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
    if (request.intent.storeScope.kind === "unrestricted" && (request.remoteSelection?.length ?? 0) > 3)
      context.addIssue({
        code: "custom",
        path: ["remoteSelection"],
        message: "No máximo três lojas na seleção automática.",
      });
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
        const requirements = offer
          ? evaluateRequirements(execution.result.intent.requirements, offer.assessments).classification
          : undefined;
        const actual =
          offer?.identityMatch === "conflict"
            ? "does_not_meet_required"
            : offer?.identityMatch === "unconfirmed" && requirements === "meets_required"
              ? "unknown"
              : requirements;
        if (offer && actual !== classification)
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
