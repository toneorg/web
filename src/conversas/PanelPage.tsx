"use client";
// A panel's own page (10/11/2026: "eles são coisas diferentes"). Results first, in the order the
// person asked for them: the price over time, what the last reading found and the products. No
// conversation inside: "Perguntar" and "Conversar sobre este painel" open one that knows the panel
// and stays kept here, never in the conversation list.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { type Me, type PanelSession, type Watch, type WatchPrices, type WatchResult, watchFacts, watchTitle } from "@/tone/shared";
import { track } from "./analytics";
import { ApiError, api } from "./api";
import { type PanelState, readingOf, usePanelActions } from "./panel-actions";
import { pickForSession } from "./picked-handoff";
import { PriceChart } from "./PriceChart";
import { WATCHES_CHANGED } from "./Program";
import { Shell } from "./Shell";
import { type Match, OfferList } from "./WatchReadings";

const STATUS: Record<Watch["status"], string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  deleted: "Apagado",
};
const when = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
const storeName = (store: string) => (store === "google.com" ? "Google Shopping" : store.replace(/^www\./, ""));
const quiet =
  "press inline-flex min-h-11 items-center rounded-full bg-surface px-5 text-ui text-ink shadow-raised disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/** The page as drawn from its data; the loading and the actions live in `PanelPage`. */
export function PanelView(props: {
  watch: Watch;
  results: WatchResult[];
  prices: WatchPrices | null;
  sessions: PanelSession[];
  menu: ReactNode;
  footer: ReactNode;
  onAsk: (match: Match) => void;
  onTalk: () => void;
  /** A conversation is being opened: the buttons wait. */
  opening: boolean;
}) {
  const { watch } = props;
  const rule = watch.confirmed ?? watch.draft;
  const title = watchTitle(rule);
  const condition = watchFacts(rule).find(([label]) => label === "Quando avisar")?.[1];
  const { latest, emptyRound } = readingOf(props.results);
  const matches = latest?.summary.matches ?? [];
  const cheapest = [...matches].filter((m) => m.amount !== null).sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0))[0];
  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-3xl flex-col gap-10 py-2" data-ph-mask>
      <header className="flex flex-col gap-3">
        <Link href="/conversas" className="min-h-11 self-start content-center text-ui text-ink underline-offset-4 hover:underline">
          ← Conversas
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="display-sm text-pretty text-ink">{title}</h1>
            <p className="text-small text-graphite">
              {STATUS[watch.status]}
              {condition ? ` · ${condition}` : ""}
            </p>
          </div>
          {props.menu}
        </div>
        {props.footer}
      </header>

      {props.prices && props.prices.points.length >= 2 ? (
        <section aria-label="Variação do preço" className="rounded-card bg-surface p-5 shadow-raised">
          <PriceChart prices={props.prices} />
        </section>
      ) : latest ? (
        <p className="text-small text-graphite">O gráfico do preço aparece a partir do segundo dia de leitura.</p>
      ) : null}

      <section aria-labelledby="titulo-leitura" className="flex flex-col gap-3">
        <h2 id="titulo-leitura" className="text-subheading text-ink">
          Última leitura
        </h2>
        {latest ? (
          <>
            <p className="text-small text-graphite tabular-nums">
              {matches.length} {matches.length === 1 ? "oferta" : "ofertas"} em {when(latest.observedAt)}
              {cheapest ? ` · menor ${cheapest.priceText} em ${storeName(cheapest.store)}` : ""}
              {latest.conditionMet ? " · condição atingida" : ""}
            </p>
            {emptyRound ? (
              <p className="text-caption text-graphite">
                A leitura mais recente não achou ofertas no índice; estas são as últimas vistas.
              </p>
            ) : null}
            {matches.length ? (
              <OfferList watch={watch} matches={matches} sessionId={null} onAsk={props.opening ? undefined : props.onAsk} surface="surface" limit={8} />
            ) : (
              <p className="text-small text-graphite">{latest.summary.message}</p>
            )}
            <p className="text-caption text-graphite">
              Preços observados no índice do Google Shopping; o preço final, o frete e o estoque se confirmam na loja.
            </p>
          </>
        ) : (
          <p className="text-small text-graphite">
            {watch.status === "draft"
              ? "Este painel ainda é um rascunho: confirme para eu começar a acompanhar."
              : `Primeira leitura${watch.nextCheckAt ? ` em ${when(watch.nextCheckAt)}` : " em breve"}.`}
          </p>
        )}
      </section>

      <div>
        <button type="button" className={quiet} disabled={props.opening} onClick={props.onTalk}>
          {props.opening ? "Abrindo…" : "Conversar sobre este painel"}
        </button>
      </div>

      {props.sessions.length ? (
        <section aria-labelledby="titulo-conversas-painel" className="flex flex-col gap-3">
          <h2 id="titulo-conversas-painel" className="text-subheading text-ink">
            Conversas deste painel
          </h2>
          <ul className="flex flex-col gap-2">
            {props.sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={`/conversas/${session.id}?painel=${watch.id}`}
                  className="flex flex-col gap-1 rounded-panel bg-surface p-4 shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  <span className="text-body text-ink">{session.title}</span>
                  <span className="text-caption text-graphite">
                    {when(session.lastAt)} · {session.messages} {session.messages === 1 ? "mensagem" : "mensagens"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

/** The page with its data: the panel, its readings, its price line and its conversations. */
export function PanelPage(props: { watchId: string }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [results, setResults] = useState<WatchResult[]>([]);
  const [prices, setPrices] = useState<WatchPrices | null>(null);
  const [sessions, setSessions] = useState<PanelSession[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "failed">("loading");
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    api.me().then((value) => live && setMe(value), () => undefined);
    Promise.all([
      api.watch(props.watchId),
      api.watchResults(props.watchId).catch(() => []),
      api.watchPrices(props.watchId).catch(() => null),
      api.panelSessions(props.watchId).catch(() => []),
    ])
      .then(([watch, readings, line, kept]) => {
        if (!live) return;
        if (!watch || watch.status === "deleted") return setState("missing");
        setPanel({ watch, ...readingOf(readings) });
        setResults(readings);
        setPrices(line);
        setSessions(kept);
        setState("ready");
        track("panel_page_opened", { status: watch.status, readings: readings.length, conversations: kept.length });
      })
      .catch(() => live && setState("failed"));
    return () => {
      live = false;
    };
  }, [props.watchId]);

  const onChange = (next: PanelState | null) => {
    window.dispatchEvent(new Event(WATCHES_CHANGED));
    if (!next) return router.push("/conversas");
    setPanel(next);
    // "Verificar agora" may bring a new reading: read the list again.
    void api.watchResults(props.watchId, { fresh: true }).then(setResults, () => undefined);
  };
  const name = panel ? watchTitle(panel.watch.confirmed ?? panel.watch.draft) : "";
  const actions = usePanelActions(panel ?? { watch: placeholder, latest: null }, onChange, name);

  /** A conversation of this panel, about one product when the person tapped "Perguntar". */
  const open = async (match?: Match) => {
    if (opening) return;
    setOpening(true);
    setError(null);
    try {
      const { sessionId } = await api.newSession(false, props.watchId);
      if (match)
        pickForSession(sessionId, {
          url: match.url,
          title: match.title.slice(0, 300),
          price: match.amount,
          image: match.imageUrl ?? null,
        });
      track("panel_conversation_started", { from: match ? "product" : "panel" });
      router.push(`/conversas/${sessionId}?painel=${props.watchId}`);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Não consegui abrir a conversa. Tente de novo.");
      setOpening(false);
    }
  };

  return (
    <Shell me={me} current="conversas">
      {state === "loading" ? (
        <p className="py-2 text-small text-graphite">Carregando o painel…</p>
      ) : state === "missing" ? (
        <div className="flex flex-col gap-3 py-2">
          <p className="text-body text-ink">Este painel não existe mais.</p>
          <Link href="/conversas" className={`${quiet} self-start`}>
            Voltar para o início
          </Link>
        </div>
      ) : state === "failed" || !panel ? (
        <p role="alert" className="py-2 text-small text-alert">
          Não consegui abrir o painel agora. Tente de novo em instantes.
        </p>
      ) : (
        <>
          <PanelView
            watch={panel.watch}
            results={results}
            prices={prices}
            sessions={sessions}
            menu={actions.menu}
            footer={actions.footer}
            onAsk={(match) => void open(match)}
            onTalk={() => void open()}
            opening={opening}
          />
          {error ? (
            <p role="alert" className="mx-auto w-full max-w-3xl text-small font-medium text-alert">
              {error}
            </p>
          ) : null}
        </>
      )}
    </Shell>
  );
}

/** Hooks run before the panel arrives; this stands in for it and is never drawn. */
const placeholder: Watch = {
  id: "",
  sessionId: null,
  status: "draft",
  version: 1,
  draft: {
    goal: "-",
    kind: "monitoring",
    query: "-",
    brands: [],
    categories: [],
    variants: [],
    products: [],
    storeScope: { kind: "unrestricted" },
    condition: { kind: "none" },
    frequency: "daily",
    notify: { email: false, digest: false },
  },
  confirmed: null,
  confirmedVersion: null,
  review: { canConfirm: false, clarifications: [], sources: [], notes: [] },
  createdAt: "",
  updatedAt: "",
  confirmedAt: null,
};
