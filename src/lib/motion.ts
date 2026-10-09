"use client";

import { type RefObject, useEffect, useState, useSyncExternalStore } from "react";

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Whether the person asked the system for less motion. False while rendering on the server. */
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/** Whether the element is on screen, so looping animations can rest when nobody is looking. */
function useOnScreen(ref: RefObject<Element | null>) {
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Several records can arrive at once; the newest one is the current state.
    const observer = new IntersectionObserver((entries) =>
      setOnScreen(entries.at(-1)?.isIntersecting ?? false),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return onScreen;
}

/** True when a loop should run: the element is visible and motion is welcome. */
export function useLoopAllowed(ref: RefObject<Element | null>) {
  const reduced = usePrefersReducedMotion();
  const onScreen = useOnScreen(ref);
  return onScreen && !reduced;
}
