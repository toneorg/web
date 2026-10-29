// Gerado de toneorg/extension@bc3273ad0a23 (packages/shared/src/situation.ts). Não edite aqui.
// The purchase situation of a conversation: what the person is trying to
// solve, not the product. "27 °C" is context; "a wedding at 4 pm, outdoors, on
// grass, I already have golden sandals" is a situation. One per conversation,
// kept by the agent with update_situation, read by every next turn, and closed
// by the person after the occasion ("did it work?"), which becomes episodic
// memory for the next purchases. Fields are generic on purpose: a wedding, a
// trip, a home office or a gift for someone fill the same slots.
import * as z from "zod";

const field = (max: number) => z.string().trim().min(1).max(max).nullable();

export const SituationOutcomeVerdict = z.enum(["funcionou", "mais_ou_menos", "nao_funcionou"]);
export type SituationOutcomeVerdict = z.infer<typeof SituationOutcomeVerdict>;

export const OUTCOME_LABELS: Record<SituationOutcomeVerdict, string> = {
  funcionou: "Funcionou",
  mais_ou_menos: "Mais ou menos",
  nao_funcionou: "Não funcionou",
};

export const SituationOutcome = z.object({
  verdict: SituationOutcomeVerdict,
  note: z.string().trim().max(240).nullable(),
  at: z.string(),
});
export type SituationOutcome = z.infer<typeof SituationOutcome>;

/** The slots of a situation. Every one may be unknown; the agent asks only what would change the ranking. */
export const SituationFields = z.object({
  /** What the person is trying to solve, in their words: "vestido para o casamento da prima". */
  goal: z.string().trim().min(1).max(160),
  /** The occasion or use: casamento, viagem, trabalho, presente, treino, dia a dia. */
  occasion: field(60),
  /** When, as the person said it ("sábado", "novembro", "16h"). */
  when: field(80),
  /** The day, when known, so the tone can ask afterwards how it went (YYYY-MM-DD). */
  date: z.iso.date().nullable(),
  /** Where and in what setting: "Trancoso, ao ar livre, gramado", "escritório", "avião". */
  place: field(120),
  /** Weather or physical conditions that change the choice: calor, frio, chuva, muitas horas em pé. */
  conditions: field(120),
  /** How formal or how demanding: "esporte fino", "casual", "uso profissional". */
  formality: field(80),
  /** Who it is for or who will be there: "para mim", "presente para meu pai", "família". */
  people: field(120),
  /** Who the person wants to be in it, or how they want to feel: "elegante sem parecer formal demais". */
  desiredEffect: field(160),
  /** Budget for this situation, as the person said it. */
  budget: field(80),
  /** Hard limits of this situation: "sem salto fino", "tem que caber na mala de mão". */
  constraints: z.array(z.string().trim().min(1).max(120)).max(8),
  /** Things the person already has and wants to use with it: "sandália dourada", "monitor Dell 27". */
  useWith: z.array(z.string().trim().min(1).max(80)).max(8),
  /** What is still unknown and would change the recommendation, in the agent's words. */
  unknowns: z.array(z.string().trim().min(1).max(120)).max(5),
});
export type SituationFields = z.infer<typeof SituationFields>;

export const SituationStatus = z.enum(["open", "decided", "done"]);
export type SituationStatus = z.infer<typeof SituationStatus>;

export const PurchaseSituation = SituationFields.extend({
  id: z.string(),
  sessionId: z.string(),
  version: z.number().int().min(1),
  status: SituationStatus,
  /** What the person ended up choosing, when they said it. */
  chosen: field(160),
  outcome: SituationOutcome.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type PurchaseSituation = z.infer<typeof PurchaseSituation>;

/** What the agent may send: any slot, plus what was chosen. Lists replace the stored ones. */
export const SituationUpdate = SituationFields.partial().extend({
  chosen: field(160).optional(),
});
export type SituationUpdate = z.infer<typeof SituationUpdate>;

export const SituationOutcomeRequest = z.object({
  verdict: SituationOutcomeVerdict,
  note: z.string().trim().max(240).nullable().optional(),
});
export type SituationOutcomeRequest = z.infer<typeof SituationOutcomeRequest>;

/** Applies an update from the agent. A situation without a goal cannot start. */
export function applySituationUpdate(
  base: PurchaseSituation | null,
  update: SituationUpdate,
  ids: { id: string; sessionId: string; at: string },
): PurchaseSituation {
  const goal = update.goal ?? base?.goal;
  if (!goal) throw new SituationRefused("Uma situação começa pelo objetivo (goal).");
  const empty: Omit<PurchaseSituation, "goal"> = {
    id: ids.id,
    sessionId: ids.sessionId,
    version: 0,
    status: "open",
    occasion: null,
    when: null,
    date: null,
    place: null,
    conditions: null,
    formality: null,
    people: null,
    desiredEffect: null,
    budget: null,
    constraints: [],
    useWith: [],
    unknowns: [],
    chosen: null,
    outcome: null,
    createdAt: ids.at,
    updatedAt: ids.at,
  };
  const current = base ?? { ...empty, goal };
  const defined = Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined));
  const next = PurchaseSituation.parse({
    ...current,
    ...defined,
    goal,
    version: current.version + 1,
    updatedAt: ids.at,
  });
  // Something chosen moves an open situation forward; a closed one stays closed.
  if (next.chosen && next.status === "open") next.status = "decided";
  return next;
}

export class SituationRefused extends Error {}

const LABELS: [keyof SituationFields, string][] = [
  ["occasion", "Ocasião"],
  ["when", "Quando"],
  ["place", "Onde"],
  ["conditions", "Condições"],
  ["formality", "Formalidade"],
  ["people", "Para quem / com quem"],
  ["desiredEffect", "Como quer se sentir"],
  ["budget", "Orçamento"],
];

/** The facts of a situation as label and value, in a stable order, for screens and the prompt. */
export function situationFacts(situation: SituationFields): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];
  for (const [key, label] of LABELS) {
    const value = situation[key];
    if (typeof value === "string" && value) facts.push({ label, value });
  }
  if (situation.constraints.length) facts.push({ label: "Restrições", value: situation.constraints.join("; ") });
  if (situation.useWith.length) facts.push({ label: "Vai usar com", value: situation.useWith.join("; ") });
  return facts;
}

/** The situation as the model reads it each turn, with what is still unknown. */
export function situationSummary(situation: PurchaseSituation): string {
  const lines = [`Objetivo: ${situation.goal} (id ${situation.id}, versão ${situation.version}, ${situation.status})`];
  for (const fact of situationFacts(situation)) lines.push(`${fact.label}: ${fact.value}`);
  if (situation.date) lines.push(`Data: ${situation.date}`);
  if (situation.chosen) lines.push(`Escolhido: ${situation.chosen}`);
  lines.push(
    situation.unknowns.length
      ? `Ainda desconhecido e relevante: ${situation.unknowns.join("; ")}`
      : "Nada relevante em aberto.",
  );
  return lines.join("\n");
}

/** A past situation as one line of episodic memory: what it was, what was chosen, how it went. */
export function episodeLine(situation: PurchaseSituation): string {
  const when = situation.date ?? situation.when ?? situation.createdAt.slice(0, 10);
  const chosen = situation.chosen ? ` → ${situation.chosen}` : "";
  const outcome = situation.outcome
    ? ` → ${OUTCOME_LABELS[situation.outcome.verdict].toLowerCase()}${situation.outcome.note ? `: "${situation.outcome.note}"` : ""}`
    : "";
  return `${situation.goal} (${when})${chosen}${outcome}`;
}

/** Whether the occasion is over and the person has not said how it went. */
export function awaitsOutcome(situation: PurchaseSituation, today: string): boolean {
  return situation.outcome === null && situation.status !== "done" && situation.date !== null && situation.date < today;
}

/** Whether the person can say how it went: something was chosen, or the day has passed. */
export function canRecordOutcome(situation: PurchaseSituation, today: string): boolean {
  return situation.outcome === null && (situation.status === "decided" || awaitsOutcome(situation, today));
}

/** Today in São Paulo, as YYYY-MM-DD, the calendar the dates of situations are written in. */
export const todayInBrazil = (at = new Date()) => at.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
