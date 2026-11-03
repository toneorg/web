import { LandingEntry } from "@/components/landing-entry";
import { SiteFooter } from "@/components/site-chrome";
import { ToneWordmark } from "@/components/tone-logo";

/*
  The home page while the product is in a closed test: what tone is, in one
  paragraph, and the way in. Black and white, like the extension and the app.
*/
export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <main id="conteudo" className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-10 px-5 py-16">
        <header className="flex flex-col gap-6">
          <h1 className="rise">
            <ToneWordmark className="h-12 w-auto sm:h-14" />
          </h1>
          <p className="rise text-body text-graphite [--i:1]">
            A tone é uma assistente de compras. Você conta o que procura, ela lembra do que você gosta, pesquisa nas
            lojas por você e volta com poucas opções boas, com o porquê de cada uma. Também acompanha preços e avisa
            quando vale a pena. Ela nunca paga nada. Está em teste fechado, só com convite.
          </p>
        </header>
        <div className="rise rounded-card bg-surface p-5 shadow-raised [--i:2]">
          <LandingEntry />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
