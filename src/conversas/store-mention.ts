// "@" in the composer opens a list of stores; the picked ones limit this message's search.
import type { StoreOption } from "@/tone/shared";

export interface Mention {
  /** Index of the "@" in the text. */
  start: number;
  /** What was typed after it, up to the caret. */
  query: string;
}

const MAX_QUERY = 30;

const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, "")
    .trim();

/** The "@term" right before the caret: at the start or after a space, on one line, short. */
export function mentionAt(text: string, caret: number): Mention | null {
  const at = text.lastIndexOf("@", caret - 1);
  if (at < 0) return null;
  if (at > 0 && !/\s/.test(text[at - 1] ?? "")) return null;
  const query = text.slice(at + 1, caret);
  if (query.includes("\n") || query.length > MAX_QUERY) return null;
  return { start: at, query };
}

/**
 * Stores whose name or domain holds the term, names starting with it first; picked ones left out.
 * All of them: the list scrolls, and a cap hid every store after the first letters (Fast Shop, Shein).
 */
export function filterStores(stores: readonly StoreOption[], query: string, picked: readonly string[]): StoreOption[] {
  const term = fold(query);
  const compact = term.replace(/ /g, "");
  return stores
    .filter((store) => !picked.includes(store.domain))
    .filter((store) => !term || fold(store.label).includes(term) || store.domain.includes(compact))
    .sort(
      (a, b) =>
        Number(fold(b.label).startsWith(term)) - Number(fold(a.label).startsWith(term)) ||
        a.label.localeCompare(b.label, "pt-BR"),
    );
}

/** The text without the "@term", and where the caret goes. */
export function pickStore(text: string, mention: Mention): { text: string; caret: number } {
  const before = text.slice(0, mention.start);
  let after = text.slice(mention.start + 1 + mention.query.length);
  if (before.endsWith(" ") || !before) after = after.replace(/^ +/, "");
  return { text: before + after, caret: before.length };
}

const READINGS: Record<StoreOption["reading"], string> = {
  catalog: "catálogo da loja",
  direct: "busca da loja",
  amazon: "listagem da Amazon",
  unblock: "página da loja",
  index: "preço anunciado",
};
/** How tone reads a store, as the list shows it. */
export const readingLabel = (reading: StoreOption["reading"]) => READINGS[reading];

/**
 * The store's icon, from DuckDuckGo's favicon service (it never gets the referrer, only the store's
 * domain). A store without one answers 404 and the list shows its initial instead.
 */
export const storeLogoUrl = (domain: string) => `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;

/** The initial of the store's name, for when its icon does not load. */
export const storeInitial = (label: string) => (fold(label).replace(/ /g, "")[0] ?? "?").toUpperCase();
