# tone só na web: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Depois da aprovação, este arquivo é copiado para `web/docs/superpowers/plans/2026-11-14-tone-so-na-web.md`.

**Goal:** Acabar com a extensão do Chrome. A web (`heytone.app`) passa a ser o único cliente, e o servidor deixa de ter qualquer ramo que só existia para a extensão.

**Architecture:** O loop do agente e toda a pesquisa já rodam no servidor, e a web já filtra as ferramentas de navegador (`agent.ts:262-266`). O trabalho, portanto, é sobretudo apagar código:
- o ramo de protocolo dos `browser_*`;
- as execuções locais (T14);
- o login por Bearer;
- o CORS de `chrome-extension://`;
- `apps/extension` e o e2e.

Em seguida três recursos do painel lateral chegam à web: as conexões Google com as compras, as fotos de referência e as sessões de acesso. Por último, o repositório vira `toneorg/server` e o app do Fly vira `tone-server`.

**Tech Stack:**
- Servidor: Hono, PostgreSQL (Supabase) em produção e SQLite nos testes, zod, vitest, pnpm, Fly.
- Web: Next.js 16, React 19, Tailwind 4, `@toneorg/design`, vitest, Vercel.

**Spec:** não há documento de spec. As decisões tomadas nesta conversa (14/11/2026) estão abaixo e fazem o papel dela.

## Decisões da pessoa

1. **Repositório:** apagar `apps/extension` e renomear. O GitHub `toneorg/extension` vira `toneorg/server` e o app do Fly `tone-extension` vira `tone-server`.
2. **Amazon e Mercado Livre:** aceitar a perda. Os dois entram só pelo índice (Google Shopping) e pelo navegador remoto, e "adicionar ao carrinho" deixa de existir.
3. **Recursos que vão para a web:** conexões Google com as compras, fotos de referência e sessões de acesso. O "Teste de comparação" (benchmark) é apagado, junto com a seção dele no admin.
4. **Corte seco:** o Bearer e o token legado saem no mesmo deploy. Quem usava a extensão entra pela web com a mesma conta.

## Minhas decisões (palpites, confira)

- **Nome do app no Fly:** `tone-server`, com `PUBLIC_URL=https://tone-server.fly.dev`. O Fly não renomeia apps; é preciso criar um app novo e copiar os secrets.
- **Volta do OAuth do Google:** a página HTML do callback dá lugar a um redirect para `${WEB_URL}/conversas/perfil?conexao=<gmail|calendar>&estado=<ok|cancelada|erro|expirado>`.
- **Coluna `surface` no banco:** fica como está, sem migração destrutiva, e novas linhas gravam `web`. O campo `surface` sai de `SessionSummary` e `AccessSession` no contrato.
- **Valores legados que ficam no enum, só para leitura:** `"local_extension"` (fonte de leitura de painel) e `"extension"` (`PriceProvenance`). Leituras antigas no banco precisam continuar passando no parse.
- **`page.ts`:** mantém `PageSnapshot` e `ProductSummary`, que `research/model-content.ts` usa, e perde `PageContext`.

## Global Constraints

- Contratos só se editam em `server/packages/shared` e `packages/genui-react`. Depois, rodar `npm run sync:shared -- ../server` na web; nunca editar `web/src/tone/*`.
- Cores e tokens só vêm de `@toneorg/design`. `npm run check:design` precisa passar. Os componentes novos usam `rounded-tile`, `rounded-input` e `text-ui`, e um alvo de toque mínimo de 44px.
- Todo texto de interface vai em pt-BR e trata o usuário como "a pessoa". Commits seguem o formato `feat:`/`fix:`/`chore:`/`refactor:` + frase em português.
- Nenhuma credencial da tone fica no JavaScript do navegador. Toda rota nova da web passa pela lista fechada do BFF (`web/src/lib/tone-bff.ts`).
- Nunca abrir checkout nem pagar: `isCheckoutUrl` e `isAllowedNavigation` ficam em `shared/safety.ts`.
- Antes de cada commit:
  - servidor: `pnpm typecheck && pnpm lint && pnpm --filter @tone/server test`;
  - web: `npm run lint && npx tsc --noEmit && npm test && npm run check:design`.
- Durante a troca de app no Fly, nunca deixar dois processos com `WATCH_RUNNER` ligado contra o mesmo banco: os painéis e e-mails sairiam em dobro.

## Review Focus

1. **Transcrições antigas** que têm `browser_actions`, `browser_results` ou chamadas de ferramentas de navegador precisam abrir na web sem quebrar o parse. Coberto pelo teste `old transcript with browser actions still renders` (Task 3).
2. **Painéis com leituras antigas** (`source: "local_extension"`, `provenance: "extension"`) precisam continuar listando. Coberto pelo teste `legacy local_extension reading still parses` (Task 4).
3. **Sessões com `pending_calls` abertas** no momento do deploy precisam aceitar uma mensagem nova, sem ficar esperando `browser_results` para sempre. Coberto pelo teste `session with an open pending call accepts a new message` (Task 3).
4. **Um Bearer de extensão antiga** que chega depois do corte recebe 401, e não 500 nem a mensagem "Atualize a extensão". Coberto pelo teste `bearer token is refused with 401` (Task 2).
5. **Um link de checkout** que vem do modelo nunca abre na web. Coberto pelo teste `open never opens a checkout url` (Task 7). Ele substitui a guarda de pagamento que só o e2e da extensão testava.

---

## Fase A: servidor (repositório `tone-extension`, branch `refactor/so-web`)

### Task 1: Testes do servidor sem Bearer

**Files:**
- Modify: `apps/server/test/helpers.ts`
- Modify: os cerca de 28 testes com `authorization: \`Bearer` ou com um helper `auth(token)` local, por exemplo `test/app.test.ts:10-15`, `test/answer-ratings.test.ts:10-13`, `test/watches.test.ts`.

**Interfaces:**
- Produces: `seedWebUser(app, db, name?) => Promise<{ id: string; cookie: string; headers: (method?: string) => Record<string,string> }>`. `headers("POST")` devolve `{ cookie, "x-tone-web": "1", "content-type": "application/json" }`, e `headers()` devolve `{ cookie }`.

- [ ] **Step 1:** Em `helpers.ts`, implemente `seedWebUser` usando `seedUser` e `signInWeb`, que já existem (`helpers.ts:63,223`).
- [ ] **Step 2:** Troque, arquivo por arquivo, o helper `auth(token)` local por `user.headers(method)`. Não troque os testes que verificam texto "Bearer" em logs (`observability.test.ts`, `error-tracking.test.ts`).
- [ ] **Step 3:** Rode `pnpm --filter @tone/server test`. Deve passar com o mesmo número de testes de antes.
- [ ] **Step 4:** Rode `grep -rn "Bearer \${" apps/server/test`. Só podem aparecer `account.test.ts` e `app.test.ts` nos testes de login de extensão, que a Task 2 apaga.
- [ ] **Step 5:** Commit: `test: testes do servidor entram pela sessão da web`.

### Task 2: Sem login da extensão e sem CORS

**Files:**
- Modify: `apps/server/src/app.ts`:
  - linhas 246-262: o middleware CORS sai inteiro;
  - linha 288: a mensagem "Atualize a extensão";
  - linhas 365-367: `/api/auth/redeem` e `/api/auth/login` saem;
  - linhas 388-400: o middleware deixa de aceitar Bearer.
- Modify: `apps/server/src/account.ts`:
  - linhas 37 e 50: sem sessão que não expira;
  - linhas 62-90: `adoptLegacy` sai.
- Modify: `apps/server/src/config.ts:122`: `ALLOWED_ORIGINS` sai.
- Modify: `apps/server/src/db/index.ts`: nova migração `DELETE FROM auth_sessions WHERE surface = 'extension'`.
- Modify: `packages/shared/src/api.ts`: `AccessSurface` e o campo `surface` saem de `AccessSession`.
- Test: `apps/server/test/account.test.ts`, `test/app.test.ts`.

- [ ] **Step 1: Teste que falha.** Escreva `bearer token is refused with 401` em `app.test.ts`: `seedUser` com `GET /api/me` e `authorization: Bearer <token>` deve dar `status 401`, com corpo diferente de `/Atualize a extensão/`. Escreva também `extension login routes are gone`: `POST /api/auth/login` e `POST /api/auth/redeem` devem dar `404`.
- [ ] **Step 2:** Rode os testes. Os dois devem falhar.
- [ ] **Step 3:** Remova os itens listados em Files. Apague os testes de login de extensão e de `adoptLegacy` em `account.test.ts`.
- [ ] **Step 4:** Rode a suíte. Deve passar.
- [ ] **Step 5:** Commit: `refactor: servidor só aceita a sessão da web`.

### Task 3: Agente sem ferramentas de navegador

**Files:**
- Modify: `packages/shared/src/tools.ts`: saem `BrowserTools`, `BrowserToolName`, `BROWSER_TOOL_NAMES`, `isBrowserTool` e `needsConfirmation`. `UiTools` fica.
- Modify: `packages/shared/src/agent.ts`: sai o variant `browser_results` de `TurnInput`, sai o variant `browser_actions` de `AgentEvent`, saem `BrowserResult` e `describeAction`, e `page` sai de `message` e de `ui_answer`.
- Modify: `packages/shared/src/page.ts` (sai `PageContext`), `context.ts` (apagar), `safety.ts` (sai `isPaymentControl`) e `tracking.ts`, onde saem os eventos:
  - `browser_action_completed`, `panel_opened`, `added_to_cart`;
  - `action_interrupted`, `action_failed`, `action_declined`;
  - `benchmark_*`.
- Modify: `apps/server/src/agent/agent.ts`:
  - default `surface`, linhas 136 e 173;
  - `acceptResults` e `closePending`, perto das linhas 685-732;
  - insert em `pending_calls`, linhas 326-332;
  - ramo de navegador de `handleCall`, linhas 584-604, junto com `recentlyRead` e `productUrlOf`;
  - filtros das linhas 262-266 e 312-318, que viram a lista única de ferramentas;
  - `indexAvailable` e `available`, linha 265: fica só `available`.
- Modify: `apps/server/src/agent/prompt.ts`, linhas 8-10 e 109-120. O texto descreve a tone na web, que pesquisa no servidor e abre a loja só quando a pessoa clica.
- Modify: `apps/server/src/llm/fake.ts:95-133`: o roteiro de navegador sai.
- Modify: `apps/server/src/observability.ts:2,14`: as métricas `browser.*` saem.
- Modify: `apps/server/src/db/index.ts`: migração que fecha os `pending_calls` abertos, seguindo o padrão das migrações existentes.
- Modify: `apps/server/src/transcript*` ou o lugar onde `TranscriptItem` é montado: itens antigos de navegador viram `null` e são filtrados.
- Test: `apps/server/test/agent.test.ts` (as partes de navegador saem), `test/web-surface.test.ts` (as afirmações úteis vão para `agent.test.ts` e o arquivo sai).

- [ ] **Step 1: Testes que falham.**
  - `session with an open pending call accepts a new message`: insira à mão uma linha em `pending_calls` sem resultado, rode a migração e envie um turno `message`. O stream deve terminar com `done`, sem erro.
  - `old transcript with browser actions still renders`: grave uma transcrição com um item `browser_actions`. `GET /api/sessions/:id/transcript` deve dar `200`, todo item deve passar em `TranscriptItem.parse`, e nenhum item pode ter `type === "browser_actions"`.
  - `agent never offers browser tools`: o fake LLM deve receber uma lista de ferramentas sem nenhum nome de `read_page`, `search`, `add_to_cart` ou `select_variant`.
- [ ] **Step 2:** Rode os testes. Devem falhar.
- [ ] **Step 3:** Faça as remoções listadas em Files. Rode `pnpm typecheck` e siga os erros até zerar, sem criar nenhum stub.
- [ ] **Step 4:** Rode a suíte. Deve passar.
- [ ] **Step 5:** Commit: `refactor: agente sem ferramentas de navegador`.

### Task 4: Sem execuções locais (T14) e sem benchmark

**Files:**
- Delete: `apps/server/src/local-runs.ts`, `packages/shared/src/local-run.ts`, `apps/server/test/local-runs.test.ts`.
- Modify: `apps/server/src/app.ts`:
  - linhas 69 e 173: import e criação;
  - linhas 510-511: o export de dados deixa de levar `local_runs`;
  - linhas 1021-1076: saem `/api/local-runs*`, `/api/local-bridge*` e `extensionOnly`.
- Modify: `apps/server/src/db/index.ts`: migração `DROP TABLE IF EXISTS local_runs` e `local_bridges`.
- Modify: `apps/server/src/research/index.ts:516`, `research/model-content.ts:51` e `packages/shared/src/research-execution.ts:89` (sai `localComplement`).
- Modify: `apps/server/src/admin/routes.tsx`:
  - linha 73: a coluna "Superfície" sai;
  - linhas 201 e 220: a seção "Com e sem a extensão" sai.
- Modify: `admin/queries.ts:86` (sai `benchmarks`) e `admin/observability.tsx:100,161` (texto).
- Keep: `"local_extension"` em `watch.ts:155,312` e `"extension"` em `provenance.ts`, com o comentário `// legado: só leitura de linhas antigas`.
- Test: `apps/server/test/watches.test.ts`, `test/admin-observability.test.ts`.

- [ ] **Step 1: Testes que falham.** `local run routes are gone`: `POST /api/local-runs` e `GET /api/local-bridge` devem dar `404`. `legacy local_extension reading still parses`: insira uma leitura com `source = 'local_extension'`. `GET /api/watches/:id/results` deve dar `200` e conter a leitura.
- [ ] **Step 2:** Rode os testes. O primeiro deve falhar e o segundo deve passar, porque é uma guarda.
- [ ] **Step 3:** Faça as remoções.
- [ ] **Step 4:** Rode a suíte e o typecheck. Devem passar.
- [ ] **Step 5:** Commit: `refactor: sem pesquisa local e sem teste de comparação`.

### Task 5: Superfície única e OAuth do Google volta para a web

**Files:**
- Modify: `packages/shared/src/api.ts:115`: `surface` sai de `SessionSummary`, e `SessionCreate.site` sai.
- Modify: `apps/server/src/app.ts`:
  - linhas 612-670: a criação de sessão grava `surface = 'web'` sempre;
  - linha 889: `remote: true`;
  - linhas 1287-1310: o callback do OAuth vira redirect.
- Modify: `clicks.ts`, `answer-ratings.ts:25`, `events.ts:26,80,98`, `error-tracking.ts:59` e `analytics.ts:59`. Gravam `"web"` como constante e deixam de ler a superfície da sessão de acesso.
- Modify: `apps/server/src/research/direct.ts:11`: o user agent sai de `tone-extension.fly.dev` para `new URL(config.PUBLIC_URL).host`.
- Test: `apps/server/test/google.test.ts`.

**Interfaces:**
- Produces: `GET /oauth/google/callback` responde `302` para `${WEB_URL}/conversas/perfil?conexao=<provider>&estado=<ok|cancelada|erro|expirado>`. A Task 8 lê esses parâmetros.

- [ ] **Step 1: Testes que falham** em `google.test.ts`:
  - `callback redirects to the web profile on success`: espera `302` e `location === "https://heytone.app/conversas/perfil?conexao=gmail&estado=ok"`.
  - `callback with expired state redirects with estado=expirado`.
  - `callback with error redirects with estado=cancelada`.
- [ ] **Step 2:** Rode os testes. Devem falhar.
- [ ] **Step 3:** Implemente o redirect e os itens de superfície listados em Files.
- [ ] **Step 4:** Rode a suíte. Deve passar.
- [ ] **Step 5:** Commit: `refactor: uma superfície só e o Google devolve a pessoa para a web`.

### Task 6: Apagar a extensão do repositório

**Files:**
- Delete:
  - `apps/extension/` e `e2e/`;
  - `tone-extensao.zip`, `certs/` (só se nada do servidor usar; o Dockerfile usa `certs/supabase-root-2021.crt`, então confira antes);
  - `docs/pesquisa-local.md`.
- Modify: `package.json`. O nome passa a `tone-server`, saem `dev:extension` e `test:e2e`, e `test` deixa de filtrar `!@tone/e2e`.
- Modify: `pnpm-workspace.yaml`, `.github/workflows/ci.yml` (sai o job de Playwright e e2e), `.env.example:85-86,96` e `biome.json` (caminhos ignorados da extensão).
- Modify: `README.md`, `AGENTS.md` (saem as regras de adaptadores de loja e de e2e, e entra a regra "a guarda de pagamento é testada na web"), `CONTEXT.md`, `docs/arquitetura.md`, `docs/requisitos.md` (RF1.1, RF2.x, RNF9, RNF14 e T14 ficam marcados "removido em 14/11/2026, a tone é só web") e `docs/semana-de-teste.md`.
- Modify: `packages/genui-react/src/host.ts`: comentários.

- [ ] **Step 1:** Apague e edite os itens listados. Rode `pnpm install` para atualizar o lockfile.
- [ ] **Step 2:** Rode `grep -rniE "extens(ão|ion)|chrome-extension|side ?panel|painel lateral" --exclude-dir=node_modules .`. Só podem sobrar os comentários de legado da Task 4 e o histórico em `docs/requisitos.md`.
- [ ] **Step 3:** Rode `pnpm build && pnpm typecheck && pnpm lint && pnpm test`. Deve passar.
- [ ] **Step 4:** Commit: `chore: apaga a extensão; o repositório é o servidor da tone`.

## Fase B: web (repositório `web`, branch `refactor/so-web`)

### Task 7: A web sem nenhum vestígio da extensão

**Files:**
- Run: `npm run sync:shared -- ../tone-extension`. Ele regenera `src/tone/shared` e `src/tone/genui`.
- Delete: `src/conversas/LocalResearch.tsx`.
- Modify: `src/conversas/api.ts`: saem `localBridge`, `localRun`, `stopLocalRun` e `nudgeExtension`, nas linhas 217-272. As funções novas entram nas Tasks 8 a 10.
- Modify: `src/lib/tone-bff.ts`:
  - saem `local-runs` e `local-bridge`;
  - entram `/^reviews$/` (corrige o 404 de hoje), `/^connections(\/(gmail|calendar)(\/(start|sync))?)?$/`, `/^photos$/` e `/^photos\/[^/]+(\/(image|interpret|correction))?$/`.
- Modify: `src/conversas/Conversation.tsx`:
  - linha 122: um quadro salvo que não é mídia é desenhado pelo genui, sem o aviso "aparece completo na extensão";
  - linhas 557-580: saem `LocalResearch` e "Parar a pesquisa no meu Chrome";
  - linhas 637-638: `researchNote` sem "só pela extensão".
- Modify: `src/conversas/Home.tsx`: saem as linhas 240 e 251 ("começou na…") e a seção "Extensão no Chrome" (linhas 275-282).
- Modify: `src/conversas/Onboarding.tsx:142-207`: sai o passo da extensão e `ArtExtension`. O tour fica com 4 passos.
- Modify: `src/conversas/SignIn.tsx`, linhas 21 e 169-170, e `src/app/privacidade/page.tsx:84-88`. O texto passa por `better-writing`.
- Modify: na landing nova (commit `4b36857`), `src/app/page.tsx:24` é um comentário. O card "Funciona onde você compra" (linhas 219-221) e `ExtensionDrawing` (linha 372) ficam com uma frase só sobre a web, por exemplo "No navegador, no celular ou no computador. Você abre a loja quando quiser.", e o desenho sai ou vira um desenho da web. Junto mudam `docs/copy/landing.md:54` e `CONTEXT.md:26` ("O produto da pessoa (web)…").
- Modify: `.env.example:12-13` (sai `NEXT_PUBLIC_TONE_EXTENSION_ID`), `README.md`, `docs/analytics.md`, os comentários listados no mapa e `scripts/sync-tone-shared.mjs`, cujo default fica `../tone-extension` até a Task 11.
- Modify: `.github/workflows/ci.yml`: entram `npx tsc --noEmit` e `npm test`.
- Test: `test/shell.test.tsx:92`, `test/program.test.tsx`, `test/tone-bff.test.ts`.

- [ ] **Step 1: Testes que falham.**
  - Em `tone-bff.test.ts`: `allows reviews, connections and photos` deve ter `upstreamPath(["reviews"]) === "/api/reviews"`, `upstreamPath(["connections","gmail","start"]) === "/api/connections/gmail/start"` e `upstreamPath(["photos","abc","correction"])` não nulo. `refuses local runs` deve ter `upstreamPath(["local-runs"]) === null`.
  - Em `program.test.tsx`: `open never opens a checkout url`. A ação `open` com `https://www.amazon.com.br/gp/buy/spc/handlers/display.html` não chama `window.open`.
  - Em `shell.test.tsx`: o texto antigo "só pela extensão" troca de lado e passa a ser `expect(screen.queryByText(/extensão/i)).toBeNull()` na conversa e na Home.
- [ ] **Step 2:** Rode `npm test`. Devem falhar.
- [ ] **Step 3:** Faça o sync e as edições listadas em Files, e rode `npx tsc --noEmit` até zerar.
- [ ] **Step 4:** Rode `grep -rniE "extens(ão|ion)|chrome" src test docs README.md .env.example`. Não pode sobrar nada, fora `src/tone` (gerado) e o histórico das specs.
- [ ] **Step 5:** Rode `npm run lint && npx tsc --noEmit && npm test && npm run check:design`. Deve passar.
- [ ] **Step 6:** Commit: `refactor: a web não fala mais da extensão`.

### Task 8: Conexões Google e compras no perfil

**Files:**
- Create: `src/conversas/Connections.tsx`.
- Modify: `src/conversas/Profile.tsx`: nova `<section aria-labelledby="titulo-conexoes">` entre "memória" (linha 235) e "dados" (linha 284).
- Modify: `src/conversas/api.ts`.
- Test: `test/connections.test.tsx`.
- Referência de comportamento: `tone-extension/apps/extension/src/panel/About.tsx:281-350`, lido antes da Task 6 ou pelo histórico do git.

**Interfaces:**
- Consumes:
  - `ConnectionStatus` e `ConnectionProvider` de `@/tone/shared`;
  - `GET connections`, `POST connections/:p/start → { url }`, `POST connections/:p/sync → { added }`, `DELETE connections/:p` e `GET purchases`;
  - os parâmetros `conexao` e `estado` (Task 5).
- Produces: `api.connections(): Promise<ConnectionStatus[]>`, `api.startConnection(p): Promise<{url:string}>`, `api.syncConnection(p): Promise<{added:number}>`, `api.disconnect(p)` e `api.purchases()`.

- [ ] **Step 1: Testes que falham** em `connections.test.tsx`:
  - `shows connect for a disconnected gmail`: aparece o botão "Conectar Gmail".
  - `connect navigates to the google url`: com `startConnection` mockado devolvendo `{url:"https://accounts.google.com/x"}`, `window.location.assign` é chamado com essa URL. A troca acontece na mesma aba, porque o callback volta para o perfil.
  - `estado=ok shows a confirmation`: a busca `?conexao=gmail&estado=ok` mostra "Gmail conectado" num `role="status"`.
  - `estado=cancelada shows nothing connected`.
  - `lists purchases read from e-mail`: com `purchases` mockado com 2 itens, aparecem os 2 títulos.
- [ ] **Step 2:** Rode os testes. Devem falhar.
- [ ] **Step 3:** Implemente `Connections.tsx` com o padrão de `Profile.tsx`, `Sheet.tsx` para confirmar "Desconectar" e o estado 503 ("ainda não estão ativas neste servidor"). Antes, leia `DESIGN.md` e as fichas de botão e lista em `@toneorg/design`. Depois, rode `better-ui` e `better-writing`.
- [ ] **Step 4:** Rode `npm test` e `npm run check:design`. Devem passar.
- [ ] **Step 5:** Commit: `feat: conectar Gmail e Agenda pela web`.

### Task 9: Foto de referência na conversa

**Files:**
- Create: `src/conversas/PhotoReference.tsx`.
- Modify: `src/conversas/Conversation.tsx`: um botão de foto no compositor.
- Modify: `src/conversas/api.ts`.
- Test: `test/photo.test.tsx`.
- Referência: `apps/extension/src/components/PhotoReference.tsx`, pelo histórico do git.

**Interfaces:**
- Consumes: `POST photos {sessionId, data(base64)} → PhotoSummary (201 | 413 | 415)`, `POST photos/:id/interpret`, `PATCH photos/:id/correction`, `DELETE photos/:id` e `GET photos/:id/image`. Tipos `PhotoUpload` e `PhotoSummary` vêm de `@/tone/shared` (`photo.ts`).
- Produces: `api.uploadPhoto(sessionId, file: File): Promise<PhotoSummary>`, `api.interpretPhoto(id)`, `api.correctPhoto(id, correction)` e `api.deletePhoto(id)`.

- [ ] **Step 1: Testes que falham.**
  - `rejects a file over 4 MB before uploading`: um `File` de 4,5 MB mostra "A foto passa de 4 MB." e não chama `uploadPhoto`.
  - `uploads, interprets and shows the reading`.
  - `415 from server shows its message`.
  - `delete removes the photo`.
- [ ] **Step 2:** Rode os testes. Devem falhar.
- [ ] **Step 3:** Implemente com `<input type="file" accept="image/*" capture="user">`. A leitura em base64 usa `FileReader`. O BFF já tem limite de corpo; confira se a rota Next aceita 6 MB e, se não aceitar, ajuste em `src/app/api/tone/[...path]/route.ts`.
- [ ] **Step 4:** Rode os testes e `check:design`. Devem passar.
- [ ] **Step 5:** Commit: `feat: foto de referência na conversa da web`.

### Task 10: Sessões de acesso no perfil

**Files:**
- Modify: `src/conversas/Profile.tsx` (seção "dados") e `src/conversas/api.ts`.
- Test: `test/access-sessions.test.tsx`.

**Interfaces:**
- Consumes: `api.accessSessions()` (já existe, `api.ts:160`) e `DELETE auth/sessions/:id`.
- Produces: `api.endAccessSession(id: string): Promise<void>`.

- [ ] **Step 1: Testes que falham.**
  - `lists sessions with the current one marked`: a sessão atual aparece como "Este aparelho" e não tem botão "Encerrar".
  - `ending another session removes it from the list`.
- [ ] **Step 2:** Rode os testes. Devem falhar.
- [ ] **Step 3:** Implemente a lista. Encerrar pede confirmação num `Sheet`.
- [ ] **Step 4:** Rode os testes. Devem passar.
- [ ] **Step 5:** Commit: `feat: ver e encerrar sessões pela web`.

## Fase C: renomear e publicar

### Task 11: `toneorg/server`, `tone-server` no Fly e a troca

Esta task é operacional. Cada passo que muda algo fora do repositório pede o ok da pessoa na hora.

**Files:**
- Modify: no servidor, `fly.toml` passa a ter `app = "tone-server"`, `PUBLIC_URL = "https://tone-server.fly.dev"` e não tem mais `ALLOWED_ORIGINS`.
- Modify: na web, `scripts/sync-tone-shared.mjs`. O default passa a `../server` e o cabeçalho a `Gerado de toneorg/server@<sha>`. Rode o sync de novo para regenerar `SOURCE` e os cabeçalhos.
- Modify: `web/AGENTS.md` e `README.md`, onde aparecem os caminhos e o comando de deploy.

- [ ] **Step 1:** Faça o merge das branches `refactor/so-web` nos dois repositórios, sem deploy ainda.
- [ ] **Step 2:** Renomeie o repositório com `gh repo rename server -R toneorg/extension`. O GitHub redireciona a URL antiga. Depois, `git remote set-url origin https://github.com/toneorg/server.git` e `mv ~/tone/tone-extension ~/tone/server`.
- [ ] **Step 3:** Faça a troca de app seguindo, na ordem, a lista "Troca de app (14/11/2026)" de `docs/guia-deploy-economico.md` no servidor (passos 0 a 8). Ela é a única ordem válida: o deploy NÃO roda migrações, então ela as roda com o app antigo parado (`fly scale count 0 -a tone-extension`, depois `db:migrate`, depois `fly deploy --app tone-server --ha=false`), e a API fica fora do ar entre o escalonamento a zero e o deploy. Antes de tudo, convide as contas sem senha e avise "a tone agora é só em heytone.app". `ENCRYPTION_KEY` precisa ter o mesmo valor do app antigo. A Vercel (`TONE_API_URL=https://tone-server.fly.dev` e `LEADS_WEBHOOK_URL`, sem a qual `/api/lista` e `/api/piloto` respondem 503) e o `git push` da web em `main` entram no passo 6 da lista, e `WATCH_RUNNER=1` só no passo 7.
- [ ] **Step 4:** Rode a verificação ponta a ponta (abaixo). Se tudo der certo, depois de uma semana, `fly apps destroy tone-extension` e tire o redirect URI antigo.

## Verificação ponta a ponta

No `heytone.app` de produção, pelo Chrome da pessoa:
1. Entrar com uma conta que só usava a extensão. As conversas antigas aparecem, inclusive uma que tinha ações de navegador.
2. Fazer uma conversa nova com pesquisa. Aparecem progresso, quadro e "Ver na loja", que abre numa aba nova e nunca no checkout.
3. "O que dizem os reviews" responde, e não dá mais 404.
4. Criar um painel. Em seguida, `fly logs -a tone-server` deve mostrar a leitura, e só um processo de runner.
5. Perfil, Conectar Gmail: a pessoa vai ao Google e volta com "Gmail conectado", e as compras aparecem. Testar também o Desconectar.
6. Enviar uma foto de referência numa conversa. A leitura aparece e `compare_photo` responde.
7. Perfil, sessões: encerrar uma sessão de outro navegador. Esse navegador cai para o login.
8. Em `curl -H "authorization: Bearer x" https://tone-server.fly.dev/api/me`, a resposta é 401.
9. O admin (`/admin`) não tem mais a coluna Superfície nem o benchmark.
10. Envie a lista de espera em `/` e o pedido de piloto em `/lojas`. Os dois devem responder `ok` e a entrada deve chegar no destino do `LEADS_WEBHOOK_URL`. A landing não pode citar a extensão.
