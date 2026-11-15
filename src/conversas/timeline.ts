// The single chat (15/11/2026): the person's conversations shown as one, like a messaging app.
// Under the hood each pause starts a new server session (the purchase situations, the research
// and the decision board stay per session); the person only sees the day change.

/** After this long without a message, the next one opens a new session, silently. */
export const SESSION_GAP_MS = 6 * 60 * 60 * 1000;

/** Whether a message written at `now` goes into a new session after the one last active at `lastAt`. */
export function startsNewSession(lastAt: string | null | undefined, now = Date.now()): boolean {
  if (!lastAt) return true;
  const last = Date.parse(lastAt);
  return !Number.isFinite(last) || now - last >= SESSION_GAP_MS;
}

const ZONE = "America/Sao_Paulo";
const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** The calendar day of an instant in Brazil, as "2026-11-15". */
export function dayKey(iso: string): string {
  return dayFormat.format(new Date(iso));
}

/** The separator of a day in the chat: "Hoje", "Ontem", "12 de novembro" or "12 de novembro de 2025". */
export function dayLabel(iso: string, now = new Date()): string {
  const day = dayKey(iso);
  const today = dayKey(now.toISOString());
  if (day === today) return "Hoje";
  if (day === dayKey(new Date(now.getTime() - 86_400_000).toISOString())) return "Ontem";
  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: ZONE,
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** The time of a message, "14:05". */
export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { timeZone: ZONE, hour: "2-digit", minute: "2-digit" });
}

/** The key of a saved line of the chat: its session and its position in that session's transcript. */
export const lineKey = (sessionId: string, index: number) => `${sessionId}:${index}`;

/**
 * Where each day separator goes: the indexes of the lines that open a new day. A line without a
 * time (a research card) belongs to the day of the line before it.
 */
export function dayStarts(lines: { at?: string }[]): Map<number, string> {
  const starts = new Map<number, string>();
  let current: string | null = null;
  lines.forEach((line, index) => {
    if (!line.at) return;
    const day = dayKey(line.at);
    if (day !== current) starts.set(index, line.at);
    current = day;
  });
  return starts;
}

/** Where the chat should go: a session (an old link) or one line of it (a search result). */
export type ChatTarget = { sessionId: string; index?: number };

/** Reads `?em=<session>` (and `&linha=<n>`) from the chat's address. */
export function targetFromSearch(search: string): ChatTarget | null {
  const params = new URLSearchParams(search);
  const sessionId = params.get("em");
  if (!sessionId || !/^[A-Za-z0-9_-]{1,80}$/.test(sessionId)) return null;
  const line = Number(params.get("linha"));
  return Number.isInteger(line) && line >= 0 && params.has("linha") ? { sessionId, index: line } : { sessionId };
}
