// Gerado de toneorg/extension@bc3273ad0a23 (packages/shared/src/photo.ts). Não edite aqui.
// T07: a personal reference photo and what the tone read in it. The photo is
// private and goes through its own path (never `isAllowedImage`, which is for
// store images). Only visible attributes are interpreted; authenticity,
// comfort, material quality and real measures cannot come from a photo.
import * as z from "zod";

/** Attributes a photo can show. Anything else stays unknown, whatever a model says. */
export const VISUAL_KEYS = [
  "categoria",
  "cor",
  "estampa",
  "formato",
  "estilo",
  "acabamento",
  "comprimento",
  "decote",
  "manga",
  "salto",
  "tamanho_aparente",
  "detalhes",
] as const;
export const VisualKey = z.enum(VISUAL_KEYS);
export type VisualKey = z.infer<typeof VisualKey>;
/** Criteria made from a photo live under this field prefix in a decision. */
export const VISUAL_FIELD = "visual";

const Short = z.string().trim().min(1).max(80);

export const PhotoUpload = z.object({
  sessionId: z.string().min(1),
  /** Base64 of the file; the server reads the type from the bytes. */
  data: z.string().min(1).max(6_000_000),
});

export const ReferenceAttribute = z.object({
  key: VisualKey,
  label: Short,
  value: Short,
  certainty: z.enum(["low", "medium", "high"]),
});
export type ReferenceAttribute = z.infer<typeof ReferenceAttribute>;

export const ReferenceInterpretation = z.object({
  category: Short,
  /** A product search query built from what is visible. */
  query: z.string().trim().min(1).max(120),
  attributes: z.array(ReferenceAttribute).max(10),
  /** What the photo does not show or leaves ambiguous, for the person to settle. */
  doubts: z.array(z.string().trim().min(1).max(140)).max(5),
});
export type ReferenceInterpretation = z.infer<typeof ReferenceInterpretation>;

export const PhotoCorrection = z.object({
  attributes: z
    .array(
      z.object({
        key: VisualKey,
        label: Short,
        value: Short,
        priority: z.enum(["required", "preferred", "indifferent"]),
      }),
    )
    .min(1)
    .max(10),
});
export type PhotoCorrection = z.infer<typeof PhotoCorrection>;

export const PhotoSummary = z.object({
  id: z.string(),
  sessionId: z.string(),
  mime: z.enum(["image/jpeg", "image/png", "image/webp"]),
  width: z.number().int(),
  height: z.number().int(),
  createdAt: z.string(),
  expiresAt: z.string(),
  status: z.enum(["uploaded", "interpreted", "failed"]),
  interpretation: ReferenceInterpretation.nullable(),
  correction: PhotoCorrection.nullable(),
});
export type PhotoSummary = z.infer<typeof PhotoSummary>;

/** One candidate as a vision model judged it against the corrected attributes. */
export const VisualJudgment = z.object({
  candidates: z
    .array(
      z.object({
        index: z.number().int().min(1).max(3),
        attributes: z
          .array(
            z.object({
              key: z.string().max(40),
              status: z.enum(["meets", "does_not_meet", "unknown"]),
              note: z.string().max(140),
            }),
          )
          .max(10),
      }),
    )
    .max(3),
});
export type VisualJudgment = z.infer<typeof VisualJudgment>;
