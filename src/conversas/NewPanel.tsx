"use client";
// The "+" of the panels column: the person writes what they want, the tone
// studies the request in a conversation of its own and shows the plan of the
// acompanhamento. Approving it builds the panel; nothing runs before that.
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { describeWatch, type Watch } from "@/tone/shared";
import { ApiError, api, streamTurn } from "./api";
import { Sheet, useSheetClose } from "./Sheet";

const primary =
  "press min-h-11 rounded-full bg-ink px-5 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const quiet =
  "press min-h-11 rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

type Step = "writing" | "planning" | "review" | "unplanned";

export function NewPanel(props: { onBuilt: (watch: Watch) => void }) {
  const close = useSheetClose();
  const [step, setStep] = useState<Step>("writing");
  const [pedido, setPedido] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Watch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const abort = useRef<AbortController | null>(null);
  // Closing the folha while the tone is still studying the request stops the turn.
  useEffect(() => () => abort.current?.abort(), []);

  /** Opens a conversation of its own with the request and reads the draft the tone leaves there. */
  const plan = async (event: FormEvent) => {
    event.preventDefault();
    const text = pedido.trim();
    if (!text || step === "planning") return;
    setStep("planning");
    setError(null);
    const controller = new AbortController();
    abort.current = controller;
    const outcome: { failed?: string } = {};
    try {
      const created = await api.newSession();
      setSessionId(created.sessionId);
      await streamTurn(
        created.sessionId,
        { type: "message", text, page: null },
        (event_) => {
          if (event_.type === "error") outcome.failed = event_.message;
        },
        controller.signal,
      );
      if (outcome.failed) {
        setError(outcome.failed);
        setStep("writing");
        return;
      }
      const watches = await api.watches();
      const newest = watches
        .filter((watch) => watch.sessionId === created.sessionId && watch.status !== "deleted")
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
      if (!newest) {
        setStep("unplanned");
        return;
      }
      setDraft(newest);
      setStep("review");
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Não consegui falar com a tone agora. Tente de novo.");
      setStep("writing");
    }
  };

  const approve = async () => {
    if (!draft || approving) return;
    setApproving(true);
    setError(null);
    try {
      props.onBuilt(await api.confirmWatch(draft.id, draft.version));
      close();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não deu certo agora.");
      setApproving(false);
    }
  };

  return (
    <>
      {step === "writing" ? (
        <form className="flex flex-col gap-3" onSubmit={(event) => void plan(event)}>
          <label htmlFor="pedido-painel" className="text-ui text-ink">
            O que você quer que eu acompanhe?
          </label>
          <textarea
            id="pedido-painel"
            rows={3}
            maxLength={1000}
            value={pedido}
            onChange={(event) => setPedido(event.target.value)}
            placeholder="ex.: me avise quando o fone XT-200 baixar de R$ 300"
            className="min-h-24 resize-none rounded-input bg-surface px-4 py-3 text-body text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-ink"
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={primary} disabled={!pedido.trim()}>
              Planejar
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
          <p className="text-small text-graphite">É este o plano do acompanhamento:</p>
          <ul className="flex flex-col gap-1 text-small text-ink">
            {describeWatch(draft.draft).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {draft.review.sources
            .filter((source) => source.stores.length)
            .map((source) => (
              <p key={source.id} className="text-caption text-graphite">
                {source.label}: {source.autonomous ? "roda sem o navegador" : "só com o navegador aberto"}.
              </p>
            ))}
          {draft.review.clarifications.length ? (
            <div className="flex flex-col gap-1 rounded-panel bg-sunken p-4">
              <p className="text-ui text-ink">Falta combinar</p>
              {draft.review.clarifications.map((clarification) => (
                <p key={clarification.field} className="text-small text-ink">
                  {clarification.question}
                </p>
              ))}
            </div>
          ) : null}
          {draft.review.notes.length ? (
            <ul className="flex flex-col gap-1 text-caption text-graphite">
              {draft.review.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {draft.review.canConfirm ? (
              <button type="button" className={primary} disabled={approving} onClick={() => void approve()}>
                {approving ? "Construindo…" : "Aprovar e construir"}
              </button>
            ) : sessionId ? (
              <Link href={`/conversas/${sessionId}`} className={primary}>
                Responder na conversa
              </Link>
            ) : null}
            <button type="button" className={quiet} disabled={approving} onClick={() => setStep("writing")}>
              Voltar
            </button>
          </div>
        </>
      ) : null}

      {step === "unplanned" ? (
        <>
          <p className="text-body text-ink">
            Abri uma conversa com o seu pedido, mas ainda não deu para montar um acompanhamento.
          </p>
          <p className="text-small text-graphite">Vale continuar conversando: eu ajusto o plano por lá.</p>
          <div className="flex flex-wrap gap-2">
            {sessionId ? (
              <Link href={`/conversas/${sessionId}`} className={primary}>
                Abrir a conversa
              </Link>
            ) : null}
            <button type="button" className={quiet} onClick={() => setStep("writing")}>
              Escrever de novo
            </button>
          </div>
        </>
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
