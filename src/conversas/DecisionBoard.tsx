"use client";
// T08 on the web: the decision of the conversation, loaded from the server with
// its evidence. The person changes it here as the person; the model only named its id.
import { useCallback, useEffect, useState } from "react";
import posthog from "posthog-js";
import { compareDecision, type DecisionOp, type DecisionState } from "@/tone/shared";
import { api } from "./api";
import { StoreLink } from "./Program";

const PRIORITY = { required: "Obrigatório", preferred: "Desejável", indifferent: "Indiferente" } as const;
const STATUS = { meets: "Atende", does_not_meet: "Não atende", unknown: "Desconhecido" } as const;
const CLASSIFICATION = {
  meets_required: "Atende os obrigatórios",
  does_not_meet_required: "Não atende um obrigatório",
  unknown: "Falta confirmar um obrigatório",
} as const;
const button =
  "min-h-11 rounded-full px-4 text-ui shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

export function DecisionBoard(props: { sessionId: string; decisionId: string; title: string; say: (text: string) => void }) {
  const [state, setState] = useState<DecisionState | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    api
      .decision(props.sessionId)
      .then((loaded) => live && setState(loaded))
      .catch(() => live && setError("Não consegui abrir a decisão."));
    return () => {
      live = false;
    };
  }, [props.sessionId]);
  const change = useCallback(
    (ops: DecisionOp[]) => {
      if (!state) return;
      setError(null);
      api
        .changeDecision(props.sessionId, state.version, ops)
        .then((nextState) => {
          setState(nextState);
          posthog.capture("decision_updated", { operation: ops[0]?.type });
        })
        .catch((failure: unknown) => setError(failure instanceof Error ? failure.message : "Não consegui salvar."));
    },
    [props.sessionId, state],
  );
  if (state === undefined && !error) return <p className="text-small text-graphite">Carregando a decisão…</p>;
  if (!state || state.id !== props.decisionId)
    return <p className="text-small text-graphite">{error ?? "Esta decisão não está guardada nesta conversa."}</p>;
  const comparison = compareDecision(state);
  const stale = comparison.candidates.some((row) => row.stale && row.state !== "discarded");
  return (
    <section className="flex flex-col gap-4 rounded-card bg-surface p-5 shadow-raised" aria-label={props.title}>
      <h3 className="text-subheading text-ink">{props.title}</h3>
      <div>
        <h4 className="text-caption font-semibold text-graphite">Critérios</h4>
        <ul className="mt-2 flex flex-col gap-2">
          {comparison.criteria.map((criterion) => (
            <li key={criterion.id} className="flex flex-wrap items-center gap-2 text-small text-ink">
              <span>{criterion.description}</span>
              <span className="rounded-tag bg-sunken px-2 text-caption">{PRIORITY[criterion.effectivePriority]}</span>
              {criterion.origin === "agent" && !criterion.confirmed ? (
                <>
                  <span className="text-caption text-graphite">Sugerido pela tone</span>
                  <button type="button" className={`${button} bg-surface text-ink`} onClick={() => change([{ type: "confirm_criterion", criterionId: criterion.id }])}>
                    Confirmar
                  </button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      {comparison.candidates.map((row) => (
        <article key={row.candidate.id} className={`flex flex-col gap-2 border-t border-rule pt-3 ${row.state === "discarded" ? "opacity-70" : ""}`}>
          <span className="text-small font-medium text-ink">{row.candidate.title}</span>
          <span className="text-caption text-graphite">
            {[row.candidate.variantLabel, row.candidate.store, row.candidate.seller].filter(Boolean).join(" · ")}
          </span>
          <span className="text-caption text-graphite">
            {row.candidate.price.kind === "unknown" ? "Preço desconhecido" : row.candidate.price.originalText}
            {row.price.note ? ` · ${row.price.note}` : ""}
            {row.price.cheapest ? " · menor preço desta variante" : ""}
          </span>
          {row.stale ? <span className="text-caption text-graphite">Preço observado há mais de um dia: pode ter mudado.</span> : null}
          <span className="text-caption font-medium text-ink">
            {CLASSIFICATION[row.classification]}
            {row.state === "shortlisted" ? " · na lista curta" : row.state === "discarded" ? " · descartada" : ""}
            {row.mark ? ` (${row.mark.by === "person" ? "por você" : "sugestão da tone"}: ${row.mark.reason})` : ""}
          </span>
          <ul className="flex flex-col gap-1">
            {row.cells.map((cell) => (
              <li key={cell.criterionId} className={`text-caption ${cell.counts ? "text-ink" : "text-graphite"}`}>
                <strong className={cell.status === "does_not_meet" ? "text-alert" : ""}>{STATUS[cell.status]}</strong> {cell.explanation}
                {cell.evidence.map((entry) => (
                  <span key={entry.id} className="block text-graphite">
                    “{entry.excerpt}” — {entry.source}, {entry.level === "origin" ? "lido na loja" : "observado no índice"}
                  </span>
                ))}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {row.state !== "shortlisted" ? (
              <button type="button" className={`${button} bg-surface text-ink`} onClick={() => change([{ type: "shortlist", candidateId: row.candidate.id, reason: "Escolha da pessoa" }])}>
                Na lista curta
              </button>
            ) : null}
            {row.state !== "discarded" ? (
              <button type="button" className={`${button} bg-surface text-ink`} onClick={() => change([{ type: "discard", candidateId: row.candidate.id, reason: "Descartada pela pessoa" }])}>
                Descartar
              </button>
            ) : (
              <button type="button" className={`${button} bg-surface text-ink`} onClick={() => change([{ type: "reconsider", candidateId: row.candidate.id }])}>
                Reconsiderar
              </button>
            )}
            <StoreLink url={row.candidate.url} />
          </div>
        </article>
      ))}
      {stale ? (
        <button type="button" className={`${button} bg-ink text-on-ink`} onClick={() => props.say("Atualize os preços e a disponibilidade das candidatas desta decisão.")}>
          Atualizar preços
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="text-small font-medium text-alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
