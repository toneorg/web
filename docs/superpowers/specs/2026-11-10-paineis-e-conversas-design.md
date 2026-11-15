# Painéis e conversas separados

Data: 10/11/2026. Repositórios: `toneorg/web` (telas) e `toneorg/extension` (servidor, contratos em `packages/shared`).

## Por que

Painel e conversa são coisas diferentes, mas hoje se misturam. Cada painel nasce de uma conversa (a sessão que o agente usa para montar o rascunho), essa conversa entra na lista "Suas conversas" ("Eu quero acompanhar os preços do iphone 18 · começou na extensão") e tocar num card de painel abre essa conversa, com as leituras (`WatchReadings`) no fim dela. A pessoa disse que isso incomoda: "eles são coisas diferentes".

O que a pessoa quer de um painel, nas palavras dela: ver o gráfico de variação de preço quando houver, o que ele achou da última vez que rodou e os produtos que achou. Funções da tone como ver vídeos do produto ficam melhor no chat.

## Objetivos

1. "Suas conversas" lista só conversas de verdade: as que a pessoa começou pela busca, por "Nova conversa", pela extensão ou pelas boas-vindas.
2. Cada painel tem uma página própria, de resultados.
3. Conversas abertas a partir de um painel ficam guardadas dentro do painel, nunca em "Suas conversas".
4. A sessão que monta o painel (a do modal "Novo painel") não aparece como conversa em lugar nenhum.
5. A tela inicial continua no formato de hoje (painéis à esquerda, conversas à direita), arrumada.

## Fora do escopo

- Editar a regra do painel por conversa. Ajustes ficam no modal e no menu do painel.
- Mudar o que o runner lê ou como avisa.
- A extensão do Chrome (painel lateral). Ela só precisa continuar funcionando com as mudanças de contrato.

## O que seria um fracasso mesmo funcionando

- Uma página de painel pesada, cheia de caixas e textos. A pessoa pediu para rodar `/better-ui` e `/better-layout` nas telas novas, para não ficarem "visualmente pesadas e cheias de coisas".
- Uma conversa de painel reaparecer em "Suas conversas", por qualquer caminho.
- Perder conversas ou painéis que já existem.

## Decisões da pessoa

### Página do painel (opção C dos esboços)

- Rota própria no web, por exemplo `/paineis/[id]`. O nome exato da rota fica com quem constrói.
- De cima para baixo: título e estado; gráfico de preço (`PriceChart`, o mesmo do card), quando houver; a última leitura (quando rodou, quantas ofertas, menor preço e loja); a lista de produtos encontrados, com foto, loja, preço e link (o conteúdo de `WatchReadings`, que já existe).
- A página do painel **não tem conversa embutida**. Um botão "Conversar sobre este painel" abre uma conversa que já sabe qual é o painel.
- Conversas abertas a partir do painel **ficam guardadas dentro do painel**, nunca em "Suas conversas".

### Tela inicial (opção A dos esboços)

- Mantém a estrutura atual: coluna de painéis à esquerda (`Shell` + `Panels`) e conversas à direita.
- Cada card de painel ganha um mini gráfico (uma linha pequena do menor preço por dia), quando houver pelo menos dois pontos.
- Tocar num card de painel leva à página do painel, não à conversa.
- A pessoa autorizou diminuir as margens laterais e alargar a coluna de painéis, se ficar melhor. Hoje: `max-w-7xl`, `px-4 md:px-6`, coluna `minmax(16rem,22rem)`.

### Lista de conversas

- "Suas conversas" esconde as sessões de criação de painel e as conversas de painel.

### Visual

- Rodar `/better-ui` e `/better-layout` sobre cada tela nova ou mudada (página do painel, card do painel, tela inicial), antes de considerar pronto. Seguir `@toneorg/design` (DESIGN.md e fichas em `components/`), como manda o `AGENTS.md` do web.

## Minhas decisões (palpites que a pessoa não contestou; confira)

- **Atalhos por produto:** cada produto da lista tem "Perguntar", que abre uma conversa do painel já com aquele produto no contexto (como `PickedProduct` faz hoje na conversa). "Ver vídeos" pode ser só um atalho que abre a conversa do painel pedindo os vídeos daquele produto. Se pesar no layout, fica só "Perguntar".
- **Conversas deste painel:** no fim da página do painel, uma lista discreta com título e data, que não aparece quando não houver nenhuma. Abrir uma delas mostra a conversa com "← <nome do painel>" no lugar de "← Conversas".
- **Ajustes do painel** (pausar, retomar, silenciar, verificar agora, excluir) ficam no menu da página do painel, o mesmo `PanelMenu` do card.
- **Painel em rascunho:** tocar no card reabre o modal "Novo painel" já no passo de revisão daquele rascunho, em vez de abrir uma conversa.
- **Sessão de criação:** continua existindo no servidor (o agente precisa dela), só fica oculta. Ela não vira "conversa deste painel".
- **Contexto sempre atual:** a conversa de painel guarda só o vínculo (`watch_id`); o contexto do painel (regra, última leitura) é montado de novo a cada turno, então a conversa sempre vê o estado atual do painel.
- **Excluir um painel:** as conversas dele somem junto da vista (o painel já é excluído de forma lógica, `status = 'deleted'`). Nada é apagado do banco e elas nunca voltam para "Suas conversas".
- **Histórico antigo:** sessões de criação de painéis antigos em que a pessoa escreveu mais de uma mensagem (antes, tocar no card abria essa conversa) aparecem em "Conversas deste painel", com o título "Como este painel começou". Assim nenhuma conversa fica inacessível. As sessões do modal novo (com `intent: "watch"`) não aparecem.
- **Extensão:** o histórico do painel lateral (`History.tsx`) também lê `GET /api/sessions`, então o filtro no servidor vale para os dois lados, o que é o desejado. A extensão não ganha página de painel nesta etapa.

## Restrições

- Contratos entre servidor, extensão e web moram em `toneorg/extension/packages/shared`; o web recebe cópia por `npm run sync:shared` (`scripts/sync-tone-shared.mjs ../tone-extension`). Nunca editar `src/tone/` no web à mão.
- O banco de produção é Postgres (Supabase); localmente, SQLite. Mudança de esquema precisa de migração nos dois (ver `supabase/migrations` e o esquema SQLite no servidor). Linhas existentes não podem quebrar.
- `GET /api/sessions` hoje lista toda sessão com mensagem da pessoa. Ela precisa saber quais sessões pertencem a um painel: a sessão de criação já está em `watches.session_id`; as conversas abertas a partir do painel precisam de um vínculo novo (por exemplo, `sessions.watch_id`). A forma exata fica com quem constrói.
- Conversas de painel antigas (sessões de criação já existentes, com mensagens) devem sumir de "Suas conversas" também, porque `watches.session_id` já as identifica.
- O web lê a API pelo proxy `src/app/api/tone/[...path]`, e o agente roda por `POST /api/agent/turn`. Abrir uma conversa a partir do painel precisa dizer ao servidor de qual painel ela é (um campo na criação da sessão ou na mensagem), e o agente deve receber o contexto do painel (produto, condição, última leitura) como `WATCH_INTENT` faz hoje.
- Antes de commitar, na extensão: `pnpm lint && pnpm typecheck && pnpm test && pnpm check:design`; no web: `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run check:design`. Atualizar a linha de BETA-06/T16 em `docs/requisitos.md` da extensão.
- Deploy: servidor por `fly deploy --app tone-extension --ha=false`; o web publica sozinho na Vercel a cada push na `main`. Servidor primeiro, depois o web.

## Com quem constrói

- Nome e forma da rota da página do painel.
- Esquema do vínculo sessão ↔ painel e como migrar.
- Como o agente recebe o contexto do painel numa conversa de painel.
- Como mostrar a página do painel no celular (hoje os painéis abrem por um botão "Painéis" no topo).
- Telemetria (`track`) dos eventos novos, seguindo `docs/analytics.md` do web.
