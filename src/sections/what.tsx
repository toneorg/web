import { CheckIcon } from "@/components/icons";
import { Reveal } from "@/components/reveal";
import { Container, GRID, SECTION, WORDMARK } from "@/components/site-chrome";
import { ANCHOR } from "@/lib/site";
import { card, order, within } from "@/lib/stagger";

// What the extension does, per toneorg/extension docs/requisitos.md (RF1 to RF5, T06).
const ABILITIES = [
  {
    what: "Eu lembro de você.",
    how: "Seus gostos, medidas, orçamento e as marcas que você prefere ficam guardados, e eu uso sem você repetir. Se você conectar o Gmail, os pedidos que já fez também contam.",
  },
  {
    what: "Eu navego por você.",
    how: "Busco, filtro, ordeno e abro os produtos na Amazon e no Mercado Livre, na sua própria aba. Você vê cada passo e pode parar quando quiser.",
  },
  {
    what: "Poucas opções, com o porquê.",
    how: "Três a cinco, comparadas pelo que importa para você. Quando falta uma informação, eu faço uma pergunta rápida em vez de chutar.",
  },
  {
    what: "Também na web.",
    how: "Comece uma conversa no navegador do trabalho e continue na extensão em casa. É a mesma conta e o mesmo histórico.",
  },
];

const STEPS = [
  "Busquei “relógio social” na Amazon",
  "Filtrei até R$ 800",
  "Abri e li 14 produtos",
];

// Invented products. The order is tone's, not the store's: the best fit first.
const OPTIONS = [
  {
    name: "Relógio clássico, aço, 39 mm",
    price: "R$ 649,00",
    why: "O mais parecido com o que você usa. Nota 4,6 em 1.200 avaliações.",
  },
  {
    name: "Automático, mostrador azul, 38 mm",
    price: "R$ 789,90",
    why: "O mais bonito dos três, mas só chega na quinta.",
  },
  {
    name: "Quartzo com vidro de safira, 40 mm",
    price: "R$ 512,00",
    why: "O mais barato. Avaliações dizem que a pulseira risca cedo.",
  },
];

const CHIPS = ["Claro", "Escuro", "Tanto faz"];

/**
 * The side panel in miniature, as it answers one request: what she asked,
 * what tone did in the store, the short list and the question that follows.
 * Static and described by its caption, so it reads as an example, not a control.
 */
function PanelDemo() {
  return (
    <figure className="flex flex-col gap-3">
      <div className="flex flex-col gap-5 rounded-tile bg-white p-5 text-wine sm:p-6">
        <div className="reveal-item flex items-baseline justify-between gap-4" style={order(0)}>
          <span className={`${WORDMARK} text-[1.5rem]`}>tone</span>
          <span className="truncate text-caption text-muted">
            Você está vendo: Amazon, busca
          </span>
        </div>

        <p
          className="reveal-item ms-auto max-w-[19rem] rounded-panel rounded-se-md bg-coral-100 px-4 py-3 leading-snug"
          style={order(1)}
        >
          Um relógio até R$ 800 que não pareça esportivo. É pra usar no trabalho.
        </p>

        <ul className="reveal-item flex flex-col gap-1.5 text-small text-muted" style={card(2)}>
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="uncover shrink-0 text-wine" style={within(i)}>
                <CheckIcon className="size-4" />
              </span>
              {step}
            </li>
          ))}
        </ul>

        <p className="reveal-item leading-snug" style={order(4)}>
          Três valem a pena. Você prefere pulseira de metal e caixa até 40 mm, então deixei os
          outros de fora.
        </p>

        <ol className="flex flex-col gap-2">
          {OPTIONS.map(({ name, price, why }, i) => (
            <li
              key={name}
              className="reveal-item rounded-panel bg-coral-50 px-4 py-3.5"
              style={order(5 + i)}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-medium leading-snug">{name}</span>
                <span className="shrink-0 tabular-nums">{price}</span>
              </div>
              <p className="mt-1 text-small text-muted">{why}</p>
            </li>
          ))}
        </ol>

        <div className="reveal-item" style={order(8)}>
          <p className="leading-snug">Mostrador claro ou escuro?</p>
          <ul aria-hidden className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <li
                key={chip}
                className="flex min-h-11 items-center rounded-full border border-coral-200 px-4 text-ui"
              >
                {chip}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="reveal-item ps-5 text-small text-coral-300" style={order(9)}>
        Exemplo ilustrativo. Os produtos e os preços são inventados.
      </figcaption>
    </figure>
  );
}

/** What tone does with a request, shown as the side panel answering one. */
export function What() {
  return (
    <section id={ANCHOR.what} className={`bg-wine-950 text-coral-50 ${SECTION}`}>
      <Container>
        <h2 className="display-lg">
          <span className="block">Você pede.</span>
          <span className="block">Eu pesquiso.</span>
          <span className="block">Você decide.</span>
        </h2>
        <p className="lead mt-6 max-w-[33rem] text-coral-200">
          Eu fico num painel ao lado da loja, que continua aberto enquanto você navega. Sei qual
          página você está vendo e trabalho nela com você.
        </p>

        <div className={`${GRID} mt-14 gap-14 lg:mt-20`}>
          <dl className="flex flex-col gap-10 lg:col-span-6">
            {ABILITIES.map(({ what, how }) => (
              <div key={what}>
                <dt className="display-sm">{what}</dt>
                <dd className="mt-3 max-w-[30rem] leading-relaxed text-coral-200">{how}</dd>
              </div>
            ))}
          </dl>

          <Reveal className="lg:col-span-5 lg:col-start-8">
            <PanelDemo />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
