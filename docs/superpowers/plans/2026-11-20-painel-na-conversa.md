# Painel criado pela conversa — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "crie um painel desse tênis" na conversa mostra o cartão do plano no chat, com perguntas tocáveis e "Abrir painel" depois de confirmar.

**Architecture:** o agente da conversa já tem `draft_watch` e o chat já desenha `WatchDraft`. O plano amplia o prompt, dá ao cartão duas ações novas (`answer_watch`, `open_panel`) no `packages/genui-react` do servidor, liga essas ações no web e faz a folha do "+" revisar rascunhos reabertos numa sessão própria, marcada para ficar fora do chat.

**Tech Stack:** servidor Hono + vitest (`../tone-server`, pnpm); web Next.js 16 + vitest (`npm test`); contratos e componentes copiados do servidor por `npm run sync:shared -- ../tone-server`.

**Spec:** `docs/superpowers/specs/2026-11-20-painel-na-conversa-design.md` (o item 1 do servidor foi cancelado; ver o texto dele).

## Global Constraints

- `src/tone/shared` e `src/tone/genui` no web são gerados: editar só em `../tone-server/packages/{shared,genui-react}/src` e sincronizar.
- Interface segue `@toneorg/design`; nenhuma cor à mão; `npm run check:design` passa.
- Testes de modelo só com os modelos baratos já em uso; nenhum teste live novo.
- Textos de interface em português, frases curtas, no tom da tone.
- Nenhuma pesquisa ou aviso roda antes de a pessoa confirmar o painel.

## Review Focus

- Responder as perguntas de um cartão antigo (não é a última resposta): o cartão não oferece opções tocáveis; só o último cartão vivo responde.
- Rascunho do chat reaberto na coluna e respondido na folha: a sessão nova da folha não aparece no chat (teste em `chat.test.ts`, Task 1).
- Painel confirmado no chat e depois excluído: "Abrir painel" num cartão antigo leva à página que diz "Este painel não existe mais" (comportamento atual de `PanelPage`; nenhuma mudança, só verificar à mão).
- Duas respostas tocadas em sequência rápida: a segunda espera o turno da primeira (o chat já bloqueia com `busy`; teste no web, Task 3).
- Pedido "crie um painel" sem produto claro na conversa: o agente rascunha com perguntas, não pesquisa (coberto pela regra do prompt, Task 1).

---

### Task 1: Servidor — prompt e respostas em sessão nova

**Files:**
- Modify: `../tone-server/apps/server/src/agent/prompt.ts:27`
- Modify: `../tone-server/apps/server/src/agent/agent.ts:221` (montagem de `watchNote`) e `:974-975` (`watchAnswer`)
- Modify: `../tone-server/apps/server/src/chat.ts:11` (exportar `NEW_PANEL_MARK`)
- Test: `../tone-server/apps/server/test/agent.test.ts`, `../tone-server/apps/server/test/chat.test.ts`

**Interfaces:**
- Produces: `export const NEW_PANEL_MARK = "(Enviado pelo botão Novo painel"` em `chat.ts`; `watchAnswer(watch: Watch, fresh: boolean): string` em `agent.ts`.

- [ ] **Step 1: Testes que falham**

Em `agent.test.ts`:
- `it("resposta da folha numa sessão nova leva a marca e a regra do rascunho")`: semear usuário e um rascunho (`WatchStore.saveDraft`) com produto "Pegasus 41"; sessão nova sem mensagens; turno `{ type: "message", text: "Qual modelo? Pegasus 41", intent: "watch", watchId }`; a mensagem guardada da pessoa contém `NEW_PANEL_MARK`, `"Pegasus 41"` (da regra descrita) e `watchId`.
- `it("resposta do cartão no chat não leva a marca")`: sessão com uma mensagem anterior da pessoa; mesmo turno; a mensagem guardada contém `watchId` e **não** contém `NEW_PANEL_MARK`.
- `it("o prompt manda usar os produtos já mostrados para criar painel")`: o texto de `systemPrompt` (a função exportada por `prompt.ts`) contém `"crie um painel"` e `"sem research_products"`.

Em `chat.test.ts`:
- `it("sessão de folha aberta para responder um rascunho fica fora do chat")`: sessão cuja primeira mensagem guardada tem `NEW_PANEL_MARK` e um painel com `session_id` nela não aparece em `chatSessions`; uma sessão de chat com rascunho e primeira mensagem comum aparece.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd ../tone-server && pnpm --filter server test -- agent chat`
Expected: as quatro falham (marca ausente, prompt sem a frase).

- [ ] **Step 3: Implementar**

- `chat.ts`: `export` em `NEW_PANEL_MARK`.
- `agent.ts`: `fresh` = a sessão não tem mensagem da pessoa antes deste turno (consultar `messages` com `role = 'user'`). `intent === "watch"` com `watchId`: carregar o rascunho (`new WatchStore(db).get(userId, watchId)`) e usar `watchAnswer(watch, fresh)`. Com `fresh`, o texto começa com `NEW_PANEL_MARK + ": resposta a um rascunho.)"` e inclui `describeWatch(watch.draft).join("\n")`. Rascunho inexistente: segue como mensagem comum, sem nota.
- `prompt.ts:27`, acrescentar ao fim da regra de acompanhar (texto exato):

```
Pedidos como "crie um painel", "quero um painel pra esse", "acompanhe o preço desse/desses" também são pedidos de acompanhar. Quando a pessoa aponta produtos já mostrados nesta conversa (o produto escolhido, "esse", "desses dois", itens da lista curta), chame draft_watch neste turno, sem research_products: um item em products por produto apontado (até cinco), com o título completo da oferta como apareceu (marca, modelo, cor ou variante), url e offerId da oferta. Variante (tamanho, cor) só se a pessoa disse ou se a oferta é dela; se o tamanho muda o preço e ela não disse, pergunte em rule.questions com opções.
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd ../tone-server && pnpm --filter server test -- agent chat && pnpm -r typecheck`
Expected: PASS.

- [ ] **Step 5: Commit** (no servidor, branch `feat/painel-na-conversa`)

```bash
git add apps/server/src/agent apps/server/src/chat.ts apps/server/test/agent.test.ts apps/server/test/chat.test.ts
git commit -m "feat(chat): painel pedido na conversa usa os produtos mostrados; resposta de folha em sessão nova fica fora do chat"
```

### Task 2: Cartão — perguntas tocáveis e "Abrir painel"

**Files:**
- Modify: `../tone-server/packages/genui-react/src/host.ts:21-31` (`GenUIAction`)
- Modify: `../tone-server/packages/genui-react/src/WatchDraft.tsx` (`WatchDraftView`, `WatchDraftLoader`)
- Modify: `../tone-server/packages/genui-react/src/components.tsx:1355-1365` (renderer `WatchDraft`)

**Interfaces:**
- Produces: `GenUIAction` ganha `{ type: "answer_watch"; watchId: string; text: string }` e `{ type: "open_panel"; watchId: string }`. `WatchDraftView` ganha a prop opcional `onOpenPanel?: () => void`. `WatchDraftLoader` ganha `interactive: boolean` e `onAct?: (action: GenUIAction) => void`.

- [ ] **Step 1: Implementar**

- Renderer: passa `interactive={host.interactive}` e `onAct={host.act}`.
- Loader: passa `onAnswer` a `WatchDraftView` só com `interactive && onAct`, como `(text) => onAct({ type: "answer_watch", watchId: watch.id, text })`; passa `onOpenPanel` com `onAct`, como `() => onAct({ type: "open_panel", watchId: watch.id })`.
- `WatchDraftView`: quando `live` (já calculado no componente) e `onOpenPanel` existe, mostra um botão "Abrir painel" no lugar da ação de confirmar, com a classe de botão secundário que o cartão já usa.

- [ ] **Step 2: Verificar**

Run: `cd ../tone-server && pnpm -r typecheck && pnpm --filter shared test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/genui-react/src
git commit -m "feat(genui): WatchDraft responde perguntas tocando no chat e abre o painel confirmado"
```

### Task 3: Web — ações do cartão e folha que revisa em sessão própria

**Files:**
- Modify (gerado): `src/tone/shared/*`, `src/tone/genui/*` via `npm run sync:shared -- ../tone-server`
- Modify: `src/conversas/Program.tsx:42-54` (`ProgramHost`), `:148-193` (`useWebHost`, `act`)
- Modify: `src/conversas/Conversation.tsx:1061-1078` (`hostFor`)
- Modify: `src/conversas/NewPanel.tsx:22-61` (`turn`)
- Test: `test/program.test.tsx`, `test/central.test.tsx` (ou um novo `test/new-panel.test.tsx`)

**Interfaces:**
- Consumes: as ações da Task 2.
- Produces: `ProgramHost.answerWatch: (watchId: string, text: string) => void`.

- [ ] **Step 1: Testes que falham**

Em `test/program.test.tsx`:
- `it("answer_watch manda as respostas como turno de painel")`: com um host falso, `act({ type: "answer_watch", watchId: "w1", text: "Qual modelo? Pegasus 41" })` chama `answerWatch("w1", "Qual modelo? Pegasus 41")`.
- `it("open_panel navega para a página do painel")`: com `next/navigation` simulado, `act({ type: "open_panel", watchId: "w1" })` chama `router.push("/paineis/w1")` e registra `track("watch_panel_opened_from_chat")`.

Em `test/new-panel.test.tsx`:
- `it("rascunho reaberto responde numa sessão nova")`: `NewPanel` com `draft` cujo `sessionId` é `"chat-1"`; tocar uma resposta chama `api.newSession` uma vez e `streamTurn` com outra sessão que não `"chat-1"`, levando `intent: "watch"` e `watchId`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- program new-panel`
Expected: FAIL (ação desconhecida; sessão `"chat-1"` usada).

- [ ] **Step 3: Implementar**

- Sincronizar: `npm run sync:shared -- ../tone-server`.
- `useWebHost.act`: `answer_watch` chama `host.answerWatch`, com `track("watch_draft_answered", { source: "conversation" })`; `open_panel` usa `useRouter().push`.
- `hostFor`: `answerWatch` faz como `answer`: ignora se `busy`, acrescenta a fala da pessoa (`said(item.session, text)`) e chama `runTurn({ type: "message", text, intent: "watch", watchId }, item.session)`.
- `NewPanel`: o estado inicial de `sessionId` passa a ser `null` mesmo com `props.draft`, para a primeira resposta abrir uma sessão nova (o servidor marca a sessão, Task 1).
- Atualizar `docs/analytics.md` com `watch_draft_answered` (source) e `watch_panel_opened_from_chat`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test && npm run lint && npm run check:design && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit** (no web, branch `feat/painel-na-conversa`)

```bash
git add src docs/analytics.md test
git commit -m "feat(conversas): cartão do painel responde tocando e abre o painel; folha revisa rascunho em sessão própria"
```

### Task 4: Verificação ponta a ponta

- [ ] **Step 1:** subir o servidor local com um modelo barato já configurado e o web com `TONE_API_URL` apontando para ele; criar uma conta de teste local (seed do servidor).
- [ ] **Step 2:** no chat, pesquisar "tênis de corrida Nike Pegasus 41", depois "crie um painel desse". Esperado: um `WatchDraft` no mesmo turno, produto com título completo, sem nova pesquisa.
- [ ] **Step 3:** tocar uma resposta (se houver perguntas), confirmar, tocar "Abrir painel". Esperado: página do painel; o chat continua com o trecho inteiro.
- [ ] **Step 4:** registrar o resultado (prints) no PR.
