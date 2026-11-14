"use client";
// The product demos of the public pages play a sequence of steps. The server
// renders the last step, so without script, or with reduced motion, the demo is
// simply complete. With motion, the demo restarts from the first step when it
// scrolls into view, and stops while it is out of view (DESIGN.md: a loop stops
// off screen).
import { type RefObject, useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Whether the element is on screen. Starts false; never true without IntersectionObserver. */
export function useInView<T extends Element>(ref: RefObject<T | null>, threshold = 0.35) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}

/**
 * Plays steps 0..durations.length, waiting durations[i] ms after step i, then
 * holds the last step for `hold` ms and starts over. Returns the current step and
 * a ref for the element whose visibility drives it.
 */
export function useSequence<T extends Element>(durations: number[], hold = 4200) {
  const last = durations.length;
  const ref = useRef<T>(null);
  const inView = useInView(ref);
  const [step, setStep] = useState(last);

  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    let current = 0;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      setStep(current);
      const wait = current < last ? durations[current] : hold;
      timer = setTimeout(() => {
        current = current < last ? current + 1 : 0;
        advance();
      }, wait);
    };
    advance();
    return () => clearTimeout(timer);
    // durations is a literal per component; its identity changing would only restart the demo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, last, hold]);

  return { ref, step };
}
