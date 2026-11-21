# Resultados dos painéis: veredito primeiro, painel separado da conversa

Data: 20/11/2026. Repositórios: `toneorg/server` (em `../tone-server`) e `toneorg/web` (este). Maquetes da opção escolhida e da descartada: `tone-pagina.png` e `tone-gaveta.png`, feitas com o Stageshow no visual da tone (não versionadas; refazer a partir deste texto se precisar).

## Intenção

A página do painel hoje responde "o que a tone viu na última leitura". A pessoa abre um painel para saber **"vale comprar agora, e qual?"**. Pensando como quem acompanha um tênis, ela chega em três momentos:

1. **"Chegou o aviso. Compro agora?"** Quer saber se o preço é bom de verdade (contra o histórico) e se é o produto certo. Hoje o e-mail leva a `/conversas`, não ao painel, e a página mostra o preço e uma linha sem dizer se é um bom momento.
2. **"Mudou alguma coisa?"** A olhada rápida na coluna ao lado do chat. Hoje o cartão mostra o menor preço, mas não a mudança.
3. **"Como está cada um?"** Painel com vários produtos ("desses dois tênis"). Hoje gráfico e lista misturam os produtos num preço só.

E uma decisão de produto da pessoa: **painel e conversa são coisas separadas.** Desde 15/11 existe uma conversa só (`src/conversas/timeline.ts`). O painel e os resultados ficam em outro lugar, sem conversa própria. O olhar de relance ao lado do chat continua (pedido explícito).

## Objetivos

- **Cartão na coluna (o relance):** uma linha por produto com o melhor preço confiável e a mudança desde o dia anterior ("↓ R$ 80", "↑ R$ 30", "igual"), a etiqueta "Bom momento" quando o veredito é bom, e a hora da leitura.
- **Página do painel (a decisão)**, no lado direito, onde o chat fica, com a coluna mantida, de cima para baixo:
  1. Cabeçalho: "← Conversa", título, status, regra de aviso e hora da leitura, menu de ações (o atual).
  2. **Veredito:** um bloco com o estado ("Bom momento para comprar", "Preço normal", "Acima do normal", "Ainda conhecendo o preço"), o produto e o preço que o motivam, o porquê em uma frase e "Ver na loja".
  3. **Produtos:** um item por produto do painel, com foto, nome, loja do melhor preço, linha dos últimos 30 dias, preço e mudança.
  4. **Recolhidos:** "Todas as ofertas" (a lista atual, com o produto de cada oferta) e "Histórico e leituras" (o gráfico, por produto, e as leituras anteriores).
- **Painel separado da conversa:** sai da página "Conversar sobre este painel" e "Conversas deste painel"; deixam de existir conversas presas a um painel; o chat deixa de desenhar as leituras dos painéis.
- **"Perguntar" de uma oferta** continua, mas abre a conversa central com aquele produto escolhido. É uma passagem, não uma conversa do painel.
- **E-mail de aviso** leva direto à página do painel; o resumo diário leva cada seção ao seu painel.

## Fora do escopo

- Mudar o valor ou a regra de aviso pela página (lacuna real, fica para depois).
- "O que mudou desde a última vez que você olhou": exige guardar o que cada pessoa viu. A mudança é contra o dia anterior.
- Gaveta sobre o chat (opção B, descartada) e uma área "Painéis" sem a coluna (descartada: tira o relance).
- Ler o preço do link exato da loja (o casamento por título continua; ver o desenho do painel pelo chat).
- Redesenho do celular além do que a página já faz: no celular a coluna abre por botão e o painel ocupa a tela.

## Anti-objetivos

- Um veredito que diga "bom momento" com base numa oferta de variante não confirmada, parcelada ou de outro modelo.
- O cartão e a página discordarem do e-mail sobre o que é um bom momento.
- O painel voltar a ter conversa dentro, ou o chat voltar a mostrar resultados de painel.
- Cor nova para "subiu/caiu": a tone não tem verde/vermelho de status; a única cor que informa é a pele. Queda boa usa o coral de "sim da tone" (`accentText`), o resto fica em `ink`/`graphite`.

## Restrições

- `src/tone/shared` e `src/tone/genui` são gerados de `toneorg/server`; contratos novos nascem em `packages/shared` e chegam com `npm run sync:shared -- ../tone-server`.
- `@toneorg/design`: ler `DESIGN.md` e as fichas (`surface.md`, `button.md`, `feedback.md`) antes; cartão `rounded-card` com `shadow-raised`, etiqueta `rounded-tag`, preços com algarismos tabulares, nenhuma cor à mão (`npm run check:design`). O bloco do veredito usa `accentSoft` com o rótulo em `accentText`, como na maquete; se a ficha não cobrir esse uso no app, a mudança vai para `toneorg/design` antes.
- Next.js deste repo tem mudanças de API: ler `node_modules/next/dist/docs/` antes de mexer em rotas.
- Modelos: nada aqui chama LLM.

## Abordagens consideradas

1. **Página no lugar do chat, coluna mantida** (escolhida pela pessoa). O relance segue na coluna; a página tem endereço próprio (o e-mail leva a ela) e espaço para crescer. Trocar de chat para painel é uma navegação, com "← Conversa" para voltar.
2. **Gaveta sobre o chat.** Volta ao ponto exato do chat ao fechar, mas é apertada para histórico e ofertas e mistura painel e chat na mesma tela, o oposto da separação pedida.
3. **Área "Painéis" própria, sem a coluna ao lado do chat.** Separação máxima, mas perde o relance, que a pessoa quer manter. Descartada por ela.

## Desenho

### Servidor (`../tone-server`)

**1. Ofertas atribuídas a produtos.** Função pura em `watch-evaluate.ts` (ao lado da regra que já casa ofertas por título e variante, linhas ~89-114): dada a regra e uma oferta, devolve o índice do produto em `rule.products` (o primeiro cujo título casa), ou `null`. Usada na leitura, então vale também para leituras antigas. Painel `discovery` e painel `monitoring` sem produtos tratam a busca como um único "produto".

**2. Resumo do painel.** Novo `GET /api/watches/:id/summary`, com contrato `WatchSummary` em `packages/shared/src/watch.ts`:

```ts
WatchSummary = {
  observedAt: string | null,            // a última leitura com ofertas
  verdict: {
    kind: "good" | "normal" | "high" | "learning" | "none",
    productIndex: number | null,        // o produto que motiva o veredito
    reason: string,                     // a frase pronta, em português
  },
  products: Array<{
    title: string, variantLabel: string | null,
    best: { priceText, amount, store, url, imageUrl } | null,  // só ofertas sem `limitation`
    previous: number | null,            // menor preço confiável do dia anterior com leitura
    typical: number | null,             // typicalPrice do produto (mediana de 30 dias, ≥3 dias)
    low30: number | null,               // menor preço dos últimos 30 dias
    points: WatchPricePoint[],          // série diária do produto, 30 dias
  }>,
}
```

- A série por produto vem do mesmo caminho de `priceHistory` (leituras do painel e `price_observations` das mesmas ofertas), agrupado pelo produto atribuído.
- `typicalPrice` passa a aceitar um filtro de produto. O veredito e o aviso por queda (`price_drop`) usam a mesma conta, para nunca discordarem.
- Ofertas com `limitation` (variante não confirmada, parcela, outro modelo) nunca entram em `best`, no veredito nem na série.

**2b. Análise da variação de preço (revisada em 20/11 após pesquisa).** A lógica atual (`watch-evaluate.ts` ~205-219, `watch-prices.ts`) mede a queda contra a mediana de 30 dias do menor preço diário, com 10% fixos. A base é a mesma do Google Flights (mediana dos preços mais baratos de 12 meses; "oferta" a partir de 20% abaixo), mas tem cinco falhas, corrigidas aqui:

1. O histórico inclui ofertas que o próprio aviso rejeita (`limitation`: anúncio fora da faixa, variante não confirmada), que ficam com `amount` e entram em `priceHistory`. **Correção:** a série só usa ofertas sem `limitation`.
2. Uma série para todos os produtos do painel. **Correção:** uma série por produto (item 1).
3. "Metade do dobro" (sobe antes, desconta depois) passa: a mediana de 30 dias sobe junto com o preço inflado. **Correção:** a queda também precisa igualar ou bater o menor preço dos 30 dias anteriores, a mesma referência que a diretiva Omnibus (UE, art. 6a da 98/6/CE) exige como "preço anterior" de uma promoção.
4. 10% fixos ignoram o ruído do produto. **Correção:** robustez por MAD (desvio absoluto mediano): a queda precisa passar de 2 × 1,4826 × MAD abaixo do normal quando o MAD não é zero.
5. A deduplicação por oferta e preço exatos manda um e-mail a cada real de queda. **Correção:** por produto, um novo aviso só quando o preço fica ao menos 3% abaixo do último avisado, ou depois de voltar ao normal (≥ 95% do normal).

O método, uma função pura em `packages/shared` (`priceSignal`), usada pelo avaliador do aviso, pelo veredito, pelo cartão e pela página:

- Série: por produto, o menor preço confirmado de cada dia, com o dia no fuso de Brasília (hoje é UTC).
- `normal`: mediana dos menores diários anteriores a hoje, em até 90 dias.
- `low30`: o menor dos 30 dias anteriores a hoje.
- `spread`: 1,4826 × MAD dos mesmos dias.
- Dias de histórico: menos de 3, "aprendendo" (o aviso continua contra o primeiro preço visto, como hoje); de 3 em diante, o método completo.
- Queda relevante: `atual ≤ normal × (1 − 10%)`, `atual ≤ low30` e, com `spread > 0`, `normal − atual ≥ 2 × spread`.
- Acima do normal: `atual ≥ normal × 1,05` e, com `spread > 0`, `atual − normal ≥ 2 × spread`.
- Senão: normal.
- Os limiares (10%, 2×, 5%, 3%) são ponto de partida, em constantes nomeadas. O plano inclui um script que reavalia as leituras guardadas em `watch_results` e conta quantos avisos cada combinação teria dado, para calibrar com dados reais.

Fontes: Google Flights (central de ajuda, "How to find the best fares"); diretiva Omnibus e guia da Comissão Europeia sobre o preço anterior; cartilha Senacon 2025 ("metade do dobro"); identificador de Hampel e escore-z modificado (mediana e MAD) para séries com ruído.

**3. Veredito** (função pura em `packages/shared`, testável, alimentada pelo servidor; usa `priceSignal`):
- `good` quando a última leitura atingiu a condição (`conditionMet`). A frase diz o porquê conforme a condição: queda ("O menor preço em 30 dias, R$ 80 abaixo do normal.") ou valor em mente ("Perto do seu valor de R$ 600.").
- Senão, com `typical` conhecido: `normal` (dentro do normal: "Dentro do normal dos últimos 30 dias. Eu aviso quando cair.") ou `high` (acima do típico por uma margem a definir: "Acima do normal: vale esperar.").
- `learning` com menos de 3 dias de leitura: "Com 3 dias de leitura eu digo se o preço está bom."
- `none` sem leitura ou sem ofertas confiáveis: os textos de hoje (primeira leitura, rascunho, fonte falhou).
- O produto do veredito é o que atingiu a condição; senão, o de melhor preço relativo ao típico.
- A margem de `high` e o texto exato de cada frase ficam com o construtor (better-writing), registrados nos testes.

**4. Painel separado da conversa.**
- `POST /api/sessions` deixa de aceitar abrir sessão com `watch_id` (ou ignora); o bloco `panelNote`/`panelContext` em `agent.ts` deixa de ser usado para sessões novas.
- `GET /api/watches/:id/sessions` deixa de ser usado pela web (pode ficar para compatibilidade).
- Conversas de painel antigas (`sessions.watch_id` não nulo): **escolha minha**, uma migração limpa `watch_id`, e elas passam a aparecer na conversa central nas datas em que aconteceram (são conversas da pessoa e hoje somem com o painel excluído). O construtor confere a contagem em produção antes e diz no PR.

**5. E-mail** (`watch-outbox.ts`): o aviso de condição leva a `/paineis/<watch_id>`; o resumo diário põe em cada seção o link do seu painel e mantém um link geral para `/conversas`.

### Web (este repo), depois de sincronizar

**6. `api.ts`:** `watchSummary(id)`, com o mesmo cache e a mesma invalidação de `watchPrices` (relê quando chega leitura nova e em `WATCHES_CHANGED`).

**7. Cartão (`Panels.tsx`, `PanelCard`):** substitui "menor preço + sparkline" por uma linha por produto (miniatura, nome, preço, mudança), a etiqueta "Bom momento" quando `verdict.kind === "good"` e "Lido hoje às 9h". Painel com mais de três produtos mostra três e "+ N". Mantém os avisos atuais de problema, leitura antiga, e-mail silenciado e rascunho. O cartão do painel aberto fica marcado como selecionado.

**8. Página (`PanelPage.tsx`, `PanelView`):** reordenada como nos Objetivos.
- Veredito: componente novo.
- Produtos: componente novo, com a linha de 30 dias (reaproveitar `Sparkline.tsx`).
- "Todas as ofertas": `OfferList` com o nome do produto de cada oferta.
- "Histórico e leituras": `PriceChart` com um seletor por produto (o do veredito primeiro) e a lista de leituras anteriores, que hoje só existe em `WatchReadings`.
- Saem "Conversar sobre este painel" e "Conversas deste painel". "Perguntar" passa a abrir a conversa central com o produto escolhido, pela mesma via que o chat usa para um produto escolhido (`picked-handoff.ts`), na sessão atual da conversa única.
- "← Conversas" passa a "← Conversa".

**9. Chat (`Conversation.tsx`):** sai o bloco que busca e desenha os painéis da sessão (`~474-498`, `~1038`, `~1115`). `WatchReadings` deixa de ser usado; o que a página precisa dele (`OfferList`) fica. A rota `/conversas/[id]?painel=` deixa de ser gerada.

**10. Telemetria:** `panel_page_opened` ganha `verdict`; novo `panel_verdict_store_clicked`; `panel_conversation_started` passa a `panel_asked_in_chat`. Atualizar `docs/analytics.md`.

## Como saber que funcionou

- Testes do servidor: atribuição de ofertas a produtos (dois tênis, variante, oferta sem produto); série e `typical` por produto; cada estado do veredito, incluindo que oferta com `limitation` nunca vira "bom momento"; o veredito `good` coincide com o aviso de `price_drop` na mesma leitura; e-mail com link do painel; migração das conversas de painel.
- Web: `npm run check:design`, lint, build; testes dos componentes novos onde o repo já testa.
- No site publicado, no Chrome da pessoa: um painel com dois produtos mostra um preço e uma mudança por produto no cartão; a página abre com o veredito; o e-mail leva à página; "Perguntar" abre o chat com o produto; nenhuma leitura de painel aparece no chat.

## Deixado para o construtor

- Margem de "acima do normal" e o texto final das frases do veredito.
- Se o resumo vem por painel (`/summary`) ou já dentro de `GET /api/watches` para a coluna não fazer N pedidos.
- Como o "Perguntar" encontra a sessão atual da conversa única.
- Visual fino do bloco do veredito e dos itens de produto, seguindo `@toneorg/design` e as maquetes.
