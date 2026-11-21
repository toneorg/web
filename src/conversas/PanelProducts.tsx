// A panel's products on its page (20/11/2026): each with its best confirmed price, the store, its
// last 30 days and the change since the day before; and the history of one product at a time.
import { isAllowedImage, type WatchSummaryProduct } from "@/tone/shared";
import { priceDelta } from "./price-delta";
import { PriceChart } from "./PriceChart";
import { STORE_HOSTS } from "./Program";
import { Sparkline } from "./Sparkline";

const storeName = (store: string) => (store === "google.com" ? "Google Shopping" : store.replace(/^www\./, ""));

export function PanelProducts(props: { products: WatchSummaryProduct[] }) {
  return (
    <ul aria-label="Produtos" className="flex flex-col rounded-card bg-surface p-1.5 shadow-raised">
      {props.products.map((product, index) => {
        const delta = priceDelta(product.best?.amount ?? null, product.previous);
        const photo = isAllowedImage(product.best?.imageUrl ?? null, STORE_HOSTS) ? product.best?.imageUrl : null;
        return (
          <li
            key={`${product.title}-${index}`}
            className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 p-2.5 sm:grid-cols-[3rem_1fr_6rem_auto] [&+&]:border-t [&+&]:border-rule"
          >
            <span className="grid size-12 place-items-center overflow-hidden rounded-thumb bg-sunken">
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
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-body font-medium text-ink">{product.title}</span>
              <span className="text-caption text-graphite">
                {product.best ? storeName(product.best.store) : "Sem oferta confirmada nesta leitura"}
              </span>
            </span>
            <span className="hidden sm:block">
              {product.points.length >= 2 ? <Sparkline points={product.points} /> : null}
            </span>
            <span className="flex flex-col items-end gap-0.5">
              {product.best ? <span className="text-ui text-ink tabular-nums">{product.best.priceText}</span> : null}
              {delta ? (
                <span className={`text-caption tabular-nums ${delta.good ? "font-medium text-accent-text" : "text-graphite"}`}>
                  {delta.text === "igual" ? "igual" : delta.text}
                  <span className="max-sm:hidden">{delta.text === "igual" ? " a ontem" : " desde ontem"}</span>
                </span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** The price history of one product at a time; the one the verdict is about comes first. */
export function PanelHistory(props: {
  products: WatchSummaryProduct[];
  selected: number;
  onSelect: (index: number) => void;
  target?: number | null;
}) {
  const product = props.products[props.selected] ?? props.products[0];
  return (
    <div className="flex flex-col gap-3">
      {props.products.length > 1 ? (
        <div role="group" aria-label="Produto do gráfico" className="flex flex-wrap gap-2">
          {props.products.map((item, index) => (
            <button
              key={`${item.title}-${index}`}
              type="button"
              aria-pressed={index === props.selected}
              onClick={() => props.onSelect(index)}
              className={`press min-h-11 rounded-full px-4 text-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${index === props.selected ? "bg-ink text-on-ink" : "bg-surface text-ink shadow-raised"}`}
            >
              {item.title}
            </button>
          ))}
        </div>
      ) : null}
      {product && product.points.length >= 2 ? (
        <div className="rounded-card bg-surface p-5 shadow-raised">
          <PriceChart prices={{ points: product.points, target: props.target ?? null }} />
        </div>
      ) : (
        <p className="text-small text-graphite">O gráfico aparece a partir do segundo dia de leitura.</p>
      )}
    </div>
  );
}
