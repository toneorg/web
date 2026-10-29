import { Reveal } from "@/components/reveal";
import { Container, GRID, SECTION } from "@/components/site-chrome";
import { order } from "@/lib/stagger";

// Guards in toneorg/extension (RF2.4, RNF11, RF4.3); no store pays tone for anything.
const NOT = [
  { what: "Pagar ou finalizar a compra.", why: "Eu paro no carrinho. Sempre." },
  {
    what: "Mexer na loja sem perguntar.",
    why: "Pôr no carrinho ou mudar uma quantidade só depois do seu sim.",
  },
  { what: "Vender lugar na lista.", why: "Nenhuma loja ou marca paga para aparecer na frente." },
  { what: "Ler seu e-mail por conta própria.", why: "Gmail e agenda, só se você conectar." },
];

/** The one thing tone never does, and the other things it will not do either. */
export function Neutrality() {
  return (
    <section className={`bg-coral ${SECTION}`}>
      <Container>
        <h2 className="display-xl">
          <span className="block">Eu nunca pago.</span>
          <span className="block">Quem compra é você.</span>
        </h2>

        <div className={`${GRID} mt-14 gap-14 lg:mt-20`}>
          <p className="lead max-w-[33rem] lg:col-span-6">
            Eu trabalho na sua aba, na sua sessão da loja, e você vê cada passo. Quando aparece um
            login ou uma verificação de segurança, eu aviso e devolvo o controle. E não existe
            botão de pagar no meu lado: não fui feita para isso.
          </p>

          <Reveal className="lg:col-span-5 lg:col-start-8">
            <h3 className="font-medium">O que eu não faço</h3>
            {/* Each line gets crossed out as the list comes into view. */}
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
