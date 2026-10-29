import { Container, GRID, SECTION } from "@/components/site-chrome";

// A watch as the conversation drafts it, per toneorg/extension docs/acompanhamentos.md.
const RULE = [
  { label: "O quê", value: "Fone com cancelamento de ruído, preto" },
  { label: "Avisar quando", value: "Custar até R$ 400 à vista" },
  { label: "Onde", value: "Amazon e Mercado Livre" },
  { label: "Quando confiro", value: "Todo dia, às 9h" },
];

const ACTIONS = ["Pausar", "Silenciar", "Verificar agora"];

/** Watching: the purchase that is not for today, checked while she is away. */
export function Watch() {
  return (
    <section className={`bg-coral-50 ${SECTION}`}>
      <Container>
        <div className={`${GRID} gap-14 lg:items-center`}>
          <div className="lg:col-span-6">
            <h2 className="display-lg">Quando não é para hoje, eu fico de olho.</h2>
            <p className="lead mt-6 max-w-[31rem]">
              Me diz o que esperar: um preço, um produto voltando ao estoque, uma opção nova que
              combine com você. Eu confiro todo dia, mesmo com o Chrome fechado, e te escrevo
              quando alguma coisa mudar.
            </p>
            <p className="mt-6 max-w-[31rem] leading-relaxed text-muted">
              Antes de começar, eu mostro a regra para você aprovar. Se não consigo conferir num
              dia, eu digo que não deu, em vez de dizer que nada mudou.
            </p>
          </div>

          <figure className="lg:col-span-5 lg:col-start-8">
            <div className="rounded-tile bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="display-sm">Acompanhamento</p>
                <span className="flex items-center gap-2 text-small">
                  <span aria-hidden className="size-2 rounded-full bg-coral" />
                  Ativo
                </span>
              </div>
              <dl className="mt-6 flex flex-col gap-4">
                {RULE.map(({ label, value }) => (
                  <div key={label} className="rounded-panel bg-coral-50 px-4 py-3">
                    <dt className="text-small text-muted">{label}</dt>
                    <dd className="mt-0.5 font-medium leading-snug">{value}</dd>
                  </div>
                ))}
              </dl>
              <ul aria-hidden className="mt-6 flex flex-wrap gap-2">
                {ACTIONS.map((action) => (
                  <li
                    key={action}
                    className="flex min-h-11 items-center rounded-full bg-coral-100 px-4 text-ui"
                  >
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            <figcaption className="mt-3 ps-5 text-small text-muted">
              Exemplo ilustrativo. O preço que eu vejo pode mudar até você abrir a loja.
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
