import type { Metadata } from "next";
import { Container, SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Privacidade",
  description: "Quais dados a lista de espera da tone guarda, para quê e como apagar.",
};

const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const sections: [string, React.ReactNode][] = [
  [
    "O que guardamos",
    <>
      Seu e-mail, o tom que você escolheu na escala, a base que usa hoje e quantas vezes
      já errou o tom, se você responder. Se marcar que quer testar, também o seu
      WhatsApp. Guardamos ainda de onde veio a visita (por exemplo, o QR code de um
      evento) para saber quais canais funcionam. Nesta página não pedimos nem guardamos
      fotos.
    </>,
  ],
  [
    "Para que usamos",
    <>
      Para avisar quando a tone abrir, chamar pessoas para os testes e entender como é
      comprar base para cada tom de pele. Não vendemos nem compartilhamos seus dados para
      publicidade.
    </>,
  ],
  [
    "Por que pedimos autorização",
    <>
      Tom de pele pode revelar origem racial, que a LGPD trata como dado sensível (art. 5º,
      II). Por isso só guardamos com o seu consentimento específico (art. 11, I), que você
      pode retirar a qualquer momento.
    </>,
  ],
  [
    "Quando houver selfie",
    <>
      Os testes com selfie terão um termo próprio, explicado antes da primeira foto, com
      prazo curto de exclusão da imagem. A regra da tone é guardar o tom, não a foto.
    </>,
  ],
  [
    "Como apagar",
    contact ? (
      <>
        Escreva para{" "}
        <a href={`mailto:${contact}`} className="font-medium underline underline-offset-4">
          {contact}
        </a>{" "}
        pedindo a exclusão. Apagamos tudo em até 15 dias.
      </>
    ) : (
      <>Responda a qualquer e-mail da tone pedindo a exclusão. Apagamos tudo em até 15 dias.</>
    ),
  ],
];

export default function Privacy() {
  return (
    <>
      <SiteHeader href="/" label="Voltar para a tone" />
      <main id="conteudo">
        <Container className="pt-8 sm:pt-16">
          <h1 className="display text-[clamp(2.4rem,8vw,5rem)]">Privacidade</h1>
          <p className="mt-6 max-w-[38rem] text-[1.15rem] leading-relaxed text-graphite">
            O que acontece com as respostas da lista de espera, em linguagem direta.
          </p>
          <dl className="mt-14 flex max-w-[40rem] flex-col gap-10">
            {sections.map(([term, body]) => (
              <div key={term} className="flex flex-col gap-2">
                <dt className="text-[1.2rem] font-semibold">{term}</dt>
                <dd className="text-[1.05rem] leading-relaxed text-graphite">{body}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
