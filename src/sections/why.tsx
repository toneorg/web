import { QuestionsMarquee } from "@/components/questions-marquee";
import { Container, GRID, SECTION, Source } from "@/components/site-chrome";
import { ANCHOR } from "@/lib/site";

// Numbers and sources as cited in ../docs/comum/01-tese-e-posicionamento.md.
const QUESTIONS = [
  {
    question: "Qual desses é pra mim?",
    fact: "78% das pessoas não têm certeza de que o produto vai entregar o que promete.",
    source: "Accenture, 2024, com 19 mil entrevistados",
  },
  {
    question: "Existe algo melhor pelo mesmo dinheiro?",
    fact: "72% não conseguem comparar as opções.",
    source: "Accenture, 2024",
  },
  {
    question: "É seguro comprar aqui?",
    fact: "No Brasil, 58% abandonam a compra por dúvida sobre o vendedor ou medo de fraude.",
    source: "CX Trends, 2025",
  },
];

/**
 * Why tone exists: researching a purchase is tiring, and the store does not
 * do it for you. The many small doubts drift past, then settle into three.
 */
export function Why() {
  return (
    <section id={ANCHOR.why} className={SECTION}>
      <Container>
        <h2 className="display-lg">
          <span className="block">Pesquisar uma compra</span>
          <span className="block">dá trabalho.</span>
        </h2>

        <div className={`${GRID} mt-12 gap-10 lg:mt-16`}>
          <p className="lead max-w-[33rem] lg:col-span-6">
            Doze abas abertas, filtros que não falam a sua língua, avaliações que se contradizem.
            Você compara preço, tamanho, prazo de entrega, e ainda assim fica a dúvida.
          </p>
          <p className="lead max-w-[30rem] text-muted lg:col-span-5 lg:col-start-8">
            E a loja não lembra de você. Toda vez você explica de novo o seu número, o seu
            orçamento e as marcas que já não quer.
          </p>
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
            <li key={question} className={`${GRID} gap-4 lg:items-end`}>
              <p className="ink-in display-lg text-coral italic lg:col-span-8">{question}</p>
              <div className="max-w-[26rem] lg:col-span-4 lg:pb-2">
                <p className="leading-normal">{fact}</p>
                <Source>{source}</Source>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
