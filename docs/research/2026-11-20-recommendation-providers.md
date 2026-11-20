# Fontes para recomendar produtos no Brasil

Verificado em 20/11/2026. Pesquisa documental; nenhuma API de produto, busca paga ou nova conexão foi executada. O catálogo do treg foi consultado somente por `catalog_search`/`catalog_get`, que não executam os provedores. Não foi medido alcance de mercado, popularidade de varejistas ou cobertura completa de qualquer loja.

## O que cada fonte permite afirmar

| Fonte | Uso útil | Limite para a recomendação |
| --- | --- | --- |
| Shopify Global Catalog | Descobrir produtos entre lojistas elegíveis; consultar produto/variante | Cobertura da plataforma; acesso externo depende de habilitação específica. |
| Google Shopping via treg/Serper | Descoberta ampla de ofertas indexadas por consulta | Encontrar uma oferta não verifica a variante, vendedor, frete e estoque atuais. |
| Oxylabs Web API | Buscar em alvos dedicados e ler páginas públicas | Ter um scraper não garante todos os campos nem leitura de qualquer loja. |
| Tilion | Renderizar e ler páginas públicas de lojas; alimentar parsers da tone | É infraestrutura de navegador, sem catálogo brasileiro universal nem ficha comercial garantida. |

Estas são distinções de integração, inferidas dos contratos abaixo. A oferta verificável deve ligar **produto + variante + vendedor + condição de pagamento + destino + momento da leitura**. Um campo ausente continua desconhecido.

## Shopify: global não significa qualquer loja

`https://catalog.shopify.com/api/ucp/mcp` faz descoberta entre lojistas; `https://{storeDomain}/api/ucp/mcp` restringe-se àquela loja. `search_catalog` descobre; `lookup_catalog` atualiza identificadores; `get_product` detalha opções/variantes. O alcance padrão é de lojistas elegíveis da Shopify, sem promessa de cobrir todo SKU brasileiro. [Catálogos](https://shopify.dev/docs/agents/catalog)

Há agora fontes externas em **beta**. `sources: ["shopify", "external"]` requer versão `2026-08-25` ou `draft` **e cliente habilitado pela Shopify**; clientes não habilitados têm `sources` ignorado. Padrão: `shopify`. A fonte externa é uma oferta indexada do site do lojista, não acesso arbitrário à web: preço é indicativo da última leitura; `availability.available=true` indica anúncio presente, **não estoque atual**; compra ocorre no site do vendedor. É obrigatório identificar vendedor/fonte e aceitar IDs que deixam de resolver. `ships_to`, `ships_from` e `shops` restringem resultados existentes; não acrescentam lojas ao índice. [Extensão Global Catalog](https://shopify.dev/docs/agents/catalog/global-catalog-extension)

Publicar perfil próprio de agente antes de produção; o perfil de exemplo serve para experimentar. A chave é opcional tecnicamente, mas tráfego sem autenticação tem cota compartilhada e vazão não garantida; a orientação oficial é não usá-lo em produção. O padrão autenticado documentado é 5 requisições/s por cliente, compartilhado entre as três ferramentas. [Perfil próprio](https://shop.dev/docs/catalog-api), [autenticação e limites](https://shopify.dev/docs/agents/profiles/auth-and-rate-limiting)

**Cache vigente:** metadados e imagens CDN da Shopify até **24 h**; preço/disponibilidade até **10 min**; comissões sem cache. Preservar `shcgid`/`shclid`. Coleta em massa, treinamento e banco/índice permanente de produtos exigem consentimento da Shopify ou lojista. TTL de 24 h não autoriza guardar preços por 24 h ou criar índice permanente. [Regras de uso](https://shopify.dev/docs/agents/catalog#usage-guidelines)

O leitor atual da tone usa cache em memória de 10 min e filtros Brasil; não envia `sources`. Portanto não há evidência de cobertura externa habilitada na implementação inspecionada. [shopify.ts](/Users/gabriel/tone/worktrees/deploy-server/apps/server/src/research/shopify.ts:298)

## Google Shopping via treg

Em 20/11, o catálogo treg documentou `serper.google.serp.shopping`: `POST /shopping`, `q`, país `gl`, idioma `hl`, localização opcional e página de até 40 resultados; configurar Brasil/português. Preço anunciado no treg: **US$ 0,002/chamada**, não executada nesta pesquisa. O contrato oferece títulos, preços, lojas, imagens, avaliações e IDs; não exige credencial Serper própria quando servido pelo treg. Reprodução gratuita da inspeção: `treg catalog get serper.google.serp.shopping`. [Playground oficial Serper](https://serper.dev/playground)

A Serper consulta o Google em tempo real, segundo sua documentação; isso não transforma o conteúdo indexado pelo Google em confirmação atual no checkout. Também pode existir cache na camada treg: registrar momento de coleta e proveniência, em vez de presumir leitura direta da loja. Não há garantia de cobertura completa de Mercado Livre, Centauro, C&A, Renner, Netshoes ou Amazon em uma consulta. [Serper: funcionamento e localização](https://serper.dev/)

A documentação local mediu cinco consultas com Serper em 16/11; isso comprova apenas aquela amostra. Um resultado sem loja/variante clara ou preço riscado separado exige outra leitura antes de afirmar desconto ou melhor compra. [Medição local](/Users/gabriel/tone/worktrees/deploy-server/docs/pesquisa-oxylabs.md:25)

## Oxylabs: alvos dedicados e leitura genérica

O produto em uso é **Web API**, base `https://webapi.oxylabs.io`, diferente da API clássica `realtime.oxylabs.io`. Busca web retorna referências; leitura da página obtém conteúdo. HTML exige parser próprio; JSON pode usar parser dedicado ou extração por IA, conforme alvo. `run_js` aumenta duração; a documentação recomenda timeout próximo de 150 s. [Web API](https://developers.oxylabs.io/products/web-api/for-agents.md), [scrape genérico](https://developers.oxylabs.io/products/web-api/scrape)

| Loja | Suporte documental encontrado | Evidência disponível na tone |
| --- | --- | --- |
| Mercado Livre Brasil | `/v1/scrape/mercadolivre/search` e `/product` | Busca HTML/JSON-LD já integrada. |
| Amazon | `/amazon/search`, `/product`, `/pricing`, `/sellers`, entre outros; busca marca anúncios | Duas buscas brasileiras registradas em 16/11; integração atual não foi substituída por isso. |
| Centauro, C&A, Renner, Netshoes | Não constam como alvos dedicados na referência consultada | Leitura genérica por URL é possibilidade, **sem validação nesta pesquisa**. |

Os contratos Amazon aceitam domínio de marketplace e CEP de entrega; produto aceita ASIN e seleção automática da variante padrão. Essa seleção não verifica a cor/tamanho desejados. Nos endpoints Mercado Livre consultados, `location` é país; não é cotação de frete por CEP. A existência de endpoint de produto não prova que o parser da tone coleta reputação do vendedor, todas as variantes ou preço entregue. [Referência de comércio](https://developers.oxylabs.io/api-reference/dedicated-scrapers/commerce-scrapers.md)

A lista muda; `GET /v1/scrapers` e `OPTIONS` são a descoberta documentada. Nenhum deles foi chamado com credencial. O catálogo treg pesquisado por `oxylabs` não listou ferramentas; isso não diz que a API direta da tone está indisponível. [Descoberta de endpoints](https://developers.oxylabs.io/api-reference/overview.md), [integração e medições locais](/Users/gabriel/tone/worktrees/deploy-server/docs/pesquisa-oxylabs.md:7)

## Tilion: identidade e alcance real

O nome local é **Tilion**, identificado em `pesquisa-tilion.md`; `tilion.dev` redireciona hoje para `tilion.com`. Não confundir com Trillion Direct ou Trilion. Base REST oficial: `https://back.tilion.dev`. [Site](https://tilion.com/), [referência](https://docs.tilion.dev/reference/overview.md)

`POST /v1/scrape` abre navegador efêmero e o encerra com a resposta, devolvendo Markdown/HTML/texto. Há estados explícitos `source_empty`, `challenged`, `hard_blocked`, `requires_login` e `rate_limited`: HTTP recebido não basta. Limite total documentado: 57 s; `schema`/`prompt` nesse endpoint ainda retornam 501. A extração comercial depende dos parsers da tone. [Scrape e crawl](https://docs.tilion.dev/reading/scrape-crawl.md)

Medições locais de 20/11 encontraram buscas legíveis em Renner e Centauro; Netshoes retornou poucos preços; Mercado Livre pediu login. Não há teste de C&A nessa nota. Os leitores de busca cadastrados incluem Renner/Centauro, entre outras lojas, mas não Netshoes/C&A. São observações de páginas específicas, sem garantia futura de cobertura ou estoque. [Pesquisa local Tilion](/Users/gabriel/tone/worktrees/deploy-server/docs/pesquisa-tilion.md:13), [lojas no leitor](/Users/gabriel/tone/worktrees/deploy-server/apps/server/src/research/tilion.ts:50)

**Custo não é fixo por página:** a documentação separa sessão, ação, tempo e tráfego; plano e saída premium alteram cobrança, e página bloqueada pode ainda gerar custo de sessão. US$ 0,0001/página é medição local, não tarifa universal. O teto local de US$ 0,001 é reserva contábil, não recibo do provedor. [Cobrança oficial](https://docs.tilion.dev/account/billing.md), [medição local](/Users/gabriel/tone/worktrees/deploy-server/docs/pesquisa-tilion.md:7)

## Reputação do vendedor é evidência separada

No Mercado Livre, `seller_reputation` pertence a `/users/{seller_id}` e inclui `level_id`, `power_seller_status` e métricas de transações. `official_store_id` identifica associação a Loja Oficial, consultável nos recursos de marcas. **Nota/quantidade de avaliações do produto não substitui reputação do vendedor**, nem prova Loja Oficial. Disponibilidade desses recursos na documentação não implica que o coletor atual os devolva. Sem sinal explícito coletado, reputação fica desconhecida. [Seller reputation](https://developers.mercadolivre.com.br/en_us/sellers-reputation), [Official Stores](https://developers.mercadolivre.com.br/en_us/manage-questions-answers/official-store)

## Limites desta verificação

Não foi validado checkout, frete por CEP, estoque de variante, vendedor ou ranking de ofertas ao vivo. Os documentos locais refletem testes datados, não SLA. As páginas Mercado Livre deram 403 na abertura; os trechos da documentação oficial apareceram no índice de busca. A leitura web das docs Tilion falhou, mas seus Markdown oficiais foram lidos por HTTP público, sem API comercial. Tarifas efetivas e permissões de conta não foram consultadas.
