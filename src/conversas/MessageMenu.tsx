"use client";
// What a right click (or a long press on a phone, or the context-menu key) on a message offers:
// the thumbs of an answer, Copiar and Responder. The same menu pattern as PanelMenu (APG menu):
// arrow keys move, Escape or a click outside closes and gives the focus back to the message.
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { AnswerRatingValue } from "@/tone/shared";

const icon = (path: ReactNode) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const COPY = icon(
  <>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
  </>,
);
const REPLY = icon(
  <>
    <path d="M9 14L4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </>,
);
const thumb = (filled: boolean, down = false) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={down ? { transform: "scaleY(-1)" } : undefined}
  >
    <path d="M7 10v10H4V10z" />
    <path d="M7 10l4-7a2 2 0 0 1 2.9 2.2L13 9h5.6a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17.2 20H7" />
  </svg>
);

export interface MessageMenuProps {
  /** Where the menu opens: the pointer, or the message's corner when opened from the keyboard. */
  at: { x: number; y: number };
  onCopy: () => void;
  onReply: (() => void) | null;
  /** The thumbs of the answer's turn; null where the message has none (the person's own, the greeting). */
  rating: { value: AnswerRatingValue | null; onRate: (value: AnswerRatingValue | "none") => void } | null;
  onClose: () => void;
}

export function MessageMenu(props: MessageMenuProps) {
  const menu = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<{ top: number; left: number } | null>(null);
  const { onClose } = props;

  // Kept inside the window: a click near the bottom (the newest message) opens it upwards.
  useLayoutEffect(() => {
    const box = menu.current?.getBoundingClientRect();
    const width = box?.width ?? 224;
    const height = box?.height ?? 160;
    const left = Math.min(Math.max(8, props.at.x), window.innerWidth - width - 8);
    const below = props.at.y + 4;
    const top = below + height > window.innerHeight - 8 ? Math.max(8, props.at.y - height - 4) : below;
    setPlace({ top, left });
  }, [props.at.x, props.at.y]);
  useEffect(() => {
    if (place) menu.current?.querySelector<HTMLElement>("[role^=menuitem]")?.focus();
  }, [place]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) onClose();
    };
    const away = () => onClose();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", away);
    window.addEventListener("scroll", away, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", away);
      window.removeEventListener("scroll", away, true);
    };
  }, [onClose]);

  const onKey = (event: React.KeyboardEvent) => {
    const items = [...(menu.current?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const go = (index: number) => items[(index + items.length) % items.length]?.focus();
    if (event.key === "ArrowDown" || event.key === "ArrowRight") go(at + 1);
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") go(at - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(items.length - 1);
    else if (event.key === "Escape" || event.key === "Tab") onClose();
    else return;
    if (event.key !== "Tab") event.preventDefault();
  };

  const choose = (action: () => void) => () => {
    onClose();
    action();
  };
  const row = (label: string, glyph: ReactNode, action: () => void) => (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={choose(action)}
      className="flex min-h-11 w-full items-center gap-3 rounded-input px-3 text-start text-ui text-ink outline-none hover:bg-sunken focus-visible:bg-sunken"
    >
      {glyph}
      {label}
    </button>
  );
  const { rating } = props;

  return createPortal(
    <div
      ref={menu}
      role="menu"
      aria-label="Ações da mensagem"
      onKeyDown={onKey}
      onContextMenu={(event) => event.preventDefault()}
      style={place ? { top: place.top, left: place.left } : { top: props.at.y, left: props.at.x, visibility: "hidden" }}
      className="sheet-in fixed z-50 flex min-w-48 flex-col gap-0.5 rounded-panel bg-surface p-1.5 shadow-raised"
    >
      {rating ? (
        <>
          <div role="group" aria-label="Avaliar a resposta" className="flex gap-0.5">
            {(["good", "bad"] as const).map((value) => {
              const checked = rating.value === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={checked}
                  aria-label={value === "good" ? "Resposta boa" : "Resposta ruim"}
                  tabIndex={-1}
                  onClick={choose(() => rating.onRate(checked ? "none" : value))}
                  className="grid min-h-11 flex-1 place-items-center rounded-input text-ink outline-none hover:bg-sunken focus-visible:bg-sunken"
                >
                  {thumb(checked, value === "bad")}
                </button>
              );
            })}
          </div>
          <div role="separator" className="mx-3 my-1 h-px bg-rule" />
        </>
      ) : null}
      {row("Copiar", COPY, props.onCopy)}
      {props.onReply ? row("Responder", REPLY, props.onReply) : null}
    </div>,
    document.body,
  );
}

/** How long a finger rests on a message before the menu opens, and how far it may drift. */
const LONG_PRESS_MS = 450;
const LONG_PRESS_SLOP = 8;

/**
 * Handlers for a message: right click, the context-menu key (or Shift+F10) and, on a touch screen, a
 * long press. `open` receives where the menu goes.
 */
// One finger rests on one message at a time: the press lives here, not in a render's closure, so a
// render during the press cannot lose the timer.
let pressTimer: ReturnType<typeof setTimeout> | null = null;
let pressStart: { x: number; y: number } | null = null;
const cancelPress = () => {
  if (pressTimer) clearTimeout(pressTimer);
  pressTimer = null;
  pressStart = null;
};

/**
 * Handlers for a message: right click, the context-menu key (or Shift+F10) and, on a touch screen, a
 * long press. `open` receives where the menu goes.
 */
export function messageMenuHandlers(open: (at: { x: number; y: number }) => void) {
  return {
    onContextMenu: (event: React.MouseEvent) => {
      // A selection inside the message keeps the browser's own menu (to copy just a part, search it).
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && event.currentTarget.contains(selection.anchorNode)) return;
      event.preventDefault();
      cancelPress();
      open({ x: event.clientX, y: event.clientY });
    },
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
      event.preventDefault();
      const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
      open({ x: box.left + 12, y: box.bottom });
    },
    onPointerDown: (event: React.PointerEvent) => {
      if (event.pointerType !== "touch") return;
      cancelPress();
      pressStart = { x: event.clientX, y: event.clientY };
      pressTimer = setTimeout(() => {
        if (pressStart) open(pressStart);
        cancelPress();
      }, LONG_PRESS_MS);
    },
    onPointerMove: (event: React.PointerEvent) => {
      if (pressStart && Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > LONG_PRESS_SLOP)
        cancelPress();
    },
    onPointerUp: cancelPress,
    onPointerCancel: cancelPress,
  };
}
