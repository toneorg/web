// Gerado de toneorg/extension@bc3273ad0a23 (packages/shared/src/progress.ts). Não edite aqui.
// T13: what a research run is doing, from real operations only. The server
// numbers each event of a run (`seq`) and sends the partial result as a new
// revision of the same envelope; clients fold both with `reduceResearchRuns`,
// which drops repeats, late arrivals, other conversations and anything after
// the run ended. A run id is the id of its ResearchResult.
import * as z from "zod";
import { ResearchResult } from "./research";

export const ProgressStage = z.enum([
  "started",
  "searching",
  "reading",
  "evaluating",
  "partial_result",
  "blocked",
  "completed",
  "partial",
  "failed",
  "cancelled",
]);
export type ProgressStage = z.infer<typeof ProgressStage>;
/** Ends a run: `partial` kept useful results, `failed` kept none. */
export const TERMINAL_STAGES: ReadonlySet<ProgressStage> = new Set(["completed", "partial", "failed", "cancelled"]);

const Count = z.number().int().nonnegative().nullable();
export const ProgressEvent = z.object({
  runId: z.string().min(1),
  sessionId: z.string().min(1),
  seq: z.number().int().nonnegative(),
  at: z.iso.datetime(),
  stage: ProgressStage,
  /** The technical source of the operation, when the stage is about one. */
  source: z.string().nullable(),
  /** Counts are present only when an operation established them; null is "not known". */
  offers: Count,
  done: Count,
  total: Count,
  /** Fixed server text in Portuguese; never model reasoning. */
  message: z.string().min(1).max(200),
});
export type ProgressEvent = z.infer<typeof ProgressEvent>;

export const ResearchRunState = z.object({
  runId: z.string(),
  sessionId: z.string(),
  seq: z.number().int(),
  stage: ProgressStage,
  message: z.string(),
  source: z.string().nullable(),
  offers: Count,
  done: Count,
  total: Count,
  terminal: z.boolean(),
  startedAt: z.string(),
  updatedAt: z.string(),
  result: ResearchResult.nullable(),
});
export type ResearchRunState = z.infer<typeof ResearchRunState>;

type RunEvent = { type: "progress"; progress: ProgressEvent } | { type: "research_result"; result: ResearchResult };

/** Folds one event into the runs of a conversation. Returns the same object when the event changes nothing. */
export function reduceResearchRuns(
  runs: Record<string, ResearchRunState>,
  event: RunEvent,
  sessionId: string,
): Record<string, ResearchRunState> {
  if (event.type === "progress") {
    const p = event.progress;
    if (p.sessionId !== sessionId) return runs;
    const current = runs[p.runId];
    if (current && (current.terminal || p.seq <= current.seq)) return runs;
    return {
      ...runs,
      [p.runId]: {
        runId: p.runId,
        sessionId,
        seq: p.seq,
        stage: p.stage,
        message: p.message,
        source: p.source,
        offers: p.offers ?? current?.offers ?? null,
        done: p.done ?? current?.done ?? null,
        total: p.total ?? current?.total ?? null,
        terminal: TERMINAL_STAGES.has(p.stage),
        startedAt: current?.startedAt ?? p.at,
        updatedAt: p.at,
        result: current?.result ?? null,
      },
    };
  }
  const result = event.result;
  const current = runs[result.id];
  if (current?.terminal) return runs;
  if (current?.result && result.revision <= current.result.revision) return runs;
  return {
    ...runs,
    [result.id]: {
      runId: result.id,
      sessionId,
      seq: current?.seq ?? -1,
      stage: current?.stage ?? "partial_result",
      message: current?.message ?? "Resultados parciais recebidos.",
      source: current?.source ?? null,
      offers: current?.offers ?? result.offers.length,
      done: current?.done ?? null,
      total: current?.total ?? null,
      terminal: false,
      startedAt: current?.startedAt ?? result.createdAt,
      updatedAt: current?.updatedAt ?? result.createdAt,
      result,
    },
  };
}

/** A run with no news for this long lost its process or its connection. */
export const STALE_RUN_MS = 3 * 60_000;

/** A run that stopped without an end is shown as ended: partial if it kept results, failed if not. */
export function staleRun(run: ResearchRunState, now = new Date()): ResearchRunState {
  if (run.terminal || now.getTime() - Date.parse(run.updatedAt) < STALE_RUN_MS) return run;
  const kept = (run.result?.offers.length ?? run.offers ?? 0) > 0;
  return {
    ...run,
    stage: kept ? "partial" : "failed",
    terminal: true,
    message: kept
      ? "A pesquisa parou antes de terminar. Os resultados recebidos continuam aqui."
      : "A pesquisa parou antes de trazer resultados. Tente de novo.",
  };
}
