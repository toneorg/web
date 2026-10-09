import { NAV_CLEARANCE } from "@/components/floating-nav";
import { HeroSignup } from "@/components/hero-signup";
import { LinkTicker } from "@/components/link-ticker";
import { SignupLink } from "@/components/signup-context";
import { Container, GRID, HEADER_LINK, SiteHeader } from "@/components/site-chrome";
import { ANCHOR } from "@/lib/site";
import { order } from "@/lib/stagger";

const HEADLINE = [
  ["Antes", "de", "comprar,"],
  ["me", "manda", "o", "link."],
];

/** Words enter 80ms apart; the paragraph, the field and the ticker follow the last one. */
const WORD_STEP = 0.8;
const AFTER_HEADLINE = HEADLINE.flat().length * WORD_STEP + 0.5;

/** How many words come before line `l`, so the count runs across lines. */
const wordsBefore = (l: number) => HEADLINE.slice(0, l).flat().length;

/**
 * A field of the brand color with one sentence and one action. The sentence
 * sits at the bottom so the color gets to be the first thing on screen; the
 * space above it shows the product at work.
 */
export function Hero() {
  return (
    <section id={ANCHOR.top} className="bg-coral">
      <Container className={`flex min-h-svh flex-col pt-6 sm:pt-8 ${NAV_CLEARANCE}`}>
        <SiteHeader>
          <SignupLink audience="marca" className={HEADER_LINK}>
            Para marcas
          </SignupLink>
        </SiteHeader>

        <div className="rise mt-8 flex justify-end sm:mt-12" style={order(AFTER_HEADLINE + 2)}>
          <LinkTicker />
        </div>

        <div className="mt-auto pt-10 sm:pt-16">
          <h1 className="display-xl">
            {HEADLINE.map((line, l) => (
              <span key={line[0]} className="block">
                {line.map((word, w) => (
                  <span
                    key={word}
                    className="rise inline-block"
                    style={order((wordsBefore(l) + w) * WORD_STEP)}
                  >
                    {word}&nbsp;
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <div className={`${GRID} mt-8 gap-8 lg:mt-12 lg:items-end`}>
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
