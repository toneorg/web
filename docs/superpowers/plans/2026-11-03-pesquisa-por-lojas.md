# Plano de pesquisa por lojas relevantes

> Execução: usar superpowers-subagent-driven-development para a implementação do servidor e revisão em duas etapas. Setup do Pomerado, sincronização da web e publicação ficam com o agente principal.

**Objetivo:** complementar o Google com até três lojas pertinentes, preservar restrições explícitas e repetir as fontes nos painéis.

**Arquitetura:** estender os contratos compartilhados com seleção de lojas diretas separada de `storeScope`. O modelo escolhe a seleção a partir de um catálogo configurado; o servidor valida e limita a seleção automática. O painel persiste essa seleção no JSON da regra, sem nova tabela.

**Stack:** TypeScript, Zod, Hono, Vitest, Next.js, Pomerado REST/MCP, Fly e Vercel.

## 1. Contrato, catálogo e execução no servidor

Arquivos: `packages/shared/src/{provenance,research,watch,tools}.ts`, `apps/server/src/research/{index,remote}.ts`, `apps/server/src/agent/{prompt,agent}.ts`, `apps/server/src/{watches,watch-runner,app}.ts` no repositório do servidor.

- [ ] Adicionar testes do contrato para uma seleção automática independente do escopo; compatibilidade com regras antigas sem seleção; restrição explícita com mais de três lojas.
- [ ] Rodar os testes novos e confirmar falha pelo comportamento ausente.
- [ ] Adicionar um campo opcional de seleção direta ao pedido e à regra, mantendo a distinção entre ausente (selecionar) e vazio (nenhuma loja). Exemplo de contrato: `remoteStores: z.array(z.string().trim().min(1)).optional()`; o limite de três vale para seleção automática, não para escopo explícito.
- [ ] Expor ao modelo um catálogo de lojas configuradas com descrições de categorias. Reutilizar `Models` se uma decisão de seleção no servidor for necessária fora do turno do agente; não criar chamadas de rede ou custo fora do ledger.
- [ ] Selecionar apenas lojas habilitadas, respeitar o escopo explícito e reportar lojas pedidas indisponíveis. Não converter uma seleção automática em filtro do índice.
- [ ] Testar o pipeline com respostas reais simuladas no transporte: uma loja relevante é consultada, a irrelevante não, o índice permanece irrestrito, e falha parcial preserva ofertas.

## 2. Persistência em painéis

Arquivos: `packages/shared/src/watch.ts`, `apps/server/src/{watches,watch-runner,agent/agent}.ts` e testes correspondentes.

- [ ] Escrever teste que salve, confirme, releia e execute uma regra com seleção de lojas; confirmar falha antes da implementação.
- [ ] Resolver a seleção na gravação do rascunho quando não veio pronta. Reutilizar a seleção anterior quando apropriado, sem ampliar o escopo silenciosamente.
- [ ] Persistir a seleção no JSON validado da regra e passá-la no pedido do runner; a revisão deve listar só fontes efetivamente selecionadas.
- [ ] Testar indisponibilidade posterior de uma integração, regras antigas e pesquisas explicitamente restritas.

## 3. Validação e entrega do servidor

- [ ] Corrigir o teste de convite que já falha no CI, fornecendo o e-mail esperado no cenário, sem afrouxar autenticação.
- [ ] Atualizar `docs/pesquisa-remota.md`, `docs/arquitetura.md` e a linha aplicável em `docs/requisitos.md`.
- [ ] Rodar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm check:design` e `pnpm test:e2e`; registrar falhas remanescentes pelo nome.
- [ ] Revisar aderência ao documento aprovado e qualidade antes do merge.

## 4. Ferramenta KaBuM e configuração

- [ ] Acompanhar o build `job_f6ec10faab677181d380e1d609d5e045` até resultado final; encaminhar qualquer login/código exigido.
- [ ] Validar o schema e o resultado de exemplo antes de habilitar a ferramenta.
- [ ] Configurar as secrets do Fly sem imprimir credenciais e preservando as demais lojas configuradas. O usuário autorizou configurações e merges necessários em 03/11/2026.

## 5. Web e publicação coordenada

- [ ] Sincronizar a web com o commit final do servidor: `node scripts/sync-tone-shared.mjs /private/tmp/tone-store-selection`.
- [ ] Ler os guias locais do Next.js se for necessário alterar código da aplicação, além das cópias geradas.
- [ ] Rodar as verificações existentes da web; revisar o diff gerado e commitar somente arquivos da tarefa.
- [ ] Abrir e mergear PRs autorizados, acompanhar os deploys e validar em produção uma busca e um painel sem duplicar o painel já existente.
