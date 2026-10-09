"use client";

import { useEffect, useRef } from "react";

/**
 * Plays the staged entrance of its `.reveal-item` children once, when the
 * block scrolls into view. Without JavaScript, with reduced motion, or when
 * the block is already on screen at load, the children simply stay visible.
 */
export function Reveal({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const block = ref.current;
    if (!block) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (block.getBoundingClientRect().top < window.innerHeight) return;

    block.dataset.reveal = "pending";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        block.dataset.reveal = "in";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    observer.observe(block);
    return () => {
      observer.disconnect();
      delete block.dataset.reveal;
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
