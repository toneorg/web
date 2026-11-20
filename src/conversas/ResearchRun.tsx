"use client";
// T13 on the web: one card per research run, updated in place from real steps.
// T16: the note under the offers says whether a remote browser read them (provenanceNote).
import { provenanceNote, type ResearchRunState, storeLabel } from "@/tone/shared";
import { StoreLink } from "./Program";

/** A size at the end of a title ("– 36", "- GG"): the same piece in another size, not another product. */
const SIZE_SUFFIX = /\s+[-–—]\s*(?:\d{1,3}|PP|P|M|G|GG|XG|XGG|EG|EGG|U|ÚNICO|UNICO)\s*$/i;

/**
 * The few offers shown while the search runs: one per product (sizes of the same piece count once),
 * taking turns between stores, so one store's search never fills the list (20/11/2026: four sizes
 * of the same C&A trousers).
 */
export function previewOffers<T extends { store: string }>(offers: readonly T[], titleOf: (offer: T) => string, limit = 5): T[] {
  const seen = new Set<string>();
  const byStore = new Map<string, T[]>();
  for (const offer of offers) {
    const key = `${offer.store}|${titleOf(offer).replace(SIZE_SUFFIX, "").trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    byStore.set(offer.store, [...(byStore.get(offer.store) ?? []), offer]);
  }
  const queues = [...byStore.values()];
  const picked: T[] = [];
  for (let round = 0; picked.length < limit && queues.some((queue) => queue.length > round); round++)
    for (const queue of queues) {
      const offer = queue[round];
      if (offer && picked.length < limit) picked.push(offer);
    }
  return picked;
}

export function ResearchRun(props: { run: ResearchRunState }) {
  const { run } = props;
  const offers = run.result?.offers ?? [];
  const titleOf = (variantId: string) => {
    const variant = run.result?.variants.find((entry) => entry.id === variantId);
    return run.result?.products.find((entry) => entry.id === variant?.productId)?.title ?? variant?.label ?? "Oferta";
  };
  return (
    <section className="flex flex-col gap-2 rounded-panel bg-surface p-4 shadow-raised" aria-label="Pesquisa de produtos">
      <p className="flex items-center gap-2 text-small font-medium text-ink" aria-live="polite">
        {/* While the run works, a dot shows it is alive; it stops still for reduced motion and at the end. */}
        <span
          aria-hidden="true"
          className={`size-2 shrink-0 rounded-full ${run.terminal ? "bg-rule" : "animate-pulse bg-ink motion-reduce:animate-none"}`}
        />
        {run.message}
        {run.stage === "reading" && run.total !== null && !run.terminal ? ` · ${run.done ?? 0} de ${run.total}` : ""}
      </p>
      {offers.length ? (
        <ul className="flex flex-col gap-2">
          {previewOffers(offers, (offer) => titleOf(offer.variantId)).map((offer, index) => (
            <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-small text-ink">
                {titleOf(offer.variantId)}
                <span className="block text-caption text-graphite">
                  {storeLabel(offer.store)} · {offer.price.kind === "unknown" ? "preço desconhecido" : offer.price.originalText}
                </span>
              </span>
              <StoreLink
                url={offer.url}
                store={offer.store}
                click={{
                  sessionId: run.sessionId,
                  title: titleOf(offer.variantId),
                  where: { source: "research_run", position: index, offerId: offer.id, runId: run.runId },
                }}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {offers.length ? <p className="text-caption text-graphite">{provenanceNote(run)}</p> : null}
    </section>
  );
}
