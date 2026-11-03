"use client";
// The first visit after signing in: five short steps through what the tone does,
// each with a drawing that plays once and shows the product doing that thing.
// The last step offers example requests that open a conversation right away.
// Seen once per account on this browser; "Rever o tour" in the profile opens it again.
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ToneWordmark } from "@/components/tone-logo";
import { track } from "./analytics";

const KEY = "tone.onboarding.v1";

/** Whether this account already went through the tour on this browser. */
export function onboardingSeen(userId: string): boolean {
  try {
    return window.localStorage.getItem(`${KEY}:${userId}`) !== null;
  } catch {
    // Storage blocked: better to not insist than to show it on every visit.
    return true;
  }
}

function markSeen(userId: string, how: "completed" | "skipped") {
  try {
    window.localStorage.setItem(`${KEY}:${userId}`, `${how}:${new Date().toISOString()}`);
  } catch {
    // Nothing to do: the tour may show again next time.
  }
}

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;
const line = "block h-2 rounded-full bg-rule";

/** 1. A request is typed and three good options arrive. */
function ArtAsk() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="rounded-input bg-surface px-4 py-3 shadow-raised">
        <span className="ob-type block whitespace-nowrap text-small text-ink">um perfume amadeirado até R$ 400</span>
      </div>
      <div className="ob-rise flex items-center gap-2 text-caption text-graphite" style={d(1200)}>
        <span className="size-1.5 rounded-full bg-ink" /> Pesquisando em 18 lojas…
      </div>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="ob-rise flex items-center gap-3 rounded-panel bg-surface p-3 shadow-raised"
          style={d(1700 + index * 160)}
        >
          <span className="size-10 shrink-0 rounded-thumb bg-sunken" />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className={`${line} w-3/4`} />
            <span className={`${line} w-1/2`} />
          </span>
          <span className="text-caption font-medium text-ink tabular-nums">R$ {[389, 349, 299][index]}</span>
        </div>
      ))}
    </div>
  );
}

/** 2. Few options side by side, and one is chosen, with the reason. */
function ArtDecide() {
  return (
    <div className="grid w-full max-w-sm grid-cols-3 items-start gap-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="ob-rise flex flex-col gap-2" style={d(index * 140)}>
          <div
            className={`flex flex-col gap-2 rounded-panel bg-surface p-2.5 shadow-raised ${index === 1 ? "ob-choose" : "opacity-80"}`}
            style={index === 1 ? d(900) : undefined}
          >
            <span className="aspect-square rounded-thumb bg-sunken" />
            <span className={`${line} w-full`} />
            <span className={`${line} w-2/3`} />
          </div>
          {index === 1 ? (
            <span className="ob-pop self-center rounded-tag bg-ink px-1.5 py-0.5 text-label text-on-ink" style={d(1200)}>
              Minha escolha
            </span>
          ) : null}
        </div>
      ))}
      <p className="ob-rise col-span-3 mt-2 rounded-panel bg-surface p-3 text-caption text-ink shadow-raised" style={d(1500)}>
        Mais barato que o primeiro, com as notas que você prefere e entrega em 2 dias.
      </p>
    </div>
  );
}

/** 3. A panel: the price line goes down past the person's price, and a notice arrives. */
function ArtWatch() {
  return (
    <div className="relative w-full max-w-sm rounded-panel bg-surface p-4 shadow-raised">
      <div className="flex items-baseline justify-between">
        <span className="text-caption text-graphite">Fone com cancelamento de ruído</span>
        <span className="text-caption text-graphite">30 dias</span>
      </div>
      <svg viewBox="0 0 300 120" className="mt-2 h-32 w-full overflow-visible" aria-hidden="true">
        <line x1="0" x2="300" y1="78" y2="78" className="stroke-edge" strokeWidth="1.5" strokeDasharray="5 5" />
        <text x="0" y="96" className="fill-graphite text-[11px]">seu preço: R$ 300</text>
        <polyline
          points="0,30 40,34 80,26 120,40 160,36 200,52 240,60 270,88 300,92"
          fill="none"
          className="ob-draw stroke-ink"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ "--len": 340 } as CSSProperties}
        />
        <circle cx="300" cy="92" r="5" className="ob-pop fill-ink" style={d(1300)} />
      </svg>
      <div
        className="ob-slide absolute -bottom-4 right-3 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-caption font-semibold text-on-ink shadow-floating"
        style={d(1500)}
      >
        Baixou para R$ 279
      </div>
    </div>
  );
}

/** 4. What the tone learns about the person, as notes they can see and erase. */
function ArtRemember() {
  const notes = ["tênis: 40", "prefere couro", "até R$ 400", "já tem sandália dourada", "não gosta de doce"];
  return (
    <div className="flex w-full max-w-sm flex-col gap-3 rounded-panel bg-surface p-4 shadow-raised">
      <span className="text-caption text-graphite">O que eu sei sobre você</span>
      <div className="flex flex-wrap gap-2">
        {notes.map((note, index) => (
          <span key={note} className="ob-pop rounded-full bg-sunken px-3 py-1.5 text-caption text-ink" style={d(200 + index * 180)}>
            {note}
          </span>
        ))}
      </div>
      <span className="ob-rise text-caption text-graphite" style={d(1300)}>
        Você confirma, corrige ou apaga em “Meu perfil”.
      </span>
    </div>
  );
}

/** 5. The extension: a side panel next to the store page, which never pays. */
function ArtExtension() {
  return (
    <div className="flex h-44 w-full max-w-sm overflow-hidden rounded-panel bg-surface shadow-raised">
      <div className="flex flex-1 flex-col gap-2 p-3">
        <span className="flex gap-1">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-1.5 rounded-full bg-rule" />
          ))}
        </span>
        <span className="h-16 rounded-thumb bg-sunken" />
        <span className={`${line} w-3/4`} />
        <span className={`${line} w-1/2`} />
        <span className="mt-auto h-6 w-20 rounded-full bg-sunken" />
      </div>
      <div className="ob-slide flex w-[45%] flex-col gap-2 bg-paper p-3" style={d(300)}>
        <span className="text-label font-medium text-ink">tone</span>
        <span className="ob-rise rounded-thumb bg-surface p-2 text-label text-ink shadow-raised" style={d(800)}>
          Esse tem o tamanho 40 em preto.
        </span>
        <span className="ob-rise rounded-thumb bg-surface p-2 text-label text-ink shadow-raised" style={d(1100)}>
          Coloquei no carrinho. O pagamento é com você.
        </span>
      </div>
    </div>
  );
}

const EXAMPLES = [
  "Um presente até R$ 200 para minha mãe, que gosta de cozinhar",
  "O tênis de corrida com melhor custo-benefício para iniciante",
  "Me avise quando o AirPods Pro baixar de R$ 1.500",
];

type Step = { id: string; title: string; text: ReactNode; art: () => ReactNode };

const STEPS: Step[] = [
  {
    id: "ask",
    title: "Me diz o que você procura",
    text: "Escreva como falaria com uma amiga: o que é, para quem, quanto quer gastar. Eu pesquiso nas lojas pelo servidor, sem abrir abas no seu computador.",
    art: ArtAsk,
  },
  {
    id: "decide",
    title: "Poucas opções, com o porquê",
    text: "Em vez de 200 resultados, eu trago as melhores e digo por que cada uma serve, lado a lado. Você pede para trocar, comparar ou ver vídeos de um produto.",
    art: ArtDecide,
  },
  {
    id: "watch",
    title: "Painéis: eu fico de olho",
    text: "No + de “Seus painéis”, diga o que quer acompanhar e a partir de que preço. Eu confiro todo dia e aviso aqui e por e-mail quando valer a pena.",
    art: ArtWatch,
  },
  {
    id: "remember",
    title: "Eu lembro de você",
    text: "Tamanhos, gostos, o que você já tem. Quanto mais conversamos, melhores ficam as sugestões. Tudo fica visível no seu perfil.",
    art: ArtRemember,
  },
  {
    id: "extension",
    title: "Nas lojas, com a extensão",
    text: "No Chrome, a extensão lê a página da loja com você, escolhe variação e põe no carrinho. Entre com o mesmo e-mail e senha. Eu nunca pago nada.",
    art: ArtExtension,
  },
];

export function Onboarding(props: {
  userId: string;
  /** "reopened" when the person asked for it again from the profile. */
  origin?: "first_visit" | "reopened";
  onClose: () => void;
  /** Opens a conversation with an example request. Without it, the last step has no examples. */
  onStart?: (text: string) => void;
}) {
  const { userId, origin = "first_visit" } = props;
  const [index, setIndex] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const last = STEPS.length; // the final step (examples) comes after the five steps
  const onClose = useRef(props.onClose);
  useEffect(() => {
    onClose.current = props.onClose;
  }, [props.onClose]);

  useEffect(() => {
    track(origin === "reopened" ? "onboarding_reopened" : "onboarding_started", { steps: STEPS.length + 1 });
  }, [origin]);
  useEffect(() => {
    track("onboarding_step_viewed", { step: index + 1, step_id: STEPS[index]?.id ?? "start" });
    heading.current?.focus();
  }, [index]);

  const finish = useCallback(
    (how: "completed" | "skipped", extra: Record<string, string | number | boolean> = {}) => {
      markSeen(userId, how);
      track(how === "completed" ? "onboarding_completed" : "onboarding_skipped", { step: index + 1, origin, ...extra });
      onClose.current();
    },
    [index, origin, userId],
  );

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish("skipped");
      if (event.target instanceof HTMLButtonElement) return;
      if (event.key === "ArrowRight") setIndex((value) => Math.min(value + 1, last));
      if (event.key === "ArrowLeft") setIndex((value) => Math.max(value - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [finish, last]);

  // Keeps Tab inside the dialog.
  const trap = (event: React.KeyboardEvent) => {
    if (event.key !== "Tab" || !panel.current) return;
    const focusable = [...panel.current.querySelectorAll<HTMLElement>("button, [href], [tabindex='0']")];
    const first = focusable[0];
    const end = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      end?.focus();
    } else if (!event.shiftKey && document.activeElement === end) {
      event.preventDefault();
      first?.focus();
    }
  };

  const step = STEPS[index];
  const Art = step?.art;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div aria-hidden="true" className="absolute inset-0 bg-scrim" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        onKeyDown={trap}
        className="sheet-in relative flex max-h-[94dvh] w-full max-w-xl flex-col overflow-y-auto rounded-t-card bg-paper shadow-floating sm:rounded-card"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <ol className="flex flex-1 gap-1.5" aria-label={`Passo ${index + 1} de ${last + 1}`}>
            {[...STEPS, null].map((item, at) => (
              <li key={item?.id ?? "start"} className="h-1 flex-1 overflow-hidden rounded-full bg-rule">
                <span
                  className={`block h-full rounded-full bg-ink transition-[width] duration-300 ease-soft ${at <= index ? "w-full" : "w-0"}`}
                />
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => finish("skipped")}
            className="min-h-11 rounded-full px-3 text-ui text-graphite hover:text-ink focus-visible:outline-2 focus-visible:outline-ink"
          >
            Pular
          </button>
        </div>

        {/* A new key per step replays its drawing from the start. */}
        <div key={index} className="flex flex-col gap-6 px-5 pb-5 pt-4 sm:px-8 sm:pb-8">
          <div aria-hidden="true" className="flex min-h-64 items-center justify-center rounded-card bg-sunken px-4 py-8">
            {Art ? (
              <Art />
            ) : (
              <span className="ob-pop text-ink">
                <ToneWordmark className="h-16 w-auto" />
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h2 id="tour-titulo" ref={heading} tabIndex={-1} className="ob-rise display-sm font-display text-ink outline-none">
              {step ? step.title : "Por onde começar?"}
            </h2>
            <p className="ob-rise text-body text-graphite" style={d(100)}>
              {step
                ? step.text
                : "Toque num exemplo para eu pesquisar agora, ou escreva o seu. Se algo der errado ou faltar alguma coisa, o botão Feedback, no topo, fala direto com a equipe."}
            </p>
          </div>
          {!step && props.onStart ? (
            <ul className="flex flex-col gap-2">
              {EXAMPLES.map((example, at) => (
                <li key={example} className="ob-rise" style={d(200 + at * 100)}>
                  <button
                    type="button"
                    onClick={() => {
                      finish("completed", { started_example: at + 1 });
                      props.onStart?.(example);
                    }}
                    className="press w-full rounded-panel bg-surface px-4 py-3 text-start text-body text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    {example}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIndex((value) => Math.max(value - 1, 0))}
              className={`min-h-11 rounded-full px-4 text-ui text-ink focus-visible:outline-2 focus-visible:outline-ink ${index === 0 ? "invisible" : ""}`}
            >
              Voltar
            </button>
            {step ? (
              <button
                type="button"
                onClick={() => setIndex((value) => value + 1)}
                className="press min-h-11 rounded-full bg-ink px-6 text-ui text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => finish("completed")}
                className="press min-h-11 rounded-full bg-ink px-6 text-ui text-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Escrever o meu
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
