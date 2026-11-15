# Acesso direto às APIs dos marketplaces

Pesquisa em 15/11/2026, voltada a uma camada própria de busca, produtos, ofertas e preços para o Brasil. Foram consultadas fontes oficiais; nenhuma conta foi criada, nenhuma chave foi solicitada e nenhuma chamada autenticada foi executada. As fontes abaixo documentam capacidades, mas não comprovam os privilégios de uma conta específica nem a implementação da Gecko.

## Conclusão

É viável construir conectores próprios, mas “ter uma API oficial” não significa “poder consultar todo o marketplace”. Há três tipos diferentes de acesso: operação da loja autorizada, conteúdo de afiliados e coleta de páginas públicas. A arquitetura deve representar essas capacidades separadamente. Em especial, OAuth de seller não deve ser apresentado ao produto como acesso irrestrito aos concorrentes.

## Matriz de decisão

| Plataforma | Acesso oficial encontrado | Credenciais e aprovação | O que permite sustentar | Lacuna para inteligência competitiva |
| --- | --- | --- | --- | --- |
| Mercado Livre | APIs OAuth; busca de produtos de catálogo documentada | Aplicação e usuário autorizador; token no header | Procurar fichas de catálogo por palavra-chave ou identificador | Ficha de catálogo não equivale a busca varejista completa com preço, frete e estoque de todos os vendedores. Privilégios reais de anúncios alheios precisam ser testados com a aplicação aprovada. [Autenticação](https://developers.mercadolivre.com.br/pt_br/registre-o-seu-aplicativo/autenticacao-e-autorizacao), [catálogo](https://developers.mercadolivre.com.br/buscador-de-produtos) |
| Amazon | Creators API para associados; SP-API para sellers/vendors | Associates aceito e credenciais próprias; ou autorização e roles SP-API | Creators: busca, produto, variações e categorias. SP-API: recursos sujeitos ao papel e contexto autorizados | Não é um feed anônimo nem licença automática de redistribuição. Não iniciar integração nova em PA-API 5. [Creators](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction), [SP-API](https://developer-docs.amazon/sp-api/docs/catalog-items-api) |
| Magazine Luiza | APIs de marketplace com OAuth2 | `client_id`, `client_secret`, escopos e consentimento explícito do seller | Produtos, estoque e preços do catálogo do seller; pedidos e outros domínios de operação | As fontes consultadas não estabelecem busca pública por produtos concorrentes. [Fluxo oficial](https://developers.magalu.com/docs/first-steps/create-an-application/), [autorização](https://developers.magalu.com/docs/first-steps/create-an-application/authentication-authorization/index.html) |
| Shopee | Open Platform; documentação atual protegida ao leitor utilizado | Cadastro de desenvolvedor/app e autorização de loja precisam ser confirmados no portal atual | Há documentação oficial histórica de onboarding e autorização de loja | Não foi comprovado acesso geral a catálogo, preços ou reviews de terceiros. Campos, quotas e elegibilidade atuais permanecem pendentes. [Portal](https://open.shopee.com/), [guia de autorização](https://open.shopee.com/developer-guide/20) |
| AliExpress | Open Platform e trilha Affiliate; documentação antiga permanece publicada pela Alibaba | Conta de afiliado/desenvolvedor e aplicação, conforme fluxo histórico | Documentação histórica distingue consultas de afiliados e geração de links | Portal atual não pôde ser lido; referências legadas estão marcadas como depreciadas. Validar família de APIs, aprovação e métodos atuais antes de implementar. [Portal atual](https://openservice.aliexpress.com/doc/api.htm), [fluxo histórico](https://developer.alibaba.com/docs/doc.htm?articleId=118193&docType=1&treeId=674) |
| Temu | Partner Platform com apps e autorização de seller | Registro, app, avaliação e permissões concedidas pelo seller | Operação de produtos/pedidos da loja autorizada | Página institucional também anuncia Researchers; isso não demonstra endpoint geral de preços nem elegibilidade comercial no Brasil. [Plataforma](https://partner.temu.com/app/), [autorização](https://partner.temu.com/documentation?menu_code=38e79b35d2cb463d85619c1c786dd303) |

## Amazon: mudança que afeta uma implementação nova

A Amazon declara a PA-API 5 depreciada e substituída pela Creators API. A página atual descreve resposta `403 AccessDeniedException` para integrações que continuam chamando a API antiga. Essa é evidência documental, não um teste feito nesta pesquisa. [Aviso oficial](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation)

A migração troca assinatura AWS SigV4 por OAuth2, usa credenciais próprias da Creators API e tokens com duração de uma hora, além de nomes de parâmetros em lowerCamelCase. A documentação orienta substituir recursos antigos de ofertas por `OffersV2`. O conector deve usar o SDK atual ou implementar cache e renovação do token. [Guia de migração](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/migrating-to-creatorsapi-from-paapi)

A introdução lista cadastro no programa de associados do marketplace pretendido, credenciais e pelo menos dez vendas qualificadas nos últimos trinta dias. O cadastro detalhado exige aceitação final no programa; somente o titular principal pode registrar a aplicação. Portanto, obter esse acesso não é apenas gerar uma chave em um cadastro novo. [Pré-requisitos](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction), [registro](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/onboarding/register-for-creators-api)

O Brasil consta na referência de localidades com `www.amazon.com.br`, `pt_BR` e `BRL`. Isso confirma uma localidade suportada, sem garantir que uma conta recém-criada seja elegível. [Brasil](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/locale-reference/brazil)

A lista atual de recursos inclui imagens, informações de item, ofertas, categorias e resumo de variações. Ela não estabelece uma API de texto integral de todas as avaliações. Ausência nessa lista não prova ausência em todo o ecossistema Amazon; apenas impede prometer esse recurso neste conector. [Recursos](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/resources)

A Catalog Items API da SP-API documenta busca por identificadores/palavras-chave e detalhes de catálogo; a disponibilidade é para sellers/vendors e requer a role `Product Listing`. Essa permissão é distinta da Creators API. [Catalog Items API](https://developer-docs.amazon/sp-api/docs/catalog-items-api)

A licença da Creators remete aos termos de cada localidade. A política de retenção, exposição e reutilização deve ser definida por fonte, sem aplicar um cache universal presumidamente permitido a todos os conectores. [Licença por localidade](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/license-agreement)

## Mercado Livre: catálogo não é oferta

O fluxo oficial utiliza OAuth2 e o header Bearer. Outra página recomenda token inclusive para recursos públicos. Não presumir que exemplos antigos sem autenticação continuem válidos. [Autorização](https://developers.mercadolivre.com.br/pt_br/registre-o-seu-aplicativo/autenticacao-e-autorizacao), [recomendações de token](https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao/desenvolvimento-seguro)

O buscador de produtos documenta `/products/search` com `site_id`, palavra-chave ou identificador como GTIN; para o Brasil, a documentação indica disponibilidade. O objetivo descrito é identificar fichas adequadas à publicação no catálogo, com informações como nome, atributos e imagens. Isso é útil para identificação e correspondência de produtos; não é evidência suficiente de cobertura de preços concorrentes. [Buscador oficial](https://developers.mercadolivre.com.br/buscador-de-produtos)

Também existem exemplos de `/sites/{site}/search` na documentação indexada de itens e buscas. A abertura direta dessa página retornou 403 ao leitor utilizado. Não foram feitos testes com credenciais: disponibilidade, políticas da aplicação e cobertura real continuam desconhecidas. Não concluir que uma nova aplicação terá os mesmos privilégios dos exemplos históricos. [Itens e buscas](https://developers.mercadolivre.com.br/pt_br/publicacao-de-produtos/itens-e-buscas)

## Magalu, Shopee, AliExpress e Temu

**Magalu.** O guia oficial descreve configuração de cliente, consentimento do seller, troca de código por tokens e renovação. A lista de APIs fala em gerenciamento de produtos, estoque e preços do próprio catálogo. Recomenda-se um conector OAuth para sellers que autorizem o produto; a pesquisa competitiva precisa de uma fonte de dados adicional validada. [Integração](https://developers.magalu.com/docs/first-steps/create-an-application/), [cliente e escopos](https://developers.magalu.com/docs/first-steps/create-an-application/create-application/index.html)

**Shopee.** O portal e as páginas atuais de autorização/token retornaram 403 ao leitor web. Foi localizado um guia oficial histórico, hospedado no CDN da Shopee, que identifica Open Platform 2.0 e cadastro/autorização de lojas. Ele sustenta a existência histórica do modelo, mas não os requisitos atuais do Brasil. Não usar esse documento de 2020 para fixar quotas ou formatos atuais. [Documento oficial histórico](https://cdngarenanow-a.akamaihd.net/shopee/seller/seller_cms/b17e7e1846b98c422e4404f223b9f65f/%5BTW%5D%5BOpen%20API%5DAPI%E4%B8%B2%E6%8E%A5%E8%AA%AA%E6%98%8E%E4%BA%8B%E9%A0%85%20%282020_10_21%29_newnew.pdf), [referência atual de token, indisponível nesta leitura](https://open.shopee.com/documents/v2/v2.public.get_access_token?module=104&type=1)

**AliExpress.** As páginas oficiais históricas da Alibaba descrevem aprovação de desenvolvedor, app e emissão de App Key/Secret. Entretanto, a própria árvore de documentação marca `Affiliate API（已废弃）`, isto é, depreciada. Os métodos históricos `aliexpress.affiliate.productdetail.get` e `aliexpress.affiliate.link.generate` não devem ser transformados em promessa de disponibilidade atual sem conferir o console e o portal de documentação atual. Não foi validada cobertura de reviews, estoque, variações, frete nem preços finais para o Brasil. [App Key](https://developer.alibaba.com/docs/doc.htm?articleId=118195&docType=1&treeId=674), [detalhes histórico](https://developer.alibaba.com/docs/doc.htm?articleId=48595&docType=2&treeId=674), [links histórico](https://developer.alibaba.com/docs/doc.htm?articleId=45804&docType=2&treeId=674), [guia atual não legível nesta pesquisa](https://openservice.aliexpress.com/doc/doc.htm?docId=118729&nodeId=27493)

**Temu.** O guia de autorização distingue lojas crossborder e locais e exige permissão do seller, com escopos concedidos no Seller Center. O guia de endpoints descreve POST sobre HTTPS e hosts regionais. Isso não constitui acesso aberto a todos os produtos: o conector deve carregar região e contexto da loja autorizada. [Seller Authorization Guide](https://partner.temu.com/documentation?menu_code=38e79b35d2cb463d85619c1c786dd303), [Endpoints and Request Method](https://partner.temu.com/documentation?menu_code=38e79b35d2cb463d85619c1c786dd303&sub_menu_code=8311de2b2d434e4d805e88413ab815d8)

A versão indexada da homepage da Temu menciona Researchers para solicitar dados públicos. A leitura direta retornou apenas a estrutura de uma aplicação JavaScript; não foram obtidos requisitos, campos, países, quotas nem aprovação dessa trilha. Ela é uma possibilidade a investigar, não uma base comprovada para um serviço comercial de catálogo brasileiro. [Homepage oficial](https://partner.temu.com/app/)

## Proposta para a camada própria

As decisões seguintes são recomendações de arquitetura derivadas das distinções acima, não fatos observados sobre a Gecko:

1. Criar capacidades explícitas por conector: `catalog_search`, `product`, `offers`, `variants`, `shipping`, `review_summary`, `review_text` e `seller_operations`. Cada uma começa como `unverified` e só vira disponível após validação com a fonte real.
2. Guardar o contexto de acesso: `official_affiliate`, `official_seller`, `public_page`; manter credenciais OAuth por conta e permissões fora da resposta pública.
3. Separar produto canônico de oferta. Uma ficha GTIN/ASIN/ID não identifica necessariamente vendedor, variação ou preço de checkout.
4. Registrar `source_url`, `captured_at`, país/moeda, contexto de entrega, método de coleta, versão do parser e estado de completude. Preço sem frete/cupom/imposto não deve virar preço final.
5. Definir retenção, cache e limites por fonte e capacidade. Para cada adaptador, tratar `401`, `403`, `429`, dado ausente e mudança de schema como estados distintos.
6. Começar por um conjunto pequeno de URLs e campos. Medir cobertura, atualização e falhas antes de prometer todos os marketplaces. APIs de seller são ótimas para operações de lojas autorizadas, mas não resolvem sozinhas comparação geral de preços.

## O que ainda precisa ser comprovado

- Mercado Livre: permissões e cobertura efetivas para anúncios de terceiros com a aplicação aprovada.
- Amazon: elegibilidade da conta, limites reais e recursos retornados para o Brasil.
- Magalu: existência de programa ou feed específico que permita consulta comercial de catálogo público para este caso de uso.
- Shopee e AliExpress: documentação atual acessível e aprovação da modalidade adequada; métodos, quotas e escopos verificados no console.
- Temu: disponibilidade para o Brasil e critérios da trilha de dados públicos/research.
- Todos: cobertura de reviews, variações e frete com contexto real; custo operacional por resultado válido. A existência de páginas públicas ou documentação não confirma estabilidade nem paridade com a Gecko.
