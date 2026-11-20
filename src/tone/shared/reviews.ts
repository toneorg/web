// Gerado de toneorg/server@9e0e9003d62b (packages/shared/src/reviews.ts). Não edite aqui.
// Síntese de reviews: reviews read for the person (spec 2026-11-03, ADR 0002):
// YouTube videos by their captions and, since 15/11/2026, pages of the web
// (blogs, Reddit threads, buyers' reviews in stores) found on Google. A run is
// started by the agent or the button and ends apart from the turn, so the
// research results never wait for it. Channel names, titles, sites and quotes
// come from third parties: the surfaces show them as plain text and the chat
// model never reads them, only the summaries the server validated.
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
    .describe(
      "A mesma busca em inglês, usada só se faltarem reviews em português (sem ela, a busca em português é repetida em inglês).",
    ),
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

/** A page of the web read for a run: w1, w2… in the order it was read. */
const SOURCE_ID = /^w\d{1,2}$/;

/** blog: blogs and review sites; reddit: a thread; store: a store's product page with buyers' reviews. */
export const ReviewSourceKind = z.enum(["blog", "reddit", "store"]);
export type ReviewSourceKind = z.infer<typeof ReviewSourceKind>;

export const ReviewSource = z.object({
  id: z.string().regex(SOURCE_ID),
  kind: ReviewSourceKind,
  title: z.string().max(200),
  /** The host, without "www.". */
  site: z.string().max(80),
  /** HTTPS only; it opens only when the person clicks it. */
  url: z
    .string()
    .max(500)
    .refine((url) => url.startsWith("https://"), "só https"),
  /** The rating Google shows for the page (stores and review sites), 0 to 5. */
  rating: z.number().min(0).max(5).nullable().default(null),
  ratingCount: z.number().int().min(0).nullable().default(null),
});
export type ReviewSource = z.infer<typeof ReviewSource>;

export const ReviewClaim = z.object({
  id: z.string().min(1).max(40),
  /** A claim comes from a video (videoId) or from a page of the web (sourceId), never both. */
  videoId: z.string().regex(VIDEO_ID).optional(),
  sourceId: z.string().regex(SOURCE_ID).optional(),
  /** The product it is about, as brand and model; null when it is about the category. */
  product: z.string().max(100).nullable(),
  topic: z.string().min(1).max(60),
  polarity: z.enum(["positive", "negative", "neutral"]),
  /** What was said, in a sentence written by tone's extractor. */
  summary: z.string().min(1).max(240),
  /** The words of the video or page, shown to the person only. */
  quote: z.string().max(240).nullable(),
  /** The moment of the video; 0 for a page. */
  atSeconds: z.number().int().min(0),
});
export type ReviewClaim = z.infer<typeof ReviewClaim>;

/** The video or page a claim came from. */
export const claimSource = (claim: Pick<ReviewClaim, "videoId" | "sourceId">): string =>
  claim.videoId ?? claim.sourceId ?? "";

/** One line of the progress: what is being read now, as fixed server text. */
export const ReviewStage = z.object({
  kind: z.enum(["video", "reddit", "web"]),
  status: z.enum(["running", "done", "empty", "failed"]),
  message: z.string().max(120),
});
export type ReviewStage = z.infer<typeof ReviewStage>;

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
  /** Pages of the web read (runs before 15/11/2026 have none). */
  sources: z.array(ReviewSource).max(12).default([]),
  claims: z.array(ReviewClaim).max(200),
  /** YouTube, Reddit and the rest of the web, each with its own progress. */
  stages: z.array(ReviewStage).max(4).default([]),
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

const STOP = new Set(["a", "o", "e", "de", "da", "do", "das", "dos", "com", "para", "the", "of", "for", "and", "by"]);
const UNITS = /^(ml|l|g|kg|mg|oz|cm|mm|m|gb|tb|mb|w|v|mah|pol|un|unidades?)$/;
const MEASURE = /^\d+([.,]\d+)?(ml|l|g|kg|mg|oz|cm|mm|m|gb|tb|mb|w|v|mah)$/;
/** Words that name the kind of product or its concentration, not which product it is. */
const GENERIC = new Set([
  "eau",
  "toilette",
  "parfum",
  "edt",
  "edp",
  "perfume",
  "colonia",
  "cologne",
  "masculino",
  "feminino",
  "unissex",
  "men",
  "women",
  "homme",
  "femme",
]);

/** The concentration of a fragrance named in a text, to tell Sauvage EDT from Sauvage EDP. */
export function concentration(text: string): string | null {
  const key = ` ${productKey(text)} `;
  if (/ (edt|eau de toilette) /.test(key)) return "edt";
  if (/ (edp|eau de parfum) /.test(key)) return "edp";
  if (/ elixir /.test(key)) return "elixir";
  if (/ (parfum|extrait) /.test(key)) return "parfum";
  return null;
}

/** The words of a product name that tell it apart: no stop words, measures ("100 ml"), kind or concentration. */
export function distinctiveWords(name: string): string[] {
  const words = productKey(name).split(" ").filter(Boolean);
  return words.filter((word, index) => {
    if (STOP.has(word) || GENERIC.has(word) || UNITS.test(word) || MEASURE.test(word)) return false;
    // "100" in "100 ml" is a measure; "15" in "iPhone 15" is the model.
    if (/^\d+([.,]\d+)?$/.test(word) && UNITS.test(words[index + 1] ?? "")) return false;
    return true;
  });
}

/**
 * Whether a claim is about the product asked for. With brand and model, every word of both
 * (`sameProduct`). Without them, as when the person taps "O que dizem os reviews" on a listing
 * title: half of the distinctive words of the query and every model number in it, and never
 * another concentration of the same fragrance.
 */
export function aboutProduct(
  claimProduct: string | null,
  query: string,
  brand?: string | null,
  model?: string | null,
): boolean {
  if (!claimProduct) return false;
  if (model) return sameProduct(claimProduct, brand ?? null, model);
  const wanted = concentration(query);
  const said = concentration(claimProduct);
  if (wanted && said && wanted !== said) return false;
  const words = new Set(productKey(claimProduct).split(" "));
  const distinctive = distinctiveWords(query);
  if (!distinctive.length) return true;
  if (!distinctive.filter((word) => /^\d+$/.test(word)).every((word) => words.has(word))) return false;
  const hits = distinctive.filter((word) => words.has(word)).length;
  return hits >= Math.ceil(distinctive.length / 2);
}

/** The words to search for: the name without measures, which only narrow what reviews talk about. */
export function reviewSearchQuery(query: string): string {
  const cleaned = query
    .replace(/\b\d+([.,]\d+)?\s?(ml|l|g|kg|mg|oz|gb|tb|mah)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length >= 2 ? cleaned : query;
}

/** A claim is about the product when every word of the brand and of the model is in its product. */
export function sameProduct(claimProduct: string | null, brand: string | null, model: string | null): boolean {
  if (!claimProduct || !model) return false;
  const words = new Set(productKey(claimProduct).split(" "));
  const wanted = [...productKey(brand ?? "").split(" "), ...productKey(model).split(" ")].filter(Boolean);
  return wanted.length > 0 && wanted.every((word) => words.has(word));
}
