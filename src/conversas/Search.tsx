"use client";
// "Buscar": finds the person's messages, theirs and the tone's, in the single chat. The server
// searches (GET /api/messages/search, accents and case ignored); a result takes the chat to that
// message. Opened from the top bar or with Cmd/Ctrl+K.
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { matchRanges, type MessageMatch, searchTerms } from "@/tone/shared";
import { track } from "./analytics";
import { api } from "./api";
import { Sheet, useSheetClose } from "./Sheet";
import { dayLabel, timeLabel } from "./timeline";

/** The snippet with the words of the search marked. */
export function Highlighted(props: { text: string; query: string }): ReactNode {
  const ranges = matchRanges(props.text, props.query);
  if (!ranges.length) return props.text;
  const parts: ReactNode[] = [];
  let at = 0;
  for (const [start, end] of ranges) {
    if (start > at) parts.push(props.text.slice(at, start));
    parts.push(
      <mark key={start} className="rounded-sm bg-sunken font-semibold text-ink">
        {props.text.slice(start, end)}
      </mark>,
    );
    at = end;
  }
  if (at < props.text.length) parts.push(props.text.slice(at));
  return parts;
}

/** When a match was said, as the result list shows it: "Hoje, 14:05". */
export const whenSaid = (iso: string) => `${dayLabel(iso)}, ${timeLabel(iso)}`;

type State = { kind: "idle" } | { kind: "loading" } | { kind: "done"; matches: MessageMatch[] } | { kind: "failed" };

function SearchBody(props: { onPick: (match: MessageMatch) => void }) {
  const close = useSheetClose();
  const id = useId();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const ready = searchTerms(query).length > 0;

  useEffect(() => {
    if (!ready) return;
    const abort = new AbortController();
    // A pause after typing before asking: one request per word, not per letter.
    const timer = window.setTimeout(() => {
      const started = performance.now();
      api
        .searchMessages(query.trim(), abort.signal)
        .then((matches) => {
          setActive(0);
          setState({ kind: "done", matches });
          track("messages_searched", { results: matches.length, duration_ms: Math.round(performance.now() - started) });
        })
        .catch(() => {
          if (!abort.signal.aborted) setState({ kind: "failed" });
        });
    }, 250);
    return () => {
      abort.abort();
      window.clearTimeout(timer);
    };
  }, [query, ready]);

  const matches = state.kind === "done" ? state.matches : [];
  const pick = (match: MessageMatch, position: number) => {
    track("search_result_opened", { position, role: match.role });
    props.onPick(match);
    close();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!matches.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (index + step + matches.length) % matches.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const match = matches[active];
      if (match) pick(match, active);
    }
  };
  useEffect(() => {
    document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, id]);

  const status =
    state.kind === "loading"
      ? "Buscando…"
      : state.kind === "failed"
        ? "Não consegui buscar agora. Confira a internet e tente de novo."
        : state.kind === "done"
          ? state.matches.length
            ? `${state.matches.length === 30 ? "As 30 mais recentes" : state.matches.length === 1 ? "1 mensagem" : `${state.matches.length} mensagens`}`
            : `Nenhuma mensagem com “${query.trim()}”.`
          : "Busque por uma palavra que você ou a tone disseram: um produto, uma loja, um tamanho.";

  return (
    <>
      {/* pt-1: the focus ring of the field stays inside the folha's scrolling body. */}
      <div className="relative pt-1">
        <label htmlFor={`${id}-campo`} className="sr-only">
          Buscar nas mensagens
        </label>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="pointer-events-none absolute start-4 top-[calc(50%+0.125rem)] -translate-y-1/2 text-graphite">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          ref={input}
          id={`${id}-campo`}
          data-autofocus
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          maxLength={120}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setState(searchTerms(event.target.value).length ? { kind: "loading" } : { kind: "idle" });
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={matches.length > 0}
          aria-controls={`${id}-lista`}
          aria-activedescendant={matches.length ? `${id}-${active}` : undefined}
          aria-describedby={`${id}-estado`}
          placeholder="Ex.: tênis, perfume, Dafiti"
          className="min-h-12 w-full rounded-full bg-surface ps-12 pe-4 text-body text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-ink [&::-webkit-search-cancel-button]:hidden"
        />
      </div>
      <p id={`${id}-estado`} role="status" className="text-small text-graphite">
        {status}
      </p>
      <ul id={`${id}-lista`} role="listbox" aria-label="Mensagens encontradas" className="flex flex-col gap-1 empty:hidden" data-ph-mask>
        {matches.map((match, position) => (
          // The options are picked from the field (arrows and Enter) or with a click; they are not in the tab order.
          <li
            key={`${match.sessionId}:${match.index}`}
            id={`${id}-${position}`}
            role="option"
            aria-selected={position === active}
            onMouseEnter={() => setActive(position)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => pick(match, position)}
            className={`flex cursor-pointer flex-col gap-1 rounded-panel px-4 py-3 ${position === active ? "bg-surface shadow-raised" : ""}`}
          >
            <span className="flex items-baseline justify-between gap-3 text-caption text-graphite">
              <span className="font-medium text-ink">{match.role === "user" ? "Você" : "tone"}</span>
              <span className="tabular-nums">{whenSaid(match.at)}</span>
            </span>
            <span className="text-small text-ink [overflow-wrap:anywhere]">
              <Highlighted text={match.snippet} query={query} />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** The search folha. */
export function SearchDialog(props: { onClose: () => void; onPick: (match: MessageMatch) => void }) {
  return (
    <Sheet title="Buscar nas mensagens" placement="top" closeButton onClose={props.onClose}>
      <SearchBody onPick={props.onPick} />
    </Sheet>
  );
}
