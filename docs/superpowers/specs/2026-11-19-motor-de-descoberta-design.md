# Motor de descoberta da tone

Data: 19/11/2026. Estado: proposta de arquitetura para revisão; nada implementado. O código citado é o do servidor (`toneorg/extension`, `origin/main` em 55726a1), lido nesta data. Ponto de partida: a resposta do ChatGPT sobre como ele construiria a busca, que a pessoa responsável trouxe para a conversa.

## Em uma página

- A pesquisa de hoje é uma **federação ao vivo**: a cada pedido, a tone consulta de quatro a seis fontes externas, junta algumas dezenas de ofertas, filtra por palavras e por regras escritas para eletrônicos e perfumes, e entrega até 12 ao modelo. É boa para achar **o** produto (iPhone 16 128 GB, Sauvage EDP 100 ml) ao melhor preço. É fraca para **descobrir** (uma camisa de linho para a praia): as candidatas são poucas, nascem de buscas por palavras de terceiros e são jogadas fora no fim de cada pesquisa.
- O ChatGPT não ganha por escolher melhor no fim. Ele desdobra o pedido em várias buscas de produto, consulta um índice próprio grande (páginas de produto rastreadas, sinais do Google, feeds de lojas) e só então raciocina. A diferença está nas candidatas e nos dados de cada produto, não no prompt.
- Proposta: dois caminhos (**identidade** e **descoberta**). A descoberta ganha (1) uma intenção estruturada com taxonomia de moda, (2) busca híbrida num índice da tone e em fontes ao vivo que já fazem busca semântica, (3) uma ficha da tone por produto, calculada uma vez e guardada, (4) ordenação em três etapas e (5) resposta em duas fases.
- Achado que muda a ordem do trabalho: o **Global Catalog da Shopify**, aberto a agentes e sem chave, devolveu em 0,38 s dez camisas de linho de marcas brasileiras, com preço em reais, nota, fotos e composição do tecido. A **busca pública das lojas VTEX** respondeu em Hering, Farm, Animale, Osklen, C&A e Reserva. As duas são gratuitas e resolvem boa parte das candidatas de moda antes de existir um índice próprio.
- Não há cliques suficientes para aprender a ordenar (41 turnos de 4 pessoas em 30 dias, PostHog). A ordenação começa com pesos escritos à mão e é medida por uma avaliação offline com pools gravados. LightGBM, OpenSearch, um serviço em Python e filas externas ficam para quando houver volume.

## Como a pesquisa funciona hoje

1. O modelo do chat (DeepSeek V4.1 Flash) chama `research_products` com `intent.query`, requisitos em texto livre (`field`, `description`, prioridade), até 4 `queryVariants` e até 3 lojas em `remoteSelection`. Não existe formato de intenção para moda: caimento, silhueta, tecido e ocasião só aparecem como texto.
2. `ProductResearch.execute` (`research/index.ts`) dispara ao mesmo tempo: Google Shopping pelo treg (a consulta e a primeira variação, até 40 linhas cada, detalhe de 6 grupos), Amazon (DataForSEO), as lojas escolhidas (busca da própria loja, Oxylabs para Shein, Mercado Livre e Magalu, artefatos Pomerado locais) e a cópia local do catálogo (Época, Dior e Sephora, só beleza, por trigramas).
3. Um resultado de loja só entra se metade das palavras da consulta estiver no título (`relevantTo`, `identity.ts:183`).
4. `rankOffers` (`ranking.ts`) ordena por camadas: conflito de identidade (modelo, capacidade, concentração, usado), requisito obrigatório reprovado, desconhecido; depois atualidade, nível da evidência e preço. Não há nota de semelhança de sentido, de imagem ou de gosto, nem diversidade.
5. `assessQuality` (`quality.ts`) tira réplicas, preços improváveis e lojas evitadas; `broaden.ts` amplia quando sobram menos de 3 opções.
6. Cada oferta que vai ao modelo passa por uma chamada de triagem contra injeção (4 por vez, de 4 a 8 s cada). Em pedidos de roupa, as fotos de até 12 ofertas são lidas pelo Gemini 2.5 Flash Lite e a Haiku 5.5 escolhe até 4 com o porquê (`pick.ts`).

Medido em 16/11/2026 (`docs/descoberta-ampla.md`): para "camisa de linho branca" com @Shein, os turnos levaram 43 e 64 s, a Shein leu 4 páginas e a tone mostrou 2 camisas, nenhuma branca; o ChatGPT mostrou 4 de 4 brancas ou off white. Depois das correções daquele dia, o teto de dados de uma pesquisa de moda passou a US$ 0,02.

## Onde a tone perde

| # | Lacuna | Evidência no código | Efeito |
|---|---|---|---|
| 1 | Poucas candidatas, achadas por palavras | Até 40 linhas por busca de terceiros, 8 páginas da Shein; `relevantTo` corta "Camisa gola cubana off white" numa busca por "camisa resort masculina branca" (1 de 4 palavras) | Alternativas que a pessoa não conhecia nunca chegam à escolha |
| 2 | Nada se acumula | Fotos lidas ficam 6 h em memória (`photos.ts`); triagem refeita a cada pesquisa; o catálogo local é só de beleza | Custo e espera por pedido, sem formar um ativo |
| 3 | Produto sem ficha | O modelo lê título, ficha crua da loja e uma linha sobre a foto | Não dá para filtrar "cintura alta" nem explicar com segurança |
| 4 | Ordem feita para identidade | As camadas de `ranking.ts` servem a iPhone e perfume; o gosto só entra na escolha final, sobre 12 sobreviventes | Nada diz qual calça larga é mais "casual sofisticada" |
| 5 | Lenta | A resposta espera a fonte mais lenta (prazo de 40 s na Shein) | Turnos de 40 a 60 s em moda |
| 6 | Fontes de moda estreitas | Marketplaces e Google Shopping | Marcas com loja própria ficam de fora (issue #49) |
| 7 | Medição parcial | `eval:descoberta` conta cor e tecido dos produtos mostrados | Mede acerto do que apareceu, não o que ficou de fora nem a ordem |

## O que o ChatGPT faz de fato

Fontes externas, sem acesso ao funcionamento interno; os números vêm de quem observa o ChatGPT de fora:

- Desdobra cada pedido em sub-buscas de produto ("product query fanout"), separadas das buscas que alimentam o texto da resposta ([Profound, 23/07/2026](https://tryprofound.com/blog/chatgpt-shopping-end-to-end-breakdown)).
- As candidatas vêm do índice de busca de produto do próprio ChatGPT, de sinais do índice do Google e de fontes diretas das lojas. Numa amostra de 812 mil cartões de produto (junho de 2026), 87,3% vieram de páginas de produto rastreadas e 12,7% de feeds enviados pelas lojas ([Profound](https://www.tryprofound.com/blog/chatgpt-shopping-deep-dive)).
- Os cartões mais bem colocados têm mais avaliações, selos calculados ("melhor preço") e preço promocional; o Reddit responde por cerca de um terço das citações do texto.
- A OpenAI publica os critérios só em termos gerais (disponibilidade, preço, qualidade, ser o fabricante ou vendedor principal); os pesos não são públicos.

O que vale copiar: o desdobramento em buscas de produto, um índice próprio, dados ricos por produto e avaliações como sinal. O que não vale: popularidade e promoção como critério principal. A vantagem da tone é outra: neutralidade, recomendação explicada e o que ela sabe da pessoa.

## Fontes de moda no Brasil: testadas em 19/11/2026

| Fonte | Teste | Cobertura | Custo | Regras de uso |
|---|---|---|---|---|
| Shopify Global Catalog (`catalog.shopify.com/api/ucp/mcp`, protocolo UCP) | HTTP 200 em 0,38 s; "camisa de linho branca masculina" com entrega no Brasil devolveu 10 produtos de marcas brasileiras (Santolin, Fio a Fio Beach, Rivello, Almaselvagem, Azulô, Merino Alfaiataria), metade branca no título, preço em BRL, fotos, nota com contagem e descrição com composição ("20% Linho, 80% Algodão"). Uma segunda busca, de calça de alfaiataria preta, também em 0,38 s | Lojas Shopify que entregam no Brasil. Busca por texto, por imagem e por "parecidos com"; filtros de entrega, origem, preço, atributo (cor, tamanho), nota e faixa de preço; resultados agrupados por produto universal (UPID) | Grátis, com limite de taxa | Uso só para mostrar produtos à pessoa; sem coleta em massa; cache de até 24 h para dados e fotos, 10 min para preço e disponibilidade; manter os parâmetros de atribuição (`shcgid`, `shclid`) ([Shopify](https://shopify.dev/docs/agents/catalog)) |
| VTEX, busca pública (`/api/catalog_system/pub/products/search?ft=`) | Respondeu em Hering, Farm, Animale, Osklen, C&A e Reserva, de 0,5 a 1,5 s. Renner (404), Riachuelo (403) e Arezzo (404) não | Grandes marcas e varejistas de moda | Grátis | Páginas públicas; respeitar robots e ritmo (como `catalog/polite.ts`) |
| Google Shopping (Serper pelo treg) | Em uso | Ampla e rasa | ~US$ 0,002 por busca | `cache: forbidden`: não pode ir para o índice |
| Oxylabs (Shein, Mercado Livre, Magalu) | Em uso | Marketplaces | US$ 0,001 a 0,002 por chamada | Leitura de página pública pela tone |
| Amazon (DataForSEO pelo treg) | Em uso | Amazon | ~US$ 0,0033 por busca | Listagem de fornecedor, sem confirmação na origem |

O teste da Shopify usou o perfil de agente de exemplo da documentação. Em produção a tone precisa do próprio perfil num endereço público (por exemplo, em `heytone.app`). Zara, Shein, Renner e Riachuelo não estão na Shopify nem na VTEX pública: continuam pelos caminhos de hoje.

## Princípio: dois caminhos

- **Identidade**: o pedido nomeia um produto (modelo, capacidade, volume, cor de uma base). O problema é achar a mesma coisa em várias lojas e comparar as ofertas. O caminho de hoje fica, com as camadas de identidade e o EAN.
- **Descoberta**: o pedido descreve (categoria, atributos, ocasião, gosto). O problema é ter boas candidatas e escolher pelo gosto. É aqui que entra a arquitetura nova.
- A intenção diz qual (`kind`), e o classificador barato (Jev) desempata. Beleza mistura os dois: "base Fit Me 120" é identidade; "base para pele oleosa que não marque" é descoberta.

## Arquitetura alvo

```
 Conversa
    │
    ▼
 1. Intenção estruturada ── ShoppingIntent + taxonomia de moda
    │  restrições firmes · preferências com peso · referência (foto ou produto) · descartes
    ▼
 2. Busca de candidatas ── várias formas de busca por fonte, em paralelo
    ├─ Fase 1 (até ~8 s):  Índice da tone (Postgres: texto em português + vetor de texto + vetor de imagem)
    │                      Shopify Global Catalog (texto, imagem, parecidos)
    │                      VTEX das lojas cadastradas
    └─ Fase 2 (segundo plano, até ~60 s): Google Shopping, Amazon, Shein / ML / Magalu (Oxylabs)
    │
    ▼  forma única (Candidata) · agrupamento por EAN, UPID ou foto quase igual
 3. Ficha da tone ── por produto, guardada: atributos com valor, confiança e fonte; vetores
    ▼
 4. Ordenação ── elegibilidade (regras) → nota (pesos explicáveis) → diversidade → escolha final (Haiku, até 24)
    ▼
 5. Resposta ── 3 ou 4 produtos, o porquê ligado ao pedido e o ponto fraco; o que a fase 2 achar chega depois
```

### 1. Intenção estruturada

- Ampliar `ResearchRequest` (`packages/shared/src/research.ts`) com campos opcionais, sem quebrar pedidos antigos: `kind`, `category` (nó da taxonomia), `audience`, `constraints` tipadas (`priceMax`, `colors`, `materials`, `sizes`, lojas e marcas evitadas, condição), `preferences` (atributo, valores e peso), `visualDescription` (uma frase do que se vê, para os vetores), `reference` (`photoId` ou `offerId`) e `exclude` (ofertas e grupos descartados).
- Quem preenche é o modelo do chat, na chamada que já faz; não há chamada extra. O servidor normaliza com a taxonomia (sinônimo para valor canônico) e junta o perfil com `mergePersonal`, que já existe. Comportamento decidido no código, como pede o roteiro #23.
- **Taxonomia de moda** versionada em `packages/shared` (`fashion.ts`): categorias e atributos com valores fechados e sinônimos em português (pantalona, wide leg e calça larga; gola cubana e camisa resort; oversized e ampla). A mesma lista expande a busca por palavras, limita a extração (enum no zod), explica os valores ao modelo e alimenta a biblioteca de silhuetas (#39).
- Primeira versão: camisa, camiseta, calça, bermuda, vestido, saia, jaqueta, blazer, tênis e sandália; atributos cor, estampa, tecido e composição, caimento, silhueta, comprimento, cintura, gola ou decote, manga, transparência, ocasião, estética e clima.
- A intenção fica gravada com a decisão da conversa (`decisions`). Cada resposta da pessoa vira uma alteração dela (seção 6).

### 2. Busca de candidatas

- **Várias buscas por fonte**: até 4 formas de busca (as `queryVariants` de hoje, mais os sinônimos da taxonomia), em paralelo, cada fonte com prazo próprio.
- **Índice da tone**: busca híbrida numa só consulta SQL. Texto em português (`tsvector` com `unaccent` e o dicionário `portuguese`), vetor de texto e vetor de imagem (texto para imagem), unidos por Reciprocal Rank Fusion, como no guia de busca híbrida do Supabase. As restrições firmes vão no `WHERE` (preço, público, categoria, disponibilidade, loja evitada). Alvo: 200 candidatas em menos de 150 ms.
- **Fontes ao vivo com busca semântica** (Shopify) entram na fase 1; as que dependem de raspagem lenta ficam na fase 2.
- No caminho de descoberta, o portão `relevantTo` sai. Entram um corte por semelhança de sentido (vetor da intenção contra vetor do produto) e as restrições firmes. No caminho de identidade, nada muda.
- Toda candidata vira a mesma forma (`Candidate`: produto, variante, oferta, fotos, atributos, evidência, fonte e regra de retenção) e é agrupada: pelo EAN, pelo UPID da Shopify e por foto quase igual (vetores de imagem acima de um limiar), o que junta revendas da mesma peça e ajuda o filtro de réplica (#38).
- **Escrita no índice segundo a regra de cada fonte**: VTEX, sitemap, leitura direta e Oxylabs podem ficar; Shopify, no máximo 24 h (preço, 10 min); Google Shopping, nunca.

### 3. Ficha da tone (enriquecimento)

- Calculada uma vez por produto, numa fila no banco com lease (o mesmo padrão de `watch_jobs`), quando o produto entra no índice ou na primeira vez em que vira candidata.
- Ordem: regras primeiro (composição "80% algodão, 20% linho", tamanhos, nomes de cor); depois um modelo barato de texto com saída estruturada (GLM-5.3 Flash); por último o modelo de visão, para o que só a foto mostra (Gemini 2.5 Flash Lite, já em uso: cor, estampa, caimento visível, comprimento, gola).
- Cada atributo guarda `valor`, `confiança` e `fonte` (`ficha`, `título`, `foto`, `pessoa`). A ordenação não trata o que a foto sugere como o que a loja declara, e a resposta diz qual é qual ("20% linho, segundo a loja").
- A triagem contra injeção acontece aqui, uma vez por conteúdo (hash), e não a cada pesquisa. Isso tira de 4 a 8 s e uma chamada de modelo por oferta do caminho da resposta.
- Vetores: um de imagem (a foto principal; as outras depois) e um de texto (título, marca e atributos). O modelo sai da avaliação, entre o **Gemini Embedding 2** pelo OpenRouter (multilíngue, multimodal, sem servidor novo, US$ 0,20 por milhão de tokens de texto e US$ 0,45 de imagem, a conferir) e o **Marqo-FashionSigLIP** rodando na casa (treinado para moda, mas com texto em inglês e precisando de uma máquina de 1 a 2 GB; a de hoje tem 512 MB). Começar pelo primeiro, que não exige infraestrutura.
- A mesma ficha serve a tone para lojas: atributo desconhecido é exatamente "informação que falta no catálogo" no relatório de dúvidas.

### 4. Ordenação em três etapas

1. **Elegibilidade** (regras, sem modelo). Restrições firmes contra atributos conhecidos. Desconhecido vai para um grupo separado e nunca some sem aviso (como já fazem as camadas e `broaden.ts`). Reprovadas pelo filtro de qualidade e descartadas pela pessoa saem.
2. **Nota** (barata, para cerca de 200 candidatas). Soma com pesos de: aderência aos atributos pedidos (peso da preferência vezes a confiança do atributo), semelhança de texto, semelhança de imagem com a descrição visual ou com a foto de referência, gosto da pessoa (média das imagens curtidas, quando existir; #34 e #35), encaixe no orçamento, confiança na loja (base de lojas e marcas, #32), nota vezes o logaritmo do número de avaliações e atualidade da evidência. Pesos escritos à mão, ajustados na avaliação offline; cada termo vira uma linha possível do porquê.
3. **Diversidade e escolha final**. MMR sobre os vetores de imagem, a loja e a faixa de preço, para formar as 24 primeiras. A Haiku 5.5, que já é o `PICK_MODEL`, recebe essas 24 com a ficha estruturada e escolhe de 3 a 4, com o porquê e o cuidado. Hoje ela vê 12, sem ficha.

Popularidade nunca decide sozinha, e nenhum peso vem de dinheiro de loja ([ADR 0001](../../adr/0001-app-da-tone-nao-recebe-para-recomendar.md)).

### 5. Resposta em duas fases

- **Fase 1, até cerca de 8 s**: índice, Shopify e VTEX; nota; escolha; resposta.
- **Fase 2, em segundo plano, até cerca de 60 s**: marketplaces e Google Shopping. Se a fase 2 achar algo que entra entre os 4 primeiros, a conversa recebe uma mensagem curta com o componente ("achei mais duas opções na Shein"). O progresso e os resultados parciais (T13) já existem; falta a mensagem depois do fim do turno, que `docs/pesquisa-oxylabs.md` já lista como próximo passo.
- Lojas pedidas com @ continuam valendo e, se forem lentas, a fase 1 avisa que elas chegam em seguida.
- O preço dos escolhidos é relido na loja antes de mostrar quando a leitura tiver mais de 6 h, regra que o catálogo já usa.

### 6. Conversa que refina

Cada resposta vira uma alteração da intenção, aplicada sobre as candidatas já ordenadas (guardadas com a pesquisa), sem nova busca quando dá:

| A pessoa diz | Alteração da intenção | Nova busca? |
|---|---|---|
| "Mais barato" | `priceMax` desce; reordena | Não |
| "Não gosto de calças tão largas" | Preferência contra `caimento: wide_leg`, a favor de `reto` | Só se sobrar pouco |
| "Parecido com a primeira" | `reference.offerId`; vizinhos pelo vetor de imagem (índice e `like` da Shopify) | Sim, rápida |
| "Quero uma de linho" | `materials` vira restrição firme | Sim |
| "Monte três looks com esse tênis" | Categorias que completam e compatibilidade entre peças | Fase posterior |

### 7. Medição

- **Conjunto de referência v1**: cerca de 100 pedidos (60 de roupa, 20 de beleza, 20 de identidade), tirados das conversas reais e dos casos já gravados (`eval/descoberta.ts`, `eval/fixtures/pesquisa-reuniao.ts`).
- **Pools gravados**: cada fonte roda uma vez por pedido e a resposta bruta fica salva. As candidatas de todos os sistemas comparados são juntadas e julgadas uma vez, de 0 a 3, por um juiz barato que vê a foto; uma pessoa confere 20%. Depois disso, mudar a ordenação custa zero: roda offline sobre os pools.
- **Métricas**: restrições firmes atendidas nos 4 mostrados (meta 100% quando o atributo é conhecido), NDCG@4, recall@50 da busca de candidatas, pedidos sem opção viável (meta abaixo de 5%), marcas distintas entre os 4 (pelo menos 3), tempo até os primeiros produtos (p50 até 8 s) e custo por pesquisa.
- **Comparação com o ChatGPT**: 20 pedidos de moda feitos à mão nos dois, julgados às cegas, aos pares.
- **Na produção**: gravar cada exibição com a posição e os termos da nota (`search_impressions`), com clique, escolha e "não curti" com motivo. O volume de hoje não treina um modelo, mas sem esse registro nunca vai treinar.

## Dados

Evolui `catalog_items` em vez de criar um banco ao lado. Esboço, no schema `tone`:

```sql
create extension if not exists vector;
create extension if not exists unaccent;

create table catalog_products (
  id text primary key,
  cluster_id text,                    -- mesmo produto em várias lojas: EAN, UPID ou foto quase igual
  brand text, title text not null, description text,
  category text, audience text,       -- nós da taxonomia
  attributes jsonb not null default '{}',
                                      -- {"caimento":{"valor":"wide_leg","confianca":0.91,"fonte":"foto"}}
  text_embedding halfvec(768),
  image_embedding halfvec(768),
  fts tsvector,                       -- configuração portuguesa com unaccent
  source text not null,               -- vtex | sitemap | direct | oxylabs | shopify
  expires_at timestamptz,             -- Shopify: 24 h; fontes próprias: null
  content_hash text, enriched_at timestamptz
);
create table catalog_offers (
  id text primary key, product_id text references catalog_products on delete cascade,
  store text, url text, price numeric, currency text, availability text,
  sizes jsonb, observed_at timestamptz, evidence_level text
);
create table enrichment_jobs (product_id text primary key, state text, lease_until timestamptz, attempts int);
create table search_impressions (
  search_id text, offer_id text, position int, phase int, features jsonb,
  clicked boolean, picked boolean, rejected_reason text, created_at timestamptz
);
-- índices: HNSW em text_embedding e image_embedding; GIN em fts e attributes; trigram em title
```

Espaço: 50 mil produtos com dois vetores `halfvec(768)` ocupam perto de 150 MB só nos vetores, e algo parecido nos índices HNSW. Conferir o plano do Supabase antes de passar de 200 mil.

## Modelos e custo

| Papel | Modelo | Muda? |
|---|---|---|
| Conversa e intenção | DeepSeek V4.1 Flash (`CHAT_MODEL`) | Não; só o schema da ferramenta cresce |
| Atributos pelo texto | GLM-5.3 Flash (`CHEAP_MODEL`) | Novo uso, uma vez por produto |
| Atributos pela foto | Gemini 2.5 Flash Lite (`VISION_MODEL`) | Passa da pesquisa para a ficha |
| Vetores | Gemini Embedding 2 pelo OpenRouter, ou modelo na casa | Novo |
| Escolha final | Claude Haiku 5.5 (`PICK_MODEL`) | Recebe 24 com ficha em vez de 12 |
| Juiz da avaliação | Gemini Flash Lite ou GPT-6 Luna | Só offline |

Nenhum modelo caro entra, nem em teste.

Por pesquisa de descoberta, estimado: fase 1 sem custo de dados (índice, Shopify e VTEX); vetor da consulta perto de US$ 0,00001; escolha final com 24 candidatas perto de US$ 0,001; fichas de candidatas que ainda não estão no índice, perto de US$ 0,0002 cada, uma vez. A fase 2 custa o que a pesquisa custa hoje (teto de US$ 0,02) e pode ficar só para quando a fase 1 trouxer pouco ou a pessoa pedir a loja.

Uma vez, para indexar 50 mil peças de roupa: perto de US$ 25 (vetores de imagem e texto, atributos por texto e por foto), a conferir com os preços do OpenRouter. Pode ser feito aos poucos: vetores para todos, ficha completa só quando o produto vira candidata.

## Onde esta proposta difere da do ChatGPT

- **Python, FastAPI, Redis, Celery, OpenSearch**: o servidor é um processo Node com Postgres. A busca híbrida cabe no Postgres até milhões de linhas, e a fila cabe numa tabela com lease, como os acompanhamentos. Separar serviços agora só traria operação.
- **LightGBM**: precisa de milhares de interações rotuladas; a tone tem 41 turnos por mês. Primeiro pesos à mão e avaliação; o registro de exibições prepara o modelo para depois.
- **CLIP ou SigLIP como primeira escolha**: os modelos de moda têm texto em inglês e a pessoa escreve em português. A avaliação decide contra um modelo multilíngue.
- **300 a 500 pedidos de referência**: começar com 100 bem julgados e crescer com as conversas.
- **De acordo**: taxonomia, confiança por atributo, busca híbrida, reranking só no topo, restrições firmes separadas de preferências e começar por uma categoria (roupa).
- **O que faltou**: o acesso às fontes no Brasil (o gargalo real), as regras de cache de cada fonte, o tempo de resposta, o custo por pesquisa, a neutralidade e a diferença entre pedidos de identidade e de descoberta.

## Roteiro

| Fase | O que entra | Aceita quando | Issues |
|---|---|---|---|
| 0. Medir (~1 semana) | Conjunto v1, pools gravados, juiz, linha de base do sistema atual, 20 pedidos no ChatGPT | Relatório com as métricas da seção 7 para o sistema de hoje | Estende #24 |
| 1. Candidatas de graça (~1 a 2 semanas) | Leitor do Shopify Global Catalog com perfil de agente próprio; cadastro de lojas VTEX de moda com busca ao vivo; `kind` na intenção; descoberta sem `relevantTo`, com corte por semelhança; resposta em duas fases | Recall@50 e NDCG@4 acima da linha de base; p50 até 8 s; "camisa de linho branca" com 4 de 4 brancas | #49 |
| 2. Índice da tone (~2 a 3 semanas) | `catalog_products` com vetores e texto em português; 10 a 20 lojas VTEX de moda sincronizadas; fila de fichas; escrita das leituras ao vivo permitidas; agrupamento por foto | Busca no índice abaixo de 150 ms; ficha com atributos em 90% das roupas; ganho medido na avaliação | #38 (parte) |
| 3. Ordenação e conversa (~2 semanas) | Três etapas; escolha final com 24 e ficha; intenção como alterações; "parecido com" | Restrições firmes em 100%; vitória ou empate com o ChatGPT em pelo menos 60% dos pares | #31 |
| 4. Gosto e descoberta visual | Roteiro existente: gosto por mundinho, reordenação por imagem (vira um termo da nota), jogo de sim ou não, "mais como este", base de lojas e marcas, feed a partir do índice, looks | Critérios das issues | #32, #34 a #38, #45 |

## Riscos

- **Shopify**: limite de taxa sem chave (aumento só com conta de parceiro), dependência de uma plataforma e viés para marcas pequenas. A fusão das fontes reserva cota para cada uma.
- **Atribuição e neutralidade**: a Shopify exige manter `shcgid` e `shclid` nos links. Confirmar que não geram pagamento à tone antes de ligar, e registrar no ADR 0001.
- **Atributo errado com confiança alta** é pior que desconhecido: amostra conferida por pessoa e limiar de confiança por atributo antes de usar como restrição.
- **Preço velho no índice**: releitura dos escolhidos antes de mostrar.
- **Espaço no Supabase**: vetores em `halfvec`; medir antes de crescer.
- **Lojas da tone para lojas**: o catálogo de um lojista que paga não pode ter cobertura ou peso maior no app do que o de quem não paga.

## Durante o beta: índice que cresce com o uso

Enquanto o volume for de poucas pessoas, a indexação em lote fica para depois. No lugar dela:

- As candidatas vêm das fontes ao vivo da fase 1 (Shopify, VTEX) e das de hoje; nenhuma cópia de catálogo nova.
- A ficha é feita só para as candidatas que chegam à nota final (até 24 por pesquisa), e fica gravada no banco por produto. Produto já visto não é pago de novo; os da Shopify são refeitos depois de 24 h, pela regra de cache dela.
- O corte por sentido usa vetores de texto calculados na hora para a consulta e os títulos (centésimos de centavo por pesquisa); sem vetores de imagem guardados.
- Custo esperado: perto de US$ 0,007 por pesquisa de descoberta no começo, caindo à medida que as fichas se repetem, dentro do teto semanal de cada pessoa.
- Passar ao lote quando: o gasto com fichas sob demanda passar do custo do lote, ou o feed (#45) e o "parecido com" entre lojas entrarem no roteiro.

## Decisões

1. Shopify Global Catalog na fase 1, com perfil de agente próprio e as regras de cache: **aprovado em 19/11/2026**. Falta confirmar que a atribuição não gera pagamento.
2. Orçamento único para indexar e fazer a ficha das primeiras ~50 mil peças (estimativa: US$ 25).
3. Começar por roupa, feminina e masculina; beleza depois.
4. Vetores pela API (Gemini Embedding 2) primeiro; modelo na casa só se a avaliação mostrar ganho.
