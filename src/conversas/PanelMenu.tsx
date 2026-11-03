"use client";
// The "⋯" of a panel card: its actions as a menu (APG menu button). Arrow keys
// move between items, Escape or a click outside closes it and the focus goes back
// to the button. On the body, so the scrolling panels column never clips it.
import { type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  /** Destructive: drawn in the alert color, after a divider. */
  danger?: boolean;
}

const icon = (path: ReactNode) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

export const ICONS = {
  check: icon(
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </>,
  ),
  pause: icon(
    <>
      <path d="M9 5v14" />
      <path d="M15 5v14" />
    </>,
  ),
  resume: icon(<path d="M7 5v14l11-7z" />),
  mute: icon(
    <>
      <path d="M4 4l16 16" />
      <path d="M9.5 5.2A6 6 0 0 1 18 10.5V14l1.5 3H8" />
      <path d="M6.3 8.3A6 6 0 0 0 6 10.5V14l-1.5 3" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>,
  ),
  unmute: icon(
    <>
      <path d="M6 10.5a6 6 0 0 1 12 0V14l1.5 3h-15L6 14z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>,
  ),
  open: icon(<path d="M4 5h16v11H9l-5 4z" />),
  delete: icon(
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
    </>,
  ),
};

export function PanelMenu(props: { label: string; items: MenuItem[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ top: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();

  const close = (focusButton = true) => {
    setOpen(false);
    setPlace(null);
    if (focusButton) button.current?.focus();
  };
  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const rect = button.current.getBoundingClientRect();
    setPlace({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
  }, [open]);
  // The menu is drawn once its place is known; then the keyboard starts on its first item.
  useEffect(() => {
    if (open && place) menu.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
  }, [open, place]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !button.current?.contains(target)) close(false);
    };
    const away = () => close(false);
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", away);
    window.addEventListener("scroll", away, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", away);
      window.removeEventListener("scroll", away, true);
    };
  }, [open]);

  const onKey = (event: React.KeyboardEvent) => {
    const items = [...(menu.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLElement);
    const go = (index: number) => items[(index + items.length) % items.length]?.focus();
    if (event.key === "ArrowDown") go(at + 1);
    else if (event.key === "ArrowUp") go(at - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(items.length - 1);
    else if (event.key === "Escape" || event.key === "Tab") close(event.key === "Escape");
    else return;
    if (event.key !== "Tab") event.preventDefault();
  };

  const regular = props.items.filter((item) => !item.danger);
  const danger = props.items.filter((item) => item.danger);
  const row = (item: MenuItem) => (
    <button
      key={item.id}
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={() => {
        close();
        item.onSelect();
      }}
      className={`flex min-h-11 w-full items-center gap-3 rounded-input px-3 text-start text-ui outline-none hover:bg-sunken focus-visible:bg-sunken ${
        item.danger ? "text-alert" : "text-ink"
      }`}
    >
      {item.icon}
      {item.label}
    </button>
  );

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={props.label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        disabled={props.disabled}
        onClick={() => setOpen((value) => !value)}
        className="press relative z-[1] grid size-11 shrink-0 place-items-center rounded-full text-ink hover:bg-sunken disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <circle cx="5" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
        </svg>
      </button>
      {open && place
        ? createPortal(
            <div
              ref={menu}
              id={id}
              role="menu"
              aria-label={props.label}
              onKeyDown={onKey}
              style={{ top: place.top, right: place.right }}
              className="sheet-in fixed z-50 flex min-w-56 flex-col gap-0.5 rounded-panel bg-surface p-1.5 shadow-raised"
            >
              {regular.map(row)}
              {danger.length ? <div role="separator" className="mx-3 my-1 h-px bg-rule" /> : null}
              {danger.map(row)}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
