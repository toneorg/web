# Painéis e conversas separados — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar painéis de conversas: "Suas conversas" só com conversas de verdade, cada painel com página própria de resultados e conversas guardadas dentro dele.

**Architecture:** O servidor (`toneorg/extension`) ganha o vínculo `sessions.watch_id`, filtra `GET /api/sessions`, lista as conversas de um painel e injeta o contexto do painel em cada turno dessas conversas. O web ganha a rota `/paineis/[id]` (resultados + atalhos que abrem conversas do painel), o card do painel leva para ela (rascunho reabre o modal) e a tela inicial ganha mini gráfico e coluna mais larga.

**Tech Stack:** Hono + SQLite/Postgres (servidor), zod em `packages/shared`, Next.js (versão do repo; ler `node_modules/next/dist/docs/` antes de criar rota), Tailwind com `@toneorg/design`, vitest.

**Spec:** `docs/superpowers/specs/2026-11-10-paineis-e-conversas-design.md`

## Global Constraints

- Contratos só em `toneorg/extension/packages/shared`; o web recebe por `node scripts/sync-tone-shared.mjs ../tone-extension`. Nunca editar `src/tone/` do web.
- Esquema: migração SQLite em `apps/server/src/db/index.ts` (`MIGRATIONS`, só acrescentar no fim) e Postgres em `supabase/migrations/<timestamp>_<nome>.sql` com `SET LOCAL search_path = tone, public;`.
- Cor, raio e tipo só por tokens de `@toneorg/design`; `npm run check:design` no web.
- Rodar `/better-ui` e `/better-layout` sobre página do painel, card do painel e tela inicial antes de dar por pronto.
- Textos da interface em português do Brasil, "a pessoa" nos comentários.
- Checks antes de commitar — extensão: `pnpm lint && pnpm typecheck && pnpm test`; web: `npx tsc --noEmit -p . && npm run lint && npm test && npm run check:design`.
- Deploy: `pnpm --filter @tone/server db:migrate` (com `NODE_EXTRA_CA_CERTS="$PWD/certs/supabase-root-2021.crt"`), depois `fly deploy --app tone-extension --ha=false`, depois push do web na `main`.

## Review Focus

- Sessão de criação antiga com uma só mensagem da pessoa: some de "Suas conversas" e não aparece em "Conversas deste painel". (Task 1, teste `legacy creation session with one message stays hidden`.)
- Painel excluído: suas conversas não voltam para "Suas conversas" e `GET /api/watches/:id/sessions` responde 404. (Task 1, teste `deleted panel keeps its conversations hidden`.)
- Criar sessão com `watchId` de outra pessoa: 404, nada gravado. (Task 1, teste `foreign watchId is refused`.)
- Painel sem nenhuma leitura ainda: a página mostra o estado vazio, sem gráfico e sem lista quebrada. (Task 4, teste `panel page without readings shows the first-reading note`.)
- Abrir uma conversa de painel e voltar: o "←" leva ao painel, não a "Conversas". (Task 5, teste `panel conversation back link points to the panel`.)

---

### Task 1: Servidor — vínculo sessão ↔ painel e listas

**Files:**
- Modify: `tone-extension/packages/shared/src/api.ts` (SessionCreate, novo `PanelSession`)
- Modify: `tone-extension/apps/server/src/db/index.ts` (fim de `MIGRATIONS`)
- Create: `tone-extension/supabase/migrations/20261111120000_session_watch.sql`
- Modify: `tone-extension/apps/server/src/app.ts` (`POST /api/sessions`, `GET /api/sessions`, nova `GET /api/watches/:id/sessions`)
- Test: `tone-extension/apps/server/test/panel-sessions.test.ts`

**Interfaces:**
- Produces: `SessionCreate.watchId?: string` (1–60). Coluna `sessions.watch_id TEXT NULL` + índice `sessions_watch(watch_id)`.
- Produces: `PanelSession = { id: string; title: string; lastAt: string; messages: number; origin: "panel" | "creation" }`; `GET /api/watches/:id/sessions → PanelSession[]` (mais recente primeiro).
- Regra de "Suas conversas": exclui `s.watch_id IS NOT NULL` e sessões que são `watches.session_id` de qualquer painel da pessoa (inclusive excluído).
- Regra da lista do painel: sessões com `watch_id = :id` e mensagem da pessoa (`origin: "panel"`, título = primeira mensagem), mais a sessão de criação quando tiver **2 ou mais** mensagens da pessoa (`origin: "creation"`, título `"Como este painel começou"`). Painel inexistente, de outra pessoa ou `status = 'deleted'` → 404.

- [ ] **Step 1: Testes que falham** (helpers de `test/helpers.ts`: `appWith`, `seedUser`, `seedSession`, `auth`)
  - `panel conversation is hidden from the conversation list` — cria watch, `POST /api/sessions {site:null, watchId}`, grava mensagem da pessoa; `GET /api/sessions` não contém o id; `GET /api/watches/:id/sessions` contém `{origin:"panel"}`.
  - `creation session is hidden and listed only with two or more messages` — sessão de criação com 2 mensagens aparece com título `"Como este painel começou"`, `origin:"creation"`.
  - `legacy creation session with one message stays hidden` — some das duas listas.
  - `deleted panel keeps its conversations hidden` — após `DELETE /api/watches/:id`, `GET /api/sessions` continua sem as sessões; `GET /api/watches/:id/sessions` → 404.
  - `foreign watchId is refused` — `POST /api/sessions` com watch de outra pessoa → 404 e nenhuma linha nova em `sessions`.
- [ ] **Step 2:** `pnpm --filter @tone/server exec vitest run test/panel-sessions.test.ts` → FAIL.
- [ ] **Step 3:** Migração (SQLite e Postgres: `ALTER TABLE sessions ADD COLUMN watch_id TEXT REFERENCES watches(id) ON DELETE SET NULL; CREATE INDEX sessions_watch ON sessions(watch_id);`), schema, rotas. No Postgres, repetir o bloco RLS só se criar tabela (aqui não cria).
- [ ] **Step 4:** testes passam; suite do servidor inteira passa.
- [ ] **Step 5:** commit `feat: conversas de painel ficam no painel`.

### Task 2: Servidor — contexto do painel em cada turno

**Files:**
- Modify: `tone-extension/apps/server/src/agent/agent.ts` (carregar `watch_id` da sessão; nota de contexto)
- Test: `tone-extension/apps/server/test/panel-sessions.test.ts` (mesmo arquivo)

**Interfaces:**
- Produces: `export function panelContext(watch: Watch, latest: { observedAt: string; matches: {title:string; store:string; priceText:string}[] } | null): string` em `agent.ts`. Texto entre parênteses, no padrão de `WATCH_INTENT`: título (`watchTitle`), condição (`watchFacts` "Quando avisar"), estado, e até 5 ofertas da última leitura (título sanitizado como `pickedContext`, loja, preço). Diz que a conversa é sobre esse painel e que ajustes da regra são feitos no próprio painel.
- Montado a cada mensagem da pessoa numa sessão com `watch_id` (estado atual), anexado como `extra` com `display: input.text`.

- [ ] **Step 1: Teste** `panel context reaches the model on every turn` — com `FAKE_LLM`/modelo falso do teste, enviar duas mensagens; a mensagem gravada (`messages.body`) de cada turno contém o título do painel; a exibida (`display`) é só o texto da pessoa. E `panelContext strips quotes and brackets from store titles`.
- [ ] **Step 2:** rodar → FAIL. **Step 3:** implementar. **Step 4:** passa + suite. **Step 5:** commit `feat: conversa do painel sabe do painel`. Atualizar a linha BETA-06/T16 de `docs/requisitos.md` neste commit.

### Task 3: Sincronizar contratos e API do web

**Files:**
- Run: `node scripts/sync-tone-shared.mjs ../tone-extension` (web)
- Modify: `web/src/conversas/api.ts`

**Interfaces:**
- Produces: `api.newSession(onboarding = false, watchId?: string)`; `api.panelSessions(watchId: string): Promise<PanelSession[]>` (sem cache).
- Produces: `export function pickForSession(sessionId: string, product: PickedProduct): void` e `takePicked(sessionId: string): PickedProduct | null` em `web/src/conversas/picked-handoff.ts` (sessionStorage, chave `tone:picked:<sessionId>`, try/catch; `take` apaga).

- [ ] Teste `web/test/picked-handoff.test.ts`: guardar e tirar devolve o produto uma vez; segunda vez `null`; JSON inválido → `null`.
- [ ] Implementar, rodar checks do web, commit `chore: sincroniza contratos de conversas de painel`.

### Task 4: Página do painel `/paineis/[id]`

**Files:**
- Create: `web/src/app/paineis/layout.tsx` (mesma moldura/fontes de `src/app/conversas/layout.tsx`; extrair para um componente compartilhado se for copiar mais de 5 linhas)
- Create: `web/src/app/paineis/[id]/page.tsx`
- Create: `web/src/conversas/PanelPage.tsx`
- Modify: `web/src/conversas/WatchReadings.tsx` (aceitar `sessionId: string | null`, `onAsk?: (match) => void`, sem o cabeçalho quando `embedded`)
- Modify: `web/src/conversas/Panels.tsx` (exportar `PanelMenu`/ações para reuso; ver Task 6)
- Test: `web/test/panel-page.test.tsx`

**Interfaces:**
- `PanelPage(props: { watchId: string })` dentro de `Shell` (current `"conversas"`). Carrega `api.watch`, `api.watchResults`, `api.watchPrices`, `api.panelSessions`.
- Ordem: "← Conversas" (volta à inicial), título + estado + menu de ações; `PriceChart` se ≥2 pontos, senão a nota "O gráfico do preço aparece a partir do segundo dia de leitura."; última leitura (quando, quantas ofertas, menor preço e loja); lista de produtos (`WatchReadings` embutido) com "Perguntar" por produto; botão "Conversar sobre este painel"; "Conversas deste painel" (só se houver).
- "Perguntar": `api.newSession(false, watchId)` → `pickForSession(id, {url, title, price: amount, image: imageUrl})` → `router.push(/conversas/<id>?painel=<watchId>)`. "Conversar sobre este painel": igual sem produto.
- Painel 404 → "Este painel não existe mais." com link para a inicial.

- [ ] Testes (render estático com dados): `panel page without readings shows the first-reading note`; `panel page lists products with an ask action`; `panel conversations section is absent when there are none`.
- [ ] Implementar; rodar `/better-ui` e `/better-layout` sobre a página e aplicar; checks; commit `feat: página do painel`.

### Task 5: Conversa de painel

**Files:**
- Modify: `web/src/app/conversas/[id]/page.tsx` (ler `painel`)
- Modify: `web/src/conversas/Conversation.tsx` (prop `panelId: string | null`; voltar para `/paineis/<id>` com o título do painel; `takePicked` no mount; não renderizar `WatchReadings` quando `panelId`)
- Test: `web/test/shell.test.tsx` ou novo `web/test/panel-conversation.test.tsx`

- [ ] Teste `panel conversation back link points to the panel` (helper puro `backLink(panelId, title)` → `{ href: "/paineis/w1", label: "← iPhone 18" }`; sem painel → `{ href: "/conversas", label: "← Conversas" }`).
- [ ] Implementar, checks, commit `feat: conversa do painel volta para o painel`.

### Task 6: Card do painel e tela inicial

**Files:**
- Modify: `web/src/conversas/Panels.tsx` (link do card → `/paineis/<id>`; rascunho → abre `NewPanelSheet` com o rascunho; mini gráfico)
- Create: `web/src/conversas/Sparkline.tsx`
- Modify: `web/src/conversas/NewPanel.tsx` (`NewPanelSheet` aceita `draft?: Watch`; começa em `review`, `sessionId = draft.sessionId`)
- Modify: `web/src/conversas/Shell.tsx` (largura e margens)
- Test: `web/test/sparkline.test.tsx`

**Interfaces:**
- `Sparkline(props: { points: WatchPricePoint[] })`: SVG 100% × 28px, só a linha (token de cor `ink`), `aria-hidden`; nada com menos de 2 pontos. O card busca `api.watchPrices` só quando confirmado (já faz) e mostra `Sparkline` no lugar do `PriceChart` completo (o completo fica na página do painel).
- Shell: `max-w-7xl` → `max-w-[90rem]`, `px-4 md:px-6` mantém no celular, `lg:px-8`; coluna `minmax(18rem,26rem)`. Ajuste final decidido pelo `/better-layout`.

- [ ] Teste: `sparkline draws nothing below two points`; `sparkline path spans the width`.
- [ ] Implementar; `/better-ui` + `/better-layout` no card e na inicial; checks; commit `feat: card do painel leva à página do painel`.

### Task 7: Deploy e verificação

- [ ] Extensão: merge na `main`, push, `db:migrate`, `fly deploy`. Web: sync final, push na `main`, esperar status Vercel `success`.
- [ ] Verificar no Chrome (app publicado, conta da pessoa): "Suas conversas" sem conversas de painel; card abre a página do painel; "Perguntar" abre conversa que volta ao painel e não aparece em "Suas conversas". Sem criar painel novo.
