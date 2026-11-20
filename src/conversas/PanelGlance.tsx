// The glance of a panel on its card in the column next to the chat (20/11/2026: "gosto de ver os
// preços de relance sem sair do chat"): one line per product with its best confirmed price and the
// change since the day before, "Bom momento" when the verdict says so, and when it was read.
import { isAllowedImage, type WatchSummary } from "@/tone/shared";
import { priceDelta } from "./price-delta";
import { STORE_HOSTS } from "./Program";

const SHOWN = 3;
const when = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export function PanelGlance(props: { summary: WatchSummary }) {
  const { summary } = props;
  const shown = summary.products.slice(0, SHOWN);
  const more = summary.products.length - shown.length;
  return (
    <div className="flex flex-col gap-2">
      {summary.verdict.kind === "good" ? (
        <span className="self-start rounded-tag bg-accent-soft px-2 py-0.5 text-label text-accent-text">Bom momento</span>
      ) : null}
      <ul className="flex flex-col">
        {shown.map((product, index) => {
          const delta = priceDelta(product.best?.amount ?? null, product.previous);
          const photo = isAllowedImage(product.best?.imageUrl ?? null, STORE_HOSTS) ? product.best?.imageUrl : null;
          return (
            <li key={`${product.title}-${index}`} className="grid min-h-9 grid-cols-[1.75rem_1fr_auto_4rem] items-center gap-2.5">
              <span className="grid size-7 place-items-center overflow-hidden rounded-tag bg-sunken">
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
              <span className="truncate text-small text-ink">{product.title}</span>
              {product.best ? (
                <span className="text-small font-semibold text-ink tabular-nums">{product.best.priceText}</span>
              ) : (
                <span className="text-caption text-graphite">sem oferta</span>
              )}
              <span
                className={`text-end text-caption tabular-nums ${delta?.good ? "font-medium text-accent-text" : "text-graphite"}`}
              >
                {delta?.text ?? ""}
              </span>
            </li>
          );
        })}
      </ul>
      {more > 0 ? <span className="text-caption text-graphite">+ {more}</span> : null}
      {summary.observedAt ? <span className="text-caption text-graphite">Lido em {when(summary.observedAt)}</span> : null}
    </div>
  );
}
