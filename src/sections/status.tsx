import Link from "next/link";
import { buttonClass } from "@/components/button";
import { Reveal } from "@/components/reveal";
import { Container, GRID, SECTION } from "@/components/site-chrome";
import { SIGN_IN_PATH } from "@/lib/site";
import { order } from "@/lib/stagger";

// From toneorg/extension: README (test week from 25/10/2026) and docs/requisitos.md
// (hypothesis, stores). The last step has no date on purpose.
const STEPS = [
  {
    when: "Agora",
    what: "Teste fechado, só com convite. A extensão para o Chrome no computador e a tone na web.",
  },
  {
    when: "Onde eu pesquiso",
    what: "Amazon Brasil e Mercado Livre. Outras lojas entram uma de cada vez.",
  },
  {
    when: "Depois do teste",
    what: "Medimos se você compra com menos esforço e mais confiança comigo do que sem ajuda.",
  },
  { when: "Em seguida", what: "Abrimos para quem está na lista, aos poucos." },
];

/** Each step waits for the rule before it to finish drawing. */
const STEP_DELAY = 4;

/** Where tone is today, said plainly: a closed test. */
export function Status() {
  return (
    <section className={`bg-coral-50 ${SECTION}`}>
      <Container>
        <div className={`${GRID} gap-8 lg:items-end`}>
          <h2 className="display-lg lg:col-span-7">Estou em teste fechado.</h2>
          <div className="flex flex-col items-start gap-5 lg:col-span-4 lg:col-start-9 lg:pb-3">
            <p className="lead max-w-[30rem]">
              Um grupo pequeno de pessoas convidadas já usa a tone em compras de verdade. Por isso esta
              página termina num pedido de convite.
            </p>
            <Link href={SIGN_IN_PATH} className={buttonClass()}>
              Já tenho conta
            </Link>
          </div>
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

        <div className="mt-20 rounded-tile bg-white p-6 sm:p-10 lg:mt-28 lg:p-14">
          <h3 className="display-md">O que eu ainda não sei</h3>
          <p className="lead mt-5 max-w-[42rem]">
            Se eu ajudo de verdade. Até agora, poucas pessoas me usaram por poucos dias, e os
            acompanhamentos ainda não rodaram por semanas com lojas reais. O teste existe para
            medir isso, e o que a gente aprender vai aparecer aqui.
          </p>
        </div>
      </Container>
    </section>
  );
}
