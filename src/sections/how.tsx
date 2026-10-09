import { Container, SECTION } from "@/components/site-chrome";
import { ANCHOR } from "@/lib/site";

const STAGES = [
  {
    who: "O código pontua",
    how: "As regras de cor estão escritas, cada uma com a sua fonte e marcada como confirmada ou hipótese. Hipótese só diminui a confiança, nunca decide sozinha.",
  },
  {
    who: "O modelo escreve",
    how: "A IA lê a ficha do produto e explica o veredito em português. Toda afirmação cita uma página que foi aberta de verdade, e afirmação forte, como “oxida muito”, pede duas fontes diferentes. Preço e tons vêm direto da loja, nunca do modelo.",
  },
  {
    who: "Um humano revisa",
    how: "Uma pessoa lê as regras e os exemplos antes de qualquer especialidade sair. O que ainda não passou por uma profissional, eu aviso na tela.",
  },
];

// How a foundation she already owns becomes a prediction for another brand.
const ANCHORS = [
  { foundation: "Marca A, tom 30", fit: "um pouco clara" },
  { foundation: "Marca B, tom 240", fit: "serve" },
];

// What the app keeps about her, per the consent screen in ../docs/mobile/02.
const MEMORY = [
  {
    label: "Guardo",
    items: ["Sua faixa de tom, como um número", "As bases que você usa", "Os links que você mandou"],
  },
  { label: "Não guardo", items: ["Foto", "Nome"] },
];

/** How a verdict is made, and what it is made from. */
export function How() {
  return (
    <section id={ANCHOR.how} className={`bg-coral-50 ${SECTION}`}>
      <Container>
        <h2 className="display-lg max-w-[18ch]">
          O código pontua, o modelo escreve, um humano revisa.
        </h2>

        <dl className="mt-14 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-3 lg:gap-x-8">
          {STAGES.map(({ who, how }) => (
            <div key={who}>
              <dt className="display-sm">{who}</dt>
              <dd className="mt-3 max-w-[30rem] leading-relaxed text-muted">{how}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-20 grid grid-cols-1 gap-4 lg:mt-28 lg:grid-cols-2">
          <article className="flex flex-col gap-8 rounded-4xl bg-white p-6 sm:p-10">
            <div>
              <h3 className="display-md">Sem selfie.</h3>
              <p className="mt-4 max-w-[32rem] leading-relaxed text-muted">
                Para saber o seu tom eu pergunto duas coisas: a sua faixa numa escala de 10 e as
                bases que você já usa. Uma base que já serve em você diz mais do que uma foto. E
                foto erra em pele escura: num teste nosso, uma pele escura foi lida como muito
                clara.
              </p>
            </div>
            <figure className="mt-auto">
              <ul className="flex flex-col gap-2">
                {ANCHORS.map(({ foundation, fit }) => (
                  <li
                    key={foundation}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 rounded-2xl bg-coral-50 px-4 py-3"
                  >
                    <span className="font-medium">{foundation}</span>
                    <span className="text-muted">{fit}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 ps-4">
                Seu tom previsto na Marca C: <span className="font-medium">35</span>
              </p>
              <figcaption className="mt-2 ps-4 text-[0.875rem] text-muted">
                Exemplo ilustrativo.
              </figcaption>
            </figure>
          </article>

          <article className="flex flex-col gap-8 rounded-4xl bg-white p-6 sm:p-10">
            <div>
              <h3 className="display-md">Você apaga quando quiser.</h3>
              <p className="mt-4 max-w-[32rem] leading-relaxed text-muted">
                O que eu sei de você é o que você digitou, e nada além disso. Um toque apaga
                tudo.
              </p>
            </div>
            <dl className="mt-auto grid grid-cols-1 gap-6 sm:grid-cols-2">
              {MEMORY.map(({ label, items }) => (
                <div key={label}>
                  <dt className="ps-4 font-medium">{label}</dt>
                  <dd className="mt-3">
                    <ul className="flex flex-col gap-2">
                      {items.map((item) => (
                        <li key={item} className="rounded-2xl bg-coral-50 px-4 py-3">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </Container>
    </section>
  );
}
