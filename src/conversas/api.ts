"use client";
// T06: the conversation pages' calls, all to this site's /api/tone (the BFF).
// Responses are checked with the same contracts as the server and the extension.
import {
  AccessSession,
  AgentEvent,
  DecisionState,
  LinkCodeCreated,
  Me,
  Memory,
  ResearchRunState,
  SessionSummary,
  TranscriptItem,
  Watch,
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

export const api = {
  me: async () => Me.parse(await call("me")),
  link: (code: string) => send("auth/web/link", "POST", { code }),
  emailStart: (email: string) => send("auth/web/email/start", "POST", { email }),
  emailVerify: (email: string, code: string) => send("auth/web/email/verify", "POST", { email, code }),
  logout: () => send("auth/logout", "POST", {}),
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
  confirmWatch: async (id: string, version: number) => Watch.parse(await send(`watches/${id}/confirm`, "POST", { version })),
};

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
