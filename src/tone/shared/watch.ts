// Gerado de toneorg/extension@2af3b9cf8379 (packages/shared/src/watch.ts). Não edite aqui.
// T09: a watch (acompanhamento) is a confirmed rule, not a free request.
// A request becomes a draft with what to look for, where, how often and when to
// notify; `reviewWatch` lists what still needs the person and which sources
// can run with the browser closed. Nothing runs before the person confirms.
import * as z from "zod";
import { StoreScope } from "./research";

const Text = (max: number) => z.string().trim().min(1).max(max);

/** Stores the server index (T04) can observe without the person's browser. */
export const INDEX_STORES = [
  "amazon.com.br",
  "mercadolivre.com.br",
  "magazineluiza.com.br",
  "sephora.com.br",
  "lojasrenner.com.br",
] as const;

export const WatchCondition = z.discriminatedUnion("kind", [
  /** Not chosen yet: a draft in this state cannot be confirmed when the goal asks for a deal. */
  z.object({ kind: z.literal("none") }),
  z.object({
    kind: z.literal("target_price"),
    amount: z.number().positive(),
    currency: z.string().regex(/^[A-Z]{3}$/),
  }),
  /** A drop against the first price observed by the watch, never against an invented history. */
  z.object({ kind: z.literal("drop_percent"), percent: z.number().min(1).max(90) }),
  /** Discovery: tell when an alternative that fits shows up. */
  z.object({ kind: z.literal("new_match") }),
]);
export type WatchCondition = z.infer<typeof WatchCondition>;

export const WatchProduct = z.object({
  title: Text(160),
  variantLabel: Text(80).nullable(),
  url: z.url().nullable(),
  /** The research offer it came from, when there is one. */
  offerId: z.string().nullable(),
});

export const WatchRule = z.object({
  goal: Text(200),
  kind: z.enum(["discovery", "monitoring"]),
  query: Text(120),
  brands: z.array(Text(60)).max(5),
  categories: z.array(Text(60)).max(5),
  variants: z.array(Text(80)).max(5),
  products: z.array(WatchProduct).max(5),
  storeScope: StoreScope,
  condition: WatchCondition,
  /** Daily is the only frequency of the beta; "check now" is separate and needs balance. */
  frequency: z.literal("daily").default("daily"),
  notify: z.object({
    /** The web center always shows results; e-mail is the person's choice. */
    email: z.boolean(),
    /** Also a summary of news, besides the alert when the condition is met. */
    digest: z.boolean(),
  }),
});
export type WatchRule = z.infer<typeof WatchRule>;

export const WatchStatus = z.enum(["draft", "active", "paused", "deleted"]);
export type WatchStatus = z.infer<typeof WatchStatus>;

export const WatchClarification = z.object({
  field: z.enum(["condition", "products", "storeScope", "query"]),
  question: z.string(),
});
export const WatchSource = z.object({
  id: z.enum(["google_shopping_index", "local_extension"]),
  label: z.string(),
  autonomous: z.boolean(),
  stores: z.array(z.string()),
  note: z.string(),
});
export const WatchReview = z.object({
  canConfirm: z.boolean(),
  clarifications: z.array(WatchClarification),
  sources: z.array(WatchSource),
  notes: z.array(z.string()),
});
export type WatchReview = z.infer<typeof WatchReview>;

export const Watch = z.object({
  id: z.string(),
  sessionId: z.string().nullable(),
  status: WatchStatus,
  /** Grows with every edit of the draft; a confirmation names the version it confirms. */
  version: z.number().int().positive(),
  draft: WatchRule,
  /** The rule that runs; null until the first confirmation. */
  confirmed: WatchRule.nullable(),
  confirmedVersion: z.number().int().positive().nullable(),
  review: WatchReview,
  createdAt: z.string(),
  updatedAt: z.string(),
  confirmedAt: z.string().nullable(),
  /** T10/T11 fields, filled by the runner. */
  lastCheckAt: z.string().nullable().optional(),
  nextCheckAt: z.string().nullable().optional(),
  mutedAt: z.string().nullable().optional(),
  /** How the last run ended: ok, partial, source_failed or budget_exceeded (T10). */
  lastState: z.string().nullable().optional(),
});
export type Watch = z.infer<typeof Watch>;

/** T10: one run of a watch as the person sees it: what was observed and whether the condition was met. */
export const WatchResult = z.object({
  id: z.string(),
  version: z.number().int().positive(),
  outcome: z.string(),
  conditionMet: z.boolean(),
  observedAt: z.string(),
  summary: z.looseObject({
    message: z.string(),
    matches: z
      .array(
        z.looseObject({
          title: z.string(),
          store: z.string(),
          url: z.string(),
          priceText: z.string(),
          amount: z.number().nullable(),
        }),
      )
      .default([]),
  }),
});
export type WatchResult = z.infer<typeof WatchResult>;

export const WatchEdit = z.object({ version: z.number().int().positive(), draft: WatchRule });
export const WatchConfirm = z.object({ version: z.number().int().positive() });

const DEAL = /promo|desconto|oferta|barat|baixar|queda|liquida|black friday/i;
const isIndexStore = (store: string) => INDEX_STORES.some((domain) => store === domain || store.endsWith(`.${domain}`));

/** What still needs the person, and what each source can really do for this rule. */
export function reviewWatch(rule: WatchRule): WatchReview {
  const clarifications: z.infer<typeof WatchClarification>[] = [];
  const notes: string[] = [];
  if (rule.condition.kind === "none" && (DEAL.test(rule.goal) || rule.kind === "monitoring"))
    clarifications.push({
      field: "condition",
      question:
        "O que conta como promoção para você? Diga um preço máximo (por exemplo, até R$ 200) ou uma queda em relação ao primeiro preço que eu observar (por exemplo, 15%).",
    });
  if (rule.kind === "monitoring" && rule.products.length === 0)
    clarifications.push({
      field: "products",
      question: "Qual produto e qual variante (cor, tamanho, volume) devo acompanhar?",
    });
  if (rule.kind === "discovery" && !rule.brands.length && !rule.categories.length && rule.query.length < 4)
    clarifications.push({ field: "query", question: "Que tipo de produto devo procurar?" });
  const stores = rule.storeScope.kind === "explicit" ? rule.storeScope.stores : [...INDEX_STORES];
  const covered = stores.filter(isIndexStore);
  const uncovered = stores.filter((store) => !isIndexStore(store));
  if (rule.storeScope.kind === "explicit" && covered.length === 0)
    clarifications.push({
      field: "storeScope",
      question: `${uncovered.join(", ")} só pode ser lida pela extensão com o navegador aberto. Para acompanhar todo dia sem o navegador, escolha também uma loja que eu consigo observar: ${INDEX_STORES.join(", ")}.`,
    });
  else if (uncovered.length)
    notes.push(
      `${uncovered.join(", ")} não entra na verificação diária: só pode ser lida pela extensão, com o navegador aberto.`,
    );
  if (rule.storeScope.kind === "unrestricted")
    notes.push(
      `Pesquisa livre cobre as lojas que o índice observa: ${INDEX_STORES.join(", ")}. Não é a internet toda.`,
    );
  if (rule.condition.kind === "drop_percent")
    notes.push("A queda é medida contra o primeiro preço que eu observar; não existe histórico anterior.");
  return {
    canConfirm: clarifications.length === 0,
    clarifications,
    sources: [
      {
        id: "google_shopping_index",
        label: "Google Shopping (índice)",
        autonomous: true,
        stores: covered,
        note: "Preço observado no índice do Google Shopping, uma vez por dia; não confirma o preço final, o frete nem o estoque na loja.",
      },
      {
        id: "local_extension",
        label: "Leitura na loja pela extensão",
        autonomous: false,
        stores: uncovered,
        note: "Só quando você está com o Chrome e a extensão abertos; não roda na verificação diária.",
      },
    ],
    notes,
  };
}

const money = (amount: number, currency: string) =>
  currency === "BRL"
    ? `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    : `${amount.toLocaleString("pt-BR")} ${currency}`;

/** The rule in a few lines the person can check: what, where, how often, when it notifies. */
export function describeWatch(rule: WatchRule): string[] {
  const what =
    rule.kind === "monitoring"
      ? `Acompanhar: ${rule.products.map((p) => `${p.title}${p.variantLabel ? ` (${p.variantLabel})` : ""}`).join("; ")}`
      : `Procurar novidades: ${rule.query}${rule.brands.length ? `, marcas ${rule.brands.join(", ")}` : ""}${rule.categories.length ? `, em ${rule.categories.join(", ")}` : ""}`;
  const where =
    rule.storeScope.kind === "explicit"
      ? `Onde: ${rule.storeScope.stores.join(", ")}`
      : "Onde: lojas que o índice observa";
  const condition =
    rule.condition.kind === "target_price"
      ? `Avisar quando o preço observado ficar em até ${money(rule.condition.amount, rule.condition.currency)}`
      : rule.condition.kind === "drop_percent"
        ? `Avisar quando o preço cair ${rule.condition.percent}% ou mais desde a primeira observação`
        : rule.condition.kind === "new_match"
          ? "Avisar quando aparecer uma alternativa nova que atenda ao pedido"
          : "Condição de aviso ainda não definida";
  const channels = `Avisos: central na web${rule.notify.email ? " e e-mail" : ""}${rule.notify.digest ? ", com resumo de novidades" : ""}`;
  return [
    what,
    ...(rule.variants.length ? [`Variantes: ${rule.variants.join(", ")}`] : []),
    where,
    "Frequência: uma vez por dia, e você pode pedir uma verificação na hora se houver saldo",
    condition,
    channels,
  ];
}
