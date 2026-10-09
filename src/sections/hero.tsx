import { HeroSignup } from "@/components/hero-signup";
import { LinkTicker } from "@/components/link-ticker";
import { SignupLink } from "@/components/signup-context";
import { Container, Wordmark, order } from "@/components/site-chrome";

/** Words enter 80ms apart; the paragraph and the field follow the last one. */
const WORD_STEP = 0.8;

let position = 0;
const HEADLINE = [
  ["Antes", "de", "comprar,"],
  ["me", "manda", "o", "link."],
].map((line) => line.map((text) => ({ text, at: position++ * WORD_STEP })));

const AFTER_HEADLINE = position * WORD_STEP + 0.5;

/**
 * A field of the brand color with one sentence and one action. The sentence
 * sits at the bottom so the color gets to be the first thing on screen; the
 * space above it shows the product at work.
 */
export function Hero() {
  return (
    <section id="topo" className="bg-coral">
      {/* The bottom padding clears the floating nav, which is always on screen. */}
      <Container className="flex min-h-svh flex-col pb-28 pt-6 sm:pb-32 sm:pt-8">
        <header className="flex items-center justify-between">
          <Wordmark />
          <SignupLink
            audience="marca"
            className="-me-3 flex min-h-11 items-center rounded-full px-3 text-[0.9375rem] font-medium underline decoration-wine/40 underline-offset-[6px] transition-colors duration-150 hover:decoration-wine"
          >
            Para marcas
          </SignupLink>
        </header>

        <div className="rise mt-8 flex justify-end sm:mt-12" style={order(AFTER_HEADLINE + 2)}>
          <LinkTicker />
        </div>

        <div className="mt-auto pt-10 sm:pt-16">
          <h1 className="display-xl">
            {HEADLINE.map((line) => (
              <span key={line[0].at} className="block">
                {line.map(({ text, at }) => (
                  <span key={at} className="rise inline-block" style={order(at)}>
                    {text}&nbsp;
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <div className="mt-8 grid grid-cols-1 gap-8 lg:mt-12 lg:grid-cols-12 lg:items-end lg:gap-x-8">
            <p className="rise lead max-w-[31rem] lg:col-span-6" style={order(AFTER_HEADLINE)}>
              Eu digo se a loja é confiável, quanto custa em outras lojas e, se for base de
              maquiagem, se serve na sua pele.
            </p>
            <div className="rise lg:col-span-5 lg:col-start-8" style={order(AFTER_HEADLINE + 1)}>
              <HeroSignup />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
