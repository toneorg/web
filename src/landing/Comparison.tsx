// "Por que não só perguntar ao ChatGPT?": the question people ask most, answered
// by showing it. The same request goes to a general chat and to tone, side by
// side, then a short list of what changes. Claims on the general side describe
// the shape of a typical answer, never a fact about one company; the tone side
// names only what the product does (provenance.ts, watch.ts, decision.ts).
import { GeneralAnswer } from "./GeneralAnswer";
import { BellIcon, CheckMark, CrossMark } from "./icons";

const ASKED = "Air fryer para 4 pessoas. Minha cozinha é pequena. Até R$ 600.";

const TONE_REASONS = [
  "Cesto de 5 L: serve 4 pessoas.",
  "28 cm de largura, a mais estreita das que servem 4.",
  "Dentro do seu limite.",
];

const ROWS: { topic: string; general: string; tone: string }[] = [
  {
    topic: "A resposta",
    general: "Uma lista de opções boas para a maioria das pessoas.",
    tone: "Poucas opções, escolhidas pelo que você disse.",
  },
  {
    topic: "O que você perde",
    general: "Prós genéricos de cada modelo. A escolha fica com você.",
    tone: "Cada opção diz o que você abre mão ao escolhê-la.",
  },
  {
    topic: "O preço",
    general: "O que a busca encontrou, nem sempre o da loja agora.",
    tone: "Lido nas lojas brasileiras, com a fonte de cada valor.",
  },
  {
    topic: "Depois da resposta",
    general: "A conversa termina ali.",
    tone: "Ela acompanha o preço e avisa quando vale comprar.",
  },
  {
    topic: "Quem ganha com a compra",
    general: "Depende do modelo de negócio de cada empresa.",
    tone: "Ninguém. Nenhuma marca ou loja paga para aparecer.",
  },
];

export function Comparison() {
  return (
    <div className="flex flex-col gap-10">
      <div className="reveal flex flex-col gap-4">
        <p className="text-caption font-medium text-graphite">A mesma pergunta nos dois</p>
        <q className="font-display text-[1.75rem] leading-[1.15] text-ink italic sm:text-[2rem]">{ASKED}</q>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <GeneralAnswer />
        <ToneAnswer />
      </div>

      <dl className="reveal divide-y divide-rule border-y border-rule">
        <div
          aria-hidden
          className="hidden gap-6 py-4 text-caption font-medium text-graphite md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,4fr)]"
        >
          <span />
          <span>Um chat de uso geral</span>
          <span className="font-semibold text-accent-text">A tone</span>
        </div>
        {ROWS.map((row) => (
          <div key={row.topic} className="grid gap-3 py-5 md:grid-cols-[minmax(0,3fr)_minmax(0,4fr)_minmax(0,4fr)] md:gap-6">
            <dt className="text-subheading text-ink">{row.topic}</dt>
            <dd className="flex items-start gap-3 text-body text-graphite">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-sunken text-graphite">
                <CrossMark className="size-3" />
              </span>
              <span>
                <span className="sr-only">Um chat de uso geral: </span>
                {row.general}
              </span>
            </dd>
            <dd className="flex items-start gap-3 text-body text-ink">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                <CheckMark className="size-3" />
              </span>
              <span>
                <span className="sr-only">A tone: </span>
                {row.tone}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** One pick, the reasons tied to what was asked, where the price came from, and what the other option gives up. */
function ToneAnswer() {
  return (
    <div className="reveal ring-warm flex rounded-card p-px">
      <article className="flex flex-1 flex-col gap-5 rounded-[calc(var(--radius-card)-1px)] bg-surface p-6 sm:p-8">
        <header className="flex items-center justify-between gap-4">
          <h3 className="text-ui font-semibold text-ink">A tone</h3>
          <span className="rounded-tag bg-accent-soft px-2.5 py-1 text-caption font-semibold text-accent-text">
            1 escolha e o porquê
          </span>
        </header>
        <div className="flex flex-col gap-1">
          <p className="text-caption text-graphite">Eu começaria pela</p>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="font-display text-[1.75rem] leading-tight text-ink">Compacta 5L</p>
            <p className="text-ui text-ink tabular-nums">R$ 549</p>
          </div>
          <p className="text-caption text-graphite">Preço lido no Magalu hoje, às 9h.</p>
        </div>
        <ul className="flex flex-col gap-2.5">
          {TONE_REASONS.map((reason) => (
            <li key={reason} className="flex items-start gap-3 text-body text-ink">
              <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
                <CheckMark className="size-3" />
              </span>
              {reason}
            </li>
          ))}
        </ul>
        <div className="flex items-start gap-3 rounded-panel bg-paper p-4 text-small text-graphite">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-sunken text-graphite">
            <CrossMark className="size-3" />
          </span>
          <p>
            <span className="font-medium text-ink">Por que não a Duo 7L?</span> Cabe mais, mas tem 38 cm de largura e é a
            mais barulhenta nas avaliações.
          </p>
        </div>
        <p className="mt-auto flex items-center gap-2.5 border-t border-rule pt-4 text-small text-graphite">
          <BellIcon className="size-4 shrink-0 text-accent-text" />
          Ela avisa se o preço cair abaixo de R$ 500.
        </p>
      </article>
    </div>
  );
}
