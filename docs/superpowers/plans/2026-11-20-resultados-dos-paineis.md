# Resultados dos painéis — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a página e o cartão do painel respondem "vale comprar agora, e qual?". O veredito sai de uma análise de preço robusta e por produto, e o painel fica separado da conversa.

**Architecture:** uma função pura `priceSignal` em `packages/shared` decide queda, normal ou acima do normal a partir da série diária de um produto (mediana de 90 dias, menor de 30 dias, MAD). O avaliador do aviso, o veredito, o cartão e a página usam a mesma função. O servidor atribui cada oferta a um produto, monta séries por produto e expõe `GET /api/watches/:id/summary`. O web redesenha o cartão e a página e remove as conversas de painel.

**Tech Stack:** servidor Hono + vitest (`../tone-server`, pnpm); web Next.js 16 + vitest; `npm run sync:shared -- ../tone-server`.

**Spec:** `docs/superpowers/specs/2026-11-20-resultados-dos-paineis-design.md` (seção 2b para a análise de preço).

## Global Constraints

- Limiares em constantes nomeadas: queda 10% abaixo do normal; acima do normal a partir de 5%; 2 × spread; spread = 1,4826 × MAD; normal em até 90 dias; menor de referência em 30 dias; mínimo de 3 dias; novo aviso só 3% abaixo do último avisado ou depois de voltar a ≥ 95% do normal.
- Ofertas com `limitation` nunca entram em série, normal, veredito ou aviso.
- Dia de uma leitura no fuso `America/Sao_Paulo`.
- Sem cor nova para subir/cair: queda usa `text-accent-text`; o resto `text-ink`/`text-graphite`. `npm run check:design` passa.
- Arquivos gerados no web (`src/tone/*`) não se editam à mão.
- Textos do veredito (exatos):
  - good + queda: `O menor preço em 30 dias, {R$ diferença} abaixo do normal.`
  - good + valor em mente: `Perto do seu valor de {R$ valor}.` (ou `Abaixo do seu valor de {R$ valor}.` quando ≤ valor)
  - good + novidade (discovery): `Apareceram alternativas novas.`
  - normal: `Dentro do normal dos últimos {N} dias. Eu aviso quando cair.`
  - high: `Acima do normal dos últimos {N} dias: vale esperar.`
  - learning: `Com 3 dias de leitura eu digo se o preço está bom.`
  - Rótulos no web: good `Bom momento para comprar`, normal `Preço normal`, high `Acima do normal`, learning `Ainda conhecendo o preço`.

## Review Focus

- Produto que some numa leitura (nenhuma oferta confiável hoje): o item mostra "Sem oferta confirmada nesta leitura" e não entra no veredito; o veredito usa os outros produtos (teste em Task 3).
- Painel antigo, de antes da atribuição por produto, com um único produto ou sem produtos (só `query`): vira um produto só, com a série inteira (teste em Task 2).
- Oferta de preço suspeito (metade do preço das outras) num dia: não puxa o normal nem dispara aviso (teste em Task 2).
- Preço que oscila entre R$ 599 e R$ 598 por dias seguidos depois de um aviso: nenhum e-mail novo (teste em Task 2).
- Conversa de painel antiga aberta por um link salvo `/conversas/<id>?painel=<id>`: cai na conversa central, sem erro (teste em Task 6).

---

### Task 1: `priceSignal`, veredito e contrato do resumo (shared)

**Files:**
- Create: `../tone-server/packages/shared/src/price-signal.ts`
- Modify: `../tone-server/packages/shared/src/watch.ts` (contratos `WatchSummary`, texto de `price_drop` nas linhas ~280-283 e ~402-404)
- Modify: `../tone-server/packages/shared/src/index.ts` (exportar)
- Test: `../tone-server/packages/shared/test/price-signal.test.ts`

**Interfaces:**
- Produces:
  - `PRICE_SIGNAL = { drop: 0.1, high: 0.05, spreadK: 2, madScale: 1.4826, normalDays: 90, lowDays: 30, minDays: 3, realertStep: 0.03, reset: 0.95 } as const`
  - `type DailyLow = { day: string; amount: number }`
  - `type PriceSignal = { kind: "learning"; days: number } | { kind: "drop" | "normal" | "high"; days: number; normal: number; low30: number; spread: number; belowNormal: number }` (`belowNormal` = `(normal − current) / normal`)
  - `priceSignal(current: number, history: DailyLow[], today: string): PriceSignal`. `history` são os menores diários; dias ≥ `today` são ignorados; só os últimos 90 dias contam para normal e spread, os últimos 30 para `low30`.
  - `brazilDay(iso: string): string`, o `YYYY-MM-DD` em `America/Sao_Paulo`.
  - `WatchSummaryProduct`, `WatchVerdict`, `WatchSummary` (zod) e `verdictOf(input: { rule: WatchRule; conditionMet: boolean; hitProduct: number | null; products: WatchSummaryProduct[] }): WatchVerdict`.
  - `WatchSummaryProduct = { title: string; variantLabel: string | null; best: { title: string; priceText: string; amount: number; store: string; url: string; imageUrl: string | null } | null; previous: number | null; signal: PriceSignal | null; points: WatchPricePoint[] }`
  - `WatchVerdict = { kind: "good" | "normal" | "high" | "learning" | "none"; productIndex: number | null; reason: string }`
  - `WatchSummary = { observedAt: string | null; verdict: WatchVerdict; products: WatchSummaryProduct[] }`

- [ ] **Step 1: Testes que falham** (`price-signal.test.ts`)

```ts
const days = (amounts: number[], end = "2026-11-19") => /* um DailyLow por dia, terminando em `end` */;
it("menos de 3 dias é aprendendo", () => expect(priceSignal(500, days([600, 610]), "2026-11-20")).toEqual({ kind: "learning", days: 2 }));
it("10% abaixo da mediana e no menor de 30 dias é queda", () => {
  const s = priceSignal(540, days([600, 610, 600, 605, 600]), "2026-11-20");
  expect(s.kind).toBe("drop"); // normal 600, low30 600
});
it("metade do dobro: volta ao preço de antes não é queda", () => {
  // 20 dias a 600, 14 dias inflados a 800, hoje 600: mediana alta, mas não bate o menor de 30 dias? 600 ≤ 600 → bate.
  // então: 30 dias a 700 com mínimo 650, 14 inflados a 900, hoje 690 → abaixo da mediana 10%+, mas acima de low30 650
  expect(priceSignal(690, days([...Array(16).fill(650), ...Array(14).fill(900)]), "2026-11-20").kind).not.toBe("drop");
});
it("ruído grande exige queda além de 2 spreads", () => {
  // oscila 500..700 (MAD alto); 540 está 10% abaixo da mediana 600 mas dentro do ruído
  expect(priceSignal(540, days([500, 700, 520, 680, 600, 560, 640]), "2026-11-20").kind).toBe("normal");
});
it("acima do normal", () => expect(priceSignal(640, days([600, 600, 600, 600]), "2026-11-20").kind).toBe("high"));
it("ignora dias de hoje em diante e além de 90 dias", () => /* um dia a 100 há 120 dias e um dia hoje a 100 não mudam normal */);
it("brazilDay usa o fuso de Brasília", () => expect(brazilDay("2026-11-20T02:00:00.000Z")).toBe("2026-11-19"));
it("verdictOf: condição atingida por queda vira good com a frase exata", () => {
  expect(verdictOf({ rule: priceDropRule, conditionMet: true, hitProduct: 0, products: [pegasus(599, signalDrop(679))] }).reason)
    .toBe("O menor preço em 30 dias, R$ 80 abaixo do normal.");
});
it("verdictOf: sem condição, high e normal e learning com as frases exatas", ...);
it("verdictOf: produto sem best não motiva veredito; sem nenhum best é none", ...);
```

Os testes da metade do dobro e do ruído devem ser escritos com séries cujas contas deem exatamente o resultado esperado. Conferir à mão a mediana e o MAD de cada série no próprio teste, num comentário.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd ../tone-server && pnpm --filter shared test -- price-signal`
Expected: FAIL (módulo inexistente).

- [ ] **Step 3: Implementar** `price-signal.ts` e os contratos. Mediana e MAD por ordenação simples. O produto de `verdictOf` é `hitProduct` quando `conditionMet`; senão, o de menor `best.amount / signal.normal` entre os que têm `signal` completo; senão, o primeiro com `best`. O `N` das frases é `signal.days`, limitado a 90. Valores em reais com `toLocaleString("pt-BR")`, sem centavos a partir de R$ 100 (mesma regra de `PriceChart.brl`). Atualizar o texto explicativo de `price_drop` em `watch.ts` para: `Comparo cada preço com o normal deste produto nos últimos 90 dias e aviso quando ele fica 10% ou mais abaixo, igual ou abaixo do menor preço dos 30 dias anteriores e fora da oscilação de sempre. Sem histórico ainda, a referência é o primeiro preço que eu observar.`

- [ ] **Step 4: Rodar e ver passar**

Run: `cd ../tone-server && pnpm --filter shared test && pnpm -r typecheck`
Expected: PASS.

- [ ] **Step 5: Commit** (servidor, branch `feat/resultados-paineis`)

```bash
git add packages/shared
git commit -m "feat(shared): sinal de preço robusto (mediana 90d, menor de 30d, MAD), veredito e contrato do resumo do painel"
```

### Task 2: Séries por produto e o aviso com o sinal novo

**Files:**
- Modify: `../tone-server/apps/server/src/watch-evaluate.ts` (nova `productOf`; `ObservedMatch.product`; ramo `price_drop` nas linhas ~205-219; contexto de `evaluateRun` nas linhas ~125-135)
- Modify: `../tone-server/apps/server/src/watch-prices.ts` (nova `productHistory`; `priceHistory` sem ofertas com `limitation`; remover `typicalPrice`)
- Modify: `../tone-server/apps/server/src/watch-runner.ts:273-300` (contexto da avaliação)
- Test: `../tone-server/apps/server/test/watch-evaluate.test.ts`, `watch-prices.test.ts`, `watch-runner.test.ts`

**Interfaces:**
- Consumes: `priceSignal`, `brazilDay`, `PRICE_SIGNAL`, `DailyLow` (Task 1).
- Produces:
  - `productOf(rule: WatchRule, title: string): number`, o índice do primeiro `rule.products[i]` cujos tokens do título estão todos no título; `0` para painel sem produtos ou `discovery`; `-1` quando nenhum casa.
  - `ObservedMatch.product: number`, preenchido em `evaluateRun`.
  - `productHistory(db, watch: Watch, now: Date): Promise<DailyLow[][]>`, uma série por produto (índice = `productOf`), dias em `brazilDay`, 90 dias, sem ofertas com `limitation` ou `amount` nulo; `price_observations` entram pelo produto da oferta de mesma chave.
  - Contexto de `evaluateRun` troca `typical` por `history?: DailyLow[][]`, `today?: string` e `lastAlerts?: Map<number, { amount: number; at: string }>`.

- [ ] **Step 1: Testes que falham**

`watch-prices.test.ts`:
- `it("série por produto separa os dois tênis")`: leituras com "Nike Pegasus 41" a 600/590 e "Adidas Adizero SL" a 650 em dois dias → duas séries com os menores de cada um.
- `it("oferta com limitation não entra na série")`: um dia com oferta a 300 com `limitation` (fora da faixa) e outra a 600 → menor do dia 600.
- `it("painel só com query vira uma série")`.
- `it("dia da leitura é o de Brasília")`: `observed_at` `2026-11-20T01:00:00Z` vira `2026-11-19`.

`watch-evaluate.test.ts`:
- `it("queda relevante por produto avisa uma vez por produto")`: histórico de 5 dias a 680 para Pegasus e 650 para Adizero; leitura com Pegasus a 599 em duas lojas e Adizero a 650 → um hit, da oferta mais barata do Pegasus, com `match.product === 0`.
- `it("não avisa de novo se não caiu 3% abaixo do último aviso")`: `lastAlerts` com Pegasus a 599 → leitura a 598 sem hit; a 580 com hit.
- `it("avisa de novo depois de voltar ao normal")`: `lastAlerts` Pegasus 599 em `2026-11-10`; histórico com um dia a 670 depois disso (≥ 95% de 680) → leitura a 599 com hit.
- `it("sem 3 dias de histórico usa o primeiro preço visto")`: comportamento atual mantido.

`watch-runner.test.ts`:
- `it("o runner passa a série por produto e os últimos avisos ao avaliador")`: um aviso de condição anterior no banco faz a leitura seguinte ao mesmo preço não criar notificação.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd ../tone-server && pnpm --filter server test -- watch-evaluate watch-prices watch-runner`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- `productOf` reaproveita `tokens` como `matchOf` já faz.
- Em `evaluateRun`, `price_drop` com `history[product]` de pelo menos `minDays` dias: `priceSignal(match.amount, history[product], today)`; hit quando `kind === "drop"` e passa o portão de novo aviso (`!last || amount ≤ last.amount × (1 − realertStep) || algum dia de history[product] depois de last.at com amount ≥ signal.normal × reset`). Fica só o hit mais barato por produto. Motivo do hit: `${Math.floor(belowNormal × 100)}% abaixo do preço normal deste produto`. Com menos dias, o ramo atual contra `baselines`. `drop_percent` legado continua como está.
- Runner: `history` = `productHistory(...)` com os dias `< today` (`today = brazilDay(now)`), só quando a condição é `price_drop`; `lastAlerts` a partir de `watch_notifications` (`kind = 'condition'`, deste painel), lendo `payload.match.product` e `payload.match.amount`, o mais recente por produto.
- `watchPrices` (gráfico atual) passa a usar `productHistory` e pegar o menor de cada dia entre os produtos, já sem `limitation`.

- [ ] **Step 4: Rodar e ver passar**

Run: `cd ../tone-server && pnpm --filter server test && pnpm -r typecheck`
Expected: PASS (atualizar os testes antigos que dependiam de `typicalPrice` ou de ofertas com `limitation` na série, dizendo no commit quais mudaram e por quê).

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/watch-evaluate.ts apps/server/src/watch-prices.ts apps/server/src/watch-runner.ts apps/server/test
git commit -m "fix(watches): queda medida por produto, sem ofertas suspeitas, contra o menor de 30 dias e o ruído; sem e-mail a cada real"
```

### Task 3: Resumo do painel

**Files:**
- Create: `../tone-server/apps/server/src/watch-summary.ts`
- Modify: `../tone-server/apps/server/src/app.ts` (rota ao lado de `/api/watches/:id/prices`, linha ~1019)
- Test: `../tone-server/apps/server/test/watch-summary.test.ts`

**Interfaces:**
- Consumes: `productHistory`, `productOf` (Task 2); `priceSignal`, `verdictOf`, `WatchSummary` (Task 1).
- Produces: `watchSummary(db, watch: Watch, now?: Date): Promise<WatchSummary>`; `GET /api/watches/:id/summary` → `WatchSummary` (404 como a rota de preços).

- [ ] **Step 1: Testes que falham**
- `it("resume dois produtos com melhor preço, anterior e sinal")`: Pegasus hoje 599 (ontem 679, cinco dias a ~680) e Adizero 649 estável → `products[0].best.amount === 599`, `previous === 679`, `signal.kind === "drop"`; verdict `good` quando a última leitura tem `condition_met = 1`, com a frase exata.
- `it("produto sem oferta confiável hoje fica sem best e fora do veredito")`.
- `it("sem leitura nenhuma o veredito é none")`.
- `it("a rota responde 404 para painel de outra pessoa")` (com `appWith` de `test/helpers.ts`).

- [ ] **Step 2: Rodar e ver falhar**: `pnpm --filter server test -- watch-summary` → FAIL.

- [ ] **Step 3: Implementar.** A leitura de referência é a mais recente `ok`/`partial` com ofertas (como `readingOf` no web). `best` é a oferta sem `limitation` de menor `amount` de cada produto nela. `previous` é o último ponto da série com dia anterior ao da leitura. `signal` é `priceSignal(best.amount, pontos anteriores ao dia da leitura, dia da leitura)`. `points` são os últimos 30 dias da série. `hitProduct` é o `product` do hit da notificação de condição dessa leitura, quando existe.

- [ ] **Step 4: Rodar e ver passar**: `pnpm --filter server test && pnpm -r typecheck` → PASS.

- [ ] **Step 5: Commit**: `git commit -m "feat(watches): resumo do painel com veredito e um item por produto"`

### Task 4: Painel separado da conversa e e-mail com link do painel

**Files:**
- Modify: `../tone-server/apps/server/src/db/index.ts` (migração nova no fim de `MIGRATIONS`)
- Modify: `../tone-server/apps/server/src/app.ts:626-660` (`POST /api/sessions` ignora `watchId`)
- Modify: `../tone-server/apps/server/src/watch-outbox.ts:418-470` (`centerUrl`, `compose`)
- Test: `../tone-server/apps/server/test/panel-sessions.test.ts` (reescrever), `watch-outbox.test.ts`

**Interfaces:**
- Produces: nenhuma sessão nova com `watch_id`; e-mail de condição com `${publicUrl}/paineis/${watch_id}`.

- [ ] **Step 1: Testes que falham**
- `panel-sessions.test.ts`, substituindo o conteúdo: `it("conversas de painel antigas passam a fazer parte do chat")`: sessão com `watch_id` antes da migração aparece em `chatSessions` depois. `it("abrir sessão com watchId cria uma sessão comum, sem saudação de painel")`.
- `watch-outbox.test.ts`: `it("aviso de condição leva à página do painel")`: o texto contém `/paineis/w1`. `it("resumo diário põe o link de cada painel")`.

- [ ] **Step 2: Rodar e ver falhar**: `pnpm --filter server test -- panel-sessions watch-outbox` → FAIL.

- [ ] **Step 3: Implementar.** Migração com comentário `// 20/11/2026: painel e conversa separados; as conversas de painel entram no chat.` e `UPDATE sessions SET watch_id = NULL WHERE watch_id IS NOT NULL;`. No aviso, trocar "Ver na central de acompanhamentos" por `Ver o painel: …/paineis/<id>`. No resumo, cada seção ganha `Ver o painel: …`, mais o link geral no fim. Remover o teste antigo `panel context reaches the model on every turn` e o ramo de saudação de painel. `panelNote` e `panelContext` saem se nada mais os usar.

- [ ] **Step 4: Rodar e ver passar**: `pnpm --filter server test && pnpm -r typecheck` → PASS.

- [ ] **Step 5: Commit**: `git commit -m "feat(watches): painel sem conversa própria e e-mail que leva ao painel"`

### Task 5: Script de calibração

**Files:**
- Create: `../tone-server/apps/server/scripts/price-signal-backtest.ts`
- Modify: `../tone-server/apps/server/package.json` (script `backtest:prices`)

**Interfaces:**
- Consumes: `productHistory`, `productOf`, `priceSignal`, `PRICE_SIGNAL`.

- [ ] **Step 1: Implementar.** Abre o banco pela configuração do servidor (o mesmo caminho do `cli.ts`). Para cada painel `price_drop`, refaz dia a dia o aviso antigo (10% contra a mediana de 30 dias, todas as ofertas) e o novo (com portão de novo aviso). Imprime uma linha por painel (`id`, dias, avisos antigos, avisos novos) e os totais. Aceita `--drop 0.1 --k 2` para testar outros limiares. Só lê; nunca escreve no banco.
- [ ] **Step 2: Verificar** com o banco de teste local: `pnpm --filter server backtest:prices` imprime os totais sem erro.
- [ ] **Step 3: Commit**: `git commit -m "chore(watches): script que compara o aviso de queda antigo e o novo nas leituras guardadas"`

### Task 6: Web — sincronizar, cartão da coluna e conversa sem painel

**Files:**
- Modify (gerado): `src/tone/*` via `npm run sync:shared -- ../tone-server`
- Modify: `src/conversas/api.ts` (`watchSummary`)
- Create: `src/conversas/price-delta.ts`
- Modify: `src/conversas/Panels.tsx:72-200` (`PanelCard`)
- Modify: `src/conversas/Conversation.tsx` (remover modo conversa de painel: props `sessionId`/`panelId`/`first`, `backLink`, `panelTitle`, bloco `panels` ~474-501, `panelsAfter` ~1086-1094 e ~1169-1171, cabeçalho ~1325-1370)
- Modify: `src/app/conversas/[id]/page.tsx` (sempre `redirect("/conversas?em=" + id)`)
- Modify: `src/conversas/picked-handoff.ts` (`pickForChat`, `takeChatPicked`)
- Modify: `src/conversas/WatchReadings.tsx` (fica só `OfferList` e `Match`; sai `WatchReadings`)
- Test: `test/price-delta.test.ts`, `test/central.test.tsx`, `test/chat.test.tsx`, `test/picked-handoff.test.ts`

**Interfaces:**
- Consumes: `WatchSummary` (Task 1), rota da Task 3.
- Produces: `api.watchSummary(id: string, opts?: { fresh?: boolean }): Promise<WatchSummary | null>` (mesmo cache e invalidação de `watchPrices`); `priceDelta(best: number | null, previous: number | null): { text: string; good: boolean } | null`; `pickForChat(product: PickedProduct): void`, `takeChatPicked(): PickedProduct | null`.

- [ ] **Step 1: Testes que falham**
- `price-delta.test.ts`: `priceDelta(599, 679)` → `{ text: "↓ R$ 80", good: true }`; `priceDelta(679, 649)` → `{ text: "↑ R$ 30", good: false }`; `priceDelta(649, 649)` → `{ text: "igual", good: false }`; `priceDelta(649, null)` → `null`.
- `central.test.tsx`: com `api.watchSummary` simulado (dois produtos, veredito good), o cartão mostra "Pegasus 41", "R$ 599", "↓ R$ 80", "Adizero SL", "igual", "Bom momento" e "Lido". Painel com quatro produtos mostra três e "+ 1".
- `picked-handoff.test.ts`: `pickForChat` e depois `takeChatPicked` devolvem o produto uma vez só.
- `chat.test.tsx`: a conversa não desenha leituras de painel mesmo com um painel confirmado na sessão.

- [ ] **Step 2: Rodar e ver falhar**: `npm test -- price-delta central picked-handoff chat` → FAIL.

- [ ] **Step 3: Implementar.**
- No cartão, uma linha por produto (miniatura `size-7 rounded-thumb bg-sunken` com a foto quando `isAllowedImage`, nome, `best.priceText`, `priceDelta`). Produto sem `best`: "sem oferta". Etiqueta `Bom momento` (`rounded-tag bg-accent-soft text-accent-text text-label`) quando `verdict.kind === "good"`, e `Lido {quando}` em `text-caption text-graphite`.
- Mantêm-se os avisos de problema, leitura antiga, e-mail silenciado, rascunho e primeira leitura. Sai a `Sparkline` do cartão; o componente continua, porque a página o usa.
- Cartão do painel aberto: `aria-current="page"` e anel `ring-2 ring-ink` quando `usePathname()` é `/paineis/<id>`.
- O chat lê `takeChatPicked()` uma vez ao montar.

- [ ] **Step 4: Rodar e ver passar**: `npm test && npm run lint && npm run check:design && npx tsc --noEmit` → PASS.

- [ ] **Step 5: Commit** (web, branch `feat/resultados-paineis`): `git commit -m "feat(paineis): cartão com um preço e a mudança por produto; conversa sem leituras nem modo de painel"`

### Task 7: Web — página do painel com o veredito

**Files:**
- Create: `src/conversas/PanelVerdict.tsx`, `src/conversas/PanelProducts.tsx`
- Modify: `src/conversas/PanelPage.tsx` (`PanelView` e `PanelPage`)
- Modify: `src/conversas/PriceChart.tsx` (aceita série de um produto, sem mudar o desenho)
- Modify: `docs/analytics.md`
- Test: `test/panel-page.test.tsx`

**Interfaces:**
- Consumes: `api.watchSummary`, `priceDelta`, `pickForChat` (Task 6).
- Produces: `PanelVerdict(props: { summary: WatchSummary; onStore: () => void })`; `PanelProducts(props: { products: WatchSummaryProduct[] })`.

- [ ] **Step 1: Testes que falham** (`panel-page.test.tsx`, adaptando os atuais)
- `it("abre com o veredito, depois os produtos")`: "Bom momento para comprar", "Pegasus 41 por R$ 599", "O menor preço em 30 dias, R$ 80 abaixo do normal." e o link "Ver na loja" com o `url` da oferta, nessa ordem, antes da lista de produtos.
- `it("veredito learning e normal com seus rótulos")`.
- `it("não oferece conversa do painel")`: não há "Conversar sobre este painel" nem "Conversas deste painel".
- `it("Perguntar abre a conversa central com o produto")`: tocar "Perguntar" numa oferta chama `pickForChat` e `router.push("/conversas")`.
- `it("histórico troca de produto")`: em "Histórico e leituras", escolher "Adizero SL" passa a série dele ao gráfico.

- [ ] **Step 2: Rodar e ver falhar**: `npm test -- panel-page` → FAIL.

- [ ] **Step 3: Implementar.** A ordem segue o spec: cabeçalho ("← Conversa" para `/conversas`), veredito, produtos, `details` "Todas as ofertas" (`OfferList` com o nome do produto em cada oferta e `limit` 20) e `details` "Histórico e leituras" (seletor de produto em botões `rounded-full`, `PriceChart`, leituras anteriores).
- O veredito fica num bloco `rounded-card bg-accent-soft p-5` quando `good`; nos outros estados, um bloco `bg-surface shadow-raised`. O rótulo vai em `text-small font-semibold`, com `text-accent-text` só no `good`. A frase do produto é `{best.title curto} por {priceText}`, e "Ver na loja" é o `StoreLink` existente com o `url`.
- Antes de desenhar, ler `node_modules/@toneorg/design/DESIGN.md` e as fichas `surface.md`, `button.md`, `feedback.md`. Se o bloco `accentSoft` não for um uso coberto para o app, registrar isso no PR e manter o bloco em `surface` (fallback).
- Saem `sessions`, `onTalk`, `opening` e a chamada a `api.panelSessions`. `onAsk` chama `pickForChat` e depois `router.push("/conversas")`.
- Telemetria: `panel_page_opened` ganha `verdict`; `panel_verdict_store_clicked`; `panel_asked_in_chat` (no lugar de `panel_conversation_started`). Documentar em `docs/analytics.md`.

- [ ] **Step 4: Rodar e ver passar**: `npm test && npm run lint && npm run check:design && npx tsc --noEmit && npm run build` → PASS.

- [ ] **Step 5: Commit**: `git commit -m "feat(paineis): página do painel com veredito, um item por produto e histórico por produto"`

### Task 8: Verificação ponta a ponta

- [ ] **Step 1:** servidor local com banco de teste e leituras semeadas para um painel de dois produtos (cinco dias, a última com queda do Pegasus e `condition_met`).
- [ ] **Step 2:** web local apontando para ele. Esperado: o cartão mostra uma linha por produto, "↓ R$ 80" e "Bom momento"; a página abre com o veredito; "Perguntar" leva ao chat com o produto escolhido; o chat não mostra leituras.
- [ ] **Step 3:** prints no PR. Rodar `backtest:prices` no banco local e colar os totais no PR.
