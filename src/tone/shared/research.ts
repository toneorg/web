// Gerado de toneorg/extension@e74f243ee87c (packages/shared/src/research.ts). Não edite aqui.
import * as z from "zod";
import { isCheckoutUrl } from "./safety";

const Identifier = z.string().trim().min(1);
const Text = z.string().trim().min(1);
const Timestamp = z.iso.datetime();
const Amount = z.number().nonnegative();
const Currency = z
  .string()
  .regex(/^[A-Z]{3}$/)
  .nullable();

/** Data provenance only; accepting a URL never authorizes opening it. */
const ResearchUrl = z.url().refine((value) => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password && !isCheckoutUrl(value);
}, "A URL deve usar HTTPS, sem credenciais ou checkout.");

function uniqueIdentifiers(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

export const StoreScope = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("unrestricted") }),
  z.object({
    kind: z.literal("explicit"),
    stores: z.array(Identifier).min(1).refine(uniqueIdentifiers, "Lojas repetidas."),
  }),
]);
export type StoreScope = z.infer<typeof StoreScope>;

export const ResearchRequirement = z.object({
  id: Identifier,
  field: Text,
  description: Text,
  priority: z.enum(["required", "preferred", "indifferent"]),
});
export type ResearchRequirement = z.infer<typeof ResearchRequirement>;

export const ResearchIntent = z.object({
  id: Identifier,
  query: Text,
  storeScope: StoreScope,
  requirements: z
    .array(ResearchRequirement)
    .refine((values) => uniqueIdentifiers(values.map((entry) => entry.id)), "Requisitos repetidos."),
});
export type ResearchIntent = z.infer<typeof ResearchIntent>;

export const ResearchProduct = z.object({
  id: Identifier,
  title: Text,
  brand: Text.nullable(),
  model: Text.nullable(),
});
export type ResearchProduct = z.infer<typeof ResearchProduct>;

export const ResearchVariant = z.object({
  id: Identifier,
  productId: Identifier,
  label: Text,
  attributes: z.record(Text, Text),
});
export type ResearchVariant = z.infer<typeof ResearchVariant>;

const OFFER_FIELDS = new Set(["price", "seller", "delivery", "finalTotal"]);

const priceObservation = { originalText: Text, currency: Currency };
export const ResearchPrice = z.discriminatedUnion("kind", [
  z.object({ ...priceObservation, kind: z.literal("full"), amount: Amount }),
  z.object({ ...priceObservation, kind: z.literal("installment"), amount: Amount, count: z.number().int().positive() }),
  z.object({
    ...priceObservation,
    kind: z.literal("unit"),
    amount: Amount,
    quantity: z.number().positive(),
    unit: Text,
  }),
  z
    .object({ ...priceObservation, kind: z.literal("range"), min: Amount, max: Amount })
    .refine((value) => value.min <= value.max, "Faixa de preço invertida."),
  z.object({ ...priceObservation, kind: z.literal("pix"), amount: Amount }),
  z.object({ ...priceObservation, kind: z.literal("unknown") }),
]);
export type ResearchPrice = z.infer<typeof ResearchPrice>;

export const RequirementAssessment = z
  .object({
    requirementId: Identifier,
    status: z.enum(["meets", "does_not_meet", "unknown"]),
    evidenceIds: z.array(Identifier).refine(uniqueIdentifiers, "Evidências repetidas."),
    basis: z.enum(["evidence", "inference", "limitation"]),
    explanation: Text,
  })
  .refine(
    (value) => value.basis !== "evidence" || value.status === "unknown" || value.evidenceIds.length > 0,
    "Uma conclusão baseada em evidência precisa citar sua origem.",
  );
export type RequirementAssessment = z.infer<typeof RequirementAssessment>;

const ObservedFieldEvidence = z.array(Identifier).min(1).refine(uniqueIdentifiers, "Evidências repetidas.");

export const ResearchOffer = z.object({
  id: Identifier,
  variantId: Identifier,
  store: Identifier,
  seller: z.object({ id: Identifier.nullable(), name: Text, evidenceIds: ObservedFieldEvidence }).nullable(),
  url: ResearchUrl,
  price: ResearchPrice,
  priceEvidenceIds: z.array(Identifier).refine(uniqueIdentifiers, "Evidências de preço repetidas."),
  delivery: z
    .object({ originalText: Text, amount: Amount.nullable(), currency: Currency, evidenceIds: ObservedFieldEvidence })
    .nullable(),
  finalTotal: z.object({ amount: Amount, currency: Currency, evidenceIds: ObservedFieldEvidence }).nullable(),
  /** T07: the product image the source listed, for a visual comparison on the server; not shown to the person. */
  imageUrl: ResearchUrl.nullable().optional(),
  assessments: z
    .array(RequirementAssessment)
    .refine((values) => uniqueIdentifiers(values.map((entry) => entry.requirementId)), "Avaliações repetidas."),
});
export type ResearchOffer = z.infer<typeof ResearchOffer>;

const provenance = { source: Text, url: ResearchUrl, observedAt: Timestamp };
export const ResearchEvidence = z.object({
  id: Identifier,
  subjectId: Identifier,
  ...provenance,
  sourceUpdatedAt: Timestamp.nullable(),
  level: z.enum(["index", "origin"]),
  supportedFields: z.array(Text).min(1).refine(uniqueIdentifiers, "Campos repetidos."),
  excerpt: Text,
});
export type ResearchEvidence = z.infer<typeof ResearchEvidence>;

/** An empty response describes a source attempt, never proof a product does not exist. */
export const SourceObservation = z.object({
  id: Identifier,
  ...provenance,
  state: z.enum(["ok", "empty", "partial", "blocked", "stale", "unavailable"]),
  explanation: Text,
});
export type SourceObservation = z.infer<typeof SourceObservation>;

export const ResearchResult = z
  .object({
    schemaVersion: z.literal(1),
    id: Identifier,
    revision: z.number().int().positive(),
    createdAt: Timestamp,
    intent: ResearchIntent,
    products: z.array(ResearchProduct),
    variants: z.array(ResearchVariant),
    offers: z.array(ResearchOffer),
    evidence: z.array(ResearchEvidence),
    sources: z.array(SourceObservation),
  })
  .superRefine((result, context) => {
    const issue = (path: (string | number)[], message: string) => context.addIssue({ code: "custom", path, message });
    const entities = [...result.products, ...result.variants, ...result.offers];
    const allIds = [
      result.id,
      result.intent.id,
      ...result.intent.requirements.map((entry) => entry.id),
      ...entities.map((entry) => entry.id),
      ...result.evidence.map((entry) => entry.id),
      ...result.sources.map((entry) => entry.id),
    ];
    if (!uniqueIdentifiers(allIds)) issue([], "Os identificadores da pesquisa devem ser únicos.");
    const products = new Set(result.products.map((entry) => entry.id));
    const variants = new Map(result.variants.map((entry) => [entry.id, entry]));
    const subjects = new Set(entities.map((entry) => entry.id));
    const evidence = new Map(result.evidence.map((entry) => [entry.id, entry]));
    const requirements = new Map(result.intent.requirements.map((entry) => [entry.id, entry]));
    result.variants.forEach((variant, index) => {
      if (!products.has(variant.productId))
        issue(["variants", index, "productId"], "O produto referenciado não existe.");
    });
    result.evidence.forEach((entry, index) => {
      if (!subjects.has(entry.subjectId)) issue(["evidence", index, "subjectId"], "O sujeito da evidência não existe.");
    });
    result.offers.forEach((offer, index) => {
      const variant = variants.get(offer.variantId);
      if (!variant) issue(["offers", index, "variantId"], "A variante referenciada não existe.");
      const scope = result.intent.storeScope;
      if (scope.kind === "explicit" && !scope.stores.includes(offer.store))
        issue(["offers", index, "store"], "A loja está fora do escopo escolhido pela pessoa.");
      if (offer.price.kind !== "unknown" && offer.priceEvidenceIds.length === 0)
        issue(["offers", index, "priceEvidenceIds"], "Um preço conhecido precisa citar sua evidência.");
      offer.priceEvidenceIds.forEach((id) => {
        const entry = evidence.get(id);
        if (!entry) issue(["offers", index, "priceEvidenceIds"], "A evidência de preço referenciada não existe.");
        else if (entry.subjectId !== offer.id || !entry.supportedFields.includes("price"))
          issue(["offers", index, "priceEvidenceIds"], "A evidência precisa sustentar o preço desta oferta.");
      });
      for (const field of ["seller", "delivery", "finalTotal"] as const) {
        offer[field]?.evidenceIds.forEach((id) => {
          const entry = evidence.get(id);
          const path = ["offers", index, field, "evidenceIds"];
          if (!entry) issue(path, "A evidência referenciada não existe.");
          else if (entry.subjectId !== offer.id || !entry.supportedFields.includes(field))
            issue(path, "A evidência precisa sustentar este campo da própria oferta.");
        });
      }
      const allowedSubjects = new Set([offer.id, offer.variantId, variant?.productId]);
      offer.assessments.forEach((assessment, assessmentIndex) => {
        const path = ["offers", index, "assessments", assessmentIndex];
        const requirement = requirements.get(assessment.requirementId);
        if (!requirement) issue([...path, "requirementId"], "O requisito referenciado não existe.");
        if (
          requirement &&
          assessment.basis === "evidence" &&
          assessment.status !== "unknown" &&
          !assessment.evidenceIds.some((id) => {
            const entry = evidence.get(id);
            return (
              entry &&
              (OFFER_FIELDS.has(requirement.field)
                ? entry.subjectId === offer.id
                : allowedSubjects.has(entry.subjectId)) &&
              entry.supportedFields.includes(requirement.field)
            );
          })
        )
          issue([...path, "evidenceIds"], "A evidência não sustenta o campo deste requisito.");
        if (requirement && assessment.basis === "evidence" && assessment.status !== "unknown") {
          const unknownField =
            requirement.field === "price"
              ? offer.price.kind === "unknown"
              : requirement.field === "seller"
                ? offer.seller === null
                : requirement.field === "delivery"
                  ? offer.delivery === null
                  : requirement.field === "finalTotal"
                    ? offer.finalTotal === null
                    : false;
          if (unknownField)
            issue([...path, "status"], "Um campo desconhecido da oferta não pode ter conclusão confirmada.");
        }
        assessment.evidenceIds.forEach((id) => {
          const entry = evidence.get(id);
          if (!entry) issue([...path, "evidenceIds"], "A evidência referenciada não existe.");
          else if (!allowedSubjects.has(entry.subjectId))
            issue([...path, "evidenceIds"], "A evidência pertence a outra alternativa.");
        });
      });
    });
  });
export type ResearchResult = z.infer<typeof ResearchResult>;

export type RequirementEvaluation = {
  classification: "meets_required" | "does_not_meet_required" | "unknown";
  required: AssessmentGroups;
  preferred: AssessmentGroups;
};
type AssessmentGroups = {
  met: RequirementAssessment[];
  unmet: RequirementAssessment[];
  unknown: RequirementAssessment[];
};

/**
 * Classifies assessments from a result already validated by ResearchResult.
 * Referential integrity and supported fields are validated by that envelope;
 * this function does not independently authenticate evidence.
 * Missing, inferred and limited observations cannot settle a requirement.
 */
export function evaluateRequirements(
  requirements: ResearchRequirement[],
  assessments: RequirementAssessment[],
): RequirementEvaluation {
  const groups = (): AssessmentGroups => ({ met: [], unmet: [], unknown: [] });
  const result: RequirementEvaluation = { classification: "meets_required", required: groups(), preferred: groups() };
  for (const requirement of requirements) {
    if (requirement.priority === "indifferent") continue;
    const assessment = assessments.find((entry) => entry.requirementId === requirement.id);
    const normalized: RequirementAssessment = assessment
      ? {
          ...assessment,
          status: assessment.basis === "evidence" && assessment.evidenceIds.length > 0 ? assessment.status : "unknown",
        }
      : {
          requirementId: requirement.id,
          status: "unknown",
          basis: "limitation",
          evidenceIds: [],
          explanation: "Não há evidência suficiente para avaliar este requisito.",
        };
    const group = requirement.priority === "required" ? result.required : result.preferred;
    group[normalized.status === "meets" ? "met" : normalized.status === "does_not_meet" ? "unmet" : "unknown"].push(
      normalized,
    );
  }
  if (result.required.unmet.length) result.classification = "does_not_meet_required";
  else if (result.required.unknown.length) result.classification = "unknown";
  return result;
}
