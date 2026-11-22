# Resultados na conversa: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O carrossel marca a escolha da tone, troca entre Lista e Comparar, e mostra o que pesou na busca ("Usei"), com "Ignorar só nesta busca" e "Mudar de vez"; o chat deixa de repetir a resposta do quiz e as linhas "Anotei".

**Architecture:** O servidor monta um `ResearchContext` (o que entrou na busca, o que foi ampliado) ao pesquisar, grava no estado da pesquisa (`ResearchRunState.context`) e o emite como evento `research_context`. A web liga o contexto mais recente do turno ao host do bloco de UI daquela resposta; o `ProductCarousel` (gerado de `packages/genui-react`) desenha o "Usei", a chave Lista | Comparar e a tabela.

**Tech Stack:** TypeScript, zod, vitest (servidor, pnpm), React 19 + Next (web), `@toneorg/design`.

**Spec:** `docs/superpowers/specs/2026-11-21-resultados-na-conversa-design.md`

## Global Constraints

- `src/tone/shared` e `src/tone/genui` (web) são gerados de `../tone-server`; mudar lá e rodar `npm run sync:shared -- ../tone-server`.
- Nenhuma cor à mão; `npm run check:design` passa nos dois repositórios. A escolha usa `accentSoft`/`accentText`; o resto `ink`/`graphite`.
- Texto fixo da etiqueta: "Escolha da tone". Chave: "Lista" | "Comparar". Opções do painel: "Ignorar só nesta busca", "Mudar de vez".
- `localStorage` (`tone.carousel.view`) sempre dentro de try/catch; sem ele, começa em Lista.
- Testes de modelo só com os modelos baratos já em uso.

## Review Focus

1. Resposta antiga recarregada (sem `context` no estado da pesquisa): o carrossel aparece sem "Usei", sem quebrar.
2. Carrossel com um produto só: sem chave, sem setas; com `compare` cujo número de valores não bate com os produtos: a linha mostra "—" onde faltar.
3. Carrossel sem a etiqueta "melhor escolha": nenhuma coluna marcada em Comparar e nenhum card com contorno.
4. Duas pesquisas no mesmo turno (a segunda ampliada): o "Usei" mostra o contexto da última.
5. "Ignorar só nesta busca" no orçamento: a nova busca sai sem `pessoa_orcamento` e a memória não muda.

---

### Task 1: Origem de cada preferência e o "pular" (servidor)

**Files:**
- Modify: `../tone-server/apps/server/src/research/personal.ts`
- Test: `../tone-server/apps/server/test/research-personal.test.ts`

**Interfaces:**
- Produces: `PersonalConstraints.sources: Record<string, Memory>` (id `pessoa_*` → a memória que o originou; para cores e marcas, a primeira memória da lista); `mergePersonal(request, personal, skip?: readonly string[]): ResearchRequest`, que deixa de fora os ids de `skip`.

- [ ] **Step 1: Testes**
  - `"cada requisito da pessoa sabe de que memória veio"`: `personalConstraints([memory("perfume.orcamento_max","150")],"perfume").sources.pessoa_orcamento.key === "perfume.orcamento_max"`.
  - `"skip deixa o orçamento de fora"`: `mergePersonal(request(), personal, ["pessoa_orcamento"])` sem o requisito e sem a restrição `lte`.
- [ ] **Step 2: Rodar e ver falhar** — `cd ../tone-server/apps/server && npx vitest run test/research-personal.test.ts`
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Rodar e ver passar**
- [ ] **Step 5: Commit** `feat(busca): origem das preferências e pular uma na busca`

### Task 2: Ampliação com antes e depois (servidor)

**Files:**
- Modify: `../tone-server/apps/server/src/research/broaden.ts` (`relaxPersonal` e o que devolve `broaden`)
- Modify: `../tone-server/apps/server/src/agent/agent.ts` (o tipo de `broadened` ganha `widened`)
- Test: `../tone-server/apps/server/test/research-broaden.test.ts`

**Interfaces:**
- Produces: `relaxPersonal(request) => { request; relaxed: string[]; widened: Widened[] }` com `Widened = { id: string; from: string; to: string }` (valores em `money()`: "R$ 150,00" → usar o mesmo formato do texto). `broadened` em `agent.ts` passa a `{ relaxed: string[]; promoted: string[]; widened: Widened[] }`.

- [ ] **Step 1: Teste** `"orçamento ampliado devolve antes e depois"`: requisito `pessoa_orcamento` required com `lte 150` → `widened = [{ id: "pessoa_orcamento", from: money(150), to: money(187.5) }]`.
- [ ] **Step 2–4:** falhar, implementar, passar.
- [ ] **Step 5: Commit** `feat(busca): a ampliação diz o valor de antes e o de depois`

### Task 3: Contratos (shared)

**Files:**
- Modify: `../tone-server/packages/shared/src/progress.ts` (`ResearchContext`, `ResearchRunState.context`)
- Modify: `../tone-server/packages/shared/src/agent.ts` (evento e `skipPersonal`)
- Modify: `../tone-server/packages/shared/src/genui.ts` (`ProductCarousel.compare`)
- Test: `../tone-server/packages/shared/test/genui.test.ts`, `progress.test.ts`

**Interfaces:**
- Produces:
  ```ts
  ResearchContext = z.object({
    used: z.array(z.object({
      id: z.string(), label: z.string().max(40), source: z.enum(["memory", "conversation"]),
      memory: z.object({ id, key, value, category, savedAt: z.string() }).optional(),
    })).max(12),
    widened: z.array(z.object({ id: z.string(), from: z.string(), to: z.string() })).max(6),
    note: z.string().max(240).nullable(),
  })
  ResearchRunState.context: ResearchContext.nullable().optional()
  AgentEvent += { type: "research_context", runId: string, context: ResearchContext }
  TurnInput.message.skipPersonal: z.array(z.string().regex(/^pessoa_/)).max(4).optional()
  ProductCarousel props += compare: optional(z.array(CompareRow.ref).max(6))
  ```
- [ ] **Step 1: Testes**: carrossel com `compare` válido passa no parser do `genui.test.ts`; `ResearchRunState` sem `context` continua válido; `TurnInput` com `skipPersonal: ["outro"]` é recusado.
- [ ] **Step 2–4:** falhar, implementar (descrição do `ProductCarousel` cita `compare`: "atributos que decidem a compra, um valor curto por produto; preço, nota e loja já aparecem"), passar.
- [ ] **Step 5: Commit** `feat(contratos): contexto da busca, pular preferência e comparação no carrossel`

### Task 4: Montar e emitir o contexto (servidor)

**Files:**
- Create: `../tone-server/apps/server/src/research/context.ts`
- Modify: `../tone-server/apps/server/src/research/runs.ts` (`ResearchRunRecorder.context(runId, context)`)
- Modify: `../tone-server/apps/server/src/agent/agent.ts` (~898–1000: `skipPersonal` do turno, chamar o recorder depois da busca e de novo depois de ampliar)
- Test: `../tone-server/apps/server/test/research-context.test.ts`, `research-progress.test.ts`

**Interfaces:**
- Consumes: Task 1 (`sources`, `skip`), Task 2 (`widened`), Task 3 (tipos).
- Produces: `buildResearchContext(request: ResearchRequest, personal: PersonalConstraints, broadened?: { relaxed: string[]; widened: Widened[] }): ResearchContext`; `recorder.context(runId, context): Promise<void>` grava em `research_runs.state.context` e emite `{ type: "research_context", runId, context }`.

- [ ] **Step 1: Testes de `buildResearchContext`**
  - orçamento da memória 150 → `used[0] = { id: "pessoa_orcamento", label: "até R$ 150", source: "memory", memory: { key: "perfume.orcamento_max", value: "150", savedAt: <updatedAt> } }`.
  - requisito do modelo `{ id: "publico", description: "Perfume masculino", priority: "required" }` → `{ label: "Perfume masculino", source: "conversation" }`; descrição com mais de 28 caracteres é cortada na palavra, com "…".
  - requisito `indifferent` não entra.
  - com `widened` do orçamento, `widened` passa adiante e `note` = `"Achei pouco até R$ 150, então subi para R$ 187,50 nesta busca. Sua preferência continua em R$ 150."`.
- [ ] **Step 2: Teste do recorder**: depois de `context()`, o estado lido do banco tem `context` e o evento emitido é `research_context`.
- [ ] **Step 3–4:** implementar, passar. Rótulos da memória: orçamento "até R$ {n}" (sem centavos quando inteiro); tamanho, cores e marcas: o valor da memória.
- [ ] **Step 5: Commit** `feat(busca): a tone conta o que usou de você na busca`

### Task 5: Prompt

**Files:**
- Modify: `../tone-server/apps/server/src/agent/prompt.ts` (linhas 19, 34, 39)
- Test: `../tone-server/apps/server/test/agent.test.ts` (ou o teste de prompt existente, que procura trechos)

- [ ] **Step 1:** Linha 19: a primeira opção leva a etiqueta "Melhor escolha"; outras podem ter etiqueta de papel ("Mais barato", "O original"); escrever `compare` com 2 a 4 atributos que decidem a compra. Linha 34: não repetir num `Callout` a ressalva que já está num card. Linha 39: "Depois de mostrar produtos, a pergunta que muda a escolha vai em `PreferenceChips` (ex.: 'Fresco para o dia' / 'Marcante até a noite')".
- [ ] **Step 2:** `pnpm --filter @tone/server test` e `pnpm lint` passam.
- [ ] **Step 3: Commit** `feat(prompt): carrossel com comparação e papéis, sem aviso repetido`

### Task 6: Carrossel, comparação e "Usei" (genui-react)

**Files:**
- Modify: `../tone-server/packages/genui-react/src/host.ts`
- Modify: `../tone-server/packages/genui-react/src/components.tsx` (`ProductCard`, `ProductCarousel`, novo `UsedFilters`, novo `CompareTable`)
- Modify: `../tone-server/packages/genui-react/src/genui.css`

**Interfaces:**
- Consumes: Task 3.
- Produces: `GenUIHost.research?: ResearchContext`; ações `{ type: "skip_personal"; ids: string[]; label: string }` e `{ type: "change_memory"; id: string; key: string; category: string; value: string; label: string }`.

- [ ] **Step 1:** `ProductCard` com `best` (badge casa `/melhor escolha/i`): etiqueta "Escolha da tone" (classe `tag pick`) e contorno `ink` no slide.
- [ ] **Step 2:** `ProductCarousel`: cabeçalho com título, `UsedFilters` (se `host.research?.used.length`), e com 2+ produtos a chave (`div role="group"` com dois `button aria-pressed`) e as setas só em Lista. Vista inicial lida de `localStorage["tone.carousel.view"]` em try/catch.
- [ ] **Step 3:** `CompareTable({ products, rows })`: `<table>` com `<caption class="visually-hidden">`, `th scope="col"` por produto (foto, nome, etiqueta), linhas Preço, `rows`, Avaliações, Loja e uma de "Ver na loja" (`OpenButton`). Coluna de rótulos `position: sticky; inset-inline-start: 0`, colunas de 104 px, rolagem horizontal. Coluna `best` com `accentSoft`. Valor que falta: "—".
- [ ] **Step 4:** `UsedFilters`: pílulas; as de memória com ponto `accent` e `aria-expanded`, abrindo um painel com dois botões de opção e "Pesquisar de novo"/"Cancelar"; em "Mudar de vez" aparece um campo com o valor atual. Esc fecha e devolve o foco. `widened` risca o valor antigo na pílula; `note` numa linha `accentSoft` embaixo. Botões desativados quando `!host.interactive`.
- [ ] **Step 5:** `pnpm -r typecheck`, `pnpm lint`, `pnpm check:design` passam.
- [ ] **Step 6: Commit** `feat(genui): carrossel com escolha marcada, lista ou comparar, e o que a tone usou`

### Task 7: Web

**Files:**
- Sync: `npm run sync:shared -- ../tone-server`
- Modify: `src/conversas/Conversation.tsx` (evento `research_context`, host por resposta, `memory_saved` agrupado, sem eco do `answer`)
- Modify: `src/conversas/Program.tsx` (`research` no host; `skip_personal`, `change_memory`)
- Modify: `docs/analytics.md`

**Interfaces:**
- Consumes: Tasks 3 e 6.

- [ ] **Step 1:** `research_context`: gravar `context` no run da atividade (`activity.runs[runId].context`). Ao desenhar, cada bloco de UI recebe o `context` do último run com contexto desde a última mensagem da pessoa (vale para os itens `research` recarregados).
- [ ] **Step 2:** `memory_saved`: enquanto o turno roda, juntar num só item `{ kind: "notice", memories: [{key, value}] }` sem repetir chave e valor; texto `Guardei ${n} ${n === 1 ? "preferência" : "preferências"}` + " · ver" (link para `/perfil`, a rota que o perfil usa hoje).
- [ ] **Step 3:** `answer` deixa de acrescentar `said(...)`.
- [ ] **Step 4:** `skip_personal` → `send({ type: "message", text: \`Pesquisa de novo sem ${label}\`, skipPersonal: ids })`; `change_memory` → `api.addMemory(key, value, category)`, depois `send` com `Pesquisa de novo com ${label}` e `skipPersonal` vazio. Telemetria: `carousel_view_changed`, `used_filter_opened`, `used_filter_skipped`, `used_filter_changed`.
- [ ] **Step 5:** `npm run check:design && npm run lint && npm run build` passam.
- [ ] **Step 6: Commit** `feat(conversas): resultados com lista ou comparar e o que a tone usou`

### Task 8: Ponta a ponta

- [ ] Servidor e web locais; refazer o caso do perfume no Chrome da pessoa; conferir os itens de "Como saber que funcionou" do desenho e os cinco da Review Focus.
- [ ] Abrir os PRs nos dois repositórios.
