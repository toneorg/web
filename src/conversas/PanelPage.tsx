"use client";
// A panel's own page (10/11/2026: "eles são coisas diferentes"). 20/11/2026: it answers "vale comprar
// agora, e qual?" first: the verdict, then each product with its best confirmed price and the change
// since the day before, then every offer and the history, folded. No conversation of its own:
// "Perguntar" takes the product to the single chat.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { type Me, type Watch, type WatchResult, type WatchSummary, watchFacts, watchTitle } from "@/tone/shared";
import { track } from "./analytics";
import { api } from "./api";
import { type PanelState, readingOf, usePanelActions } from "./panel-actions";
import { lowestOf } from "./Panels";
import { PanelHistory, PanelProducts } from "./PanelProducts";
import { PanelVerdict } from "./PanelVerdict";
import { pickForChat } from "./picked-handoff";
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
const quiet =
  "press inline-flex min-h-11 items-center rounded-full bg-surface px-5 text-ui text-ink shadow-raised disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const fold =
  "group rounded-card bg-surface shadow-raised [&_summary::-webkit-details-marker]:hidden";
const foldSummary =
  "flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 text-ui text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/** The page as drawn from its data; the loading and the actions live in `PanelPage`. */
export function PanelView(props: {
  watch: Watch;
  results: WatchResult[];
  summary: WatchSummary | null;
  menu: ReactNode;
  footer: ReactNode;
  onAsk: (match: Match) => void;
}) {
  const { watch, summary } = props;
  const rule = watch.confirmed ?? watch.draft;
  const title = watchTitle(rule);
  const condition = watchFacts(rule).find(([label]) => label === "Quando avisar")?.[1];
  const { latest, emptyRound } = readingOf(props.results);
  const matches = latest?.summary.matches ?? [];
  const [chart, setChart] = useState(summary?.verdict.productIndex ?? 0);
  const target =
    rule.condition.kind === "near_price" || rule.condition.kind === "target_price" ? rule.condition.amount : null;
  const stores = new Set(matches.map((match) => match.store)).size;
  const earlier = props.results.filter((result) => result.id !== latest?.id).slice(0, 8);
  return (
    <main id="conteudo" className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-2" data-ph-mask>
      <header className="flex flex-col gap-3">
        <Link href="/conversas" className="min-h-11 self-start content-center text-ui text-ink underline-offset-4 hover:underline">
          ← Conversa
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="display-sm text-pretty text-ink">{title}</h1>
            <p className="text-small text-graphite">
              {STATUS[watch.status]}
              {condition ? ` · ${condition}` : ""}
              {latest ? ` · lido em ${when(latest.observedAt)}` : ""}
            </p>
          </div>
          {props.menu}
        </div>
        {props.footer}
      </header>

      {latest ? (
        <>
          {summary ? (
            <>
              <PanelVerdict summary={summary} onStore={() => track("panel_verdict_store_clicked", { verdict: summary.verdict.kind })} />
              <PanelProducts
                products={summary.products}
                selected={chart}
                onSelect={(index) => {
                  setChart(index);
                  document.getElementById("titulo-historico")?.scrollIntoView({ block: "start" });
                }}
              />
              <PanelHistory products={summary.products} selected={chart} onSelect={setChart} target={target} />
            </>
          ) : null}
          {emptyRound ? (
            <p className="text-caption text-graphite">A leitura mais recente não achou ofertas; estas são as últimas vistas.</p>
          ) : null}
          <div className="flex flex-col gap-3">
            <details className={fold}>
              <summary className={foldSummary}>
                <span>Todas as ofertas</span>
                <span className="text-small text-graphite tabular-nums">
                  {matches.length} em {stores} {stores === 1 ? "loja" : "lojas"}
                </span>
              </summary>
              <div className="flex flex-col gap-3 px-3 pb-3">
                {matches.length ? (
                  <OfferList watch={watch} matches={matches} sessionId={null} onAsk={props.onAsk} surface="paper" limit={20} />
                ) : (
                  <p className="px-2 text-small text-graphite">{latest.summary.message}</p>
                )}
                <p className="px-2 text-caption text-graphite">
                  Preços anunciados pelas lojas; o preço final, o frete e o estoque se confirmam na loja.
                </p>
              </div>
            </details>
            {earlier.length ? (
            <details className={fold}>
              <summary className={foldSummary}>
                <span>Leituras anteriores</span>
                <span className="text-small text-graphite tabular-nums">{earlier.length}</span>
              </summary>
              <div className="flex flex-col gap-4 px-5 pb-5">
                {earlier.length ? (
                  <ul className="flex flex-col gap-1 text-caption text-graphite">
                    {earlier.map((result) => (
                      <li key={result.id} className="tabular-nums">
                        {when(result.observedAt)}: {lowestOf(result) ? `menor preço ${lowestOf(result)}` : "sem ofertas"}
                        {result.conditionMet ? " · condição atingida" : ""}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </details>
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-small text-graphite">
          {watch.status === "draft"
            ? "Este painel ainda é um rascunho: confirme para eu começar a acompanhar."
            : watch.status === "active" && !watch.lastCheckAt
              ? "Fazendo a primeira leitura; os preços aparecem aqui em instantes."
              : `Primeira leitura${watch.nextCheckAt ? ` em ${when(watch.nextCheckAt)}` : " em breve"}.`}
        </p>
      )}
    </main>
  );
}

/** The page with its data: the panel, its readings and what it says first. */
export function PanelPage(props: { watchId: string }) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [results, setResults] = useState<WatchResult[]>([]);
  const [summary, setSummary] = useState<WatchSummary | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "failed">("loading");

  useEffect(() => {
    let live = true;
    api.me().then((value) => live && setMe(value), () => undefined);
    Promise.all([
      api.watch(props.watchId),
      api.watchResults(props.watchId).catch(() => []),
      api.watchSummary(props.watchId).catch(() => null),
    ])
      .then(([watch, readings, said]) => {
        if (!live) return;
        if (!watch || watch.status === "deleted") return setState("missing");
        setPanel({ watch, ...readingOf(readings) });
        setResults(readings);
        setSummary(said);
        setState("ready");
        track("panel_page_opened", { status: watch.status, readings: readings.length, verdict: said?.verdict.kind ?? null });
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
    // "Verificar agora" may bring a new reading: read the list and the verdict again.
    void api.watchResults(props.watchId, { fresh: true }).then(setResults, () => undefined);
    void api.watchSummary(props.watchId, { fresh: true }).then(setSummary, () => undefined);
  };
  const name = panel ? watchTitle(panel.watch.confirmed ?? panel.watch.draft) : "";
  const actions = usePanelActions(panel ?? { watch: placeholder, latest: null }, onChange, name);

  /** "Perguntar" on an offer: the product goes to the single chat. */
  const ask = (match: Match) => {
    pickForChat({ url: match.url, title: match.title.slice(0, 300), price: match.amount, image: match.imageUrl ?? null });
    track("panel_asked_in_chat");
    router.push("/conversas");
  };

  return (
    <Shell me={me}>
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
        <PanelView
          watch={panel.watch}
          results={results}
          summary={summary}
          menu={actions.menu}
          footer={actions.footer}
          onAsk={ask}
        />
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
