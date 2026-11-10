"use client";
// What a person can do with a panel (pause, resume, mute, check now, delete), the same on the card of
// the panels column and on the panel's own page: the "⋯" menu and what it says while it works.
import { type ReactNode, useState } from "react";
import type { Watch, WatchResult } from "@/tone/shared";
import { track } from "./analytics";
import { api } from "./api";
import { ICONS, PanelMenu } from "./PanelMenu";
import { WATCHES_CHANGED } from "./Program";

export type Action = "pause" | "resume" | "mute" | "unmute" | "check" | "delete";

/** The actions a watch allows in its state. */
export function actionsOf(watch: Watch): Action[] {
  if (watch.status === "active") {
    const mute: Action[] = watch.confirmed?.notify.email ? [watch.mutedAt ? "unmute" : "mute"] : [];
    return ["check", "pause", ...mute, "delete"];
  }
  if (watch.status === "paused") return ["resume", "delete"];
  return ["delete"];
}

export const LABEL: Record<Action, [idle: string, busy: string]> = {
  check: ["Verificar agora", "Verificando…"],
  pause: ["Pausar", "Pausando…"],
  resume: ["Retomar", "Retomando…"],
  mute: ["Silenciar e-mail", "Silenciando…"],
  unmute: ["Voltar a avisar", "Ativando…"],
  delete: ["Excluir", "Excluindo…"],
};
export const BUTTON =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export interface PanelState {
  watch: Watch;
  latest: WatchResult | null;
  emptyRound?: boolean;
}

/**
 * The reading a panel shows: the newest one with a price. The index sometimes comes back empty
 * for a round; a price seen minutes before is still the useful thing to show.
 */
export function readingOf(results: WatchResult[]): Pick<PanelState, "latest" | "emptyRound"> {
  const priced = (result: WatchResult) => result.summary.matches.some((match) => match.amount !== null);
  const latest = results.find(priced) ?? results[0] ?? null;
  return { latest, emptyRound: Boolean(latest && results[0] && latest.id !== results[0].id) };
}

/**
 * The menu of a panel and what goes under it (progress, the delete confirmation, an error).
 * `onChange(null)` means the panel was deleted.
 */
export function usePanelActions(
  panel: PanelState,
  onChange: (panel: PanelState | null) => void,
  name: string,
): { busy: Action | null; checking: boolean; menu: ReactNode; footer: ReactNode } {
  const { watch, latest } = panel;
  const [busy, setBusy] = useState<Action | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: Action) => {
    setBusy(action);
    setError(null);
    track("panel_action", { action, status: watch.status });
    try {
      if (action === "delete") {
        await api.deleteWatch(watch.id);
        onChange(null);
        return;
      }
      if (action === "check") {
        // Compared with the last reading the server had, not with this browser's clock.
        const before = (await api.watchResults(watch.id, { fresh: true }))[0]?.observedAt ?? "";
        const { state } = await api.checkWatch(watch.id);
        // The reading runs on the server and may end after the answer: follow it for up to a minute.
        const newer = (list: WatchResult[]) => list.find((result) => result.observedAt > before) ?? null;
        let results = await api.watchResults(watch.id, { fresh: true });
        if (state !== "done" && !newer(results)) {
          setChecking(true);
          for (let tries = 0; tries < 20 && !newer(results); tries++) {
            await new Promise((resolve) => window.setTimeout(resolve, 3000));
            results = await api.watchResults(watch.id, { fresh: true });
          }
          setChecking(false);
        }
        const fresh = await api.watch(watch.id);
        track("panel_check_finished", { found: Boolean(newer(results)), waited: state !== "done" });
        if (!newer(results)) setError("A leitura ainda não terminou. O resultado aparece aqui quando chegar.");
        if (fresh) onChange({ watch: fresh, ...(results.length ? readingOf(results) : { latest }) });
        window.dispatchEvent(new Event(WATCHES_CHANGED));
        return;
      }
      onChange({ watch: await api.watchAction(watch.id, action), latest });
    } catch (failure) {
      track("panel_action_failed", { action });
      setError(failure instanceof Error ? failure.message : "Não deu certo. Tente de novo.");
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  };

  const menu = (
    <PanelMenu
      label={`Ações do painel ${name}`}
      disabled={busy !== null}
      items={actionsOf(watch).map((action) => ({
        id: action,
        label: LABEL[action][0],
        icon: ICONS[action],
        danger: action === "delete",
        onSelect: () => (action === "delete" ? setConfirmDelete(true) : void run(action)),
      }))}
    />
  );

  const footer = (
    <>
      {checking ? (
        <span role="status" className="text-caption text-ink">
          Verificando agora; o resultado aparece aqui em instantes.
        </span>
      ) : null}
      {busy && busy !== "check" && busy !== "delete" ? (
        <span role="status" className="text-caption text-graphite">
          {LABEL[busy][1]}
        </span>
      ) : null}
      {confirmDelete ? (
        // Above a card's link, so the buttons get the clicks.
        <div role="group" aria-label="Excluir este painel?" className="relative z-[1] mt-1 flex flex-col gap-2 rounded-panel bg-sunken p-3">
          <span className="text-small text-ink">Excluir este painel? As leituras param e as conversas dele saem da vista.</span>
          <span className="flex flex-wrap gap-2">
            <button type="button" className={`${BUTTON} text-alert`} disabled={busy !== null} onClick={() => void run("delete")}>
              {busy === "delete" ? LABEL.delete[1] : "Excluir painel"}
            </button>
            <button type="button" className={BUTTON} disabled={busy !== null} onClick={() => setConfirmDelete(false)}>
              Cancelar
            </button>
          </span>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-small font-medium text-alert">
          {error}
        </p>
      ) : null}
    </>
  );

  return { busy, checking, menu, footer };
}
