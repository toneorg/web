"use client";
// T06: the agent's OpenUI Lang blocks, drawn on the web. The tree comes from
// the same parser the server checks with; the drawings are the web's own and
// the actions are the web's: open a store page in a new tab when the person
// clicks, answer a question, or change a decision or a watch as the person.
// Components that only make sense in the extension stay readable as text.
import { type ReactNode, useState } from "react";
import { parseProgram } from "@/tone/shared/genui";
import { type ClickWhere, isAllowedImage, isCheckoutUrl } from "@/tone/shared";
import { trackClick } from "./api";
import { DecisionBoard } from "./DecisionBoard";
import { WatchDraft } from "./WatchDraft";

/** Stores whose product photos and pages the web may show or link. */
export const STORE_HOSTS = [
  "amazon.com.br",
  "mercadolivre.com.br",
  "mercadolibre.com",
  "magazineluiza.com.br",
  "sephora.com.br",
  "lojasrenner.com.br",
];

export interface ProgramHost {
  sessionId: string;
  /** Questions answer only on the latest answer, with nothing running. */
  interactive: boolean;
  answer: (memoryKey: string, question: string, answer: string) => void;
  say: (text: string) => void;
}

type Node = { type?: string; typeName?: string; props?: Record<string, unknown> };
const isNode = (value: unknown): value is Node =>
  Boolean(value && typeof value === "object" && typeof (value as Node).typeName === "string");
const text = (value: unknown) => (typeof value === "string" ? value : "");
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const list = (value: unknown) => (Array.isArray(value) ? value.filter(isNode) : []);
const brl = (value: number | null) =>
  value === null ? null : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * A store link only for an HTTPS store page that does not pay. `store` is a store the server itself
 * read and checked the offer against (T16, a remote browser); what the model writes gets only the fixed list.
 */
export function storeLink(url: string, store?: string): string | null {
  if (!URL.canParse(url)) return null;
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || isCheckoutUrl(url)) return null;
  const hosts = store ? [...STORE_HOSTS, store] : STORE_HOSTS;
  return hosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)) ? url : null;
}

/** What a click on the link records: the conversation, the product and where it was on the screen. */
export interface ClickContext {
  sessionId: string | null;
  title: string;
  where: ClickWhere;
}

export function StoreLink(props: { url: string; label?: string; click?: ClickContext; store?: string }) {
  const href = storeLink(props.url, props.store);
  if (!href) return null;
  const { click } = props;
  // A middle click also opens the store, so it counts too; a right click does not.
  const record = click ? () => trackClick(click.sessionId, href, click.title, click.where) : undefined;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={record}
      onAuxClick={(event) => {
        if (event.button === 1) record?.();
      }}
      className="inline-flex min-h-11 items-center rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      {props.label ?? "Ver na loja"}
      <span className="sr-only"> (abre em outra aba)</span>
    </a>
  );
}

function Card(props: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-raised" aria-label={props.title}>
      {props.title ? <h3 className="text-subheading text-ink">{props.title}</h3> : null}
      {props.children}
    </section>
  );
}

function ProductRow(props: { node: Node; sessionId: string; position: number }) {
  const p = props.node.props ?? {};
  const image = isAllowedImage(text(p.image), STORE_HOSTS) ? text(p.image) : null;
  const reasons = Array.isArray(p.reasons) ? (p.reasons as unknown[]).map(text).filter(Boolean) : [];
  return (
    <li className="flex gap-3">
      {image ? (
        // Store photos come from allowed store CDNs and are shown as they are, without the optimizer proxy.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-16 rounded-thumb bg-sunken object-contain" />
      ) : (
        <div className="size-16 rounded-thumb bg-sunken" aria-hidden="true" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-small font-medium text-ink">{text(p.title)}</span>
        <span className="text-caption text-graphite">
          {[brl(num(p.price)), text(p.badge)].filter(Boolean).join(" · ") || "Preço não informado"}
        </span>
        {reasons.length ? <span className="text-caption text-graphite">{reasons.join(" · ")}</span> : null}
        {text(p.caveat) ? <span className="text-caption text-graphite">Ponto fraco: {text(p.caveat)}</span> : null}
        <StoreLink
          url={text(p.url)}
          click={{
            sessionId: props.sessionId,
            title: text(p.title),
            where: { source: "generated_ui", position: props.position },
          }}
        />
      </div>
    </li>
  );
}

function Choices(props: { node: Node; host: ProgramHost }) {
  const p = props.node.props ?? {};
  const [chosen, setChosen] = useState<string | null>(null);
  const options = Array.isArray(p.options)
    ? (p.options as unknown[]).map((option) => (isNode(option) ? text(option.props?.label) : text(option))).filter(Boolean)
    : [];
  const enabled = props.host.interactive && !chosen;
  return (
    <Card title={text(p.question)}>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={!enabled}
            aria-pressed={chosen === option}
            onClick={() => {
              setChosen(option);
              props.host.answer(text(p.memoryKey), text(p.question), option);
            }}
            className="min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised disabled:opacity-50 aria-pressed:bg-ink aria-pressed:text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {option}
          </button>
        ))}
      </div>
    </Card>
  );
}

/** Anything without a web drawing: its words, in order, so an old answer stays readable. */
function Readable(props: { node: Node }) {
  const words: string[] = [];
  const visit = (value: unknown) => {
    if (typeof value === "string" && value && !/^https?:/.test(value)) words.push(value);
    else if (typeof value === "number") words.push(value.toLocaleString("pt-BR"));
    else if (Array.isArray(value)) value.forEach(visit);
    else if (isNode(value)) Object.values(value.props ?? {}).forEach(visit);
  };
  visit(props.node);
  return (
    <Card>
      <p className="text-small text-ink">{words.join(" · ")}</p>
      <p className="text-caption text-graphite">Este quadro aparece completo na extensão.</p>
    </Card>
  );
}

function Block(props: { node: Node; host: ProgramHost }) {
  const { node, host } = props;
  const p = node.props ?? {};
  switch (node.typeName) {
    case "ProductCarousel":
      return (
        <Card title={text(p.title)}>
          <ul className="flex flex-col gap-4">
            {list(p.products).map((product, index) => (
              <ProductRow key={index} node={product} sessionId={host.sessionId} position={index} />
            ))}
          </ul>
        </Card>
      );
    case "SavedShortlist":
      return (
        <Card title={text(p.title)}>
          <ul className="flex flex-col gap-4">
            {list(p.items).map((item, index) => (
              <ProductRow key={index} node={item} sessionId={host.sessionId} position={index} />
            ))}
          </ul>
        </Card>
      );
    case "ComparisonMatrix": {
      const products = list(p.products);
      const rows = list(p.rows);
      return (
        <Card title="Comparação">
          <div className="overflow-x-auto">
            <table className="w-full text-small text-ink">
              <thead>
                <tr>
                  <th className="text-left font-medium text-graphite">Atributo</th>
                  {products.map((product, index) => (
                    <th key={index} className="text-left font-medium">
                      {text(product.props?.title)}
                      {num(p.recommended) === index ? " (recomendado)" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className="border-t border-rule">
                    <th scope="row" className="py-2 text-left font-normal text-graphite">
                      {text(row.props?.label)}
                    </th>
                    {(Array.isArray(row.props?.values) ? (row.props?.values as unknown[]) : []).map((value, cell) => (
                      <td key={cell} className="py-2">
                        {text(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-small text-ink">{text(p.verdict)}</p>
        </Card>
      );
    }
    case "ProductVerdict": {
      const product = isNode(p.product) ? p.product : null;
      return (
        <Card title={product ? text(product.props?.title) : "Veredito"}>
          <p className="text-small text-ink">{text(p.summary)}</p>
          {product ? (
            <StoreLink
              url={text(product.props?.url)}
              click={{
                sessionId: host.sessionId,
                title: text(product.props?.title),
                where: { source: "generated_ui" },
              }}
            />
          ) : null}
        </Card>
      );
    }
    case "PreferenceChips":
    case "VisualChoice":
      return <Choices node={node} host={host} />;
    case "DecisionBoard":
      return <DecisionBoard sessionId={host.sessionId} decisionId={text(p.decisionId)} title={text(p.title)} say={host.say} />;
    case "WatchDraft":
      return <WatchDraft watchId={text(p.watchId)} title={text(p.title)} />;
    default:
      return <Readable node={node} />;
  }
}

export function Program(props: { code: string; streaming: boolean; host: ProgramHost }) {
  if (props.streaming) return <p className="text-small text-graphite">Montando a resposta…</p>;
  const parsed = parseProgram(props.code);
  const root = parsed.root as Node | null;
  if (!root || !isNode(root)) return <p className="text-small text-graphite">Não consegui desenhar esta parte da resposta.</p>;
  const blocks = root.typeName === "View" ? list(root.props?.blocks) : [root];
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => (
        <Block key={index} node={block} host={props.host} />
      ))}
    </div>
  );
}
