"use client";
// T16/T11: the person's own panels, on the left of the web app: the center of
// watches. Each one is something the person created in a conversation, with its
// latest reading, when it was checked and when it runs again. From here the
// person pauses, resumes, mutes the e-mail, checks now or deletes; changing the
// rule itself happens in the conversation that made it, with a new confirmation.
import Link from "next/link";
import { useEffect, useState } from "react";
import { describeWatch, type Me, type Watch, type WatchResult } from "@/tone/shared";
import { api } from "./api";

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

interface Panel {
  watch: Watch;
  latest: WatchResult | null;
}
type Action = "pause" | "resume" | "mute" | "unmute" | "check" | "delete";

/** The lowest comparable price of a reading, as the store showed it. */
export function lowestOf(result: WatchResult | null): string | null {
  const priced = (result?.summary.matches ?? []).filter((match) => match.amount !== null);
  priced.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
  return priced[0]?.priceText ?? null;
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

/** The actions a watch allows in its state. */
export function actionsOf(watch: Watch): Action[] {
  if (watch.status === "active") {
    const mute: Action[] = watch.confirmed?.notify.email ? [watch.mutedAt ? "unmute" : "mute"] : [];
    return ["check", "pause", ...mute, "delete"];
  }
  if (watch.status === "paused") return ["resume", "delete"];
  return ["delete"];
}

const LABEL: Record<Action, [idle: string, busy: string]> = {
  check: ["Verificar agora", "Verificando…"],
  pause: ["Pausar", "Pausando…"],
  resume: ["Retomar", "Retomando…"],
  mute: ["Silenciar e-mail", "Silenciando…"],
  unmute: ["Voltar a avisar", "Ativando…"],
  delete: ["Excluir", "Excluindo…"],
};
const BUTTON =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function PanelCard(props: { panel: Panel; onChange: (panel: Panel | null) => void }) {
  const { watch, latest } = props.panel;
  const [busy, setBusy] = useState<Action | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rule = watch.confirmed ?? watch.draft;
  const lines = describeWatch(rule);
  const what = lines[0]?.replace(/^(Acompanhar|Procurar novidades): /, "");
  const condition = lines.find((line) => line.startsWith("Avisar"));
  const lowest = lowestOf(latest);
  const facts = panelFacts(watch);

  const run = async (action: Action) => {
    setBusy(action);
    setError(null);
    try {
      if (action === "delete") {
        await api.deleteWatch(watch.id);
        props.onChange(null);
        return;
      }
      if (action === "check") {
        await api.checkWatch(watch.id);
        const [fresh, results] = await Promise.all([api.watch(watch.id), api.watchResults(watch.id)]);
        if (fresh) props.onChange({ watch: fresh, latest: results[0] ?? latest });
        return;
      }
      props.onChange({ watch: await api.watchAction(watch.id, action), latest });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não deu certo agora.");
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  };

  return (
    <article className="flex flex-col gap-2 rounded-card bg-surface p-5 shadow-raised" aria-busy={busy !== null}>
      <span className="flex items-start justify-between gap-2">
        {watch.sessionId ? (
          <Link
            href={`/conversas/${watch.sessionId}`}
            className="text-ui text-ink underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            {what}
          </Link>
        ) : (
          <span className="text-ui text-ink">{what}</span>
        )}
        <span className="shrink-0 rounded-tag bg-sunken px-2 py-0.5 text-label text-graphite">
          {STATUS[watch.status]}
        </span>
      </span>
      {condition ? <span className="text-caption text-graphite">{condition}</span> : null}
      {lowest ? (
        <span className="rounded-panel bg-sunken p-4">
          <span className="block text-caption text-graphite">Menor preço observado no índice</span>
          <span className="display-sm block font-display text-ink tabular-nums">{lowest}</span>
          {latest ? <span className="block text-caption text-graphite">em {when(latest.observedAt)}</span> : null}
        </span>
      ) : latest ? (
        <span className="text-caption text-graphite">{latest.summary.message}</span>
      ) : watch.status === "draft" ? (
        <span className="text-caption text-graphite">Esperando sua confirmação na conversa.</span>
      ) : (
        <span className="text-caption text-graphite">
          Primeira leitura{watch.nextCheckAt ? ` em ${when(watch.nextCheckAt)}` : " em breve"}.
        </span>
      )}
      {latest?.conditionMet ? <span className="text-ui text-ink">Condição atingida</span> : null}
      {facts.problem ? <span className="text-caption text-ink">{facts.problem}</span> : null}
      {facts.stale ? (
        <span className="text-caption text-ink">Leitura com mais de 48 h: o preço pode ter mudado.</span>
      ) : null}
      {facts.checked || facts.next ? (
        <span className="text-caption text-graphite">{[facts.checked, facts.next].filter(Boolean).join(" · ")}</span>
      ) : null}
      {facts.email ? (
        <span className="text-caption text-graphite">
          {facts.muted ? "E-mail silenciado: os avisos ficam só aqui." : "Avisos aqui e por e-mail."}
        </span>
      ) : null}
      <div className="mt-1 flex flex-wrap gap-2">
        {confirmDelete ? (
          <>
            <button
              type="button"
              className={`${BUTTON} text-alert`}
              disabled={busy !== null}
              onClick={() => run("delete")}
            >
              {busy === "delete" ? LABEL.delete[1] : "Confirmar exclusão"}
            </button>
            <button type="button" className={BUTTON} disabled={busy !== null} onClick={() => setConfirmDelete(false)}>
              Cancelar
            </button>
          </>
        ) : (
          actionsOf(watch).map((action) => (
            <button
              key={action}
              type="button"
              className={action === "delete" ? `${BUTTON} text-alert` : BUTTON}
              disabled={busy !== null}
              onClick={() => (action === "delete" ? setConfirmDelete(true) : run(action))}
            >
              {LABEL[action][busy === action ? 1 : 0]}
            </button>
          ))
        )}
      </div>
      {error ? (
        <p role="alert" className="text-small font-medium text-alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export function Panels(props: { me: Me }) {
  const [panels, setPanels] = useState<Panel[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    api
      .watches()
      .then(async (watches) => {
        const shown = watches.filter((watch) => watch.status !== "deleted");
        const latest = await Promise.all(
          shown.map((watch) =>
            watch.confirmed ? api.watchResults(watch.id).then((list) => list[0] ?? null, () => null) : null,
          ),
        );
        if (live) setPanels(shown.map((watch, index) => ({ watch, latest: latest[index] ?? null })));
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  const replace = (id: string, next: Panel | null) =>
    setPanels((current) =>
      (current ?? []).flatMap((panel) => (panel.watch.id === id ? (next ? [next] : []) : [panel])),
    );
  const budget = props.me.budget;
  return (
    <>
      <section aria-labelledby="titulo-paineis" className="flex flex-col gap-3">
        <h2 id="titulo-paineis" className="text-subheading text-ink">
          Seus painéis
        </h2>
        {failed ? (
          <p className="text-small text-graphite">Não consegui carregar seus painéis agora.</p>
        ) : !panels ? (
          <p className="text-small text-graphite">Carregando…</p>
        ) : panels.length === 0 ? (
          <p className="rounded-card bg-surface p-5 text-small text-graphite shadow-raised">
            Nada por aqui ainda. Peça numa conversa, por exemplo “me avise quando o fone baixar de R$ 300”, e o
            acompanhamento aparece aqui depois que você confirmar.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {panels.map((panel) => (
              <li key={panel.watch.id}>
                <PanelCard panel={panel} onChange={(next) => replace(panel.watch.id, next)} />
              </li>
            ))}
          </ul>
        )}
      </section>
      {budget ? (
        <section aria-labelledby="titulo-saldo" className="flex flex-col gap-2 rounded-card bg-surface p-5 shadow-raised">
          <h2 id="titulo-saldo" className="text-subheading text-ink">
            Uso da tone
          </h2>
          <p className="text-small text-graphite">Últimos sete dias, o mesmo saldo da extensão.</p>
          <div className="grid grid-cols-2 gap-2">
            <span className="rounded-panel bg-sunken p-4">
              <span className="block text-caption text-graphite">Disponível</span>
              <span className="block text-ui text-ink tabular-nums">{usd(budget.availableUsd)}</span>
            </span>
            <span className="rounded-panel bg-sunken p-4">
              <span className="block text-caption text-graphite">Teto</span>
              <span className="block text-ui text-ink tabular-nums">{usd(budget.weeklyCapUsd)}</span>
            </span>
          </div>
        </section>
      ) : null}
    </>
  );
}
