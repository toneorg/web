# Discovery de produtos da tone com treg e conectores próprios

Data: 15/11/2026. Estado: desenho concreto proposto para revisão; implementação ainda não iniciada.

## Objetivo e decisões de produto

Melhorar a pesquisa da tone combinando cobertura ampla, busca independente da Amazon Brasil e os conectores próprios existentes. A unidade de qualidade é uma alternativa que corresponde ao pedido e tem evidências suficientes para a comparação, não a quantidade bruta de resultados.

O foco inicial é o Brasil, com preços explicitamente em BRL, preservando requisitos obrigatórios, preferências e lojas escolhidas. A tone continua sem publicidade, comissão ou links de afiliado, conforme a [decisão vigente](/Users/gabriel/tone/web/docs/adr/0001-app-da-tone-nao-recebe-para-recomendar.md).

O REA serviu para investigar a Gecko; não participa da pesquisa de cada pessoa em produção. As lições aproveitadas são conectores específicos, contratos de dados, aquisição separada de parsing, enriquecimento seletivo e distinção entre falha e dado ausente. Não haverá dependência da Gecko para esta capacidade.

## O que existe no código

O backend está no checkout `/Users/gabriel/tone/tone-extension`, cujo README já o identifica como servidor da tone; o remoto local ainda se chama `toneorg/extension`. A web está em `/Users/gabriel/tone/web`. Os contratos em `web/src/tone/shared` são gerados a partir de `packages/shared` do servidor e não devem ser editados à mão.

O fluxo atual usa Serper Shopping para descoberta e até seis detalhes Litescrape em paralelo. Também dispõe de oito conectores HTTP próprios — KaBuM!, Carrefour, Fast Shop, Americanas, C&A, Pague Menos, Drogaria São Paulo e Época — e uma integração opcional de leitura remota. A pesquisa já contém orçamento, cancelamento, progresso, avaliação de requisitos e histórico por oferta.

Pontos que limitam a combinação de fontes hoje:

- `research/transport.ts` possui contratos fixos de descoberta e detalhes Google; não lê o envelope nativo DataForSEO.
- A deduplicação em `appendOffer` usa URL inteira. ASINs com rastreamentos diferentes podem virar ofertas repetidas.
- O ranking conserva muito da ordem dos fornecedores. A janela de doze ofertas do modelo pode ser ocupada por alternativas semelhantes ou inadequadas.
- `recommendedOfferIds` depende da avaliação de requisitos; conflitos de identidade são principalmente comunicados e ordenados, em vez de serem uma barreira final comum.
- Textos de proveniência chamam toda evidência de índice de Google Shopping. Uma fonte Amazon precisa ser identificada corretamente.
- A lista de lojas aceitas é explícita. Encontrar uma loja num índice não autoriza aceitar qualquer destino ou imagem automaticamente.

## Alternativas consideradas

| Abordagem | Benefício | Custo e limitação |
| --- | --- | --- |
| **Híbrida: treg + conectores próprios, recomendada** | Amplia cobertura já agora e preserva as leituras de origem que funcionam | Exige normalização e seleção rigorosas; disponibilidade varia por fonte |
| Usar apenas endpoints treg | Menor esforço de aquisição | Continua dependente de fornecedores e dos erros de cada formato; não resolve identidade sozinho |
| Construir coletores próprios para os seis marketplaces | Maior controle sobre a implementação | Bloqueios e manutenção já apareceram nos testes; aumenta bastante o escopo antes de entregar melhoria |

## Validação real feita antes da implementação

Foram executadas seis chamadas pagas: três consultas em cada uma de duas fontes. Resultados e recibos resumidos estão em [discovery-treg-evaluation.json](/Users/gabriel/tone/web/docs/research/2026-11-15-discovery-treg-evaluation.json).

| Consulta | Amazon: itens brutos / produtos sem marcação de anúncio | Google Shopping: itens |
| --- | --- | --- |
| JBL Tune 520BT | 66 / 48 | 40 |
| Apple iPhone 15 128GB azul | 60 / 48 | 20 |
| Base Maybelline Fit Me 120 | 60 / 48 | 38 |

O total foi **US$0,0159**: Amazon DataForSEO US$0,0033 e Serper Shopping US$0,002 por chamada. Esses são recibos desta rodada e os preços consultados no catálogo, não preço garantido de futuras chamadas.

As respostas Amazon misturam `amazon_paid` e `amazon_serp`. No caso JBL, cinco entradas classificadas como `amazon_serp` ainda tinham URL `/sspa/click`; por isso a classificação de anúncio precisa usar ambos os sinais. O primeiro produto da busca 520BT era um 530BT. Na consulta iPhone, o produto exato apareceu sem preço; um seminovo tinha preço. Na consulta de base, apareceram outras cores e formulações. Os testes não demonstram cobertura de todo o catálogo nem preço de checkout.

## Fontes e modalidades

1. **Google Shopping / Serper:** continua como descoberta ampla de varejistas. Google continua sendo índice, mesmo quando um detalhe fornece a URL da loja.
2. **Amazon BR / DataForSEO:** fonte independente, usando `dataforseo.x.merchant-amazon-products-live-advanced`, localização 2076, idioma `pt_BR`, domínio `amazon.com.br`, uma tarefa por POST e uma página. O formato nativo contém ASIN, preço/moeda, avaliação, sinais de compra e textos de ofertas. Fonte documental: [DataForSEO](https://docs.dataforseo.com/v3/merchant/amazon/products/live/advanced/).
3. **Conectores próprios e leitura remota existentes:** confirmação e cobertura complementar nas lojas selecionadas, conforme as capacidades já implementadas. Uma recusa continua sendo bloqueio.
4. **Mercado Livre, Magalu, Shopee, AliExpress e Temu:** usar sua presença no índice e as leituras realmente disponíveis; não anunciar busca nativa validada quando não há conector. A pesquisa de catálogo treg não encontrou busca nativa Mercado Livre. Cobertura por índice não equivale a cobertura integral da plataforma.
5. **TikTok Shop:** permanece fora da precificação e do ranking inicial. Os relatos anexados registram inconsistência de unidades, limitação regional e falhas em detalhes. Um futuro adaptador de tendências terá finalidade e validação próprias.

O endpoint roteado Amazon é mais caro no catálogo atual e não inclui DataForSEO no plano observado. Escolher DataForSEO explicitamente é justificado por sua resposta nativa mais rica e pelo custo medido. A camada continuará com adaptadores substituíveis; não fará busca de catálogo de ferramentas em cada consulta de uma pessoa.

## Fluxo de execução

1. Validar intenção, condições e escopo antes de qualquer custo. Não enviar memória, e-mail ou conversa inteira ao fornecedor.
2. Planejar as fontes aplicáveis. Amazon só participa se o escopo for livre ou incluir `amazon.com.br`; uma busca explícita em outra loja não a chama.
3. Iniciar Google, Amazon aplicável e leituras de lojas selecionadas sem serializar uma fonte atrás da outra. Uma fonte que terminou pode emitir resultado parcial enquanto as outras continuam.
4. Validar os envelopes HTTP e de tarefa. DataForSEO exige status de sucesso também em `tasks[]`; HTTP 200 não comprova sucesso.
5. Normalizar candidatos com identificadores, preços, fonte e instante da coleta. Remover anúncios identificáveis e destinos inadequados antes da janela do modelo.
6. Escolher detalhes úteis conforme o pedido e o orçamento. Google mantém no máximo seis agrupamentos; não enriquecer todo item retornado.
7. Reconciliar duplicatas com identidade forte, avaliar requisitos e montar uma seleção com diversidade de produtos e lojas, sem gastar a janela com rastreamentos do mesmo item.
8. Entregar resultado e lacunas por fonte. Aproveitar a ampliação única já existente do agente quando houver poucas opções, sem criar outro laço interno de buscas.

Uma fonte indisponível não apaga ofertas válidas de outra. Falha, ausência de correspondência, preço ausente, limite de orçamento e cancelamento mantêm significados distintos.

## Identidade, deduplicação e ranking

O filtro de identidade antecede a comparação de preço. Modelo, capacidade, concentração/formulação, quantidade do kit, condição e variante explícita não podem ser trocados silenciosamente. Cor ou tom informado pela pessoa é uma restrição a preservar. Se não está visível na oferta, permanece desconhecido; um tom diferente não é alternativa equivalente.

Um conflito comprovado não entra em `recommendedOfferIds`, mesmo que não haja requisitos formais além da consulta. Pode permanecer no resultado como alternativa diferente, com motivo, sem ocupar as primeiras posições de correspondências válidas.

Deduplicar Amazon pelo ASIN validado e contexto compatível. Limpar somente parâmetros de rastreamento conhecidos; preservar parâmetros de variante e vendedor. Entre fontes, uma URL de produto canônica idêntica permite reunir observações compatíveis. Título semelhante, agrupamento Google ou ASIN de outra variante não autorizam fusão. Vendedores diferentes continuam ofertas diferentes. Conservar evidências de todos os fornecedores usados e não transferir campos entre ofertas sem suporte.

O ranking é determinístico e explicável: requisitos obrigatórios satisfeitos, identidade confirmada, qualidade e atualidade conhecida da evidência e, dentro de ofertas comparáveis, preço. Desconhecidos ficam separados de conflitos. Diversidade funciona depois das condições de elegibilidade. Avaliações e popularidade são contexto, não substituto de compatibilidade nem prova de qualidade/autenticidade. A ordem patrocinada do fornecedor não define a recomendação da tone.

## Preço e sinais comerciais

Cada adaptador interpreta sua própria unidade monetária. Não haverá regra heurística que divida valores por 100 porque parecem altos. Moeda ausente fica desconhecida; quantidade zero não significa ausência de dados.

Preservar preço único, faixa e limite inferior conforme o significado confirmado no fornecedor. `price_from` não vira total final. Valores ambíguos ou anunciados como “a partir de” não ganham certeza artificial. Campos de parcelamento e Pix continuam distintos.

Acrescentar sinais opcionais com evidência no contrato compartilhado: resumo de avaliação, contagem reportada de compras e textos de benefício/cupom. A precisão da contagem deve acompanhar o que o fornecedor realmente informa; sem precisão, não afirmar uma quantidade exata de vendas. Cupom continua texto anunciado até que suas condições sejam conhecidas. Não subtrair automaticamente de um preço nem afirmar que está disponível à pessoa.

Preço riscado e percentual do fornecedor não demonstram promoção real. O histórico existente pode dizer “menor observado pela tone” apenas na janela efetivamente observada, para a mesma oferta/condição. Não criar retrospectivamente trinta dias de histórico a partir da coleta de hoje.

## Proveniência, orçamento e interrupção

A evidência DataForSEO será identificada como listagem Amazon obtida por um fornecedor, sem promover uma coleta terceirizada a verificação direta na origem. O timestamp do fornecedor indica aquisição, não atualização da loja; `sourceUpdatedAt` continua nulo quando não conhecido. Textos do modelo e da web devem distinguir Google Shopping, listagem Amazon, leitura direta e leitura remota.

O custo nominal de uma rodada com Google, Amazon e seis detalhes Google é US$0,0062, sem modelos ou leituras remotas. Propor teto adicional de **US$0,01 por execução para esses dados**, sempre subordinado ao ledger semanal existente. Uma ampliação do agente é outra execução e também tem teto; ela não permite ignorar o orçamento global. Preços configurados serão limites explícitos, liquidados pelo recibo real.

Todas as operações preservam reserva antes da rede, chave de idempotência, recibo, corpo limitado, timeout e `AbortSignal`. Cobrança incerta mantém reserva e não dispara tentativa em outro fornecedor. Cancelar impede novas operações. HTTP 202 pendente não é falha nem autoriza duplicar um job. Não fazer fallback silencioso para provedores mais caros.

Não adicionar cache compartilhado de resultados nesta primeira entrega. O catálogo Serper traz política `cache: forbidden`; política e permissões de retenção precisam ser tratadas por fornecedor antes de qualquer cache futuro. A persistência funcional existente de pesquisa e histórico não vira um cache operacional novo.

## Local da implementação e contratos

No servidor:

- `apps/server/src/research/`: adaptador Amazon, planejamento de fontes, transporte validado, deduplicação e seleção; aproveitar os módulos de identidade existentes.
- `apps/server/src/research/index.ts`: orquestrar as fontes e os resultados parciais, extraindo unidades quando necessário para não aumentar o arquivo monolítico.
- `apps/server/src/research/model-content.ts`: descrever fonte e sinais, preservar conteúdo externo como dado e limitar a janela após a seleção de qualidade.
- `packages/shared/src/research.ts` e `provenance.ts`: campos opcionais de sinais com suporte de evidência e descrição correta das fontes.
- `docs/pesquisa-servidor.md`, `docs/arquitetura.md` e a linha pertinente em `docs/requisitos.md`: registrar comportamento e limites reais.

Na web: sincronizar os contratos a partir do servidor com o script existente; verificar consumidores de proveniência e validação. Não editar os arquivos gerados à mão. Não há nova tela neste escopo; se um texto visível mudar, seguir a referência de design aplicável.

Não são necessários banco novo, migração ou deploy para implementar e testar esta camada. Publicação em produção fica fora desta aprovação de implementação.

## Validação e critério de entrega

Testes com fixtures derivadas das respostas reais e HTTP controlado devem cobrir:

- DataForSEO: corpo com exatamente uma tarefa, país/domínio/idioma corretos, preço ausente/faixa, erro dentro de HTTP 200, resposta inválida ou excessiva.
- Patrocínio: filtrar tipo pago e URL de anúncio, inclusive quando o tipo diz `amazon_serp`; manter a versão orgânica independente do mesmo ASIN.
- Identidade: 520BT versus 530BT; iPhone 15 versus Pro/Plus/16; 128 versus 256 GB; novo versus seminovo; Fit Me 120 versus outras cores/formulações; acessórios versus produto.
- Combinação: uma fonte falha sem perder outra, duplicata de rastreamento não ocupa duas posições, variante/vendedor diferentes não são fundidos.
- Escopo e custo: Amazon não é chamada fora do escopo; teto respeitado; custo liquidado mesmo com erro cobrado; timeout incerto e cancelamento não criam repetição paga.
- Contrato: resultados antigos sem sinais opcionais continuam válidos; sinais novos exigem evidência; proveniência não chama Amazon de Google.
- A janela do modelo preserva as melhores correspondências e não omite as elegíveis em favor de anúncios ou duplicatas.

Executar verificações do servidor exigidas por AGENTS (`lint`, `typecheck`, `test`, `check:design`) e verificações pertinentes da web após sincronização. O resultado dos testes precisa ser distinguido da disponibilidade dos fornecedores em produção.

Para medir ganho real, comparar a seleção anterior e a nova nas três consultas já obtidas e em casos controlados de categoria, preço e escopo explícito. Registrar precisão de identidade nas primeiras cinco posições, duplicatas, cobertura útil por loja, ofertas com preço comparável, latência e custo. A meta de produto é zero conflito explícito nas recomendações dessas fixtures e zero duplicata forte nas cinco primeiras posições. As chamadas exploratórias desta sessão ainda não demonstram que o algoritmo novo atingiu a meta: ele precisa ser implementado e avaliado.

## Limites desta entrega

A primeira implementação combina recursos já operáveis. Busca nativa de Shopee/AliExpress/Temu/Mercado Livre, uma camada de tendências TikTok e um catálogo histórico global são extensões que dependem de validação própria. Não serão simulados para anunciar cobertura. A arquitetura permite esses adaptadores sem reescrever a pesquisa.

O desenho foi revisado para escopo, significado dos dados, compatibilidade e orçamento. A aprovação solicitada é para implementar este conjunto no servidor e sincronizar os contratos na web.
