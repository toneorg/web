import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, Wordmark } from "@/components/site-chrome";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Quais dados a tone guarda, para quê e como apagar.",
};

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Se você entrou na lista de espera",
    body: (
      <>
        Guardamos o seu e-mail e de onde veio a visita (por exemplo, o link de um convite). A
        lista também perguntava a sua faixa de tom, como um número de 1 a 10, a
        base que você usava, quantas vezes já tinha errado o tom e o seu WhatsApp. Quem respondeu
        continua com essas respostas guardadas até pedir para apagar. Não pedimos nem guardamos
        foto.
      </>
    ),
  },
  {
    title: "Para que usamos",
    body: (
      <>
        Os dados da lista servem para avisar quando chegar a sua vez de testar e quando a tone
        for lançada. Nada é vendido nem compartilhado para publicidade.
      </>
    ),
  },
  {
    title: "Se você informou a sua faixa de tom",
    body: (
      <>
        Tom de pele pode revelar origem racial, que a LGPD trata como dado sensível (art. 5º, II).
        Por isso a faixa só foi guardada com o seu consentimento específico (art. 11, I), como um
        número e sem nenhum rótulo de raça ou etnia. Você pode retirar o consentimento quando
        quiser.
      </>
    ),
  },
  {
    title: "Se você escreveu em nome de uma marca",
    body: (
      <>
        Guardamos seu nome, e-mail, a marca, o site e a plataforma da loja, só para responder ao
        pedido de conversa.
      </>
    ),
  },
  {
    title: "Visitas à página e uso da tone na web",
    body: (
      <>
        Contamos as visitas com o Vercel Analytics, que não usa cookies. Na tone, usamos o PostHog
        para entender o que é usado e encontrar erros: quais telas e botões você usa, os erros que
        aparecem, o custo de cada pesquisa e uma gravação da tela durante o uso. Na gravação, o que
        você digita, as conversas, a memória e os nomes das conversas aparecem mascarados: só ficam
        o desenho da tela e os cliques. Seu e-mail e seu nome não vão para o PostHog. O que você
        escreve no botão de feedback vai, para a equipe ler e responder.
      </>
    ),
  },
  {
    title: "Como apagar",
    body: CONTACT_EMAIL ? (
      <>
        Escreva para{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="font-medium text-ink underline underline-offset-4"
        >
          {CONTACT_EMAIL}
        </a>{" "}
        pedindo a exclusão. Apagamos tudo em até 15 dias.
      </>
    ) : (
      <>Responda a qualquer e-mail da tone pedindo a exclusão. Apagamos tudo em até 15 dias.</>
    ),
  },
  {
    title: "E a extensão?",
    body: (
      <>
        A extensão e a tone na web mostram o próprio termo antes de você entrar, com o que guardam
        e para quê. Você vê, corrige, exporta e apaga seus dados em “Você”, dentro da tone.
      </>
    ),
  },
];

export default function Privacy() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 pt-6">
        <Wordmark />
        <Link href="/" className="min-h-11 content-center text-ui underline underline-offset-4">
          Voltar para a tone
        </Link>
      </header>
      {/* The title is inside main, so the skip link lands on it. */}
      <main id="conteudo" className="mx-auto w-full max-w-2xl flex-1 px-5 py-12 sm:py-16">
        <h1 className="display-md font-display">Privacidade</h1>
        <p className="lead mt-4 max-w-[33rem] text-graphite">O que acontece com os seus dados, em linguagem direta.</p>
        <div className="mt-12 flex max-w-[40rem] flex-col gap-10">
          {sections.map(({ title, body }) => (
            <section key={title}>
              <h2 className="display-sm font-display">{title}</h2>
              <p className="mt-3 leading-relaxed text-graphite">{body}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
