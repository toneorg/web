import Link from "next/link";
import { HeroBands } from "@/components/hero-bands";
import { ResultCard, ShadeGrid } from "@/components/illustrations";
import {
  ButtonLink,
  Container,
  SiteFooter,
  SiteHeader,
  Source,
} from "@/components/site-chrome";
import { WaitlistForm } from "@/components/waitlist-form";
import { MONK } from "@/lib/tones";

const today = [
  "Você abre a página da base e encontra quarenta bolinhas quase iguais.",
  "Procura uma influenciadora com a pele parecida com a sua.",
  "Lê avaliações, pergunta no direct, deixa o carrinho aberto por dias.",
  "Compra torcendo para dar certo. Ou desiste e espera uma loja física que a marca nem tem.",
];

const how = [
  ["Tire uma selfie com luz de janela.", "A tone avisa se a luz ou o enquadramento atrapalham a leitura."],
  ["A tone lê seu tom e seu subtom.", "Em linguagem de gente: “tom médio, subtom dourado”, não um código."],
  ["Você vê qual cor daquela marca é a sua.", "Uma principal e uma alternativa, com o nível de certeza. Se você estiver entre duas, a tone diz."],
  ["E vê a base no seu rosto antes de comprar.", "A cor vai para o carrinho já certa."],
];

const privacy = [
  ["Sua selfie é apagada em poucas horas.", "Guardamos só o tom, nunca a foto."],
  ["Nada é vendido.", "Nem seus dados, nem sua imagem."],
  ["Você decide.", "Apaga o passaporte quando quiser."],
];

export default function Home() {
  return (
    <>
      <SiteHeader href="/marcas" label="Para marcas" />

      <main id="conteudo">
        {/* Hero */}
        <section aria-labelledby="hero-title">
          <Container className="pb-10 pt-8 sm:pb-16 sm:pt-16">
            <h1
              id="hero-title"
              className="display max-w-[11ch] text-[clamp(2.6rem,10.5vw,8rem)]"
            >
              Sua pele não é uma bolinha de cor.
            </h1>
            <p className="mt-6 max-w-[36rem] text-[1.1rem] leading-relaxed text-graphite sm:mt-8 sm:text-[1.3rem]">
              Hoje a base é escolhida por um círculo de poucos pixels. A tone lê seu tom
              numa selfie e mostra qual cor de cada marca é a sua, com cor calibrada para
              a pele brasileira.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-6">
              <ButtonLink href="#lista">Entrar na lista de espera</ButtonLink>
              <Link
                href="/marcas"
                className="self-start rounded-full py-2 font-medium underline decoration-rule decoration-2 underline-offset-[6px] transition-colors duration-150 hover:decoration-ink sm:self-auto"
              >
                Tenho uma marca de maquiagem
              </Link>
            </div>
          </Container>
          <HeroBands />
          <Container>
            <p className="mt-4 max-w-[40rem] text-[0.95rem] text-graphite">
              Os dez tons da escala Monk, do mais claro ao mais escuro. A tone precisa
              acertar igual em todos antes de chegar a você.
            </p>
          </Container>
        </section>

        {/* How people buy foundation today */}
        <section aria-labelledby="hoje-title" className="pt-24 sm:pt-36">
          <Container className="grid gap-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-6">
              <h2 id="hoje-title" className="display-sm text-[clamp(2rem,5.5vw,3.5rem)]">
                Como se compra base pela internet hoje
              </h2>
              <ol className="mt-10 flex flex-col gap-6">
                {today.map((step, i) => (
                  <li key={step} className="grid grid-cols-[2rem_1fr] gap-3 text-[1.1rem] leading-relaxed">
                    <span className="font-semibold tabular-nums text-graphite">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-10 max-w-[32rem] text-[1.25rem] font-semibold leading-snug">
                E a base errada quase nunca volta para a loja. Fica na gaveta.
              </p>
              <p className="mt-3 max-w-[32rem] text-graphite">
                <Source>
                  Beleza tem de 5% a 10% de devolução no e-commerce brasileiro, contra 30%
                  a 50% em moda (Troque e Devolva).
                </Source>
              </p>
            </div>
            <div className="md:col-span-5 md:col-start-8 md:pt-4">
              <ShadeGrid />
            </div>
          </Container>
        </section>

        {/* What tone does */}
        <section aria-labelledby="tone-title" className="pt-24 sm:pt-36">
          <Container className="grid gap-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-6">
              <h2 id="tone-title" className="display-sm text-[clamp(2rem,5.5vw,3.5rem)]">
                Uma selfie. A cor certa daquela marca.
              </h2>
              <ol className="mt-10 flex flex-col gap-7">
                {how.map(([title, body], i) => (
                  <li key={title} className="grid grid-cols-[2rem_1fr] gap-3">
                    <span className="text-[1.1rem] font-semibold tabular-nums text-graphite">
                      {i + 1}
                    </span>
                    <div className="flex flex-col gap-1">
                      <p className="text-[1.1rem] font-semibold leading-snug">{title}</p>
                      <p className="leading-relaxed text-graphite">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="md:col-span-5 md:col-start-8 md:pt-4">
              <ResultCard />
            </div>
          </Container>
        </section>

        {/* Brazilian skin */}
        <section
          aria-labelledby="brasil-title"
          className="mt-24 bg-ink py-20 text-paper sm:mt-36 sm:py-32"
        >
          <Container>
            <h2
              id="brasil-title"
              className="display-sm max-w-[18ch] text-[clamp(2rem,6vw,4.25rem)]"
            >
              56% dos brasileiros se declaram pretos ou pardos.
            </h2>
            <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-8">
              <div className="flex flex-col gap-5 text-[1.1rem] leading-relaxed text-paper/80 md:col-span-6">
                <p>
                  Mesmo assim, as ferramentas de cor mais usadas foram treinadas, em sua
                  maioria, com peles claras. E erram mais justamente nos tons médios e
                  escuros.
                </p>
                <p>
                  Base é o produto mais difícil de acertar para mulheres negras no Brasil,
                  à frente de sombra e corretivo.
                </p>
                <p className="flex flex-col gap-1">
                  <Source>IBGE, PNAD 2023.</Source>
                  <Source>
                    Pesquisa Pele Negra, Avon com Grimpa e Google, 1.000 mulheres: 26%
                    apontam a base como o item mais difícil.
                  </Source>
                </p>
              </div>
              <div className="md:col-span-5 md:col-start-8">
                <p className="text-[1.5rem] font-semibold leading-snug sm:text-[1.75rem]">
                  Nossa régua: a tone precisa acertar igual do tom 1 ao tom 10. Se errar
                  mais nas peles escuras, não lança.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Tone passport + privacy */}
        <section aria-labelledby="passaporte-title" className="pt-24 sm:pt-36">
          <Container className="grid gap-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-6">
              <h2
                id="passaporte-title"
                className="display-sm text-[clamp(2rem,5.5vw,3.5rem)]"
              >
                Seu tom, em qualquer marca.
              </h2>
              <p className="mt-6 max-w-[34rem] text-[1.1rem] leading-relaxed text-graphite">
                Descubra seu tom uma vez e leve para qualquer loja que usa a tone: o seu
                passaporte de tom. Sem refazer teste, sem adivinhar, sem comprar duas cores
                para ver qual serve.
              </p>
              <p className="mt-6 text-[1.25rem] font-semibold">Comprar melhor, não mais.</p>
            </div>
            <dl className="flex flex-col gap-6 md:col-span-5 md:col-start-8 md:pt-3">
              {privacy.map(([term, body]) => (
                <div key={term} className="flex flex-col gap-1">
                  <dt className="text-[1.1rem] font-semibold">{term}</dt>
                  <dd className="text-graphite">{body}</dd>
                </div>
              ))}
            </dl>
          </Container>
        </section>

        {/* Waitlist */}
        <section id="lista" aria-labelledby="lista-title" className="pt-24 sm:pt-36">
          <Container className="grid gap-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-4">
              <div className="md:sticky md:top-10">
                <h2 id="lista-title" className="display-sm text-[clamp(2rem,5.5vw,3.5rem)]">
                  Entre na lista
                </h2>
                <p className="mt-5 max-w-[30rem] text-[1.1rem] leading-relaxed text-graphite">
                  Leva menos de um minuto. Suas respostas ajudam a gente a calibrar a tone
                  para peles como a sua.
                </p>
              </div>
            </div>
            <div className="md:col-span-7 md:col-start-6">
              <WaitlistForm />
            </div>
          </Container>
        </section>

        {/* Brands */}
        <section
          aria-labelledby="marcas-title"
          className="mt-24 py-16 sm:mt-36 sm:py-24"
          style={{ background: MONK[4] }}
        >
          <Container className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-12">
            <div>
              <p className="font-semibold">Tem uma marca de maquiagem?</p>
              <h2
                id="marcas-title"
                className="display-sm mt-3 max-w-[16ch] text-[clamp(2rem,5.5vw,3.5rem)]"
              >
                Sua cliente quer comprar. A bolinha não deixa.
              </h2>
            </div>
            <div className="shrink-0">
              <ButtonLink href="/marcas">Ver a tone para marcas</ButtonLink>
            </div>
          </Container>
        </section>

        {/* Founders' note */}
        <section aria-labelledby="carta-title" className="pt-24 sm:pt-36">
          <Container>
            <div className="max-w-[40rem]">
              <h2 id="carta-title" className="text-[1.1rem] font-semibold">
                Por que estamos fazendo isso
              </h2>
              <div className="mt-6 flex flex-col gap-5 text-[1.3rem] leading-[1.6] sm:text-[1.45rem]">
                <p>
                  O Brasil é um dos maiores mercados de beleza do mundo e ainda compra
                  maquiagem no escuro. Cada erro vira dinheiro perdido, produto parado na
                  gaveta e a sensação de que aquela marca não foi feita para você.
                </p>
                <p>
                  A gente acredita que comprar beleza deveria começar por quem você é: seu
                  tom, o que funciona na sua pele, o que você já usa. Não pelo que alguém
                  quer vender.
                </p>
                <p>
                  Começamos pela base, porque é onde o erro dói mais. O resto vem depois.
                </p>
              </div>
              <p className="mt-8 text-graphite">Vivian e Gabriel, fundadores da tone</p>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
