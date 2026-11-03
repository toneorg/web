"use client";
// The panel inside its conversation: what the watch found, with the product
// photos the index listed, the newest reading first and the earlier ones behind
// a disclosure. A panel is a conversation; this is where its results live.
import { isAllowedImage, type Watch, type WatchResult, watchFacts, watchTitle } from "@/tone/shared";
import { lowestOf, readingOf } from "./Panels";
import { STORE_HOSTS, StoreLink } from "./Program";

const STATUS: Record<Watch["status"], string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  deleted: "Apagado",
};
const when = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
const storeName = (store: string) => (store === "google.com" ? "Google Shopping" : store.replace(/^www\./, ""));

type Match = WatchResult["summary"]["matches"][number];

/** Why this price does not count for the alert (a variant the index did not confirm, an installment…). */
const limitationOf = (match: Match) => {
  const value = (match as { limitation?: unknown }).limitation;
  return typeof value === "string" && value ? value : null;
};

/** Whether an offer is inside the person's price, when the condition is a price. */
function withinTarget(watch: Watch, match: Match): boolean {
  const condition = (watch.confirmed ?? watch.draft).condition;
  return condition.kind === "target_price" && match.amount !== null && match.amount <= condition.amount;
}

function Offer(props: { watch: Watch; match: Match; position: number; sessionId: string }) {
  const { match } = props;
  const photo = isAllowedImage(match.imageUrl, STORE_HOSTS) ? match.imageUrl : null;
  return (
    <li className="flex items-center gap-3 rounded-panel bg-paper p-3">
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
            <span className="rounded-tag bg-ink px-1.5 py-0.5 text-label text-on-ink">Dentro do seu preço</span>
          ) : null}
        </span>
      </span>
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
    </li>
  );
}

export function WatchReadings(props: { watch: Watch; results: WatchResult[]; sessionId: string }) {
  const { watch, results } = props;
  const rule = watch.confirmed ?? watch.draft;
  const { latest, emptyRound } = readingOf(results);
  const condition = watchFacts(rule).find(([label]) => label === "Quando avisar")?.[1];
  const offers = [...(latest?.summary.matches ?? [])]
    .sort((a, b) => (a.amount ?? Number.POSITIVE_INFINITY) - (b.amount ?? Number.POSITIVE_INFINITY))
    .slice(0, 5);
  const earlier = results.filter((result) => result.id !== latest?.id).slice(0, 8);
  return (
    <section
      aria-labelledby={`leituras-${watch.id}`}
      className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-raised"
    >
      <header className="flex items-start justify-between gap-3">
        <span className="flex flex-col gap-1">
          <span className="text-caption text-graphite">Painel</span>
          <h2 id={`leituras-${watch.id}`} className="text-subheading text-ink">
            {watchTitle(rule)}
          </h2>
          {condition ? <span className="text-small text-graphite">Avisar: {condition.charAt(0).toLowerCase() + condition.slice(1)}</span> : null}
        </span>
        <span className="shrink-0 rounded-tag bg-sunken px-2 py-0.5 text-label text-graphite">{STATUS[watch.status]}</span>
      </header>

      {latest ? (
        <div className="flex flex-col gap-2">
          <p className="text-small text-ink">
            {latest.conditionMet ? "Condição atingida. " : ""}
            {offers.length
              ? `${latest.summary.matches.length} ${latest.summary.matches.length === 1 ? "oferta" : "ofertas"} em ${when(latest.observedAt)}`
              : latest.summary.message}
          </p>
          {emptyRound ? (
            <p className="text-caption text-graphite">
              A leitura mais recente não achou ofertas no índice; estas são as últimas vistas.
            </p>
          ) : null}
          {offers.length ? (
            <ul className="flex flex-col gap-2">
              {offers.map((match, position) => (
                <Offer key={`${match.url}-${position}`} watch={watch} match={match} position={position} sessionId={props.sessionId} />
              ))}
            </ul>
          ) : null}
          <p className="text-caption text-graphite">
            Preços observados no índice do Google Shopping; o preço final, o frete e o estoque se confirmam na loja.
          </p>
        </div>
      ) : (
        <p className="text-small text-graphite">
          {watch.status === "draft"
            ? "Confirme o rascunho acima para eu começar a acompanhar."
            : `Primeira leitura${watch.nextCheckAt ? ` em ${when(watch.nextCheckAt)}` : " em breve"}.`}
        </p>
      )}

      {earlier.length ? (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-small font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden="true"
              className="size-2 -rotate-45 border-b-2 border-r-2 border-current transition-transform duration-150 ease-soft group-open:rotate-45"
            />
            Leituras anteriores
          </summary>
          <ul className="flex flex-col gap-1 ps-4 text-caption text-graphite">
            {earlier.map((result) => (
              <li key={result.id} className="tabular-nums">
                {when(result.observedAt)}: {lowestOf(result) ? `menor preço ${lowestOf(result)}` : "sem ofertas no índice"}
                {result.conditionMet ? " · condição atingida" : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
