import { CheckIcon } from "@/components/icons";
import { LinkPill } from "@/components/link-pill";
import { Reveal } from "@/components/reveal";
import { Container, SECTION } from "@/components/site-chrome";
import { SWATCH, SWATCH_PICKED } from "@/components/swatch";
import { ANCHOR } from "@/lib/site";
import { card, order, within } from "@/lib/stagger";
import { shadeRange } from "@/lib/tones";

type Level = "alta" | "média" | "baixa";

const LEVEL_BARS: Record<Level, number> = { alta: 3, média: 2, baixa: 1 };

/** Three bars and a word. Deliberately not button-shaped: it is a reading, not a control. */
function Confidence({ level }: { level: Level }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-[0.875rem]">
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`pop h-3 w-1 rounded-full ${bar <= LEVEL_BARS[level] ? "bg-wine" : "bg-wine/20"}`}
            style={within(bar)}
          />
        ))}
      </span>
      Confiança {level}
    </span>
  );
}

/**
 * One answer: her question, what tone shows, and what it means. `wide` lays
 * the tile out in two columns on large screens, with the card on the trailing
 * side at full height.
 */
function Answer({
  question,
  caption,
  className,
  position,
  wide,
  children,
}: {
  question: string;
  caption: string;
  className: string;
  position: number;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`reveal-item flex flex-col gap-6 rounded-4xl p-6 sm:p-8 ${
        wide ? "lg:col-span-2 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-10" : ""
      } ${className}`}
      style={card(position)}
    >
      <h3 className={`display-md italic ${wide ? "lg:col-span-5" : ""}`}>{question}</h3>
      <div
        className={`rounded-[1.25rem] bg-white p-5 text-wine sm:p-6 ${
          wide ? "lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:p-8" : ""
        }`}
      >
        {children}
      </div>
      <p
        className={`mt-auto max-w-[34rem] leading-normal ${
          wide ? "lg:col-span-5 lg:row-start-2 lg:self-end" : ""
        }`}
      >
        {caption}
      </p>
    </article>
  );
}

const TRUST_REASONS = [
  "CNPJ ativo há 9 anos",
  "Fora da lista de sites a evitar do Procon-SP",
  "Responde reclamações no consumidor.gov.br",
];

/** The check marks draw after the three bars of the confidence reading. */
const AFTER_BARS = 3;

function TrustAnswer({ position }: { position: number }) {
  return (
    <Answer
      question="Essa loja entrega?"
      caption="Confiança alta, média, baixa ou desconhecida, sempre com o motivo. Uso dados públicos, como CNPJ, Procon e consumidor.gov.br."
      className="bg-wine-800"
      position={position}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="font-medium">lojaexemplo.com.br</p>
        <Confidence level="alta" />
      </div>
      <ul className="mt-4 flex flex-col gap-2 text-[0.9375rem]">
        {TRUST_REASONS.map((reason, i) => (
          <li key={reason} className="flex gap-2.5">
            <span className="uncover mt-0.5 shrink-0" style={within(AFTER_BARS + i)}>
              <CheckIcon className="size-4" />
            </span>
            {reason}
          </li>
        ))}
      </ul>
    </Answer>
  );
}

// Ordered by trust first and price second, so the cheapest offer comes last.
const OFFERS: { store: string; level: Level; price: string }[] = [
  { store: "Outra loja confiável", level: "alta", price: "R$ 82,90" },
  { store: "Esta loja", level: "alta", price: "R$ 89,90" },
  { store: "Vendedor novo em marketplace", level: "baixa", price: "R$ 74,90" },
];

function PriceAnswer({ position }: { position: number }) {
  return (
    <Answer
      question="Tá caro? Tem em outro lugar?"
      caption="O mesmo produto em lojas confiáveis, na ordem de confiança e só depois de preço. Nenhuma loja paga para aparecer. Se você quiser, eu aviso quando baixar."
      className="bg-coral-200 text-wine"
      position={position}
    >
      <ul className="flex flex-col gap-3.5">
        {OFFERS.map(({ store, level, price }) => (
          <li key={store} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4">
            <span className="font-medium">{store}</span>
            <span className="tabular-nums">{price}</span>
            <span className="col-span-2 text-muted">
              <Confidence level={level} />
            </span>
          </li>
        ))}
      </ul>
    </Answer>
  );
}

// A stretch of an invented shade range, named 20 to 50 in steps of five. The
// example verdict picks one and offers its darker neighbor as second choice.
const SHADES = shadeRange(24)
  .slice(9, 16)
  .map((hex, i) => ({ hex, name: String(20 + i * 5) }));
const WORN = "30";
const PICKED = "35";
const SECOND = "40";

function ShadeAnswer({ position }: { position: number }) {
  return (
    <Answer
      wide
      question="Essa base serve em mim? Qual tom?"
      caption="Só em base de maquiagem, por enquanto. É a minha primeira especialidade."
      className="bg-coral text-wine"
      position={position}
    >
      <p className="text-[0.9375rem] text-muted">Base líquida matte, 30 ml, 24 tons</p>
      <p className="display-lg mt-5">Serve.</p>
      <p className="display-sm mt-2">
        <span className="block">Seu tom é o {PICKED}.</span>
        <span className="block">A segunda opção é o {SECOND}.</span>
      </p>

      <ul aria-hidden className="mt-6 grid max-w-[22rem] grid-cols-7 gap-2 sm:gap-3">
        {SHADES.map(({ hex, name }) => (
          <li key={name} className="flex flex-col items-center gap-2">
            <span
              className={`block aspect-square w-full ${SWATCH} ${name === PICKED ? SWATCH_PICKED : ""}`}
              style={{ background: hex }}
            />
            <span
              className={`text-[0.8125rem] tabular-nums ${name === PICKED ? "font-medium" : "text-muted"}`}
            >
              {name}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 max-w-[34rem] leading-normal">
        Você usa o {WORN} de outra marca e acha um pouco claro. O {PICKED} desta fica um passo
        acima, no mesmo subtom.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.875rem] text-muted">
        <span className="text-wine">
          <Confidence level="média" />
        </span>
        <span>Versão beta</span>
      </div>
      <p className="mt-3 text-[0.875rem] leading-snug text-muted">
        A cor real pode variar com a iluminação e com a tela.
      </p>
    </Answer>
  );
}

/** What tone does with a link, shown as her message and tone's three replies. */
export function What() {
  return (
    <section id={ANCHOR.what} className={`bg-wine-950 text-coral-50 ${SECTION}`}>
      <Container>
        <h2 className="display-lg">
          <span className="block">Você manda o link.</span>
          <span className="block">Eu respondo.</span>
        </h2>
        <p className="lead mt-6 max-w-[33rem] text-coral-200">
          Uma tela só, com as respostas chegando em partes. Funciona com qualquer produto. Em
          base de maquiagem eu vou até o veredito.
        </p>

        <Reveal className="mt-14 lg:mt-20">
          <div className="reveal-item flex justify-end" style={order(0)}>
            <LinkPill className="bg-coral text-wine">
              <span className="truncate">lojaexemplo.com.br/base-liquida-matte</span>
            </LinkPill>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TrustAnswer position={1} />
            <PriceAnswer position={2} />
            <ShadeAnswer position={3} />
          </div>

          <p className="reveal-item mt-5 text-[0.875rem] text-coral-300" style={order(4)}>
            Exemplo ilustrativo. A loja, o produto e os preços são inventados.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
