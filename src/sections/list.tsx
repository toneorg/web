import { SignupSection } from "@/components/signup-section";
import { Container, SECTION } from "@/components/site-chrome";
import { ANCHOR } from "@/lib/site";

/** Where the page ends: the list for people, or the pilot request for brands. */
export function List() {
  return (
    <section id={ANCHOR.list} className={`bg-coral ${SECTION}`}>
      <Container>
        <SignupSection />
      </Container>
    </section>
  );
}
