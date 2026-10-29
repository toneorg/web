// Gerado de toneorg/extension@7b352c6fb2e6 (packages/shared/src/tools.ts). Não edite aqui.
// The tools the agent can call. Two kinds:
//   browser  run in the extension, on the store's tab (RF2)
//   server   run on the server (memory, RF3)
// One zod schema per tool is both the validation and the JSON schema the model sees.
// Components in the panel (RF5) are not tools: the agent writes them in OpenUI
// Lang (genui.ts). The old UI tools below stay only to draw conversations saved
// before that change.
import * as z from "zod";
import { AgentDecisionOp } from "./decision";
import { ResearchRequest } from "./research-execution";
import { WatchRule } from "./watch";

const Ref = z.string().describe("O `ref` de um elemento, como veio em read_page ou no resultado da última ação.");

export const BrowserTools = {
  read_page: {
    description:
      "Lê a página aberta na aba da loja: tipo de página, produtos listados, detalhe do produto, filtros. Use antes de agir se não tiver um retrato recente.",
    args: z.object({}),
    mutates: false,
  },
  search: {
    description: "Busca na loja usando o campo de busca da própria loja.",
    args: z.object({ query: z.string().min(1).max(120) }),
    mutates: false,
  },
  set_price_range: {
    description: "Filtra os resultados atuais por faixa de preço, em reais.",
    args: z.object({ min: z.number().min(0).nullable(), max: z.number().min(0).nullable() }),
    mutates: false,
  },
  sort: {
    description: "Ordena os resultados atuais.",
    args: z.object({ by: z.enum(["relevance", "price_asc", "price_desc"]) }),
    mutates: false,
  },
  apply_filter: {
    description: "Aplica um dos filtros da página de resultados (marca, tamanho, cor, condição...).",
    args: z.object({ ref: Ref }),
    mutates: false,
  },
  open_product: {
    description: "Abre a página de um produto. Passe o `ref` de um produto listado ou a URL dele.",
    args: z.object({ ref: Ref.nullable(), url: z.string().nullable() }),
    mutates: false,
  },
  go_back: {
    description: "Volta para a página anterior.",
    args: z.object({}),
    mutates: false,
  },
  select_variant: {
    description: "Escolhe uma variação do produto aberto (tamanho, cor). A pessoa confirma antes.",
    args: z.object({ ref: Ref, reason: z.string().max(200) }),
    mutates: true,
  },
  add_to_cart: {
    description:
      "Adiciona o produto aberto ao carrinho. A pessoa confirma antes. Nunca existe ferramenta para pagar ou finalizar a compra.",
    args: z.object({ ref: Ref, reason: z.string().max(200) }),
    mutates: true,
  },
} as const;
export type BrowserToolName = keyof typeof BrowserTools;
export const BROWSER_TOOL_NAMES = Object.keys(BrowserTools) as BrowserToolName[];

export function isBrowserTool(name: string): name is BrowserToolName {
  return Object.hasOwn(BrowserTools, name);
}

/** A product as the agent presents it: what it read on the page plus why it fits the person. */
export const ShownProduct = z.object({
  title: z.string(),
  url: z.string(),
  price: z.number().nullable(),
  image: z.string().nullable(),
  rating: z.number().nullable(),
  reasons: z.array(z.string().max(140)).max(4).describe("Por que serve para a pessoa, citando o perfil da pessoa."),
  caveat: z.string().max(140).nullable().describe("O ponto fraco, se houver."),
});
export type ShownProduct = z.infer<typeof ShownProduct>;

const Choice = z.object({
  label: z.string().max(60),
  image: z.string().nullable().describe("URL de imagem de um produto real lido na página, ou null."),
});

export const UiTools = {
  show_products: {
    description:
      "Mostra de 1 a 5 produtos em cartões, com o motivo de cada um. Use sempre que houver opções a mostrar.",
    args: z.object({
      title: z.string().max(80),
      products: z.array(ShownProduct).min(1).max(5),
    }),
  },
  show_comparison: {
    description: "Compara 2 a 4 produtos lado a lado em atributos que importam para a decisão e indica o recomendado.",
    args: z.object({
      products: z.array(ShownProduct).min(2).max(4),
      attributes: z
        .array(z.object({ label: z.string().max(40), values: z.array(z.string().max(60)) }))
        .min(1)
        .max(8)
        .describe("Um valor por produto, na mesma ordem de `products`."),
      recommended: z.number().int().min(0).describe("Índice do produto recomendado em `products`."),
      verdict: z.string().max(240),
    }),
  },
  ask_this_or_that: {
    description:
      "Pergunta uma preferência com 2 a 4 opções visuais, respondida com um toque. Use quando falta uma preferência para decidir, no lugar de perguntar em texto.",
    args: z.object({
      question: z.string().max(100),
      memoryKey: z.string().max(60).describe("Onde a resposta é guardada, ex.: 'relogio.estilo', 'roupa.caimento'."),
      options: z.array(Choice).min(2).max(4),
    }),
  },
  quick_question: {
    description: "Uma pergunta curta com opções em pílulas (sem imagem): tamanho, orçamento, uso.",
    args: z.object({
      question: z.string().max(100),
      memoryKey: z.string().max(60),
      options: z.array(z.string().max(40)).min(2).max(5),
    }),
  },
  show_fit: {
    description:
      "Desenha como um relógio fica no pulso da pessoa, a partir do diâmetro da caixa e da largura do pulso.",
    args: z.object({
      caseMm: z.number().min(20).max(60),
      wristCm: z.number().min(12).max(25),
      label: z.string().max(80),
    }),
  },
} as const;
export type UiToolName = keyof typeof UiTools;

export function isUiTool(name: string): name is UiToolName {
  return Object.hasOwn(UiTools, name);
}

export const ServerTools = {
  research_products: {
    description:
      "Pesquisa produtos remotamente no servidor, em índice de lojas suportadas, sem abrir navegador. Preserve o escopo e os requisitos da pessoa; campos sem prova ficam desconhecidos.",
    args: ResearchRequest,
  },
  update_decision: {
    description:
      "Guarda o estado da decisão desta conversa: consulta, critérios (obrigatório, desejável, indiferente), candidatas vindas de research_products (por ID de oferta), avaliações, lista curta e descartes com motivo. Critérios que você inferir ficam como sugestão até a pessoa confirmar. Você não desfaz o que a pessoa decidiu. Para mostrar, escreva DecisionBoard com o id devolvido.",
    args: z.object({ ops: z.array(AgentDecisionOp).min(1).max(10) }),
  },
  draft_watch: {
    description:
      "Cria ou ajusta o rascunho de um acompanhamento (descoberta de novidades ou monitoramento de produtos identificados): objetivo, busca, marcas, categorias, variantes, produtos, lojas, condição de aviso (preço alvo, queda desde a primeira observação ou novidade) e avisos. Nada executa nem cobra antes de a pessoa confirmar na tela; você não confirma. Pedidos vagos como 'promoção' ficam pendentes de esclarecimento. Mostre com WatchDraft e o id devolvido.",
    args: z.object({ watchId: z.string().min(1).max(60).optional(), rule: WatchRule }),
  },
  compare_photo: {
    description:
      "Compara até 3 candidatas da decisão (IDs de oferta já adicionados com update_decision) com a foto de referência da pessoa, só nos atributos visíveis que ela confirmou. O resultado entra na decisão como evidência visual; não julga preço, material, medida ou autenticidade.",
    args: z.object({ photoId: z.string().min(1).max(60), offerIds: z.array(z.string().min(1)).min(1).max(3) }),
  },
  save_memory: {
    description:
      "Guarda algo que você aprendeu sobre a pessoa e que vale para as próximas compras: medida, tamanho, gosto, marca, orçamento. Não guarde o que é só desta conversa.",
    args: z.object({
      key: z.string().max(60).describe("Chave estável, ex.: 'pulso.largura_cm', 'relogio.estilo', 'roupa.tamanho'."),
      value: z.string().max(200),
      category: z.string().max(30).describe("Categoria: relogio, roupa, eletronicos, beleza, geral..."),
    }),
  },
} as const;
export type ServerToolName = keyof typeof ServerTools;

export function isServerTool(name: string): name is ServerToolName {
  return Object.hasOwn(ServerTools, name);
}

export type ToolName = BrowserToolName | UiToolName | ServerToolName;

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Every tool the model can call, in the shape of the Chat Completions `tools` list. */
export function toolSpecs(): ToolSpec[] {
  const all: [string, { description: string; args: z.ZodType }][] = [
    ...Object.entries(BrowserTools),
    ...Object.entries(ServerTools),
  ];
  return all.map(([name, tool]) => ({
    name,
    description: tool.description,
    parameters: z.toJSONSchema(tool.args, { target: "draft-7" }) as Record<string, unknown>,
  }));
}

export function argsSchema(name: string): z.ZodType | null {
  if (isBrowserTool(name)) return BrowserTools[name].args;
  if (isServerTool(name)) return ServerTools[name].args;
  return null;
}

/** Whether a browser tool changes something for the person and so needs their yes first (RF2.4). */
export function needsConfirmation(name: string): boolean {
  return isBrowserTool(name) && BrowserTools[name].mutates;
}
