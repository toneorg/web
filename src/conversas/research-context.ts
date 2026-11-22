// The "Usei" of each answer (21/11/2026): which search of its turn weighed on it. Live, the answer
// names its turn's activity, which holds the runs, so no clocks are compared (the client's and the
// server's may differ); an answer without a search of its own gets none.
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
  const turns = new Map(
    items.flatMap((item) => (item.kind === "activity" ? [[item.id, item.activity] as const] : [])),
  );
  let asked: Record<string, string> = {};
  for (const item of items) {
    // A tapped answer starts a turn as a message does.
    if ((item.kind === "user" || (item.kind === "notice" && item.tapped)) && item.at)
      asked = { ...asked, [item.session]: item.at };
    if (item.kind !== "assistant") continue;
    if (!item.old) {
      const activity = item.activityId ? turns.get(item.activityId) : undefined;
      const context = activity ? latest(Object.values(activity.runs)) : null;
      if (context) found.set(item.id, context);
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
