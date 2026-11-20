# Recomendações com lojas conhecidas e ofertas confiáveis

Data: 20/11/2026. Estado: proposta para revisão, com diagnóstico do código e roteiro de implementação. Nenhuma alteração no motor, banco ou configuração de produção foi aplicada.

## Decisão proposta

No app da tone, quando a pessoa não especificar uma loja, começar pelas lojas conhecidas e relevantes para a categoria. Uma loja menor pode entrar quando houver vantagem clara para aquele pedido e confiança comprovada. A pessoa confirmou essa preferência nesta conversa. O mercado inicial considerado é o Brasil.

Essa prioridade deve existir na aquisição de candidatas, na condição para encerrar a busca, na comparação das ofertas e na escolha final. Um acesso rápido a uma API não é um sinal de que aquela é a melhor loja para comprar.

A qualidade pretendida é a da decisão completa: produto que serve, variante disponível, vendedor identificado, preço com condições claras e uma loja em que a pessoa tenha motivo para confiar. Popularidade ajuda a escolher onde procurar; não comprova qualidade do produto, autenticidade nem reputação de um vendedor terceiro.

## Escopo e evidência

A interface está neste repositório. A pesquisa e a escolha estão no servidor. Foi lida a cópia local mais recente encontrada, `/Users/gabriel/tone/worktrees/deploy-server`, commit `c661ab5`, compatível com a revisão dos contratos copiados em `src/tone/shared`. O checkout principal do servidor estava em uma revisão anterior. Não foi verificado qual commit está atendendo produção.

O estudo anterior, [Motor de descoberta](2026-11-19-motor-de-descoberta-design.md), já deu origem a implementação: há intenção de moda, fichas, semelhança semântica, diversidade, escolha final e segunda fase. Esta proposta corrige a política de lojas sobre esses mecanismos; não propõe reconstruí-los.

Foi inspecionada a avaliação gravada de 20/11 no servidor, sem repetir chamadas pagas ou acessar conversas privadas. No caso `tenis-branco-casual-masc`, o sistema de descoberta mostrou:

| Produto resumido | Loja | Preço observado na avaliação | Nota do juiz |
|---|---|---|---|
| Tênis masculino casual branco de couro | brakingstore.com.br | R$ 397,00 | 2 |
| Tênis de couro branco masculino | lojabellaro.com | R$ 329,00 | 2 |
| Tênis casual masculino branco | outlet21formen.com | R$ 499,00 | 2 |
| Tênis italiano masculino de couro | lojacharmme.com | R$ 249,00 | 3 |

São dados históricos, não ofertas atuais. Os nomes não constituem uma avaliação negativa dessas lojas: o problema é recomendá-las sem uma política de confiança demonstrada. O resultado confirma que o caso relatado também aparece na avaliação existente.

## Por que isso acontece

| Constatação | Evidência no servidor em `c661ab5` | Consequência |
|---|---|---|
| A nota chamada `store` representa procedência dos dados | `apps/server/src/research/discovery.ts:484`: suspeita 0,2; leitura na origem 0,9; Google Shopping 0,5; demais 0,65 | Uma loja desconhecida pode ter a mesma nota de confiança de uma conhecida se o método de leitura for igual |
| A seleção de lojas pede relevância temática | `research/store-selection.ts:67–96`; `agent/prompt.ts:129` | Até três lojas são escolhidas pelo modelo/classificador, sem prioridade estruturada de estabelecidas por categoria; `remoteSelection` recebido é aceito diretamente |
| Fontes rápidas podem encerrar a aquisição antes das lojas relevantes | `research/index.ts:818–875`; `discovery.ts:693` | Shopify e fontes diretas podem preencher a condição de suficiência; Tilion, Oxylabs e Google seguem para a segunda fase |
| Não há um critério de confiança comercial na suficiência | `enoughToAnswer` verifica atendimento pelas palavras da ficha | Três produtos que parecem servir não equivalem a três boas opções de compra |
| Nota do produto é usada como reputação do vendedor | `research/quality.ts:90–97` usa `offer.listingSignals.rating` em `lacksReputation` | Uma boa nota do produto pode aliviar a suspeita de um vendedor sobre o qual não existe informação |
| A escolha final não recebe um contrato de confiança | `research/pick.ts`, `PickCandidate` e `SYSTEM` | O modelo prioriza pedido, ocasião, visual e preço; só o nome da loja não basta para avaliar o risco |
| O juiz atual mede principalmente o produto | `eval/busca-judge.ts:67–99` | As quatro lojas do exemplo podem ter notas razoáveis sem evidência de confiança comercial |
| A deduplicação pode descartar alternativas de vendedor cedo | `discovery.ts:618`, `candidatesOf`, usa o primeiro produto/EAN encontrado | A seleção da melhor oferta daquele produto deve acontecer antes de eliminar as demais ofertas |

O estudo de ontem já reconhecia o viés da Shopify para marcas pequenas como risco, mas a proteção proposta por fonte não resolve integralmente. Uma mesma fonte pode devolver muitas lojas pequenas; a proteção precisa olhar o lojista e o vendedor.

## Alternativas consideradas

| Abordagem | Vantagem | Limitação | Decisão |
|---|---|---|---|
| Priorizar lojas conhecidas por categoria, buscar amplamente e validar exceções | Corrige a experiência preservando descoberta e neutralidade | Exige cadastro de lojistas, evidência e avaliação | Recomendada |
| Permitir apenas uma lista fixa de grandes lojas | Simples de explicar e implantar | Perde especialistas, itens raros e boas lojas menores; pode deixar pedidos sem resposta | Usar lista inicial para orientar busca, não como bloqueio universal |
| Acrescentar ao prompt “prefira lojas conhecidas” | Mudança pequena | Não recupera ofertas ausentes da primeira fase; o modelo pode ignorar a preferência ou inventar reputação | Apenas complemento da política implementada no servidor |

Um índice próprio grande pode melhorar velocidade e cobertura depois. Não é pré-requisito para corrigir esta falha e não substitui a política de lojas.

## Política de recomendação

### 1. Separar loja, vendedor, produto, oferta e provedor

- **Loja ou plataforma:** onde a pessoa compra, domínio canônico, categoria, operação no Brasil e evidências comerciais.
- **Vendedor:** quem vende aquela oferta; pode ser a própria loja, fabricante, revendedor ou terceiro de marketplace.
- **Produto e variante:** modelo, cor, material declarado, tamanho, condição e identificadores.
- **Oferta:** preço, forma de pagamento, estoque da variante, entrega, devolução e momento da observação.
- **Provedor:** por onde a informação foi obtida — Shopify, busca da loja, Google via treg, Tilion ou Oxylabs.

Uma leitura na origem melhora a evidência de preço. Não transforma o vendedor em confiável. Nota e quantidade de avaliações de produto ficam separadas dos indicadores do vendedor.

### 2. Cadastro de lojistas com origem de cada informação

Criar cadastro versionado, inicialmente em configuração revisável, com domínio canônico e aliases, categorias e especialidades, mercado atendido, tipo de operação, nível de reconhecimento, referências verificáveis e data da revisão. As capacidades de busca e verificação ficam separadas da avaliação comercial: conseguir ler uma loja não a promove.

Estados de confiança: `verified`, `insufficient_evidence`, `restricted`, com razões e evidências. Reconhecimento e confiança são dimensões distintas: `established`, `specialist`, `unclassified` não substituem esses estados. Não classificar uma loja como insegura apenas por ser pequena.

Evidências relevantes para uma loja menor: identidade comercial e domínio coerentes, operação e atendimento verificáveis, políticas claras de entrega/devolução e histórico independente utilizável. CNPJ, HTTPS, depoimentos no próprio site ou uma nota isolada não bastam sozinhos. Dados ausentes permanecem desconhecidos. O cadastro inicial deve passar por revisão humana; um modelo não decide sozinho que uma loja é confiável.

Para marketplace, registrar o vendedor e os sinais que a plataforma efetivamente fornece, com a fonte. Identificar loja oficial exige sinal verificável, não apenas “oficial” no nome. Ausência de dados não é prova de fraude, mas impede que aquela oferta receba o selo de confiança necessário para liderar a recomendação padrão.

### 3. Lojas iniciais por categoria

Exemplos para compor o cadastro e validar cobertura, não uma classificação medida de popularidade:

| Categoria | Primeiras lojas a considerar | Complementos |
|---|---|---|
| Roupa casual e básica | C&A, Renner, Hering | Zara e especialistas adequados à peça e ao orçamento |
| Tênis e artigos esportivos | Centauro, Netshoes, lojas oficiais de fabricantes | Dafiti e ofertas do Mercado Livre com vendedor validado |
| Calçados casuais | Dafiti, lojas oficiais de marcas, Centauro quando pertinente | Netshoes e Mercado Livre com vendedor validado |
| Beleza e perfumaria | Fabricantes, Sephora, Época e grandes drogarias conforme a categoria | Revendedores com evidência comercial e de procedência |
| Eletrônicos | Fabricantes, grandes varejistas e especialistas relevantes | Marketplaces, comparando vendedor, garantia e condição |

Netshoes e fabricantes ainda precisam de validação de adaptador/cobertura antes de prometer busca direta. Nem toda loja listada precisa ser chamada em todo pedido. O plano escolhe as adequadas à intenção, ao orçamento e às capacidades disponíveis.

### 4. Ordem e exceções

1. Respeitar loja explicitamente pedida, lojas evitadas e requisitos firmes. A loja solicitada pode continuar sujeita a alerta de risco; não ganha confiança automaticamente.
2. Eliminar incompatibilidades e ofertas reprovadas. Uma loja conhecida não compensa tênis de cor, número, modelo ou preço incompatível.
3. Entre opções com aderência comparável, priorizar lojistas estabelecidos com confiança verificada e vendedores adequados.
4. Uma loja menor verificada entra por vantagem concreta: peça que atende melhor ao pedido, material/composição comprovados, disponibilidade relevante, preço total melhor ou entrega mais adequada.
5. Aplicar diversidade de modelos, marcas e preços entre as opções já elegíveis. Não preencher o carrossel com lojas diferentes apenas para aumentar a contagem de lojas.

Para categorias comuns e oferta suficiente, a expectativa inicial é que a maioria das 3–4 escolhas venha de lojas estabelecidas. Não é uma cota para mostrar produto ruim. Toda exceção de loja menor precisa de um motivo estruturado, evidência de confiança e uma explicação compreensível para a pessoa. Se várias especialistas forem necessárias por escassez, registrar e explicar essa condição.

Preço menor sem frete conhecido é “menor preço anunciado”, não “menor custo total”. Uma economia só é comprovada sobre variante e condições comparáveis. Percentuais para caracterizar vantagem de preço serão calibrados por categoria; não usar um percentual universal inventado.

Neutralidade permanece: nenhum sinal de pagamento, parceria ou contratação da tone para lojas afeta seleção, prioridade ou confiança. Dentro da tone para lojas, o escopo continua sendo o catálogo daquele lojista; esta política de priorização entre lojas é do app.

## Fluxo de busca proposto

### Plano de fontes antes da coleta

Um `SearchPlan` no servidor recebe intenção, mercado, preferências explícitas e capacidades habilitadas. Devolve lojistas prioritários, fontes que os atendem, uma faixa exploratória, orçamento e prazos. O modelo ajuda a entender o pedido; a regra de cobertura e confiança fica em código.

Manter `storeScope: unrestricted` quando a pessoa não restringir a loja. Priorizar internamente não deve transformar a intenção da pessoa em uma restrição que ela não pediu. `remoteSelection` continua sendo sugestão de leitura nesse caso, reconciliada com a política; pedidos explícitos continuam prevalecendo sem corte silencioso.

Executar em paralelo buscas de estabelecidas compatíveis e exploração ampla. Usar primeiro busca pública/integração específica quando funcionar, Google Shopping via treg para ampliar e encontrar ofertas nos lojistas prioritários, e Tilion/Oxylabs conforme a cobertura comprovada de cada adaptador. Shopify complementa especialmente especialistas e descoberta visual. Não atribuir uma loja inteira a um único método quando outro adaptador puder ser melhor para uma operação específica.

Reservar orçamento para obter opções das lojas prioritárias antes de gastar com detalhes de candidatas exploratórias. Reaproveitar caches permitidos e aplicar limites de concorrência por provedor.

### Suficiência considera qualidade e cobertura

Reaproveitar a primeira e a segunda fase existentes, alterando o predicado de suficiência. Além de aderência e quantidade, verificar presença de opções compráveis com confiança suficiente e conclusão ou estado conhecido das buscas prioritárias. A chegada de oito ofertas desconhecidas não deve, sozinha, tornar a resposta pronta.

Suficiência inicial proposta para categorias comuns: três produtos distintos adequados, incluindo opções de pelo menos dois lojistas prioritários verificados, quando o plano tiver cobertura para isso. Pedido de loja única é exceção explícita. O teste deve considerar o número de produtos, não variantes repetidas.

Aplicar prazo absoluto: não esperar indefinidamente uma loja bloqueada. Ao vencer o prazo, mostrar uma ou duas opções conhecidas que já servem, ou dizer brevemente que a comparação ainda está em andamento. Uma seleção formada só por lojas sem confiança suficiente não recebe um selo de melhor escolha. A segunda fase entrega apenas novidades materiais, preservando o controle de duplicação e de mudança de assunto que já existe.

Testar atraso e falha de Centauro/ML/Renner como parte do comportamento principal. Uma loja indisponível não deve provocar preenchimento silencioso com lojas não avaliadas.

### Comparar produto antes de escolher sua oferta

Agrupar produto e variante por identificadores confiáveis; não declarar dois produtos idênticos apenas pela imagem. Preservar ofertas concorrentes dentro do grupo, avaliar lojista/vendedor/condições e escolher a oferta apropriada. Depois selecionar e diversificar os produtos. Evitar o descarte antecipado da oferta de uma loja conhecida por já ter aparecido o mesmo EAN numa loja menor.

Antes de cortar os pools de 80 candidatas semânticas e 24 candidatas aprofundadas, aplicar distribuição por lojista/grupo de confiança e aderência. Quantidade de resultados e velocidade de um provedor não devem monopolizar essas janelas. Essa distribuição é de aquisição; não obriga a seleção final a exibir uma fonte ou loja.

### Conferir as finalistas e restringir a escolha do modelo

Reler as finalistas quando necessário e possível, priorizando variante, preço/condição de pagamento, vendedor e disponibilidade observada. Frete, prazo e estoque para a região só são confirmados quando o método realmente os fornece. Pedir número ou CEP quando mudarem materialmente a decisão; não criar um formulário obrigatório para explorar tênis brancos.

A escolha final recebe os fatos comerciais estruturados e os motivos permitidos para exceções. O servidor valida os IDs e a política depois do modelo, tanto na primeira fase quanto na segunda e na escrita por `Offer`. Se o modelo não cumprir, usar seleção determinística de ofertas elegíveis. Não permitir que uma explicação convincente promova confiança desconhecida a comprovada.

Na resposta, ligar cada opção ao pedido e às condições reais: por que serve, quem vende e o cuidado relevante. Evitar afirmações como “original”, “loja confiável”, “melhor preço” e “entrega rápida” sem evidência para a afirmação específica.

## Papel e limites das integrações

Os detalhes e as fontes oficiais estão em [Provedores de recomendação](../../research/2026-11-20-recommendation-providers.md).

- **Shopify:** catálogo amplo dentro da cobertura habilitada, não garantia de acesso a qualquer loja. A cobertura externa depende de habilitação; não deve ser presumida. Respeitar atribuição, retenção por campo e limitações para construir um índice permanente.
- **Tilion:** navegador e extração de páginas, não base de reputação ou recomendador. Página aberta não garante variante disponível nem frete conhecido. O estado de login/desafio precisa sobreviver à normalização como limitação da leitura.
- **Oxylabs:** extração/desbloqueio por operações e lojas suportadas. Acesso técnico não é comprovação de qualidade do vendedor.
- **treg:** acesso aos provedores adequados para descoberta e enriquecimento. Não é, por si, um critério comercial. Custo, cobertura e direitos de retenção devem ser registrados por endpoint.

## Execução em entregas independentes

Estimativas de esforço para uma pessoa familiarizada com o servidor; validar após aprovação e baseline. São estimativas, não datas de entrega. O detalhamento de código e testes de cada etapa será escrito no plano de execução depois da revisão deste desenho.

### Entrega 0 — Medir a falha certa, 1–2 dias

- [ ] Fixar a revisão e a configuração efetivamente usadas no ambiente de avaliação; registrar fontes habilitadas, cache e orçamento.
- [ ] Ampliar `apps/server/src/eval/fixtures/busca-casos.ts`, `busca-judge.ts`, `busca-metrics.ts` e relatórios para avaliar adequação comercial, sem confundir produto e vendedor.
- [ ] Acrescentar os casos abaixo e baseline por fase, incluindo quais lojas foram planejadas, consultadas, chegaram a tempo e foram exibidas.
- [ ] Conferir manualmente confiança comercial; o juiz de visão não verifica reputação de uma loja pela foto ou pelo nome.

### Entrega 1 — Corrigir prioridade e confiança, 3–5 dias

- [ ] Criar módulos focados `research/merchant-registry.ts`, `merchant-policy.ts` e `search-plan.ts`, começando por roupa e calçado.
- [ ] Integrar em `store-selection.ts`, `index.ts`, `discovery.ts`, `quality.ts` e `pick.ts`; ajustar `agent/prompt.ts` e o contrato da ferramenta para explicar a regra implementada.
- [ ] Separar confiança do lojista/vendedor da evidência técnica e da nota do produto. Evoluir `packages/shared/src/research.ts` e `research-execution.ts` com campos opcionais e compatíveis para evidência comercial e motivos de seleção.
- [ ] Tratar `remoteSelection` irrestrito como sugestão, garantir prioridade no planejamento e rever suficiência e reserva dos pools antes dos cortes.
- [ ] Aplicar a mesma política nas ofertas de identidade (`ranking.ts`), na segunda fase (`followups.ts`) e na seleção da oferta dentro do agrupamento.
- [ ] Atualizar testes de comportamento nos arquivos existentes e criar testes dos novos módulos. Documentar em `docs/requisitos.md` e `docs/motor-de-descoberta.md` do servidor.

### Entrega 2 — Melhorar cobertura e oferta comprável, 4–7 dias

- [ ] Conferir com amostras reais os adaptadores de C&A/Hering, Renner, Centauro, Dafiti e Mercado Livre já existentes; distinguir falha de seleção, falta de configuração e falta de resultado.
- [ ] Acrescentar Netshoes e fontes oficiais de fabricantes apenas após comprovar aquisição e detalhes adequados. Alterar `direct.ts`, `tilion.ts`, `oxylabs.ts`, `readers.ts` ou criar adaptador específico conforme o mecanismo real de cada loja.
- [ ] Reforçar verificação seletiva das finalistas e representar condições desconhecidas sem inventar estoque, devolução, frete ou autenticidade.
- [ ] Sincronizar os contratos gerados para a web com `npm run sync:shared -- <checkout-do-servidor>`. Alterar componentes apenas se os dados comerciais precisarem de representação que os atuais não suportem; seguir o design system nesse caso.

### Entrega 3 — Calibrar e demonstrar qualidade, 3–5 dias iniciais e acompanhamento

- [ ] Rodar comparação entre sistema atual, prioridade por lojas e política completa, com fontes equivalentes e testes específicos de latência.
- [ ] Calibrar limites de exceção, diversidade e pesos com os resultados, separadamente para descoberta e identidade.
- [ ] Liberar por configuração com comparação e reversão simples; não exige serviço de busca novo ou migração de índice nesta primeira correção.
- [ ] Ampliar depois para beleza e eletrônicos com critérios próprios de procedência/garantia e fontes verificadas. Avaliar índice próprio só quando cobertura e latência medidas justificarem.

## Casos obrigatórios de validação

1. “Tênis branco”, “tênis branco casual masculino até R$ 300” e a variante com número 42.
2. “Nike Air Force 1 branco”: produto exato, condição, tamanho e vendedor; não confundir variante semelhante com o modelo pedido.
3. “Camiseta branca oversized” e “camisa de linho branca”: lojas conhecidas devem estar no conjunto quando houver ofertas adequadas.
4. “Só na Centauro”, “não quero Mercado Livre” e “quero descobrir marcas pequenas”: preferências explícitas prevalecem.
5. Shopify responde em 300 ms, Centauro demora e ML falha: nenhuma resposta padrão composta por lojas não avaliadas recebe selo de melhor escolha.
6. Loja menor tem preço menor, mas confiança desconhecida: não é promovida pela economia. A mesma oferta com confiança verificada e vantagem material pode entrar, com motivo.
7. Produto com 4,9 estrelas vendido por terceiro sem reputação conhecida: as estrelas não verificam o vendedor.
8. Mesmo produto em loja conhecida e menor, com diferentes preços e variantes: conservar a comparação antes de deduplicar.
9. Loja conhecida devolve cor errada, produto usado ou número indisponível: reconhecimento não supera a incompatibilidade.
10. Preço sem frete, Pix versus cartão, importado e entrega desconhecida: comparação e linguagem preservam as condições.
11. Modelo final escolhe oferta inelegível: validação do servidor impede a exibição indevida, inclusive em `Offer` e na segunda fase.
12. Refinamento “mais barato” e “parecido com o primeiro”: preservar restrições e política; não migrar silenciosamente para lojas sem evidência.

## Medição de sucesso

O relatório anterior mostrou NDCG@4 de 0,71 e precisão de 79% em 40 pedidos de descoberta. Isso mede principalmente adequação do produto; não demonstra que a pessoa confiaria nas lojas escolhidas. A rodada também não tinha Oxylabs habilitada localmente. Seus números são contexto histórico, não uma linha de base suficiente para a nova política.

Para o novo baseline, começar pelos 50 casos existentes e acrescentar 30 sobre lojas, vendedores, falhas e restrições. Separar relevância do produto de adequação da compra. Registrar resultados da primeira resposta e da comparação concluída, cache frio e quente, fontes habilitadas e custo total incluindo a segunda fase. Usar replay apenas quando a retenção da fonte permitir; nas demais, fixtures sintéticas e comparação ao vivo com autorização de gasto no momento da execução.

Critérios iniciais para liberar a primeira correção:

- 100% dos testes determinísticos de loja explícita, evitados e incompatibilidades conhecidas passam.
- Nenhuma reputação de vendedor é derivada da nota do produto; nenhuma loja menor é promovida como verificada sem evidência comercial.
- Nas consultas comuns com oferta adequada disponível, pelo menos 90% das consultas terminam com maioria das escolhas em lojistas estabelecidos e verificados. Determinar disponibilidade pelo conjunto de referência conferido, e não apenas pelo que o sistema conseguiu buscar: deixar de adquirir uma oferta conhecida existente conta como falha. Separar os casos em que realmente não havia oferta adequada nessas lojas.
- 100% das escolhas de loja menor carregam motivo de exceção e evidência de confiança; ausência desses dados bloqueia promoção, não a descoberta interna.
- Precisão e NDCG do produto não regridem materialmente: investigar queda acima de 2 pontos percentuais de precisão ou 0,02 de NDCG; não tratar pequenas amostras como prova estatística.
- Medir tempo até a primeira opção útil e até o conjunto final. Meta inicial a validar: primeira lista útil em até 20 s na mediana, p95 não superior a 1,2 vez a linha de base comparável. Ao vencer o prazo, resposta parcial honesta; não substituição por lojas desconhecidas para cumprir a meta.
- Custo total respeita os tetos já existentes; comparar também custo por pesquisa que chegou a opções adequadas. Novos custos acima da linha de base precisam de ganho demonstrado.

Para sustentar a ambição de ser a melhor busca, acrescentar avaliação cega de ponta a ponta com pessoas, sobre 20–30 pedidos reais variados, contra alternativas de mercado sob condições equivalentes. Medir “eu compraria uma dessas opções?”, qualidade das justificativas, confiabilidade das condições e esforço para decidir. Não alegar superioridade a partir de um juiz automático ou de um único exemplo.

Registrar impressões com exposição/posição e a versão da política; preferências explícitas, clique, escolha e rejeição com motivo. Aprender com uso só quando houver volume e correção para viés de exposição; a primeira versão usa regras e evidências revisáveis.

## Revisão do desenho

- [x] Código atual e estudos anteriores inspecionados.
- [x] Exemplo de tênis branco conferido no relatório gravado.
- [x] Regra para lojas menores confirmada pela pessoa.
- [x] Três abordagens e suas limitações comparadas.
- [x] Proposta separa confiança comercial, evidência técnica e adequação do produto.
- [x] Escopo dividido em entregas verificáveis, reaproveitando os mecanismos atuais.
- [ ] Revisar este desenho com a pessoa antes de detalhar e executar alterações no motor.

Decisão a revisar: aprovar a política e a Entrega 1 como primeira correção, precedida do baseline da Entrega 0. Cobertura adicional e calibração seguem como entregas próprias. O próximo artefato técnico é o plano de execução dessa primeira correção, com código e testes concretos.
