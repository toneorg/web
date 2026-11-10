// Gerado de toneorg/extension@62bd2817cbca (packages/shared/src/watch.ts). Não edite aqui.
// T09: a watch (acompanhamento) is a confirmed rule, not a free request.
// A request becomes a draft with what to look for, where, how often and when to
// notify; `reviewWatch` lists what still needs the person and which sources
// can run with the browser closed. Nothing runs before the person confirms.
import * as z from "zod";
import { StoreScope } from "./research";

const Text = (max: number) => z.string().trim().min(1).max(max);

/**
 * Stores the server index (T04) can observe without the person's browser, and the only
 * stores whose offers it keeps, links to and shows photos of (29/10/2026: beauty,
 * pharmacies and department stores joined the first five; 10/11/2026: the electronics
 * stores the index returned for iPhone and tone discarded). Apple only on its Brazilian
 * store (`/br/`, see `STORE_PATHS` in the server).
 */
export const INDEX_STORES = [
  "amazon.com.br",
  "mercadolivre.com.br",
  "magazineluiza.com.br",
  "sephora.com.br",
  "lojasrenner.com.br",
  "epocacosmeticos.com.br",
  "belezanaweb.com.br",
  "boticario.com.br",
  "natura.com.br",
  "drogasil.com.br",
  "drogaraia.com.br",
  "paguemenos.com.br",
  "drogariasaopaulo.com.br",
  "riachuelo.com.br",
  "cea.com.br",
  "americanas.com.br",
  "casasbahia.com.br",
  "kabum.com.br",
  "iplace.com.br",
  "carrefour.com.br",
  "fastshop.com.br",
  "pontofrio.com.br",
  "extra.com.br",
  "apple.com",
] as const;

/**
 * How close to the price the person has in mind counts as "near" (10/11/2026: "olha tanto pra cima
 * quanto pra baixo"): up to 5% above it, or anything below.
 */
export const NEAR_PRICE_TOLERANCE = 0.05;
/**
 * What counts as a significant drop when the person only wants to follow the price (10/11/2026:
 * "não deixa o usuário escolher essa porcentagem, pq ele não vai saber"): 10% below the typical
 * price of the product's history, or below the first price observed while there is no history.
 */
export const SIGNIFICANT_DROP = 0.1;

export const WatchCondition = z.discriminatedUnion("kind", [
  /** Not chosen yet: a draft in this state cannot be confirmed when the goal asks for a deal. */
  z.object({ kind: z.literal("none") }),
  /** Follows the price like a price tracker; notifies a significant drop against the history. */
  z.object({ kind: z.literal("price_drop") }),
  /** The price the person has in mind: notifies when the price gets near it, from above or below. */
  z.object({
    kind: z.literal("near_price"),
    amount: z.number().positive(),
    currency: z.string().regex(/^[A-Z]{3}$/),
  }),
  /** Legacy (before 10/11/2026): at or below a price. Confirmed watches keep it. */
  z.object({
    kind: z.literal("target_price"),
    amount: z.number().positive(),
    currency: z.string().regex(/^[A-Z]{3}$/),
  }),
  /** Legacy (before 10/11/2026): a drop the person chose against the first price observed. */
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

/**
 * A question the agent asks before the plan is final, with short options the person taps (10/11/2026:
 * "iPhone 18" should first ask whether it is the 18, the 18 Pro or both, and which variant).
 */
export const WatchQuestion = z.object({
  id: Text(40),
  question: Text(160),
  options: z.array(Text(60)).min(2).max(6),
  /** More than one option can be chosen ("os dois"). */
  multiple: z.boolean().default(false),
});
export type WatchQuestion = z.infer<typeof WatchQuestion>;

export const WatchRule = z
  .object({
    goal: Text(200),
    kind: z.enum(["discovery", "monitoring"]),
    query: Text(120),
    brands: z.array(Text(60)).max(5),
    categories: z.array(Text(60)).max(5),
    variants: z.array(Text(80)).max(5),
    products: z.array(WatchProduct).max(5),
    storeScope: StoreScope,
    /** Persisted direct reads, independent from the person's scope. Missing is a legacy rule. */
    remoteSelection: z
      .array(Text(200))
      .optional()
      .describe(
        "Domínios escolhidos do catálogo para leitura direta; até três na pesquisa livre. [] mantém somente o índice. O escopo explícito da pessoa prevalece.",
      ),
    condition: WatchCondition,
    /** Open questions of the draft; a rule with any of them cannot be confirmed. */
    questions: z
      .array(WatchQuestion)
      .max(3)
      .optional()
      .describe(
        "Perguntas que mudam o plano (modelo, versão, capacidade, cor), com opções curtas para a pessoa tocar. Quando ela responder, ajuste products e variants e mande [].",
      ),
    /** Daily is the only frequency of the beta; "check now" is separate and needs balance. */
    frequency: z.literal("daily").default("daily"),
    notify: z.object({
      /** The web center always shows results; e-mail is the person's choice. */
      email: z.boolean(),
      /** Also a summary of news, besides the alert when the condition is met. */
      digest: z.boolean(),
    }),
  })
  .refine((rule) => rule.storeScope.kind === "explicit" || (rule.remoteSelection?.length ?? 0) <= 3, {
    path: ["remoteSelection"],
    message: "No máximo três lojas na seleção automática.",
  });
export type WatchRule = z.infer<typeof WatchRule>;

export const WatchStatus = z.enum(["draft", "active", "paused", "deleted"]);
export type WatchStatus = z.infer<typeof WatchStatus>;

export const WatchClarification = z.object({
  field: z.enum(["condition", "products", "storeScope", "query", "choice"]),
  question: z.string(),
  /** A "choice" names the question it answers and the options to tap. */
  id: z.string().optional(),
  options: z.array(z.string()).optional(),
  multiple: z.boolean().optional(),
});
export const WatchSource = z.object({
  id: z.enum(["google_shopping_index", "remote_browser", "local_extension"]),
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
          /** The product photo from the index, when it listed one (readings before 03/11/2026 have none). */
          imageUrl: z.string().nullable().optional(),
        }),
      )
      .default([]),
  }),
});
export type WatchResult = z.infer<typeof WatchResult>;

export const WatchEdit = z.object({ version: z.number().int().positive(), draft: WatchRule });
export const WatchConfirm = z.object({ version: z.number().int().positive() });

const money = (amount: number, currency: string) =>
  currency === "BRL"
    ? `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
    : `${amount.toLocaleString("pt-BR")} ${currency}`;

const DEAL = /promo|desconto|oferta|barat|baixar|queda|liquida|black friday/i;
const isIndexStore = (store: string) => INDEX_STORES.some((domain) => store === domain || store.endsWith(`.${domain}`));

/** What still needs the person, and what each source can really do for this rule. */
/**
 * `remoteStores`: the stores this server reads by a remote browser (Pomerado), which also run in
 * the daily check, on the store's own search. Without them, a store outside the index needs the
 * extension and the open browser.
 */
export function reviewWatch(rule: WatchRule, remoteStores: readonly string[] = []): WatchReview {
  const clarifications: z.infer<typeof WatchClarification>[] = (rule.questions ?? []).map((q) => ({
    field: "choice",
    id: q.id,
    question: q.question,
    options: q.options,
    multiple: q.multiple,
  }));
  const notes: string[] = [];
  if (rule.condition.kind === "none" && (DEAL.test(rule.goal) || rule.kind === "monitoring"))
    clarifications.push({
      field: "condition",
      question: "Quer só acompanhar a variação do preço, ou tem um valor em mente (por exemplo, perto de R$ 200)?",
    });
  if (rule.kind === "monitoring" && rule.products.length === 0 && rule.query.length < 3)
    clarifications.push({
      field: "products",
      question: "Qual produto e qual variante (cor, tamanho, volume) devo acompanhar?",
    });
  if (rule.kind === "discovery" && !rule.brands.length && !rule.categories.length && rule.query.length < 4)
    clarifications.push({ field: "query", question: "Que tipo de produto devo procurar?" });
  const stores = rule.storeScope.kind === "explicit" ? rule.storeScope.stores : [...INDEX_STORES];
  const covered = stores.filter(isIndexStore);
  const selected = rule.storeScope.kind === "explicit" ? stores : (rule.remoteSelection ?? []);
  const remote = selected.filter((store) => remoteStores.includes(store));
  const unavailable = selected.filter((store) => !remoteStores.includes(store));
  if (unavailable.length)
    notes.push(
      `Leitura direta indisponível em ${unavailable.join(", ")}; a cobertura fica parcial, sem substituir as lojas escolhidas.`,
    );
  const uncovered = stores.filter((store) => !isIndexStore(store) && !remote.includes(store));
  if (rule.storeScope.kind === "explicit" && covered.length === 0 && remote.length === 0)
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
  if (rule.condition.kind === "price_drop")
    notes.push(
      `Comparo cada preço com o histórico deste produto e aviso quando ele fica ${SIGNIFICANT_DROP * 100}% ou mais abaixo do normal. Sem histórico ainda, a referência é o primeiro preço que eu observar.`,
    );
  if (rule.condition.kind === "near_price")
    notes.push(
      `Perto quer dizer até ${NEAR_PRICE_TOLERANCE * 100}% acima de ${money(rule.condition.amount, rule.condition.currency)}; abaixo dele também conta.`,
    );
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
      ...(remote.length
        ? [
            {
              id: "remote_browser" as const,
              label: "Navegador remoto na loja",
              autonomous: true,
              stores: remote,
              note: "A busca do próprio site da loja, lida por um navegador remoto sem login, uma vez por dia; o preço é o da busca, sem frete.",
            },
          ]
        : []),
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

/** The rule in a few lines the person can check: what, where, how often, when it notifies. */
const productsOf = (rule: WatchRule) =>
  rule.products.map((p) => `${p.title}${p.variantLabel ? ` (${p.variantLabel})` : ""}`).join("; ");

/**
 * What the watch is about. A monitoring draft without products follows its search: "iPhone 18"
 * showed "Produto ainda não escolhido" on 10/11/2026 although the person had named it.
 */
const watchedOf = (rule: WatchRule) =>
  productsOf(rule) || (rule.kind === "monitoring" && rule.query.trim().length >= 3 ? rule.query.trim() : "");

/** The condition in one line, as the card and the agent say it. */
export function conditionText(condition: WatchCondition): string {
  switch (condition.kind) {
    case "price_drop":
      return "Acompanhar a variação e avisar quando o preço cair bem abaixo do normal";
    case "near_price":
      return `Quando o preço estiver perto de ${money(condition.amount, condition.currency)}`;
    case "target_price":
      return `Preço em até ${money(condition.amount, condition.currency)}`;
    case "drop_percent":
      return `Queda de ${condition.percent}% ou mais desde a primeira leitura`;
    case "new_match":
      return "Quando aparecer uma opção nova";
    default:
      return "Ainda não definido";
  }
}

/**
 * A monitoring draft that names what to follow only in its search gets it as its product, so the
 * runner has something to match (a monitoring rule without products matches nothing).
 */
export function withProductFromQuery(rule: WatchRule): WatchRule {
  if (rule.kind !== "monitoring" || rule.products.length || rule.query.trim().length < 3) return rule;
  return {
    ...rule,
    products: [
      { title: rule.query.trim().slice(0, 160), variantLabel: rule.variants[0] ?? null, url: null, offerId: null },
    ],
  };
}

/** A short name for a watch, never empty: the product, the search, or the person's goal. */
export function watchTitle(rule: WatchRule): string {
  const title = (watchedOf(rule) || rule.query || rule.goal || "Novo acompanhamento").slice(0, 120);
  return title.charAt(0).toLocaleUpperCase("pt-BR") + title.slice(1);
}

/** The plan as labelled lines, for a card to show as label and value. */
export function watchFacts(rule: WatchRule): [label: string, value: string][] {
  const what =
    rule.kind === "monitoring"
      ? watchedOf(rule) || "Produto ainda não escolhido"
      : [
          rule.query,
          rule.brands.length ? `marcas ${rule.brands.join(", ")}` : "",
          rule.categories.length ? `em ${rule.categories.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(", ") || "Ainda não definido";
  const when = conditionText(rule.condition);
  return [
    [rule.kind === "monitoring" ? "Acompanhar" : "Procurar", what],
    ...(rule.variants.length ? [["Variantes", rule.variants.join(", ")] as [string, string]] : []),
    ["Onde", rule.storeScope.kind === "explicit" ? rule.storeScope.stores.join(", ") : "Lojas que o índice observa"],
    ["Quando avisar", when],
    ["Frequência", "Uma vez por dia"],
    [
      "Avisos",
      `Aqui${rule.notify.email ? " e por e-mail" : ""}${rule.notify.digest ? ", com resumo de novidades" : ""}`,
    ],
  ];
}

export function describeWatch(rule: WatchRule): string[] {
  const what =
    rule.kind === "monitoring"
      ? `Acompanhar: ${watchedOf(rule) || "produto ainda não escolhido"}`
      : `Procurar novidades: ${rule.query}${rule.brands.length ? `, marcas ${rule.brands.join(", ")}` : ""}${rule.categories.length ? `, em ${rule.categories.join(", ")}` : ""}`;
  const where =
    rule.storeScope.kind === "explicit"
      ? `Onde: ${rule.storeScope.stores.join(", ")}`
      : "Onde: lojas que o índice observa";
  const condition =
    rule.condition.kind === "price_drop"
      ? `Acompanhar a variação do preço e avisar numa queda de ${SIGNIFICANT_DROP * 100}% ou mais em relação ao preço normal do histórico`
      : rule.condition.kind === "near_price"
        ? `Avisar quando o preço observado estiver perto de ${money(rule.condition.amount, rule.condition.currency)} (até ${NEAR_PRICE_TOLERANCE * 100}% acima, ou abaixo)`
        : rule.condition.kind === "target_price"
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

/**
 * The price chart of a panel: the lowest price per day, from the panel's own checks and from the
 * readings tone kept of the same offers (price_observations). Days without a reading are absent.
 */
export const WatchPricePoint = z.object({
  /** YYYY-MM-DD, in UTC. */
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  store: z.string().nullable(),
});
export type WatchPricePoint = z.infer<typeof WatchPricePoint>;
export const WatchPrices = z.object({
  points: z.array(WatchPricePoint),
  /** The panel's price in mind (near or at most) in BRL, drawn as a line; null for other conditions. */
  target: z.number().positive().nullable(),
});
export type WatchPrices = z.infer<typeof WatchPrices>;
