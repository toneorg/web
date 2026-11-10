"use client";
// T16/T11: the person's own panels, on the left of the web app: the center of
// watches. Each card shows what the panel follows and its lowest price, and leads
// to the panel's own page (10/11/2026: panels and conversations apart). From the
// "⋯" the person pauses, resumes, mutes the e-mail, checks now or deletes.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type BudgetStatement, type Me, type Watch, type WatchPrices, type WatchResult, watchFacts, watchTitle } from "@/tone/shared";
import { PlusIcon } from "@/components/icons";
import { track } from "./analytics";
import { api } from "./api";
import { NewPanelSheet } from "./NewPanel";
import { Sparkline } from "./Sparkline";
import { readingOf, usePanelActions } from "./panel-actions";
import { WATCHES_CHANGED } from "./Program";

const STATUS: Record<Watch["status"], string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  deleted: "Apagado",
};
const STALE_MS = 48 * 3600_000;
const usd = (value: number) =>
  `US$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const when = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export interface Panel {
  watch: Watch;
  latest: WatchResult | null;
  /** The newest round found no offer, so `latest` is an older reading with a price. */
  emptyRound?: boolean;
}

/** The lowest comparable price of a reading, as the store showed it. */
export function lowestOf(result: WatchResult | null): string | null {
  return lowestMatch(result)?.priceText ?? null;
}

/** The cheapest offer of a reading with a known price, and why it does not count for the alert, if so. */
export function lowestMatch(result: WatchResult | null) {
  const priced = (result?.summary.matches ?? []).filter((match) => match.amount !== null);
  priced.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
  const match = priced[0];
  if (!match) return null;
  const limitation = (match as { limitation?: unknown }).limitation;
  return { priceText: match.priceText, limitation: typeof limitation === "string" && limitation ? limitation : null };
}

/** What the center says about a watch's runs, besides its latest reading. */
export function panelFacts(watch: Watch, now = new Date()) {
  const lastCheck = watch.lastCheckAt ?? null;
  return {
    checked: lastCheck ? `Última verificação em ${when(lastCheck)}` : null,
    next: watch.status === "active" && watch.nextCheckAt ? `Próxima em ${when(watch.nextCheckAt)}` : null,
    stale: Boolean(lastCheck && watch.status === "active" && now.getTime() - Date.parse(lastCheck) > STALE_MS),
    problem:
      watch.lastState === "source_failed"
        ? "A fonte não respondeu na última verificação. Vale a leitura anterior."
        : watch.lastState === "budget_exceeded"
          ? "O saldo da semana não cobriu a última verificação."
          : null,
    muted: Boolean(watch.mutedAt),
    email: Boolean(watch.confirmed?.notify.email),
  };
}

export { actionsOf, readingOf } from "./panel-actions";

/**
 * A panel in the column: what it follows, the lowest price with its small line, and when it runs.
 * The card leads to the panel's page; a draft reopens the "Novo painel" folha instead.
 */
function PanelCard(props: {
  panel: Panel;
  fresh?: boolean;
  onChange: (panel: Panel | null) => void;
  onReview: (watch: Watch) => void;
}) {
  const { watch, latest } = props.panel;
  const rule = watch.confirmed ?? watch.draft;
  const what = watchTitle(rule);
  const condition = watchFacts(rule).find(([label]) => label === "Quando avisar")?.[1];
  const lowest = lowestOf(latest);
  const limitation = lowestMatch(latest)?.limitation;
  const facts = panelFacts(watch);
  // The line reads again whenever a new reading arrives.
  const [prices, setPrices] = useState<WatchPrices | null>(null);
  useEffect(() => {
    if (!watch.confirmed) return;
    let live = true;
    api
      .watchPrices(watch.id)
      .then((value) => {
        if (live) setPrices(value);
      })
      // A server without the route yet: the card stays as it was.
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [watch.id, watch.confirmed, latest?.id]);

  const { busy, menu, footer } = usePanelActions(props.panel, props.onChange, what);
  // The whole card is the way in: the control's area covers it (after:inset-0).
  const cover =
    "min-h-11 flex-1 content-center text-start text-ui text-ink after:absolute after:inset-0 after:rounded-card hover:underline underline-offset-2 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ink";

  return (
    <article
      className={`relative flex flex-col gap-3 rounded-card bg-surface p-5 shadow-raised${props.fresh ? " rise" : ""}`}
      aria-busy={busy !== null}
    >
      <div className="flex items-start gap-2">
        {watch.status === "draft" ? (
          <button
            type="button"
            className={cover}
            onClick={() => {
              track("panel_opened", { status: watch.status });
              props.onReview(watch);
            }}
          >
            {what}
          </button>
        ) : (
          <Link href={`/paineis/${watch.id}`} onClick={() => track("panel_opened", { status: watch.status })} className={cover}>
            {what}
          </Link>
        )}
        {/* "Ativo" is the normal state; only the others need saying. */}
        {watch.status !== "active" ? (
          <span className="mt-3 shrink-0 rounded-tag bg-sunken px-2 py-0.5 text-label text-graphite">
            {STATUS[watch.status]}
          </span>
        ) : null}
        {menu}
      </div>
      {lowest ? (
        <div className="flex flex-col gap-1">
          <span className="display-sm font-display text-ink tabular-nums">{lowest}</span>
          <span className="text-caption text-graphite">
            Menor preço{latest ? ` em ${when(latest.observedAt)}` : ""}
            {limitation ? ` · ${limitation}` : ""}
          </span>
          {prices && prices.points.length >= 2 ? (
            <span className="mt-1 block">
              <Sparkline points={prices.points} />
            </span>
          ) : null}
          {props.panel.emptyRound ? (
            <span className="text-caption text-graphite">
              A leitura mais recente não achou ofertas no índice; este é o último preço visto.
            </span>
          ) : null}
        </div>
      ) : latest ? (
        <span className="text-caption text-graphite">{latest.summary.message}</span>
      ) : watch.status === "draft" ? (
        <span className="text-caption text-graphite">Rascunho: toque para revisar e confirmar. Nada roda antes disso.</span>
      ) : (
        <span className="text-caption text-graphite">
          Primeira leitura{watch.nextCheckAt ? ` em ${when(watch.nextCheckAt)}` : " em breve"}.
        </span>
      )}
      {condition && watch.status !== "draft" ? <span className="text-caption text-graphite">{condition}</span> : null}
      {latest?.conditionMet ? <span className="text-ui text-ink">Condição atingida</span> : null}
      {facts.problem ? <span className="text-caption text-ink">{facts.problem}</span> : null}
      {facts.stale ? (
        <span className="text-caption text-ink">Leitura com mais de 48 h: o preço pode ter mudado.</span>
      ) : null}
      {/* Only the exception: "Avisos aqui e por e-mail" on every card was noise (10/11/2026). */}
      {facts.email && facts.muted ? (
        <span className="text-caption text-graphite">E-mail silenciado: os avisos ficam só aqui.</span>
      ) : null}
      {footer}
    </article>
  );
}

/** One dollar a week is the full use (the beta cap): what is left of the week, as a percentage. */
export function weekLeftPercent(budget: BudgetStatement): number {
  if (budget.weeklyCapUsd <= 0) return 0;
  return Math.round(Math.max(0, Math.min(1, budget.availableUsd / budget.weeklyCapUsd)) * 100);
}

/** The panel being built, just before the confirmed card takes its place. */
function BuildingCard() {
  return (
    <article
      className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-raised"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="text-ui text-ink">Construindo o painel…</p>
      <span className="bar">
        <span className="fill ink build-bar w-1/3" />
      </span>
      <span className="block h-4 w-2/3 rounded-full bg-sunken" />
      <span className="block h-4 w-1/3 rounded-full bg-sunken" />
    </article>
  );
}

/** The panels as last shown, so another screen draws them at once while they are read again. */
let lastPanels: { userId: string; panels: Panel[] } | null = null;

export function Panels(props: { me: Me }) {
  const userId = props.me.id;
  const [panels, setPanels] = useState<Panel[] | null>(() =>
    lastPanels?.userId === userId ? lastPanels.panels : null,
  );
  useEffect(() => {
    if (panels) lastPanels = { userId, panels };
  }, [panels, userId]);
  const [failed, setFailed] = useState(false);
  const [planning, setPlanning] = useState(false);
  /** A draft panel reopened in the "Novo painel" folha, at its review. */
  const [reviewing, setReviewing] = useState<Watch | null>(null);
  /** The panel being built now, and the one that has just been built (it rises in). */
  const [building, setBuilding] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const buildTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (buildTimer.current) window.clearTimeout(buildTimer.current);
    },
    [],
  );
  // Reloads when a watch is saved or confirmed in the conversation next to it.
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const again = () => setReload((value) => value + 1);
    window.addEventListener(WATCHES_CHANGED, again);
    return () => window.removeEventListener(WATCHES_CHANGED, again);
  }, []);
  useEffect(() => {
    let live = true;
    api
      .watches()
      .then(async (watches) => {
        const shown = watches.filter((watch) => watch.status !== "deleted");
        const latest = await Promise.all(
          shown.map((watch) =>
            watch.confirmed ? api.watchResults(watch.id).then(readingOf, () => null) : null,
          ),
        );
        if (live) setPanels(shown.map((watch, index) => ({ watch, latest: latest[index]?.latest ?? null, emptyRound: latest[index]?.emptyRound })));
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [reload]);
  const replace = (id: string, next: Panel | null) =>
    setPanels((current) =>
      (current ?? []).flatMap((panel) => (panel.watch.id === id ? (next ? [next] : []) : [panel])),
    );
  /** A confirmed watch from the "+" folha: it appears first, as a panel being built. */
  const onBuilt = (watch: Watch) => {
    // A reviewed draft is the same panel: it moves to the top instead of showing twice.
    setPanels((current) => [{ watch, latest: null }, ...(current ?? []).filter((panel) => panel.watch.id !== watch.id)]);
    setFresh(null);
    setBuilding(watch.id);
    if (buildTimer.current) window.clearTimeout(buildTimer.current);
    buildTimer.current = window.setTimeout(() => {
      setBuilding(null);
      setFresh(watch.id);
    }, 1400);
  };
  const budget = props.me.budget;
  const leftPercent = budget ? weekLeftPercent(budget) : 0;
  return (
    <>
      <section aria-labelledby="titulo-paineis" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-paineis" className="text-subheading text-ink">
            Seus painéis
          </h2>
          <button
            type="button"
            aria-label="Criar um painel"
            data-tour="paineis"
            onClick={() => {
              track("panel_create_opened", { panels: panels?.length ?? 0 });
              setPlanning(true);
            }}
            className="press grid size-11 place-items-center rounded-full bg-surface text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <PlusIcon className="size-5" />
          </button>
        </div>
        {failed ? (
          <p className="text-small text-graphite">Não consegui carregar seus painéis agora.</p>
        ) : !panels ? (
          <p className="text-small text-graphite">Carregando…</p>
        ) : panels.length === 0 ? (
          <p className="rounded-card bg-surface p-5 text-small text-graphite shadow-raised">
            Nenhum painel ainda. Use o + e diga o que quer acompanhar, como “me avise quando o fone baixar de R$ 300”.
          </p>
        ) : (
          // Goals and prices are the person's own: masked in session replay, like the conversation.
          <ul className="flex flex-col gap-3" data-ph-mask>
            {panels.map((panel) => (
              <li key={panel.watch.id}>
                {building === panel.watch.id ? (
                  <BuildingCard />
                ) : (
                  <PanelCard
                    panel={panel}
                    fresh={fresh === panel.watch.id}
                    onChange={(next) => replace(panel.watch.id, next)}
                    onReview={setReviewing}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {budget ? (
        <section aria-labelledby="titulo-saldo" className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-raised">
          <h2 id="titulo-saldo" className="text-subheading text-ink">
            Uso da tone
          </h2>
          <p className="text-small text-graphite">Nesta semana ainda restam</p>
          <p className="display-sm font-display text-ink tabular-nums">
            {leftPercent}% <span className="text-ui text-graphite">do uso</span>
          </p>
          <span
            className="bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={leftPercent}
            aria-valuetext={`${leftPercent}% de uso restante nesta semana`}
          >
            <span className="fill ink" style={{ width: `${leftPercent}%` }} />
          </span>
          <p className="text-caption text-graphite">
            {usd(budget.availableUsd)} de {usd(budget.weeklyCapUsd)} nesta semana
          </p>
        </section>
      ) : null}
      {planning ? <NewPanelSheet onClose={() => setPlanning(false)} onBuilt={onBuilt} /> : null}
      {reviewing ? <NewPanelSheet draft={reviewing} onClose={() => setReviewing(null)} onBuilt={onBuilt} /> : null}
    </>
  );
}
