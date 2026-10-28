"use client";
// T06: the conversation pages' calls, all to this site's /api/tone (the BFF).
// Responses are checked with the same contracts as the server and the extension.
import posthog from "posthog-js";
import {
  AccessSession,
  AgentEvent,
  DecisionState,
  LinkCodeCreated,
  LocalRun,
  type LocalStore,
  Me,
  Memory,
  ResearchRunState,
  SessionSummary,
  TranscriptItem,
  Watch,
  WatchResult,
  type DecisionOp,
  type TurnInput,
  type WatchRule,
} from "@/tone/shared";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function call(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`/api/tone/${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-tone-web": "1", ...init.headers },
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new ApiError(body?.error ?? `Erro ${response.status}`, response.status);
  return body;
}
const send = (path: string, method: string, body?: unknown) =>
  call(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

let identifiedUserId: string | null = null;

async function me() {
  try {
    const person = Me.parse(await call("me"));
    if (identifiedUserId !== person.id) {
      const persistedUserId = posthog.get_property("$user_id");
      if (persistedUserId && persistedUserId !== person.id) posthog.reset();
      // Only the tone id: e-mail and name stay out of the analytics (LGPD).
      posthog.identify(person.id);
      identifiedUserId = person.id;
    }
    return person;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      if (identifiedUserId || posthog.get_property("$user_id")) posthog.reset();
      identifiedUserId = null;
    }
    throw error;
  }
}

async function logout() {
  try {
    await send("auth/logout", "POST", {});
  } finally {
    posthog.reset();
    identifiedUserId = null;
  }
}

export const api = {
  me,
  link: (code: string) => send("auth/web/link", "POST", { code }),
  emailStart: (email: string) => send("auth/web/email/start", "POST", { email }),
  emailVerify: (email: string, code: string) => send("auth/web/email/verify", "POST", { email, code }),
  logout,
  linkCode: async () => LinkCodeCreated.parse(await send("auth/link-codes", "POST", {})),
  accessSessions: async () => AccessSession.array().parse(await call("auth/sessions")),
  memories: async () => Memory.array().parse(await call("memories")),
  deleteMemory: (id: string) => send(`memories/${id}`, "DELETE"),
  sessions: async () => SessionSummary.array().parse(await call("sessions")),
  newSession: async () => (await send("sessions", "POST", { site: null })) as { sessionId: string; greeting: string },
  transcript: async (id: string) => TranscriptItem.array().parse(await call(`sessions/${id}/transcript`)),
  researchRuns: async (id: string) => ResearchRunState.array().parse(await call(`sessions/${id}/research-runs`)),
  decision: async (id: string) => DecisionState.nullable().parse(await call(`sessions/${id}/decision`)),
  changeDecision: async (id: string, version: number, ops: DecisionOp[]) =>
    DecisionState.parse(await send(`sessions/${id}/decision`, "PATCH", { version, ops })),
  watches: async () => Watch.array().parse(await call("watches")),
  watch: async (id: string) => {
    try {
      return Watch.parse(await call(`watches/${id}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  saveWatch: async (id: string, version: number, draft: WatchRule) =>
    Watch.parse(await send(`watches/${id}`, "PATCH", { version, draft })),
  /** T16: the readings of a watch, newest first, for the panels. */
  watchResults: async (id: string) => WatchResult.array().parse(await call(`watches/${id}/results`)),
  confirmWatch: async (id: string, version: number) => Watch.parse(await send(`watches/${id}/confirm`, "POST", { version })),
  /** T14: whether the person's extension is on and recently seen. */
  localBridge: async () => (await call("local-bridge")) as { available: boolean; lastSeenAt: string | null },
  localRun: async (sessionId: string, query: string, stores: LocalStore[]) =>
    LocalRun.parse(await send("local-runs", "POST", { sessionId, query, stores })),
  stopLocalRun: (id: string) => send(`local-runs/${id}/stop`, "POST", {}),
};

/**
 * T14: tells the extension a run is waiting. It carries only the run id; the extension fetches
 * the steps from the server with its own token. Without the extension id, it waits for its next minute.
 */
export function nudgeExtension(runId: string) {
  const id = process.env.NEXT_PUBLIC_TONE_EXTENSION_ID;
  const runtime = (globalThis as { chrome?: { runtime?: { sendMessage?: (id: string, message: unknown, done?: () => void) => void } } })
    .chrome?.runtime;
  if (!id || !runtime?.sendMessage) return;
  try {
    runtime.sendMessage(id, { type: "tone.local_run", runId }, () => undefined);
  } catch {
    // The extension is not there or does not accept this page: the minute alarm still picks the run up.
  }
}

/** Posts a turn and hands each server-sent event, validated, to `onEvent`. */
export async function streamTurn(
  sessionId: string,
  input: TurnInput,
  onEvent: (event: AgentEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/tone/agent/turn", {
    method: "POST",
    headers: { "content-type": "application/json", "x-tone-web": "1" },
    body: JSON.stringify({ sessionId, input }),
    signal,
    credentials: "same-origin",
  });
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ApiError(body.error ?? `Erro ${response.status}`, response.status);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let ended = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        const data = block
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (data) {
          const event = AgentEvent.parse(JSON.parse(data));
          if (event.type === "done" || event.type === "error") ended = true;
          onEvent(event);
        }
        boundary = buffer.indexOf("\n\n");
      }
      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }
  if (!ended) throw new ApiError("A resposta foi interrompida. Tente novamente.", 0);
}
