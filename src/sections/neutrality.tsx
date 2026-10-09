import { Reveal } from "@/components/reveal";
import { Container, GRID, SECTION } from "@/components/site-chrome";
import { order } from "@/lib/stagger";

const NOT = [
  { what: "Provador virtual.", why: "Não gero imagem do seu rosto com a base." },
  { what: "Loja ou checkout.", why: "Você compra na loja." },
  { what: "Chat de compras genérico.", why: "Respondo sobre o produto que você mandou." },
  { what: "Suporte ao cliente.", why: "Eu ajo antes da compra." },
];

/** Who pays, and what that money can never buy. */
export function Neutrality() {
  return (
    <section className={`bg-coral ${SECTION}`}>
      <Container>
        <h2 className="display-xl">
          <span className="block">Nunca vendo posição.</span>
          <span className="block">Nunca vendo seu dado.</span>
        </h2>

        <div className={`${GRID} mt-14 gap-14 lg:mt-20`}>
          <p className="lead max-w-[33rem] lg:col-span-6">
            A tone é gratuita para quem compra. Quem paga é a marca, para ter a mesma especialista
            dentro da loja dela. Nenhuma marca paga para aparecer na frente, e o que elas recebem
            são números agregados, nunca o dado de uma pessoa.
          </p>

          <Reveal className="lg:col-span-5 lg:col-start-8">
            <h3 className="font-medium">O que a tone não é</h3>
            {/* Each name gets crossed out as the list comes into view. */}
            <ul className="mt-4 flex flex-col gap-4">
              {NOT.map(({ what, why }, i) => (
                <li key={what} className="leading-snug">
                  <span className="display-sm block">
                    <span className="strike" style={order(i)}>
                      {what}
                    </span>
                  </span>
                  {why}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
