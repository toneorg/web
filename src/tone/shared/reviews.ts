// Gerado de toneorg/extension@3b8a458751e7 (packages/shared/src/reviews.ts). Não edite aqui.
// Síntese de reviews: YouTube reviews read for the person (spec 2026-11-03,
// ADR 0002). A run is started by the agent and ends apart from the turn, so
// the research results never wait for the videos. Channel names, titles and
// quotes come from third parties: the surfaces show them as plain text and
// the chat model never reads them, only the summaries the server validated.
import * as z from "zod";

export const REVIEW_LIMITS = { category: 6, product: 3 } as const;

export const ReviewRequest = z.object({
  subject: z
    .enum(["category", "product"])
    .describe("category: o que importa e modelos citados; product: uma candidata da lista curta."),
  query: z
    .string()
    .min(2)
    .max(120)
    .describe("Busca em português: 'cadeira de escritório ergonômica' ou 'Flexform Uni' (marca e modelo)."),
  queryEn: z
    .string()
    .min(2)
    .max(120)
    .nullable()
    .optional()
    .describe("A mesma busca em inglês, usada só se faltarem reviews em português."),
  brand: z.string().max(60).nullable().optional().describe("Com subject product: a marca."),
  model: z.string().max(80).nullable().optional().describe("Com subject product: o modelo, sem a marca."),
});
export type ReviewRequest = z.infer<typeof ReviewRequest>;

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
export const isYoutubeId = (id: string) => VIDEO_ID.test(id);

export const ReviewVideo = z.object({
  id: z.string().regex(VIDEO_ID),
  title: z.string().max(300),
  channel: z.string().max(100).nullable(),
  views: z.number().int().min(0).nullable(),
  durationSeconds: z.number().int().min(0).nullable(),
  /** About when it was published, from YouTube's "2 years ago". */
  publishedAt: z.iso.datetime().nullable(),
  language: z.enum(["pt", "en"]),
  sponsored: z.boolean(),
  /** Older than 24 months: kept only to fill in. */
  old: z.boolean(),
});
export type ReviewVideo = z.infer<typeof ReviewVideo>;

export const ReviewClaim = z.object({
  id: z.string().min(1).max(40),
  videoId: z.string().regex(VIDEO_ID),
  /** The product it is about, as brand and model; null when it is about the category. */
  product: z.string().max(100).nullable(),
  topic: z.string().min(1).max(60),
  polarity: z.enum(["positive", "negative", "neutral"]),
  /** What was said, in a sentence written by tone's extractor. */
  summary: z.string().min(1).max(240),
  /** The words of the video, shown to the person only. */
  quote: z.string().max(240).nullable(),
  atSeconds: z.number().int().min(0),
});
export type ReviewClaim = z.infer<typeof ReviewClaim>;

const ClaimIds = z.array(z.string().min(1).max(40)).min(1).max(12);
export const ReviewSynthesis = z.object({
  /** What matters when choosing, the base for suggested criteria. */
  matters: z.array(z.object({ topic: z.string().max(60), why: z.string().max(240), claimIds: ClaimIds })).max(8),
  consensus: z
    .array(
      z.object({
        statement: z.string().max(240),
        polarity: z.enum(["positive", "negative", "neutral"]),
        claimIds: ClaimIds,
      }),
    )
    .max(8),
  divergences: z
    .array(
      z.object({
        topic: z.string().max(60),
        note: z.string().max(240),
        positiveIds: ClaimIds,
        negativeIds: ClaimIds,
      }),
    )
    .max(6),
  cautions: z.array(z.object({ statement: z.string().max(240), claimIds: ClaimIds })).max(6),
  products: z.array(z.object({ name: z.string().max(100), note: z.string().max(240), claimIds: ClaimIds })).max(8),
});
export type ReviewSynthesis = z.infer<typeof ReviewSynthesis>;

export const ReviewRunStatus = z.enum(["running", "completed", "insufficient", "failed"]);
export type ReviewRunStatus = z.infer<typeof ReviewRunStatus>;

export const ReviewRunState = z.object({
  runId: z.string(),
  sessionId: z.string(),
  subject: z.enum(["category", "product"]),
  query: z.string(),
  status: ReviewRunStatus,
  /** Fixed server text in Portuguese; never model text. */
  message: z.string().max(200),
  done: z.number().int().min(0),
  total: z.number().int().min(0),
  videos: z.array(ReviewVideo).max(12),
  claims: z.array(ReviewClaim).max(200),
  synthesis: ReviewSynthesis.nullable(),
  startedAt: z.string(),
  updatedAt: z.string(),
});
export type ReviewRunState = z.infer<typeof ReviewRunState>;

export const reviewTerminal = (status: ReviewRunStatus) => status !== "running";

/** A run with no news for this long lost its process. */
export const STALE_REVIEW_MS = 5 * 60_000;

export function staleReview(run: ReviewRunState, now = new Date()): ReviewRunState {
  if (run.status !== "running" || now.getTime() - Date.parse(run.updatedAt) < STALE_REVIEW_MS) return run;
  return { ...run, status: "failed", message: "A leitura dos reviews parou antes de terminar." };
}

/** The YouTube page of a video at a moment; it opens only when the person clicks it. */
export function youtubeAt(videoId: string, seconds: number): string {
  if (!isYoutubeId(videoId)) throw new Error("id de vídeo inválido");
  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.max(0, Math.floor(seconds))}s`;
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${rest}` : `${m}:${rest}`;
}

/** Brand and model as words, to tell whether a claim is about a product. */
export function productKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** A claim is about the product when every word of the brand and of the model is in its product. */
export function sameProduct(claimProduct: string | null, brand: string | null, model: string | null): boolean {
  if (!claimProduct || !model) return false;
  const words = new Set(productKey(claimProduct).split(" "));
  const wanted = [...productKey(brand ?? "").split(" "), ...productKey(model).split(" ")].filter(Boolean);
  return wanted.length > 0 && wanted.every((word) => words.has(word));
}
