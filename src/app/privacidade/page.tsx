import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { LandingFooter, LandingNav } from "@/landing/chrome";
import { CheckMark } from "@/landing/icons";
import { Container } from "@/landing/ui";
import { CONTACT_EMAIL } from "@/lib/site";

/*
  The privacy note, in plain Portuguese, for the person who buys and for the
  store. It describes what the product does today (tone-server: account,
  conversations, memory, photos, sensitive data, Google connections, price
  watches; this site: waiting list, pilot form, analytics). When the product
  changes what it keeps, where or for how long, this page changes with it.
  Not yet reviewed by a lawyer (README, "Before publishing, check").
*/

export const metadata: Metadata = {
  title: "Privacidade",
  description:
    "O que a tone guarda, para quê, com quem compartilha, por quanto tempo e como você vê, baixa e apaga os seus dados.",
};

const UPDATED = "18 de novembro de 2026";

const SUMMARY = [
  "Não vendemos seus dados e nenhuma marca ou loja paga para aparecer nas suas respostas.",
  "Guardamos só o que a tone precisa para pesquisar e recomendar para você.",
  "Você vê, corrige, baixa e apaga tudo em “Seu perfil”, dentro da tone.",
  "Dado sensível, como tom de pele, só com a sua permissão, e você retira quando quiser.",
];

type Section = { id: string; title: string; body: ReactNode };

const contact = CONTACT_EMAIL ? (
  <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-ink underline underline-offset-4 hover:no-underline">
    {CONTACT_EMAIL}
  </a>
) : (
  <>responda a qualquer e-mail da tone</>
);

const SECTIONS: Section[] = [
  {
    id: "o-que-guardamos",
    title: "O que guardamos",
    body: (
      <>
        <Item title="Se você entrou na lista de espera">
          O seu e-mail, a data e de que ponto da página você entrou. Usamos para mandar a confirmação e, depois, o seu
          convite. Quem entrou na lista antiga também respondeu perguntas sobre tom de pele, base e WhatsApp: essas
          respostas continuam guardadas até você pedir para apagar.
        </Item>
        <Item title="Se você pediu um piloto para a sua loja">
          Seu nome, e-mail, o site e a plataforma da loja, a faixa de visitas por mês e, se você informou, o seu WhatsApp.
          Usamos só para responder ao pedido.
        </Item>
        <Item title="Sua conta">
          O seu e-mail e a sua senha. A senha nunca fica guardada como você digitou: guardamos só um código gerado a partir
          dela, que não dá para reverter.
        </Item>
        <Item title="Suas conversas e pesquisas">
          O que você escreve, as respostas da tone, os produtos, preços e lojas que ela encontrou e as escolhas que você
          fez. Os painéis de preço que você cria guardam o produto, o preço que você quer pagar e o histórico de preços
          lidos nas lojas.
        </Item>
        <Item title="O que a tone lembra de você">
          Preferências que você conta e que ajudam nas próximas compras, como o seu tamanho, o que você evita ou quanto
          costuma gastar. Você vê tudo em “Seu perfil” e corrige ou apaga cada item.
        </Item>
        <Item title="Fotos que você manda">
          Quando você manda uma foto de referência, tiramos dela os dados do arquivo (como local e aparelho) antes de
          guardar. Ela fica visível só para você, naquela conversa, e é apagada em até 30 dias, ou antes, se você pedir. Um
          modelo de visão lê só o que aparece na imagem, como cor e formato, e você corrige o que ele leu.
        </Item>
        <Item title="Dados sensíveis">
          Tom, subtom e tipo de pele podem revelar origem racial, que a LGPD trata como dado sensível (art. 5º, II). A tone
          nunca adivinha esses dados e só os guarda depois que você aceita um pedido específico, com uma finalidade:
          recomendar maquiagem e cuidados com a pele (art. 11, I). Se você escolher “Só nesta conversa”, o dado vale só
          naquela conversa e some em até 24 horas. Em “Seu perfil”, na parte “Dados sensíveis”, você vê o que foi guardado
          e apaga tudo retirando a permissão.
        </Item>
        <Item title="Conexões com o Google (opcionais)">
          Se você conectar, a tone lê o seu Gmail só para achar confirmações de pedido e montar o seu histórico de compras,
          e a sua Agenda só para notar eventos que pedem uma compra, como uma viagem. O acesso é somente leitura: ela não
          envia, apaga nem altera nada. As chaves de acesso ficam cifradas e nunca chegam ao seu navegador. Ao desconectar,
          revogamos o acesso e apagamos as compras e lembranças que vieram dali. O uso de informações recebidas das APIs do
          Google segue a{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            className="font-medium text-ink underline underline-offset-4 hover:no-underline"
          >
            Política de Dados do Usuário dos Serviços de API do Google
          </a>
          , incluindo os requisitos de uso limitado: esses dados servem só para as funções que você ativou, não são usados
          para publicidade nem para treinar modelos, e nenhuma pessoa da equipe os lê, a não ser com a sua permissão, por
          segurança ou por exigência legal.
        </Item>
        <Item title="Como você usa o site e a tone">
          Contamos as visitas ao site com o Vercel Analytics, que não usa cookies. Dentro da tone, usamos o PostHog para
          saber quais telas e botões são usados, encontrar erros e medir o custo de cada pesquisa. Ele também grava a tela
          durante o uso, com tudo o que você digita, as conversas, a memória e os nomes das conversas mascarados: ficam só
          o desenho da tela e os cliques. O seu e-mail e o seu nome não vão para o PostHog. O que você escreve no botão de
          feedback e as avaliações das respostas vão, para a equipe ler.
        </Item>
      </>
    ),
  },
  {
    id: "para-que",
    title: "Para que usamos, e com que base",
    body: (
      <ul className="flex flex-col gap-3">
        <Bullet>
          <strong className="font-medium text-ink">Para a tone funcionar para você:</strong> pesquisar, comparar,
          recomendar com o porquê, lembrar do que importa e avisar quando um preço baixar. Base: execução do serviço que
          você pediu (LGPD, art. 7º, V).
        </Bullet>
        <Bullet>
          <strong className="font-medium text-ink">Com a sua permissão:</strong> dados sensíveis, conexões com o Google, a
          lista de espera e os e-mails sobre ela. Base: consentimento (art. 7º, I, e art. 11, I), que você retira quando
          quiser.
        </Bullet>
        <Bullet>
          <strong className="font-medium text-ink">Para manter a tone segura e melhorar:</strong> encontrar erros, evitar
          abuso e entender o que funciona. Base: legítimo interesse (art. 7º, IX), sempre com o mínimo de dados.
        </Bullet>
        <Bullet>
          <strong className="font-medium text-ink">O que nunca fazemos:</strong> vender dados, usar seus dados para
          publicidade ou deixar uma marca ou loja pagar para aparecer nas suas respostas.
        </Bullet>
      </ul>
    ),
  },
  {
    id: "com-quem",
    title: "Com quem os dados passam",
    body: (
      <>
        <p>
          Nenhuma loja recebe os seus dados. A página de um produto só abre quando você pede, e a compra é sua. Para a tone
          funcionar, alguns serviços processam dados em nosso nome, só para essa finalidade:
        </p>
        <dl className="mt-5 divide-y divide-rule border-y border-rule">
          {[
            ["Hospedagem e banco de dados", "Vercel (este site), Fly.io (o servidor da tone) e Supabase (o banco de dados)."],
            [
              "Modelos de linguagem e de visão",
              "Acessados pela OpenRouter. Recebem o trecho da conversa, e a foto quando houver, necessário para gerar cada resposta.",
            ],
            [
              "Busca e leitura de lojas",
              "Serviços como a Oxylabs, que leem páginas e preços das lojas. Recebem só o que buscar, como o nome de um produto, nunca os seus dados de conta.",
            ],
            ["E-mail", "Resend, que entrega a confirmação da lista, o convite e os avisos de preço."],
            ["Uso e erros", "PostHog e Vercel Analytics, como descrito acima."],
            ["Google", "Só se você conectar o Gmail ou a Agenda."],
          ].map(([who, what]) => (
            <div key={who} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
              <dt className="text-ui text-ink">{who}</dt>
              <dd className="text-body text-graphite">{what}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5">
          Vários desses serviços ficam fora do Brasil, principalmente nos Estados Unidos, então os seus dados podem ser
          processados lá (LGPD, art. 33). Também podemos compartilhar dados quando a lei ou uma ordem judicial exigir.
        </p>
      </>
    ),
  },
  {
    id: "por-quanto-tempo",
    title: "Por quanto tempo",
    body: (
      <ul className="flex flex-col gap-3">
        <Bullet>Conta, conversas, memória e painéis: enquanto a sua conta existir. Apagar a conta apaga tudo isso.</Bullet>
        <Bullet>Fotos de referência: até 30 dias, ou até você apagar.</Bullet>
        <Bullet>Dados sensíveis “Só nesta conversa”: até 24 horas.</Bullet>
        <Bullet>Lista de espera e pedidos de piloto: até você pedir para sair, ou até não fazerem mais sentido.</Bullet>
        <Bullet>Registros técnicos de uso e custo no nosso servidor: 30 dias.</Bullet>
      </ul>
    ),
  },
  {
    id: "seus-direitos",
    title: "Seus direitos e como usar",
    body: (
      <>
        <p>
          Pela LGPD (art. 18), você pode saber se tratamos os seus dados e ter acesso a eles, corrigir, levar para outro
          serviço, pedir que sejam apagados, saber com quem foram compartilhados e retirar uma permissão que deu.
        </p>
        <ul className="mt-5 flex flex-col gap-3">
          <Bullet>
            <strong className="font-medium text-ink">Ver e corrigir:</strong> em “Seu perfil”, dentro da tone.
          </Bullet>
          <Bullet>
            <strong className="font-medium text-ink">Baixar tudo:</strong> “Baixar meus dados”, em “Seu perfil”.
          </Bullet>
          <Bullet>
            <strong className="font-medium text-ink">Apagar tudo:</strong> “Apagar minha conta”, em “Seu perfil”.
          </Bullet>
          <Bullet>
            <strong className="font-medium text-ink">Retirar uma permissão:</strong> “Dados sensíveis” e as conexões, em
            “Seu perfil”.
          </Bullet>
          <Bullet>
            <strong className="font-medium text-ink">Lista de espera, piloto ou qualquer outro pedido:</strong> {contact}.
            Respondemos em até 15 dias.
          </Bullet>
        </ul>
        <p className="mt-5">
          Se achar que não resolvemos, você também pode procurar a Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Como protegemos",
    body: (
      <p>
        As conexões usam criptografia (HTTPS e TLS). Senhas e chaves de acesso ficam guardadas só como códigos que não dão
        para reverter, e as chaves das conexões com o Google ficam cifradas. As fotos não têm endereço público. Só a equipe
        da tone acessa o banco de dados, e só quando precisa. Nenhum sistema é infalível: se acontecer um incidente que
        possa afetar você, avisamos você e a ANPD.
      </p>
    ),
  },
  {
    id: "mudancas",
    title: "Quando esta página muda",
    body: (
      <p>
        Quando a tone passar a guardar algo novo, ou mudar onde ou por quanto tempo guarda, esta página muda junto, e a data
        no topo mostra a última versão. Para uso novo de dado sensível ou das conexões com o Google, pedimos a sua
        permissão de novo.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <LandingNav
        links={[
          { href: "/#como-funciona", label: "Como funciona" },
          { href: "/lojas", label: "Para lojas" },
        ]}
        secondary={{ href: "/conversas", label: "Entrar" }}
        cta={{ href: "/#lista", label: "Entrar na lista" }}
      />

      <main id="conteudo" className="flex-1 py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,8fr)] lg:gap-16">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="Nesta página" className="hidden flex-col gap-1 lg:flex">
              <p className="mb-2 text-caption font-medium text-graphite">Nesta página</p>
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="min-h-9 content-center text-small text-graphite underline-offset-4 hover:text-ink hover:underline"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="flex max-w-[42rem] flex-col gap-14">
            <header className="flex flex-col gap-5">
              <p className="text-caption text-graphite">Atualizada em {UPDATED}</p>
              <h1 className="display-lg text-ink">Privacidade</h1>
              <p className="lead text-graphite">
                O que acontece com os seus dados na tone, em linguagem direta: o que guardamos, para quê, com quem, por
                quanto tempo e como você controla tudo.
              </p>
              <ul className="mt-2 flex flex-col gap-3 rounded-card bg-surface p-6 shadow-raised sm:p-8">
                {SUMMARY.map((line) => (
                  <li key={line} className="flex items-start gap-3 text-body text-ink">
                    <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                      <CheckMark className="size-3" />
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </header>

            {SECTIONS.map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-titulo`} className="flex flex-col gap-5">
                <h2 id={`${section.id}-titulo`} className="display-sm text-ink">
                  {section.title}
                </h2>
                <div className="flex flex-col gap-4 text-body text-graphite">{section.body}</div>
              </section>
            ))}

            <p className="border-t border-rule pt-8 text-small text-graphite">
              A tone é responsável pelos dados descritos aqui. Dúvidas ou pedidos: {contact}.{" "}
              <Link href="/" className="font-medium text-ink underline underline-offset-4 hover:no-underline">
                Voltar para a página inicial
              </Link>
              .
            </p>
          </article>
        </Container>
      </main>

      <LandingFooter />
    </div>
  );
}

function Item({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-rule pt-5 first:border-0 first:pt-0">
      <h3 className="text-subheading text-ink">{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
      <span>{children}</span>
    </li>
  );
}
