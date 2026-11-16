"use client";
// T16, redrawn on 15/11/2026 as a messaging app: a top bar (home on the leading side, the search
// and the person's avatar on the trailing one), the person's panels on the left, unchanged, and
// one continuous chat in the middle. The profile is no longer a tab: the avatar opens it.
import Link from "next/link";
import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Me } from "@/tone/shared";
import { track } from "./analytics";
import { FeedbackButton } from "./Feedback";
import { Panels } from "./Panels";

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const round = `press grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink shadow-raised ${ring}`;

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function PanelsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

/** The platform does not change while the page is open. */
const noChange = () => () => undefined;

/** The first letter of the person's name, for the avatar. */
export function initialOf(name: string | null | undefined): string {
  const letter = [...(name ?? "").trim()][0];
  return letter ? letter.toLocaleUpperCase("pt-BR") : "?";
}

/** Whether the shortcut that opens the search was pressed: Cmd+K on a Mac, Ctrl+K elsewhere. */
export function isSearchShortcut(event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">): boolean {
  return event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
}

export function Shell(props: {
  me: Me | null;
  /** The open conversation, so feedback sent from it is tied to it. */
  sessionId?: string;
  /** Opens the search. Without it (a panel's page) the button goes to the chat with the search open. */
  onSearch?: () => void;
  /** Opens the profile. Without it the avatar goes to the chat with the profile open. */
  onProfile?: () => void;
  /** Whether the profile is open, for the avatar's state. */
  profileOpen?: boolean;
  children: ReactNode;
}) {
  // On a phone the panels open above the work, on request; on a wide screen they are always on the left.
  // On a phone the panels and the chat take turns: the chat sits at the bottom of a long page, so
  // panels opened above it were drawn out of sight (15/11/2026). Opening them hides the chat and
  // starts the page at the top; closing them goes back to the newest message.
  const [panelsOpen, setPanelsOpen] = useState(false);
  const panelsHeading = useRef<HTMLElement>(null);
  const togglePanels = () => {
    const next = !panelsOpen;
    setPanelsOpen(next);
    requestAnimationFrame(() => {
      if (next) {
        window.scrollTo({ top: 0, behavior: "instant" });
        panelsHeading.current?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
      } else window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    });
  };
  const { onSearch } = props;
  // The shortcut's name, once the page knows the keyboard: ⌘K on a Mac, Ctrl K elsewhere (none on the server).
  const shortcut = useSyncExternalStore(
    noChange,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => null,
  );
  useEffect(() => {
    if (!onSearch) return;
    const onKey = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event) || document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      event.preventDefault();
      track("search_opened", { from: "shortcut" });
      onSearch();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onSearch]);
  const searchLabel = (
    <>
      <SearchIcon />
      <span className="max-sm:sr-only">Buscar</span>
      {shortcut ? (
        <kbd aria-hidden="true" className="rounded-tag bg-sunken px-1.5 font-sans text-caption text-graphite max-md:hidden">
          {shortcut}
        </kbd>
      ) : null}
    </>
  );
  const search = `press flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-surface text-ui text-ink shadow-raised max-sm:w-11 max-sm:justify-center sm:ps-4 sm:pe-3 ${ring}`;
  const initial = initialOf(props.me?.name);
  const avatar = `press grid size-11 shrink-0 place-items-center rounded-full bg-ink text-subheading text-on-ink ${ring}`;
  return (
    <div className="flex min-h-dvh flex-col">
      {/* The skip link is the root layout's ("Pular para o conteúdo"): one is enough. */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-paper/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" aria-label="Início da tone" className={round}>
            <HomeIcon />
          </Link>
          <button
            type="button"
            aria-expanded={panelsOpen}
            aria-controls="paineis"
            aria-label="Painéis"
            onClick={togglePanels}
            className={`press grid size-11 shrink-0 place-items-center rounded-full shadow-raised md:hidden ${panelsOpen ? "bg-ink text-on-ink" : "bg-surface text-ink"} ${ring}`}
          >
            <PanelsIcon />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <FeedbackButton sessionId={props.sessionId ?? null} />
          {onSearch ? (
            <button
              type="button"
              aria-haspopup="dialog"
              aria-keyshortcuts="Meta+K Control+K"
              aria-label="Buscar nas mensagens"
              onClick={() => {
                track("search_opened", { from: "button" });
                onSearch();
              }}
              className={search}
            >
              {searchLabel}
            </button>
          ) : (
            <Link href="/conversas?buscar=1" aria-label="Buscar nas mensagens" className={search}>
              {searchLabel}
            </Link>
          )}
          {props.onProfile ? (
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={props.profileOpen ?? false}
              aria-label="Seu perfil"
              onClick={props.onProfile}
              className={avatar}
            >
              <span aria-hidden="true" data-ph-mask>
                {initial}
              </span>
            </button>
          ) : (
            <Link href="/conversas?perfil=1" aria-label="Seu perfil" className={avatar}>
              <span aria-hidden="true" data-ph-mask>
                {initial}
              </span>
            </Link>
          )}
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[96rem] flex-1 gap-6 px-4 md:grid-cols-[minmax(18rem,26rem)_1fr] md:px-6 lg:gap-10">
        <aside
          id="paineis"
          aria-label="Seus painéis"
          ref={panelsHeading}
          className={`${panelsOpen ? "flex" : "hidden"} flex-col gap-4 pb-6 md:sticky md:top-20 md:flex md:max-h-[calc(100dvh-6rem)] md:self-start md:overflow-y-auto`}
        >
          {props.me ? <Panels me={props.me} /> : null}
        </aside>
        <div className={`${panelsOpen ? "max-md:hidden" : ""} flex min-w-0 flex-col`}>{props.children}</div>
      </div>
    </div>
  );
}
