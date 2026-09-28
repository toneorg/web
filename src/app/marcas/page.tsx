import type { Metadata } from "next";
import { BrandForm } from "@/components/brand-form";
import { CoverageChart } from "@/components/coverage-chart";
import {
  ButtonLink,
  Container,
  SiteFooter,
  SiteHeader,
  Source,
} from "@/components/site-chrome";
import { MONK } from "@/lib/tones";

export const metadata: Metadata = {
  title: "Para marcas",
  description:
    "Um provador de tom para lojas de maquiagem: a cliente tira uma selfie, vê qual cor da sua cartela é a dela e compra no tom certo. Aumento medido com grupo de controle.",
};

const facts = [
  {
    lead: "Cerca de 2 em cada 100 visitas",
    body: "viram compra numa loja de cosméticos no Brasil.",
    source: "Prax Analytics 2025, mediana de mais de 1.000 lojas.",
  },
  {
    lead: "39% abandonam o carrinho",
    body: "por indecisão. É o motivo número 1, à frente de prazo e frete.",
    source: "Yampi, fevereiro de 2024.",
  },
  {
    lead: "Quem erra o tom quase nunca devolve.",
    body: "Ela guarda a base na gaveta e não compra de novo.",
    source: "Beleza tem de 5% a 10% de devolução no e-commerce (Troque e Devolva).",
  },
];

const gets = [
  [
    "A cor certa no carrinho",
    "Na página de base, a cliente tira uma selfie e vê qual cor da sua cartela é a dela, com uma alternativa quando fica entre duas.",
  ],
  [
    "Aumento medido de verdade",
    "Parte das visitas não vê a tone. Você compara os dois grupos e vê o efeito real na conversão.",
  ],
  [
    "Os tons que sua cartela não cobre",
    "A distribuição de tons de quem visita sua loja, e quais peles ainda saem sem uma cor para elas.",
  ],
  [
    "Sem time de TI",
    "Em construção para Shopify, VTEX e Nuvemshop. A cartela é cadastrada a partir das fotos das suas amostras.",
  ],
  [
    "LGPD desde o desenho",
    "Consentimento explícito, selfie apagada em horas e nenhuma imagem guardada em log.",
  ],
];

const pilot = [
  ["Conversa de 30 minutos.", "Como sua cliente escolhe o tom hoje e onde ela trava."],
  ["Calibração da cartela.", "Você envia as fotos das amostras; a gente calibra cada cor."],
  ["60 dias no ar.", "Na página de base, em parte do tráfego, com grupo de controle."],
  ["Relatório.", "Conversão com e sem a tone, tons atendidos e tons que faltam."],
];

export default function Brands() {
  return (
    <>
      <SiteHeader href="/" label="Para quem compra" />

      <main id="conteudo">
        <section aria-labelledby="hero-title">
          <Container className="pb-16 pt-8 sm:pb-24 sm:pt-16">
            <p className="font-semibold">tone para marcas de maquiagem</p>
            <h1
              id="hero-title"
              className="display mt-4 max-w-[13ch] text-[clamp(2.4rem,8.5vw,6.5rem)]"
            >
              Sua cliente quer comprar. A bolinha não deixa.
            </h1>
            <p className="mt-6 max-w-[38rem] text-[1.1rem] leading-relaxed text-graphite sm:mt-8 sm:text-[1.3rem]">
              A tone é um provador de tom para a sua loja. A cliente tira uma selfie, vê
              qual cor da sua cartela é a dela e compra já no tom certo. Você mede o
              resultado com grupo de controle.
            </p>
            <div className="mt-8 sm:mt-10">
              <ButtonLink href="#piloto">Pedir um piloto</ButtonLink>
            </div>
          </Container>
          <div aria-hidden className="flex h-3 w-full">
            {MONK.map((hex) => (
              <div key={hex} className="flex-1" style={{ background: hex }} />
            ))}
          </div>
        </section>

        <section aria-labelledby="dor-title" className="pt-20 sm:pt-32">
          <Container>
            <h2 id="dor-title" className="display-sm max-w-[20ch] text-[clamp(2rem,5.5vw,3.5rem)]">
              A venda trava no momento de escolher a cor.
            </h2>
            <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {facts.map((f) => (
                <li key={f.lead} className="flex flex-col gap-2">
                  <p className="text-[1.35rem] font-semibold leading-snug">{f.lead}</p>
                  <p className="text-[1.05rem] leading-relaxed text-graphite">{f.body}</p>
                  <Source>{f.source}</Source>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        <section aria-labelledby="recebe-title" className="pt-24 sm:pt-36">
          <Container className="grid gap-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-6">
              <h2 id="recebe-title" className="display-sm text-[clamp(2rem,5.5vw,3.5rem)]">
                O que sua marca recebe
              </h2>
              <dl className="mt-10 flex flex-col gap-7">
                {gets.map(([term, body]) => (
                  <div key={term} className="flex flex-col gap-1">
                    <dt className="text-[1.15rem] font-semibold">{term}</dt>
                    <dd className="leading-relaxed text-graphite">{body}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="md:col-span-5 md:col-start-8 md:pt-4">
              <CoverageChart />
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="medida-title"
          className="mt-24 bg-ink py-20 text-paper sm:mt-36 sm:py-28"
        >
          <Container className="grid gap-8 md:grid-cols-12">
            <h2
              id="medida-title"
              className="display-sm text-[clamp(1.9rem,5vw,3.25rem)] md:col-span-6"
            >
              Número de provador virtual costuma enganar.
            </h2>
            <div className="flex flex-col gap-5 text-[1.1rem] leading-relaxed text-paper/80 md:col-span-5 md:col-start-8">
              <p>
                A maioria dos cases compara quem usou a ferramenta com quem não usou. Só que
                quem usa já estava mais perto de comprar, e o número sai inflado.
              </p>
              <p className="text-paper">
                A tone separa uma parte das visitas que não vê o provador. A diferença entre
                os dois grupos é o que a tone de fato vendeu.
              </p>
            </div>
          </Container>
        </section>

        <section aria-labelledby="piloto-title" id="piloto" className="pt-24 sm:pt-36">
          <Container className="grid gap-12 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-5">
              <div className="md:sticky md:top-10">
                <h2 id="piloto-title" className="display-sm text-[clamp(2rem,5.5vw,3.5rem)]">
                  Como funciona o piloto
                </h2>
                <p className="mt-5 max-w-[30rem] text-[1.1rem] leading-relaxed text-graphite">
                  Estamos escolhendo poucas marcas para os primeiros pilotos, começando por
                  quem vende base com cartela ampla.
                </p>
                <ol className="mt-10 flex flex-col gap-6">
                  {pilot.map(([title, body], i) => (
                    <li key={title} className="grid grid-cols-[2rem_1fr] gap-3">
                      <span className="text-[1.1rem] font-semibold tabular-nums text-graphite">
                        {i + 1}
                      </span>
                      <div className="flex flex-col gap-1">
                        <p className="text-[1.1rem] font-semibold">{title}</p>
                        <p className="leading-relaxed text-graphite">{body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="md:col-span-6 md:col-start-7">
              <BrandForm />
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
