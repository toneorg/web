// The "Usei" of each answer (21/11/2026): which search of its turn weighed on it. Live, the turn's
// activity holds its runs, so no clocks are compared (the client's and the server's may differ).
// Reopened, the runs are drawn apart from the messages, and both carry the server's time.
import type { ResearchContext, ResearchRunState } from "@/tone/shared";
import type { Item } from "./Conversation";

const latest = (runs: ResearchRunState[]) =>
  runs
    .filter((run) => run.context)
    .sort((left, right) => left.startedAt.localeCompare(right.startedAt))
    .at(-1)?.context ?? null;

export function researchContexts(items: readonly Item[]): Map<string, ResearchContext> {
  const found = new Map<string, ResearchContext>();
  const saved = items.flatMap((item) => (item.kind === "research" && item.old ? [item.run] : []));
  let turn: ResearchContext | null = null;
  let asked: Record<string, string> = {};
  for (const item of items) {
    if (item.kind === "activity") turn = latest(Object.values(item.activity.runs));
    if (item.kind === "user" && item.at) asked = { ...asked, [item.session]: item.at };
    if (item.kind !== "assistant") continue;
    if (!item.old) {
      if (turn) found.set(item.id, turn);
      continue;
    }
    const at = item.at;
    if (!at) continue;
    const since = asked[item.session];
    const context = latest(
      saved.filter((run) => run.sessionId === item.session && run.startedAt <= at && (!since || run.startedAt >= since)),
    );
    if (context) found.set(item.id, context);
  }
  return found;
}
