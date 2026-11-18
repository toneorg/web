"use client";
// How far the person has scrolled through a block of the public pages, as a
// number from 0 to 1, so a demo can play the steps of the product at the pace of
// the scroll (docs/superpowers/specs/2026-11-18-landing-rolagem-design.md).
//
// The page never scrolls by itself: the number follows the scroll, it does not
// drive it. The server and the first render on the client say 1, so without
// script, before hydration, and for whoever asked for less motion, every block
// shows its final state.
import { type RefObject, useEffect, useRef, useState } from "react";

const clamp01 = (n: number) => (n <= 0 ? 0 : n >= 1 ? 1 : n);

/** The progress inside the stretch [start, end] of p, held at 0 before it and 1 after it. */
export function span(p: number, start: number, end: number): number {
  if (end <= start) return p >= start ? 1 : 0;
  return clamp01((p - start) / (end - start));
}

/** A number rolling from 0 to target while p crosses [start, end]. */
export function countUp(p: number, start: number, end: number, target: number): number {
  return Math.round(target * span(p, start, end));
}

/** How many of the cuts p has reached: the phase a sequence is in. */
export function phaseAt(p: number, cuts: number[]): number {
  return cuts.filter((cut) => p >= cut).length;
}

/**
 * Progress from a block's place on screen.
 * - "pin": a tall section with a sticky stage; 0 when its top reaches the top of
 *   the screen, 1 when its bottom reaches the bottom.
 * - "view": a block passing by; 0 as it enters at the bottom, 1 as it leaves at the top.
 */
export function measure(mode: "pin" | "view", top: number, height: number, viewport: number): number {
  if (mode === "pin") {
    const run = height - viewport;
    return run <= 0 ? 1 : clamp01(-top / run);
  }
  return clamp01((viewport - top) / (viewport + height));
}

/** The progress of the element in `ref`, measured once a frame while it is near the screen. */
export function useScrollProgress<T extends HTMLElement>(
  mode: "pin" | "view",
): { ref: RefObject<T | null>; progress: number } {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let frame = 0;
    let listening = false;
    const read = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      setProgress(measure(mode, rect.top, rect.height, window.innerHeight));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      const method = on ? "addEventListener" : "removeEventListener";
      window[method]("scroll", schedule, { passive: true } as AddEventListenerOptions);
      window[method]("resize", schedule, { passive: true } as AddEventListenerOptions);
    };

    let observer: IntersectionObserver | undefined;
    const start = () => {
      read();
      if (typeof IntersectionObserver === "undefined") {
        listen(true);
        return;
      }
      // Listen only while the block is within half a screen of the viewport.
      observer = new IntersectionObserver(([entry]) => {
        listen(entry.isIntersecting);
        if (entry.isIntersecting) schedule();
      }, { rootMargin: "50% 0px" });
      observer.observe(element);
    };
    const stop = () => {
      observer?.disconnect();
      observer = undefined;
      listen(false);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const apply = () => {
      if (reduced.matches) {
        stop();
        setProgress(1);
      } else {
        start();
      }
    };
    apply();
    const onChange = () => {
      stop();
      apply();
    };
    reduced.addEventListener("change", onChange);
    return () => {
      reduced.removeEventListener("change", onChange);
      stop();
    };
  }, [mode]);

  return { ref, progress };
}
