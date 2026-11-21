"use client";
// What a panel found: the offers of a reading, with the product photos the index listed. Only the
// panel's own page draws them (20/11/2026: the chat no longer shows a panel's readings).
import { isAllowedImage, NEAR_PRICE_TOLERANCE, type Watch, type WatchResult } from "@/tone/shared";
import { STORE_HOSTS, StoreLink } from "./Program";

const storeName = (store: string) => (store === "google.com" ? "Google Shopping" : store.replace(/^www\./, ""));

export type Match = WatchResult["summary"]["matches"][number];

/** Why this price does not count for the alert (a variant the index did not confirm, an installment…). */
const limitationOf = (match: Match) => {
  const value = (match as { limitation?: unknown }).limitation;
  return typeof value === "string" && value ? value : null;
};

/** Whether an offer is inside the person's price, when the condition is a price. */
function withinTarget(watch: Watch, match: Match): boolean {
  const condition = (watch.confirmed ?? watch.draft).condition;
  if (match.amount === null) return false;
  if (condition.kind === "near_price") return match.amount <= condition.amount * (1 + NEAR_PRICE_TOLERANCE);
  return condition.kind === "target_price" && match.amount <= condition.amount;
}

function Offer(props: {
  watch: Watch;
  match: Match;
  position: number;
  sessionId: string | null;
  onAsk?: (match: Match) => void;
  surface: "paper" | "surface";
}) {
  const { match } = props;
  const photo = isAllowedImage(match.imageUrl, STORE_HOSTS) ? match.imageUrl : null;
  return (
    <li className={`flex items-center gap-3 rounded-panel p-3 ${props.surface === "surface" ? "bg-surface" : "bg-paper"}`}>
      <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-thumb bg-sunken">
        {photo ? (
          // Store photos come from a fixed list of hosts (isAllowedImage); next/image would proxy them.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="size-full object-contain outline outline-1 -outline-offset-1 outline-image-outline"
          />
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="line-clamp-2 text-small text-ink">{match.title}</span>
        <span className="text-caption text-graphite">
          {storeName(match.store)}
          {limitationOf(match) ? ` · ${limitationOf(match)}` : ""}
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-ui text-ink tabular-nums">{match.priceText}</span>
          {withinTarget(props.watch, match) ? (
            <span className="rounded-tag bg-ink px-1.5 py-0.5 text-label text-on-ink">
              {(props.watch.confirmed ?? props.watch.draft).condition.kind === "near_price" ? "Perto do seu valor" : "Dentro do seu preço"}
            </span>
          ) : null}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-stretch gap-2">
        <StoreLink
          url={match.url}
          store={match.store}
          label="Ver"
          click={{
            sessionId: props.sessionId,
            title: match.title,
            where: { source: "product_card", position: props.position },
          }}
        />
        {props.onAsk ? (
          <button
            type="button"
            onClick={() => props.onAsk?.(match)}
            aria-label={`Perguntar sobre ${match.title}`}
            className="press min-h-11 rounded-full px-4 text-ui text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink hover:bg-sunken"
          >
            Perguntar
          </button>
        ) : null}
      </span>
    </li>
  );
}

/** The offers of a reading, cheapest first, as many as `limit`. */
export function OfferList(props: {
  watch: Watch;
  matches: Match[];
  sessionId: string | null;
  onAsk?: (match: Match) => void;
  surface?: "paper" | "surface";
  limit?: number;
}) {
  const offers = [...props.matches]
    .sort((a, b) => (a.amount ?? Number.POSITIVE_INFINITY) - (b.amount ?? Number.POSITIVE_INFINITY))
    .slice(0, props.limit ?? 5);
  return (
    <ul className="flex flex-col gap-2">
      {offers.map((match, position) => (
        <Offer
          key={`${match.url}-${position}`}
          watch={props.watch}
          match={match}
          position={position}
          sessionId={props.sessionId}
          onAsk={props.onAsk}
          surface={props.surface ?? "paper"}
        />
      ))}
    </ul>
  );
}
