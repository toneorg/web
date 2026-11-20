// Gerado de toneorg/server@461cdca1a56f (packages/shared/src/agent.ts). Não edite aqui.
// The conversation protocol between the web and the server.
//
// The web posts a turn and reads a stream of server-sent events until `done` or
// `error`. Every tool runs on the server, so a turn is never left waiting on the
// screen. The conversation lives on the server, so a turn only carries what is new.
import * as z from "zod";
import { AnswerRatingValue } from "./answer-rating";
import { ProgressEvent } from "./progress";
import { ResearchResult } from "./research";

export const ToolCall = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.unknown()),
});
export type ToolCall = z.infer<typeof ToolCall>;

/**
 * A product the person picked from a component to talk about next. It travels with the
 * message; it came from a component of this conversation, so it is store data, not orders.
 */
export const PickedProduct = z.object({
  url: z.string().max(2000),
  title: z.string().min(1).max(300),
  price: z.number().nonnegative().nullable(),
  image: z.string().max(2000).nullable(),
});
export type PickedProduct = z.infer<typeof PickedProduct>;

/**
 * The message a person answers by "Responder": where it is (session and, when the screen knows it,
 * the stored message id) and what it said, so the server reads that part of the conversation again.
 */
export const ReplyTo = z.object({
  sessionId: z.string().min(1).max(60),
  /** The stored message (`messageId` of a transcript line); missing for a line said in this visit. */
  messageId: z.string().min(1).max(30).optional(),
  role: z.enum(["user", "assistant"]),
  /** The text as the screen shows it, cut: the quote drawn with the reply, and the key when there is no id. */
  text: z.string().min(1).max(600),
});
export type ReplyTo = z.infer<typeof ReplyTo>;

export const TurnInput = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message"),
    text: z.string().min(1).max(4000),
    /** Explicit action after editing store preferences: replay the last saved research request in this conversation. */
    repeatResearch: z.boolean().optional(),
    /** T07: a reference photo of this conversation that goes with the message. */
    photoId: z.string().min(1).max(60).optional(),
    /** The product the person picked in the conversation, shown above the composer. */
    product: PickedProduct.optional(),
    /** Where the message came from: "watch" is the "Novo painel" sheet, a request to draft a watch now. */
    intent: z.enum(["watch"]).optional(),
    /** With intent "watch": the draft the message answers, so the agent adjusts it instead of drafting another. */
    watchId: z.string().min(1).max(60).optional(),
    /** Stores picked with @ in the composer: this message's searches look only there. */
    stores: z.array(z.string().min(3).max(80)).max(10).optional(),
    /** The message this one answers ("Responder" on a message). */
    replyTo: ReplyTo.optional(),
  }),
  z.object({
    type: z.literal("ui_answer"),
    /** One answer per question of the component: a quiz or a set of sliders sends several at once. */
    answers: z
      .array(z.object({ memoryKey: z.string().max(60), question: z.string().max(100), answer: z.string().max(200) }))
      .min(1)
      .max(8),
  }),
]);
export type TurnInput = z.infer<typeof TurnInput>;

export const TurnRequest = z.object({
  sessionId: z.string(),
  input: TurnInput,
});
export type TurnRequest = z.infer<typeof TurnRequest>;

/** A component from a conversation saved before OpenUI: the name of the old UI tool and its arguments. */
export const UiComponent = z.object({
  id: z.string(),
  name: z.string(),
  props: z.record(z.string(), z.unknown()),
});
export type UiComponent = z.infer<typeof UiComponent>;

/**
 * The kinds of step a turn goes through, for the live line of the web: understanding the message,
 * what was understood, searching the stores, reading photos, comparing, choosing, writing, and the
 * other tools (reviews, decision, watch).
 */
export const StatusStep = z.enum(["understand", "intent", "search", "photos", "compare", "pick", "write", "tool"]);
export type StatusStep = z.infer<typeof StatusStep>;

export const AgentEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("research_result"), result: ResearchResult }),
  /** T13: a step of a research run, numbered per run; partial results arrive as new revisions. */
  z.object({ type: z.literal("progress"), progress: ProgressEvent }),
  z.object({ type: z.literal("text"), delta: z.string() }),
  z.object({ type: z.literal("memory_saved"), key: z.string(), value: z.string() }),
  /**
   * What the tone is doing now, said to the person while the turn runs (20/11/2026): each status
   * closes the one before it. `doneText` is how the step reads once it is over ("Olhou 12 fotos");
   * `done` marks a statement that is already over when it arrives ("Entendi: …").
   */
  z.object({
    type: z.literal("status"),
    text: z.string(),
    step: StatusStep.optional(),
    doneText: z.string().optional(),
    done: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("done"),
    costUsd: z.number(),
    spentTodayUsd: z.number(),
    /** The turn that ended, so the screen can put the thumbs under its answer. */
    turn: z.number().int().min(1).optional(),
  }),
  z.object({
    type: z.literal("error"),
    code: z.enum(["budget_exceeded", "model_failed", "bad_request", "internal"]),
    message: z.string(),
  }),
]);
export type AgentEvent = z.infer<typeof AgentEvent>;

/** When the line was said (ISO), for the day separators of the web's single chat. Older servers leave it out. */
const SaidAt = z.string().optional();

/** One line of the conversation as the panel shows it when a session is reopened. */
export const TranscriptItem = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("user"),
    text: z.string(),
    /** The stores picked with @ for this message (domains), drawn with it again when it is reopened. */
    stores: z.array(z.string()).optional(),
    /** The message it answered, drawn above it as a quote. */
    replyTo: ReplyTo.optional(),
    /** The stored message, for "Responder" (see ReplyTo). */
    messageId: z.string().optional(),
    at: SaidAt,
  }),
  z.object({
    kind: z.literal("assistant"),
    text: z.string(),
    messageId: z.string().optional(),
    /** The turn it answers (how many messages the person had sent); the greeting has none. */
    turn: z.number().int().min(1).optional(),
    /** The thumb the person gave this turn, if any. */
    rating: AnswerRatingValue.optional(),
    at: SaidAt,
  }),
  z.object({ kind: z.literal("ui"), component: UiComponent, at: SaidAt }),
  /** What the server said instead of an answer (the model failed, the balance ran out). */
  z.object({ kind: z.literal("notice"), text: z.string(), at: SaidAt }),
]);
export type TranscriptItem = z.infer<typeof TranscriptItem>;
