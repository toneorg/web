# Landing: movimento com a rolagem

Data: 2026-11-18. Páginas: `/` (principal) e `/lojas`.

## Intenção

Ao terminar de rolar a home, a pessoa precisa sentir que **a tone faz o trabalho pesado de pesquisar por ela**. O movimento mostra esse trabalho (o que ela lê, compara e descarta), nunca enfeita. Segue o princípio do design system: "uma animação mostra um estado ou uma sequência do produto".

Referências citadas: phia.com (seção escura fixa, uma pilha de fotos que avança com a rolagem, um pedaço do produto sobre cada foto, título que troca à esquerda) e usealia.com (mensagens soltas que convergem numa conversa; linhas finas que se dividem e se juntam entre seções). hark.com também foi citada, mas não foi vista (abriu a conta logada).

## Objetivos

- Um momento principal: a pesquisa acontecendo enquanto a pessoa rola.
- Movimentos menores em outras seções, todos contando a mesma história: muitas fontes, uma resposta.
- A página para lojas ganha um movimento do mesmo tipo.

## Não objetivos

- Mudar a abertura. Ela continua com a demo da conversa que toca sozinha, sem efeito de rolagem.
- WebGL, Three.js, modelos 3D ou vídeo.
- Mudar a copy das seções existentes, exceto onde a nova seção substitui "Como funciona".

## Anti-objetivos (falha mesmo funcionando)

- O momento principal como primeira coisa da página ou como a única animação.
- Rolagem sequestrada: a página nunca rola por conta própria nem muda a velocidade da roda.
- Cards que aparecem com fade em toda seção.
- Celular travando ou com layout pulando (CLS).
- Conteúdo que só aparece com JavaScript ou some para quem pediu menos movimento.

## Restrições

- Cores, raios, curvas e durações só dos tokens do `@toneorg/design` v0.2.0; `npm run check:design` passa.
- Sem dependência nova.
- Só `transform`, `opacity` e `filter` animados; nada que force layout a cada quadro.
- `prefers-reduced-motion`: o estado final aparece de uma vez, legível como uma lista estática.
- Sem JavaScript, ou antes da hidratação: o servidor desenha o estado final (como as demos atuais fazem com `useSequence`).
- Celular primeiro: a seção fixa é mais curta e sem perspectiva abaixo de 48rem.

## Abordagens

1. **Um hook próprio de progresso da rolagem + animações de CSS ligadas à rolagem** (escolhida). Um `useScrollProgress(ref)` lê a posição da seção num `requestAnimationFrame`, só enquanto ela está perto da tela (IntersectionObserver), e devolve um número de 0 a 1. A seção fixa e os contadores usam esse número; os movimentos pequenos (linhas que se desenham) usam `animation-timeline: view()`, que a página já usa em `reveal` e `fill-in`, com o estado final como fallback.
2. **GSAP ScrollTrigger.** Mais pronto e mais testado, mas cerca de 40 KB a mais e uma dependência nova para uma seção. Descartada.
3. **Só CSS (`animation-timeline`).** Zero JavaScript, mas o Safari ainda falha em partes disso e a seção principal precisa trocar textos e contadores. Descartada.

## O mapa (aprovado)

| Seção | Movimento |
|---|---|
| Abertura | Como hoje. |
| Dores ("Comprar ficou fácil. Escolher, não.") | A barra de abas (`TabPile`) ganha abas conforme a seção sobe; o selo conta de "+6 abas" até "+26 abas". |
| ★ A pesquisa (substitui "Como funciona", mantém `#como-funciona`) | Seção fixa, descrita abaixo. |
| Entre Dores e A pesquisa, e entre A pesquisa e O porquê | Linhas finas em coral: várias saem da largura toda e convergem num ponto, desenhadas pela rolagem. |
| Comparação | A lista do chat geral cresce de 2 até 8 itens com a rolagem e o selo "N opções" acompanha; o card da tone fica parado com uma escolha. |
| Lojas: relatório de dúvidas | As perguntas ("Fico entre M e G…") caem em fila e se encaixam nas linhas do relatório; as barras enchem em seguida. |

## A pesquisa (o momento principal)

Mostra o que acontece nos segundos em que a demo da abertura diz "Lendo 214 avaliações · Comparando 12 cadeiras em 6 lojas". Usa o mesmo pedido da abertura (a cadeira), de propósito: é o bastidor daquela resposta.

Estrutura no computador: a seção tem 300vh de altura; dentro, um palco `position: sticky` com 100vh. Três colunas como na Phia: título à esquerda, palco no centro, texto curto à direita. Fundo `ink` com o brilho coral (`glow-ink`), para marcar que é o momento principal e contrastar com as seções claras ao redor.

| Progresso | Título (esquerda) | Palco | Texto (direita) |
|---|---|---|---|
| 0 a 0,2 | Você conta. | O pedido da pessoa em balão. | O passo 1 atual. |
| 0,2 a 0,6 | Ela pesquisa. | Cards chegam de longe em perspectiva (`translateZ`, escala, opacidade): trechos de avaliação, preços com a loja, linhas de ficha técnica. Contadores sobem até 214 avaliações, 12 cadeiras, 6 lojas. | O passo 2 atual. |
| 0,6 a 0,85 | (continua) | O que não serve cai e sai com o motivo numa etiqueta ("assento para em 48 cm", "fora do limite", "encosto quebra, 31 avaliações"). | — |
| 0,85 a 1 | Você decide. | Sobra um card, que vira a resposta: Cadeira Apoio Pro, R$ 1.390, os motivos com ✓ coral. | O passo 3 atual. |

Celular (abaixo de 48rem): 200vh, título e texto em cima, palco embaixo, cards sem perspectiva (só deslocamento e opacidade), menos cards (8 em vez de 14).

Acessibilidade: o palco é `aria-hidden`; os três passos existem como `<ol>` com texto de verdade (os mesmos de hoje), visível no movimento reduzido e lido pelo leitor de tela. Os títulos que trocam são decorativos sobre esse `<ol>`.

## Copy nova

Vai para `docs/copy/landing.md` antes do código. Os nomes de produto e números repetem os da abertura (Cadeira Apoio Pro, Linha Flex, 214 avaliações, 12 cadeiras, 6 lojas). Os trechos de avaliação e os motivos de descarte são ilustrativos, no mesmo tom dos exemplos atuais.

## Decidido por mim (pode corrigir)

- Fundo escuro na seção da pesquisa, como na Phia.
- O exemplo da cadeira, para ligar com a abertura.
- Linhas de convergência em dois lugares só.
- A seção substitui os três cards de "Como funciona" e mantém o link `#como-funciona` do menu.

## Fica com quem constrói

- Quantos cards exatamente e onde cada um nasce no palco.
- A curva de cada trecho dentro dos tokens (`ease-soft`, durações).
- O desenho exato das linhas de convergência.

## Como saber que deu certo

- A 1440 e a 390: a seção fixa não corta, não pula e termina no estado final.
- Movimento reduzido: a página inteira legível, sem nada escondido.
- Sem JavaScript: estado final em toda seção.
- Lighthouse no celular sem queda de desempenho nem CLS novo.
- Typecheck, lint, testes e `check:design` passam.
