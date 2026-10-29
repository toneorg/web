import { Container, SECTION } from "@/components/site-chrome";
import { ANCHOR } from "@/lib/site";

// Invented memories, each with where it came from, as the "Você" tab lists them (RF3.3, RF3.4).
const MEMORIES = [
  { fact: "Calça 42 em tênis", source: "Da conversa, 12 de outubro" },
  { fact: "Prefere pulseira de metal", source: "De uma pergunta rápida" },
  { fact: "Comprou uma cafeteira em agosto", source: "De um e-mail de pedido" },
];

// The optional connections and what each one brings (RF4.1 to RF4.3).
const CONNECTIONS = [
  { name: "Gmail", what: "Só os e-mails de confirmação de pedido, para eu saber o que você já comprou." },
  { name: "Agenda", what: "Os eventos que pedem uma compra, como um aniversário ou uma viagem." },
];

/** What tone knows about her, and how she stays in charge of it. */
export function How() {
  return (
    <section id={ANCHOR.how} className={SECTION}>
      <Container>
        <h2 className="display-lg max-w-[16ch]">Você vê tudo o que eu sei de você.</h2>
        <p className="lead mt-6 max-w-[33rem]">
          Quanto mais eu te conheço, menos você explica. Mas a memória é sua: está sempre à vista,
          e você corrige ou apaga quando quiser.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-4 lg:mt-20 lg:grid-cols-2">
          <article className="flex flex-col gap-8 rounded-tile bg-coral-50 p-6 sm:p-10">
            <div>
              <h3 className="display-md">Cada lembrança diz de onde veio.</h3>
              <p className="mt-4 max-w-[32rem] leading-relaxed text-muted">
                O que eu guardo vem do que você me disse, das suas respostas e do que você deixou
                eu ler. Cada item mostra a origem e a data.
              </p>
            </div>
            <figure className="mt-auto">
              <ul className="flex flex-col gap-2">
                {MEMORIES.map(({ fact, source }) => (
                  <li key={fact} className="rounded-panel bg-white px-4 py-3">
                    <p className="font-medium leading-snug">{fact}</p>
                    <p className="mt-0.5 text-small text-muted">{source}</p>
                  </li>
                ))}
              </ul>
              <figcaption className="mt-3 ps-4 text-small text-muted">
                Exemplo ilustrativo.
              </figcaption>
            </figure>
          </article>

          <article className="flex flex-col gap-8 rounded-tile bg-coral-50 p-6 sm:p-10">
            <div>
              <h3 className="display-md">Conectar é opcional.</h3>
              <p className="mt-4 max-w-[32rem] leading-relaxed text-muted">
                Desligou uma conexão, eu apago o que veio dela. E a qualquer momento você baixa
                os seus dados ou apaga a conta inteira.
              </p>
            </div>
            <dl className="mt-auto flex flex-col gap-2">
              {CONNECTIONS.map(({ name, what }) => (
                <div key={name} className="rounded-panel bg-white px-4 py-3">
                  <dt className="font-medium">{name}</dt>
                  <dd className="mt-0.5 text-small text-muted">{what}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
      </Container>
    </section>
  );
}
