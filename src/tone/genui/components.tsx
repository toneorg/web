// Gerado de toneorg/server@d32e8f2a3aca (packages/genui-react/src/components.tsx). Não edite aqui.
// The drawings of the components in packages/shared/src/genui.ts, on the
// neutral bench of the design system: ink and graphite on surface and sunken,
// no colour that does not inform. Charts are drawn with the same tokens.
import type { ComponentRenderer } from "@openuidev/react-lang";
import { useIsStreaming } from "@openuidev/react-lang";
import {
  isGoogleShoppingUrl,
  MEMORY_CHECK_ANSWERS,
  MEMORY_CHECK_PREFIX,
  OUTCOME_CHECK_PREFIX,
  OUTCOME_LABELS,
  type ResearchContext,
  SENSITIVE_CONSENT,
  SENSITIVE_CONSENT_ANSWERS,
  SENSITIVE_CONSENT_PREFIX,
  storeLabel,
} from "@/tone/shared";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { DecisionBoardLoader } from "./DecisionBoard";
import { brl } from "./format";
import { type Answer, dataOf, listOf, opens, safeImage, useHost } from "./host";
import { Icon } from "./Icon";
import { WatchDraftLoader } from "./WatchDraft";
import { Fit, REJECT_REASONS, type RejectReason } from "./wrist";

// ---- Data shapes, as the parser hands them over ----------------------------

interface ProductData {
  title: string;
  url: string;
  price: number | null;
  image?: string | null;
  rating?: number | null;
  reviews?: number | null;
  reasons?: string[] | null;
  caveat?: string | null;
  badge?: string | null;
}

const text = (value: unknown) => (typeof value === "string" ? value : "");
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const strings = (value: unknown) =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
const count = (value: number) => value.toLocaleString("pt-BR");
const rating = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Questions answer once, when the component is the latest thing on screen and has finished arriving. */
function useCanAnswer() {
  const host = useHost();
  const streaming = useIsStreaming();
  return host.interactive && !streaming;
}

function Thumb(props: { src?: string | null; size?: "sm" }) {
  const { storeHosts } = useHost();
  const [broken, setBroken] = useState(false);
  const src = broken ? null : safeImage(props.src, storeHosts);
  const className = props.size === "sm" ? "thumb sm" : "thumb";
  // A photo that fails to load leaves the empty frame, not the browser's broken-image icon.
  return src ? (
    <img
      className={className}
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  ) : (
    <div className={className} aria-hidden="true" />
  );
}

/**
 * The store a product is sold by, as the person knows it: its name from the list, or the site's
 * address without "www." (a brand's own Shopify store). Google Shopping lists several sellers.
 */
function storeOf(url: string): string | null {
  if (!url) return null;
  if (isGoogleShoppingUrl(url)) return "Várias lojas no Google Shopping";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const label = storeLabel(host);
    return label === host ? host : label;
  } catch {
    return null;
  }
}

/** Three bars, the confidence meter of the design system (components/feedback.md). */
function Meter(props: { level: 1 | 2 | 3; label: string }) {
  return (
    <span className="meter">
      <span className="bars" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span key={bar} className={bar <= props.level ? "pip on" : "pip"} />
        ))}
      </span>
      <span className="meter-label">{props.label}</span>
    </span>
  );
}

/** A horizontal share bar: ink on a sunken track. */
function Bar(props: { share: number; tone?: "ink" | "alert" | "graphite" }) {
  const share = Math.max(0, Math.min(100, props.share));
  return (
    <span className="bar" aria-hidden="true">
      <span className={`fill ${props.tone ?? "ink"}`} style={{ width: `${share}%` }} />
    </span>
  );
}

function OpenButton(props: { url: string; title: string; label?: string; quiet?: boolean }) {
  const host = useHost();
  if (!opens(host, props.url)) return null;
  // A product known only from the index opens Google Shopping, which lists who sells it: said as such.
  const label = isGoogleShoppingUrl(props.url) ? "Ver no Google Shopping" : (props.label ?? "Ver na loja");
  return (
    <button
      type="button"
      className={props.quiet ? "btn outline sm" : "btn solid sm"}
      onClick={() => host.act({ type: "open", url: props.url, title: props.title, where: { source: "generated_ui" } })}
    >
      <Icon name="external" size={16} /> {label}
    </button>
  );
}

// ---- Products ---------------------------------------------------------------

/** The model marks its own pick with this badge; the card names it the same way every time. */
const isBest = (product: ProductData) => /melhor escolha/i.test(text(product.badge));

function ProductCard(props: { product: ProductData; slide?: boolean }) {
  const { product } = props;
  const host = useHost();
  const [rejecting, setRejecting] = useState(false);
  const [rejected, setRejected] = useState<RejectReason | null>(null);
  // The reason buttons go away once one is chosen: focus moves to the note that replaces them.
  const noted = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (rejected) noted.current?.focus();
  }, [rejected]);
  const reasons = strings(product.reasons);
  const price = num(product.price);
  const title = text(product.title);
  const stars = num(product.rating);
  const reviews = num(product.reviews);
  const store = storeOf(text(product.url));
  // Turning a product down is a quiet control: on a slide it sits on the photo's corner, so the row
  // below keeps the two actions that move the person forward (20/11/2026: alone on a second row).
  const rejectToggle =
    host.actionable && host.interactive && !rejected ? (
      <button
        type="button"
        className={props.slide ? "icon-btn outline reject-toggle" : "icon-btn outline"}
        aria-label={`Não curti ${title}`}
        title="Não curti"
        aria-expanded={rejecting}
        onClick={() => setRejecting(!rejecting)}
      >
        <Icon name="thumbDown" size={props.slide ? 18 : 20} />
      </button>
    ) : null;
  const best = isBest(product);
  return (
    <article className={["product", props.slide ? "slide" : "", best ? "chosen" : ""].filter(Boolean).join(" ")}>
      <div className="product-media">
        <Thumb src={product.image} />
        {props.slide ? rejectToggle : null}
      </div>
      <div className="product-body">
        {best ? (
          <span className="tag pick">Escolha da tone</span>
        ) : product.badge ? (
          <span className="tag quiet">{product.badge}</span>
        ) : null}
        <div className="title">{title}</div>
        {store ? <div className="product-store">{store}</div> : null}
        <div className="product-price">
          <span className="price">{brl(price)}</span>
          {stars !== null ? (
            <span className="small muted tabular">
              Nota {rating(stars)}
              {reviews ? ` · ${count(reviews)} avaliações` : ""}
            </span>
          ) : null}
        </div>
        {reasons.length > 0 ? (
          <ul className="reasons">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
        {product.caveat ? <p className="caveat">Atenção: {product.caveat}</p> : null}
      </div>
      {host.actionable ? (
        <div className="actions">
          <OpenButton url={text(product.url)} title={title} />
          <PickButton product={product} />
          {props.slide ? null : rejectToggle}
          {rejected ? (
            <p className="small muted product-note" ref={noted} tabIndex={-1}>
              Anotado: {REJECT_REASONS[rejected].toLowerCase()}
            </p>
          ) : null}
          {rejecting && !rejected ? (
            <fieldset className="field product-reject">
              <legend className="small muted">Por que não curtiu?</legend>
              <div className="choices">
                {(Object.keys(REJECT_REASONS) as RejectReason[]).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className="choice"
                    onClick={() => {
                      setRejected(reason);
                      setRejecting(false);
                      host.act({ type: "reject", url: text(product.url), title, reason });
                    }}
                  >
                    {REJECT_REASONS[reason]}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

/**
 * Takes the product to the composer, to ask about it or see its videos; a second tap lets it go.
 * An icon next to "Ver na loja", so the card keeps one row of actions; the name stays and the state is pressed.
 */
function PickButton(props: { product: ProductData }) {
  const host = useHost();
  const url = text(props.product.url);
  const title = text(props.product.title);
  if (host.picked === undefined || !url || !title) return null;
  const picked = host.picked === url;
  return (
    <button
      type="button"
      className={picked ? "icon-btn solid" : "icon-btn outline"}
      aria-pressed={picked}
      aria-label={`Selecionar ${title} para perguntar sobre ele`}
      title={picked ? "Selecionado: toque de novo para tirar da conversa" : "Selecionar para perguntar sobre ele"}
      onClick={() =>
        host.act({
          type: "pick",
          product: picked
            ? null
            : { url, title, price: num(props.product.price), image: safeImage(props.product.image, host.storeHosts) },
        })
      }
    >
      <Icon name={picked ? "check" : "plus"} size={20} />
    </button>
  );
}

/**
 * Previous and next for a mouse, which has no sideways scroll: one card per press. Hidden on touch
 * screens (genui.css), where a swipe does it and the hint under the cards says so.
 */
function CarouselArrows(props: { target: { current: HTMLDivElement | null } }) {
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => {
    const track = props.target.current;
    if (!track) return;
    const measure = () => {
      // Inline start and end in either direction: scrollLeft is negative in right-to-left.
      const position = Math.abs(track.scrollLeft);
      setEdges({ start: position < 4, end: position + track.clientWidth >= track.scrollWidth - 4 });
    };
    measure();
    track.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      track.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [props.target]);
  const move = (direction: 1 | -1) => {
    const track = props.target.current;
    const slide = track?.querySelector<HTMLElement>(".product.slide");
    if (!track || !slide) return;
    const rtl = getComputedStyle(track).direction === "rtl";
    const step = (slide.offsetWidth + 8) * direction * (rtl ? -1 : 1);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollBy({ left: step, behavior: smooth ? "smooth" : "auto" });
  };
  return (
    <div className="carousel-arrows">
      <button
        type="button"
        className="icon-btn outline"
        aria-label="Opções anteriores"
        disabled={edges.start}
        onClick={() => move(-1)}
      >
        <Icon name="back" size={18} />
      </button>
      <button
        type="button"
        className="icon-btn outline"
        aria-label="Próximas opções"
        disabled={edges.end}
        onClick={() => move(1)}
      >
        <Icon name="forward" size={18} />
      </button>
    </div>
  );
}

/** A product on its own, when the model places one outside a list. */
const Product: ComponentRenderer<ProductData> = ({ props }) => <ProductCard product={props} />;

/** The pick first, then the model's order; `index` is each product's place in the model's list. */
const bestFirst = (products: unknown) =>
  (Array.isArray(products) ? products : [])
    // The index is taken before a product that does not resolve is dropped: rows follow the model's list.
    .map((item, index) => ({ product: dataOf<ProductData>(item), index }))
    .filter((entry): entry is { product: ProductData; index: number } => entry.product !== null)
    .map((entry) => ({ ...entry, best: isBest(entry.product) }))
    .sort((left, right) => Number(right.best) - Number(left.best) || left.index - right.index);

/**
 * The model writes a comparison row's values in its own order of products; the carousel may move
 * the pick first, so each row follows the products to their new places (21/11/2026).
 */
const alignRows = (rows: CarouselRow[], order: number[]): CarouselRow[] =>
  rows.map((row) => {
    const values = strings(row.values);
    const best = num(row.best);
    return {
      label: row.label,
      values: order.map((index) => values[index] ?? ""),
      best: best === null ? null : order.indexOf(best),
    };
  });

/** "R$ 1.200,50", "150,90" and "150.90" as a number (a dot before two last digits is the cents). */
const moneyOf = (written: string): number => {
  const digits = written.replace(/[^\d.,]/g, "");
  const normal = digits.includes(",")
    ? digits.replace(/\./g, "").replace(",", ".")
    : /\.\d{1,2}$/.test(digits)
      ? digits
      : digits.replace(/\./g, "");
  const number = Number(normal);
  return Number.isFinite(number) ? number : 0;
};

type CarouselView = "list" | "compare";
const VIEW_KEY = "tone.carousel.view";

/** Lista or Comparar, remembered on this device only; without storage it starts on the list. */
function useCarouselView(): [CarouselView, (view: CarouselView) => void] {
  const [view, setView] = useState<CarouselView>("list");
  useEffect(() => {
    try {
      if (window.localStorage.getItem(VIEW_KEY) === "compare") setView("compare");
    } catch {
      // Private window or blocked storage: the list it is.
    }
  }, []);
  const change = (next: CarouselView) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Not remembered; still changed.
    }
  };
  return [view, change];
}

interface CarouselRow {
  label: string;
  values?: unknown;
  best?: number | null;
}

/**
 * The same options side by side (21/11/2026): one column each, in the carousel's order, the tone's
 * choice tinted. The labels stay put while the columns scroll.
 */
function CompareTable(props: { products: ProductData[]; rows: CarouselRow[]; title: string }) {
  const { products, rows } = props;
  const chosen = (product: ProductData) => (isBest(product) ? "chosen" : undefined);
  const line = (
    key: string,
    label: string,
    value: (product: ProductData, index: number) => ReactNode,
    best?: number | null,
  ) => (
    <tr key={key}>
      <th scope="row">{label}</th>
      {products.map((product, index) => (
        <td
          key={`${product.url}|${product.title}`}
          className={[chosen(product), best === index ? "best" : ""].filter(Boolean).join(" ") || undefined}
        >
          {value(product, index)}
          {best === index ? <span className="visually-hidden"> (melhor nesta linha)</span> : null}
        </td>
      ))}
    </tr>
  );
  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls sideways takes the keyboard's arrows
    <section className="compare carousel-compare" aria-label="Comparação lado a lado" tabIndex={0}>
      <table>
        <caption className="visually-hidden">{props.title}: as opções lado a lado</caption>
        <thead>
          <tr>
            <td />
            {products.map((product) => (
              <th key={`${product.url}|${product.title}`} scope="col" className={chosen(product)}>
                <Thumb src={product.image} size="sm" />
                <span className="compare-title">{text(product.title)}</span>
                {isBest(product) ? (
                  <span className="tag pick">Escolha</span>
                ) : product.badge ? (
                  <span className="tag quiet">{product.badge}</span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {line("price", "Preço", (product) => {
            const price = num(product.price);
            return price === null ? <span className="muted">Sem preço</span> : <strong>{brl(price)}</strong>;
          })}
          {rows.map((row, at) =>
            line(`row-${at}`, text(row.label), (_, index) => strings(row.values)[index] || "—", num(row.best)),
          )}
          {line("rating", "Avaliações", (product) => {
            const stars = num(product.rating);
            const reviews = num(product.reviews);
            return stars === null ? "—" : `${rating(stars)}${reviews ? ` · ${count(reviews)}` : ""}`;
          })}
          {line("store", "Loja", (product) => storeOf(text(product.url)) ?? "—")}
          <tr className="compare-actions">
            <th scope="row">
              <span className="visually-hidden">Comprar</span>
            </th>
            {products.map((product) => (
              <td key={`${product.url}|${product.title}`} className={chosen(product)}>
                <OpenButton url={text(product.url)} title={text(product.title)} quiet={!isBest(product)} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </section>
  );
}

const dayOf = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
};

type UsedItem = ResearchContext["used"][number];

/** "Ignorar só nesta busca" or "Mudar de vez" for one preference that came from memory (21/11/2026). */
function UsedPanel(props: { item: UsedItem; id: string; onClose: () => void }) {
  const { item } = props;
  const host = useHost();
  const [mode, setMode] = useState<"skip" | "change">("skip");
  const memory = item.memory;
  const [value, setValue] = useState(memory?.value ?? "");
  const first = useRef<HTMLInputElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  if (!memory) return null;
  const day = dayOf(memory.savedAt);
  const fresh = value.trim();
  const canRun = host.interactive && (mode === "skip" || (Boolean(fresh) && fresh !== memory.value));
  const run = () => {
    if (!canRun) return;
    if (mode === "skip") host.act({ type: "skip_personal", ids: [item.id], label: item.label });
    else {
      const amount = moneyOf(fresh);
      const label = (item.id === "pessoa_orcamento" && amount > 0 ? `até ${brl(amount)}` : fresh).slice(0, 40);
      host.act({
        type: "change_memory",
        id: memory.id,
        key: memory.key,
        category: memory.category,
        value: fresh,
        label,
      });
    }
    props.onClose();
  };
  const name = `${props.id}-mode`;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape anywhere in the panel closes it and returns to the pill.
    <div
      className="used-panel"
      id={props.id}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          props.onClose();
        }
      }}
    >
      <p className="small">
        <strong>{item.label}</strong> veio do que você me disse{day ? ` em ${day}` : ""}.
      </p>
      <fieldset className="used-options">
        <legend className="visually-hidden">O que fazer com {item.label}</legend>
        <label className="used-option">
          <input ref={first} type="radio" name={name} checked={mode === "skip"} onChange={() => setMode("skip")} />
          <span>
            <span className="used-option-title">Ignorar só nesta busca</span>
            <span className="small muted">Pesquiso de novo sem isso. Sua preferência continua.</span>
          </span>
        </label>
        <label className="used-option">
          <input type="radio" name={name} checked={mode === "change"} onChange={() => setMode("change")} />
          <span>
            <span className="used-option-title">Mudar de vez</span>
            <span className="small muted">Troco a preferência e uso a nova nas próximas compras.</span>
          </span>
        </label>
      </fieldset>
      {mode === "change" ? (
        <div className="field">
          <label htmlFor={`${props.id}-value`}>Novo valor</label>
          <input
            id={`${props.id}-value`}
            className="input"
            value={value}
            maxLength={40}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") run();
            }}
          />
        </div>
      ) : null}
      <div className="used-actions">
        <button type="button" className="btn solid sm" disabled={!canRun} onClick={run}>
          Pesquisar de novo
        </button>
        <button type="button" className="btn outline sm" onClick={props.onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/**
 * "Usei: …": what weighed on this search (21/11/2026). A coral dot marks what came from the person's
 * memory, and only those open the panel; a value the server raised shows before and after.
 */
function UsedFilters(props: { context: ResearchContext }) {
  const host = useHost();
  const [open, setOpen] = useState<string | null>(null);
  const pills = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelId = useId();
  const widened = new Map(props.context.widened.map((entry) => [entry.id, entry]));
  const opened = props.context.used.find((item) => item.id === open) ?? null;
  const close = () => {
    const id = open;
    setOpen(null);
    if (id) pills.current[id]?.focus();
  };
  const shown = (item: UsedItem) => {
    const raised = widened.get(item.id);
    if (!raised) return item.label;
    return (
      <>
        <s>{item.label}</s>
        <span className="visually-hidden">, nesta busca</span> até {raised.to}
      </>
    );
  };
  const fromMemory = props.context.used.some((item) => item.source === "memory");
  return (
    <div className="used">
      <div className="used-row">
        <span className="used-label">Usei:</span>
        {/* biome-ignore lint/a11y/noRedundantRoles: Safari drops the list role of a list drawn with display: contents */}
        <ul className="used-list" role="list">
          {props.context.used.map((item) => (
            <li key={item.id}>
              {item.source === "memory" && item.memory && host.actionable && host.interactive ? (
                <button
                  type="button"
                  className="used-pill memory"
                  ref={(node) => {
                    pills.current[item.id] = node;
                  }}
                  aria-expanded={open === item.id}
                  onKeyDown={(event) => {
                    if (event.key === "Escape" && open === item.id) close();
                  }}
                  aria-controls={open === item.id ? panelId : undefined}
                  onClick={() => {
                    const next = open === item.id ? null : item.id;
                    setOpen(next);
                    if (next) host.act({ type: "track", event: "used_filter_opened", props: { id: item.id } });
                  }}
                >
                  <span className="used-dot" aria-hidden="true" />
                  <span className="visually-hidden">Da sua memória: </span>
                  {shown(item)}
                </button>
              ) : (
                <span className={item.source === "memory" ? "used-pill memory" : "used-pill"}>
                  {item.source === "memory" ? <span className="used-dot" aria-hidden="true" /> : null}
                  {shown(item)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      {opened ? <UsedPanel key={opened.id} item={opened} id={panelId} onClose={close} /> : null}
      {props.context.note ? (
        <p className="used-note">
          <Icon name="up" size={16} />
          <span>{props.context.note}</span>
        </p>
      ) : fromMemory && !opened ? (
        <p className="used-legend" aria-hidden="true">
          <span className="used-dot" /> da sua memória
        </p>
      ) : null}
    </div>
  );
}

const ProductCarousel: ComponentRenderer<{ title: string; products: unknown; compare?: unknown }> = ({ props }) => {
  const host = useHost();
  const ordered = bestFirst(props.products);
  const products = ordered.map((entry) => entry.product);
  const rows = alignRows(
    listOf<CarouselRow>(props.compare).filter((row) => text(row.label)),
    ordered.map((entry) => entry.index),
  );
  const track = useRef<HTMLDivElement>(null);
  const [view, setView] = useCarouselView();
  // A list with no product (named from another block, 16/11/2026) would be a bare title: drawn as nothing,
  // and the server asks the model to write the block again.
  if (!products.length) return null;
  const many = products.length > 1;
  const comparing = many && view === "compare";
  const title = text(props.title);
  const change = (next: CarouselView) => {
    if (next === view) return;
    setView(next);
    host.act({ type: "track", event: "carousel_view_changed", props: { view: next } });
  };
  return (
    <section className="card" aria-label={title}>
      <div className="carousel-head">
        <h3>{title}</h3>
      </div>
      {host.research?.used.length ? <UsedFilters context={host.research} /> : null}
      {many ? (
        <div className="carousel-controls">
          <fieldset className="view-switch">
            <legend className="visually-hidden">Ver as opções</legend>
            <button type="button" aria-pressed={!comparing} onClick={() => change("list")}>
              Lista
            </button>
            <button type="button" aria-pressed={comparing} onClick={() => change("compare")}>
              Comparar
            </button>
          </fieldset>
          {comparing ? (
            <span className="small muted">{products.length} opções</span>
          ) : (
            <CarouselArrows target={track} />
          )}
        </div>
      ) : null}
      {comparing ? (
        <CompareTable products={products} rows={rows} title={title} />
      ) : many ? (
        <div className="carousel" ref={track}>
          {products.map((product) => (
            <ProductCard key={`${product.url}|${product.title}`} product={product} slide />
          ))}
        </div>
      ) : (
        <div className="products">
          {products.map((product) => (
            <ProductCard key={`${product.url}|${product.title}`} product={product} />
          ))}
        </div>
      )}
      {many && !comparing ? (
        <p className="small muted carousel-hint">Role para o lado para ver as {products.length} opções.</p>
      ) : null}
    </section>
  );
};

// ---- Questions ----------------------------------------------------------------

const PreferenceChips: ComponentRenderer<{
  question: string;
  memoryKey: string;
  options: unknown;
  multiple?: boolean | null;
}> = ({ props }) => {
  const host = useHost();
  const canAnswer = useCanAnswer();
  const [picked, setPicked] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const options = strings(props.options);
  const question = text(props.question);
  const send = (values: string[]) => {
    setSent(true);
    const answer = values.join(", ");
    host.act({ type: "answer", answers: [{ memoryKey: text(props.memoryKey), question, answer }], display: answer });
  };
  const locked = sent || !canAnswer;
  return (
    <section className="card" aria-label={question}>
      <p className="question">{question}</p>
      <div className="choices">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="choice"
            aria-pressed={picked.includes(option)}
            disabled={locked}
            onClick={() => {
              if (!props.multiple) {
                setPicked([option]);
                send([option]);
                return;
              }
              setPicked((list) => (list.includes(option) ? list.filter((o) => o !== option) : [...list, option]));
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {props.multiple && !sent ? (
        <button
          type="button"
          className="btn solid block spaced"
          disabled={!canAnswer || picked.length === 0}
          onClick={() => send(picked)}
        >
          Confirmar
        </button>
      ) : null}
    </section>
  );
};

const VisualChoice: ComponentRenderer<{ question: string; memoryKey: string; options: unknown }> = ({ props }) => {
  const host = useHost();
  const canAnswer = useCanAnswer();
  const [picked, setPicked] = useState<string | null>(null);
  const question = text(props.question);
  const options = listOf<{ label: string; image?: string | null }>(props.options);
  return (
    <section className="card" aria-label={question}>
      <p className="question">{question}</p>
      <div className="options">
        {options.map((option) => {
          const image = safeImage(option.image, host.storeHosts);
          return (
            <button
              key={option.label}
              type="button"
              className="option"
              aria-pressed={picked === option.label}
              disabled={picked !== null || !canAnswer}
              onClick={() => {
                setPicked(option.label);
                host.act({
                  type: "answer",
                  answers: [{ memoryKey: text(props.memoryKey), question, answer: option.label }],
                  display: option.label,
                });
              }}
            >
              {image ? <img src={image} alt="" referrerPolicy="no-referrer" /> : null}
              <span className="option-label">{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const ProductQuiz: ComponentRenderer<{ title: string; steps: unknown }> = ({ props }) => {
  const host = useHost();
  const canAnswer = useCanAnswer();
  const steps = listOf<{ question: string; memoryKey: string; options: string[] }>(props.steps);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const done = steps.length > 0 && answers.length >= steps.length;
  const step = steps[Math.min(answers.length, Math.max(steps.length - 1, 0))];
  const choose = (option: string) => {
    if (!step) return;
    const next = [...answers, { memoryKey: text(step.memoryKey), question: text(step.question), answer: option }];
    setAnswers(next);
    if (next.length === steps.length) {
      host.act({ type: "answer", answers: next, display: next.map((a) => a.answer).join(" · ") });
    }
  };
  return (
    <section className="card quiz" aria-label={text(props.title)}>
      <div className="quiz-head">
        <h3>{text(props.title)}</h3>
        <span className="small muted">
          {done ? "Pronto" : `${Math.min(answers.length + 1, steps.length)} de ${steps.length}`}
        </span>
      </div>
      <div className="progress" aria-hidden="true">
        {steps.map((s, index) => (
          <span key={s.memoryKey || index} className={index < answers.length ? "step on" : "step"} />
        ))}
      </div>
      {done ? (
        <ul className="quiz-summary">
          {answers.map((answer) => (
            <li key={answer.memoryKey}>
              <span className="muted">{answer.question}</span> {answer.answer}
            </li>
          ))}
        </ul>
      ) : step ? (
        <>
          <p className="question">{text(step.question)}</p>
          <div className="choices">
            {strings(step.options).map((option) => (
              <button
                key={option}
                type="button"
                className="choice"
                disabled={!canAnswer}
                onClick={() => choose(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {answers.length > 0 ? (
            <button type="button" className="btn ghost sm" onClick={() => setAnswers(answers.slice(0, -1))}>
              <Icon name="back" size={16} /> Voltar
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
};

const TradeoffSliders: ComponentRenderer<{ question: string; sliders: unknown }> = ({ props }) => {
  const host = useHost();
  const canAnswer = useCanAnswer();
  const sliders = listOf<{ memoryKey: string; left: string; right: string; value?: number | null }>(props.sliders);
  const [values, setValues] = useState<Record<string, number>>({});
  const [sent, setSent] = useState(false);
  const positionValue = (s: (typeof sliders)[number]) => values[s.memoryKey] ?? num(s.value) ?? 50;
  const positionOf = (s: (typeof sliders)[number]) => {
    const value = positionValue(s);
    if (value <= 35) return `prefere ${s.left.toLowerCase()} (${100 - value}%)`;
    if (value >= 65) return `prefere ${s.right.toLowerCase()} (${value}%)`;
    return `equilíbrio entre ${s.left.toLowerCase()} e ${s.right.toLowerCase()}`;
  };
  const question = text(props.question);
  return (
    <section className="card" aria-label={question}>
      <p className="question">{question}</p>
      <div className="sliders">
        {sliders.map((s) => (
          <label key={s.memoryKey} className="slider">
            <span className="ends">
              <span>{s.left}</span>
              <span>{s.right}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={positionValue(s)}
              disabled={sent || !canAnswer}
              aria-label={`${s.left} ou ${s.right}`}
              aria-valuetext={positionOf(s)}
              onChange={(event) => setValues({ ...values, [s.memoryKey]: Number(event.target.value) })}
            />
          </label>
        ))}
      </div>
      <button
        type="button"
        className="btn solid block spaced"
        disabled={sent || !canAnswer || sliders.length === 0}
        onClick={() => {
          setSent(true);
          const answers = sliders.map((s) => ({
            memoryKey: text(s.memoryKey),
            question: `${s.left} ou ${s.right}`,
            answer: positionOf(s),
          }));
          host.act({ type: "answer", answers, display: answers.map((a) => a.answer).join(" · ") });
        }}
      >
        {sent ? "Enviado" : "Usar estas preferências"}
      </button>
    </section>
  );
};

// ---- Comparing and judging --------------------------------------------------

const ComparisonMatrix: ComponentRenderer<{
  products: unknown;
  rows: unknown;
  recommended: number;
  verdict: string;
}> = ({ props }) => {
  const products = listOf<ProductData>(props.products);
  const rows = listOf<{ label: string; values: string[]; best?: number | null }>(props.rows);
  const recommended = num(props.recommended) ?? 0;
  const winner = products[recommended];
  return (
    <section className="card" aria-label="Comparação">
      <h3>Comparação</h3>
      <div className="compare">
        <table>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Atributo</span>
              </th>
              {products.map((p, i) => (
                <th key={p.url || p.title} scope="col" className={i === recommended ? "recommended" : undefined}>
                  <Thumb src={p.image} size="sm" />
                  <span className="compare-title">{text(p.title)}</span>
                  {i === recommended ? <span className="tag">Recomendado</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Preço</th>
              {products.map((p, i) => (
                <td key={p.url || p.title} className={i === recommended ? "recommended price" : "price"}>
                  {brl(num(p.price))}
                </td>
              ))}
            </tr>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {products.map((p, i) => {
                  const best = num(row.best) === i;
                  return (
                    <td
                      key={p.url || p.title}
                      className={
                        [i === recommended ? "recommended" : "", best ? "best" : ""].join(" ").trim() || undefined
                      }
                    >
                      {strings(row.values)[i] ?? "—"}
                      {best ? <span className="visually-hidden"> (melhor nesta linha)</span> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="verdict">{text(props.verdict)}</p>
      {winner ? (
        <div className="spaced">
          <OpenButton url={text(winner.url)} title={text(winner.title)} label="Ver o recomendado" />
        </div>
      ) : null}
    </section>
  );
};

/** A row of a Comparison: short text per option, or a 1-to-5 scale between two ends (a ScaleRow). */
interface CompareRowData {
  label: string;
  values?: unknown;
  best?: number | null;
  left?: string;
  right?: string;
}

const isScale = (row: CompareRowData) => typeof row.left === "string" && typeof row.right === "string";

/** Five pips, the filled ones the value; the number and the ends are written for the screen reader. */
function ScaleValue(props: { value: number | null; left: string; right: string }) {
  if (props.value === null) return <>—</>;
  const value = Math.max(1, Math.min(5, Math.round(props.value)));
  return (
    <span className="scale">
      <span className="scale-pips" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((pip) => (
          <span key={pip} className={pip <= value ? "pip on" : "pip"} />
        ))}
      </span>
      <span className="visually-hidden">
        {value} de 5, de {props.left} a {props.right}
      </span>
    </span>
  );
}

function CompareValue(props: { row: CompareRowData; index: number }) {
  const { row, index } = props;
  if (isScale(row)) {
    const values = Array.isArray(row.values) ? row.values : [];
    return <ScaleValue value={num(values[index])} left={text(row.left)} right={text(row.right)} />;
  }
  const best = num(row.best) === index;
  return (
    <>
      {strings(row.values)[index] ?? "—"}
      {best ? <span className="visually-hidden"> (destaque nesta linha)</span> : null}
    </>
  );
}

function CompareLabel(props: { row: CompareRowData }) {
  const { row } = props;
  return (
    <>
      {text(row.label)}
      {isScale(row) ? (
        <span className="scale-ends">
          {text(row.left)} → {text(row.right)}
        </span>
      ) : null}
    </>
  );
}

/**
 * Options that are not store products (the lines of a perfume, kinds of screen), side by side.
 * A real table where there is room; one card per option on a narrow screen (genui.css).
 */
const Comparison: ComponentRenderer<{
  title: string;
  options: unknown;
  rows: unknown;
  choose?: unknown;
  recommended?: number | null;
  note?: string | null;
}> = ({ props }) => {
  const options = strings(props.options);
  const rows = listOf<CompareRowData>(props.rows);
  const choose = strings(props.choose);
  const recommended = num(props.recommended);
  const bestClass = (row: CompareRowData, i: number) =>
    [i === recommended ? "recommended" : "", !isScale(row) && num(row.best) === i ? "best" : ""].join(" ").trim() ||
    undefined;
  return (
    <section className="card comparison" aria-label={text(props.title) || "Comparação"}>
      <h3>{text(props.title)}</h3>
      <div className="compare compare-wide">
        <table>
          <caption className="visually-hidden">{text(props.title)}</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="visually-hidden">Atributo</span>
              </th>
              {options.map((option, i) => (
                <th key={option} scope="col" className={i === recommended ? "recommended" : undefined}>
                  <span className="compare-title">{option}</span>
                  {i === recommended ? <span className="tag">Para você</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={text(row.label)}>
                <th scope="row">
                  <CompareLabel row={row} />
                </th>
                {options.map((option, i) => (
                  <td key={option} className={bestClass(row, i)}>
                    <CompareValue row={row} index={i} />
                  </td>
                ))}
              </tr>
            ))}
            {choose.length ? (
              <tr className="choose">
                <th scope="row">Quando escolher</th>
                {options.map((option, i) => (
                  <td key={option} className={i === recommended ? "recommended" : undefined}>
                    {choose[i] ?? "—"}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <ul className="compare-cards" aria-label={text(props.title)}>
        {options.map((option, i) => (
          <li key={option} className={i === recommended ? "compare-card recommended" : "compare-card"}>
            <div className="compare-card-head">
              <h4>{option}</h4>
              {i === recommended ? <span className="tag">Para você</span> : null}
            </div>
            <dl>
              {rows.map((row) => (
                <div key={text(row.label)} className={bestClass(row, i)}>
                  <dt>
                    <CompareLabel row={row} />
                  </dt>
                  <dd>
                    <CompareValue row={row} index={i} />
                  </dd>
                </div>
              ))}
            </dl>
            {choose[i] ? (
              <p className="compare-choose">
                <span className="compare-choose-label">Quando escolher</span> {choose[i]}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {props.note ? <p className="small muted spaced">{props.note}</p> : null}
    </section>
  );
};

const CALLOUT = {
  atencao: { icon: "alert", label: "Atenção" },
  dica: { icon: "memory", label: "Dica" },
  nota: { icon: "info", label: "Nota" },
} as const;

/** A short warning or tip that must not be missed. The kind is written, not only drawn. */
const Callout: ComponentRenderer<{ kind: keyof typeof CALLOUT; title: string; text: string }> = ({ props }) => {
  const kind = CALLOUT[props.kind] ? props.kind : "nota";
  const look = CALLOUT[kind];
  return (
    <aside className={`callout ${kind}`} aria-label={`${look.label}: ${text(props.title)}`}>
      <span className="callout-mark" aria-hidden="true">
        <Icon name={look.icon} size={20} />
      </span>
      <div>
        <p className="callout-title">
          <span className="visually-hidden">{look.label}: </span>
          {text(props.title)}
        </p>
        <p className="small">{text(props.text)}</p>
      </div>
    </aside>
  );
};

const VERDICTS = {
  comprar: { title: "Vale a pena", level: 3 as const },
  depende: { title: "Depende", level: 2 as const },
  evitar: { title: "Melhor evitar", level: 1 as const },
};

const ProductVerdict: ComponentRenderer<{
  product: unknown;
  verdict: keyof typeof VERDICTS;
  summary: string;
  pros: unknown;
  cons: unknown;
  score?: number | null;
}> = ({ props }) => {
  const product = dataOf<ProductData>(props.product);
  const verdict = VERDICTS[props.verdict] ?? VERDICTS.depende;
  const score = num(props.score);
  return (
    <section className="card verdict-card" aria-label={`Veredito: ${verdict.title}`}>
      <div className="verdict-head">
        <p className="display">{verdict.title}</p>
        {score !== null ? (
          <p className="score">
            <span className="score-value">{score.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</span>
            <span className="muted">/10</span>
          </p>
        ) : null}
      </div>
      {product ? (
        <div className="mini-product">
          <Thumb src={product.image} size="sm" />
          <div>
            <div className="title">{text(product.title)}</div>
            <div className="price">{brl(num(product.price))}</div>
          </div>
        </div>
      ) : null}
      <p>{text(props.summary)}</p>
      <div className="pros-cons">
        {strings(props.pros).length > 0 ? (
          <ul className="pros" aria-label="A favor">
            {strings(props.pros).map((item) => (
              <li key={item}>
                <span className="mark">
                  <Icon name="check" size={16} />
                </span>{" "}
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        {strings(props.cons).length > 0 ? (
          <ul className="cons" aria-label="Contra">
            {strings(props.cons).map((item) => (
              <li key={item}>
                <span className="mark">
                  <Icon name="minus" size={16} />
                </span>{" "}
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {product ? (
        <div className="spaced">
          <OpenButton url={text(product.url)} title={text(product.title)} quiet />
        </div>
      ) : null}
    </section>
  );
};

const SOURCES: Record<string, string> = {
  ficha: "Ficha técnica",
  avaliacoes: "Avaliações",
  loja: "Loja",
  preco: "Preço",
  memoria: "O que você me disse",
};

const EvidenceCards: ComponentRenderer<{ title: string; items: unknown }> = ({ props }) => {
  const items = listOf<{ claim: string; detail: string; source: string; stance: "pro" | "contra" | "neutro" }>(
    props.items,
  );
  return (
    <section className="card" aria-label={text(props.title)}>
      <h3>{text(props.title)}</h3>
      <ul className="evidence">
        {items.map((item) => (
          <li key={item.claim} className={item.stance}>
            <span
              className="stance"
              role="img"
              aria-label={item.stance === "pro" ? "A favor" : item.stance === "contra" ? "Contra" : "Neutro"}
            >
              <Icon name={item.stance === "pro" ? "check" : item.stance === "contra" ? "minus" : "memory"} size={16} />
            </span>
            <div>
              <div className="claim">{item.claim}</div>
              <div className="small muted">{item.detail}</div>
              <span className="tag quiet">{SOURCES[item.source] ?? item.source}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

// ---- Reviews ------------------------------------------------------------------

const SENTIMENT_TONE = { positivo: "ink", negativo: "alert", misto: "graphite" } as const;
const SENTIMENT_LABEL = { positivo: "elogio", negativo: "reclamação", misto: "opiniões divididas" } as const;

const ReviewInsights: ComponentRenderer<{
  title: string;
  summary: string;
  themes: unknown;
  rating?: number | null;
  reviews?: number | null;
}> = ({ props }) => {
  const themes = listOf<{
    label: string;
    share: number;
    sentiment: keyof typeof SENTIMENT_TONE;
    quote?: string | null;
  }>(props.themes).sort((a, b) => b.share - a.share);
  const value = num(props.rating);
  return (
    <section className="card" aria-label={text(props.title)}>
      <h3>{text(props.title)}</h3>
      {value !== null ? (
        <p className="small muted">
          Nota {rating(value)}
          {num(props.reviews) ? ` em ${count(num(props.reviews) as number)} avaliações` : ""}
        </p>
      ) : null}
      <p>{text(props.summary)}</p>
      <ul className="themes">
        {themes.map((theme) => (
          <li key={theme.label}>
            <div className="theme-line">
              <span className="theme-label">
                {theme.label}{" "}
                <span className="small muted">· {SENTIMENT_LABEL[theme.sentiment] ?? theme.sentiment}</span>
              </span>
              <span className="small tabular">{Math.round(theme.share)}%</span>
            </div>
            <Bar share={theme.share} tone={SENTIMENT_TONE[theme.sentiment]} />
            {theme.quote ? <blockquote>“{theme.quote}”</blockquote> : null}
          </li>
        ))}
      </ul>
    </section>
  );
};

const SentimentBreakdown: ComponentRenderer<{ rating: number; reviews: number; histogram: unknown }> = ({ props }) => {
  const shares = (Array.isArray(props.histogram) ? props.histogram : [])
    .slice(0, 5)
    .map((v, index) => ({ stars: 5 - index, share: num(v) ?? 0 }));
  const value = num(props.rating) ?? 0;
  return (
    <section className="card" aria-label="Distribuição das notas">
      <div className="sentiment">
        <div className="sentiment-score">
          <span className="display">{rating(value)}</span>
          <span className="small muted">{count(num(props.reviews) ?? 0)} avaliações</span>
        </div>
        <ul className="histogram">
          {shares.map(({ stars, share }) => (
            <li key={stars}>
              <span className="small tabular">{stars}★</span>
              <Bar share={share} tone={stars <= 2 ? "alert" : "ink"} />
              <span className="small tabular muted">{Math.round(share)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

// ---- Price --------------------------------------------------------------------

const PriceComparison: ComponentRenderer<{ product: string; offers: unknown }> = ({ props }) => {
  const offers = listOf<{
    store: string;
    price: number;
    url: string;
    shipping?: number | null;
    seller?: string | null;
    delivery?: string | null;
  }>(props.offers)
    .map((offer) => ({ ...offer, total: (num(offer.price) ?? 0) + (num(offer.shipping) ?? 0) }))
    .sort((a, b) => a.total - b.total);
  const cheapest = offers[0]?.total ?? 0;
  return (
    <section className="card" aria-label={`Preços de ${text(props.product)}`}>
      <h3>Onde sai mais barato</h3>
      <p className="small muted">{text(props.product)}</p>
      <ul className="offers">
        {offers.map((offer, index) => (
          <li key={`${offer.store}|${offer.url}`} className={index === 0 ? "best" : undefined}>
            <div className="offer-main">
              <div>
                <div className="offer-store">
                  {offer.store} {index === 0 ? <span className="tag">Menor total</span> : null}
                </div>
                <div className="small muted">
                  {[
                    offer.seller,
                    num(offer.shipping) === null
                      ? "frete não informado"
                      : num(offer.shipping) === 0
                        ? "frete grátis"
                        : `frete ${brl(num(offer.shipping))}`,
                    offer.delivery,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </div>
              <div className="offer-total">
                <div className="price">{brl(offer.total)}</div>
                {index > 0 ? <div className="small muted tabular">+{brl(offer.total - cheapest)}</div> : null}
              </div>
            </div>
            <div className="offer-action">
              <OpenButton url={text(offer.url)} title={offer.store} label="Ver oferta" quiet />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

const COST_KINDS = { preco: "Preço", frete: "Frete", taxa: "Taxas", desconto: "Desconto", outro: "Outros" } as const;

const TotalCostBreakdown: ComponentRenderer<{ title: string; lines: unknown; note?: string | null }> = ({ props }) => {
  const lines = listOf<{ label: string; amount: number; kind: keyof typeof COST_KINDS }>(props.lines);
  const signed = (line: (typeof lines)[number]) => (line.kind === "desconto" ? -1 : 1) * (num(line.amount) ?? 0);
  const total = lines.reduce((sum, line) => sum + signed(line), 0);
  const charges = lines.filter((line) => line.kind !== "desconto");
  const gross = charges.reduce((sum, line) => sum + (num(line.amount) ?? 0), 0) || 1;
  return (
    <section className="card" aria-label={text(props.title)}>
      <h3>{text(props.title)}</h3>
      <div className="stack" aria-hidden="true">
        {charges.map((line, index) => (
          <span
            key={`${line.kind}|${line.label}`}
            className={`segment s${index % 4}`}
            style={{ width: `${((num(line.amount) ?? 0) / gross) * 100}%` }}
          />
        ))}
      </div>
      <ul className="cost-lines">
        {lines.map((line) => (
          <li key={`${line.kind}|${line.label}`}>
            <span>
              {line.kind !== "desconto" ? (
                <span className={`swatch s${charges.indexOf(line) % 4}`} aria-hidden="true" />
              ) : (
                <span className="swatch none" aria-hidden="true" />
              )}
              {line.label}
            </span>
            <span className="tabular">
              {line.kind === "desconto" ? `− ${brl(num(line.amount))}` : brl(num(line.amount))}
            </span>
          </li>
        ))}
        <li className="total">
          <span>Total</span>
          <span className="tabular">{brl(total)}</span>
        </li>
      </ul>
      {props.note ? <p className="small muted">{props.note}</p> : null}
    </section>
  );
};

// ---- Deciding -----------------------------------------------------------------

const RISK = {
  baixo: { level: 1 as const, label: "Risco baixo" },
  medio: { level: 2 as const, label: "Risco médio" },
  alto: { level: 3 as const, label: "Risco alto" },
};

const DecisionSimulator: ComponentRenderer<{ question: string; scenarios: unknown }> = ({ props }) => {
  const [by, setBy] = useState<"cost" | "risk">("cost");
  const scenarios = listOf<{ label: string; cost: number; risk: keyof typeof RISK; upside: string; downside: string }>(
    props.scenarios,
  );
  const ordered = [...scenarios].sort((a, b) =>
    by === "cost"
      ? (num(a.cost) ?? 0) - (num(b.cost) ?? 0)
      : (RISK[a.risk]?.level ?? 2) - (RISK[b.risk]?.level ?? 2) || (num(a.cost) ?? 0) - (num(b.cost) ?? 0),
  );
  return (
    <section className="card" aria-label={text(props.question)}>
      <p className="question">{text(props.question)}</p>
      {/* Two orders of the same list: pressed buttons in a group, not tabs (there is no tab panel). */}
      <fieldset className="segmented compact">
        <legend className="visually-hidden">Ordenar por</legend>
        {(
          [
            ["cost", "Menor custo"],
            ["risk", "Menor risco"],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" aria-pressed={by === key} onClick={() => setBy(key)}>
            {label}
          </button>
        ))}
      </fieldset>
      <ol className="scenarios">
        {ordered.map((scenario, index) => {
          const risk = RISK[scenario.risk] ?? RISK.medio;
          return (
            <li key={scenario.label} className={index === 0 ? "first" : undefined}>
              <div className="scenario-head">
                <span className="scenario-label">{scenario.label}</span>
                <span className="price">{brl(num(scenario.cost))}</span>
              </div>
              <Meter level={risk.level} label={risk.label} />
              <p className="small">
                <span className="mark">
                  <Icon name="up" size={16} />
                </span>{" "}
                {scenario.upside}
              </p>
              <p className="small muted">
                <span className="mark">
                  <Icon name="down" size={16} />
                </span>{" "}
                {scenario.downside}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

const WAIT = {
  comprar: "Pode comprar agora",
  esperar: "Vale esperar",
  tanto_faz: "Tanto faz esperar",
} as const;
const CONFIDENCE = {
  baixa: { level: 1 as const, label: "Confiança baixa" },
  media: { level: 2 as const, label: "Confiança média" },
  alta: { level: 3 as const, label: "Confiança alta" },
};

const BuyOrWait: ComponentRenderer<{
  verdict: keyof typeof WAIT;
  confidence: keyof typeof CONFIDENCE;
  reasons: unknown;
  signals?: unknown;
}> = ({ props }) => {
  const confidence = CONFIDENCE[props.confidence] ?? CONFIDENCE.baixa;
  const signals = listOf<{ label: string; value: string; good: boolean }>(props.signals);
  return (
    <section className="card" aria-label={WAIT[props.verdict] ?? "Comprar ou esperar"}>
      <p className="display">{WAIT[props.verdict] ?? "Comprar ou esperar"}</p>
      <Meter level={confidence.level} label={confidence.label} />
      <ul className="reasons">
        {strings(props.reasons).map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {signals.length > 0 ? (
        <ul className="signals">
          {signals.map((signal) => (
            <li key={signal.label} className={signal.good ? "good" : "bad"}>
              <span className="mark">
                <Icon name={signal.good ? "up" : "down"} size={16} />
              </span>
              <span>{signal.label}</span>
              <span className="tabular">{signal.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};

// ---- Situations: a solution, not a product -----------------------------------

interface SolutionItemData {
  title: string;
  role: string;
  owned: boolean;
  url?: string | null;
  image?: string | null;
  price?: number | null;
}

/** A path for the situation: the pieces (what to buy and what the person already has) and why it works. */
const SolutionSet: ComponentRenderer<{ situation: string; paths: unknown; note?: string | null }> = ({ props }) => {
  const host = useHost();
  const paths = listOf<{ label: string; items: unknown; why: string; tradeoff?: string | null }>(props.paths);
  return (
    <section className="card" aria-label={text(props.situation)}>
      <p className="situation-line">{text(props.situation)}</p>
      <ol className="paths">
        {paths.map((path, index) => {
          const items = listOf<SolutionItemData>(path.items);
          const total = items.reduce((sum, item) => sum + (item.owned ? 0 : (num(item.price) ?? 0)), 0);
          return (
            <li key={path.label} className={index === 0 ? "path first" : "path"}>
              <div className="scenario-head">
                <span className="scenario-label">{text(path.label)}</span>
                {total > 0 ? <span className="price">{brl(total)}</span> : null}
              </div>
              <ul className="list flat">
                {items.map((item, position) => (
                  <li key={`${item.role}-${item.title}`} className="list-row">
                    <Thumb src={item.owned ? null : item.image} size="sm" />
                    <div className="body">
                      <div className="meta">
                        {item.owned ? <span className="tag quiet">Você já tem</span> : text(item.role)}
                      </div>
                      <div className="value clamp">{text(item.title)}</div>
                      {!item.owned && num(item.price) !== null ? (
                        <div className="meta tabular">{brl(num(item.price))}</div>
                      ) : null}
                    </div>
                    {!item.owned && opens(host, text(item.url)) ? (
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Ver ${text(item.title)} na loja`}
                        onClick={() =>
                          host.act({
                            type: "open",
                            url: text(item.url),
                            title: text(item.title),
                            where: { source: "generated_ui", position },
                          })
                        }
                      >
                        <Icon name="external" />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
              <p className="small">{text(path.why)}</p>
              {path.tradeoff ? <p className="small muted">Em troca: {text(path.tradeoff)}</p> : null}
            </li>
          );
        })}
      </ol>
      {props.note ? <p className="small muted">{text(props.note)}</p> : null}
    </section>
  );
};

/** One question, fixed answers, sent once: the shape both checks share. */
function OneTapQuestion(props: {
  question: string;
  memoryKey: string;
  options: readonly string[];
  lead?: string;
  /** Drawn in place of the question, which still goes with the answer (short, as the turn takes it). */
  children?: ReactNode;
}) {
  const host = useHost();
  const canAnswer = useCanAnswer();
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <section className="card" aria-label={props.question}>
      {props.lead ? <p className="small muted">{props.lead}</p> : null}
      {props.children ?? <p className="question">{props.question}</p>}
      <div className="choices">
        {props.options.map((option) => (
          <button
            key={option}
            type="button"
            className="choice"
            aria-pressed={picked === option}
            disabled={picked !== null || !canAnswer}
            onClick={() => {
              setPicked(option);
              host.act({
                type: "answer",
                answers: [{ memoryKey: props.memoryKey, question: props.question, answer: option }],
                display: option,
              });
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

/** "I have the impression that... Did I get it right?" A hypothesis the person confirms, softens or drops. */
const MemoryCheck: ComponentRenderer<{ memoryKey: string; statement: string }> = ({ props }) => (
  <OneTapQuestion
    lead="Tenho a impressão de que:"
    question={text(props.statement)}
    memoryKey={`${MEMORY_CHECK_PREFIX}${text(props.memoryKey)}`}
    options={MEMORY_CHECK_ANSWERS}
  />
);

/** After the occasion: did it work? The answer closes the situation and teaches the next one. */
const OutcomeCheck: ComponentRenderer<{ situationId: string; question: string }> = ({ props }) => (
  <OneTapQuestion
    question={text(props.question)}
    memoryKey={`${OUTCOME_CHECK_PREFIX}${text(props.situationId)}`}
    options={Object.values(OUTCOME_LABELS)}
  />
);

/**
 * The specific consent for sensitive data (LGPD, art. 11, I). The text is the server's, by purpose,
 * never the model's wording: what the person agrees to is the version the server records.
 */
const SensitiveConsent: ComponentRenderer<{ purpose: string; text: string }> = ({ props }) => {
  const consent = SENSITIVE_CONSENT[props.purpose as keyof typeof SENSITIVE_CONSENT] ?? SENSITIVE_CONSENT.beleza_tom;
  const purpose = props.purpose in SENSITIVE_CONSENT ? props.purpose : "beleza_tom";
  return (
    <OneTapQuestion
      lead="Dado sensível"
      question="Permissão para guardar tom e subtom"
      memoryKey={`${SENSITIVE_CONSENT_PREFIX}${purpose}`}
      options={SENSITIVE_CONSENT_ANSWERS}
    >
      <p>{consent.text}</p>
    </OneTapQuestion>
  );
};

// ---- Coming back --------------------------------------------------------------

const SavedShortlist: ComponentRenderer<{ title: string; items: unknown }> = ({ props }) => {
  const host = useHost();
  const [saved, setSaved] = useState(false);
  const items = listOf<{
    title: string;
    url: string;
    price?: number | null;
    image?: string | null;
    note?: string | null;
  }>(props.items);
  return (
    <section className="card" aria-label={text(props.title)}>
      <h3>{text(props.title)}</h3>
      <div className="list flat">
        {items.map((item, index) => (
          <div key={item.url || item.title} className="list-row">
            <Thumb src={item.image} size="sm" />
            <div className="body">
              <div className="value clamp">{item.title}</div>
              <div className="meta">{[brl(num(item.price)), item.note].filter(Boolean).join(" · ")}</div>
            </div>
            {opens(host, item.url) ? (
              <button
                type="button"
                className="icon-btn"
                aria-label={`Ver ${item.title} na loja`}
                onClick={() =>
                  host.act({
                    type: "open",
                    url: item.url,
                    title: item.title,
                    where: { source: "generated_ui", position: index },
                  })
                }
              >
                <Icon name="external" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {host.interactive ? (
        <button
          type="button"
          className="btn outline block spaced"
          disabled={saved}
          onClick={() => {
            setSaved(true);
            host.act({
              type: "say",
              text: `Guarde esta lista curta para eu retomar depois: ${items.map((i) => i.title).join("; ")}.`,
            });
          }}
        >
          <Icon name="bookmark" size={16} /> {saved ? "Pedi para guardar" : "Guardar esta lista"}
        </button>
      ) : null}
    </section>
  );
};

const DecisionBoard: ComponentRenderer<{ decisionId: string; title: string }> = ({ props }) => {
  const host = useHost();
  return (
    <DecisionBoardLoader
      decisionId={text(props.decisionId)}
      title={text(props.title)}
      actionable={host.actionable}
      access={host.decisions}
      onAct={host.act}
      canOpen={host.canOpen}
    />
  );
};

const WatchDraft: ComponentRenderer<{ watchId: string; title: string }> = ({ props }) => {
  const host = useHost();
  return (
    <WatchDraftLoader
      watchId={text(props.watchId)}
      title={text(props.title)}
      actionable={host.actionable}
      access={host.watches}
      interactive={host.interactive}
      onAct={host.act}
    />
  );
};

const PreferenceMemory: ComponentRenderer<{ title: string; items: unknown }> = ({ props }) => {
  const host = useHost();
  const canAnswer = useCanAnswer();
  const [answered, setAnswered] = useState(false);
  const items = listOf<{ memoryKey: string; label: string; value: string }>(props.items);
  const say = (message: string) => {
    setAnswered(true);
    host.act({ type: "say", text: message });
  };
  return (
    <section className="card" aria-label={text(props.title)}>
      <h3>{text(props.title)}</h3>
      <dl className="remembered">
        {items.map((item) => (
          <div key={item.memoryKey}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
      {canAnswer && !answered ? (
        <div className="row-actions">
          <button type="button" className="btn solid sm" onClick={() => say("Está certo, pode seguir.")}>
            Está certo
          </button>
          <button type="button" className="btn outline sm" onClick={() => say("Algumas coisas mudaram, vou te dizer.")}>
            Algo mudou
          </button>
        </div>
      ) : null}
    </section>
  );
};

const WristFit: ComponentRenderer<{ caseMm: number; wristCm: number; label: string }> = ({ props }) =>
  num(props.caseMm) !== null && num(props.wristCm) !== null ? (
    <Fit caseMm={props.caseMm} wristCm={props.wristCm} label={text(props.label)} />
  ) : null;

/** Parts render inside their parents; on their own they draw nothing. */
const Part: ComponentRenderer<Record<string, unknown>> = () => null;

const View: ComponentRenderer<{ blocks: unknown }> = ({ props, renderNode }) => (
  <div className="genui">{renderNode(props.blocks) as ReactNode}</div>
);

export const RENDERERS: Record<string, ComponentRenderer<never>> = {
  Product,
  ChoiceOption: Part,
  QuizStep: Part,
  MatrixRow: Part,
  CompareRow: Part,
  ScaleRow: Part,
  Tradeoff: Part,
  Evidence: Part,
  ReviewTheme: Part,
  Offer: Part,
  CostLine: Part,
  Scenario: Part,
  Signal: Part,
  ShortlistItem: Part,
  RememberedPreference: Part,
  SolutionItem: Part,
  SolutionPath: Part,
  ProductCarousel,
  SolutionSet,
  MemoryCheck,
  OutcomeCheck,
  SensitiveConsent,
  PreferenceChips,
  VisualChoice,
  ProductQuiz,
  ComparisonMatrix,
  Comparison,
  Callout,
  TradeoffSliders,
  ProductVerdict,
  EvidenceCards,
  ReviewInsights,
  SentimentBreakdown,
  PriceComparison,
  TotalCostBreakdown,
  DecisionSimulator,
  BuyOrWait,
  SavedShortlist,
  DecisionBoard,
  WatchDraft,
  PreferenceMemory,
  WristFit,
  View,
} as Record<string, ComponentRenderer<never>>;
