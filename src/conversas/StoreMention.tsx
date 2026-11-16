"use client";
// The @ store picker of the composer: a listbox above the message box (the box keeps focus and
// points at the active option), the picked stores as removable pills, and the person's message
// drawn with the stores it was limited to.
import { useEffect, useRef, useState } from "react";
import { type StoreOption, storeLabel } from "@/tone/shared";
import { readingLabel, storeInitial, storeLogoUrl } from "./store-mention";

/** The store's icon, or its initial on a sunken tile when the icon does not load. */
export function StoreLogo(props: { domain: string; label: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <span
      aria-hidden="true"
      className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-tag bg-sunken text-label text-graphite"
    >
      {broken ? (
        storeInitial(props.label)
      ) : (
        // A favicon from a fixed service; next/image would proxy it for nothing.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={storeLogoUrl(props.domain)}
          alt=""
          width={24}
          height={24}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="size-full bg-surface object-contain outline outline-1 -outline-offset-1 outline-image-outline"
        />
      )}
    </span>
  );
}

export function StoreOptions({
  id,
  options,
  active,
  onPick,
  onActive,
}: {
  id: string;
  options: StoreOption[];
  active: number;
  onPick: (option: StoreOption) => void;
  onActive: (index: number) => void;
}) {
  const list = useRef<HTMLUListElement>(null);
  // The arrows move the active option: the list follows it, so it never goes out of sight.
  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, options.length]);
  return (
    <ul
      ref={list}
      id={id}
      role="listbox"
      aria-label="Lojas"
      className="absolute inset-x-0 bottom-full mb-2 max-h-72 overflow-y-auto overscroll-contain rounded-panel bg-surface p-1 shadow-raised"
    >
      {options.map((option, index) => (
        <li
          key={option.domain}
          id={`${id}-${index}`}
          role="option"
          aria-selected={index === active}
          // The message box keeps focus: the pick happens on click, never by moving focus here.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(option)}
          onMouseEnter={() => onActive(index)}
          className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-input px-3 py-2 ${
            index === active ? "bg-sunken" : ""
          }`}
        >
          <StoreLogo domain={option.domain} label={option.label} />
          <span className="min-w-0 flex-1 truncate text-body text-ink">{option.label}</span>
          <span className="shrink-0 text-small text-graphite">{readingLabel(option.reading)}</span>
        </li>
      ))}
    </ul>
  );
}

const labelOf = (stores: readonly StoreOption[] | undefined, domain: string) =>
  stores?.find((store) => store.domain === domain)?.label ?? storeLabel(domain);

export function ChosenStores({
  stores,
  chosen,
  onRemove,
}: {
  stores: readonly StoreOption[];
  chosen: readonly string[];
  onRemove: (domain: string) => void;
}) {
  if (!chosen.length) return null;
  const label = (domain: string) => labelOf(stores, domain);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-small text-graphite">Buscar só em</span>
      <ul className="flex flex-wrap gap-2">
        {chosen.map((domain) => (
          <li key={domain} className="flex min-h-11 items-center gap-2 rounded-full bg-surface ps-3 shadow-raised">
            <StoreLogo domain={domain} label={label(domain)} />
            <span className="text-ui text-ink">{label(domain)}</span>
            <button
              type="button"
              onClick={() => onRemove(domain)}
              aria-label={`Tirar ${label(domain)} da busca`}
              className="press flex size-11 items-center justify-center rounded-full text-graphite hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M7 7l10 10M17 7 7 17" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A message of the person, with the stores picked with @ for it as they were typed ("@Dior …"). */
export function UserMessage(props: {
  text: string;
  stores?: readonly string[];
  options?: readonly StoreOption[];
  className?: string;
  /** The message this one answers ("Responder"); `onOpen` goes to it when it is loaded. */
  quote?: { role: "user" | "assistant"; text: string; onOpen?: () => void };
}) {
  const quote = props.quote;
  const quoteBody = quote ? (
    <>
      <span className="block text-caption font-medium">{quote.role === "assistant" ? "tone" : "Você"}</span>
      <span className="line-clamp-2 block whitespace-normal">{quote.text}</span>
    </>
  ) : null;
  const quoteClass = "mb-2 block w-full border-s-2 border-on-ink ps-3 text-start text-small opacity-80";
  return (
    <p className={props.className ?? "self-end rounded-panel bg-ink px-4 py-3 text-body text-on-ink"}>
      {quote ? (
        quote.onOpen ? (
          <button
            type="button"
            onClick={quote.onOpen}
            aria-label={`Ir para a mensagem respondida: ${quote.text.slice(0, 80)}`}
            className={`${quoteClass} rounded-e-tag hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-ink`}
          >
            {quoteBody}
          </button>
        ) : (
          <span className={quoteClass}>
            <span className="sr-only">Em resposta a: </span>
            {quoteBody}
          </span>
        )
      ) : null}
      <span className="sr-only">Você: </span>
      {props.stores?.map((domain) => (
        <span key={domain} className="font-medium">
          @{labelOf(props.options, domain)}{" "}
        </span>
      ))}
      {props.text}
    </p>
  );
}
