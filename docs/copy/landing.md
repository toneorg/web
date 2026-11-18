# Copy das páginas públicas

Fonte da copy de `/` (página principal) e `/lojas` (página para lojas). O vocabulário segue `CONTEXT.md`; a neutralidade, `docs/adr/0001-app-da-tone-nao-recebe-para-recomendar.md`.

Regras: "você", frases curtas, sem jargão. "IA" nunca em título. A tone é "ela". Nada de "Dragão", "plugin" ou "Tony". Logo de cliente só de cliente de verdade. Plataforma (Nuvemshop, Shopify) só aparece quando a integração existir.

---

## Página principal (`/`)

**Título da aba:** tone: compre sem dúvida
**Descrição:** A tone pesquisa nas lojas por você e volta com poucas opções, com o porquê de cada uma. Você decide sabendo o que escolhe e o que deixa de lado. Ela não recebe de nenhuma marca para recomendar.

### Navegação
tone · Como funciona · Para lojas · **Entrar**

### Abertura
- Selo: Em teste fechado. Entre na lista de espera.
- Título: **Compre sem dúvida.**
- Texto: Conte o que você procura. A tone pesquisa nas lojas, compara por você e volta com poucas opções, cada uma com o porquê. Você decide sabendo o que está escolhendo e o que está deixando de lado.
- Campo: rótulo "Seu e-mail", exemplo `voce@email.com`, botão **Entrar na lista**
- Apoio: Os convites saem aos poucos. Seu e-mail serve só para isso.
- Link: Já tem convite? Entrar
- Demonstração (animada): a pessoa escreve *"Preciso de uma cadeira para trabalhar 8 horas por dia. Tenho 1,85 m e dor nas costas. Até R$ 1.500."* A tone mostra o progresso (*Lendo 214 avaliações · Comparando 12 cadeiras em 6 lojas*) e responde:
  - **Eu começaria pela Cadeira Apoio Pro.** R$ 1.390
  - ✓ O assento sobe até 54 cm: cabe na sua altura.
  - ✓ Apoio lombar com ajuste de altura, para as costas.
  - ✓ Fica dentro do seu limite.
  - **Por que não a Linha Flex?** É R$ 210 mais barata, mas o assento para em 48 cm.

### Por que isso importa
- Título: **Comprar ficou fácil. Escolher, não.**
- **Errar custa caro.** O produto que não serve volta para a caixa, a troca leva semanas e o dinheiro fica parado. Quando não volta, fica na gaveta.
- **Acertar dá trabalho demais.** Trinta abas, ficha técnica, vídeo de review, comentário que contradiz o outro. Ninguém tem tempo para isso a cada compra.
- **Quem recomenda ganha com a sua compra.** O influenciador recebe comissão, o ranking é patrocinado, a loja quer girar o estoque. Fica difícil saber em quem confiar.

### A pesquisa (`#como-funciona`)
Seção fixa no fundo escuro: a pesquisa acontece conforme a pessoa rola (`docs/superpowers/specs/2026-11-18-landing-rolagem-design.md`). É o bastidor da demo da abertura (a mesma cadeira).
- Título: **Enquanto você espera, ela faz o trabalho pesado.**
1. **Você conta.** O que você precisa, para quê e quanto quer gastar. Pode colar o link de um produto que já está olhando.
2. **Ela pesquisa.** Lê fichas técnicas, avaliações e vídeos em várias lojas e descarta o que não serve para você.
3. **Você decide.** Poucas opções, com o motivo de cada uma e o que você abre mão em cada escolha.
- Pedido: *Cadeira para 8 horas por dia. Tenho 1,85 m e dor nas costas. Até R$ 1.500.*
- Contadores: **214** avaliações lidas · **12** cadeiras comparadas · **6** lojas · **11** descartadas
- Cards que chegam (ilustrativos) e o motivo de cada descarte:
  - Linha Flex, R$ 1.180 → *Assento para em 48 cm*
  - Ergo Max, R$ 990 → *Sem ajuste lombar*
  - Executiva Prime, R$ 2.290 → *Acima do seu limite*
  - Gamer Turbo, R$ 1.250 → *Lombar é só uma almofada*
  - *"O encosto quebrou em 4 meses."* (Ergo Max, 2 estrelas) → *Encosto frágil em 31 avaliações*
  - *"Esquenta muito no verão."* (Office Air, 3 estrelas) → *Esquenta, segundo 18 avaliações*
  - *"Chegou com peça faltando."* (Loja D, 1 estrela) → *Loja com muitas reclamações*
  - Comfy Plus: altura do assento 42 a 49 cm → *Baixa para 1,85 m*
  - Basic 2: apoio de braço fixo → *Sem ajuste de braço*
  - Office Air: garantia de 3 meses → *Garantia curta*
  - A favor da escolha, convergem na resposta: Cadeira Apoio Pro, R$ 1.390 (Loja A) · *"Ótima para quem é alto."* (5 estrelas) · Assento sobe até 54 cm · Lombar com ajuste de altura
- Resposta: **Eu começaria pela Cadeira Apoio Pro.** ✓ Assento sobe até 54 cm, para a sua altura. ✓ Apoio lombar com ajuste de altura. ✓ Dentro do seu limite.

### O porquê
- Título: **Toda recomendação vem com o porquê.**
- Texto: Não é uma lista de "os 10 melhores". É a escolha ligada ao que você disse, e o que você perde em cada alternativa. Se não fizer sentido, você vê exatamente onde discordar.
- Exemplos (abas): Cadeira · Tênis de corrida · Fone · Hidratante
  - **Tênis de corrida.** *"Corro 5 km três vezes por semana, piso pronado, até R$ 600."* → **Eu começaria pelo Ritmo 4.** Tem controle de pisada e amortecimento para treino diário. *O Leve 2 pesa menos, mas não corrige a pronação.*
  - **Fone.** *"Quero um fone para o metrô e para chamadas no trabalho."* → **Eu começaria pelo Quieto 300.** O cancelamento de ruído é o mais forte da faixa e tem dois microfones por lado. *O Pulse custa menos, mas o microfone some em lugar barulhento.*
  - **Hidratante.** *"Pele sensível, quero algo leve e sem perfume."* → **Eu começaria pelo Gel Calma.** É sem fragrância, tem textura em gel e é o mais leve dos três. *O Creme Nutri hidrata mais, mas pode pesar no calor.*

### Comparação (`#comparacao`)
- Selo: Comparação
- Título: **Por que não só perguntar ao ChatGPT?**
- Texto: Um chat de uso geral sabe um pouco de tudo e responde para qualquer pessoa. A tone foi feita para uma coisa: ajudar você a escolher o que comprar, nas lojas onde você compra.
- A mesma pergunta nos dois: *"Air fryer para 4 pessoas. Minha cozinha é pequena. Até R$ 600."*
  - **Um chat de uso geral** (8 opções): Ótima pergunta! Aqui estão 8 excelentes opções de air fryer para você considerar: (lista que some) … A melhor escolha vai depender das suas necessidades e do seu orçamento.
  - **A tone** (1 escolha e o porquê): Eu começaria pela **Compacta 5L**. R$ 549. Preço lido no Magalu hoje, às 9h. ✓ Cesto de 5 L: serve 4 pessoas. ✓ 28 cm de largura, a mais estreita das que servem 4. ✓ Dentro do seu limite. **Por que não a Duo 7L?** Cabe mais, mas tem 38 cm de largura e é a mais barulhenta nas avaliações. Ela avisa se o preço cair abaixo de R$ 500.
- Tabela (um chat de uso geral · a tone):
  - **A resposta:** Uma lista de opções boas para a maioria das pessoas. · Poucas opções, escolhidas pelo que você disse.
  - **O que você perde:** Prós genéricos de cada modelo. A escolha fica com você. · Cada opção diz o que você abre mão ao escolhê-la.
  - **O preço:** O que a busca encontrou, nem sempre o da loja agora. · Lido nas lojas brasileiras, com a fonte de cada valor.
  - **Depois da resposta:** A conversa termina ali. · Ela acompanha o preço e avisa quando vale comprar.
  - **Quem ganha com a compra:** Depende do modelo de negócio de cada empresa. · Ninguém. Nenhuma marca ou loja paga para aparecer.
- O lado do chat geral descreve o formato de uma resposta típica, nunca um fato sobre uma empresa. O lado da tone só diz o que o produto faz.

### O que mais ela faz
- **Lembra do que importa para você.** Seu tamanho, o que você evita, as marcas que já te decepcionaram. Você vê tudo o que ela lembra e apaga quando quiser.
- **Acompanha o preço e avisa quando vale.** Escolheu, mas não é a hora? Ela fica de olho e te avisa.
- **Funciona onde você compra.** No navegador, no celular ou no computador. Você abre a loja quando quiser.

### Neutralidade
- Título: **A tone não recebe para recomendar.**
- Texto: Nenhuma marca ou loja paga para aparecer nas suas respostas. Sem anúncio, sem comissão, sem ranking patrocinado. Seus dados não são vendidos.
- Texto: A tone ganha dinheiro de outro jeito: ajudando lojas a responder as dúvidas dos clientes delas, dentro do próprio site, só com o catálogo delas.
- Link: Como a tone funciona para lojas

### Perguntas
- **Quanto custa?** Durante o teste fechado, nada.
- **Quando recebo o convite?** Os convites saem aos poucos, por ordem da lista. Você recebe um e-mail com o link de entrada.
- **Ela compra por mim?** Não. Ela pesquisa e recomenda. A página do produto só abre quando você pede, e a compra é sua.
- **Por que eu confiaria na recomendação?** Porque ela mostra o porquê e o que você perde em cada opção, e porque ninguém paga para aparecer.
- **O que vocês fazem com os meus dados?** Usam para recomendar melhor para você, e só. Você vê o que ela lembra, apaga quando quiser e pode levar tudo com você. Detalhes na nota de privacidade.

### Para lojas
- Título: **Tem uma loja?**
- Texto: A mesma inteligência pode responder as dúvidas dos seus clientes no seu site, e mostrar o que está impedindo a compra.
- Link: Conheça a tone para lojas

### Fechamento
- Título: **Sua próxima compra, sem dúvida.**
- Campo de lista de espera (igual à abertura)

### Retornos do formulário
- Enviando: Entrando na lista…
- Sucesso: Pronto, você está na lista. Avisamos por e-mail quando o seu convite sair.
- E-mail inválido: Escreva um e-mail no formato voce@email.com.
- Falha: Não deu para entrar na lista agora. Tente de novo em instantes.

---

## Página para lojas (`/lojas`)

**Título da aba:** tone para lojas: resolva a dúvida que impede a compra
**Descrição:** A tone conversa com quem está em dúvida no seu site, recomenda do seu catálogo com o porquê e mostra quais perguntas e informações em falta estão custando vendas. Piloto gratuito, medido com grupo de controle.

### Navegação
tone para lojas · Como funciona · Relatório · Piloto · Para você · **Quero um piloto**

### Abertura
- Selo: Piloto aberto para 5 marcas
- Título: **Descubra e resolva a dúvida que impede a compra.**
- Texto: A tone conversa com quem está em dúvida no seu site, recomenda do seu catálogo com o porquê e mostra a você quais perguntas, objeções e informações em falta estão custando vendas.
- Botões: **Quero um piloto** · Ver como funciona
- Demonstração (animada): página de produto de uma loja (Fone Quieto 300). A pessoa toca em **Me ajuda a escolher** (*por tone*). Pergunta: *Onde você vai usar mais?* → [Metrô] [Escritório] [Academia]. Resposta: **Para metrô e chamadas, eu ficaria com este.** O cancelamento de ruído é o mais forte da loja e tem dois microfones por lado. *O Pulse custa R$ 180 a menos, mas o microfone some em lugar barulhento.* [Adicionar ao carrinho]

### Números
- **70%** dos carrinhos são abandonados antes da compra.
- **56%** dos sites avaliados têm uma busca que não atende ao que as pessoas procuram.
- **78%** das listas de produto no celular são medíocres ou ruins.
- Fonte: Baymard Institute, pesquisas de usabilidade em e-commerce.

### O problema
- Título: **Quem está em dúvida não compra. Ou compra errado e devolve.**
- Texto: A sua ficha responde o que você acha que importa. O cliente pergunta outra coisa: *"Funciona no meu notebook?"*, *"Veste justo ou largo?"*, *"Tem perfume?"*. Sem resposta, ele abre outra aba, e muitas vezes não volta.

### Como funciona (`#como-funciona`)
- Título: **No seu site, com o seu catálogo.**
1. **Conectamos ao seu catálogo.** Produtos, variações, estoque e políticas de troca e entrega. Sem time técnico do seu lado.
2. **Ela responde quem está em dúvida.** Um botão discreto, "Me ajuda a escolher". Poucas perguntas e uma recomendação do seu catálogo, com o porquê. Sem cadastro e sem sair da página.
3. **Você vê o que impede a compra.** Toda semana, o relatório de dúvidas: o que perguntaram, o que faltou responder e onde a dúvida virou desistência.

### Relatório de dúvidas (`#relatorio`)
- Título: **Cada pergunta vira um dado sobre a sua loja.**
- Texto: Você descobre quais informações faltam nas fichas, quais produtos geram mais dúvida e quais objeções aparecem antes da desistência. Tudo agregado: você vê padrões, não pessoas.
- Demonstração: "Esta semana"
  - *Tem fragrância?* · 37 pessoas · a informação falta em 62% dos produtos de skincare
  - *Fico entre M e G, qual escolho?* · 54 pessoas · 9 produtos sem tabela de medidas
  - *Chega até sexta?* · 29 pessoas · prazo não aparece na página do produto
  - Sugestão: Acrescente "sem fragrância" às fichas de 14 produtos.

### Recomendação explicada
- Título: **Uma recomendação que o cliente entende, e confia.**
- Texto: Em vez de "você também pode gostar", a tone diz por que aquele produto serve e o que fica de fora nas outras opções. Ela separa o que está na ficha do que é estimativa, e diz quando não sabe. Quando nenhum produto serve, diz isso também.

### Para que tipo de produto
- Título: **Feita para produtos que exigem decisão.**
- **Eletrônicos e acessórios:** *Funciona com o que eu já tenho?*
- **Casa e móveis:** *Cabe no meu espaço?*
- **Moda:** *Como vai vestir em mim?*
- **Skincare e beleza:** *Serve para pele sensível?*

### Piloto (`#piloto`)
- Título: **A gente prova o ganho antes de você pagar.**
- Texto: No piloto, parte dos visitantes vê a tone e parte não. Comparamos a receita por visita entre os dois grupos. Não contamos como nossa toda venda de quem tocou no botão. Você vê o resultado real e decide.
- Etapas: **Semana 1** Conexão ao catálogo e revisão das respostas. **Semanas 2 a 8** A tone no ar, com grupo de controle. **No fim** Resultado, relatório de dúvidas e a sua decisão.
- Apoio: De 30 a 60 dias, sem custo.

### Para quem
- Título: **Para marcas com e-commerce próprio.**
- Loja própria, não só marketplace
- De 50 a 5.000 produtos
- Mais de 50 mil visitas por mês
- Tráfego pago que custa caro
- Um time de e-commerce pequeno

### Privacidade
- Título: **A pessoa no controle. Você com os padrões.**
- Ninguém precisa criar conta para usar.
- O relatório é agregado e nunca mostra quem perguntou.
- Nenhum dado é vendido. Nunca.

### Perguntas
- **Preciso de time técnico?** Não. A gente conecta o catálogo e revisa as respostas com você antes de entrar no ar.
- **Quanto custa depois do piloto?** Uma assinatura mensal pela faixa de visitas da loja. Sem porcentagem sobre as vendas.
- **Ela recomenda produtos de outras lojas?** Não. Dentro do seu site, só o seu catálogo.
- **Vai atrapalhar a navegação no celular?** O botão é discreto e a conversa só abre quando a pessoa pede.
- **E se ela não souber responder?** Ela diz que não sabe e mostra o que a ficha informa. Essa pergunta entra no relatório, para você completar a ficha.
- **Em quais plataformas funciona?** Estamos conectando as lojas do piloto uma a uma. Conte a sua no formulário.

### Formulário (`#piloto-form`)
- Título: **Estamos escolhendo as 5 primeiras marcas do piloto.**
- Texto: Conte sobre a sua loja. A gente responde em até dois dias úteis.
- Campos: Seu nome · E-mail de trabalho · Site da loja (`www.sualoja.com.br`) · Plataforma (Nuvemshop, Shopify, VTEX, WooCommerce, Tray, Loja Integrada, Outra) · Visitas por mês (Menos de 10 mil, 10 mil a 50 mil, 50 mil a 300 mil, Mais de 300 mil) · WhatsApp (opcional)
- Botão: **Quero um piloto**
- Enviando: Enviando…
- Sucesso: Recebemos. A gente te escreve em até dois dias úteis.
- Falha: Não deu para enviar agora. Tente de novo em instantes ou escreva para {e-mail de contato}.
