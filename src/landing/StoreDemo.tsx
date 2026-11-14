"use client";
// The opening demo of /lojas: a store's product page, the "Me ajuda a escolher"
// button, one question, and a recommendation from that store's catalog with the
// why. The store here is invented; the button is tone for stores.
import { CheckMark, HeadphonesIcon } from "./icons";
import { useSequence } from "./motion";

const CHOICES = ["Metrô", "Escritório", "Academia"];

// ms after each step: the button is pressed, the panel opens, a choice, she reads, the answer, the cart.
const STEPS = [1200, 700, 1300, 900, 1200, 900];

export function StoreDemo() {
  const { ref, step } = useSequence<HTMLDivElement>(STEPS, 4800);
  const shows = (n: number) => step >= n;
  const open = shows(2);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-card bg-surface shadow-raised ring-4 ring-ink/5">
        {/* The store's own bar */}
        <div className="flex items-center gap-3 border-b border-rule px-5 py-3">
          <span className="font-display text-[1.1rem] font-medium tracking-tight text-ink">som&amp;co</span>
          <span className="ms-auto hidden gap-4 text-caption text-graphite sm:flex">
            <span>Fones</span>
            <span>Caixas de som</span>
            <span>Acessórios</span>
          </span>
          <span aria-hidden className="ms-auto size-6 rounded-full bg-sunken sm:ms-0" />
        </div>

        <div aria-hidden className="relative grid min-h-[30rem] gap-5 p-5 sm:min-h-[26rem] sm:grid-cols-2 sm:p-6">
          <div className="grid aspect-[4/3] place-items-center rounded-panel bg-sunken text-graphite sm:aspect-auto">
            <HeadphonesIcon className="size-24" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-caption text-graphite">Fones sem fio</p>
            <p className="text-subheading text-ink">Fone Quieto 300</p>
            <p className="text-ui text-ink tabular-nums">R$ 899</p>
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="h-2 w-full rounded-full bg-rule" />
              <span className="h-2 w-5/6 rounded-full bg-rule" />
              <span className="h-2 w-2/3 rounded-full bg-rule" />
            </div>
            <span className="mt-auto inline-flex min-h-10 items-center justify-center self-start rounded-full bg-sunken px-5 text-small font-medium text-ink">
              Adicionar ao carrinho
            </span>
          </div>

          {/* tone for stores: the button, then the panel over the page */}
          {!open ? (
            <span
              className={`absolute right-5 bottom-[4.5rem] inline-flex sm:bottom-5 min-h-10 items-center gap-2 rounded-full bg-ink ps-3.5 pe-4 text-small font-medium text-on-ink shadow-raised transition-[scale] duration-150 ${
                shows(1) ? "scale-[0.96]" : ""
              }`}
            >
              <span className="size-1.5 rounded-full bg-on-ink" />
              Me ajuda a escolher
            </span>
          ) : (
            <div className="step-in absolute inset-x-3 bottom-3 flex flex-col gap-3 rounded-panel bg-surface p-4 shadow-[var(--shadow-raised),0_16px_40px_-16px_var(--color-scrim)] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[19rem]">
              <div className="flex items-center justify-between">
                <p className="text-caption font-medium text-ink">Me ajuda a escolher</p>
                <p className="text-label text-graphite">por tone</p>
              </div>
              <p className="text-small text-ink">Onde você vai usar mais?</p>
              <div className="flex flex-wrap gap-1.5">
                {CHOICES.map((choice, index) => (
                  <span
                    key={choice}
                    className={`inline-flex min-h-8 items-center rounded-full px-3 text-caption transition-[background-color,color] duration-150 ${
                      shows(3) && index === 0 ? "bg-ink text-on-ink" : "bg-surface text-ink shadow-raised"
                    }`}
                  >
                    {choice}
                  </span>
                ))}
              </div>
              {shows(4) && !shows(5) ? (
                <span className="step-in inline-flex gap-1 py-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="dot-pulse size-1.5 rounded-full bg-graphite" style={{ ["--i" as string]: i }} />
                  ))}
                </span>
              ) : null}
              {shows(5) ? (
                <div className="step-in flex flex-col gap-2 border-t border-rule pt-3">
                  <p className="text-small font-medium text-ink">Para metrô e chamadas, eu ficaria com este.</p>
                  <p className="flex items-start gap-2 text-caption text-ink">
                    <CheckMark className="mt-0.5 size-3.5 shrink-0" />O cancelamento de ruído mais forte da loja e dois
                    microfones por lado.
                  </p>
                  <p className="text-caption text-graphite">
                    O Pulse custa R$ 180 a menos, mas o microfone some em lugar barulhento.
                  </p>
                  <span
                    className={`mt-1 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full text-caption font-medium transition-[background-color,color] duration-150 ${
                      shows(6) ? "bg-ink text-on-ink" : "bg-surface text-ink shadow-raised"
                    }`}
                  >
                    {shows(6) ? (
                      <>
                        <CheckMark className="size-3.5" />
                        No carrinho
                      </>
                    ) : (
                      "Adicionar ao carrinho"
                    )}
                  </span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <p className="sr-only">
        Exemplo: na página de um fone, a pessoa toca em “Me ajuda a escolher”. A tone pergunta onde ela vai usar mais; ela
        escolhe metrô. A tone recomenda o Fone Quieto 300 porque tem o cancelamento de ruído mais forte da loja e dois
        microfones por lado, e explica que o Pulse custa R$ 180 a menos, mas o microfone some em lugar barulhento. A pessoa
        adiciona ao carrinho.
      </p>
    </div>
  );
}
