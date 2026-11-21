"use client";
// The agent's OpenUI Lang blocks on the web, drawn by the components copied from
// the server repository (src/tone/genui). Only the actions are the web's: open a
// store page in a new tab when the person clicks, answer a question, pick a
// product to talk about, or change a decision or a watch as the person.
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  type Answer,
  GenUIBlock,
  GenUIContext,
  type GenUIAction,
  type GenUIHost,
  REJECT_REASONS,
  type RejectReason,
} from "@/tone/genui";
import {
  type ClickWhere,
  type DecisionOp,
  GOOGLE_SHOPPING,
  INDEX_STORES,
  isCheckoutUrl,
  isGoogleShoppingUrl,
  type PickedProduct,
  type ResearchContext,
  type StoreOption,
  type WatchRule,
} from "@/tone/shared";
import { track } from "./analytics";
import { api, trackClick, trackRejected } from "./api";

/** Stores whose product photos and pages the web may show or link: the server index's (shared list). */
export const STORE_HOSTS: string[] = [...INDEX_STORES, "mercadolibre.com"];

/**
 * The hosts of the stores the server lists in /api/me (the @ picker): their domains and where their
 * pages live when elsewhere (Dior's catalog is on shop.dior.com.br). Configured on the server, never
 * written by the model; on 15/11/2026 "Ver na loja" did nothing on Dior's products for lack of them.
 */
export function storeHostsOf(stores: readonly StoreOption[] | undefined): string[] {
  return [...new Set((stores ?? []).flatMap((store) => [store.domain, ...(store.hosts ?? [])]))];
}

export interface ProgramHost {
  sessionId: string;
  /** Questions answer only on the latest answer, with nothing running. */
  interactive: boolean;
  /** The person answered a question component: what the conversation shows and what becomes memory. */
  answer: (answers: Answer[], display: string) => void;
  say: (text: string) => void;
  /** Hosts of the stores listed in /api/me, besides the fixed list (`storeHostsOf`). */
  storeHosts?: readonly string[];
  /** The url of the product picked to talk about, shown above the composer. */
  picked: string | null;
  pick: (product: PickedProduct | null) => void;
  /** The person tapped the answers to a draft's questions on the chat's card. */
  answerWatch?: (watchId: string, text: string) => void;
  /** What weighed on the search of this answer (the "Usei" line of the carousel). */
  research?: ResearchContext | null;
  /** Runs the last search of the conversation again, said as the person, leaving these preferences out. */
  searchAgain?: (text: string, skipPersonal: string[]) => void;
}

/** The draft card's own actions: answers as a panel turn, and the page of a confirmed panel. */
export function watchAction(
  action: GenUIAction,
  deps: { answerWatch: (watchId: string, text: string) => void; openPanel: (href: string) => void },
): boolean {
  if (action.type === "answer_watch") {
    track("watch_draft_answered", { source: "conversation" });
    deps.answerWatch(action.watchId, action.text);
    return true;
  }
  if (action.type === "open_panel") {
    track("watch_panel_opened_from_chat");
    deps.openPanel(`/paineis/${action.watchId}`);
    return true;
  }
  return false;
}

/**
 * A store link only for an HTTPS store page that does not pay, or a Google Shopping product page (a
 * product known only from the index). `store` is a store the server itself read and checked the offer
 * against (T16, a remote browser); what the model writes gets only the fixed list.
 */
export function storeLink(url: string, store?: string, extraHosts: readonly string[] = []): string | null {
  if (isGoogleShoppingUrl(url)) return url;
  // Google is never a store host: only the product page above opens, never another Google address.
  if (store === GOOGLE_SHOPPING) store = undefined;
  if (!URL.canParse(url)) return null;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || isCheckoutUrl(url)) return null;
  const hosts = [...STORE_HOSTS, ...extraHosts, ...(store ? [store] : [])];
  return hosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)) ? url : null;
}

/** What a click on the link records: the conversation, the product and where it was on the screen. */
export interface ClickContext {
  sessionId: string | null;
  title: string;
  where: ClickWhere;
}

export function StoreLink(props: { url: string; label?: string; click?: ClickContext; store?: string }) {
  const href = storeLink(props.url, props.store);
  if (!href) return null;
  const { click } = props;
  // A middle click also opens the store, so it counts too; a right click does not.
  const record = click ? () => trackClick(click.sessionId, href, click.title, click.where) : undefined;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={record}
      onAuxClick={(event) => {
        if (event.button === 1) record?.();
      }}
      className="inline-flex min-h-11 items-center rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      {isGoogleShoppingUrl(href) ? "Ver no Google Shopping" : (props.label ?? "Ver na loja")}
      <span className="sr-only"> (abre em outra aba)</span>
    </a>
  );
}

/** Opens a product the person clicked, in a new tab, only on a store page that does not pay. */
export function openStore(
  sessionId: string,
  url: string,
  title: string,
  where: ClickWhere,
  extraHosts: readonly string[] = [],
) {
  const href = storeLink(url, undefined, extraHosts);
  if (!href) {
    // Only the host, never the address: a refused link is a gap in the list of stores to close.
    track("store_link_blocked", { host: URL.canParse(url) ? new URL(url).hostname : null });
    return;
  }
  trackClick(sessionId, href, title, where);
  window.open(href, "_blank", "noopener,noreferrer");
}

/** Tells the panels column a watch changed in the conversation, so it shows the new state. */
export const WATCHES_CHANGED = "tone:watches-changed";
function announceWatches<T>(watch: T): T {
  window.dispatchEvent(new Event(WATCHES_CHANGED));
  return watch;
}

/** "Não curti": the server keeps the rejection, the chat gets the phrase, the analytics the reason only. */
export function rejectProduct(
  sessionId: string,
  action: Extract<GenUIAction, { type: "reject" }>,
  say: (text: string) => void,
) {
  track("recommendation_rejected_clicked", { reason: action.reason });
  if (!(action.reason in REJECT_REASONS)) return;
  const { offerId, runId } = action as { offerId?: string; runId?: string };
  trackRejected({
    sessionId,
    url: action.url,
    title: action.title,
    reason: action.reason,
    ...(offerId ? { offerId } : {}),
    ...(runId ? { runId } : {}),
  });
  say(`Não curti "${action.title}". Motivo: ${REJECT_REASONS[action.reason as RejectReason].toLowerCase()}.`);
}

/** The web's side of the components: what each button does, and where decisions and watches live. */
function useWebHost(host: ProgramHost): GenUIHost {
  const { sessionId, interactive, answer, say, picked, pick } = host;
  const router = useRouter();
  const extraHosts = host.storeHosts ?? [];
  const decisions = useMemo(
    () => ({
      load: () => api.decision(sessionId),
      change: (version: number, ops: DecisionOp[]) => {
        track("decision_changed", { ops: ops.length, kind: ops[0]?.type ?? null });
        return api.changeDecision(sessionId, version, ops);
      },
    }),
    [sessionId],
  );
  const watches = useMemo(
    () => ({
      load: (id: string) => api.watch(id),
      save: (id: string, version: number, draft: WatchRule) => {
        track("watch_draft_saved", { kind: draft.kind, condition: draft.condition.kind });
        return api.saveWatch(id, version, draft).then(announceWatches);
      },
      confirm: (id: string, version: number) => {
        track("watch_draft_confirmed", { source: "conversation" });
        return api.confirmWatch(id, version).then(announceWatches);
      },
    }),
    [],
  );
  const act = (action: GenUIAction) => {
    if (watchAction(action, { answerWatch: host.answerWatch ?? (() => undefined), openPanel: (href) => router.push(href) }))
      return;
    switch (action.type) {
      case "open":
        openStore(sessionId, action.url, action.title, action.where ?? { source: "generated_ui" }, extraHosts);
        return;
      case "reject":
        rejectProduct(sessionId, action, say);
        return;
      case "say":
        say(action.text);
        return;
      case "answer":
        answer(action.answers, action.display);
        return;
      case "pick":
        pick(action.product);
        return;
      case "track":
        track(action.event, action.props);
        return;
      case "skip_personal":
        track("used_filter_skipped", { id: action.ids.join(",") });
        host.searchAgain?.(`Pesquisa de novo sem ${action.label}`, action.ids);
        return;
      case "change_memory":
        track("used_filter_changed", { key: action.key });
        void api
          .correctMemory(action.id, action.value)
          .then(() => host.searchAgain?.(`Pesquisa de novo com ${action.label}`, []))
          .catch(() => {
            // The note could not be changed here: the person asks in the chat, where the agent changes it.
            track("used_filter_change_failed", { key: action.key });
            say(`Muda minha preferência para ${action.label} e pesquisa de novo`);
          });
        return;
    }
  };
  return {
    storeHosts: [...STORE_HOSTS, ...extraHosts],
    interactive,
    actionable: true,
    act,
    picked,
    decisions,
    watches,
    research: host.research ?? null,
  };
}

/** One block of an answer, drawn while it streams. */
export function Program(props: { code: string; streaming: boolean; host: ProgramHost }) {
  const host = useWebHost(props.host);
  return (
    <GenUIContext value={host}>
      <GenUIBlock code={props.code} streaming={props.streaming} />
    </GenUIContext>
  );
}
