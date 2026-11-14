import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter, LandingNav } from "@/landing/chrome";
import { ConsumerDemo } from "@/landing/ConsumerDemo";
import { ExampleTabs } from "@/landing/ExampleTabs";
import { Faq } from "@/landing/Faq";
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
  the app and the extension.
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

const STEPS = [
  {
    title: "Conte do seu jeito.",
    body: "O que você precisa, para quê e quanto quer gastar. Pode colar o link de um produto que já está olhando.",
  },
  {
    title: "Ela faz a pesquisa.",
    body: "Lê fichas técnicas, avaliações e vídeos em várias lojas e descarta o que não serve para você.",
  },
  {
    title: "Você decide com o porquê.",
    body: "Poucas opções, com o motivo de cada uma e o que você abre mão em cada escolha.",
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
          { href: "/lojas", label: "Para lojas" },
        ]}
        secondary={{ href: "/conversas", label: "Entrar" }}
        cta={{ href: "#lista", label: "Entrar na lista" }}
      />

      <main id="conteudo" className="flex-1">
        {/* Abertura */}
        <section aria-labelledby="titulo" className="relative overflow-hidden">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[42rem] opacity-70" />
          <Container className="relative grid gap-14 pt-14 pb-20 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-10 lg:pt-24 lg:pb-28">
            <div id="lista" className="flex flex-col items-start gap-7">
              <Eyebrow className="rise">
                <span className="size-1.5 rounded-full bg-ink" aria-hidden />
                Em teste fechado. Entre na lista de espera.
              </Eyebrow>
              <h1 id="titulo" className="rise display-lg text-ink [--i:1]">
                Compre sem dúvida.
              </h1>
              <p className="rise lead max-w-lg text-graphite [--i:2]">
                Conte o que você procura. A tone pesquisa nas lojas, compara por você e volta com poucas opções, cada uma
                com o porquê. Você decide sabendo o que está escolhendo e o que está deixando de lado.
              </p>
              <div className="rise w-full [--i:3]">
                <WaitlistForm source="home-abertura" showSignIn />
              </div>
            </div>
            <div className="rise [--i:3]">
              <ConsumerDemo />
            </div>
          </Container>
        </section>

        {/* Por que isso importa */}
        <section aria-labelledby="importa" className="border-t border-rule bg-surface py-24 sm:py-32">
          <Container className="flex flex-col gap-14">
            <SectionHead id="importa" title="Comprar ficou fácil. Escolher, não." />
            <ul className="grid gap-4 md:grid-cols-3">
              {PAINS.map(({ icon: Icon, title, body }, index) => (
                <li
                  key={title}
                  className="reveal flex flex-col gap-10 rounded-card bg-paper p-7"
                  style={{ ["--i" as string]: index }}
                >
                  <span className="grid size-12 place-items-center rounded-full bg-surface text-ink shadow-raised">
                    <Icon />
                  </span>
                  <div className="flex flex-col gap-3">
                    <h3 className="display-sm text-ink">{title}</h3>
                    <p className="text-body text-graphite">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" aria-labelledby="como" className="py-24 sm:py-32">
          <Container className="flex flex-col gap-14">
            <SectionHead id="como" eyebrow="Como funciona" title="Você conta. Ela pesquisa. Você decide." />
            <ol className="relative grid gap-4 md:grid-cols-3">
              <span aria-hidden className="absolute top-[2.25rem] right-[16%] left-[16%] hidden h-px bg-edge md:block" />
              {STEPS.map((step, index) => (
                <li key={step.title} className="reveal relative flex flex-col gap-5 rounded-card bg-surface p-7 shadow-raised">
                  <span className="grid size-10 place-items-center rounded-full bg-ink text-ui text-on-ink tabular-nums">
                    {index + 1}
                  </span>
                  <h3 className="display-sm text-ink">{step.title}</h3>
                  <p className="text-body text-graphite">{step.body}</p>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* O porquê */}
        <section id="porque" aria-labelledby="porque-titulo" className="border-t border-rule bg-surface py-24 sm:py-32">
          <Container className="flex flex-col gap-12">
            <SectionHead id="porque-titulo" eyebrow="O porquê" title="Toda recomendação vem com o porquê.">
              Não é uma lista de “os 10 melhores”. É a escolha ligada ao que você disse, e o que você perde em cada
              alternativa. Se não fizer sentido, você vê exatamente onde discordar.
            </SectionHead>
            <div className="reveal rounded-tile bg-paper p-3 sm:p-6">
              <ExampleTabs />
            </div>
          </Container>
        </section>

        {/* O que mais ela faz */}
        <section aria-labelledby="mais" className="py-24 sm:py-32">
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
                    <span key={chip} className="rounded-tag bg-surface px-2.5 py-1 text-caption font-semibold text-ink shadow-raised">
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
                body="No navegador e na extensão do Chrome, ao lado da loja que você está olhando."
              >
                <ExtensionDrawing />
              </Feature>
            </div>
          </Container>
        </section>

        {/* Neutralidade */}
        <section aria-labelledby="neutra" className="pb-24 sm:pb-32">
          <Container>
            <div className="reveal grid gap-10 rounded-tile bg-ink p-8 text-on-ink sm:p-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16 lg:p-16">
              <div className="flex flex-col gap-6">
                <span className="grid size-12 place-items-center rounded-full bg-on-ink/10">
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
                      <CheckMark className="size-4 shrink-0" />
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
              className="reveal group flex flex-col gap-6 rounded-card bg-surface p-8 shadow-raised transition-shadow duration-150 hover:shadow-[var(--shadow-raised),0_12px_32px_-12px_var(--color-scrim)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex-row sm:items-center sm:justify-between sm:p-10"
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
        <section aria-labelledby="fim" className="relative overflow-hidden border-t border-rule pt-24 pb-28 sm:pt-32 sm:pb-36">
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
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
        <span className="rounded-tag bg-ink px-2 py-0.5 font-semibold text-on-ink tabular-nums">R$ 749</span>
      </div>
      <svg aria-hidden viewBox="0 0 240 80" className="h-20 w-full overflow-visible text-ink">
        <line x1="0" y1="52" x2="240" y2="52" className="stroke-edge" strokeDasharray="3 4" strokeWidth="1" />
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

/** A store page with tone open at its side. */
function ExtensionDrawing() {
  return (
    <div aria-hidden className="flex h-32 w-full max-w-64 overflow-hidden rounded-thumb bg-surface shadow-raised">
      <div className="flex flex-1 flex-col gap-2 p-3">
        <span className="h-12 rounded-md bg-sunken" />
        <span className="h-2 w-3/4 rounded-full bg-rule" />
        <span className="h-2 w-1/2 rounded-full bg-rule" />
      </div>
      <div className="flex w-24 flex-col gap-1.5 border-s border-rule bg-paper p-2.5">
        <span className="font-display text-[0.9rem] leading-none text-ink">tone</span>
        <span className="h-1.5 w-full rounded-full bg-edge" />
        <span className="h-1.5 w-4/5 rounded-full bg-edge" />
        <span className="mt-auto h-5 rounded-full bg-ink" />
      </div>
    </div>
  );
}
