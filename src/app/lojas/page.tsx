import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter, LandingNav } from "@/landing/chrome";
import { Faq } from "@/landing/Faq";
import { ArrowIcon, ChartIcon, CheckMark, PlugIcon, ShieldIcon, SparkIcon } from "@/landing/icons";
import { PilotForm } from "@/landing/PilotForm";
import { StoreDemo } from "@/landing/StoreDemo";
import { ButtonLink, Container, Eyebrow, SectionHead } from "@/landing/ui";

/*
  The page that sells tone to stores (CONTEXT.md, "Página para lojas"). The copy
  is docs/copy/landing.md; change it there first. Platforms are named only once
  the integration exists, and no logo appears before a real customer.
*/

export const metadata: Metadata = {
  title: { absolute: "tone para lojas: resolva a dúvida que impede a compra" },
  description:
    "A tone conversa com quem está em dúvida no seu site, recomenda do seu catálogo com o porquê e mostra quais perguntas e informações em falta estão custando vendas. Piloto gratuito, medido com grupo de controle.",
};

const STATS = [
  { value: "70%", label: "dos carrinhos são abandonados antes da compra." },
  { value: "56%", label: "dos sites avaliados têm uma busca que não atende ao que as pessoas procuram." },
  { value: "78%", label: "das listas de produto no celular são medíocres ou ruins." },
];

const STEPS = [
  {
    icon: PlugIcon,
    title: "Conectamos ao seu catálogo.",
    body: "Produtos, variações, estoque e políticas de troca e entrega. Sem time técnico do seu lado.",
  },
  {
    icon: SparkIcon,
    title: "Ela responde quem está em dúvida.",
    body: "Um botão discreto, “Me ajuda a escolher”. Poucas perguntas e uma recomendação do seu catálogo, com o porquê. Sem cadastro e sem sair da página.",
  },
  {
    icon: ChartIcon,
    title: "Você vê o que impede a compra.",
    body: "Toda semana, o relatório de dúvidas: o que perguntaram, o que faltou responder e onde a dúvida virou desistência.",
  },
];

const QUESTIONS = [
  { q: "Fico entre M e G, qual escolho?", n: 54, gap: "9 produtos sem tabela de medidas" },
  { q: "Tem fragrância?", n: 37, gap: "A informação falta em 62% dos produtos de skincare" },
  { q: "Chega até sexta?", n: 29, gap: "O prazo não aparece na página do produto" },
  { q: "Funciona com iPhone?", n: 18, gap: "Compatibilidade fora da ficha em 6 produtos" },
];

const SEGMENTS = [
  { name: "Eletrônicos e acessórios", asked: "Funciona com o que eu já tenho?" },
  { name: "Casa e móveis", asked: "Cabe no meu espaço?" },
  { name: "Moda", asked: "Como vai vestir em mim?" },
  { name: "Skincare e beleza", asked: "Serve para pele sensível?" },
];

const FIT = [
  "Loja própria, não só marketplace",
  "De 50 a 5.000 produtos",
  "Mais de 50 mil visitas por mês",
  "Tráfego pago que custa caro",
  "Um time de e-commerce pequeno",
];

const FAQ = [
  {
    q: "Preciso de time técnico?",
    a: "Não. A gente conecta o catálogo e revisa as respostas com você antes de entrar no ar.",
  },
  {
    q: "Quanto custa depois do piloto?",
    a: "Uma assinatura mensal pela faixa de visitas da loja. Sem porcentagem sobre as vendas.",
  },
  { q: "Ela recomenda produtos de outras lojas?", a: "Não. Dentro do seu site, só o seu catálogo." },
  {
    q: "Vai atrapalhar a navegação no celular?",
    a: "O botão é discreto e a conversa só abre quando a pessoa pede.",
  },
  {
    q: "E se ela não souber responder?",
    a: "Ela diz que não sabe e mostra o que a ficha informa. Essa pergunta entra no relatório, para você completar a ficha.",
  },
  {
    q: "Em quais plataformas funciona?",
    a: "Estamos conectando as lojas do piloto uma a uma. Conte a sua no formulário.",
  },
];

export default function Stores() {
  const max = Math.max(...QUESTIONS.map((item) => item.n));
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <LandingNav
        suffix="para lojas"
        links={[
          { href: "#como-funciona", label: "Como funciona" },
          { href: "#relatorio", label: "Relatório" },
          { href: "#piloto", label: "Piloto" },
          { href: "/", label: "Para você" },
        ]}
        cta={{ href: "#piloto-form", label: "Quero um piloto" }}
      />

      <main id="conteudo" className="flex-1">
        {/* Abertura */}
        <section aria-labelledby="titulo" className="relative overflow-hidden">
          <div aria-hidden className="glow-warm pointer-events-none absolute inset-0" />
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-x-0 top-0 h-[44rem] opacity-50" />
          <Container className="relative flex flex-col items-center gap-14 pt-14 pb-20 text-center sm:pt-20 lg:pt-24 lg:pb-28">
            <div className="flex flex-col items-center gap-7">
              <Eyebrow className="rise">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden />
                Piloto aberto para 5 marcas
              </Eyebrow>
              <h1 id="titulo" className="rise display-lg max-w-5xl text-ink [--i:1]">
                Descubra e resolva a dúvida que impede a compra.
              </h1>
              <p className="rise lead max-w-2xl text-graphite [--i:2]">
                A tone conversa com quem está em dúvida no seu site, recomenda do seu catálogo com o porquê e mostra a você
                quais perguntas, objeções e informações em falta estão custando vendas.
              </p>
              <div className="rise flex flex-wrap justify-center gap-3 [--i:3]">
                <ButtonLink href="#piloto-form" size="lg">
                  Quero um piloto
                </ButtonLink>
                <ButtonLink href="#como-funciona" tone="outline" size="lg">
                  Ver como funciona
                </ButtonLink>
              </div>
            </div>
            <div className="rise w-full text-start [--i:4]">
              <StoreDemo />
            </div>
          </Container>
        </section>

        {/* Números */}
        <section aria-label="O problema em números" className="border-y border-rule bg-surface">
          <Container className="grid divide-y divide-rule md:grid-cols-3 md:divide-x md:divide-y-0">
            {STATS.map((stat) => (
              <div key={stat.value} className="reveal flex flex-col gap-3 py-10 md:px-8 md:first:ps-0 md:last:pe-0">
                <p className="display-lg text-ink tabular-nums">
                  {stat.value.replace("%", "")}
                  <span className="text-accent-text">%</span>
                </p>
                <p className="max-w-xs text-body text-graphite">{stat.label}</p>
              </div>
            ))}
          </Container>
          <Container className="pb-6">
            <p className="text-caption text-graphite">Fonte: Baymard Institute, pesquisas de usabilidade em e-commerce.</p>
          </Container>
        </section>

        {/* O problema */}
        <section aria-labelledby="problema" className="py-24 sm:py-32">
          <Container className="grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center">
            <SectionHead id="problema" title="Quem está em dúvida não compra. Ou compra errado e devolve.">
              A sua ficha responde o que você acha que importa. O cliente pergunta outra coisa. Sem resposta, ele abre outra
              aba, e muitas vezes não volta.
            </SectionHead>
            <ul className="flex flex-col gap-3">
              {["Funciona no meu notebook?", "Veste justo ou largo?", "Tem perfume?"].map((asked, index) => (
                <li
                  key={asked}
                  className={`reveal max-w-sm rounded-panel px-5 py-4 shadow-raised ${index === 1 ? "self-end bg-accent-soft" : index === 2 ? "self-center bg-surface" : "bg-surface"}`}
                >
                  <q className="font-display text-[1.5rem] leading-snug text-ink italic">{asked}</q>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" aria-labelledby="como" className="border-t border-rule bg-surface py-24 sm:py-32">
          <Container className="flex flex-col gap-14">
            <SectionHead id="como" title="No seu site, com o seu catálogo." />
            <ol className="grid gap-4 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, index) => (
                <li key={title} className="reveal flex flex-col gap-8 rounded-card bg-paper p-7">
                  <div className="flex items-center justify-between">
                    <span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-text">
                      <Icon className="size-5" />
                    </span>
                    <span className="font-display text-[2rem] leading-none text-edge tabular-nums">0{index + 1}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="display-sm text-ink">{title}</h3>
                    <p className="text-body text-graphite">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </section>

        {/* Relatório de dúvidas */}
        <section id="relatorio" aria-labelledby="relatorio-titulo" className="py-24 sm:py-32">
          <Container className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
            <SectionHead id="relatorio-titulo" title="Cada pergunta vira um dado sobre a sua loja.">
              Você descobre quais informações faltam nas fichas, quais produtos geram mais dúvida e quais objeções aparecem
              antes da desistência. Tudo agregado: você vê padrões, não pessoas.
            </SectionHead>
            <div className="reveal relative isolate">
              <div aria-hidden className="glow-warm pointer-events-none absolute -inset-16 -z-10 opacity-80 [mask-image:radial-gradient(closest-side,black_55%,transparent)]" />
              <div className="rounded-card bg-surface p-3 shadow-raised ring-4 ring-ink/5">
                <div className="flex items-center justify-between px-4 pt-3 pb-4">
                  <p className="text-subheading text-ink">Esta semana</p>
                  <span className="rounded-tag bg-sunken px-2 py-0.5 text-caption font-semibold text-ink">
                    1.284 conversas
                  </span>
                </div>
                <ul className="flex flex-col gap-1">
                  {QUESTIONS.map((item, index) => (
                    <li key={item.q} className="flex flex-col gap-2.5 rounded-panel px-4 py-3.5 even:bg-paper">
                      <div className="flex items-baseline justify-between gap-4">
                        <q className="font-display text-[1.25rem] leading-snug text-ink italic">{item.q}</q>
                        <span className="shrink-0 text-small text-graphite tabular-nums">{item.n} pessoas</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                        <div
                          className="fill-in h-full rounded-full bg-accent"
                          style={{ width: `${(item.n / max) * 100}%`, ["--i" as string]: index }}
                        />
                      </div>
                      <p className="text-caption text-graphite">{item.gap}</p>
                    </li>
                  ))}
                </ul>
                <div className="m-1 mt-3 flex items-start gap-3 rounded-panel bg-accent-soft p-4 text-ink">
                  <SparkIcon className="mt-0.5 size-4 shrink-0 text-accent-text" />
                  <p className="text-small">
                    <span className="font-semibold">Sugestão:</span> acrescente “sem fragrância” às fichas de 14 produtos.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Recomendação explicada */}
        <section aria-labelledby="explicada" className="border-t border-rule bg-surface py-24 sm:py-32">
          <Container className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="reveal order-2 flex flex-col gap-3 lg:order-1">
              <div className="rounded-card bg-paper p-6 sm:p-7">
                <p className="text-caption font-medium text-graphite">O que costuma aparecer</p>
                <p className="mt-2 text-subheading text-graphite">Você também pode gostar</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="aspect-square rounded-thumb bg-sunken" />
                  ))}
                </div>
              </div>
              <div className="ring-warm rounded-card p-px">
                <div className="rounded-[calc(var(--radius-card)-1px)] bg-surface p-6 sm:p-7">
                  <p className="text-caption font-semibold text-accent-text">O que a tone diz</p>
                  <p className="mt-2 font-display text-[1.5rem] leading-snug text-ink">
                    Eu começaria pelo Sérum A. Ele não tem fragrância, é o mais leve dos três e cabe no seu limite de R$ 150.
                  </p>
                  <p className="mt-3 text-small text-graphite">
                    O B hidrata mais, mas pode pesar se a sua prioridade é oleosidade.
                  </p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <SectionHead id="explicada" title="Uma recomendação que o cliente entende, e confia.">
                Em vez de “você também pode gostar”, a tone diz por que aquele produto serve e o que fica de fora nas outras
                opções. Ela separa o que está na ficha do que é estimativa, e diz quando não sabe. Quando nenhum produto
                serve, diz isso também.
              </SectionHead>
            </div>
          </Container>
        </section>

        {/* Para que tipo de produto */}
        <section aria-labelledby="produtos" className="py-24 sm:py-32">
          <Container className="flex flex-col gap-14">
            <SectionHead id="produtos" title="Feita para produtos que exigem decisão." />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SEGMENTS.map((segment) => (
                <li
                  key={segment.name}
                  className="reveal flex min-h-56 flex-col justify-between gap-8 rounded-card bg-surface p-7 shadow-raised"
                >
                  <p className="text-ui text-graphite">{segment.name}</p>
                  <q className="font-display text-[1.75rem] leading-[1.15] text-ink italic">{segment.asked}</q>
                </li>
              ))}
            </ul>
          </Container>
        </section>

        {/* Piloto */}
        <section id="piloto" aria-labelledby="piloto-titulo" className="pb-24 sm:pb-32">
          <Container>
            <div className="reveal relative isolate grid gap-12 overflow-hidden rounded-tile bg-ink p-8 text-on-ink sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
              <div aria-hidden className="glow-ink pointer-events-none absolute inset-0 -z-10" />
              <div className="flex flex-col gap-6">
                <span className="text-caption font-medium text-accent-on-ink">Piloto</span>
                <h2 id="piloto-titulo" className="display-md">
                  A gente prova o ganho antes de você pagar.
                </h2>
                <p className="lead text-on-ink/80">
                  No piloto, parte dos visitantes vê a tone e parte não. Comparamos a receita por visita entre os dois
                  grupos. Não contamos como nossa toda venda de quem tocou no botão. Você vê o resultado real e decide.
                </p>
                <ol className="mt-2 flex flex-col divide-y divide-on-ink/15 border-y border-on-ink/15">
                  {[
                    ["Semana 1", "Conexão ao catálogo e revisão das respostas."],
                    ["Semanas 2 a 8", "A tone no ar, com grupo de controle."],
                    ["No fim", "Resultado, relatório de dúvidas e a sua decisão."],
                  ].map(([when, what]) => (
                    <li key={when} className="grid grid-cols-[7.5rem_1fr] gap-4 py-3.5 text-body">
                      <span className="text-on-ink/70">{when}</span>
                      <span>{what}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-col justify-center gap-6 rounded-panel bg-on-ink/[0.06] p-6 sm:p-8">
                <p className="text-small text-on-ink/70">Receita por visita, durante o piloto</p>
                <PilotBar label="Grupo de controle" detail="Não vê a tone" width="62%" index={0} />
                <PilotBar label="Com a tone" detail="Vê o botão" width="78%" index={1} strong />
                <p className="border-t border-on-ink/15 pt-4 text-small text-on-ink/80">
                  A diferença entre as duas barras é o ganho que conta. Ilustração, não resultado.
                </p>
              </div>
            </div>
          </Container>
        </section>

        {/* Para quem e privacidade */}
        <section aria-labelledby="quem" className="border-t border-rule bg-surface py-24 sm:py-32">
          <Container className="grid gap-4 lg:grid-cols-2">
            <div className="reveal flex flex-col gap-8 rounded-card bg-paper p-8 sm:p-10">
              <h2 id="quem" className="display-sm text-ink">
                Para marcas com e-commerce próprio.
              </h2>
              <ul className="flex flex-col gap-3">
                {FIT.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-body text-ink">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                      <CheckMark className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="reveal flex flex-col gap-8 rounded-card bg-paper p-8 sm:p-10">
              <div className="flex flex-col gap-4">
                <ShieldIcon className="size-6 text-accent-text" />
                <h2 className="display-sm text-ink">A pessoa no controle. Você com os padrões.</h2>
              </div>
              <ul className="flex flex-col gap-3">
                {[
                  "Ninguém precisa criar conta para usar.",
                  "O relatório é agregado e nunca mostra quem perguntou.",
                  "Nenhum dado é vendido. Nunca.",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-body text-ink">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                      <CheckMark className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        {/* Perguntas */}
        <section aria-labelledby="perguntas" className="py-24 sm:py-32">
          <Container className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <h2 id="perguntas" className="reveal display-md text-ink">
              Perguntas
            </h2>
            <div className="reveal">
              <Faq items={FAQ} />
            </div>
          </Container>
        </section>

        {/* Formulário */}
        <section
          id="piloto-form"
          aria-labelledby="form-titulo"
          className="relative overflow-hidden border-t border-rule py-24 sm:py-32"
        >
          <div aria-hidden className="glow-rise pointer-events-none absolute inset-0" />
          <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-40" />
          <Container className="relative grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div className="reveal flex flex-col gap-6">
              <h2 id="form-titulo" className="display-md text-ink">
                Estamos escolhendo as 5 primeiras marcas do piloto.
              </h2>
              <p className="lead text-graphite">Conte sobre a sua loja. A gente responde em até dois dias úteis.</p>
              <Link
                href="/"
                className="group inline-flex min-h-11 items-center gap-2 self-start text-ui text-graphite underline-offset-4 hover:text-ink hover:underline"
              >
                Conheça a tone para quem compra
                <ArrowIcon className="size-4 transition-transform duration-150 ease-soft group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="reveal">
              <PilotForm />
            </div>
          </Container>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function PilotBar({
  label,
  detail,
  width,
  index,
  strong = false,
}: {
  label: string;
  detail: string;
  width: string;
  index: number;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4 text-small">
        <span className="font-medium">{label}</span>
        <span className="text-on-ink/60">{detail}</span>
      </div>
      <div className="h-10 overflow-hidden rounded-full bg-on-ink/10">
        <div
          className={`fill-in h-full rounded-full ${strong ? "bg-accent-on-ink" : "bg-on-ink/40"}`}
          style={{ width, ["--i" as string]: index }}
        />
      </div>
    </div>
  );
}
