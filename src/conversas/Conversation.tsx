"use client";
// T06, redrawn on 15/11/2026 as a messaging app: the person talks to the tone in ONE chat, the
// way they would with someone on their phone. The chat is the person's sessions one after the
// other (timeline.ts), with the older ones read as they scroll up; after a pause, the next
// message opens a new session under the hood. A panel's conversation (opened from its panel,
// `sessionId` + `panelId`) is the same screen on that one session. The agent researches through
// the server; a product opens in a new tab only when the person clicks it.
import Link from "next/link";
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnswerRating, type AnswerRatingChange, type AnswerRatingDetail, PickedProductBar, ProductVideos, ReviewSynthesisCard } from "@/tone/genui";
import {
  type AgentEvent,
  type AnswerRatingValue,
  type ChatSession,
  MEDIA_COMPONENT,
  type Me,
  memoryLabel,
  type PhotoSummary,
  type PickedProduct,
  ProductMedia,
  type ResearchRunState,
  reduceResearchRuns,
  type ReviewRunState,
  type TranscriptItem,
  type TurnInput,
  type Watch,
  type WatchResult,
  watchTitle,
} from "@/tone/shared";
import { splitAnswer } from "@/tone/shared/genui";
import { since, track } from "./analytics";
import { ApiError, api, peek, rateAnswer, streamTurn } from "./api";
import { savedFrameCode } from "./frames";
import { Program, type ProgramHost, STORE_HOSTS, storeHostsOf, WATCHES_CHANGED } from "./Program";
import { WatchReadings } from "./WatchReadings";
import { takePicked } from "./picked-handoff";
import { PhotoPicker, PhotoReference, usePhoto } from "./PhotoReference";
import { ResearchRun } from "./ResearchRun";
import { Shell } from "./Shell";
import { ChosenStores, StoreOptions, UserMessage } from "./StoreMention";
import { filterStores, type Mention, mentionAt, pickStore } from "./store-mention";
import { SignIn } from "./SignIn";
import { type ChatTarget, dayLabel, dayStarts, lineKey, startsNewSession } from "./timeline";
import { WELCOME_FIRST } from "./welcome";

/** Where a line belongs and when it was said. `old`: read from the server, not said in this visit. */
type Line = { id: string; session: string; at?: string; old?: true };
export type Item = Line &
  (
    /** `stores`: the stores picked with @ for this message, drawn with it. */
    | { kind: "user"; text: string; stores?: string[] }
    /** `turn` is the turn it answers, for the thumbs under it; the greeting has none. */
    | { kind: "assistant"; text: string; streaming?: boolean; turn?: number; rating?: AnswerRatingValue | null }
    /** `saved`: read back from the conversation, so it is not announced again as it loads. */
    | { kind: "notice"; text: string; error?: boolean; saved?: boolean }
    /** A frame saved in an old conversation, drawn by the same components as an answer. */
    | { kind: "frame"; code: string }
    | { kind: "research"; run: ResearchRunState }
    /** TikToks of a product, asked for from the picked product above the composer. */
    | { kind: "media"; media: ProductMedia }
    /** Síntese de reviews: a run that ends apart from the turn, so the research never waits for it. */
    | { kind: "reviews"; run: ReviewRunState }
  );

/** Something the frame asks the chat to send: the tour's example, or the welcome conversation. */
export type Outbox = { id: number; kind: "message"; text: string } | { id: number; kind: "welcome" };

/** Puts each review run in its place in the conversation, or at the end when it is new. */
function placeReviews(list: Item[], runs: ReviewRunState[], session: string): Item[] {
  let next = list;
  for (const run of runs) {
    const id = `reviews-${run.runId}`;
    const current = next.find((entry) => entry.id === id);
    const item: Item = { id, kind: "reviews", run, session: current?.session ?? session, ...(current?.old ? { old: true as const } : {}) };
    next = current ? next.map((entry) => (entry.id === id ? item : entry)) : [...next, item];
  }
  return next;
}

let counter = 0;
const uid = () => `w${Date.now().toString(36)}${(++counter).toString(36)}`;

/**
 * One line of a saved conversation as this page draws it. With `index`, its key is its place in the
 * session's transcript (`lineKey`), which is what a search result points at.
 */
export function itemsOf(item: TranscriptItem, session = "", index?: number): Item[] {
  const line = { id: index === undefined ? uid() : lineKey(session, index), session, old: true as const, ...(item.at ? { at: item.at } : {}) };
  if (item.kind === "user") return [{ ...line, kind: "user", text: item.text, ...(item.stores?.length ? { stores: item.stores } : {}) }];
  // Why a message was left without an answer (the model failed, the balance ran out).
  if (item.kind === "notice") return [{ ...line, kind: "notice", error: true, saved: true, text: item.text }];
  if (item.kind === "assistant") return [{ ...line, kind: "assistant", text: item.text, turn: item.turn, rating: item.rating ?? null }];
  const media = item.component.name === MEDIA_COMPONENT ? ProductMedia.safeParse(item.component.props) : null;
  if (media?.success) return [{ ...line, kind: "media", media: media.data }];
  const code = savedFrameCode(item.component);
  return code ? [{ ...line, kind: "frame", code }] : [];
}

/** Everything one session shows: its lines, then its research and review cards. */
async function readSession(session: string, strict: boolean): Promise<Item[]> {
  const soft = <T,>(promise: Promise<T[]>) => (strict ? promise : promise.catch(() => [] as T[]));
  const [transcript, runs, reviews] = await Promise.all([
    api.transcript(session),
    soft(api.researchRuns(session)),
    api.reviewRuns(session).catch(() => []),
  ]);
  return [
    ...transcript.flatMap((line, index) => itemsOf(line, session, index)),
    ...runs.map((run): Item => ({ id: `run-${run.runId}`, kind: "research", run, session, old: true })),
    ...reviews.map((run): Item => ({ id: `reviews-${run.runId}`, kind: "reviews", run, session, old: true })),
  ];
}

/** Several sessions (newest first in `sessions`), in the order they were said. */
async function readSessions(sessions: ChatSession[]): Promise<Item[]> {
  const parts = await Promise.all([...sessions].reverse().map((session) => readSession(session.id, false)));
  return parts.flat();
}

/** How many lines the chat wants on screen at first; older sessions come as the person scrolls up. */
const FIRST_LINES = 16;
const FIRST_SESSIONS = 3;

/** Where "←" goes from a panel's conversation: back to its panel. */
export function backLink(panelId: string | null, panelTitle: string | null): { href: string; label: string } {
  return panelId
    ? { href: `/paineis/${panelId}`, label: `← ${panelTitle ?? "Painel"}` }
    : { href: "/conversas", label: "← Conversa" };
}

const bubble = "whitespace-pre-wrap rounded-panel px-4 py-2.5 text-body [overflow-wrap:anywhere]";
/** A bubble's width: up to most of the column, never the whole of a wide one. */
const bubbleWidth = "w-fit max-w-[min(88%,38rem)]";

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
      <rect x="7" y="7" width="10" height="10" rx="2" />
    </svg>
  );
}

export function Conversation(props: {
  /** A panel's conversation: that one session. Without it, the single chat. */
  sessionId?: string;
  panelId?: string | null;
  /** A panel's conversation started from its page arrives with its first message, sent once. */
  first?: string | null;
  /** The single chat: the account, read by the frame around it. */
  me?: Me | null;
  /** The single chat: where to go (a search result, an old link), and the answer once there. */
  target?: ChatTarget | null;
  onArrived?: (found: boolean) => void;
  /** The single chat: a message or the welcome conversation to start, sent once. */
  outbox?: Outbox | null;
  onOutboxSent?: () => void;
  /** The single chat with nothing in it yet: what the tone says first. */
  empty?: ReactNode;
  /** The single chat: the session ended while the page was open. */
  onExpired?: () => void;
}) {
  const panel = props.sessionId ? { sessionId: props.sessionId, panelId: props.panelId ?? null } : null;
  const panelId = panel?.panelId ?? null;
  // The session new messages go to: fixed in a panel's conversation; in the single chat the newest
  // one, until a pause asks for a new one (`ensureSession`).
  const live = useRef<{ id: string; lastAt: string } | null>(panel ? { id: panel.sessionId, lastAt: new Date().toISOString() } : null);
  const [liveId, setLiveId] = useState<string | null>(panel?.sessionId ?? null);
  /** The sessions of the single chat, newest first, and how many of them (from the newest) are drawn. */
  const [sessions, setSessions] = useState<ChatSession[] | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [older, setOlder] = useState<"idle" | "loading" | "failed">("idle");

  // A panel's conversation names its panel in the way back.
  const [panelTitle, setPanelTitle] = useState<string | null>(null);
  useEffect(() => {
    if (!panelId) return;
    let live = true;
    api.watch(panelId).then(
      (watch) => live && watch && setPanelTitle(watchTitle(watch.confirmed ?? watch.draft)),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [panelId]);
  const back = backLink(panelId, panelTitle);
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "expired" | "error">("loading");
  const [draft, setDraft] = useState("");
  // "@" opens the store list; the stores picked limit this message's search.
  const [chosenStores, setChosenStores] = useState<string[]>([]);
  const [mention, setMention] = useState<Mention | null>(null);
  const [activeStore, setActiveStore] = useState(0);
  const box = useRef<HTMLTextAreaElement>(null);
  // The frame (account and panels) draws at once from the last copy while the conversation loads.
  const [ownMe, setMe] = useState<Me | null>(() => peek<Me>("me") ?? null);
  const me = props.me ?? ownMe;
  const [busy, setBusy] = useState(false);
  /** The product picked from a component: it goes with every message until the person lets it go. */
  const [picked, setPicked] = useState<PickedProduct | null>(null);
  // "Perguntar" on a panel's page brings the product along, once.
  useEffect(() => {
    if (!liveId) return;
    const brought = takePicked(liveId);
    if (brought) setPicked(brought);
  }, [liveId]);
  const controller = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);

  // The latest handler, so the callbacks below keep their identity across renders.
  const onExpired = useRef(props.onExpired);
  useEffect(() => {
    onExpired.current = props.onExpired;
  }, [props.onExpired]);
  const expired = useCallback(() => {
    if (onExpired.current) onExpired.current();
    else setState("expired");
  }, []);
  const liveRef = useCallback((value: { id: string; lastAt: string } | null) => {
    live.current = value;
    setLiveId(value?.id ?? null);
  }, []);

  /**
   * The session a new message goes to. In the single chat, after SESSION_GAP_MS without a message
   * (or when there is none yet) a new one opens, silently: the person sees the same chat going on.
   */
  const ensureSession = useCallback(async (): Promise<string> => {
    const current = live.current;
    const now = new Date().toISOString();
    if (panel || (current && !startsNewSession(current.lastAt))) {
      if (current) current.lastAt = now;
      return current?.id ?? "";
    }
    const { sessionId } = await api.silentSession();
    track("chat_session_started", {
      after_hours: current ? Math.round((Date.now() - Date.parse(current.lastAt)) / 3_600_000) : null,
    });
    live.current = { id: sessionId, lastAt: now };
    setLiveId(sessionId);
    setSessions((list) => [{ id: sessionId, onboarding: false, startedAt: now, lastAt: now, messages: 0 }, ...(list ?? [])]);
    setLoaded((count) => count + 1);
    return sessionId;
    // `panel` only changes with the address, which mounts another page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(panel)]);
  const photo = usePhoto(ensureSession);

  // Each change of `round` loads the conversation again (after signing in, retrying).
  const [round, setRound] = useState(0);
  const load = () => setRound((value) => value + 1);
  const panelSession = panel?.sessionId ?? null;
  useEffect(() => {
    let live = true;
    const fail = (error: unknown) => {
      if (!live) return;
      const status = error instanceof ApiError ? error.status : 0;
      if (status === 401) expired();
      setState(status === 401 ? "expired" : status === 404 ? "missing" : "error");
    };
    if (panelSession) {
      Promise.all([readSession(panelSession, true), api.me(), round])
        .then(([lines, person]) => {
          if (!live) return;
          setMe(person);
          setItems(lines);
          setState("ready");
        })
        .catch(fail);
    } else {
      api
        .chatSessions()
        .then(async (list) => {
          // The newest sessions until the screen has enough to read; the rest as the person scrolls up.
          let count = 0;
          let lines: Item[] = [];
          while (count < list.length && count < FIRST_SESSIONS && lines.length < FIRST_LINES) {
            const next = list[count];
            if (!next) break;
            lines = [...(await readSession(next.id, false)), ...lines];
            count++;
          }
          return { list, count, lines };
        })
        .then(({ list, count, lines }) => {
          if (!live) return;
          const newest = list[0];
          liveRef(newest ? { id: newest.id, lastAt: newest.lastAt } : null);
          setSessions(list);
          setLoaded(count);
          // A messaging app opens on its newest message, whatever the browser remembered of the scroll.
          window.history.scrollRestoration = "manual";
          atBottom.current = true;
          setItems(lines);
          setState("ready");
          track("chat_history_loaded", { sessions: list.length, lines: lines.length });
        })
        .catch(fail);
    }
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelSession, round]);
  /** Where the first line on screen was before older lines came in above it, to keep it in place. */
  const anchor = useRef<{ id: string; top: number } | null>(null);
  const loadOlder = useCallback(async () => {
    if (!sessions || older === "loading" || loaded >= sessions.length) return;
    setOlder("loading");
    try {
      const lines = await readSessions(sessions.slice(loaded, loaded + 1));
      const first = document.querySelector<HTMLElement>("[data-line]");
      anchor.current = first ? { id: first.dataset.line ?? "", top: first.getBoundingClientRect().top } : null;
      setItems((list) => [...lines, ...list]);
      setLoaded((count) => count + 1);
      setOlder("idle");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) expired();
      setOlder("failed");
    }
  }, [sessions, loaded, older, expired]);
  useLayoutEffect(() => {
    const kept = anchor.current;
    if (!kept) return;
    anchor.current = null;
    // Reading the newest lines: older ones coming in above do not move the view off the bottom.
    if (atBottom.current) {
      bottom.current?.scrollIntoView({ block: "end" });
      return;
    }
    const element = document.querySelector<HTMLElement>(`[data-line="${CSS.escape(kept.id)}"]`);
    if (element) window.scrollBy(0, element.getBoundingClientRect().top - kept.top);
  }, [items]);
  // The top of the chat in view (with some room) reads the session before.
  const hasOlder = Boolean(sessions && loaded < sessions.length);
  useEffect(() => {
    const element = top.current;
    if (!element || !hasOlder || state !== "ready" || older !== "idle") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadOlder();
    }, { rootMargin: "600px 0px 0px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasOlder, state, older, loadOlder]);

  // The single chat goes to a line (a search result, an old link): its session is read first,
  // with every session after it, then the line is scrolled to, marked and focused.
  const [found, setFound] = useState<string | null>(null);
  const { target, onArrived } = props;
  useEffect(() => {
    if (!target || !sessions || state !== "ready") return;
    const position = sessions.findIndex((session) => session.id === target.sessionId);
    if (position < 0) {
      onArrived?.(false);
      return;
    }
    if (position >= loaded) {
      let live = true;
      readSessions(sessions.slice(loaded, position + 1))
        .then((lines) => {
          if (!live) return;
          setItems((list) => [...lines, ...list]);
          setLoaded(position + 1);
        })
        .catch(() => live && onArrived?.(false));
      return () => {
        live = false;
      };
    }
    const key = target.index === undefined ? null : lineKey(target.sessionId, target.index);
    const line = items.find((item) => (key ? item.id === key : item.session === target.sessionId));
    if (!line) {
      onArrived?.(false);
      return;
    }
    atBottom.current = false;
    const frame = requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(`[data-line="${CSS.escape(line.id)}"]`);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      element?.focus({ preventScroll: true });
      setFound(line.id);
      onArrived?.(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, sessions, loaded, items, state, onArrived]);
  useEffect(() => {
    if (!found) return;
    const timer = window.setTimeout(() => setFound(null), 2400);
    return () => window.clearTimeout(timer);
  }, [found]);

  // A panel is a conversation: the watches made here, with their readings, close their session.
  const [panels, setPanels] = useState<{ watch: Watch; results: WatchResult[] }[]>([]);
  const shownSessions = panel ? panel.sessionId : (sessions ?? []).slice(0, loaded).map((session) => session.id).join(",");
  useEffect(() => {
    // Opened from a panel: its page already shows the readings.
    if (panelId || !shownSessions) return;
    const shown = new Set(shownSessions.split(","));
    let live = true;
    const fetchPanels = () =>
      api
        .watches()
        .then((list) =>
          Promise.all(
            list
              .filter((watch) => watch.sessionId && shown.has(watch.sessionId) && watch.status !== "deleted" && watch.confirmed)
              .map(async (watch) => ({ watch, results: await api.watchResults(watch.id).catch(() => []) })),
          ),
        )
        .then((found) => live && setPanels(found))
        .catch(() => undefined);
    void fetchPanels();
    window.addEventListener(WATCHES_CHANGED, fetchPanels);
    return () => {
      live = false;
      window.removeEventListener(WATCHES_CHANGED, fetchPanels);
    };
  }, [shownSessions, round, panelId]);

  // Follows the conversation as it grows, also while an answer streams in, unless the
  // person scrolled up to read something: then it leaves the page where it is.
  const tail = items.at(-1);
  const growth = tail?.kind === "assistant" ? tail.text.length : 0;
  const atBottom = useRef(true);
  useEffect(() => {
    // Only a scroll the person makes (wheel, touch, keys, the scrollbar) lets go of the bottom:
    // the browser restoring a position or older lines coming in above must not.
    let touched = 0;
    const touch = () => {
      touched = Date.now();
    };
    const onScroll = () => {
      if (Date.now() - touched > 1000) return;
      atBottom.current = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
    };
    const inputs = ["wheel", "touchmove", "keydown", "pointerdown"] as const;
    for (const name of inputs) window.addEventListener(name, touch, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      for (const name of inputs) window.removeEventListener(name, touch);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  const lastId = tail?.id;
  useEffect(() => {
    if (atBottom.current) bottom.current?.scrollIntoView({ block: "end" });
  }, [lastId, growth]);

  const fold = useCallback(
    (event: Extract<AgentEvent, { type: "progress" | "research_result" }>, session: string) =>
      setItems((list) => {
        const runId = event.type === "progress" ? event.progress.runId : event.result.id;
        const index = list.findIndex((item) => item.kind === "research" && item.run.runId === runId);
        const current = index >= 0 ? (list[index] as Extract<Item, { kind: "research" }>).run : undefined;
        const before = current ? { [runId]: current } : {};
        const after = reduceResearchRuns(before, event, session);
        const run = after[runId];
        if (after === before || !run) return list;
        if (index < 0) return [...list, { id: `run-${runId}`, kind: "research", run, session }];
        return list.map((item, at) => (at === index ? { ...item, kind: "research" as const, run } : item));
      }),
    [],
  );

  const runTurn = useCallback(
    async (input: TurnInput, session: string) => {
      const abort = new AbortController();
      controller.current = abort;
      setBusy(true);
      let assistant: string | null = null;
      const started = performance.now();
      const at = () => new Date().toISOString();
      // What the turn showed, for the analytics: counts and kinds only, never the text.
      const shown = { firstTextMs: null as number | null, components: 0, research: 0, memories: 0, errorCode: null as string | null };
      try {
        await streamTurn(
          session,
          input,
          (event) => {
            switch (event.type) {
              case "text": {
                if (shown.firstTextMs === null) shown.firstTextMs = since(started);
                if (!assistant) {
                  const id = uid();
                  assistant = id;
                  setItems((list) => [...list, { id, session, at: at(), kind: "assistant", text: event.delta, streaming: true }]);
                } else {
                  const id = assistant;
                  setItems((list) =>
                    list.map((item) => (item.id === id && item.kind === "assistant" ? { ...item, text: item.text + event.delta } : item)),
                  );
                }
                break;
              }
              case "progress":
              case "research_result":
                if (event.type === "research_result") shown.research += 1;
                fold(event, session);
                break;
              case "memory_saved":
                shown.memories += 1;
                setItems((list) => [
                  ...list,
                  { id: uid(), session, at: at(), kind: "notice", text: `Anotei: ${memoryLabel(event.key)} — ${event.value}` },
                ]);
                break;
              case "done": {
                const { turn } = event;
                const id = assistant;
                if (turn && id)
                  setItems((list) => list.map((item) => (item.id === id && item.kind === "assistant" ? { ...item, turn } : item)));
                break;
              }
              case "error":
                shown.errorCode = event.code ?? "error";
                setItems((list) => [
                  ...list,
                  {
                    id: uid(),
                    session,
                    at: at(),
                    kind: "notice",
                    error: true,
                    text:
                      event.code === "budget_exceeded"
                        ? `${event.message} As conversas e resultados anteriores continuam aqui.`
                        : event.message,
                  },
                ]);
                break;
              default:
                break;
            }
          },
          abort.signal,
        );
        const props = {
          input: input.type,
          duration_ms: since(started),
          first_text_ms: shown.firstTextMs,
          research_results: shown.research,
          memories_saved: shown.memories,
        };
        if (shown.errorCode) track("conversation_turn_failed", { ...props, reason: shown.errorCode });
        else track("conversation_turn_completed", props);
      } catch (error) {
        if (abort.signal.aborted) track("conversation_turn_stopped", { input: input.type, duration_ms: since(started) });
        else
          track("conversation_turn_failed", {
            input: input.type,
            duration_ms: since(started),
            reason: "connection",
            status: error instanceof ApiError ? error.status : null,
          });
        if (!abort.signal.aborted) {
          if (error instanceof ApiError && error.status === 401) expired();
          else
            setItems((list) => [
              ...list,
              { id: uid(), session, at: at(), kind: "notice", error: true, text: "Perdi a conexão com a tone. O que já chegou continua aqui; tente de novo." },
            ]);
        }
      } finally {
        setItems((list) => list.map((item) => (item.kind === "assistant" && item.streaming ? { ...item, streaming: false } : item)));
        if (controller.current === abort) controller.current = null;
        setBusy(false);
        setReviewsSince(Date.now());
      }
    },
    [fold, expired],
  );

  /** A line said now by the person, in `session`. */
  const said = (session: string, text: string, stores: string[] = []): Item => ({
    id: uid(),
    session,
    at: new Date().toISOString(),
    kind: "user",
    text,
    ...(stores.length ? { stores } : {}),
  });
  /** Opening the next session failed: the message stays in the field, and the chat says why. */
  const unopened = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) return expired();
    setItems((list) => [
      ...list,
      { id: uid(), session: live.current?.id ?? "", at: new Date().toISOString(), kind: "notice", error: true, text: "Não consegui falar com a tone agora. Tente de novo." },
    ]);
  };

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy || state !== "ready") return;
      let session: string;
      try {
        session = await ensureSession();
      } catch (error) {
        unopened(error);
        return;
      }
      setDraft("");
      const stores = chosenStores;
      setChosenStores([]);
      setMention(null);
      // The picked product goes with this message, then the bar lets it go: the person used it.
      if (picked) setPicked(null);
      atBottom.current = true;
      setItems((list) => [...list, said(session, trimmed, stores)]);
      track("conversation_message_sent", {
        with_product: Boolean(picked),
        length: trimmed.length,
        turn: items.filter((item) => item.kind === "user" && item.session === session).length + 1,
      });
      await runTurn(
        {
          type: "message",
          text: trimmed,
          ...(picked ? { product: picked } : {}),
          ...(stores.length ? { stores } : {}),
        },
        session,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, items, picked, runTurn, state, chosenStores, ensureSession],
  );

  /** "Buscar parecidos": the message goes with the photo, so the agent can compare it with the candidates. */
  const searchWithPhoto = useCallback(
    async (reference: PhotoSummary) => {
      if (busy || state !== "ready") return;
      const text = "Busque produtos parecidos com a minha foto de referência.";
      const session = reference.sessionId;
      atBottom.current = true;
      setItems((list) => [...list, said(session, text)]);
      track("photo_search_started", { attributes: reference.correction?.attributes.length ?? 0 });
      await runTurn({ type: "message", text, photoId: reference.id, ...(picked ? { product: picked } : {}) }, session);
    },
    [busy, picked, runTurn, state],
  );

  /** "See videos of this product": no model involved, the server searches TikTok and saves the result. */
  const showMedia = async () => {
    if (!picked || busy) return;
    // The person got what they picked it for: the bar goes away (it comes back if the call fails).
    const product = picked;
    setPicked(null);
    setBusy(true);
    try {
      const session = await ensureSession();
      setItems((list) => [...list, said(session, "Ver vídeos deste produto")]);
      track("product_videos_requested");
      const media = await api.media(session, product.title);
      setItems((list) => [...list, { id: uid(), session, at: new Date().toISOString(), kind: "media", media }]);
    } catch (error) {
      track("product_videos_failed", { status: error instanceof ApiError ? error.status : null });
      setPicked((current) => current ?? product);
      if (error instanceof ApiError && error.status === 401) expired();
      else
        setItems((list) => [
          ...list,
          {
            id: uid(),
            session: live.current?.id ?? "",
            kind: "notice",
            error: true,
            text: error instanceof ApiError ? error.message : "Perdi a conexão com a tone. Tente de novo.",
          },
        ]);
    } finally {
      setBusy(false);
    }
  };
  /** "O que dizem os reviews": a button, not a default (04/11/2026), to see how many people want it. */
  const showReviews = async () => {
    if (!picked || busy) return;
    const product = picked;
    setPicked(null);
    try {
      const session = await ensureSession();
      setItems((list) => [...list, said(session, "O que dizem os reviews deste produto")]);
      track("product_reviews_requested");
      const run = await api.reviews(session, product.title);
      setItems((list) => placeReviews(list, [run], session));
      setReviewsSince(Date.now());
    } catch (error) {
      track("product_reviews_failed", { status: error instanceof ApiError ? error.status : null });
      setPicked((current) => current ?? product);
      if (error instanceof ApiError && error.status === 401) expired();
      else
        setItems((list) => [
          ...list,
          {
            id: uid(),
            session: live.current?.id ?? "",
            kind: "notice",
            error: true,
            text: error instanceof ApiError ? error.message : "Perdi a conexão com a tone. Tente de novo.",
          },
        ]);
    }
  };
  // Síntese de reviews: read after each turn, then every 3 s while one runs (at most 5 min).
  const [reviewsSince, setReviewsSince] = useState<number | null>(null);
  const reviewsRunning = items.some((item) => item.kind === "reviews" && item.run.status === "running");
  useEffect(() => {
    if (reviewsRunning) setReviewsSince((value) => value ?? Date.now());
  }, [reviewsRunning]);
  useEffect(() => {
    if (reviewsSince === null || !liveId) return;
    let live = true;
    const read = () =>
      api
        .reviewRuns(liveId)
        .then((runs) => {
          if (!live) return;
          setItems((list) => placeReviews(list, runs, liveId));
          if (!runs.some((run) => run.status === "running") || Date.now() - reviewsSince > 5 * 60_000)
            setReviewsSince(null);
        })
        // A server without the route, or offline: stop until the next turn instead of asking every 3 s.
        .catch(() => {
          if (live) setReviewsSince(null);
        });
    void read();
    const timer = setInterval(read, 3000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [reviewsSince, liveId]);

  // T16: a panel's conversation started from its page arrives with its first message; it is sent once.
  // It comes from the page's search params: on a client navigation, window.location still
  // shows the previous page while this one first renders.
  const first = useRef<string | null>(props.first ?? null);
  useEffect(() => {
    const text = first.current;
    if (!text || state !== "ready" || busy) return;
    first.current = null;
    window.history.replaceState(null, "", window.location.pathname);
    void send(text);
  }, [state, busy, send]);

  // The single chat: what the frame asked to send (the tour's example, the welcome conversation).
  const { outbox, onOutboxSent } = props;
  const sentOutbox = useRef<number | null>(null);
  useEffect(() => {
    if (!outbox || sentOutbox.current === outbox.id || state !== "ready" || busy) return;
    sentOutbox.current = outbox.id;
    onOutboxSent?.();
    if (outbox.kind === "message") {
      void send(outbox.text);
      return;
    }
    // The welcome conversation is its own session (the server asks its five questions there).
    void (async () => {
      try {
        const { sessionId, greeting } = await api.newSession(true);
        const now = new Date().toISOString();
        liveRef({ id: sessionId, lastAt: now });
        setSessions((list) => [{ id: sessionId, onboarding: true, startedAt: now, lastAt: now, messages: 0 }, ...(list ?? [])]);
        setLoaded((count) => count + 1);
        atBottom.current = true;
        if (greeting) setItems((list) => [...list, { id: uid(), session: sessionId, at: now, kind: "assistant", text: greeting }]);
        setItems((list) => [...list, said(sessionId, WELCOME_FIRST)]);
        await runTurn({ type: "message", text: WELCOME_FIRST }, sessionId);
      } catch (error) {
        unopened(error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outbox, state, busy, send, runTurn, onOutboxSent]);

  const stop = () => {
    controller.current?.abort();
    setItems((list) => [
      ...list,
      { id: uid(), session: live.current?.id ?? "", at: new Date().toISOString(), kind: "notice", text: "Parei. O que já chegou continua aqui." },
    ]);
  };
  const storeOptions = mention ? filterStores(me?.stores ?? [], mention.query, chosenStores) : [];
  const listOpen = storeOptions.length > 0;
  const pickMentioned = (domain: string) => {
    if (!mention) return;
    const next = pickStore(draft, mention);
    setDraft(next.text);
    setChosenStores((list) => (list.includes(domain) ? list : [...list, domain]));
    setMention(null);
    track("store_mentioned", { store: domain });
    requestAnimationFrame(() => box.current?.setSelectionRange(next.caret, next.caret));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (listOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveStore((index) => (index + step + storeOptions.length) % storeOptions.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const option = storeOptions[activeStore] ?? storeOptions[0];
        if (option) pickMentioned(option.domain);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMention(null);
        return;
      }
    }
    // Enter sends, Shift+Enter breaks the line; while composing an accent (IME) Enter is the IME's.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  };

  if (state === "expired" && !props.onExpired) return <SignIn expired onDone={load} />;
  if (state === "missing")
    return (
      <main id="conteudo" className="mx-auto max-w-md px-5 py-12">
        <p className="text-body text-ink">Esta conversa não existe ou é de outra conta.</p>
        <Link href="/conversas" className="mt-4 inline-block text-ui text-ink underline">
          Voltar para a conversa
        </Link>
      </main>
    );
  if (state === "error")
    return (
      <main id="conteudo" className="mx-auto max-w-md px-5 py-12">
        <p role="alert" className="text-body text-ink">
          Não consegui abrir a conversa agora.
        </p>
        <button type="button" className="mt-4 min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised" onClick={load}>
          Tentar de novo
        </button>
      </main>
    );

  const lastAssistant = [...items].reverse().find((item) => item.kind === "assistant")?.id;
  // The thumbs go under the last answer of each turn (a turn is counted per session).
  const lastOfTurn = new Map<string, string>();
  for (const item of items) if (item.kind === "assistant" && item.turn) lastOfTurn.set(`${item.session}:${item.turn}`, item.id);
  const closesTurn = new Set(lastOfTurn.values());
  const rate = async (session: string, turn: number, rating: AnswerRatingChange, detail?: AnswerRatingDetail) => {
    await rateAnswer(session, { turn, rating, ...detail });
    setItems((list) =>
      list.map((item) =>
        item.kind === "assistant" && item.session === session && item.turn === turn ? { ...item, rating: rating === "none" ? null : rating } : item,
      ),
    );
  };
  // An answer's buttons work only on the last answer, while its session is still the one going on.
  const stillGoing = live.current ? !startsNewSession(live.current.lastAt) || Boolean(panel) : false;
  const hostFor = (item: Item): ProgramHost => ({
    sessionId: item.session,
    interactive: item.id === lastAssistant && !busy && item.session === liveId && stillGoing,
    answer: (answers, display) => {
      if (busy) return;
      track("conversation_reply_selected", { answers: Object.keys(answers).length });
      atBottom.current = true;
      setItems((list) => [...list, said(item.session, display)]);
      void runTurn({ type: "ui_answer", answers }, item.session);
    },
    say: (text) => void send(text),
    storeHosts: storeHostsOf(me?.stores),
    picked: picked?.url ?? null,
    pick: (product) => {
      track(product ? "product_picked" : "product_unpicked");
      setPicked(product);
    },
  });

  // What was read from the server is drawn apart from what is said in this visit: only the new
  // lines are a live region, so reading older history is not announced line by line.
  const kept = items.filter((item) => item.old);
  const fresh = items.filter((item) => !item.old);
  const ordered = [...kept, ...fresh];
  const days = dayStarts(ordered);
  // Each session's panels close it, after its last line.
  const lastOfSession = new Map<string, number>();
  ordered.forEach((item, index) => lastOfSession.set(item.session, index));
  const panelsAfter = new Map<number, typeof panels>();
  for (const entry of panels) {
    const index = entry.watch.sessionId ? lastOfSession.get(entry.watch.sessionId) : undefined;
    if (index === undefined) continue;
    panelsAfter.set(index, [...(panelsAfter.get(index) ?? []), entry]);
  }
  const draw = (item: Item, index: number) => {
    const day = days.get(index);
    const mark = found === item.id ? "found" : "";
    const line = (children: ReactNode, className = "") => (
      <div key={item.id} data-line={item.id} tabIndex={-1} className={`scroll-mt-24 scroll-mb-40 rounded-panel focus:outline-none ${mark} ${className}`}>
        {children}
      </div>
    );
    let body: ReactNode;
    if (item.kind === "user")
      body = line(
        <UserMessage text={item.text} stores={item.stores} options={me?.stores} className={`${bubble} rounded-ee-tag bg-ink text-on-ink`} />,
        `ms-auto ${bubbleWidth}`,
      );
    else if (item.kind === "notice")
      body = line(
        <p
          role={item.error && !item.saved && !item.old ? "alert" : undefined}
          className={`text-small ${item.error ? "font-medium text-alert" : "text-center text-graphite"}`}
        >
          {item.text}
        </p>,
      );
    else if (item.kind === "frame") body = line(<Program code={item.code} streaming={false} host={hostFor(item)} />);
    else if (item.kind === "research") body = line(<ResearchRun run={item.run} />);
    else if (item.kind === "media") body = line(<ProductVideos media={item.media} />);
    else if (item.kind === "reviews")
      body = line(<ReviewSynthesisCard run={item.run} onOpen={(sourceId) => track("review_link_opened", { source_id: sourceId })} />);
    else
      body = line(
        <div className="flex flex-col items-start gap-2">
          {splitAnswer(item.text).map((part, at) =>
            part.kind === "text" ? (
              <p key={at} className={`${bubble} ${bubbleWidth} rounded-es-tag bg-surface text-ink shadow-raised`}>
                {at === 0 ? <span className="sr-only">tone: </span> : null}
                {part.text}
              </p>
            ) : (
              <div key={at} className="w-full">
                <Program code={part.code} streaming={Boolean(item.streaming) && !part.complete} host={hostFor(item)} />
              </div>
            ),
          )}
          {item.turn && !item.streaming && closesTurn.has(item.id) ? (
            <AnswerRating rating={item.rating ?? null} onRate={(rating, detail) => rate(item.session, item.turn ?? 0, rating, detail)} />
          ) : null}
        </div>,
      );
    return [
      day ? (
        <div key={`dia-${item.id}`} className="flex justify-center py-2">
          <h2 className="rounded-full bg-sunken px-3 py-1 text-caption font-medium text-graphite">
            <time dateTime={day}>{dayLabel(day)}</time>
          </h2>
        </div>
      ) : null,
      body,
      ...(panelsAfter.get(index) ?? []).map((entry) => (
        <WatchReadings key={`painel-${entry.watch.id}`} watch={entry.watch} results={entry.results} sessionId={item.session} />
      )),
    ];
  };

  const composer = (
    <div className="sticky bottom-0 z-[5] -mx-1 flex flex-col gap-2 bg-paper px-1 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
      {busy ? (
        <p role="status" className="text-small text-graphite">
          A tone está trabalhando…
        </p>
      ) : null}
      {picked ? (
        <PickedProductBar
          product={picked}
          storeHosts={[...STORE_HOSTS, ...storeHostsOf(me?.stores)]}
          busy={busy}
          onVideos={() => void showMedia()}
          onReviews={() => void showReviews()}
          onRemove={() => {
            track("product_unpicked");
            setPicked(null);
          }}
        />
      ) : null}
      <PhotoReference state={photo} busy={busy} onSearch={(reference) => void searchWithPhoto(reference)} />
      <ChosenStores
        stores={me?.stores ?? []}
        chosen={chosenStores}
        onRemove={(domain) => setChosenStores((list) => list.filter((entry) => entry !== domain))}
      />
      <div className="relative flex items-end gap-1 rounded-card bg-surface p-1 shadow-raised has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-ink">
        <PhotoPicker
          className="size-11 hover:bg-sunken"
          disabled={busy || state !== "ready" || photo.working !== null}
          onFile={(file) => void photo.pick(file)}
        />
        <label htmlFor="mensagem" className="sr-only">
          Mensagem
        </label>
        {listOpen ? (
          <StoreOptions
            id="lojas-mencao"
            options={storeOptions}
            active={Math.min(activeStore, storeOptions.length - 1)}
            onActive={setActiveStore}
            onPick={(option) => pickMentioned(option.domain)}
          />
        ) : null}
        <textarea
          id="mensagem"
          ref={box}
          rows={1}
          maxLength={4000}
          value={draft}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={listOpen}
          aria-controls={listOpen ? "lojas-mencao" : undefined}
          aria-activedescendant={listOpen ? `lojas-mencao-${Math.min(activeStore, storeOptions.length - 1)}` : undefined}
          enterKeyHint="send"
          placeholder={
            state === "loading"
              ? "Carregando… já dá para escrever"
              : me?.stores?.length
                ? "Mensagem · @ para lojas"
                : "Mensagem para a tone"
          }
          onChange={(event) => {
            setDraft(event.target.value);
            setMention(me?.stores?.length ? mentionAt(event.target.value, event.target.selectionStart) : null);
            setActiveStore(0);
          }}
          onBlur={() => setMention(null)}
          onKeyDown={onKeyDown}
          // Writing while the conversation loads: on 04/11/2026 a slow load left this box locked
          // and the tester clicked it again and again. Only sending waits for "ready".
          disabled={state !== "ready" && state !== "loading"}
          className="max-h-48 min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-body text-ink outline-none [field-sizing:content] placeholder:text-graphite"
        />
        {busy ? (
          <button
            type="button"
            onClick={stop}
            aria-label="Parar a resposta"
            className="press grid size-11 shrink-0 place-items-center rounded-full bg-sunken text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <StopIcon />
          </button>
        ) : (
          <button
            type="button"
            disabled={state !== "ready" || !draft.trim()}
            onClick={() => void send(draft)}
            aria-label="Enviar"
            className="press grid size-11 shrink-0 place-items-center rounded-full bg-ink text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <SendIcon />
          </button>
        )}
      </div>
    </div>
  );

  const chat = (
    <main id="conteudo" className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
      <h1 className="sr-only">{panel ? `Conversa do painel ${panelTitle ?? ""}` : "Conversa com a tone"}</h1>
      {panel ? (
        // Sticky under the app bar: the way back to the panel stays in reach in a long conversation.
        <header className="sticky top-17 z-[5] flex flex-wrap items-center justify-between gap-3 bg-paper/90 py-2 backdrop-blur">
          <Link href={back.href} className="min-h-11 content-center text-ui text-ink underline-offset-4 hover:underline">
            {back.label}
          </Link>
          {researchNote(me) ? <p className="text-caption text-graphite">{researchNote(me)}</p> : null}
        </header>
      ) : null}
      <div data-ph-mask className="flex flex-1 flex-col justify-end gap-3 pb-4 pt-2">
        <div ref={top} aria-hidden={!hasOlder} />
        {hasOlder ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void loadOlder()}
              disabled={older === "loading"}
              className="press min-h-11 rounded-full px-4 text-ui text-graphite hover:text-ink disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {older === "loading" ? "Carregando mensagens anteriores…" : older === "failed" ? "Tentar carregar as anteriores de novo" : "Ver mensagens anteriores"}
            </button>
          </div>
        ) : null}
        {state === "loading" ? (
          <p role="status" className="text-center text-small text-graphite">
            Carregando a conversa…
          </p>
        ) : null}
        {state === "ready" && !panel && items.length === 0 ? props.empty : null}
        <div className="flex flex-col gap-3">{kept.map((item, index) => draw(item, index))}</div>
        <div role="log" aria-live="polite" aria-relevant="additions" aria-label="Mensagens novas" className="flex flex-col gap-3 empty:hidden">
          {fresh.map((item, index) => draw(item, kept.length + index))}
        </div>
        <div ref={bottom} />
      </div>
      {composer}
    </main>
  );
  if (!panel) return chat;
  return (
    <Shell me={me} sessionId={panel.sessionId}>
      {chat}
    </Shell>
  );
}

/**
 * T16: what the research of this page cannot do, said in the header. The list of stores read
 * directly ("Também pesquiso direto em…") left the header on 10/11/2026: noise above every conversation.
 */
export function researchNote(me: Me | null): string | null {
  return me?.remoteStores?.length ? null : "Escolher a variação e pôr no carrinho, só na loja";
}
