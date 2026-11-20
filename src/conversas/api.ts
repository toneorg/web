"use client";
// T06: the conversation pages' calls, all to this site's /api/tone (the BFF).
// Responses are checked with the same contracts as the server.
import posthog from "posthog-js";
import {
  AccessSession,
  ChatSession,
  MessageMatch,
  AgentEvent,
  ConnectionStatus,
  Consent,
  type ConsentPurpose,
  NeedsConsent,
  type ConnectionProvider,
  type AnswerRatedEvent,
  DecisionState,
  DiscoveryFollowUp,
  CONSENT_VERSION,
  InviteInfo,
  Me,
  PasswordResetInfo,
  Memory,
  ProductMedia,
  Purchase,
  PhotoSummary,
  PurchaseSituation,
  ResearchRunState,
  ReviewRunState,
  WatchPrices,
  PanelSession,
  SessionSummary,
  TranscriptItem,
  Watch,
  WatchResult,
  type ClickWhere,
  type PhotoCorrection,
  type DecisionOp,
  type SituationOutcomeVerdict,
  type TurnInput,
  type WatchRule,
} from "@/tone/shared";
import { routeOf, track } from "./analytics";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
  /** The server wants the person's specific consent before saving this (409): its text, to show. */
  consent?: NeedsConsent;
}

/** A failed call, for the health dashboard. Not being signed in yet is not a failure. */
function failed(path: string, method: string, status: number) {
  if (status === 401 && path === "me") return;
  track("api_request_failed", { route: routeOf(path), method, status });
}

async function call(path: string, init: RequestInit = {}): Promise<unknown> {
  const method = init.method ?? "GET";
  let response: Response;
  try {
    response = await fetch(`/api/tone/${path}`, {
      ...init,
      headers: { "content-type": "application/json", "x-tone-web": "1", ...init.headers },
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    failed(path, method, 0);
    throw new ApiError("Não consegui falar com a tone. Confira a internet e tente de novo.", 0, { cause: error });
  }
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    const consent = NeedsConsent.safeParse(body);
    failed(path, method, response.status);
    // The host answers a body that is too big with a page, not JSON.
    const fallback = response.status === 413 ? "A foto é grande demais para enviar." : `Erro ${response.status}`;
    const refused = new ApiError(body?.error ?? fallback, response.status);
    if (consent.success) refused.consent = consent.data;
    throw refused;
  }
  return body;
}
/**
 * What the screens read often (the account, the lists, the panels), kept in memory for a short
 * while. Going from one screen to another draws at once from here and asks the server only once
 * the copy is old, so moving around the app costs no extra round trips through /api/tone.
 * Two screens asking for the same thing at the same time share one request.
 * Any change sent to the server forgets every copy, so nothing stale survives an action.
 */
const FRESH_MS = 30_000;
const kept = new Map<string, { at: number; value: Promise<unknown>; settled?: unknown }>();

function cached<T>(key: string, load: () => Promise<T>, options: { fresh?: boolean } = {}): Promise<T> {
  const entry = kept.get(key);
  if (!options.fresh && entry && Date.now() - entry.at < FRESH_MS) return entry.value as Promise<T>;
  const value = load();
  const next: { at: number; value: Promise<unknown>; settled?: unknown } = { at: Date.now(), value };
  kept.set(key, next);
  value.then(
    (result) => {
      next.settled = result;
    },
    () => {
      if (kept.get(key) === next) kept.delete(key);
    },
  );
  return value;
}

/** The last answer kept for `key`, even if old, to draw a screen before the fresh one arrives. */
export function peek<T>(key: string): T | undefined {
  return kept.get(key)?.settled as T | undefined;
}

/** Forgets every kept answer: after a change, signing in or out, or a new turn. */
export function forgetCached() {
  kept.clear();
  early.clear();
}

/**
 * Requests started as the page opens, before the screens that use them exist (20/11/2026: on a
 * phone the chat waited for /me, then read its sessions one after the other, five waves of round
 * trips). Each is used once, while fresh; otherwise the screen asks again.
 */
const early = new Map<string, { at: number; value: Promise<unknown> }>();
function take(path: string): Promise<unknown> | undefined {
  const entry = early.get(path);
  early.delete(path);
  return entry && Date.now() - entry.at < FRESH_MS ? entry.value : undefined;
}
function start(path: string) {
  const value = call(path);
  // A failure is the screen's to show when it asks; here it must not surface as unhandled.
  value.catch(() => undefined);
  early.set(path, { at: Date.now(), value });
  return value;
}

/** The newest sessions of the chat, with what each shows, asked for as soon as the page opens. */
export function prefetchChat(sessions = 3) {
  if (early.has("chat/sessions")) return;
  start("chat/sessions")
    .then((raw) => {
      const list = ChatSession.array().safeParse(raw);
      if (!list.success) return;
      for (const session of list.data.slice(0, sessions))
        for (const part of ["transcript", "research-runs", "review-runs"]) start(`sessions/${session.id}/${part}`);
    })
    .catch(() => undefined);
}

/** A change: every kept copy is forgotten before it leaves and again once it lands. */
const send = (path: string, method: string, body?: unknown) => {
  forgetCached();
  return call(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }).finally(forgetCached);
};

let identifiedUserId: string | null = null;

const me = () => cached("me", loadMe);

async function loadMe() {
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
      forgetCached();
      if (identifiedUserId || posthog.get_property("$user_id")) posthog.reset();
      identifiedUserId = null;
    }
    throw error;
  }
}

async function logout() {
  try {
    track("signed_out");
    await send("auth/logout", "POST", {});
  } finally {
    forgetCached();
    posthog.reset();
    identifiedUserId = null;
  }
}

/** The file as base64, without the "data:…;base64," prefix: the server reads the type from the bytes. */
export function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ApiError("Não consegui ler o arquivo da foto.", 0));
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.readAsDataURL(file);
  });
}

export const api = {
  me,
  /** Every entry after the first: e-mail and password. */
  signIn: (email: string, password: string) => send("auth/web/login", "POST", { email, password }),
  /** First step of the first entry: the e-mail the invite was made for. */
  invite: async (code: string) => InviteInfo.parse(await send("auth/web/invite", "POST", { code })),
  /** The onboarding: spends the invite and sets the password. */
  redeem: (code: string, name: string, email: string, password: string) =>
    send("auth/web/redeem", "POST", { code, name, email, password, consent: true, consentVersion: CONSENT_VERSION }),
  /** A forgotten password: the server e-mails a one-time link when the account exists, and answers the same either way. */
  forgotPassword: (email: string) => send("auth/web/forgot", "POST", { email }),
  /** The reset link opened: the e-mail it resets, or a 403 when it expired or was used. */
  checkReset: async (token: string) => PasswordResetInfo.parse(await send("auth/web/reset/check", "POST", { token })),
  /** Spends the reset link: the new password, every other session out, this browser in. */
  resetPassword: (token: string, password: string) => send("auth/web/reset", "POST", { token, password }),
  logout,
  /** Gmail and Agenda: whether each is connected and what was read from it. Read fresh, it changes on sync. */
  connections: async () => ConnectionStatus.array().parse(await call("connections")),
  /** The Google consent address; the page goes there and the callback comes back to the profile. */
  startConnection: async (provider: ConnectionProvider) =>
    (await send(`connections/${provider}/start`, "POST", {})) as { url: string },
  syncConnection: async (provider: ConnectionProvider) =>
    (await send(`connections/${provider}/sync`, "POST", {})) as { added: number },
  /** Stops reading and erases what came from the provider. */
  disconnect: (provider: ConnectionProvider) => send(`connections/${provider}`, "DELETE"),
  /** What was read from the person's order e-mails. */
  purchases: async () => Purchase.array().parse(await call("purchases")),
  accessSessions: async () => AccessSession.array().parse(await call("auth/sessions")),
  endAccessSession: async (id: string) => {
    await send(`auth/sessions/${encodeURIComponent(id)}`, "DELETE");
  },
  memories: () => cached("memories", async () => Memory.array().parse(await call("memories"))),
  deleteMemory: (id: string) => send(`memories/${id}`, "DELETE"),
  /** A hypothesis of the tone, confirmed by the person from the list. */
  confirmMemory: async (id: string) => Memory.parse(await send(`memories/${id}/confirm`, "POST", {})),
  /** Something the person wrote about themselves ("tamanho de tênis: 40 · já tenho sandália dourada"). */
  addMemory: (key: string, value: string, category: string) => send("memories", "POST", { key, value, category }),
  /** The specific consents that stand (skin tone and coloring). */
  consents: async () => Consent.array().parse(await call("consents")),
  /** Takes the permission back: the server deletes the sensitive notes it covered. */
  revokeConsent: (purpose: ConsentPurpose) => send(`consents/${purpose}`, "DELETE"),
  /** Every note about the person, gone; the conversations stay. */
  deleteAllMemories: () => send("memories", "DELETE"),
  /** The whole record of the account, as JSON, for the person to keep. */
  exportData: async () => await call("me/export"),
  /** Everything of the account, gone. Not reversible. */
  deleteAccount: () => send("me", "DELETE"),
  /** What each conversation was trying to solve, newest first. */
  situations: () => cached("situations", async () => PurchaseSituation.array().parse(await call("situations"))),
  /** After the occasion: how it went. */
  recordOutcome: async (id: string, verdict: SituationOutcomeVerdict) =>
    PurchaseSituation.parse(await send(`situations/${id}/outcome`, "POST", { verdict })),
  sessions: () => cached("sessions", async () => SessionSummary.array().parse(await call("sessions"))),
  /** The sessions of the single chat, newest first; read fresh, the newest one grows with each turn. */
  chatSessions: async () => ChatSession.array().parse(await (take("chat/sessions") ?? call("chat/sessions"))),
  /** Messages of the single chat with every word of `query`, newest first. */
  searchMessages: async (query: string, signal?: AbortSignal) =>
    MessageMatch.array().parse(await call(`messages/search?q=${encodeURIComponent(query)}`, { signal })),
  /** The next session of the single chat, opened under the hood with no greeting. */
  silentSession: async () => (await send("sessions", "POST", { site: null, silent: true })) as { sessionId: string },
  /** With `watchId`, a conversation of that panel: it stays in the panel, out of the conversation list. */
  newSession: async (onboarding = false, watchId?: string) =>
    (await send("sessions", "POST", { site: null, onboarding, ...(watchId ? { watchId } : {}) })) as {
      sessionId: string;
      greeting: string;
    },
  /** The conversations kept in a panel; read fresh, they change as the person talks there. */
  panelSessions: async (watchId: string) => PanelSession.array().parse(await call(`watches/${watchId}/sessions`)),
  transcript: async (id: string) =>
    TranscriptItem.array().parse(await (take(`sessions/${id}/transcript`) ?? call(`sessions/${id}/transcript`))),
  researchRuns: async (id: string) =>
    ResearchRunState.array().parse(await (take(`sessions/${id}/research-runs`) ?? call(`sessions/${id}/research-runs`))),
  reviewRuns: async (id: string) =>
    ReviewRunState.array().parse(await (take(`sessions/${id}/review-runs`) ?? call(`sessions/${id}/review-runs`))),
  /** Motor de descoberta: the late message of a search whose slow stores finished after the answer. */
  followUps: async (id: string) => DiscoveryFollowUp.array().parse(await call(`sessions/${id}/followups`)),
  decision: async (id: string) => DecisionState.nullable().parse(await call(`sessions/${id}/decision`)),
  changeDecision: async (id: string, version: number, ops: DecisionOp[]) =>
    DecisionState.parse(await send(`sessions/${id}/decision`, "PATCH", { version, ops })),
  watches: () => cached("watches", async () => Watch.array().parse(await call("watches"))),
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
  /** The panel's price chart: lowest price per day and the target. */
  watchPrices: async (id: string) => WatchPrices.parse(await call(`watches/${id}/prices`)),
  watchResults: (id: string, options?: { fresh?: boolean }) =>
    cached(`watches/${id}/results`, async () => WatchResult.array().parse(await call(`watches/${id}/results`)), options),
  confirmWatch: async (id: string, version: number) => Watch.parse(await send(`watches/${id}/confirm`, "POST", { version })),
  /** T11: the center's actions. Muting stops the e-mail only; the watch keeps running. */
  watchAction: async (id: string, action: "pause" | "resume" | "mute" | "unmute") =>
    Watch.parse(await send(`watches/${id}/${action}`, "POST", {})),
  checkWatch: async (id: string) => (await send(`watches/${id}/check`, "POST", {})) as { state: string },
  deleteWatch: (id: string) => send(`watches/${id}`, "DELETE"),
  /** T11: the mute link of an e-mail, without signing in. */
  muteByLink: (token: string) => send("watch-mute", "POST", { token }),
  /** TikToks of a product, searched by its name and saved in the conversation. */
  media: async (sessionId: string, productTitle: string) =>
    ProductMedia.parse(await send("media", "POST", { sessionId, productTitle })),
  /** "O que dizem os reviews": starts the synthesis of the picked product; it is then read with reviewRuns. */
  reviews: async (sessionId: string, productTitle: string) =>
    ReviewRunState.parse(await send("reviews", "POST", { sessionId, productTitle })),
  /** A reference photo of the conversation: the photo goes as base64, already shrunk by the screen to stay under the host's body limit. */
  uploadPhoto: async (sessionId: string, file: Blob) =>
    PhotoSummary.parse(await send("photos", "POST", { sessionId, data: await fileToBase64(file) })),
  /** The vision model reads the photo; takes a few seconds and spends budget. */
  interpretPhoto: async (id: string) => PhotoSummary.parse(await send(`photos/${id}/interpret`, "POST", {})),
  /** What the person kept, rewrote or ignored from the reading, before the search. */
  correctPhoto: async (id: string, correction: PhotoCorrection) =>
    PhotoSummary.parse(await send(`photos/${id}/correction`, "PATCH", correction)),
  deletePhoto: (id: string) => send(`photos/${id}`, "DELETE"),
  /** The photo itself, for a local blob: it never gets a public address. */
  photoImage: async (id: string) => {
    const response = await fetch(`/api/tone/photos/${id}/image`, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new ApiError("A foto não está mais disponível.", response.status);
    return response.blob();
  },
};

/**
 * A thumb under an answer. Unlike the analytics, a failure reaches the screen, which puts the
 * thumb back. On a thumb down the PostHog session goes along, so it links to the replay.
 */
export async function rateAnswer(sessionId: string, event: Omit<AnswerRatedEvent, "type" | "replaySessionId">) {
  const replaySessionId = event.rating === "bad" ? posthog.get_session_id?.() || undefined : undefined;
  await call("events", {
    method: "POST",
    body: JSON.stringify({
      sessionId,
      events: [{ type: "answer_rated", ...event, ...(replaySessionId ? { replaySessionId } : {}) }],
    }),
  });
}

/**
 * Records the click on a recommended product's link. Sent with keepalive, so it is not lost
 * when the store opens in another tab; a failure never stops the link.
 */
export function trackClick(sessionId: string | null, url: string, title: string, where: ClickWhere) {
  void fetch("/api/tone/events", {
    method: "POST",
    headers: { "content-type": "application/json", "x-tone-web": "1" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify({ sessionId, events: [{ type: "recommendation_clicked", url, title, ...where }] }),
  }).catch(() => undefined);
}

/**
 * "Não curti" on a product: the server keeps the reason, sets the offer aside for the rest of the
 * conversation and counts it in the profile. Fire and forget, like the click: a failure never
 * stops the chat phrase that goes with it.
 */
export function trackRejected(rejection: {
  sessionId: string | null;
  url: string;
  title: string;
  reason: string;
  offerId?: string | null;
  runId?: string | null;
}) {
  const { sessionId, ...event } = rejection;
  void fetch("/api/tone/events", {
    method: "POST",
    headers: { "content-type": "application/json", "x-tone-web": "1" },
    credentials: "same-origin",
    keepalive: true,
    body: JSON.stringify({ sessionId, events: [{ type: "recommendation_rejected", ...event }] }),
  }).catch(() => undefined);
}

/** Posts a turn and hands each server-sent event, validated, to `onEvent`. */
export async function streamTurn(
  sessionId: string,
  input: TurnInput,
  onEvent: (event: AgentEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  // A turn changes the conversation list, the balance and maybe the panels.
  forgetCached();
  const response = await fetch("/api/tone/agent/turn", {
    method: "POST",
    headers: { "content-type": "application/json", "x-tone-web": "1" },
    body: JSON.stringify({ sessionId, input }),
    signal,
    credentials: "same-origin",
  });
  if (!response.ok || !response.body) {
    failed("agent/turn", "POST", response.status);
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
