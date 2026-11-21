// The first thing on a panel's page (20/11/2026: "vale comprar agora, e qual?"): whether this is a
// good moment, the product and price behind it, why in one sentence, and the way to the store. The
// coral panel only for a good moment, the tone's "yes"; every other state stays on the white card.
import type { WatchSummary } from "@/tone/shared";
import { StoreLink } from "./Program";

export const VERDICT_LABEL: Record<Exclude<WatchSummary["verdict"]["kind"], "none">, string> = {
  good: "Bom momento para comprar",
  normal: "Preço normal",
  high: "Acima do normal",
  learning: "Ainda conhecendo o preço",
};

export function PanelVerdict(props: { summary: WatchSummary; onStore?: () => void }) {
  const { verdict } = props.summary;
  if (verdict.kind === "none") return null;
  const product = verdict.productIndex === null ? null : props.summary.products[verdict.productIndex];
  const best = product?.best ?? null;
  const good = verdict.kind === "good";
  return (
    <section
      aria-labelledby="titulo-veredito"
      className={`flex flex-wrap items-end justify-between gap-4 rounded-card p-5 ${good ? "bg-accent-soft" : "bg-surface shadow-raised"}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="titulo-veredito" className={`text-small font-semibold ${good ? "text-accent-text" : "text-graphite"}`}>
          {VERDICT_LABEL[verdict.kind]}
        </h2>
        {best ? (
          <p className="line-clamp-2 text-subheading text-ink tabular-nums">{`${best.title} por ${best.priceText}`}</p>
        ) : null}
        {verdict.reason ? <p className="text-small text-graphite text-pretty">{verdict.reason}</p> : null}
      </div>
      {best ? (
        <span onClickCapture={props.onStore}>
          <StoreLink url={best.url} store={best.store} click={{ sessionId: null, title: best.title, where: { source: "product_card", position: 0 } }} />
        </span>
      ) : null}
    </section>
  );
}
