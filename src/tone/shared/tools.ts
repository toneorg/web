// Gerado de toneorg/server@31777966ea48 (packages/shared/src/tools.ts). Não edite aqui.
// The tools the agent can call. They all run on the server: tone researches the
// stores from there and never drives a store page; a store opens only when the
// person clicks its link. One zod schema per tool is both the validation and the
// JSON schema the model sees.
// Components in the panel (RF5) are not tools: the agent writes them in OpenUI
// Lang (genui.ts). The old UI tools below stay only to draw conversations saved
// before that change.
import * as z from "zod";
import { AgentDecisionOp } from "./decision";
import { ResearchRequest } from "./research-execution";
import { ReviewRequest } from "./reviews";
import { SituationUpdate } from "./situation";
import { WatchRule } from "./watch";

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
      "Pesquisa produtos no servidor pelo índice e, na web, pelas ferramentas remotas validadas. Escolha em remoteSelection até três lojas relevantes do catálogo; mantenha storeScope irrestrito salvo pedido explícito da pessoa. Lojas explícitas prevalecem sem corte silencioso. Campos sem prova ficam desconhecidos.",
    args: ResearchRequest,
  },
  review_videos: {
    description:
      'Lê reviews do YouTube (transcrições) e monta uma síntese de reviews: o que importa, consensos, divergências, cuidados e modelos citados. Roda em segundo plano e NÃO devolve a síntese agora: responda com o que já tem; ela aparece na conversa quando ficar pronta e chega a você no próximo turno. Use só quando a pessoa pedir o que os reviews dizem (ela também tem o botão "O que dizem os reviews" no produto selecionado); não chame por conta própria. subject category uma vez por conversa; subject product só para até três candidatas da lista curta, com marca e modelo.',
    args: ReviewRequest,
  },
  update_decision: {
    description:
      "Guarda o estado da decisão desta conversa: consulta, critérios (obrigatório, desejável, indiferente), candidatas vindas de research_products (por ID de oferta), avaliações, lista curta e descartes com motivo. Critérios que você inferir ficam como sugestão até a pessoa confirmar. Você não desfaz o que a pessoa decidiu. Para mostrar, escreva DecisionBoard com o id devolvido.",
    args: z.object({ ops: z.array(AgentDecisionOp).min(1).max(10) }),
  },
  draft_watch: {
    description:
      "Cria ou ajusta o rascunho de um acompanhamento: objetivo, busca, marcas, categorias, variantes, produtos, escopo explícito da pessoa, remoteSelection com até três lojas relevantes do catálogo, condição de aviso e avisos. Nenhuma pesquisa de produto nem aviso executa antes de a pessoa confirmar na tela; você não confirma. Pedidos vagos como 'promoção' ficam pendentes de esclarecimento. Mostre com WatchDraft e o id devolvido.",
    args: z.object({ watchId: z.string().min(1).max(60).optional(), rule: WatchRule }),
  },
  compare_photo: {
    description:
      "Compara até 3 candidatas da decisão (IDs de oferta já adicionados com update_decision) com a foto de referência da pessoa, só nos atributos visíveis que ela confirmou. O resultado entra na decisão como evidência visual; não julga preço, material, medida ou autenticidade.",
    args: z.object({ photoId: z.string().min(1).max(60), offerIds: z.array(z.string().min(1)).min(1).max(3) }),
  },
  update_situation: {
    description:
      "Guarda a situação de compra desta conversa: o que a pessoa está tentando resolver (objetivo), ocasião, quando (e a data, se souber), onde e em que ambiente, condições (clima, horas em pé), formalidade, para quem ou com quem, como quer se sentir ou parecer, orçamento, restrições, o que já tem e quer usar junto, e o que ainda falta saber que mudaria a recomendação. Mande só o que mudou; listas substituem as anteriores. Quando a pessoa escolher, mande chosen.",
    args: SituationUpdate,
  },
  save_owned_item: {
    description:
      "Lembra de algo que a pessoa disse que já tem (sapato, bolsa, casaco, celular, monitor, panela...), para considerar em compras futuras: combinar, completar, não comprar repetido. Só o que ela disse que tem; nunca deduza posse.",
    args: z.object({
      name: z
        .string()
        .min(1)
        .max(80)
        .describe("Como a pessoa chama o item: 'sandália dourada', 'iPhone 15', 'blazer preto'."),
      details: z
        .string()
        .max(160)
        .nullable()
        .describe("O que importa para combinar ou ser compatível: cor, material, modelo, tamanho, conector."),
      category: z.string().max(30).describe("Categoria do item: roupa, calcado, bolsa, eletronicos, casa..."),
    }),
  },
  save_memory: {
    description:
      "Guarda algo que você aprendeu sobre a pessoa e que vale para as próximas compras: medida, tamanho, gosto, marca, orçamento. Preferência que só vale numa situação leva condition ('casamento', 'trabalho', 'viagem', 'calor'). O que você deduziu sem a pessoa dizer vai com inferred true, como hipótese para ela confirmar. Estado passageiro ('economizando este mês', 'viajando para o frio') leva expiresInDays. Não guarde o que é só desta conversa.",
    args: z.object({
      key: z
        .string()
        .max(60)
        .describe(
          "Chave estável, ex.: 'pulso.largura_cm', 'relogio.estilo', 'roupa.tamanho'. Com condição, inclua a condição na chave: 'roupa.cores.trabalho', 'calcado.salto.casamento'.",
        ),
      value: z.string().max(200),
      category: z.string().max(30).describe("Categoria: relogio, roupa, eletronicos, beleza, geral..."),
      condition: z
        .string()
        .max(60)
        .nullable()
        .optional()
        .describe("A situação em que isto vale, ou null se vale sempre."),
      inferred: z.boolean().optional().describe("true quando você deduziu e a pessoa não disse."),
      expiresInDays: z.number().int().min(1).max(365).nullable().optional(),
    }),
  },
} as const;
export type ServerToolName = keyof typeof ServerTools;

export function isServerTool(name: string): name is ServerToolName {
  return Object.hasOwn(ServerTools, name);
}

export type ToolName = UiToolName | ServerToolName;

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/** Every tool the model can call, in the shape of the Chat Completions `tools` list. */
export function toolSpecs(): ToolSpec[] {
  const all: [string, { description: string; args: z.ZodType }][] = Object.entries(ServerTools);
  return all.map(([name, tool]) => ({
    name,
    description: tool.description,
    parameters: z.toJSONSchema(tool.args, { target: "draft-7" }) as Record<string, unknown>,
  }));
}

export function argsSchema(name: string): z.ZodType | null {
  if (isServerTool(name)) return ServerTools[name].args;
  return null;
}
