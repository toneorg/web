"use client";
// The @ store picker of the composer: a listbox above the message box (the box keeps focus and
// points at the active option), and the picked stores as removable pills.
import type { StoreOption } from "@/tone/shared";
import { readingLabel } from "./store-mention";

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
  return (
    <ul
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
          className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-input px-3 py-2 ${
            index === active ? "bg-sunken" : ""
          }`}
        >
          <span className="text-body text-ink">{option.label}</span>
          <span className="text-small text-graphite">{readingLabel(option.reading)}</span>
        </li>
      ))}
    </ul>
  );
}

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
  const label = (domain: string) => stores.find((store) => store.domain === domain)?.label ?? domain;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-small text-graphite">Buscar só em</span>
      <ul className="flex flex-wrap gap-2">
        {chosen.map((domain) => (
          <li key={domain} className="flex min-h-11 items-center gap-1 rounded-full bg-surface pl-4 shadow-raised">
            <span className="text-ui text-ink">{label(domain)}</span>
            <button
              type="button"
              onClick={() => onRemove(domain)}
              aria-label={`Tirar ${label(domain)} da busca`}
              className="flex size-11 items-center justify-center rounded-full text-ui text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
