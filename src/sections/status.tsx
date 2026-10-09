import { Reveal } from "@/components/reveal";
import { Container, SECTION, order } from "@/components/site-chrome";

// Beta size, the 7-to-10 share, the 20-confirmation floor and the batches of
// 100 come from ../docs/mobile/01, 06 and 07 (the planning folder).
const STEPS = [
  { when: "Agora", what: "Construindo o app e a especialista em base." },
  {
    when: "Fim de 2026",
    what: "Beta fechado com 30 a 50 pessoas. Metade das vagas é para as faixas de tom 7 a 10.",
  },
  {
    when: "Depois do beta",
    what: "Medimos se o tom que eu previ bate com o que você confirmou. O acerto só é publicado com pelo menos 20 confirmações.",
  },
  { when: "Em seguida", what: "Abrimos a lista de espera, em grupos de 100." },
];

/** Each step waits for the rule before it to finish drawing. */
const STEP_DELAY = 4;

/** Where tone is today, said plainly: not live yet. */
export function Status() {
  return (
    <section className={SECTION}>
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-x-8">
          <h2 className="display-lg lg:col-span-7">Ainda não estou no ar.</h2>
          <p className="lead max-w-[30rem] lg:col-span-4 lg:col-start-9 lg:pb-3">
            Por isso esta página termina numa lista de espera, e não num botão de baixar.
          </p>
        </div>

        {/* The rule is the timeline itself: it runs down on phones and across on wide screens. */}
        <Reveal className="mt-16 lg:mt-24">
          <ol className="lg:grid lg:grid-cols-4">
            {STEPS.map(({ when, what }, i) => (
              <li
                key={when}
                className="relative pb-10 ps-7 last:pb-0 lg:pb-0 lg:pe-8 lg:ps-0 lg:pt-7"
              >
                <span
                  aria-hidden
                  className="uncover absolute start-0 top-0 h-full w-px bg-coral-300 lg:h-px lg:w-full"
                  style={order(i * STEP_DELAY)}
                />
                <span
                  aria-hidden
                  className="pop absolute -start-[4.5px] top-2 size-2.5 lg:-top-[4.5px] lg:start-0"
                  style={order(i * STEP_DELAY)}
                >
                  {i === 0 ? <span className="halo absolute inset-0 rounded-full bg-coral" /> : null}
                  <span
                    className={`absolute inset-0 rounded-full ${
                      i === 0 ? "bg-coral" : "bg-white shadow-[inset_0_0_0_1.5px_var(--color-coral)]"
                    }`}
                  />
                </span>
                <div className="reveal-item" style={order(i * STEP_DELAY + 1)}>
                  <p className="display-sm">{when}</p>
                  <p className="mt-2 max-w-[26rem] leading-relaxed text-muted">{what}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="mt-20 rounded-4xl bg-coral-100 p-6 sm:p-10 lg:mt-28 lg:p-14">
          <h3 className="display-md">O que eu ainda não sei</h3>
          <p className="lead mt-5 max-w-[42rem]">
            Quanto eu acerto. Ninguém conferiu um veredito meu ainda, e as regras ainda não foram
            revisadas por uma maquiadora profissional. O beta existe para medir isso, e o número
            que sair é o que vai aparecer aqui.
          </p>
        </div>
      </Container>
    </section>
  );
}
