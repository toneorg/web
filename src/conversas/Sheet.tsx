"use client";
// The web's folha (components/surface.md): a panel over a scrim, 300ms in and
// 150ms out, the exit softer than the entrance. Modal for screen readers;
// Escape, the scrim or any control inside that calls useSheetClose closes it,
// Tab stays inside it, and the focus goes back to whatever opened it. A folha
// opened from another (a confirmation inside the profile) sits on top: Escape
// and the focus trap belong to the top one only.
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const Close = createContext<() => void>(() => {});

/** Closes the folha with its exit animation, from any control inside it. */
export function useSheetClose() {
  return useContext(Close);
}

/** The open folhas, the newest last: only the last one answers Escape and keeps the focus. */
const stack: symbol[] = [];

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Where the folha sits: rising from the bottom (default), near the top (the search) or at the side (the profile). */
export type SheetPlacement = "bottom" | "top" | "side";

const placements: Record<SheetPlacement, { frame: string; panel: string }> = {
  bottom: { frame: "items-end justify-center sm:items-center", panel: "max-h-[88dvh] rounded-t-card sm:rounded-card" },
  top: {
    frame: "items-end justify-center sm:items-start sm:pt-[12dvh]",
    panel: "max-h-[88dvh] rounded-t-card sm:max-h-[76dvh] sm:rounded-card",
  },
  side: {
    frame: "items-end justify-center sm:items-stretch sm:justify-end",
    panel: "drawer max-h-[88dvh] rounded-t-card sm:max-h-none sm:rounded-none sm:rounded-s-card",
  },
};

export function Sheet(props: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** A wider folha on large screens, for content with rows of choices (the "Novo painel"). */
  wide?: boolean;
  placement?: SheetPlacement;
  /** A "Fechar" button by the title, for folhas people read for a while (the profile, the search). */
  closeButton?: boolean;
  /** Something to keep beside the title, before the close button. */
  aside?: ReactNode;
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
    const me = Symbol("sheet");
    stack.push(me);
    const previous = document.activeElement as HTMLElement | null;
    // The first control of the folha, so the keyboard starts inside it.
    const body = panel.current?.querySelector<HTMLElement>("[data-sheet-body]");
    (
      panel.current?.querySelector<HTMLElement>("[data-autofocus]") ??
      body?.querySelector<HTMLElement>("textarea, input, button") ??
      panel.current?.querySelector<HTMLElement>("button")
    )?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (stack.at(-1) !== me) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      const inside = panel.current.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    // In the capture phase: a dev tool or a component inside that stops Escape cannot keep the folha open.
    document.addEventListener("keydown", onKey, true);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      stack.splice(stack.indexOf(me), 1);
      document.body.style.overflow = overflow;
      // Back where it was opened, if that control is still on the page.
      if (previous?.isConnected) previous.focus();
    };
  }, [close]);
  const place = placements[props.placement ?? "bottom"];
  // On the body: an ancestor with a filter or backdrop blur (the top bar) would trap a fixed element inside it.
  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${place.frame}`}>
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
        className={`relative flex w-full ${props.wide ? "max-w-lg sm:max-w-2xl" : props.placement === "side" ? "max-w-lg sm:max-w-md" : "max-w-lg"} flex-col overflow-hidden bg-paper pb-[env(safe-area-inset-bottom)] shadow-floating ${place.panel} ${leaving ? "sheet-out" : "sheet-in"}`}
      >
        {/* The handle and the title stay put; only the body scrolls, inside the rounded corners
            (10/11/2026: the whole folha scrolled, with the bar outside its edge). */}
        <div className="flex shrink-0 flex-col gap-4 px-5 pb-3 pt-3">
          <div aria-hidden="true" className={`h-1 w-9 self-center rounded-full bg-edge ${props.placement === "side" ? "sm:invisible" : ""}`} />
          <div className="flex items-center justify-between gap-3">
            <h2 className="display-sm text-ink">{props.title}</h2>
            <div className="flex shrink-0 items-center gap-2">
              {props.aside}
              {props.closeButton ? (
                <button
                  type="button"
                  onClick={close}
                  aria-label="Fechar"
                  // A drawer to read starts on its close button: no keyboard popping up on a phone.
                  data-autofocus={props.placement === "side" ? true : undefined}
                  className="press -me-2 grid size-11 shrink-0 place-items-center rounded-full text-ink hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <div data-sheet-body className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-5 [scrollbar-width:thin]">
          <Close.Provider value={close}>{props.children}</Close.Provider>
        </div>
      </div>
    </div>,
    document.body,
  );
}
