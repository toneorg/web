// Gerado de toneorg/extension@e74f243ee87c (packages/shared/src/genui.ts). Não edite aqui.
// The components the agent draws in the panel, in OpenUI Lang (openui.com).
// One definition, two consumers: the server turns it into the instructions the
// model reads and checks what the model wrote; the panel gives each component
// its drawing (apps/extension/src/panel/genui). Props are data only: what a
// button does is decided by the panel, never by the model.
//
// Arguments are positional in the key order of each `props` object, so the
// required ones come first. Text the person reads is Portuguese.
import { createLibrary, createParser, defineComponent } from "@openuidev/lang-core";
import * as z from "zod";

const text = (max: number) => z.string().max(max);
const optional = <T extends z.ZodType>(schema: T) => schema.nullish();

const define = <T extends z.ZodObject>(name: string, description: string, props: T) =>
  defineComponent({ name, description, props, component: null });

// ---- Parts used inside other components ------------------------------------

export const Product = define(
  "Product",
  "Um produto real lido na página da loja. url e image exatamente como vieram no retrato da página; price null quando a página não mostra preço. reasons: por que serve para a pessoa, ligado ao perfil dela. caveat: o ponto fraco, se houver. badge: rótulo curto como 'Melhor escolha' ou 'Mais barato'.",
  z.object({
    title: text(160),
    url: text(500),
    // A product without a price on the page (out of stock, "see options") still shows: null is allowed.
    price: optional(z.number()),
    image: optional(text(500)),
    rating: optional(z.number().min(0).max(5)),
    reviews: optional(z.number().int().min(0)),
    reasons: optional(z.array(text(140)).max(4)),
    caveat: optional(text(140)),
    badge: optional(text(30)),
  }),
);

export const ChoiceOption = define(
  "ChoiceOption",
  "Uma opção visual: rótulo e, se houver, a imagem de um produto real lido na página.",
  z.object({ label: text(60), image: optional(text(500)) }),
);

export const QuizStep = define(
  "QuizStep",
  "Uma pergunta do quiz, com 2 a 5 respostas curtas. memoryKey: onde a resposta fica guardada, como 'fone.uso'.",
  z.object({ question: text(100), memoryKey: text(60), options: z.array(text(40)).min(2).max(5) }),
);

export const MatrixRow = define(
  "MatrixRow",
  "Uma linha da comparação: o atributo e um valor por produto, na ordem dos produtos. best: índice do produto que vence nesta linha, se algum vence.",
  z.object({ label: text(40), values: z.array(text(60)).min(2).max(4), best: optional(z.number().int().min(0)) }),
);

export const Tradeoff = define(
  "Tradeoff",
  "Um eixo de escolha entre dois extremos, como 'Preço menor' e 'Mais qualidade'. value de 0 (todo à esquerda) a 100 (todo à direita) é o ponto de partida.",
  z.object({ memoryKey: text(60), left: text(30), right: text(30), value: optional(z.number().min(0).max(100)) }),
);

export const Evidence = define(
  "Evidence",
  "Um fato que sustenta ou enfraquece a escolha. source: de onde veio (ficha técnica, avaliações, loja, preço, memória da pessoa). stance: se pesa a favor, contra ou é neutro.",
  z.object({
    claim: text(100),
    detail: text(200),
    source: z.enum(["ficha", "avaliacoes", "loja", "preco", "memoria"]),
    stance: z.enum(["pro", "contra", "neutro"]),
  }),
);

export const ReviewTheme = define(
  "ReviewTheme",
  "Um assunto que aparece nas avaliações. share: porcentagem aproximada das avaliações lidas que falam disso (0 a 100). quote: um trecho curto e literal de uma avaliação, se houver.",
  z.object({
    label: text(40),
    share: z.number().min(0).max(100),
    sentiment: z.enum(["positivo", "negativo", "misto"]),
    quote: optional(text(160)),
  }),
);

export const Offer = define(
  "Offer",
  "Uma oferta do mesmo produto. shipping: frete em reais (0 se grátis, null se não informado). url: a página da oferta, como veio no retrato.",
  z.object({
    store: text(40),
    price: z.number(),
    url: text(500),
    shipping: optional(z.number().min(0)),
    seller: optional(text(60)),
    delivery: optional(text(60)),
  }),
);

export const CostLine = define(
  "CostLine",
  "Uma linha do custo total. amount em reais, sempre positivo; kind 'desconto' é subtraído do total.",
  z.object({
    label: text(50),
    amount: z.number().min(0),
    kind: z.enum(["preco", "frete", "taxa", "desconto", "outro"]),
  }),
);

export const Scenario = define(
  "Scenario",
  "Um caminho possível: comprar este, comprar outro, esperar, não comprar. cost em reais. risk: o risco de se arrepender.",
  z.object({
    label: text(50),
    cost: z.number().min(0),
    risk: z.enum(["baixo", "medio", "alto"]),
    upside: text(120),
    downside: text(120),
  }),
);

export const Signal = define(
  "Signal",
  "Um sinal lido na página para decidir entre comprar agora ou esperar, como 'Desconto de 21%' ou 'Poucas unidades'. good: true se favorece comprar agora.",
  z.object({ label: text(40), value: text(40), good: z.boolean() }),
);

export const ShortlistItem = define(
  "ShortlistItem",
  "Um produto da lista curta, com uma nota de por que ficou nela.",
  z.object({
    title: text(160),
    url: text(500),
    price: optional(z.number()),
    image: optional(text(500)),
    note: optional(text(120)),
  }),
);

export const RememberedPreference = define(
  "RememberedPreference",
  "Uma preferência que você já sabe da pessoa (vem da memória), com a chave em que está guardada.",
  z.object({ memoryKey: text(60), label: text(40), value: text(80) }),
);

// ---- The components the agent places in an answer --------------------------

export const ProductCarousel = define(
  "ProductCarousel",
  "Produtos para a pessoa escolher, de 1 a 6, em cartões. Use sempre que houver opções de produto a mostrar; não liste produtos em texto.",
  z.object({ title: text(80), products: z.array(Product.ref).min(1).max(6) }),
);

export const PreferenceChips = define(
  "PreferenceChips",
  "Pergunta curta respondida com um toque, opções em pílulas, sem imagem: tamanho, orçamento, uso. multiple: true para aceitar mais de uma resposta.",
  z.object({
    question: text(100),
    memoryKey: text(60),
    options: z.array(text(40)).min(2).max(6),
    multiple: optional(z.boolean()),
  }),
);

export const VisualChoice = define(
  "VisualChoice",
  "Pergunta de gosto respondida com um toque entre 2 a 4 opções com imagem (estilo, cor, caimento). Prefira a perguntar em texto.",
  z.object({ question: text(100), memoryKey: text(60), options: z.array(ChoiceOption.ref).min(2).max(4) }),
);

export const ProductQuiz = define(
  "ProductQuiz",
  "Quiz de 2 a 5 perguntas, uma por vez, para descobrir o que comprar quando a pessoa ainda não sabe bem o que quer.",
  z.object({ title: text(80), steps: z.array(QuizStep.ref).min(2).max(5) }),
);

export const ComparisonMatrix = define(
  "ComparisonMatrix",
  "Compara 2 a 4 produtos lado a lado nos atributos que decidem a compra e indica o recomendado (índice em products).",
  z.object({
    products: z.array(Product.ref).min(2).max(4),
    rows: z.array(MatrixRow.ref).min(1).max(8),
    recommended: z.number().int().min(0),
    verdict: text(240),
  }),
);

export const TradeoffSliders = define(
  "TradeoffSliders",
  "Deixa a pessoa dizer o peso de 1 a 4 escolhas difíceis (preço contra qualidade, leveza contra bateria). As posições voltam para você como resposta.",
  z.object({ question: text(100), sliders: z.array(Tradeoff.ref).min(1).max(4) }),
);

export const ProductVerdict = define(
  "ProductVerdict",
  "Veredito sobre um produto (o que a pessoa está vendo ou mandou o link): vale a pena, depende ou evite, com nota de 0 a 10, resumo, prós e contras. Use para 'esse vale a pena?'.",
  z.object({
    product: Product.ref,
    verdict: z.enum(["comprar", "depende", "evitar"]),
    summary: text(240),
    pros: z.array(text(100)).max(4),
    cons: z.array(text(100)).max(4),
    score: optional(z.number().min(0).max(10)),
  }),
);

export const EvidenceCards = define(
  "EvidenceCards",
  "Os fatos que sustentam uma recomendação ou veredito, cada um com a fonte. Use depois de ProductVerdict ou quando a pessoa perguntar 'por quê?'.",
  z.object({ title: text(80), items: z.array(Evidence.ref).min(1).max(6) }),
);

export const ReviewInsights = define(
  "ReviewInsights",
  "O que os compradores dizem, por assunto, a partir das avaliações lidas na página. Só use avaliações que estão no retrato; não invente.",
  z.object({
    title: text(80),
    summary: text(240),
    themes: z.array(ReviewTheme.ref).min(1).max(6),
    rating: optional(z.number().min(0).max(5)),
    reviews: optional(z.number().int().min(0)),
  }),
);

export const SentimentBreakdown = define(
  "SentimentBreakdown",
  "A distribuição das notas do produto (5 a 1 estrela, em %), como veio no retrato da página.",
  z.object({
    rating: z.number().min(0).max(5),
    reviews: z.number().int().min(0),
    histogram: z.array(z.number().min(0).max(100)).length(5),
  }),
);

export const PriceComparison = define(
  "PriceComparison",
  "O mesmo produto em ofertas diferentes, com o total (preço + frete) de cada uma. O painel soma e destaca a mais barata.",
  z.object({ product: text(160), offers: z.array(Offer.ref).min(2).max(6) }),
);

export const TotalCostBreakdown = define(
  "TotalCostBreakdown",
  "Quanto a compra custa de verdade: preço, frete, taxas e descontos. O painel soma o total; não escreva o total.",
  z.object({ title: text(80), lines: z.array(CostLine.ref).min(1).max(8), note: optional(text(160)) }),
);

export const DecisionSimulator = define(
  "DecisionSimulator",
  "Coloca 2 a 4 caminhos lado a lado (comprar este, outro, esperar, não comprar) com custo, risco, ganho e perda. A pessoa ordena por menor custo ou menor risco.",
  z.object({ question: text(100), scenarios: z.array(Scenario.ref).min(2).max(4) }),
);

export const BuyOrWait = define(
  "BuyOrWait",
  "Comprar agora ou esperar, com a confiança (baixa, média, alta) e os sinais lidos na página. Sem histórico de preço, a confiança nunca é alta.",
  z.object({
    verdict: z.enum(["comprar", "esperar", "tanto_faz"]),
    confidence: z.enum(["baixa", "media", "alta"]),
    reasons: z.array(text(140)).min(1).max(4),
    signals: optional(z.array(Signal.ref).max(5)),
  }),
);

export const SavedShortlist = define(
  "SavedShortlist",
  "A lista curta dos produtos que ainda estão no páreo, para retomar depois sem começar do zero.",
  z.object({ title: text(80), items: z.array(ShortlistItem.ref).min(1).max(6) }),
);

export const PreferenceMemory = define(
  "PreferenceMemory",
  "O que você lembra da pessoa e vai usar nesta busca, para ela confirmar ou ajustar antes de você continuar.",
  z.object({ title: text(80), items: z.array(RememberedPreference.ref).min(1).max(8) }),
);

export const DecisionBoard = define(
  "DecisionBoard",
  "O quadro da decisão desta conversa, guardado com update_decision: critérios, candidatas com o atendimento de cada critério e a evidência, condições de preço, lista curta e descartes. decisionId: o id devolvido por update_decision. Os dados vêm do servidor: não escreva preços, candidatas nem conclusões aqui.",
  z.object({ decisionId: text(60), title: text(80) }),
);

export const WatchDraft = define(
  "WatchDraft",
  "O rascunho de um acompanhamento criado com draft_watch, para a pessoa revisar o que será procurado, onde, com que frequência e quando avisa, ajustar e confirmar. watchId: o id devolvido por draft_watch. Os dados vêm do servidor; só a pessoa confirma.",
  z.object({ watchId: text(60), title: text(80) }),
);

export const WristFit = define(
  "WristFit",
  "Desenha como um relógio fica no pulso, a partir do diâmetro da caixa (mm) e da largura do pulso (cm).",
  z.object({ caseMm: z.number().min(20).max(60), wristCm: z.number().min(12).max(25), label: text(80) }),
);

const BLOCKS = [
  ProductCarousel,
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
];

export const View = define(
  "View",
  "A raiz de todo bloco: os componentes desta resposta, de cima para baixo. Quase sempre um só.",
  z.object({
    blocks: z
      .array(z.union(BLOCKS.map((block) => block.ref) as [z.ZodType, z.ZodType, ...z.ZodType[]]))
      .min(1)
      .max(3),
  }),
);

export const GENUI_ROOT = "View";

/** The components the agent places in an answer (the rest are their parts). */
export const GENUI_BLOCKS: string[] = BLOCKS.map((block) => block.name);

/** Every component, parts first: the order the instructions list them in. */
export const GENUI_COMPONENTS = [
  Product,
  ChoiceOption,
  QuizStep,
  MatrixRow,
  Tradeoff,
  Evidence,
  ReviewTheme,
  Offer,
  CostLine,
  Scenario,
  Signal,
  ShortlistItem,
  RememberedPreference,
  ...BLOCKS,
  View,
];

/** Components that ask the person something: the answer comes back as the next turn. */
export const QUESTION_COMPONENTS = new Set(["PreferenceChips", "VisualChoice", "ProductQuiz", "TradeoffSliders"]);

/** Components that put products in front of the person, for the funnel (requisitos §4). */
export const PRODUCT_COMPONENTS = new Set([
  "ProductCarousel",
  "ComparisonMatrix",
  "ProductVerdict",
  "SavedShortlist",
  "DecisionBoard",
]);

const COMPONENT_GROUPS = [
  { name: "Mostrar produtos", components: ["ProductCarousel", "ComparisonMatrix", "SavedShortlist", "DecisionBoard"] },
  { name: "Perguntar", components: ["PreferenceChips", "VisualChoice", "ProductQuiz", "TradeoffSliders"] },
  {
    name: "Avaliar um produto",
    components: ["ProductVerdict", "EvidenceCards", "ReviewInsights", "SentimentBreakdown"],
  },
  { name: "Preço e decisão", components: ["PriceComparison", "TotalCostBreakdown", "DecisionSimulator", "BuyOrWait"] },
  { name: "Memória e medida", components: ["PreferenceMemory", "WristFit"] },
  { name: "Acompanhar", components: ["WatchDraft"] },
];

/** The library without drawings: for the instructions and for checking programs. */
export const genuiSpec = createLibrary({
  id: "tone",
  root: GENUI_ROOT,
  components: GENUI_COMPONENTS,
  componentGroups: COMPONENT_GROUPS,
});

const EXAMPLES = [
  `root = View([carousel])
carousel = ProductCarousel("Três fones bons até R$ 150", [p1, p2])
p1 = Product("PHILIPS Fone TWS TAT1109", "https://www.amazon.com.br/dp/B0DVMQVVDY", 109.9, "https://m.media-amazon.com/images/I/1.jpg", 4.6, 8099, ["Bateria de 24 h, você disse que usa no treino"], "Sem cancelamento de ruído", "Melhor escolha")
p2 = Product("Redmi Buds 6 Play", "https://www.amazon.com.br/dp/B0DXS78MFF", 93.57, null, 4.6, 30, ["Mais barato"], "Poucas avaliações ainda", null)`,
  `root = View([chips])
chips = PreferenceChips("Para que você vai usar o fone?", "fone.uso", ["Treino", "Trabalho", "Viagem", "Dia a dia"], false)`,
  `root = View([verdict])
verdict = ProductVerdict(prod, "depende", "Bom preço, mas a bateria decepciona quem usa o dia todo.", ["Nota 4,6 em 8 mil avaliações"], ["Bateria abaixo do anunciado"], 7)
prod = Product("PHILIPS Fone TWS TAT1109", "https://www.amazon.com.br/dp/B0DVMQVVDY", 109.9, null, 4.6, 8099, null, null, null)`,
];

const RULES = [
  "Escreva no máximo um bloco openui-lang por resposta, cercado por ```openui-lang e ```, depois de uma frase curta de texto.",
  "Cada bloco é um programa completo: a primeira linha é root = View([...]).",
  "Use só dados do retrato da página ou da memória: título, url, image, preço, nota e avaliações exatamente como vieram. Nunca invente produto, preço, link, imagem ou avaliação.",
  'Escreva números como números (109.9, não "R$ 109,90"); o painel formata.',
  "Para conversa, dúvida ou explicação, responda só em texto, sem bloco.",
  'Se o seu texto anuncia um componente ("responda:", "veja:", "aqui estão"), o bloco vem na mesma resposta, logo depois.',
];

/** The part of the system prompt that teaches the components. Stable, so it stays in the cached prefix. */
export function genuiInstructions(): string {
  return genuiSpec.prompt({
    preamble:
      "Você desenha componentes no painel escrevendo OpenUI Lang. Use um componente quando ele mostrar melhor do que o texto: opções de produto, comparação, veredito, preço, pergunta com toque.",
    additionalRules: RULES,
    examples: EXAMPLES,
  });
}

/** A piece of an answer: plain text, or an OpenUI Lang program to draw. */
export type AnswerPart = { kind: "text"; text: string } | { kind: "ui"; code: string; complete: boolean };

const FENCE = /```(?:openui-lang|openui)[^\n]*\n([\s\S]*?)(?:```|$)/g;

/** Splits an answer into its text and its programs. An unclosed fence at the end is a program still streaming. */
export function splitAnswer(answer: string): AnswerPart[] {
  const parts: AnswerPart[] = [];
  let last = 0;
  for (const match of answer.matchAll(FENCE)) {
    const before = answer.slice(last, match.index).trim();
    if (before) parts.push({ kind: "text", text: before });
    // The opening fence needs its newline, so only a closing fence can end the match with backticks.
    const complete = match[0].endsWith("```");
    parts.push({ kind: "ui", code: (match[1] ?? "").trim(), complete });
    last = (match.index ?? 0) + match[0].length;
  }
  // A fence being typed ("``" or "```open") is not text yet.
  const rest = answer
    .slice(last)
    .replace(/`{1,3}[a-z-]*$/, "")
    .trim();
  if (rest) parts.push({ kind: "text", text: rest });
  return parts;
}

const parser = createParser(genuiSpec.toJSONSchema(), GENUI_ROOT);

export interface CheckedProgram {
  ok: boolean;
  /** Component names used, root included. */
  components: string[];
  /** Products the program shows, for the funnel. */
  products: { title: string; url: string; price: number | null }[];
  /** Questions it asks, with where each answer is kept. */
  questions: { question: string; memoryKey: string }[];
  errors: string[];
}

interface Node {
  type?: string;
  typeName?: string;
  props?: Record<string, unknown>;
}

/** T06: the parsed tree of a program, for surfaces that draw it without the React library (the web). */
export function parseProgram(code: string) {
  return parser.parse(code);
}

/** Parses a finished program the way the panel will, and lists what it shows. */
export function checkProgram(code: string): CheckedProgram {
  const result = parser.parse(code);
  const components: string[] = [];
  const products: CheckedProgram["products"] = [];
  const questions: CheckedProgram["questions"] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (!value || typeof value !== "object") return;
    const node = value as Node;
    const name = node.typeName;
    if (typeof name === "string" && node.props) {
      components.push(name);
      const props = node.props;
      if (name === "Product" || name === "ShortlistItem")
        products.push({
          title: String(props.title ?? ""),
          url: String(props.url ?? ""),
          price: typeof props.price === "number" ? props.price : null,
        });
      if (name === "PreferenceChips" || name === "VisualChoice" || name === "QuizStep")
        questions.push({ question: String(props.question ?? ""), memoryKey: String(props.memoryKey ?? "") });
      for (const child of Object.values(props)) visit(child);
    }
  };
  visit(result.root);
  const errors = [
    ...result.meta.errors.map((error) => error.message),
    ...result.meta.unresolved.map((name) => `referência sem definição: ${name}`),
  ];
  return { ok: result.root !== null && errors.length === 0, components, products, questions, errors };
}
