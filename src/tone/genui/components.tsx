// Gerado de toneorg/extension@cab9f784af9d (packages/genui-react/src/components.tsx). Não edite aqui.
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
} from "@/tone/shared";
import { type ReactNode, useState } from "react";
import { DecisionBoardLoader } from "./DecisionBoard";
import { brl } from "./format";
import { type Answer, dataOf, listOf, safeImage, useHost } from "./host";
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
  if (!host.actionable || !props.url) return null;
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

function ProductCard(props: { product: ProductData; slide?: boolean }) {
  const { product } = props;
  const host = useHost();
  const [rejecting, setRejecting] = useState(false);
  const [rejected, setRejected] = useState<RejectReason | null>(null);
  const reasons = strings(product.reasons);
  const price = num(product.price);
  return (
    <article className={props.slide ? "product slide" : "product"}>
      <Thumb src={product.image} />
      <div className="product-body">
        {product.badge ? <span className="tag">{product.badge}</span> : null}
        <div className="title">{text(product.title)}</div>
        <div className="price">{brl(price)}</div>
        {num(product.rating) !== null ? (
          <div className="small muted">
            Nota {rating(num(product.rating) as number)}
            {num(product.reviews) ? ` · ${count(num(product.reviews) as number)} avaliações` : ""}
          </div>
        ) : null}
        {reasons.length > 0 ? (
          <ul className="reasons">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
        {product.caveat ? <div className="caveat">Atenção: {product.caveat}</div> : null}
      </div>
      {host.actionable ? (
        <div className="actions">
          <OpenButton url={text(product.url)} title={text(product.title)} />
          <PickButton product={product} />
          {rejected ? (
            <span className="small muted">Anotado: {REJECT_REASONS[rejected].toLowerCase()}</span>
          ) : host.interactive ? (
            <button
              type="button"
              className="btn ghost sm"
              aria-expanded={rejecting}
              onClick={() => setRejecting(!rejecting)}
            >
              <Icon name="thumbDown" size={16} /> Não curti
            </button>
          ) : null}
          {rejecting && !rejected ? (
            <fieldset className="field">
              <legend className="visually-hidden">Por quê?</legend>
              <div className="choices">
                {(Object.keys(REJECT_REASONS) as RejectReason[]).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    className="choice"
                    onClick={() => {
                      setRejected(reason);
                      setRejecting(false);
                      host.act({ type: "reject", url: text(product.url), title: text(product.title), reason });
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

/** Takes the product to the composer, to ask about it or see its videos; a second tap lets it go. */
function PickButton(props: { product: ProductData }) {
  const host = useHost();
  const url = text(props.product.url);
  const title = text(props.product.title);
  if (host.picked === undefined || !url || !title) return null;
  const picked = host.picked === url;
  return (
    <button
      type="button"
      className={picked ? "btn solid sm" : "btn outline sm"}
      aria-pressed={picked}
      onClick={() =>
        host.act({
          type: "pick",
          product: picked
            ? null
            : { url, title, price: num(props.product.price), image: safeImage(props.product.image, host.storeHosts) },
        })
      }
    >
      <Icon name={picked ? "check" : "plus"} size={16} /> {picked ? "Selecionado" : "Selecionar"}
    </button>
  );
}

/** A product on its own, when the model places one outside a list. */
const Product: ComponentRenderer<ProductData> = ({ props }) => <ProductCard product={props} />;

const ProductCarousel: ComponentRenderer<{ title: string; products: unknown }> = ({ props }) => {
  const products = listOf<ProductData>(props.products);
  return (
    <section className="card" aria-label={text(props.title)}>
      <h3>{text(props.title)}</h3>
      {products.length > 1 ? (
        <div className="carousel">
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
      {products.length > 1 ? <p className="small muted carousel-hint">Arraste para ver os {products.length}.</p> : null}
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
      <div className="segmented compact" role="tablist" aria-label="Ordenar por">
        {(
          [
            ["cost", "Menor custo"],
            ["risk", "Menor risco"],
          ] as const
        ).map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={by === key} onClick={() => setBy(key)}>
            {label}
          </button>
        ))}
      </div>
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
                    {host.actionable && !item.owned && item.url ? (
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
function OneTapQuestion(props: { question: string; memoryKey: string; options: readonly string[]; lead?: string }) {
  const host = useHost();
  const canAnswer = useCanAnswer();
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <section className="card" aria-label={props.question}>
      {props.lead ? <p className="small muted">{props.lead}</p> : null}
      <p className="question">{props.question}</p>
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
            {host.actionable && item.url ? (
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
  PreferenceChips,
  VisualChoice,
  ProductQuiz,
  ComparisonMatrix,
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
