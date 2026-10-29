// Gerado de toneorg/extension@bc3273ad0a23 (packages/shared/src/agent.ts). Não edite aqui.
// The conversation protocol between the panel and the server.
//
// The panel posts a turn and reads a stream of server-sent events. When the
// model wants to act on the store, the stream ends with `browser_actions`; the
// panel runs them on the tab and posts their results as the next turn, and the
// model carries on. The conversation lives on the server, so a turn only carries
// what is new.
import * as z from "zod";
import { PageContext, PageSnapshot } from "./page";
import { ProgressEvent } from "./progress";
import { ResearchResult } from "./research";

export const ToolCall = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.string(), z.unknown()),
});
export type ToolCall = z.infer<typeof ToolCall>;

export const BrowserResult = z.object({
  id: z.string(),
  ok: z.boolean(),
  /** A fresh snapshot after the action (an action that navigates returns the new page). */
  snapshot: PageSnapshot.nullable(),
  /** What went wrong, in Portuguese, when `ok` is false. */
  error: z.string().nullable(),
  /** The person said no to an action that needed confirmation. */
  declined: z.boolean().default(false),
});
export type BrowserResult = z.infer<typeof BrowserResult>;

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

export const TurnInput = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("message"),
    text: z.string().min(1).max(4000),
    page: PageContext.nullable(),
    /** T07: a reference photo of this conversation that goes with the message. */
    photoId: z.string().min(1).max(60).optional(),
    /** The product the person picked in the conversation, shown above the composer. */
    product: PickedProduct.optional(),
  }),
  z.object({
    type: z.literal("browser_results"),
    results: z.array(BrowserResult).min(1),
  }),
  z.object({
    type: z.literal("ui_answer"),
    /** One answer per question of the component: a quiz or a set of sliders sends several at once. */
    answers: z
      .array(z.object({ memoryKey: z.string().max(60), question: z.string().max(100), answer: z.string().max(200) }))
      .min(1)
      .max(8),
    page: PageContext.nullable(),
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

export const AgentEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("research_result"), result: ResearchResult }),
  /** T13: a step of a research run, numbered per run; partial results arrive as new revisions. */
  z.object({ type: z.literal("progress"), progress: ProgressEvent }),
  z.object({ type: z.literal("text"), delta: z.string() }),
  z.object({ type: z.literal("memory_saved"), key: z.string(), value: z.string() }),
  z.object({ type: z.literal("status"), text: z.string() }),
  z.object({ type: z.literal("browser_actions"), calls: z.array(ToolCall) }),
  z.object({
    type: z.literal("done"),
    costUsd: z.number(),
    spentTodayUsd: z.number(),
  }),
  z.object({
    type: z.literal("error"),
    code: z.enum(["budget_exceeded", "model_failed", "bad_request", "internal"]),
    message: z.string(),
  }),
]);
export type AgentEvent = z.infer<typeof AgentEvent>;

/** One line of the conversation as the panel shows it when a session is reopened. */
export const TranscriptItem = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("user"), text: z.string() }),
  z.object({ kind: z.literal("assistant"), text: z.string() }),
  z.object({ kind: z.literal("ui"), component: UiComponent }),
]);
export type TranscriptItem = z.infer<typeof TranscriptItem>;

/** Plain text for the status line while an action runs (RF2.5). */
export function describeAction(call: Pick<ToolCall, "name" | "args">): string {
  const a = call.args;
  const money = (v: unknown) => (typeof v === "number" ? `R$ ${v.toLocaleString("pt-BR")}` : null);
  switch (call.name) {
    case "read_page":
      return "Lendo a página…";
    case "search":
      return `Buscando “${String(a.query ?? "")}”…`;
    case "set_price_range": {
      const min = money(a.min);
      const max = money(a.max);
      if (min && max) return `Filtrando entre ${min} e ${max}…`;
      if (max) return `Filtrando até ${max}…`;
      if (min) return `Filtrando a partir de ${min}…`;
      return "Tirando o filtro de preço…";
    }
    case "sort":
      return a.by === "price_asc"
        ? "Ordenando do menor preço…"
        : a.by === "price_desc"
          ? "Ordenando do maior preço…"
          : "Ordenando por relevância…";
    case "apply_filter":
      return "Aplicando filtro…";
    case "open_product":
      return "Abrindo o produto…";
    case "go_back":
      return "Voltando…";
    case "select_variant":
      return "Escolhendo a variação…";
    case "add_to_cart":
      return "Adicionando ao carrinho…";
    default:
      return "Trabalhando…";
  }
}
