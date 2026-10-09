// Where the page remembers that she joined, so a reload or a visit to the
// privacy note does not ask for the e-mail again. Per tab, gone when it closes.

import type { Placement } from "./forms";

const KEY = "tone:signup";

export type Saved = { email: string; profileSaved: boolean };

const NOTHING: Saved = { email: "", profileSaved: false };
const EMPTY = JSON.stringify(NOTHING);

/** Stands in for sessionStorage where the browser refuses it (some private modes). */
let memory = EMPTY;

const listeners = new Set<() => void>();

/** Storage is outside our control, so anything unexpected reads as "not joined". */
export function parseSaved(raw: string): Saved {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === "object" && value !== null) {
      const { email, profileSaved } = value as Partial<Saved>;
      if (typeof email === "string") return { email, profileSaved: profileSaved === true };
    }
  } catch {}
  return NOTHING;
}

export const signupStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /** The saved state as a string: a primitive, so it is a stable snapshot. */
  snapshot() {
    try {
      return sessionStorage.getItem(KEY) ?? memory;
    } catch {
      return memory;
    }
  },
  serverSnapshot: () => EMPTY,
  save(next: Saved) {
    memory = JSON.stringify(next);
    try {
      sessionStorage.setItem(KEY, memory);
    } catch {}
    for (const listener of listeners) listener();
  },
};

/** Which e-mail field was used during this visit; null after a reload. */
export type JoinedAt = Placement | null;
