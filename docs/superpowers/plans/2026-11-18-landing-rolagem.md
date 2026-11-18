# Movimento com a rolagem na landing: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A seção fixa "A pesquisa" e os movimentos menores ligados à rolagem do design aprovado, mais um exemplo de roupa nas abas de "O porquê".

**Architecture:** Um módulo `src/landing/scroll.ts` com funções puras (mapear progresso) e um hook `useScrollProgress` que mede uma seção num `requestAnimationFrame` só enquanto ela está perto da tela. Os componentes clientes leem o progresso (0 a 1) e escrevem só `transform` e `opacity`. As linhas de convergência usam CSS (`animation-timeline: view()`), com o desenho completo como fallback.

**Tech Stack:** Next 16 (App Router), React 19, Tailwind 4 com `@toneorg/design` v0.2.0, Vitest com `renderToStaticMarkup`.

**Spec:** `docs/superpowers/specs/2026-11-18-landing-rolagem-design.md`

## Global Constraints

- Cores, raios, curvas e durações só dos tokens; `npm run check:design` passa.
- Nenhuma dependência nova.
- Só `transform`, `opacity`, `filter` e `stroke-dashoffset` animados.
- O servidor e o primeiro render do cliente desenham o estado final (progresso 1).
- `prefers-reduced-motion`: progresso fica em 1, a seção fixa vira bloco normal (`motion-reduce:`), nada escondido.
- Abaixo de 48rem: a seção fixa tem 200vh, 8 cards, sem perspectiva.
- A copy nova entra em `docs/copy/landing.md` antes do código.

## Review Focus

- Mudar o tamanho da janela ou girar o celular no meio da seção: o progresso é recalculado no `resize`.
- Barra de endereço do iOS aparecendo e sumindo: palco em `h-dvh`, medida pelo `innerHeight` a cada quadro.
- Pedir menos movimento com a página aberta: o hook escuta a mudança do `matchMedia` e vai para 1.
- Recarregar a página no meio da seção: a primeira medida acontece na montagem, não só no primeiro scroll.
- Janela baixa (laptop com 700px): o palco cabe na altura (`max-h` e escala), sem cortar o card final.

---

### Task 1: Progresso da rolagem

**Files:**
- Create: `src/landing/scroll.ts`
- Test: `test/landing-scroll.test.ts`

**Interfaces:**
- Produces: `span(p: number, start: number, end: number): number` (0 a 1, com clamp); `countUp(p: number, start: number, end: number, target: number): number` (inteiro); `phaseAt(p: number, cuts: number[]): number`; `measure(mode: "pin" | "view", top: number, height: number, viewport: number): number`; `useScrollProgress<T extends HTMLElement>(mode: "pin" | "view"): { ref: RefObject<T | null>; progress: number }`.

- [ ] Teste: `span(0.4, 0.2, 0.6) === 0.5`, `span(0.1, 0.2, 0.6) === 0`, `span(0.9, 0.2, 0.6) === 1`, `span(0.5, 0.5, 0.5) === 1`; `countUp(0.4, 0.2, 0.6, 214) === 107`; `phaseAt(0.1, [0.2, 0.6, 0.85]) === 0`, `phaseAt(0.7, …) === 2`, `phaseAt(1, …) === 3`; `measure("pin", 0, 3000, 1000) === 0`, `measure("pin", -2000, 3000, 1000) === 1`, `measure("pin", -1000, 3000, 1000) === 0.5`, `measure("pin", 500, 3000, 1000) === 0`; `measure("view", 1000, 500, 1000) === 0` (entrando por baixo), `measure("view", -500, 500, 1000) === 1` (saiu por cima).
- [ ] Rodar `npx vitest run test/landing-scroll.test.ts`: falha.
- [ ] Implementar. `measure("pin")` = `-top / (height - viewport)`; `measure("view")` = `(viewport - top) / (viewport + height)`; ambos com clamp. O hook começa em 1; na montagem lê `matchMedia("(prefers-reduced-motion: reduce)")` (fica em 1 e escuta `change`), senão mede uma vez, liga um `IntersectionObserver` (`rootMargin: "50% 0px"`) que ativa e desativa os ouvintes de `scroll` e `resize` (passivos) com um único `requestAnimationFrame` pendente.
- [ ] Rodar: passa. Commit `feat(landing): progresso da rolagem`.

### Task 2: A pesquisa (seção fixa)

**Files:**
- Create: `src/landing/Research.tsx` (cliente)
- Modify: `src/app/page.tsx` (troca "Como funciona" pela seção; mantém `id="como-funciona"`), `docs/copy/landing.md`
- Test: `test/landing-research.test.tsx`

**Interfaces:**
- Consumes: `useScrollProgress("pin")`, `span`, `countUp`, `phaseAt` da Task 1.
- Produces: `export function Research(): JSX.Element`.

Fases `[0.2, 0.6, 0.85]`: 0 Você conta, 1 e 2 Ela pesquisa (2 = descarte), 3 Você decide. Card: `{ id, kind: "review" | "price" | "spec", text, meta, x, y, z, keep?: true, reason?: string, wide?: true }`; 14 cards, 8 com `wide` aparecem no celular. Chegada de cada card em `span(p, 0.2 + i*0.025, 0.32 + i*0.025)` de `translateZ(-900px)` e opacidade 0 até a posição; descarte dos cards sem `keep` em `0.6 + j*0.018`: etiqueta com o motivo aparece, card desce 80px e some. O card `keep` (preço da Cadeira Apoio Pro) vai ao centro em `span(p, 0.85, 0.95)` e a resposta (motivos com ✓ coral) aparece. Contadores à direita: avaliações 214, cadeiras 12, lojas 6, descartadas 11, por `countUp` em 0.2 a 0.6 (descartadas em 0.6 a 0.85).

- [ ] Teste (`renderToStaticMarkup(<Research />)`): contém um `<ol>` com "Você conta.", "Ela pesquisa." e "Você decide."; contém "Cadeira Apoio Pro" e "214"; nenhum card descartado está visível (`opacity:0` em cada card com motivo); o palco tem `aria-hidden="true"`; o `<h2>` existe com `id="como"`.
- [ ] Rodar: falha.
- [ ] Copy em `docs/copy/landing.md` (título "Enquanto você espera, ela faz o trabalho pesado.", passos atuais, cards, motivos, contadores).
- [ ] Implementar e trocar a seção em `page.tsx`. Seção `h-[200vh] md:h-[300vh] motion-reduce:h-auto bg-ink text-on-ink` com `glow-ink`; palco `sticky top-0 h-dvh motion-reduce:static motion-reduce:h-auto`; perspectiva só de `md` para cima; os itens do `<ol>` empilhados (`grid-area: 1/1`) com o da fase ativa visível, e todos em fluxo normal com `motion-reduce:`.
- [ ] Rodar o teste: passa. Commit `feat(landing): a pesquisa acontece com a rolagem`.

### Task 3: Movimentos menores

**Files:**
- Create: `src/landing/TabPile.tsx`, `src/landing/GeneralAnswer.tsx`, `src/landing/Converge.tsx`, `src/landing/QuestionReport.tsx` (os três primeiros e o último clientes; `Converge` é servidor)
- Modify: `src/app/page.tsx` (usa `TabPile`, duas `Converge`), `src/landing/Comparison.tsx` (usa `GeneralAnswer`), `src/app/lojas/page.tsx` (usa `QuestionReport`), `src/app/globals.css` (`@utility line-draw`)
- Test: `test/landing-motion.test.tsx`

**Interfaces:**
- Consumes: `useScrollProgress("view")`, `span`, `countUp`.
- Produces: `TabPile()`, `GeneralAnswer()`, `Converge({ className?: string })`, `QuestionReport({ questions: { q: string; n: number; gap: string }[] })`.

Valores: abas de 3 a 10 visíveis e selo de "+6 abas" a "+26 abas" em `span(p, 0.15, 0.6)`; lista do chat geral de 2 a 8 itens e selo "N opções" em `span(p, 0.15, 0.55)`, a lista sobe uma linha por item além do quarto; `Converge` com 9 caminhos (`pathLength="1"`) da largura toda até um ponto coral no centro de baixo, 2 em `accent`, o resto em `edge`; perguntas do relatório caem 32px com opacidade em `span(p, 0.1 + i*0.08, 0.3 + i*0.08)`.

- [ ] Teste: `TabPile` renderiza "+26 abas" e 10 abas sem `opacity:0`; `GeneralAnswer` renderiza "8 opções" e os 8 nomes; `Converge` renderiza 9 `path` com `pathLength="1"` e `aria-hidden`; `QuestionReport` renderiza as perguntas recebidas com as barras.
- [ ] Rodar: falha.
- [ ] Implementar e ligar nas páginas.
- [ ] Rodar: passa. Commit `feat(landing): abas, lista, linhas e relatório com a rolagem`.

### Task 4: Exemplo de roupa

**Files:**
- Modify: `src/landing/ExampleTabs.tsx`, `docs/copy/landing.md`
- Test: `test/landing-motion.test.tsx`

- [ ] Teste: `ExampleTabs` renderiza a aba "Jaqueta".
- [ ] Rodar: falha.
- [ ] Acrescentar depois de "Tênis de corrida": pedido "Jaqueta para o inverno de Curitiba. Uso M, mas tenho ombro largo. Até R$ 450."; "Eu começaria pela Jaqueta Serra.", R$ 419; motivos "Forro térmico para dias de 5 °C", "Ombro mais largo no M, segundo as avaliações", "Dentro do seu limite"; "Por que não a Parka Leve? Custa menos, mas as avaliações dizem que aperta nos ombros."
- [ ] Rodar: passa. Commit `feat(landing): exemplo de jaqueta nas abas`.

### Task 5: Verificação

- [ ] `npx tsc --noEmit`, `npx eslint src`, `npm test`, `npm run check:design`, `npx next build`: todos passam.
- [ ] Capturas a 1440 e a 390 em três pontos da seção fixa (início, meio, fim) e com movimento reduzido; corrigir o que cortar ou sobrepor.
- [ ] Detector do impeccable nos arquivos mudados; Lighthouse no celular sem CLS novo.
- [ ] Commit, push e deploy; conferir no domínio de produção.
