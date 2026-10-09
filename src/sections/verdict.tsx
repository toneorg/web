import { Reveal } from "@/components/reveal";
import { Container, GRID, SECTION } from "@/components/site-chrome";
import { order } from "@/lib/stagger";

// The ink gets lighter as the answer gets less certain.
const VERDICTS = [
  {
    answer: "Serve.",
    ink: "text-wine",
    meaning: "Eu digo qual é o seu tom, a segunda opção e o porquê, em até quatro frases.",
  },
  {
    answer: "Não serve.",
    ink: "text-coral-700",
    meaning:
      "Quando nenhum tom daquela base é o seu, eu digo. Só mostro alternativa se for melhor para a sua pele, pelo mesmo preço ou menos.",
  },
  {
    answer: "Não dá para afirmar.",
    ink: "text-coral",
    meaning: "Quando falta informação, eu digo o que faltou. Prefiro isso a chutar.",
  },
];

/** The specialist's whole vocabulary, set as large as the page allows. */
export function Verdict() {
  return (
    <section className={SECTION}>
      <Container>
        <h2 className="lead max-w-[33rem]">
          Em base de maquiagem, eu só tenho três respostas.
        </h2>

        <Reveal className="mt-12 lg:mt-16">
          <ul className="flex flex-col gap-12 lg:gap-14">
            {VERDICTS.map(({ answer, ink, meaning }, i) => (
              <li
                key={answer}
                className={`${GRID} reveal-item gap-4 lg:items-end`}
                style={order(i * 2)}
              >
                <p className={`display-word lg:col-span-8 ${ink}`}>{answer}</p>
                <p className="max-w-[26rem] leading-normal lg:col-span-4 lg:pb-4">{meaning}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className={`${GRID} mt-24 gap-12 lg:mt-32`}>
          <div className="lg:col-span-5">
            <h3 className="display-sm">A confiança aparece sempre</h3>
            <p className="mt-3 max-w-[30rem] leading-relaxed text-muted">
              Alta, média ou baixa, ao lado de cada veredito. E o rótulo “versão beta” fica ali
              até a gente medir o quanto eu acerto.
            </p>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <h3 className="display-sm">E quando não é base?</h3>
            <p className="mt-3 max-w-[30rem] leading-relaxed text-muted">
              Você recebe o resto: a loja, o preço, onde mais tem. E eu aviso que ainda não sou
              especialista naquilo. Cabelo e roupa vêm depois, quando a base passar na nossa
              própria régua.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
