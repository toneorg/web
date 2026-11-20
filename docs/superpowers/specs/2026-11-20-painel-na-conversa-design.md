# Criar um painel de dentro da conversa

Data: 20/11/2026. Repositórios: `toneorg/server` (em `../tone-server`) e `toneorg/web` (este).

## Intenção

No meio de uma pesquisa ("estou vendo tênis de corrida"), a pessoa pede "crie um painel para eu acompanhar o preço desse tênis" ou "desses dois". O plano do painel aparece ali mesmo, no chat: o mesmo cartão da folha "Novo painel" (o `+` da coluna de painéis), com as perguntas para tocar. Ela confirma sem sair da conversa e continua pesquisando. O painel passa a existir na coluna de painéis e lembra de onde veio.

Hoje metade disso já existe: o agente da conversa tem `draft_watch` e o chat desenha `WatchDraft`. Faltam três coisas, e uma delas quebra o fluxo:

1. **Um pedaço do chat some.** Desde 15/11 existe uma conversa só; por baixo, cada pausa de 6 h abre uma sessão nova (`src/conversas/timeline.ts`). Rascunhar um painel numa sessão a esconde da lista (`tone-server/apps/server/src/app.ts:685`, `NOT EXISTS (SELECT 1 FROM watches w WHERE w.session_id = s.id)`), mesmo sem confirmar, e a conversa única perde aquele trecho. A regra existe para esconder a sessão da folha "Novo painel", que não é conversa (10/11/2026: "desvincule ao máximo a ideia do painel de uma conversa"), mas pega também o chat de verdade.
2. **No chat, as perguntas do cartão não são tocáveis.** `WatchDraftLoader` não passa `onAnswer`; o cartão diz "Para ativar, responda o que falta na conversa".
3. **O agente não é guiado para "painel" nem para "esse/desses".** O prompt fala em "acompanhar, monitorar ou avisar"; não diz para usar as ofertas que já estão na conversa.

## Objetivos

- Pedidos na conversa como "crie um painel desse tênis", "acompanhe o preço desses dois", "quero um painel pra esse" geram um `WatchDraft` no chat, no mesmo turno, sem pesquisar de novo.
- "Esse/desses" vira os produtos que a pessoa viu: o produto escolhido (`picked`), os da lista curta ou os da última resposta, cada um com o título completo da oferta (marca, modelo, cor/variante quando aparece), `url` e `offerId`.
- As perguntas do cartão (modelo, tamanho, "os dois") são tocadas no chat, como na folha, e o agente ajusta o mesmo rascunho.
- Depois de confirmar, o cartão mostra o painel ativo e um link "Abrir painel". A coluna de painéis atualiza (já acontece via `WATCHES_CHANGED`).
- Nenhum trecho do chat some por causa de um painel. A conversa pode gerar vários painéis.
- O painel não guarda vínculo com a conversa (decisão da pessoa, 20/11: "a conversa é conversa, os painéis e os resultados dele ficam em outro lugar"). Depois de confirmar, o chat mostra só o cartão do plano com "Abrir painel"; as leituras aparecem no painel, nunca no chat (ver `2026-11-20-resultados-dos-paineis-design.md`).
- Um rascunho criado na conversa, tocado na coluna de painéis, abre a folha "Novo painel" na revisão, como os rascunhos da folha.

## Fora do escopo

- Ler o preço daquele link exato da loja. O runner casa ofertas por título e variante (`watch-evaluate.ts:89-114`); `url` e `offerId` ficam guardados, mas não mudam a leitura. Por isso o título do produto precisa ser específico.
- Mudar a folha "Novo painel".
- Criar painel sem confirmação, ou o agente confirmar.
- Um painel por produto quando a pessoa diz "desses": vira um painel com até cinco produtos (o limite atual de `WatchRule.products`). **Escolha minha**: é o que o modelo de painel já faz e evita encher a coluna.

## Anti-objetivos (falhou mesmo se funcionar)

- A conversa sumir da lista depois de pedir um painel.
- Qualquer pesquisa ou aviso rodar antes de a pessoa confirmar.
- O agente perguntar em texto o que o cartão já pergunta, ou pesquisar o produto de novo quando ele já está na tela.
- O painel acompanhar um produto genérico ("tênis Nike") quando a pessoa apontou um específico.

## Restrições

- `src/tone/shared` e `src/tone/genui` são gerados de `toneorg/server` (`packages/shared`, `packages/genui-react`). Mudanças nesses arquivos são feitas no servidor e trazidas com `npm run sync:shared -- ../tone-server`. Nunca editar as cópias.
- Interface segue `@toneorg/design` (ler `DESIGN.md` e a ficha do componente antes); nenhuma cor à mão; `npm run check:design` precisa passar.
- Next.js deste repo tem mudanças de API: ler `node_modules/next/dist/docs/` antes de mexer em rotas ou navegação.
- Testes de modelo só com os modelos baratos já em uso na tone (nunca Sonnet, Opus, GPT-6 Sol/Astra).
- Textos em português, no tom do produto.

## Abordagens consideradas

1. **Completar o cartão que o chat já tem** (escolhida). O agente rascunha na própria conversa; o cartão ganha perguntas tocáveis e o link para o painel; o servidor passa a esconder só a sessão da folha. Mantém o contexto da pesquisa (o agente sabe qual é "esse tênis") e a pessoa não sai do chat. Custa uma migração no servidor e mudanças nos dois repositórios.
2. **Botão no chat que abre a folha "Novo painel" preenchida.** Reaproveita a folha inteira e dispensa mexer na regra que esconde conversas. Mas o agente da folha começa numa sessão nova, sem a pesquisa, e a pessoa sai do chat, o oposto do pedido.
3. **Rascunho numa sessão escondida criada pela conversa.** Mesmo resultado da 1, com duas sessões por painel e mais coordenação. Descartada.

A pessoa deixou a escolha comigo; escolhi a 1.

## Desenho

### Servidor (`../tone-server`)

**1. (Cancelado em 20/11, na revisão para o plano.)** A conversa única não usa a lista de `app.ts:685`: usa `chatSessions` (`apps/server/src/chat.ts:30-58`), que já mantém as sessões do chat que rascunharam painel e esconde só a da folha, pela marca `NEW_PANEL_MARK` na primeira mensagem. Nenhum trecho do chat some hoje. A coluna `purpose` e a migração abaixo não são feitas; o que sobra dela é o item 2 (uma sessão nova de folha precisa levar a marca na primeira mensagem). Texto original, para registro:
- Nova coluna `sessions.purpose TEXT` (`NULL` = conversa; `'panel'` = sessão da folha "Novo painel"), em migração nova em `apps/server/src/db/index.ts`.
- Ao receber uma mensagem com `intent: "watch"` **sem** `watchId` numa sessão que ainda não tem mensagens da pessoa, gravar `purpose = 'panel'`. É exatamente o primeiro turno da folha. Uma conversa que mande `intent: "watch"` com `watchId` (respostas do cartão, abaixo) nunca é marcada.
- Lista de conversas (`app.ts` ~linha 685): trocar o `NOT EXISTS (... watches ...)` por `AND (s.purpose IS NULL OR s.purpose <> 'panel')`, mantendo `s.watch_id IS NULL`.
- Legado: sessões já referenciadas por `watches.session_id` precisam de `purpose`. A migração marca `'panel'` nas que parecem folha e deixa `NULL` nas que parecem conversa. Heurística sugerida (**a validar contra os dados de produção antes de rodar**): é conversa se teve qualquer atividade além de rascunhar painel (evento de pesquisa, decisão, situação) ou mensagem da pessoa antes do primeiro `watch_drafted`; senão, é folha. Escolha final do construtor, documentada no código e com a contagem de cada lado no PR.

**2. Rascunho do chat revisado na folha.** A folha manda as respostas com `intent: "watch"` e `watchId`, na sessão do rascunho (`NewPanel.tsx`, `turn`). Para um rascunho do chat, isso escreveria no chat. A folha passa a abrir uma sessão própria quando revisa um rascunho reaberto do cartão; a primeira mensagem dessa sessão leva `NEW_PANEL_MARK`, para `chatSessions` escondê-la, e `watchAnswer(watchId)` (`agent.ts:974`) passa a levar a regra atual do rascunho (`describeWatch`), para o agente ajustar sem o histórico da conversa. O construtor confirma com teste que o mesmo rascunho é ajustado, não um novo.

**3. Prompt (`apps/server/src/agent/prompt.ts:27`).** Ampliar a regra de acompanhar:
- Gatilhos: "painel", "crie um painel", "acompanhe esse/esses", "quero acompanhar o preço", além dos atuais.
- Quando a pessoa aponta produtos já mostrados ("esse", "desses dois", o produto escolhido), chamar `draft_watch` neste turno, sem `research_products`: um item em `products` por produto apontado (até cinco), com o título completo da oferta como aparece (marca, modelo, cor/variante), `url` e `offerId` da oferta. Variante (tamanho, cor) só se a pessoa disse ou se a oferta é dela; se o tamanho muda o preço e ela não disse, perguntar em `rule.questions` com opções.
- Sem produto claro na conversa, seguir a regra atual (perguntas no cartão).
- Cobrir com casos no eval/teste do agente (`apps/server/test/agent.test.ts`): "crie um painel desse" com `picked`, "desses dois" com lista curta, e o caso de não pesquisar de novo.

**4. Respostas do cartão na conversa.** Já existe: mensagem com `intent: "watch"` e `watchId` injeta `watchAnswer(watchId)` (`agent.ts:221, 974`). Só confirmar, com teste, que numa sessão de conversa isso funciona e não marca `purpose`.

**5. Cartão (`packages/genui-react/src`).**
- `host.ts`: duas ações novas em `GenUIAction`:
  - `{ type: "answer_watch"; watchId: string; text: string }`: a pessoa tocou as respostas das perguntas de um rascunho.
  - `{ type: "open_panel"; watchId: string }`: abrir a página do painel.
- `WatchDraft.tsx` / `components.tsx`: `WatchDraftLoader` recebe `onAct` e `interactive` do host. Quando `interactive` (a última resposta de uma conversa viva, nada rodando), passa `onAnswer = (text) => onAct({ type: "answer_watch", watchId, text })` para `WatchDraftView`, e as perguntas viram opções tocáveis como na folha. Cartões antigos continuam só mostrando as perguntas.
- Painel confirmado e ativo (`live`): o cartão mostra um link "Abrir painel" que dispara `open_panel`. Texto exato e posição seguem a ficha do componente e o better-writing.
- Depois de responder, o cartão recarrega o rascunho quando a nova resposta do agente chega. O agente desenha um novo `WatchDraft` com o mesmo id; o cartão antigo deixa de ser `interactive`. O construtor confirma que o comportamento fica limpo (um cartão vivo por vez).

### Web (este repo), depois de `npm run sync:shared -- ../tone-server`

**6. `src/conversas/Program.tsx` (`act`).**
- `answer_watch`: envia o turno com `{ type: "message", text, intent: "watch", watchId }` pela mesma via que `say`/`answer` usam, com o texto aparecendo como mensagem da pessoa.
- `open_panel`: navega para `/paineis/<id>`.
- Telemetria: `track("watch_draft_answered", { source: "conversation", questions })` e o `watch_draft_confirmed` existente. Atualizar `docs/analytics.md`.

**7. `src/conversas/NewPanel.tsx`.** Ao revisar um rascunho cuja sessão não é de folha, a primeira resposta abre uma sessão nova para a folha em vez de usar `draft.sessionId` (item 2).

**8. Conversa.** A lista de sessões volta a trazer as sessões do chat que rascunharam painéis, e a conversa única fica inteira, sem mudança no web. As leituras deixam de aparecer no chat pelo desenho dos resultados (item 9 de lá).

## Como saber que funcionou

- Teste do servidor: sessão do chat com rascunho de painel continua em `/api/sessions`; sessão da folha continua escondida; a migração classifica o legado como esperado; respostas da folha a um rascunho do chat ajustam o mesmo rascunho numa sessão de folha.
- Teste do agente: os três casos do item 3.
- Ponta a ponta no site publicado, no Chrome da pessoa: pesquisar um tênis → "crie um painel desses dois" → o cartão aparece com os dois produtos com nome completo → tocar a pergunta de tamanho → o plano se ajusta → confirmar → "Abrir painel" leva ao painel → o trecho da conversa continua no chat.
- `npm run check:design`, lint e build do web passam.

## Deixado para o construtor

- Heurística final da migração do legado, validada com dados reais.
- O nome da coluna `purpose`.
- Texto exato e posição do link "Abrir painel", seguindo `@toneorg/design` e o better-writing.
- Como evitar dois cartões vivos do mesmo rascunho depois de uma resposta.
