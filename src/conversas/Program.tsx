"use client";
// The agent's OpenUI Lang blocks on the web, drawn by the same components as the
// extension's panel (src/tone/genui, copied from toneorg/extension). Only the
// actions are the web's: open a store page in a new tab when the person clicks,
// answer a question, pick a product to talk about, or change a decision or a
// watch as the person.
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
import { type ClickWhere, type DecisionOp, isCheckoutUrl, type PickedProduct, type WatchRule } from "@/tone/shared";
import { api, trackClick } from "./api";

/** Stores whose product photos and pages the web may show or link. */
export const STORE_HOSTS = [
  "amazon.com.br",
  "mercadolivre.com.br",
  "mercadolibre.com",
  "magazineluiza.com.br",
  "sephora.com.br",
  "lojasrenner.com.br",
];

export interface ProgramHost {
  sessionId: string;
  /** Questions answer only on the latest answer, with nothing running. */
  interactive: boolean;
  /** The person answered a question component: what the conversation shows and what becomes memory. */
  answer: (answers: Answer[], display: string) => void;
  say: (text: string) => void;
  /** The url of the product picked to talk about, shown above the composer. */
  picked: string | null;
  pick: (product: PickedProduct | null) => void;
}

/**
 * A store link only for an HTTPS store page that does not pay. `store` is a store the server itself
 * read and checked the offer against (T16, a remote browser); what the model writes gets only the fixed list.
 */
export function storeLink(url: string, store?: string): string | null {
  if (!URL.canParse(url)) return null;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || isCheckoutUrl(url)) return null;
  const hosts = store ? [...STORE_HOSTS, store] : STORE_HOSTS;
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
      {props.label ?? "Ver na loja"}
      <span className="sr-only"> (abre em outra aba)</span>
    </a>
  );
}

/** Opens a product the person clicked, in a new tab, only on a store page that does not pay. */
export function openStore(sessionId: string, url: string, title: string, where: ClickWhere) {
  const href = storeLink(url);
  if (!href) return;
  trackClick(sessionId, href, title, where);
  window.open(href, "_blank", "noopener,noreferrer");
}

/** The web's side of the components: what each button does, and where decisions and watches live. */
function useWebHost(host: ProgramHost): GenUIHost {
  const { sessionId, interactive, answer, say, picked, pick } = host;
  const decisions = useMemo(
    () => ({
      load: () => api.decision(sessionId),
      change: (version: number, ops: DecisionOp[]) => api.changeDecision(sessionId, version, ops),
    }),
    [sessionId],
  );
  const watches = useMemo(
    () => ({
      load: (id: string) => api.watch(id),
      save: (id: string, version: number, draft: WatchRule) => api.saveWatch(id, version, draft),
      confirm: (id: string, version: number) => api.confirmWatch(id, version),
    }),
    [],
  );
  const act = (action: GenUIAction) => {
    switch (action.type) {
      case "open":
        openStore(sessionId, action.url, action.title, action.where ?? { source: "generated_ui" });
        return;
      case "reject":
        if (action.reason in REJECT_REASONS)
          say(`Não curti "${action.title}". Motivo: ${REJECT_REASONS[action.reason as RejectReason].toLowerCase()}.`);
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
    }
  };
  return { storeHosts: STORE_HOSTS, interactive, actionable: true, act, picked, decisions, watches };
}

/** One block of an answer, drawn while it streams, exactly as the extension draws it. */
export function Program(props: { code: string; streaming: boolean; host: ProgramHost }) {
  const host = useWebHost(props.host);
  return (
    <GenUIContext value={host}>
      <GenUIBlock code={props.code} streaming={props.streaming} />
    </GenUIContext>
  );
}
