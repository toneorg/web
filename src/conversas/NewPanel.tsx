"use client";
// The "+" of the panels column: the person writes what they want and the tone shows the plan of
// the acompanhamento, asking first what changes it (which model, which variant) with options to
// tap. Everything happens in the folha (10/11/2026: "desvincule ao máximo a ideia do painel de uma
// conversa"); the tone works in a session of its own behind it. Nothing runs before confirming.
import { type FormEvent, useEffect, useRef, useState } from "react";
import { WatchDraftView } from "@/tone/genui";
import { type Watch, type WatchRule, watchTitle } from "@/tone/shared";
import { since, track } from "./analytics";
import { ApiError, api, streamTurn } from "./api";
import { Sheet, useSheetClose } from "./Sheet";

const primary =
  "press min-h-11 rounded-full bg-ink px-5 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quiet =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const field =
  "min-h-24 resize-none rounded-input bg-surface px-4 py-3 text-body text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-ink";

type Step = "writing" | "planning" | "review" | "unplanned";

export function NewPanel(props: { onBuilt: (watch: Watch) => void }) {
  const close = useSheetClose();
  const [step, setStep] = useState<Step>("writing");
  const [pedido, setPedido] = useState("");
  const [more, setMore] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Watch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  // Closing the folha while the tone is still studying the request stops the turn.
  useEffect(() => () => abort.current?.abort(), []);

  /**
   * One turn of the tone on the panel's own session: the first request, more detail when it could
   * not draft yet, or the answers to the draft's questions (`watchId`). Returns the draft it left.
   */
  const turn = async (text: string, watchId?: string): Promise<Watch | null> => {
    const controller = new AbortController();
    abort.current = controller;
    const outcome: { failed?: string } = {};
    const session = sessionId ?? (await api.newSession()).sessionId;
    setSessionId(session);
    await streamTurn(
      session,
      { type: "message", text, page: null, intent: "watch", ...(watchId ? { watchId } : {}) },
      (event) => {
        if (event.type === "error") outcome.failed = event.message;
      },
      controller.signal,
    );
    if (outcome.failed) throw new ApiError(outcome.failed, 0);
    if (watchId) return await api.watch(watchId);
    const watches = await api.watches();
    return (
      watches
        .filter((watch) => watch.sessionId === session && watch.status !== "deleted")
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ?? null
    );
  };

  const failed = (failure: unknown, started: number, phase: string) => {
    if (abort.current?.signal.aborted) return;
    track("panel_plan_failed", {
      reason: failure instanceof ApiError && failure.status === 0 ? "agent_error" : "request",
      status: failure instanceof ApiError ? failure.status : null,
      phase,
      duration_ms: since(started),
    });
    setError(failure instanceof ApiError ? failure.message : "Não consegui falar com a tone agora. Tente de novo.");
  };

  /** The request, or more detail about it: the tone drafts the plan, with its questions. */
  const plan = async (event: FormEvent, text: string, phase: "first" | "more") => {
    event.preventDefault();
    if (!text.trim() || step === "planning") return;
    setStep("planning");
    setError(null);
    const started = performance.now();
    try {
      const planned = await turn(text.trim());
      track("panel_planned", {
        planned: Boolean(planned),
        questions: planned?.draft.questions?.length ?? 0,
        phase,
        duration_ms: since(started),
      });
      setDraft(planned);
      setMore("");
      setStep(planned ? "review" : "unplanned");
    } catch (failure) {
      failed(failure, started, phase);
      setStep(phase === "first" ? "writing" : "unplanned");
    }
  };

  /** The person tapped the answers in the card: the tone adjusts the same draft. */
  const answer = async (answers: string) => {
    if (!draft || busy) return;
    setBusy(true);
    setError(null);
    const started = performance.now();
    try {
      const adjusted = await turn(answers, draft.id);
      track("panel_answered", {
        questions: draft.draft.questions?.length ?? 0,
        left: adjusted?.draft.questions?.length ?? 0,
        duration_ms: since(started),
      });
      if (adjusted) setDraft(adjusted);
    } catch (failure) {
      failed(failure, started, "answer");
    } finally {
      setBusy(false);
    }
  };

  /** Saves the person's edits (when there are any) and confirms; if something is still missing, shows it. */
  const approve = async (edited?: WatchRule) => {
    if (!draft || busy) return;
    setBusy(true);
    setError(null);
    try {
      const saved = edited ? await api.saveWatch(draft.id, draft.version, edited) : draft;
      if (!saved.review.canConfirm) {
        setDraft(saved);
        setBusy(false);
        return;
      }
      const watch = await api.confirmWatch(saved.id, saved.version);
      track("panel_created", {
        kind: watch.confirmed?.kind ?? null,
        condition: watch.confirmed?.condition.kind ?? null,
        email: watch.confirmed?.notify.email ?? null,
      });
      props.onBuilt(watch);
      close();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não deu certo. Tente de novo.");
      setBusy(false);
    }
  };

  const restart = () => {
    setStep("writing");
    setDraft(null);
    setSessionId(null);
    setError(null);
  };
  const asking = Boolean(draft?.review.clarifications.some((c) => c.field !== "condition"));

  return (
    <>
      {step === "writing" ? (
        <form className="flex flex-col gap-3" onSubmit={(event) => void plan(event, pedido, "first")}>
          <label htmlFor="pedido-painel" className="text-ui text-ink">
            O que você quer que eu acompanhe?
          </label>
          <textarea
            id="pedido-painel"
            rows={3}
            maxLength={1000}
            value={pedido}
            onChange={(event) => setPedido(event.target.value)}
            placeholder="ex.: o preço do iPhone 18, ou o fone XT-200 perto de R$ 300"
            className={field}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={primary} disabled={!pedido.trim()}>
              Montar o plano
            </button>
            <button type="button" className={quiet} onClick={close}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {step === "planning" ? (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-body text-ink">Estudando o seu pedido…</p>
          <span className="bar">
            <span className="fill ink build-bar w-1/3" />
          </span>
          <p className="text-small text-graphite">Isso leva alguns segundos.</p>
        </div>
      ) : null}

      {step === "review" && draft ? (
        <>
          <p className="text-small text-graphite" aria-live="polite">
            {asking
              ? "Antes de fechar o plano, preciso de uma ou duas respostas."
              : "Este é o plano. Confira quando avisar e confirme; nada roda antes disso."}
          </p>
          <WatchDraftView
            watch={draft}
            title={watchTitle(draft.draft)}
            actionable
            busy={busy}
            onSave={(rule) => void approve(rule)}
            onConfirm={() => void approve()}
            onSaveAndConfirm={(rule) => void approve(rule)}
            onAnswer={(answers) => void answer(answers)}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={quiet} disabled={busy} onClick={restart}>
              Escrever de novo
            </button>
          </div>
        </>
      ) : null}

      {step === "unplanned" ? (
        <form className="flex flex-col gap-3" onSubmit={(event) => void plan(event, more, "more")}>
          <label htmlFor="mais-painel" className="text-body text-ink">
            Ainda não deu para montar o plano. Me conte um pouco mais: qual produto, e se tem um modelo ou uma
            variante em mente.
          </label>
          <textarea
            id="mais-painel"
            rows={2}
            maxLength={1000}
            value={more}
            onChange={(event) => setMore(event.target.value)}
            className={field}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={primary} disabled={!more.trim()}>
              Tentar de novo
            </button>
            <button type="button" className={quiet} onClick={restart}>
              Escrever de novo
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="text-small font-medium text-alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

/** The folha that holds the plan, so the panels column only mounts it on demand. */
export function NewPanelSheet(props: { onClose: () => void; onBuilt: (watch: Watch) => void }) {
  return (
    <Sheet title="Novo painel" onClose={props.onClose}>
      <NewPanel onBuilt={props.onBuilt} />
    </Sheet>
  );
}
