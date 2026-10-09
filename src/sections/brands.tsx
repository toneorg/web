import { buttonClass } from "@/components/button";
import { SignupLink } from "@/components/signup-context";
import { Container, SECTION } from "@/components/site-chrome";

const PROMISES = [
  {
    what: "Diz o tom da sua cliente",
    how: "Dentro da cartela daquela base, com a confiança declarada e o porquê.",
  },
  {
    what: "Diz quando nenhum tom serve",
    how: "E você fica sabendo quantas vezes isso aconteceu e em que faixa de pele. É o tamanho do buraco na cartela.",
  },
  {
    what: "Mede contra um grupo de controle",
    how: "Metade das visitantes vê a especialista, metade não. O relatório mostra a diferença, inclusive quando ela não aparece.",
  },
];

/** The same specialist, on the brand's own product page. */
export function Brands() {
  return (
    <section className={`bg-wine-950 text-coral-50 ${SECTION}`}>
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-8">
          <h2 className="display-lg lg:col-span-7">Tem uma marca de maquiagem?</h2>
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-3">
            <p className="lead max-w-[30rem] text-coral-200">
              A mesma especialista responde na página da sua base. O provador mostra a cor. A
              tone diz se é a dela.
            </p>
          </div>
        </div>

        <dl className="mt-14 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-3 lg:gap-x-8">
          {PROMISES.map(({ what, how }) => (
            <div key={what}>
              <dt className="display-sm">{what}</dt>
              <dd className="mt-3 max-w-[30rem] leading-relaxed text-coral-200">{how}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 lg:mt-20">
          <SignupLink audience="marca" className={buttonClass({ variant: "coral", size: "lg" })}>
            Pedir uma conversa de 30 minutos
          </SignupLink>
          <p className="text-[0.9375rem] text-coral-200">
            Nunca posição paga. Nunca dado individual.
          </p>
        </div>
      </Container>
    </section>
  );
}
