import { HesitatingDots } from "@/components/hesitating-dots";
import { QuestionsMarquee } from "@/components/questions-marquee";
import { Container, GRID, SECTION, Source } from "@/components/site-chrome";
import { ToneScale } from "@/components/tones";
import { ANCHOR } from "@/lib/site";
import { shadeRange } from "@/lib/tones";

// Numbers and sources as cited in ../docs/comum/01-tese-e-posicionamento.md.
const QUESTIONS = [
  {
    question: "É confiável comprar aqui?",
    fact: "No Brasil, 58% abandonam a compra por dúvida sobre o vendedor ou medo de fraude.",
    source: "CX Trends, 2025",
  },
  {
    question: "Esse produto funciona em mim?",
    fact: "78% das pessoas não têm certeza de que o produto vai entregar o que promete.",
    source: "Accenture, 2024, com 19 mil entrevistados",
  },
  {
    question: "Existe algo melhor pelo mesmo dinheiro?",
    fact: "72% não conseguem comparar as opções.",
    source: "Accenture, 2024",
  },
];

// The twenty dots of an invented product page, light to deep.
const PAGE_SHADES = shadeRange(20);

/**
 * Why tone exists: the pain is insecurity, and the product page does not
 * answer it. The many small doubts drift past, then settle into three.
 */
export function Why() {
  return (
    <section id={ANCHOR.why} className={SECTION}>
      <Container>
        <h2 className="display-lg">
          <span className="block">Você não está indecisa.</span>
          <span className="block">Está insegura.</span>
        </h2>

        <div className={`${GRID} mt-12 gap-10 lg:mt-16 lg:items-start`}>
          <p className="lead max-w-[33rem] lg:col-span-6">
            Você viu a base num vídeo, abriu a página e travou. Não sabe se ela funciona na sua
            pele, qual dos vinte tons é o seu, nem se aquela loja entrega.
          </p>
          <div className="lg:col-span-5 lg:col-start-8">
            <HesitatingDots shades={PAGE_SHADES} />
          </div>
        </div>
      </Container>

      {/* Full-bleed: the band runs edge to edge while the text keeps its margins. */}
      <div className="mt-24 lg:mt-32">
        <QuestionsMarquee />
      </div>

      <Container>
        <p className="lead mt-24 max-w-[33rem] lg:mt-32">
          No fundo, são três perguntas. É nelas que eu trabalho.
        </p>
        <ul className="mt-12 flex flex-col gap-14 lg:gap-16">
          {QUESTIONS.map(({ question, fact, source }) => (
            <li
              key={question}
              className={`${GRID} gap-4 lg:items-end`}
            >
              <p className="ink-in display-lg text-coral italic lg:col-span-8">{question}</p>
              <div className="max-w-[26rem] lg:col-span-4 lg:pb-2">
                <p className="leading-normal">{fact}</p>
                <Source>{source}</Source>
              </div>
            </li>
          ))}
        </ul>

        <div className={`${GRID} mt-24 gap-10 rounded-4xl bg-coral-100 p-6 sm:p-10 lg:mt-32 lg:items-center lg:p-14`}>
          <div className="lg:col-span-6">
            <h3 className="display-md">A pele brasileira ainda não tem especialista.</h3>
            <p className="mt-5 max-w-[32rem] leading-relaxed">
              Cerca de 56% das pessoas no Brasil se declaram pretas ou pardas. As paletas e as
              ferramentas de tom foram calibradas para outra população, e erram mais nos tons
              médios e escuros.
            </p>
            <Source>IBGE, Censo 2022</Source>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <ToneScale />
          </div>
        </div>
      </Container>
    </section>
  );
}
