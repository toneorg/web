import type { Metadata } from "next";
import Link from "next/link";
import { Container, HEADER_LINK, SiteFooter, SiteHeader } from "@/components/site-chrome";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Quais dados a lista de espera da tone guarda, para quê e como apagar.",
};

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "O que guardamos",
    body: (
      <>
        Para entrar na lista, só o seu e-mail e de onde veio a visita (por exemplo, o link de um
        convite). Se você responder às perguntas do beta, guardamos também a sua faixa de tom,
        como um número de 1 a 10, a base que usa hoje, quantas vezes já errou o tom e, se quiser
        testar, o seu WhatsApp. Não pedimos nem guardamos foto.
      </>
    ),
  },
  {
    title: "Para que usamos",
    body: (
      <>
        Para avisar quando o beta e o lançamento abrirem, chamar para o teste pessoas de todas as
        faixas de tom e entender como é comprar base online. Não vendemos nem compartilhamos
        seus dados para publicidade.
      </>
    ),
  },
  {
    title: "Por que pedimos autorização para a faixa de tom",
    body: (
      <>
        Tom de pele pode revelar origem racial, que a LGPD trata como dado sensível (art. 5º, II).
        Por isso a faixa só é guardada com o seu consentimento específico (art. 11, I), como um
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
    title: "Visitas à página",
    body: (
      <>
        Contamos as visitas com o Vercel Analytics, que não usa cookies e não identifica quem
        visitou. Serve para saber quantas pessoas chegam e por qual caminho.
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
          className="font-medium text-wine underline underline-offset-4"
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
    title: "E o app?",
    body: (
      <>
        Esta página fala só da lista de espera. O app terá o seu próprio aviso de privacidade,
        publicado antes do beta.
      </>
    ),
  },
];

export default function Privacy() {
  return (
    <>
      <div className="bg-coral">
        <Container className="pt-6 sm:pt-8">
          <SiteHeader>
            <Link href="/" className={HEADER_LINK}>
              Voltar para a tone
            </Link>
          </SiteHeader>
        </Container>
      </div>

      {/* The title is inside main, so the skip link lands on it. */}
      <main id="conteudo">
        <div className="bg-coral">
          <Container className="pb-12 pt-16 sm:pb-16 sm:pt-24">
            <h1 className="display-lg">Privacidade</h1>
            <p className="lead mt-5 max-w-[33rem]">
              O que acontece com os dados da lista de espera, em linguagem direta.
            </p>
          </Container>
        </div>

        <Container className="py-16 sm:py-24">
          <div className="flex max-w-[40rem] flex-col gap-12">
            {sections.map(({ title, body }) => (
              <section key={title}>
                <h2 className="display-sm">{title}</h2>
                <p className="mt-3 leading-relaxed text-muted">{body}</p>
              </section>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
