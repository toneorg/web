"use client";
// What the tone is doing now (20/11/2026). A turn can take a minute: one live line says the step in
// course and how long it has taken, the steps already done stay under it, quiet, and the research
// shows the stores answering and the offers counted, never raw offers before the tone chose. When the
// turn ends, it all folds into one line the person can open: the steps, the stores and what was missing.
import { useEffect, useState } from "react";
import { type AgentEvent, provenanceNote, type ResearchRunState, type StatusStep, storeLabel } from "@/tone/shared";
import { Icon } from "@/tone/genui/Icon";

export interface ActivityStep {
  text: string;
  step?: StatusStep;
  /** How the step reads once it is over; without it the text is kept. */
  doneText?: string;
  startedAt: number;
  endedAt?: number;
}

export interface Activity {
  steps: ActivityStep[];
  /** The research runs of this turn, drawn inside the activity instead of on their own. */
  runs: Record<string, ResearchRunState>;
  startedAt: number;
  endedAt?: number;
}

export const newActivity = (now: number): Activity => ({ steps: [], runs: {}, startedAt: now });

/** Each status closes the step before it; a statement that is already over (`done`) closes itself. */
export function applyStatus(
  activity: Activity,
  status: Extract<AgentEvent, { type: "status" }>,
  now: number,
): Activity {
  const current = activity.steps.at(-1);
  // The same step said again (a second round of the model writing) is the step going on.
  if (current && current.endedAt === undefined && current.text === status.text) return activity;
  const steps = activity.steps.map((entry) => (entry.endedAt === undefined ? { ...entry, endedAt: now } : entry));
  steps.push({
    text: status.text,
    ...(status.step ? { step: status.step } : {}),
    ...(status.doneText ? { doneText: status.doneText } : {}),
    startedAt: now,
    ...(status.done ? { endedAt: now } : {}),
  });
  return { ...activity, steps };
}

/** The first words of the answer arrived: if nothing said so, the step is writing. */
export function startWriting(activity: Activity, now: number): Activity {
  const current = activity.steps.at(-1);
  if (current?.step === "write" && current.endedAt === undefined) return activity;
  return applyStatus(activity, { type: "status", step: "write", text: "Escrevendo a resposta" }, now);
}

export function endActivity(activity: Activity, now: number): Activity {
  return {
    ...activity,
    endedAt: now,
    steps: activity.steps.map((entry) => (entry.endedAt === undefined ? { ...entry, endedAt: now } : entry)),
  };
}

/** Steps worth keeping in the summary: reading the message and writing are every turn's, not news. */
const telling = (entry: ActivityStep) => entry.step !== "understand" && entry.step !== "write";

/** A plain answer (no search, no tool) leaves no trace once it is over. */
export const worthKeeping = (activity: Activity) =>
  Object.keys(activity.runs).length > 0 || activity.steps.some(telling);

interface StoreCount {
  store: string;
  label: string;
  offers: number;
}

/** Offers per store across the runs, most first. */
export function storeCounts(runs: readonly ResearchRunState[]): StoreCount[] {
  const counts = new Map<string, number>();
  // A brand's own store (Shopify) is not in the list of names: its seller says who it is.
  const sellers = new Map<string, string>();
  for (const run of runs)
    for (const offer of run.result?.offers ?? []) {
      counts.set(offer.store, (counts.get(offer.store) ?? 0) + 1);
      if (offer.seller?.name && !sellers.has(offer.store)) sellers.set(offer.store, offer.seller.name);
    }
  const named = (store: string) => {
    const label = storeLabel(store);
    return label !== store ? label : (sellers.get(store) ?? store.replace(/^www\./, ""));
  };
  return [...counts]
    .map(([store, offers]) => ({ store, label: named(store), offers }))
    .sort((left, right) => right.offers - left.offers || left.label.localeCompare(right.label, "pt-BR"));
}

/** The stores that did not answer, by name: a gap the person should know about. */
export function missingStores(runs: readonly ResearchRunState[]): { label: string; blocked: boolean }[] {
  const seen = new Set<string>();
  const missing: { label: string; blocked: boolean }[] = [];
  for (const run of runs)
    for (const source of run.result?.sources ?? []) {
      if (source.state !== "unavailable" && source.state !== "blocked") continue;
      const store = source.source.includes(":") ? source.source.split(":").pop() ?? "" : "";
      // Index endpoints (Google Shopping, Amazon) name a provider, not a store the person knows.
      const label = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(store) ? storeLabel(store) : source.source.startsWith("dataforseo") ? "Amazon" : "Google Shopping";
      if (seen.has(label)) continue;
      seen.add(label);
      missing.push({ label, blocked: source.state === "blocked" });
    }
  return missing;
}

const plural = (count: number, one: string, many: string) => `${count.toLocaleString("pt-BR")} ${count === 1 ? one : many}`;
const seconds = (ms: number) => `${Math.max(1, Math.round(ms / 1000))} s`;

/** The one line a finished turn folds into. */
export function activitySummary(activity: Activity): string {
  const runs = Object.values(activity.runs);
  const offers = runs.reduce((sum, run) => sum + (run.result?.offers.length ?? run.offers ?? 0), 0);
  const stores = storeCounts(runs).length;
  const took = activity.endedAt ? ` · ${seconds(activity.endedAt - activity.startedAt)}` : "";
  if (runs.length && offers)
    return `Pesquisei ${plural(offers, "oferta", "ofertas")}${stores ? ` em ${plural(stores, "loja", "lojas")}` : ""}${took}`;
  if (runs.length) return `Pesquisei e não achei ofertas${took}`;
  return `Pensei por ${activity.endedAt ? seconds(activity.endedAt - activity.startedAt) : "alguns segundos"}`;
}

function Elapsed(props: { since: number }) {
  // Starts from the step itself (the same on the server and the first paint), then ticks each second.
  const [now, setNow] = useState(props.since);
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  return <span className="tabular-nums text-graphite">{seconds(now - props.since)}</span>;
}

/** The stores answering, as quiet counts; the rest folded into "+N". */
function StoreLine(props: { runs: readonly ResearchRunState[]; limit?: number }) {
  const counts = storeCounts(props.runs);
  if (!counts.length) return null;
  const limit = props.limit ?? 5;
  const shown = counts.slice(0, limit);
  return (
    <p className="text-caption text-graphite">
      {shown.map((entry, index) => (
        <span key={entry.store}>
          {index ? " · " : ""}
          {entry.label} <span className="tabular-nums">{entry.offers}</span>
        </span>
      ))}
      {counts.length > limit ? ` · +${counts.length - limit} ${counts.length - limit === 1 ? "loja" : "lojas"}` : ""}
    </p>
  );
}

/** What the research is doing now, in the live line's words: the run's own message, then the count. */
function searchLine(runs: readonly ResearchRunState[]): string | null {
  const live = runs.find((run) => !run.terminal) ?? runs.at(-1);
  if (!live) return null;
  const offers = live.result?.offers.length ?? live.offers ?? 0;
  const stores = storeCounts([live]).length;
  if (!live.terminal && offers) return `${plural(offers, "oferta", "ofertas")} em ${plural(stores, "loja", "lojas")} até agora`;
  return live.message || null;
}

function DoneStep(props: { entry: ActivityStep; runs: readonly ResearchRunState[] }) {
  const { entry } = props;
  const search = entry.step === "search";
  const offers = props.runs.reduce((sum, run) => sum + (run.result?.offers.length ?? 0), 0);
  const stores = storeCounts(props.runs).length;
  const label = search && offers ? `Achei ${plural(offers, "oferta", "ofertas")} em ${plural(stores, "loja", "lojas")}` : (entry.doneText ?? entry.text);
  return (
    <li className="flex gap-2">
      <span className="grid h-[18px] w-6 shrink-0 place-items-center text-graphite" aria-hidden="true">
        <Icon name="check" size={14} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-caption text-ink">{label}</span>
        {search ? <StoreLine runs={props.runs} /> : null}
      </span>
    </li>
  );
}

/** The steps and the stores of a finished turn, inside its summary. */
function Details(props: { activity: Activity }) {
  const runs = Object.values(props.activity.runs);
  const missing = missingStores(runs);
  const steps = props.activity.steps.filter(telling);
  return (
    <div className="flex flex-col gap-3 pb-1 pt-2">
      {steps.length ? (
        <ul className="flex flex-col gap-1.5">
          {steps.map((entry, index) => (
            <DoneStep key={`${entry.text}-${index}`} entry={entry} runs={runs} />
          ))}
        </ul>
      ) : null}
      {runs.length && !steps.some((entry) => entry.step === "search") ? (
        <div className="ps-8">
          <StoreLine runs={runs} limit={8} />
        </div>
      ) : null}
      {missing.length ? (
        <p className="ps-8 text-caption text-graphite">
          Não {missing.length === 1 ? "respondeu" : "responderam"}: {missing.map((entry) => entry.label).join(", ")}.
        </p>
      ) : null}
      {/* Where the prices came from, said once: a price can still change at the store. */}
      {runs.some((run) => run.result?.offers.length) ? (
        <p className="ps-8 text-caption text-graphite">{provenanceNote(runs.findLast((run) => run.result?.offers.length) ?? (runs[0] as ResearchRunState))}</p>
      ) : null}
    </div>
  );
}

/** A finished turn, folded: one line, opened on request; the latest search also offers its stores. */
export function ActivitySummary(props: { activity: Activity; onStores?: () => void }) {
  const details = (
    <details className="group text-small text-graphite">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full pe-3 marker:hidden hover:text-ink focus-visible:text-ink [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-sunken text-ink">
          <Icon name="check" size={14} />
        </span>
        <span>{activitySummary(props.activity)}</span>
        <span aria-hidden="true" className="transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none">
          <Icon name="down" size={16} />
        </span>
      </summary>
      <Details activity={props.activity} />
    </details>
  );
  if (!props.onStores) return details;
  return (
    <div className="flex flex-wrap items-start gap-x-1">
      {details}
      <button
        type="button"
        onClick={props.onStores}
        className="min-h-11 rounded-full px-2 text-small text-ink underline decoration-rule underline-offset-4 hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Escolher lojas
      </button>
    </div>
  );
}

/** The turn going on: the step in course, live, and the ones already done under it. */
export function LiveActivity(props: { activity: Activity }) {
  const { activity } = props;
  const runs = Object.values(activity.runs);
  const current = activity.steps.at(-1);
  const inCourse = current && current.endedAt === undefined ? current : undefined;
  const done = activity.steps.filter((entry) => entry !== inCourse && telling(entry));
  const detail = inCourse?.step === "search" ? searchLine(runs) : null;
  return (
    <section aria-label="O que a tone está fazendo" className="flex flex-col gap-2 py-1">
      <p className="flex items-center gap-2 text-small font-medium text-ink">
        <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center">
          <span className="size-2 rounded-full bg-ink animate-pulse motion-reduce:animate-none" />
        </span>
        {/* Only the step is read aloud when it changes; the seconds tick silently. */}
        <span aria-live="polite" aria-atomic="true" className="min-w-0">
          {inCourse?.text ?? "Pensando"}
        </span>
        <Elapsed since={inCourse?.startedAt ?? activity.startedAt} />
      </p>
      {detail ? <p className="ps-8 text-caption text-graphite">{detail}</p> : null}
      {inCourse?.step === "search" ? (
        <div className="ps-8">
          <StoreLine runs={runs} />
        </div>
      ) : null}
      {done.length ? (
        <ul className="flex flex-col gap-1.5">
          {done.map((entry, index) => (
            <DoneStep key={`${entry.text}-${index}`} entry={entry} runs={runs} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** A research run read back from an earlier visit: the same folded line as a turn that just ended. */
export function ResearchRunSummary(props: { run: ResearchRunState; onStores?: () => void }) {
  const startedAt = Date.parse(props.run.startedAt);
  const endedAt = Date.parse(props.run.updatedAt);
  const activity: Activity = {
    steps: [],
    runs: { [props.run.runId]: props.run },
    startedAt,
    ...(props.run.terminal && Number.isFinite(endedAt) ? { endedAt } : {}),
  };
  return <ActivitySummary activity={activity} onStores={props.onStores} />;
}
