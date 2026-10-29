// Gerado de toneorg/extension@cab9f784af9d (packages/genui-react/src/host.ts). Não edite aqui.
// What a drawn component may ask of the panel. The model writes only data; the
// panel decides what each button does, and checks every address before using it.
import {
  type ClickWhere,
  type DecisionOp,
  type DecisionState,
  isAllowedImage,
  type PickedProduct,
  type Watch,
  type WatchRule,
} from "@/tone/shared";
import { createContext, useContext } from "react";

export interface Answer {
  memoryKey: string;
  question: string;
  answer: string;
}

export type GenUIAction =
  /** The person answered a question component; answers become memory and the next turn. */
  | { type: "answer"; answers: Answer[]; display: string }
  /** Open a product or an offer in the store tab. */
  | { type: "open"; url: string; title: string; where?: ClickWhere }
  /** The person turned a product down, with a reason. */
  | { type: "reject"; url: string; title: string; reason: string }
  /** Send a message as the person, from a button of the component. */
  | { type: "say"; text: string }
  /** The person picked a product to talk about next (or let it go, with null). */
  | { type: "pick"; product: PickedProduct | null };

export interface GenUIHost {
  /** Stores whose pages and photos this surface may show: the extension's adapters, the web's fixed list. */
  storeHosts: readonly string[];
  /** Questions can be answered: the latest answer of a live conversation, with nothing running. */
  interactive: boolean;
  /** Products can be opened and turned down (false only where nothing should happen, like a preview). */
  actionable: boolean;
  act: (action: GenUIAction) => void;
  /** The url of the product picked to talk about; absent where products cannot be picked. */
  picked?: string | null;
  /** T08: the decision of this conversation, read and changed by the panel on the person's behalf. */
  decisions?: DecisionAccess;
  /** T09: watches; the panel saves drafts and confirms as the person. */
  watches?: WatchAccess;
}

export interface WatchAccess {
  load: (id: string) => Promise<Watch | null>;
  save: (id: string, version: number, draft: WatchRule) => Promise<Watch>;
  confirm: (id: string, version: number) => Promise<Watch>;
}

export interface DecisionAccess {
  load: () => Promise<DecisionState | null>;
  change: (version: number, ops: DecisionOp[]) => Promise<DecisionState>;
}

export const GenUIContext = createContext<GenUIHost>({
  storeHosts: [],
  interactive: false,
  actionable: false,
  act: () => undefined,
});

export const useHost = () => useContext(GenUIContext);

/** The image, if it comes from one of the host's stores or its photo CDN; null otherwise. */
export const safeImage = (url: string | null | undefined, storeHosts: readonly string[]) =>
  isAllowedImage(url, storeHosts) ? (url ?? null) : null;

/** A child as the parser hands it to its parent: an element node, whose props are the child's data. */
export function dataOf<T>(value: unknown): T | null {
  if (!value || typeof value !== "object") return null;
  const node = value as { type?: string; props?: unknown };
  if (node.type === "element") return (node.props ?? null) as T | null;
  return value as T;
}

export const listOf = <T>(value: unknown): T[] =>
  Array.isArray(value) ? value.map((item) => dataOf<T>(item)).filter((item): item is T => item !== null) : [];
