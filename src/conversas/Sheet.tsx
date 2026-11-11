"use client";
// The web's folha (components/surface.md): a panel over a scrim, 300ms in and
// 150ms out, the exit softer than the entrance. Modal for screen readers;
// Escape, the scrim or any control inside that calls useSheetClose closes it,
// and the focus goes back to whatever opened it.
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const Close = createContext<() => void>(() => {});

/** Closes the folha with its exit animation, from any control inside it. */
export function useSheetClose() {
  return useContext(Close);
}

export function Sheet(props: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** A wider folha on large screens, for content with rows of choices (the "Novo painel"). */
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const closing = useRef(false);
  // The latest onClose, so a parent re-render does not re-run the effect and steal the focus.
  const onClose = useRef(props.onClose);
  useEffect(() => {
    onClose.current = props.onClose;
  }, [props.onClose]);
  // Closing runs once: the exit animation first, then the parent unmounts the folha (150ms, the exit duration).
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    window.setTimeout(() => onClose.current(), 150);
  }, []);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // The first control of the folha, so the keyboard starts inside it.
    panel.current?.querySelector<HTMLElement>("textarea, input, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [close]);
  // On the body: an ancestor with a filter or backdrop blur (the top bar) would trap a fixed element inside it.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* The scrim closes the folha on a click; from the keyboard, Escape does. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={close}
        className={`absolute inset-0 bg-scrim transition-opacity ease-soft ${leaving ? "opacity-0 duration-150" : "opacity-100 duration-300"}`}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        className={`relative flex max-h-[88dvh] w-full ${props.wide ? "max-w-lg sm:max-w-2xl" : "max-w-lg"} flex-col overflow-hidden rounded-t-card bg-paper shadow-floating sm:rounded-card ${leaving ? "sheet-out" : "sheet-in"}`}
      >
        {/* The handle and the title stay put; only the body scrolls, inside the rounded corners
            (10/11/2026: the whole folha scrolled, with the bar outside its edge). */}
        <div className="flex shrink-0 flex-col gap-4 px-5 pb-3 pt-3">
          <div aria-hidden="true" className="h-1 w-9 self-center rounded-full bg-edge" />
          <h2 className="display-sm text-ink">{props.title}</h2>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-5 [scrollbar-width:thin]">
          <Close.Provider value={close}>{props.children}</Close.Provider>
        </div>
      </div>
    </div>,
    document.body,
  );
}
