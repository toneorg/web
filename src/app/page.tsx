import { FloatingNav, NAV_CLEARANCE } from "@/components/floating-nav";
import { SignupProvider } from "@/components/signup-context";
import { SiteFooter } from "@/components/site-chrome";
import { Brands } from "@/sections/brands";
import { Hero } from "@/sections/hero";
import { How } from "@/sections/how";
import { List } from "@/sections/list";
import { Neutrality } from "@/sections/neutrality";
import { Status } from "@/sections/status";
import { Verdict } from "@/sections/verdict";
import { What } from "@/sections/what";
import { Why } from "@/sections/why";

/*
  The page argues in the order a skeptical reader asks: what is this (Hero),
  why does it exist (Why), what does it do (What, Verdict), how can I trust
  it (How, Neutrality), does it exist yet (Status), and then the list.
  Coral grounds are where tone speaks in the first person.
*/
export default function Home() {
  return (
    <SignupProvider>
      <main id="conteudo">
        <Hero />
        <Why />
        <What />
        <Verdict />
        <How />
        <Neutrality />
        <Status />
        <Brands />
        <List />
      </main>
      <SiteFooter className={NAV_CLEARANCE} />
      <FloatingNav />
    </SignupProvider>
  );
}
