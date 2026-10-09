"use client";

import { useMemo, useSyncExternalStore } from "react";
import { ATTRIBUTION_KEYS } from "./forms";

const STORAGE_KEY = "tone:utm";

// Visit origin read from the URL. "referrer" comes from document.referrer instead.
const URL_KEYS = ATTRIBUTION_KEYS.filter((key) => key !== "referrer");

/** Reads where the visit came from and keeps it for the rest of the tab's life. */
function read(): Record<string, string> {
  let stored: Record<string, string> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {}

  const next = { ...stored };
  const params = new URLSearchParams(window.location.search);
  for (const key of URL_KEYS) {
    const value = params.get(key);
    if (value) next[key] = value;
  }
  // Coming back from /privacidade is not a referral.
  const fromOutside = document.referrer && !document.referrer.startsWith(window.location.origin);
  if (!next.referrer && fromOutside) next.referrer = document.referrer;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

// Read once per page load, however many forms ask.
let cached: string | null = null;
function snapshot() {
  cached ??= JSON.stringify(read());
  return cached;
}

const noSubscription = () => () => {};

/**
 * Where the visit came from, so a tagged link
 * (e.g. /?utm_source=evento&utm_medium=qr) can be told apart from shares.
 * Empty on the server and during hydration.
 */
export function useAttribution(): Record<string, string> {
  const raw = useSyncExternalStore(noSubscription, snapshot, () => "{}");
  return useMemo(() => JSON.parse(raw), [raw]);
}
