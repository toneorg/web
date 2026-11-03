// Gerado de toneorg/extension@dafb8f78d22e (packages/shared/src/tracking.ts). Não edite aqui.
// The events the panel records for the test week (requisitos §4). Each one is
// small and typed, so the dashboard can count them without guessing.
import * as z from "zod";
import { BROWSER_TOOL_NAMES } from "./tools";

/** Where a recommended product's link was clicked. */
export const ClickSource = z.enum([
  "product_card",
  "comparison",
  "generated_ui",
  "decision_board",
  "research_run",
  "history",
]);
export type ClickSource = z.infer<typeof ClickSource>;
/** Where on the screen a product link was, sent with the click. */
export interface ClickWhere {
  source: ClickSource;
  position?: number | null;
  offerId?: string | null;
  runId?: string | null;
  recommended?: boolean | null;
}

export const TrackEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("browser_action_completed"),
    tool: z.enum(BROWSER_TOOL_NAMES),
    parentRequestId: z.uuidv4().optional(),
    outcome: z.enum(["ok", "error", "cancelled", "declined"]),
    durationMs: z.number().finite().min(0).max(600_000),
  }),
  z.object({ type: z.literal("panel_opened"), site: z.string().nullable() }),
  // The surface, the store and the time since the options were shown are added by the server.
  z.object({
    type: z.literal("recommendation_clicked"),
    url: z.string().max(2000),
    title: z.string().max(300),
    source: ClickSource.optional(),
    /** Place in the list the person saw, from 0. */
    position: z.number().int().min(0).max(99).nullable().optional(),
    offerId: z.string().max(80).nullable().optional(),
    runId: z.string().max(80).nullable().optional(),
    /** Whether the server or the agent recommended this offer, when the screen knows. */
    recommended: z.boolean().nullable().optional(),
  }),
  z.object({
    type: z.literal("recommendation_rejected"),
    url: z.string(),
    title: z.string(),
    reason: z.enum(["preco", "estilo", "qualidade", "tamanho", "outro"]),
  }),
  z.object({ type: z.literal("product_viewed"), url: z.string(), title: z.string(), price: z.number().nullable() }),
  z.object({ type: z.literal("added_to_cart"), url: z.string(), title: z.string(), price: z.number().nullable() }),
  z.object({
    type: z.literal("purchase_reported"),
    bought: z.boolean(),
    url: z.string().nullable(),
    title: z.string().nullable(),
  }),
  z.object({ type: z.literal("session_rated"), rating: z.number().int().min(1).max(5), comment: z.string().max(500) }),
  /** Síntese de reviews: the person opened a review on YouTube, at the moment cited. */
  z.object({ type: z.literal("review_link_opened"), videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/) }),
  z.object({ type: z.literal("action_interrupted") }),
  z.object({ type: z.literal("action_failed"), tool: z.string(), error: z.string().max(500) }),
  z.object({ type: z.literal("action_declined"), tool: z.string() }),
  // The comparison task: the same kind of purchase with and without the agent.
  z.object({
    type: z.literal("benchmark_started"),
    benchmarkId: z.string(),
    mode: z.enum(["solo", "assisted"]),
    task: z.string().max(200),
  }),
  z.object({
    type: z.literal("benchmark_step"),
    benchmarkId: z.string(),
    step: z.enum(["navigation", "search", "click"]),
  }),
  // The feedback button (web and extension): the person's own words, to the team on purpose.
  z.object({
    type: z.literal("feedback_submitted"),
    kind: z.enum(["bug", "idea", "missing"]),
    message: z.string().trim().min(1).max(2000),
    /** The screen it was sent from (a path on the web, a view in the extension). */
    path: z.string().max(200).optional(),
    /** PostHog's session id on the web, so the feedback links to the replay of that moment. */
    replaySessionId: z.string().max(100).optional(),
  }),
  // An error the screen caught (a crash of the panel, an unhandled rejection). The message is
  // kept with the account for the team; only where and what kind go on to the analytics.
  z.object({
    type: z.literal("client_error"),
    where: z.string().max(100),
    errorType: z.string().max(60),
    message: z.string().max(500),
  }),
  z.object({
    type: z.literal("benchmark_finished"),
    benchmarkId: z.string(),
    mode: z.enum(["solo", "assisted"]),
    seconds: z.number().min(0),
    steps: z.number().int().min(0),
    effort: z.number().int().min(1).max(5),
    confidence: z.number().int().min(1).max(5),
    found: z.boolean(),
  }),
]);
export type TrackEvent = z.infer<typeof TrackEvent>;

export const TrackRequest = z.object({
  sessionId: z.string().nullable(),
  events: z.array(TrackEvent).min(1).max(50),
});
export type TrackRequest = z.infer<typeof TrackRequest>;
