"use client";
// T13 on the web: one card per research run, updated in place from real steps.
import type { ResearchRunState } from "@/tone/shared";
import { StoreLink } from "./Program";

/** Where the prices came from: the index (T04) or the store page read by the extension (T14). */
function provenanceNote(run: ResearchRunState): string {
  const levels = new Set(run.result?.evidence.map((entry) => entry.level) ?? []);
  if (levels.has("origin") && !levels.has("index"))
    return "Preços lidos na página da loja pela extensão, no seu Chrome; frete e estoque podem mudar no carrinho.";
  if (levels.has("origin"))
    return "Parte dos preços foi lida na loja pela extensão e parte observada no índice do Google Shopping; a loja pode ter outro valor, frete ou estoque.";
  return "Preços observados no índice do Google Shopping; a loja pode ter outro valor, frete ou estoque.";
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
      <p className="text-small font-medium text-ink" aria-live="polite">
        {run.message}
        {run.stage === "reading" && run.total !== null && !run.terminal ? ` · ${run.done ?? 0} de ${run.total}` : ""}
      </p>
      {offers.length ? (
        <ul className="flex flex-col gap-2">
          {offers.slice(0, 5).map((offer) => (
            <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-small text-ink">
                {titleOf(offer.variantId)}
                <span className="block text-caption text-graphite">
                  {offer.store} · {offer.price.kind === "unknown" ? "preço desconhecido" : offer.price.originalText}
                </span>
              </span>
              <StoreLink url={offer.url} />
            </li>
          ))}
        </ul>
      ) : null}
      {offers.length ? <p className="text-caption text-graphite">{provenanceNote(run)}</p> : null}
    </section>
  );
}
