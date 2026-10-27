// Gerado de toneorg/extension@e74f243ee87c (packages/shared/src/decision.ts). Não edite aqui.
// T08: the state of a purchase decision, kept between turns and surfaces.
// Criteria say who set them (the person or the agent); an agent's inference is
// never a confirmed requirement until the person says so. Candidates are copies
// of research offers with the evidence that backs each conclusion, so the
// comparison cites sources instead of trusting what a model wrote. Shortlist and
// discards record who decided and why; the agent cannot undo the person.
import * as z from "zod";
import {
  evaluateRequirements,
  RequirementAssessment,
  ResearchPrice,
  ResearchRequirement,
  type ResearchResult,
} from "./research";

const Identifier = z.string().trim().min(1).max(120);
const Reason = z.string().trim().min(1).max(200);
export const DecisionActor = z.enum(["person", "agent"]);
export type DecisionActor = z.infer<typeof DecisionActor>;

export const DecisionCriterion = ResearchRequirement.extend({
  origin: DecisionActor,
  /** An agent's criterion counts as a requirement only after the person confirms it. */
  confirmed: z.boolean(),
});
export type DecisionCriterion = z.infer<typeof DecisionCriterion>;

/** What backs a conclusion: a specification, an offer condition, an opinion from reviews. */
export const DecisionEvidence = z.object({
  id: Identifier,
  /** `visual`: what a vision model saw in the source's product image (T07). */
  kind: z.enum(["specification", "offer", "review", "visual"]),
  source: z.string(),
  url: z.url(),
  observedAt: z.iso.datetime(),
  level: z.enum(["index", "origin"]),
  fields: z.array(z.string()),
  excerpt: z.string(),
});
export type DecisionEvidence = z.infer<typeof DecisionEvidence>;

export const DecisionCandidate = z.object({
  /** The offer id of the research result; unique across runs. */
  id: Identifier,
  offerId: Identifier,
  runId: Identifier,
  title: z.string(),
  store: z.string(),
  url: z.url(),
  variantLabel: z.string(),
  seller: z.string().nullable(),
  price: ResearchPrice,
  /** T07: the source's product image, compared on the server against a reference photo. */
  imageUrl: z.url().nullable().optional(),
  observedAt: z.iso.datetime(),
  assessments: z.array(RequirementAssessment),
  evidence: z.array(DecisionEvidence),
});
export type DecisionCandidate = z.infer<typeof DecisionCandidate>;

export const DecisionMark = z.object({
  candidateId: Identifier,
  by: DecisionActor,
  reason: z.string(),
  at: z.iso.datetime(),
});
export type DecisionMark = z.infer<typeof DecisionMark>;

export const DecisionState = z.object({
  schemaVersion: z.literal(1),
  id: Identifier,
  sessionId: Identifier,
  /** Grows with every change: a client writes against the version it saw. */
  version: z.number().int().positive(),
  query: z.string().max(200),
  criteria: z.array(DecisionCriterion).max(20),
  candidates: z.array(DecisionCandidate).max(30),
  shortlist: z.array(DecisionMark),
  discarded: z.array(DecisionMark),
  updatedAt: z.iso.datetime(),
});
export type DecisionState = z.infer<typeof DecisionState>;

const CriterionInput = ResearchRequirement.extend({ id: Identifier, description: z.string().trim().min(1).max(200) });
export const DecisionOp = z.discriminatedUnion("type", [
  z.object({ type: z.literal("set_query"), query: z.string().trim().min(1).max(200) }),
  z.object({ type: z.literal("set_criterion"), criterion: CriterionInput }),
  z.object({ type: z.literal("confirm_criterion"), criterionId: Identifier }),
  z.object({ type: z.literal("remove_criterion"), criterionId: Identifier }),
  z.object({ type: z.literal("add_candidates"), candidates: z.array(DecisionCandidate).max(12) }),
  z.object({ type: z.literal("assess"), candidateId: Identifier, assessment: RequirementAssessment }),
  z.object({ type: z.literal("shortlist"), candidateId: Identifier, reason: Reason }),
  z.object({ type: z.literal("discard"), candidateId: Identifier, reason: Reason }),
  z.object({ type: z.literal("reconsider"), candidateId: Identifier }),
]);
export type DecisionOp = z.infer<typeof DecisionOp>;

/** What the person may change from a screen: no candidates or assessments, which come from research. */
export const PersonDecisionOp = z.discriminatedUnion("type", [
  DecisionOp.options[0],
  DecisionOp.options[1],
  DecisionOp.options[2],
  DecisionOp.options[3],
  DecisionOp.options[6],
  DecisionOp.options[7],
  DecisionOp.options[8],
]);
export const DecisionPatch = z.object({
  version: z.number().int().positive(),
  ops: z.array(PersonDecisionOp).min(1).max(10),
});

export class DecisionRefused extends Error {}

export function emptyDecision(input: { id: string; sessionId: string; query: string; at?: Date }): DecisionState {
  return {
    schemaVersion: 1,
    id: input.id,
    sessionId: input.sessionId,
    version: 1,
    query: input.query.slice(0, 200),
    criteria: [],
    candidates: [],
    shortlist: [],
    discarded: [],
    updatedAt: (input.at ?? new Date()).toISOString(),
  };
}

const REVIEW_FIELDS = new Set(["rating", "reviews", "review", "opinion"]);
const OFFER_FIELDS = new Set(["price", "seller", "delivery", "finalTotal"]);

/** Copies offers of a research result into candidates, with the evidence about them. Unknown ids are refused. */
export function candidatesFromResult(result: ResearchResult, offerIds: string[]): DecisionCandidate[] {
  return offerIds.map((offerId) => {
    const offer = result.offers.find((entry) => entry.id === offerId);
    if (!offer) throw new DecisionRefused(`A oferta ${offerId} não está nesta pesquisa.`);
    const variant = result.variants.find((entry) => entry.id === offer.variantId);
    const product = result.products.find((entry) => entry.id === variant?.productId);
    const subjects = new Set([offer.id, offer.variantId, variant?.productId]);
    const evidence = result.evidence
      .filter((entry) => subjects.has(entry.subjectId))
      .map((entry) => ({
        id: entry.id,
        kind: entry.supportedFields.some((field) => REVIEW_FIELDS.has(field))
          ? ("review" as const)
          : entry.supportedFields.every((field) => OFFER_FIELDS.has(field))
            ? ("offer" as const)
            : ("specification" as const),
        source: entry.source,
        url: entry.url,
        observedAt: entry.observedAt,
        level: entry.level,
        fields: entry.supportedFields,
        excerpt: entry.excerpt,
      }));
    const priceEvidence = result.evidence.find((entry) => offer.priceEvidenceIds.includes(entry.id));
    return {
      id: offer.id,
      offerId: offer.id,
      runId: result.id,
      title: product?.title ?? variant?.label ?? "Oferta",
      store: offer.store,
      url: offer.url,
      variantLabel: variant?.label ?? "Variante não identificada",
      seller: offer.seller?.name ?? null,
      price: offer.price,
      imageUrl: offer.imageUrl ?? null,
      observedAt: priceEvidence?.observedAt ?? result.createdAt,
      assessments: offer.assessments,
      evidence,
    };
  });
}

/** Applies changes in order. A refused change refuses the whole batch; the input state is not touched. */
export function applyDecisionOps(
  state: DecisionState,
  ops: DecisionOp[],
  by: DecisionActor,
  at: Date = new Date(),
): DecisionState {
  const next: DecisionState = structuredClone(state);
  const when = at.toISOString();
  const candidate = (id: string) => {
    const found = next.candidates.find((entry) => entry.id === id);
    if (!found) throw new DecisionRefused(`Candidata ${id} não existe nesta decisão.`);
    return found;
  };
  const personMark = (list: DecisionMark[], id: string) => list.find((m) => m.candidateId === id && m.by === "person");
  for (const op of ops.map((entry) => DecisionOp.parse(entry))) {
    switch (op.type) {
      case "set_query":
        next.query = op.query;
        break;
      case "set_criterion": {
        const index = next.criteria.findIndex((entry) => entry.id === op.criterion.id);
        const existing = next.criteria[index];
        if (existing && existing.origin === "person" && by === "agent")
          throw new DecisionRefused("O critério foi definido pela pessoa; só ela pode mudá-lo.");
        const criterion: DecisionCriterion = { ...op.criterion, origin: by, confirmed: by === "person" };
        if (existing && (existing.description !== criterion.description || existing.field !== criterion.field))
          for (const entry of next.candidates)
            entry.assessments = entry.assessments.filter((a) => a.requirementId !== criterion.id);
        if (index >= 0) next.criteria[index] = criterion;
        else next.criteria.push(criterion);
        break;
      }
      case "confirm_criterion": {
        if (by !== "person") throw new DecisionRefused("Só a pessoa confirma um critério.");
        const criterion = next.criteria.find((entry) => entry.id === op.criterionId);
        if (!criterion) throw new DecisionRefused("Critério inexistente.");
        criterion.confirmed = true;
        break;
      }
      case "remove_criterion": {
        const criterion = next.criteria.find((entry) => entry.id === op.criterionId);
        if (!criterion) throw new DecisionRefused("Critério inexistente.");
        if (criterion.origin === "person" && by === "agent")
          throw new DecisionRefused("O critério foi definido pela pessoa; só ela pode removê-lo.");
        next.criteria = next.criteria.filter((entry) => entry.id !== op.criterionId);
        break;
      }
      case "add_candidates":
        for (const entry of op.candidates) {
          const index = next.candidates.findIndex((c) => c.id === entry.id);
          if (index >= 0) next.candidates[index] = entry;
          else next.candidates.push(entry);
        }
        if (next.candidates.length > 30) throw new DecisionRefused("No máximo 30 candidatas por decisão.");
        break;
      case "assess": {
        if (!next.criteria.some((entry) => entry.id === op.assessment.requirementId))
          throw new DecisionRefused("Critério inexistente.");
        const target = candidate(op.candidateId);
        const known = new Set(target.evidence.map((entry) => entry.id));
        if (op.assessment.evidenceIds.some((id) => !known.has(id)))
          throw new DecisionRefused("A avaliação cita evidência que não pertence a esta candidata.");
        target.assessments = [
          ...target.assessments.filter((a) => a.requirementId !== op.assessment.requirementId),
          op.assessment,
        ];
        break;
      }
      case "shortlist":
      case "discard": {
        candidate(op.candidateId);
        const from = op.type === "shortlist" ? next.discarded : next.shortlist;
        if (by === "agent" && personMark(from, op.candidateId))
          throw new DecisionRefused("A pessoa já decidiu sobre esta candidata; só ela pode mudar.");
        next.shortlist = next.shortlist.filter((m) => m.candidateId !== op.candidateId);
        next.discarded = next.discarded.filter((m) => m.candidateId !== op.candidateId);
        (op.type === "shortlist" ? next.shortlist : next.discarded).push({
          candidateId: op.candidateId,
          by,
          reason: op.reason,
          at: when,
        });
        break;
      }
      case "reconsider":
        candidate(op.candidateId);
        if (
          by === "agent" &&
          (personMark(next.discarded, op.candidateId) || personMark(next.shortlist, op.candidateId))
        )
          throw new DecisionRefused("A pessoa já decidiu sobre esta candidata; só ela pode mudar.");
        next.shortlist = next.shortlist.filter((m) => m.candidateId !== op.candidateId);
        next.discarded = next.discarded.filter((m) => m.candidateId !== op.candidateId);
        break;
    }
  }
  next.version = state.version + 1;
  next.updatedAt = when;
  return DecisionState.parse(next);
}

/** Index and origin observations older than this need a refresh before deciding on price or stock. */
export const DECISION_STALE_MS = 24 * 3600_000;

export interface ComparedCell {
  criterionId: string;
  status: "meets" | "does_not_meet" | "unknown";
  basis: "evidence" | "inference" | "limitation";
  explanation: string;
  evidence: DecisionEvidence[];
  /** Indifferent criteria are shown but never weigh in. */
  counts: boolean;
}

export interface ComparedCandidate {
  candidate: DecisionCandidate;
  classification: "meets_required" | "does_not_meet_required" | "unknown";
  cells: ComparedCell[];
  price: { comparable: boolean; cheapest: boolean; note: string | null };
  stale: boolean;
  mark: DecisionMark | null;
  state: "shortlisted" | "discarded" | "open";
}

export interface DecisionComparison {
  criteria: (DecisionCriterion & { effectivePriority: DecisionCriterion["priority"] })[];
  candidates: ComparedCandidate[];
  /** Cheapest candidate per variant, only where at least two prices of the same kind compare. */
  cheapestByVariant: Record<string, string>;
}

const effective = (criterion: DecisionCriterion): DecisionCriterion["priority"] =>
  criterion.origin === "agent" && !criterion.confirmed && criterion.priority === "required"
    ? "preferred"
    : criterion.priority;

const amountOf = (price: DecisionCandidate["price"]) =>
  price.kind === "full" || price.kind === "pix" ? price.amount : null;

/** The comparison the screens draw: per candidate, per criterion, with comparable prices only. */
export function compareDecision(state: DecisionState, now: Date = new Date()): DecisionComparison {
  const criteria = state.criteria.map((criterion) => ({ ...criterion, effectivePriority: effective(criterion) }));
  const requirements = criteria.map((criterion) => ({ ...criterion, priority: criterion.effectivePriority }));
  const groups = new Map<string, DecisionCandidate[]>();
  for (const candidate of state.candidates) {
    if (amountOf(candidate.price) === null || !candidate.price.currency) continue;
    const key = `${candidate.variantLabel}|${candidate.price.kind}|${candidate.price.currency}`;
    groups.set(key, [...(groups.get(key) ?? []), candidate]);
  }
  const cheapestByVariant: Record<string, string> = {};
  const cheapest = new Set<string>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const best = [...group].sort((a, b) => (amountOf(a.price) ?? 0) - (amountOf(b.price) ?? 0))[0];
    if (!best) continue;
    cheapest.add(best.id);
    cheapestByVariant[best.variantLabel] = best.id;
  }
  const compared = state.candidates.map((candidate): ComparedCandidate => {
    const evaluation = evaluateRequirements(requirements, candidate.assessments);
    const cells = criteria.map((criterion): ComparedCell => {
      const raw = candidate.assessments.find((a) => a.requirementId === criterion.id);
      const proven = raw?.basis === "evidence" && raw.evidenceIds.length > 0;
      return {
        criterionId: criterion.id,
        status: proven && raw ? raw.status : "unknown",
        basis: raw?.basis ?? "limitation",
        explanation: raw?.explanation ?? "Sem evidência para este critério.",
        evidence: candidate.evidence.filter((entry) => raw?.evidenceIds.includes(entry.id)),
        counts: criterion.effectivePriority !== "indifferent",
      };
    });
    const price = candidate.price;
    const note =
      price.kind === "installment"
        ? "Valor de parcela: não se compara com preço à vista."
        : price.kind === "unit"
          ? "Preço por unidade: compare só com o mesmo tamanho."
          : price.kind === "range"
            ? "Faixa de preço: o valor depende da opção."
            : price.kind === "unknown"
              ? "Preço desconhecido."
              : !price.currency
                ? "Moeda não informada."
                : price.kind === "pix"
                  ? "Preço no Pix."
                  : null;
    const shortlisted = state.shortlist.find((m) => m.candidateId === candidate.id) ?? null;
    const discarded = state.discarded.find((m) => m.candidateId === candidate.id) ?? null;
    return {
      candidate,
      classification: evaluation.classification,
      cells,
      price: {
        comparable: amountOf(price) !== null && Boolean(price.currency),
        cheapest: cheapest.has(candidate.id),
        note,
      },
      stale: now.getTime() - Date.parse(candidate.observedAt) > DECISION_STALE_MS,
      mark: shortlisted ?? discarded,
      state: shortlisted ? "shortlisted" : discarded ? "discarded" : "open",
    };
  });
  return { criteria, candidates: compared, cheapestByVariant };
}

/** A short text of the decision for the model, so a resumed conversation does not ask again. */
export function decisionSummary(state: DecisionState, now: Date = new Date()): string {
  const comparison = compareDecision(state, now);
  const priority = { required: "obrigatório", preferred: "desejável", indifferent: "indiferente" } as const;
  const lines = [`Decisão em andamento (id ${state.id}, versão ${state.version}): ${state.query}`];
  for (const criterion of comparison.criteria)
    lines.push(
      `- Critério ${criterion.id}: ${criterion.description} — ${priority[criterion.effectivePriority]}${
        criterion.origin === "agent" && !criterion.confirmed ? " (sugerido por você, sem confirmação da pessoa)" : ""
      }`,
    );
  for (const row of comparison.candidates) {
    const mark = row.mark
      ? ` — ${row.state === "shortlisted" ? "na lista curta" : "descartada"} por ${row.mark.by === "person" ? "a pessoa" : "você"}: ${row.mark.reason}`
      : "";
    lines.push(
      `- Candidata ${row.candidate.id}: ${row.candidate.title} (${row.candidate.variantLabel}, ${row.candidate.store}) — ${row.classification}${row.stale ? ", dados antigos" : ""}${mark}`,
    );
  }
  return lines.join("\n");
}

/** What the agent may send: the same changes, with offers named by id from the server's research, never copied. */
export const AgentDecisionOp = z.discriminatedUnion("type", [
  DecisionOp.options[0],
  DecisionOp.options[1],
  DecisionOp.options[3],
  z.object({
    type: z.literal("add_offers"),
    offerIds: z
      .array(Identifier)
      .min(1)
      .max(12)
      .describe("IDs de oferta devolvidos por research_products nesta conversa."),
  }),
  DecisionOp.options[5],
  DecisionOp.options[6],
  DecisionOp.options[7],
  DecisionOp.options[8],
]);
export type AgentDecisionOp = z.infer<typeof AgentDecisionOp>;
