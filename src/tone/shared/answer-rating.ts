// Gerado de toneorg/extension@73f02e8b0a03 (packages/shared/src/answer-rating.ts). Não edite aqui.
// "Esta resposta ajudou?": under each answer, a thumb up or down. A thumb down opens
// an optional form with ready reasons and a line of the person's own. One rating per
// turn of the conversation (the turn is how many messages the person had sent), so it
// survives a reload and the extension and the web see the same one.
import * as z from "zod";

export const ANSWER_RATING_REASONS = [
  { value: "misunderstood", label: "Não entendeu o pedido" },
  { value: "off_target", label: "Produtos fora do que pedi" },
  { value: "wrong_price_or_link", label: "Preço ou link errado" },
  { value: "incorrect", label: "Informação errada" },
  { value: "few_options", label: "Poucas opções" },
  { value: "too_slow", label: "Demorou demais" },
] as const;

const REASON_VALUES = ANSWER_RATING_REASONS.map((reason) => reason.value) as [
  (typeof ANSWER_RATING_REASONS)[number]["value"],
  ...(typeof ANSWER_RATING_REASONS)[number]["value"][],
];
export const AnswerRatingReason = z.enum(REASON_VALUES);
export type AnswerRatingReason = z.infer<typeof AnswerRatingReason>;

/** What is shown; "none" takes a rating back. */
export const AnswerRatingValue = z.enum(["good", "bad"]);
export type AnswerRatingValue = z.infer<typeof AnswerRatingValue>;

export const ANSWER_COMMENT_MAX = 1000;

/** The event the screen sends to /api/events. */
export const AnswerRatedEvent = z.object({
  type: z.literal("answer_rated"),
  turn: z.number().int().min(1).max(10_000),
  rating: z.enum(["good", "bad", "none"]),
  reasons: z.array(AnswerRatingReason).max(ANSWER_RATING_REASONS.length).optional(),
  comment: z.string().trim().max(ANSWER_COMMENT_MAX).optional(),
  /** PostHog's session id on the web, so a thumb down links to the replay of that moment. */
  replaySessionId: z.string().max(100).optional(),
});
export type AnswerRatedEvent = z.infer<typeof AnswerRatedEvent>;

export const answerReasonLabel = (value: AnswerRatingReason) =>
  ANSWER_RATING_REASONS.find((reason) => reason.value === value)?.label ?? value;
