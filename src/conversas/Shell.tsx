"use client";
// T16: the frame of the web app. A top bar, the person's own panels on the
// left (what they asked the tone to keep an eye on, and the balance) and the
// work in the middle: the conversation, where the research happens on the
// server and in stores read by a remote browser, never in new tabs.
import Link from "next/link";
import { type ReactNode, useState } from "react";
import type { Me } from "@/tone/shared";
import { Panels } from "./Panels";

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function Shell(props: {
  me: Me | null;
  /** Which part of the app is open, for the top bar. */
  current: "conversas";
  children: ReactNode;
}) {
  const initial = props.me?.name.trim().charAt(0).toUpperCase() || "?";
  // On a phone the panels open above the work, on request; on a wide screen they are always on the left.
  const [panelsOpen, setPanelsOpen] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-paper/90 px-4 py-3 backdrop-blur md:px-6">
        <Link href="/" aria-label="Início da tone" className={`grid size-11 place-items-center rounded-full bg-surface text-ink shadow-raised ${ring}`}>
          <HomeIcon />
        </Link>
        <nav aria-label="Seções" className="flex gap-1 rounded-full bg-surface p-1 shadow-raised">
          <Link
            href="/conversas"
            aria-current={props.current === "conversas" ? "page" : undefined}
            className={`min-h-11 content-center rounded-full px-5 text-ui ${props.current === "conversas" ? "bg-ink text-on-ink" : "text-ink"} ${ring}`}
          >
            Conversas
          </Link>
          <button
            type="button"
            aria-expanded={panelsOpen}
            aria-controls="paineis"
            onClick={() => setPanelsOpen((open) => !open)}
            className={`min-h-11 rounded-full px-5 text-ui md:hidden ${panelsOpen ? "bg-ink text-on-ink" : "text-ink"} ${ring}`}
          >
            Painéis
          </button>
        </nav>
        <span
          role="img"
          aria-label={props.me ? `Conta de ${props.me.name}` : "Conta"}
          className="grid size-11 place-items-center rounded-full bg-ink text-ui text-on-ink"
        >
          {initial}
        </span>
      </header>
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 pb-6 md:grid-cols-[minmax(16rem,22rem)_1fr] md:px-6">
        <aside
          id="paineis"
          aria-label="Seus painéis"
          className={`${panelsOpen ? "flex" : "hidden"} flex-col gap-4 md:sticky md:top-20 md:flex md:max-h-[calc(100dvh-6rem)] md:self-start md:overflow-y-auto`}
        >
          {props.me ? <Panels me={props.me} /> : null}
        </aside>
        <div className="flex min-w-0 flex-col">{props.children}</div>
      </div>
    </div>
  );
}
