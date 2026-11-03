# Pesquisa de produtos por lojas relevantes

## Objetivo aprovado

A tone combina Google Shopping com buscas no próprio site das lojas por ferramentas somente de leitura do Pomerado. O agente escolhe automaticamente até três lojas relevantes ao produto; pedidos da pessoa por lojas específicas prevalecem. A KaBuM é a primeira integração a validar para a pesquisa de fones.

## Estado observado

- O servidor já tem cliente REST do Pomerado, orçamento por execução, normalização de ofertas e progresso da pesquisa.
- Hoje, uma pesquisa irrestrita consulta todas as lojas remotas configuradas; um escopo explícito filtra essas lojas.
- O PR toneorg/extension#26 acrescenta KaBuM ao índice e leituras remotas nos painéis. Seu CI falhou na preparação do teste de convite, porque `createInvite` recebeu e-mail indefinido.
- O MCP do Pomerado foi registrado no Codex e validado com uma consulta somente de leitura ao Google Flights. A criação da ferramenta KaBuM está em andamento.

## Escolha de fontes

O servidor mantém um catálogo das lojas habilitadas, com domínio, descrição das categorias atendidas e ferramenta de pesquisa validada. O agente recebe esse catálogo e escolhe até três lojas adequadas ao produto para complementar o índice. A seleção deve acontecer antes de executar as pesquisas remotas; uma busca irrestrita não significa consultar todas as lojas.

As restrições explícitas da pessoa e a seleção automática são dados distintos: escolher automaticamente KaBuM não deve restringir os resultados do Google a KaBuM. Quando a pessoa pede lojas específicas, o índice e as buscas diretas respeitam esse escopo. Se forem mais de três lojas explícitas, a tone consulta as lojas pedidas dentro do orçamento disponível, sem cortar silenciosamente o pedido.

Uma loja sem ferramenta validada pode continuar aparecendo pelo índice. A tone informa quando não conseguiu pesquisar diretamente naquela loja. A criação de ferramentas novas é uma operação de preparação da integração, anterior à habilitação em produção.

## Execução e resultados

O Google Shopping continua fazendo a descoberta ampla. As ferramentas das lojas selecionadas recebem a mesma intenção de produto e devolvem resultados normalizados com título, preço, condições de pagamento, link, foto e vendedor quando disponíveis. A implementação reutiliza o pipeline atual de ofertas, avaliação de requisitos, orçamento e telemetria.

O progresso identifica as lojas realmente consultadas. Resultados parciais são preservados quando uma fonte falha. Campos ausentes não são inventados: uma cor não confirmada continua impedindo um alerta que exija aquela cor. Um bloqueio ou erro de fonte não equivale a ausência de ofertas.

## Painéis

Na criação do painel, a tone guarda as lojas escolhidas para a busca direta junto às restrições da pessoa. As leituras seguintes reutilizam essa seleção, mantendo o escopo explícito separado. Uma integração posteriormente indisponível gera diagnóstico de cobertura parcial; não amplia o escopo nem escolhe outra loja silenciosamente.

O protocolo compartilhado deve aceitar a fonte `remote_browser`, incluindo na web sincronizada. A sincronização deve partir do mesmo commit do servidor que será publicado.

## Validação

- Escolha automática relevante, com limite de três lojas e sem restringir indevidamente o Google.
- Pedido explícito de lojas prevalece; lojas sem integração recebem diagnóstico correto.
- Falha em uma fonte preserva as demais ofertas e a indicação de cobertura parcial.
- Painéis persistem e reutilizam a seleção de lojas.
- Contratos do servidor e da web aceitam os mesmos tipos de fonte.
- A ferramenta KaBuM é validada com consultas reais antes de habilitá-la.

## Limites desta aprovação

Este desenho aprova a preparação da funcionalidade. O merge e a publicação dependem da revisão das alterações concretas e de CI válido. A chave enviada foi autorizada para o setup do MCP; sua instalação no Fly requer autorização específica para esse uso.
