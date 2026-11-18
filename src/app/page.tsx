import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter, LandingNav } from "@/landing/chrome";
import { Comparison } from "@/landing/Comparison";
import { ConsumerDemo } from "@/landing/ConsumerDemo";
import { ExampleTabs } from "@/landing/ExampleTabs";
import { Converge } from "@/landing/Converge";
import { Faq } from "@/landing/Faq";
import { Research } from "@/landing/Research";
import { TabPile } from "@/landing/TabPile";
import {
  ArrowIcon,
  BellIcon,
  BookmarkIcon,
  CheckMark,
  CoinIcon,
  ReturnIcon,
  ShieldIcon,
  TabsIcon,
  WindowIcon,
} from "@/landing/icons";
import { Container, Eyebrow, SectionHead } from "@/landing/ui";
import { WaitlistForm } from "@/landing/WaitlistForm";

/*
  The home page speaks to the person who buys (CONTEXT.md, "Página principal").
  The copy is docs/copy/landing.md; change it there first. Neutral bench, like
  the app.
*/

export const metadata: Metadata = {
  title: { absolute: "tone: compre sem dúvida" },
  description:
    "A tone pesquisa nas lojas por você e volta com poucas opções, com o porquê de cada uma. Você decide sabendo o que escolhe e o que deixa de lado. Ela não recebe de nenhuma marca para recomendar.",
};

const PAINS = [
  {
    icon: ReturnIcon,
    title: "Errar custa caro.",
    body: "O produto que não serve volta para a caixa, a troca leva semanas e o dinheiro fica parado. Quando não volta, fica na gaveta.",
  },
  {
    icon: TabsIcon,
    title: "Acertar dá trabalho demais.",
    body: "Trinta abas, ficha técnica, vídeo de review, comentário que contradiz o outro. Ninguém tem tempo para isso a cada compra.",
  },
  {
    icon: CoinIcon,
    title: "Quem recomenda ganha com a sua compra.",
    body: "O influenciador recebe comissão, o ranking é patrocinado, a loja quer girar o estoque. Fica difícil saber em quem confiar.",
  },
];

const FAQ = [
  { q: "Quanto custa?", a: "Durante o teste fechado, nada." },
  {
    q: "Quando recebo o convite?",
    a: "Os convites saem aos poucos, por ordem da lista. Você recebe um e-mail com o link de entrada.",
  },
  {
    q: "Ela compra por mim?",
    a: "Não. Ela pesquisa e recomenda. A página do produto só abre quando você pede, e a compra é sua.",
  },
  {
    q: "Por que eu confiaria na recomendação?",
    a: "Porque ela mostra o porquê e o que você perde em cada opção, e porque ninguém paga para aparecer.",
  },
  {
    q: "O que vocês fazem com os meus dados?",
    a: (
      <>
        Usam para recomendar melhor para você, e só. Você vê o que ela lembra, apaga quando quiser e pode levar tudo com
        você. Detalhes na{" "}
        <Link href="/privacidade" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
          nota de privacidade
        </Link>
        .
      </>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <LandingNav
        links={[
          { href: "#como-funciona", label: "Como funciona" },
          { href: "#porque", label: "O porquê" },
          { href: "#comparacao", label: "Comparação" },
          { href: "/lojas", label: "Para lojas" },
        ]}
        secondary={{ href: "/conversas", label: "Entrar" }}
        cta={{ href: "#lista", label: "Entrar na lista" }}
      />

      <main id="conteudo" className="flex-1">
        {/* Abertura: a frase sozinha primeiro, depois o app sobe */}
        <section aria-labelledby="titulo" className="relative overflow-hidden">
          <div aria-hidden className="glow-warm pointer-events-none absolute inset-0" />
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[42rem] opacity-50" />
          <Container className="relative flex flex-col items-center gap-14 pt-14 pb-20 text-center sm:pt-20 lg:gap-16 lg:pt-24 lg:pb-28">
            <div id="lista" className="flex flex-col items-center gap-7">
              <Eyebrow className="rise">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                Em teste fechado. Entre na lista de espera.
              </Eyebrow>
              <h1 id="titulo" className="display-xl max-w-5xl text-ink">
                <span className="headline-in inline-block">Compre</span>{" "}
                <span className="headline-in inline-block [--i:1]">sem</span>{" "}
                <span className="headline-in inline-block [--i:2]">dúvida.</span>
              </h1>
              <p className="rise lead max-w-2xl text-graphite [--i:6]">
                Conte o que você procura. A tone pesquisa nas lojas, compara por você e volta com poucas opções, cada uma com
                o porquê. Você decide sabendo o que está escolhendo e o que está deixando de lado.
              </p>
              <div className="rise flex w-full justify-center text-start [--i:7]">
                <WaitlistForm source="home-abertura" showSignIn />
              </div>
            </div>
            <div className="app-in w-full max-w-3xl text-start">
              <ConsumerDemo />
            </div>
          </Container>
        </section>

        {/* Por que isso importa */}
        <section aria-labelledby="importa" className="border-t border-rule bg-surface py-24 sm:py-32">
          <Container className="flex flex-col gap-12 lg:gap-16">
            <SectionHead id="importa" title="Comprar ficou fácil. Escolher, não." />
            <TabPile />
            <ul className="grid gap-10 md:grid-cols-3 md:gap-8">
              {PAINS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="reveal flex flex-col gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-text">
                    <Icon />
                  </span>
                  <h3 className="display-sm text-ink">{title}</h3>
                  <p className="text-body text-graphite">{body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* A pesquisa: o bastidor da resposta, com a rolagem */}
        <Research />

        {/* O porquê */}
        <section id="porque" aria-labelledby="porque-titulo" className="bg-surface pb-24 sm:pb-32">
          <Container>
            <Converge className="mb-12 sm:mb-16" />
          </Container>
          <Container className="flex flex-col gap-12">
            <SectionHead id="porque-titulo" title="Toda recomendação vem com o porquê.">
              Não é uma lista de “os 10 melhores”. É a escolha ligada ao que você disse, e o que você perde em cada
              alternativa. Se não fizer sentido, você vê exatamente onde discordar.
            </SectionHead>
            <div className="reveal relative overflow-hidden rounded-tile bg-paper p-3 sm:p-6">
              <div aria-hidden className="glow-warm pointer-events-none absolute inset-0 opacity-70" />
              <div className="relative">
                <ExampleTabs />
              </div>
            </div>
          </Container>
        </section>

        {/* Por que não um chat de uso geral */}
        <section id="comparacao" aria-labelledby="comparacao-titulo" className="py-24 sm:py-32">
          <Container className="flex flex-col gap-12">
            <SectionHead id="comparacao-titulo" title="Por que não só perguntar ao ChatGPT?">
              Um chat de uso geral sabe um pouco de tudo e responde para qualquer pessoa. A tone foi feita para uma coisa:
              ajudar você a escolher o que comprar, nas lojas onde você compra.
            </SectionHead>
            <Comparison />
          </Container>
        </section>

        {/* O que mais ela faz */}
        <section aria-labelledby="mais" className="border-t border-rule bg-surface py-24 sm:py-32">
          <Container className="flex flex-col gap-14">
            <SectionHead id="mais" title="E depois da escolha, ela continua do seu lado." />
            <div className="grid gap-4 md:grid-cols-3">
              <Feature
                icon={<BookmarkIcon />}
                title="Lembra do que importa para você."
                body="Seu tamanho, o que você evita, as marcas que já te decepcionaram. Você vê tudo o que ela lembra e apaga quando quiser."
              >
                <div className="flex flex-wrap gap-2">
                  {["Calço 42", "Sem perfume", "Pele sensível", "Até R$ 300", "Prefere entrega rápida"].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-tag bg-surface px-2.5 py-1 text-caption font-semibold text-ink shadow-raised"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </Feature>
              <Feature
                icon={<BellIcon />}
                title="Acompanha o preço e avisa quando vale."
                body="Escolheu, mas não é a hora? Ela fica de olho e te avisa."
              >
                <PriceDrawing />
              </Feature>
              <Feature
                icon={<WindowIcon />}
                title="Funciona onde você compra."
                body="No navegador, no celular ou no computador. Você abre a loja quando quiser."
              >
                <WebDrawing />
              </Feature>
            </div>
          </Container>
        </section>

        {/* Neutralidade */}
        <section aria-labelledby="neutra" className="py-24 sm:py-32">
          <Container>
            <div className="reveal relative isolate grid gap-10 overflow-hidden rounded-tile bg-ink p-8 text-on-ink sm:p-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:p-16">
              <div aria-hidden className="glow-ink pointer-events-none absolute inset-0 -z-10" />
              <div className="flex flex-col gap-6">
                <span className="grid size-12 place-items-center rounded-full bg-accent-on-ink/15 text-accent-on-ink">
                  <ShieldIcon className="size-6" />
                </span>
                <h2 id="neutra" className="display-lg">
                  A tone não recebe para recomendar.
                </h2>
                <p className="lead max-w-xl text-on-ink/80">
                  Nenhuma marca ou loja paga para aparecer nas suas respostas. Sem anúncio, sem comissão, sem ranking
                  patrocinado. Seus dados não são vendidos.
                </p>
              </div>
              <div className="flex flex-col justify-end gap-6">
                <ul className="flex flex-col divide-y divide-on-ink/15 border-y border-on-ink/15">
                  {["Sem anúncio", "Sem comissão", "Sem ranking patrocinado", "Sem venda de dados"].map((item) => (
                    <li key={item} className="flex items-center gap-3 py-3.5 text-body">
                      <CheckMark className="size-4 shrink-0 text-accent-on-ink" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-body text-on-ink/80">
                  A tone ganha dinheiro de outro jeito: ajudando lojas a responder as dúvidas dos clientes delas, dentro do
                  próprio site, só com o catálogo delas.
                </p>
                <Link
                  href="/lojas"
                  className="group inline-flex min-h-11 items-center gap-2 self-start text-ui text-on-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-ink"
                >
                  Como a tone funciona para lojas
                  <ArrowIcon className="size-4 transition-transform duration-150 ease-soft group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Perguntas */}
        <section aria-labelledby="perguntas" className="border-t border-rule bg-surface py-24 sm:py-32">
          <Container className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <h2 id="perguntas" className="reveal display-md text-ink">
              Perguntas
            </h2>
            <div className="reveal">
              <Faq items={FAQ} />
            </div>
          </Container>
        </section>

        {/* Para lojas */}
        <section aria-labelledby="lojas" className="py-20">
          <Container>
            <Link
              href="/lojas"
              className="reveal lift group flex flex-col gap-6 rounded-card bg-surface p-8 shadow-raised transition-shadow duration-150 hover:shadow-[var(--shadow-raised),0_12px_32px_-12px_var(--color-scrim)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex-row sm:items-center sm:justify-between sm:p-10"
            >
              <div className="flex flex-col gap-3">
                <h2 id="lojas" className="display-sm text-ink">
                  Tem uma loja?
                </h2>
                <p className="max-w-xl text-body text-graphite">
                  A mesma inteligência pode responder as dúvidas dos seus clientes no seu site, e mostrar o que está
                  impedindo a compra.
                </p>
              </div>
              <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-ui text-on-ink">
                Conheça a tone para lojas
                <ArrowIcon className="size-4 transition-transform duration-150 ease-soft group-hover:translate-x-0.5" />
              </span>
            </Link>
          </Container>
        </section>

        {/* Fechamento */}
        <section
          aria-labelledby="fim"
          className="relative overflow-hidden border-t border-rule pt-24 pb-28 sm:pt-32 sm:pb-36"
        >
          <div aria-hidden className="glow-rise pointer-events-none absolute inset-0" />
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
          <Container className="relative flex flex-col items-center gap-8 text-center">
            <h2 id="fim" className="reveal display-lg max-w-4xl text-ink">
              Sua próxima compra, sem dúvida.
            </h2>
            <div className="reveal flex w-full justify-center text-start">
              <WaitlistForm source="home-fechamento" />
            </div>
          </Container>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <article className="reveal flex flex-col gap-6 rounded-card bg-surface p-3 shadow-raised">
      <div className="flex min-h-40 items-center justify-center rounded-panel bg-paper p-5">{children}</div>
      <div className="flex flex-col gap-3 px-4 pb-5">
        <span className="text-graphite">{icon}</span>
        <h3 className="text-subheading text-ink">{title}</h3>
        <p className="text-body text-graphite">{body}</p>
      </div>
    </article>
  );
}

/** A price falling under the line she was told to watch. */
function PriceDrawing() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-baseline justify-between text-caption text-graphite">
        <span>Quieto 300</span>
        <span className="rounded-tag bg-accent px-2 py-0.5 font-semibold text-on-accent tabular-nums">R$ 749</span>
      </div>
      <svg aria-hidden viewBox="0 0 240 80" className="h-20 w-full overflow-visible text-accent">
        <defs>
          <linearGradient id="price-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="52" x2="240" y2="52" className="stroke-edge" strokeDasharray="3 4" strokeWidth="1" />
        <path
          d="M0 22 L30 26 L60 18 L90 28 L120 24 L150 34 L180 30 L210 58 L240 64 L240 80 L0 80 Z"
          fill="url(#price-area)"
        />
        <path
          d="M0 22 L30 26 L60 18 L90 28 L120 24 L150 34 L180 30 L210 58 L240 64"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="240" cy="64" r="4" fill="currentColor" />
      </svg>
      <p className="text-caption text-graphite">Abaixo do preço que você queria pagar.</p>
    </div>
  );
}

/** tone open in a browser on the computer and on the phone. */
function WebDrawing() {
  return (
    <div aria-hidden className="flex w-full max-w-64 items-end gap-3">
      <div className="flex h-32 flex-1 flex-col overflow-hidden rounded-thumb bg-surface shadow-raised">
        <div className="flex items-center gap-1 border-b border-rule px-2.5 py-2">
          <span className="size-1.5 rounded-full bg-rule" />
          <span className="size-1.5 rounded-full bg-rule" />
          <span className="size-1.5 rounded-full bg-rule" />
          <span className="ms-2 h-2 flex-1 rounded-full bg-sunken" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-2.5">
          <span className="font-display text-[0.9rem] leading-none text-ink">tone</span>
          <span className="h-1.5 w-full rounded-full bg-edge" />
          <span className="h-1.5 w-4/5 rounded-full bg-edge" />
          <span className="mt-auto h-5 w-16 self-end rounded-full bg-ink" />
        </div>
      </div>
      <div className="flex h-28 w-16 flex-col gap-1.5 rounded-thumb bg-surface p-2 shadow-raised">
        <span className="mx-auto h-1 w-5 rounded-full bg-rule" />
        <span className="font-display text-[0.9rem] leading-none text-ink">tone</span>
        <span className="h-1.5 w-full rounded-full bg-edge" />
        <span className="h-1.5 w-3/4 rounded-full bg-edge" />
        <span className="mt-auto h-4 rounded-full bg-ink" />
      </div>
    </div>
  );
}
