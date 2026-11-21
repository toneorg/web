# Resultados na conversa: escolha marcada, lista ou comparação, e o que a tone usou de você

Data: 21/11/2026. Repositórios: `toneorg/server` (em `../tone-server`) e `toneorg/web` (este). Maquetes feitas no visual da tone, não versionadas: versão A (`A.png`), comparação (`D.png`), detalhe do "Usei" (`F.png`) e a combinação escolhida (`G.png` lista, `H.png` comparar). Se precisar, refazer a partir deste texto.

## Intenção

Pensando como quem compra (o caso real: "perfume para a praia no fim do ano"), a resposta de hoje cansa e esconde coisas:

- A recomendação só aparece no texto do fim. No carrossel, nada diz qual é a escolha da tone.
- Comparar exige rolar para o lado e voltar. No celular os cards quebram o texto em colunas estreitas.
- A mesma coisa aparece duas vezes: a resposta do quiz volta como mensagem da pessoa, as linhas "Anotei" se repetem com nomes internos ("Perfume publico (beleza)") e o aviso do contratipo repete o "Atenção" do card.
- A pergunta que muda a escolha ("fresco ou marcante?") vem em texto solto, e não em toques.
- **A pessoa não sabe o que da memória dela entrou na busca.** O servidor aplica teto, tamanho, cores e marcas (`research/personal.ts`), e às vezes amplia sozinho (`research/broaden.ts`), sem mostrar nada disso. A pessoa só deduziu o teto por uma frase do card. Ela quer saber quando isso acontece, porque às vezes quer ir além das preferências antigas.

O que a pessoa disse:
- Quer **várias boas opções** para escolher, não uma só: a IA nem sempre acerta qual é a melhor para ela.
- Escolheu a **versão A** (manter o carrossel e arrumá-lo) com um **modo de comparar lado a lado** como na D, que ela mesma liga.
- Para ir além de uma preferência, quer a **opção B**: tocar na preferência e escolher entre "só nesta busca" e "mudar de vez".

## Objetivos

1. **Carrossel com a escolha marcada.** A escolha da tone vem primeiro, com contorno e a etiqueta "Escolha da tone". As outras opções podem ter uma etiqueta de papel ("Mais barato", "O original"). A ressalva de cada produto fica dentro do card dele.
2. **Lista | Comparar.** Uma chave segmentada no topo do bloco troca a vista sem sair do lugar. Em Comparar, as mesmas opções na mesma ordem viram colunas; a coluna da escolha fica marcada (`accentSoft`), a coluna dos critérios fica parada enquanto a tabela rola para o lado, e cada coluna tem "Ver na loja". A chave só aparece com duas opções ou mais. A escolha da vista fica guardada neste aparelho.
3. **"Usei: …" no bloco.** Lista o que pesou na busca daquela resposta. O que veio da memória leva um ponto coral; o que veio da conversa, não. Tocar num item da memória abre um painel curto que diz de onde veio ("veio do que você disse em 12/11") e oferece **Ignorar só nesta busca** (pesquisa de novo sem aquele item; a memória fica) ou **Mudar de vez** (troca o valor na memória e pesquisa de novo).
4. **Aviso quando a tone vai além sozinha.** Quando o servidor amplia a busca, o "Usei" mostra o valor novo ("até ~~R$ 150~~ R$ 190") e uma linha diz o que mudou e que a preferência continua igual.
5. **Menos repetição.**
   - A resposta de um quiz ou de uma pergunta de toque não vira mais uma mensagem da pessoa no chat; o cartão respondido já mostra a resposta.
   - As linhas "Anotei" de uma mesma resposta viram uma só, sem repetições: "Guardei 2 preferências de perfume · ver", e "ver" leva ao perfil.
   - O prompt pede que o `Callout` não repita a ressalva que já está num card.
6. **A pergunta que muda a escolha vai em toques.** O prompt já manda isso (`prompt.ts:39`), mas o modelo descumpriu. Reforçar com um exemplo do caso "depois de mostrar produtos".

## Fora do escopo

- O "Correção: pela foto…" no fim da resposta (vem da conferência de foto; é outro assunto).
- Mudar a ordem dos blocos que o modelo escreve, ou juntar o texto de abertura ao bloco (a versão B, descartada pela pessoa).
- Guardar a vista Lista/Comparar na conta (fica neste aparelho).
- `ComparisonMatrix` continua existindo como está; este trabalho mexe no `ProductCarousel`.

## Anti-objetivos

- Mostrar no "Usei" algo que não entrou na busca, ou esconder algo que entrou.
- "Ignorar só nesta busca" alterar a memória.
- A coluna marcada em Comparar não ser a mesma escolha marcada na Lista.
- Uma cor nova: a escolha usa `accentSoft`/`accentText`, o resto `ink`/`graphite` (`@toneorg/design`).

## Restrições

- `src/tone/shared` e `src/tone/genui` são gerados de `toneorg/server` (`packages/shared`, `packages/genui-react`). Mudanças neles nascem no servidor e chegam com `npm run sync:shared -- ../tone-server`. Nunca editar as cópias.
- Interface: ler `node_modules/@toneorg/design/DESIGN.md` e as fichas (`surface.md`, `selection.md`, `button.md`) antes; nenhuma cor à mão; `npm run check:design` passa. A chave Lista/Comparar segue "Escolha (uma entre poucas)" de `selection.md`; se a ficha não servir dentro de um cartão, a mudança vai para `toneorg/design` antes.
- Next.js deste repo muda APIs: ler `node_modules/next/dist/docs/` antes de mexer em rotas.
- Testes de modelo só com os modelos baratos já usados na tone (nunca Sonnet, Opus, GPT-6 Sol/Astra).

## Abordagens consideradas

1. **Versão A, arrumar o que existe, mais o modo Comparar** (escolhida pela pessoa). Mantém o carrossel que ela já conhece, marca a escolha, junta o "Usei" ao bloco e põe a comparação a um toque. É barata e mantém várias opções no mesmo peso visual.
2. **Bloco "Resultado" com ordem fixa** (versão B): a escolha grande e as outras em lista curta. Lê mais rápido, mas rebaixa as outras opções, e a pessoa quer escolher entre várias.
3. **Cards com papéis** (C), **tabela fixa** (D) e **resumo com folha** (E): a C ocupa muita altura; a D sozinha perde fotos e motivos; a E tira a pessoa da conversa na hora de decidir. A D ficou como modo opcional da A.

## Desenho

### Servidor (`../tone-server`)

**1. Contrato do carrossel (`packages/shared/src/genui.ts`).** `ProductCarousel` ganha `compare` opcional: até 6 `CompareRow` (rótulo e um valor curto por produto, na ordem dos produtos). São os atributos que decidem esta compra ("Cheiro marinho", "Original", "Tamanho"). Preço, avaliações e loja não entram: a web tira dos produtos. Atualizar a descrição do componente e o exemplo de `genui.ts` (~linha 496).

**2. Contexto da busca para a web (`packages/shared/src/agent.ts`).** Novo evento `research_context`, emitido logo depois da pesquisa (e de novo depois de ampliar), ligado ao `researchId`:

```ts
{
  type: "research_context",
  researchId: string,
  used: Array<{
    id: string,                  // id do requisito ("pessoa_orcamento" ou do modelo)
    label: string,               // curto, para a pílula: "até R$ 150", "masculino"
    source: "memory" | "conversation",
    memory?: { id: string, key: string, value: string, category: string, savedAt: string },
  }>,
  widened: Array<{ id: string, from: string, to: string }>,  // ex.: pessoa_orcamento, "R$ 150", "R$ 190"
  note: string | null,          // a frase de ampliar, pronta em português
}
```

- `personalConstraints` passa a devolver, junto de cada requisito `pessoa_*`, a memória que o originou (id, chave, valor, categoria e data). Os requisitos do modelo entram como `conversation`, com o `label` vindo da `description` encurtada. O construtor decide o encurtamento e registra nos testes.
- `relaxPersonal` (`broaden.ts`) passa a devolver, além das frases, o par de antes e depois de cada item ampliado.
- O evento fica gravado com a resposta, como os outros eventos da pesquisa, para que respostas antigas também mostrem o "Usei".

**3. Ignorar só nesta busca (`agent.ts`).** A mensagem da pessoa aceita `skipPersonal: string[]` (ids `pessoa_*`). Na pesquisa daquele turno, `mergePersonal` deixa esses itens de fora; a memória não muda. É o mesmo caminho do "pesquisar de novo" que já existe (`repeatResearch` em `Conversation.tsx`), com o texto da pessoa "Pesquisa de novo sem {label}".

**4. Prompt (`apps/server/src/agent/prompt.ts`).**
- No carrossel: a primeira opção é a escolha (já há a etiqueta "Melhor escolha", e `bestFirst` a põe em primeiro); as outras podem levar etiqueta de papel ("Mais barato", "O original"). Escrever `compare` com 2 a 4 atributos que decidem a compra.
- Não repetir num `Callout` a ressalva que já está num card.
- Depois de mostrar produtos, uma pergunta que muda a escolha vai em `PreferenceChips`, com exemplo.
- Cobrir no teste do agente: carrossel com `compare`; pergunta final em componente.

**5. Componentes (`packages/genui-react/src/components.tsx`).**
- `host.ts`: `GenUIHost` ganha `research?: ResearchContextView` (o `research_context` da resposta, quando há) e duas ações: `{ type: "skip_personal"; ids: string[]; label: string }` e `{ type: "change_memory"; memoryId: string; key: string; category: string; value: string }`.
- `ProductCarousel`:
  - A etiqueta "Melhor escolha" passa a se chamar "Escolha da tone" e o card ganha contorno (`ink`). O texto da etiqueta vem do componente, não do modelo, para ser sempre o mesmo.
  - Cabeçalho: título; o "Usei" (quando `host.research` existe); a chave Lista | Comparar (com duas opções ou mais) e as setas só na Lista.
  - Comparar: tabela com a coluna de rótulos fixa (`position: sticky`), colunas de 104 px, rolagem para o lado. Linhas: Preço, as de `compare`, Avaliações e Loja, e por último "Ver na loja" por coluna. Sem `compare`, só as linhas fixas. A coluna da escolha fica com `accentSoft`.
  - A vista escolhida é guardada em `localStorage` (`tone.carousel.view`), sempre dentro de try/catch; sem armazenamento, começa em Lista.
- `UsedFilters` (novo, dentro do carrossel): pílulas. As da memória levam o ponto coral e abrem um painel (`Popover` com botões de opção) com "Ignorar só nesta busca" e "Mudar de vez". "Mudar de vez" mostra um campo com o valor atual para editar e, ao confirmar, dispara `change_memory` e depois `skip_personal` com o valor novo pesquisado (o construtor confere a ordem). Com `widened`, a pílula mostra o valor antigo riscado e o novo, e a linha `note` aparece embaixo, em `accentSoft`.
- Acessibilidade: a chave é um grupo de botões com `aria-pressed`; a tabela tem `scope` em linhas e colunas e uma legenda escondida; o painel do "Usei" fecha com Esc e devolve o foco à pílula.

### Web (este repo), depois de `npm run sync:shared -- ../tone-server`

**6. `Conversation.tsx`.**
- Guardar o `research_context` por resposta (pelo `researchId` ou pela resposta em que chegou) e passá-lo ao host do `Program` daquela resposta.
- `memory_saved`: em vez de uma linha por evento, juntar os de uma mesma resposta numa linha só, sem repetir chave e valor: "Guardei N preferências de {categoria} · ver", com link para o perfil. Usar o rótulo de `memoryLabel` sem a categoria interna.
- `answer`: deixar de acrescentar `said(item.session, display)` como mensagem da pessoa (`~982`). O turno continua indo ao servidor igual.

**7. `Program.tsx` (`act`).**
- `skip_personal`: envia o turno com o texto "Pesquisa de novo sem {label}" e `skipPersonal: ids`.
- `change_memory`: `api.addMemory(key, value, category)` (o servidor substitui a memória da mesma chave; o construtor confirma) e depois o mesmo turno de `skip_personal` com o texto "Pesquisa de novo com {novo valor}".
- Telemetria: `carousel_view_changed { view }`, `used_filter_opened { source }`, `used_filter_skipped { id }`, `used_filter_changed { id }`. Atualizar `docs/analytics.md`.

## Como saber que funcionou

- Servidor: teste de `personalConstraints` devolvendo a memória de cada requisito; `relaxPersonal` devolvendo antes e depois; `skipPersonal` tirando o item da busca sem mexer na memória; evento `research_context` emitido e gravado; contrato do carrossel aceitando `compare` e recusando linhas com número errado de valores.
- Agente: os casos do item 4.
- Web: `npm run check:design`, lint, build e testes onde o repo já testa componentes.
- No site publicado, no Chrome da pessoa, refazendo o caso do perfume: a escolha marcada na Lista e a mesma coluna marcada em Comparar; a vista lembrada ao recarregar; "Usei" com "até R$ 150" e o ponto coral; "Ignorar só nesta busca" pesquisa de novo e o perfil continua com R$ 150; "Mudar de vez" troca no perfil; o quiz não se repete como mensagem; uma só linha "Guardei…".

## Escolhas minhas (para conferir)

- As linhas de `compare` são escritas pelo modelo; Preço, Avaliações e Loja vêm dos dados.
- A vista fica guardada no aparelho, não na conta.
- A chave só aparece com duas opções ou mais.
- O "Usei" mostra também o que veio da conversa (sem ponto), para a pessoa ver tudo o que pesou; só o que veio da memória abre o painel.
- O texto da etiqueta da escolha é fixo ("Escolha da tone"), não do modelo.

## Deixado para o construtor

- Como encurtar a `description` de um requisito do modelo para a pílula.
- Se `research_context` vai como evento próprio ou dentro de `research_result` (o desenho prefere evento próprio, para não mudar `schemaVersion`).
- Se `addMemory` substitui a memória da mesma chave ou se é preciso um `PUT`.
- O texto final das frases (better-writing).
