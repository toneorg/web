# Recomendações e preferências de lojas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use $superpowers-subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recomendar compras adequadas em lojas conhecidas, permitir exceções justificadas e lembrar escolhas de lojas por categoria com consentimento explícito.

**Architecture:** O servidor planeja fontes e valida escolhas deterministicamente, preservando escopo explícito, orçamento e as duas fases existentes. Preferências são dados da conta por categoria, não uma restrição global. A web separa salvar preferências de iniciar nova pesquisa.

**Tech Stack:** TypeScript, Hono, zod, abstração Db existente, React, Next 16, design system tone, Vitest.

## Aprovação e extensão

O desenho de 20/11 foi aprovado para implementação nesta conversa. A extensão autorizada inclui perguntas antes/depois dos resultados, escolher lojas para próximas pesquisas da categoria, informar loja ausente e escolher entre salvar somente e salvar com nova pesquisa. Nenhuma preferência é inferida da simples exibição ou de um clique em produto.

Servidor: `/Users/gabriel/tone/worktrees/recomendacoes-lojas`, branch `feat/recomendacoes-lojas`, base `c661ab5`. Web: workspace atual, branch `obielwb/fix-recomendacoes-tone-lojas`.

## Tarefa 1 — Política de lojas e aquisição

Responsabilidade: módulos `research/merchant-registry.ts`, `merchant-policy.ts`, `search-plan.ts`, integração em `store-selection`, `quality`, `ranking`, `discovery`, `index`, `pick`, `followups` e testes correspondentes.

- [ ] Escrever e observar falha de regressões: loja estabelecida relevante tem prioridade; loja explicitamente pedida prevalece; nota do produto não comprova vendedor; mesmo EAN preserva oferta apropriada.
- [ ] Implementar cadastro com evidências e distinção entre reconhecimento, confiança comercial e procedência técnica.
- [ ] Aplicar prioridade no plano, suficiência, pools, escolha e segunda fase; garantir fallback determinístico depois da curadoria.
- [ ] Executar testes direcionados, depois suite e verificações estáticas.

Contrato de comportamento: `expect(productRatingOnly).not.toVerifySeller()`; restrições de produto nunca são relaxadas pela notoriedade da loja. Preferências explícitas de prioridade não transformam `unrestricted` em `explicit`.

## Tarefa 2 — Preferências de lojas da conta

Responsabilidade: módulo/rotas de preferências do servidor, integração com pesquisa do agente, contratos compartilhados se necessários, componente e integração da web e BFF.

- [ ] Testar isolamento por conta e categoria, validação de domínios, persistência explícita, salvar sem pesquisa e pesquisar novamente uma vez.
- [ ] Usar armazenamento existente quando adequado, com limites de tamanho e validação; não buscar URLs arbitrárias informadas no campo.
- [ ] Integrar preferências persistidas no caminho real da próxima pesquisa, preservando consulta e restrições no refinamento.
- [ ] Desenhar controles acessíveis com lojas selecionáveis e campo de loja ausente, salvar somente, salvar e pesquisar, retorno de sucesso/erro e opção de corrigir.
- [ ] Verificar teclado, estados em histórico e durante turno, contratos e atualização das cópias geradas pelo script.

Asserções de aceitação: salvar não chama `onSend`; salvar e pesquisar chama uma única vez após persistência bem-sucedida; falha ao salvar mantém edição e não pesquisa; tênis não altera prioridades de roupa; outra conta não lê nem altera as escolhas.

## Tarefa 3 — Avaliação comercial e cobertura

Responsabilidade: `apps/server/src/eval/**`, testes de avaliação, comando offline e documentação de resultados.

- [ ] Adicionar cenários e métricas separados para adequação do produto, loja/vendedor, cobertura conhecida, exceções e opções inadequadas.
- [ ] Rodar comparação offline reproduzível com pool de referência; falha em adquirir uma oferta conhecida conta como erro.
- [ ] Validar leitores existentes com fixtures gravadas, identificando separadamente o que requer validação ao vivo.
- [ ] Registrar comando, dados, limitações e resultados reais. Não apresentar avaliação sintética como superioridade no mercado.

## Tarefa 4 — Integração e revisão

- [ ] Rodar servidor: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:design`, `pnpm build`.
- [ ] Sincronizar contratos com `npm run sync:shared -- /Users/gabriel/tone/worktrees/recomendacoes-lojas`.
- [ ] Rodar web: `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run check:design`, `npm run build`.
- [ ] Revisar conformidade com desenho, depois qualidade/manutenibilidade, corrigir achados e repetir verificações afetadas.
- [ ] Registrar resultados e limites reais de cobertura. Commitar separadamente em servidor e web; deploy não faz parte da verificação local.
