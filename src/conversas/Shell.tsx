"use client";
// T16: the frame of the web app. A top bar, the person's own panels on the
// left (what they asked the tone to keep an eye on, and the balance) and the
// work in the middle: the conversation, where the research happens on the
// server and in stores read by a remote browser, never in new tabs.
import Link from "next/link";
import { type ReactNode, useState } from "react";
import type { Me } from "@/tone/shared";
import { FeedbackButton } from "./Feedback";
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
  current?: "conversas" | "perfil";
  /** The open conversation, so feedback sent from it is tied to it. */
  sessionId?: string;
  children: ReactNode;
}) {
  // On a phone the panels open above the work, on request; on a wide screen they are always on the left.
  const [panelsOpen, setPanelsOpen] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-paper/90 px-4 py-3 backdrop-blur md:px-6">
        <Link href="/" aria-label="Início da tone" className={`grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink shadow-raised max-sm:hidden ${ring}`}>
          <HomeIcon />
        </Link>
        <nav aria-label="Seções" className="flex gap-1 rounded-full bg-surface p-1 shadow-raised">
          <Link
            href="/conversas"
            aria-current={props.current === "conversas" ? "page" : undefined}
            className={`min-h-11 content-center rounded-full px-4 text-ui max-[22.5rem]:px-3 sm:px-5 ${props.current === "conversas" ? "bg-ink text-on-ink" : "text-ink"} ${ring}`}
          >
            Conversas
          </Link>
          <Link
            href="/conversas/perfil"
            aria-current={props.current === "perfil" ? "page" : undefined}
            className={`min-h-11 content-center rounded-full px-4 text-ui max-[22.5rem]:px-3 sm:px-5 ${props.current === "perfil" ? "bg-ink text-on-ink" : "text-ink"} ${ring}`}
          >
            Perfil
          </Link>
          <button
            type="button"
            aria-expanded={panelsOpen}
            aria-controls="paineis"
            onClick={() => setPanelsOpen((open) => !open)}
            className={`min-h-11 rounded-full px-4 text-ui max-[22.5rem]:px-3 sm:px-5 md:hidden ${panelsOpen ? "bg-ink text-on-ink" : "text-ink"} ${ring}`}
          >
            Painéis
          </button>
        </nav>
        <FeedbackButton sessionId={props.sessionId ?? null} />
      </header>
      {/* Wider than before, with a wider panels column (10/11/2026: less empty margin on the sides). */}
      <div className="mx-auto grid w-full max-w-[96rem] flex-1 gap-6 px-4 pb-6 md:grid-cols-[minmax(18rem,26rem)_1fr] md:px-6 lg:gap-10">
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
