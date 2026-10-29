// Gerado de toneorg/extension@7b352c6fb2e6 (packages/genui-react/src/DecisionBoard.tsx). Não edite aqui.
// T08: the decision board. The model writes only the decision id; the data
// comes from the server with its evidence, and every button is the panel's:
// it changes the decision as the person, opens a store page, or asks the agent.
import {
  type ComparedCandidate,
  compareDecision,
  type DecisionCriterion,
  type DecisionOp,
  type DecisionState,
} from "@/tone/shared";
import { useEffect, useRef, useState } from "react";
import type { GenUIAction } from "./host";
import { Icon } from "./Icon";

const PRIORITY: Record<DecisionCriterion["priority"], string> = {
  required: "Obrigatório",
  preferred: "Desejável",
  indifferent: "Indiferente",
};
const STATUS = { meets: "Atende", does_not_meet: "Não atende", unknown: "Desconhecido" } as const;
const CLASSIFICATION = {
  meets_required: "Atende os obrigatórios",
  does_not_meet_required: "Não atende um obrigatório",
  unknown: "Falta confirmar um obrigatório",
} as const;
const DISCARD_REASONS = ["Preço", "Não atende um critério", "Não gostei", "Já tenho outra opção"];
const day = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export function DecisionBoardView(props: {
  state: DecisionState;
  title: string;
  now?: Date;
  actionable: boolean;
  onChange: (ops: DecisionOp[]) => void;
  onAct: (action: GenUIAction) => void;
}) {
  const { state, actionable, onChange, onAct } = props;
  const comparison = compareDecision(state, props.now ?? new Date());
  const groups: { label: string; rows: ComparedCandidate[] }[] = [
    { label: "Lista curta", rows: comparison.candidates.filter((row) => row.state === "shortlisted") },
    { label: "Em aberto", rows: comparison.candidates.filter((row) => row.state === "open") },
    { label: "Descartadas", rows: comparison.candidates.filter((row) => row.state === "discarded") },
  ];
  const stale = comparison.candidates.some((row) => row.stale && row.state !== "discarded");
  return (
    <section className="card decision" aria-label={props.title}>
      <h3>{props.title}</h3>
      {state.query ? <p className="meta">{state.query}</p> : null}
      <h4 className="decision-heading">Critérios</h4>
      {comparison.criteria.length === 0 ? <p className="meta">Nenhum critério ainda.</p> : null}
      <ul className="decision-criteria">
        {comparison.criteria.map((criterion) => (
          <li key={criterion.id}>
            <span className="decision-criterion">{criterion.description}</span>
            <span className="tag">{PRIORITY[criterion.effectivePriority]}</span>
            {criterion.origin === "agent" && !criterion.confirmed ? (
              <span className="tag quiet">Sugerido pela tone</span>
            ) : null}
            {actionable ? (
              <span className="decision-actions">
                {criterion.origin === "agent" && !criterion.confirmed ? (
                  <button
                    type="button"
                    className="btn outline sm"
                    onClick={() => onChange([{ type: "confirm_criterion", criterionId: criterion.id }])}
                  >
                    Confirmar
                  </button>
                ) : null}
                <label className="sr-only" htmlFor={`prio-${state.id}-${criterion.id}`}>
                  Peso de {criterion.description}
                </label>
                <select
                  id={`prio-${state.id}-${criterion.id}`}
                  className="decision-select"
                  value={criterion.priority}
                  onChange={(event) =>
                    onChange([
                      {
                        type: "set_criterion",
                        criterion: {
                          id: criterion.id,
                          field: criterion.field,
                          description: criterion.description,
                          priority: event.target.value as DecisionCriterion["priority"],
                        },
                      },
                    ])
                  }
                >
                  {Object.entries(PRIORITY).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {groups.map((group) =>
        group.rows.length ? (
          <div key={group.label}>
            <h4 className="decision-heading">{group.label}</h4>
            {group.rows.map((row) => (
              <Candidate key={row.candidate.id} row={row} actionable={actionable} onChange={onChange} onAct={onAct} />
            ))}
          </div>
        ) : null,
      )}
      {stale && actionable ? (
        <button
          type="button"
          className="btn outline block spaced"
          onClick={() =>
            onAct({ type: "say", text: "Atualize os preços e a disponibilidade das candidatas desta decisão." })
          }
        >
          Atualizar preços
        </button>
      ) : null}
    </section>
  );
}

function Candidate(props: {
  row: ComparedCandidate;
  actionable: boolean;
  onChange: (ops: DecisionOp[]) => void;
  onAct: (action: GenUIAction) => void;
}) {
  const { row, actionable, onChange, onAct } = props;
  const { candidate } = row;
  const [discarding, setDiscarding] = useState(false);
  return (
    <article className={`decision-candidate ${row.state}`}>
      <div className="decision-candidate-head">
        <span className="value">{candidate.title}</span>
        <span className="meta">
          {[candidate.variantLabel, candidate.store, candidate.seller ? `vendido por ${candidate.seller}` : null]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <span className="meta">
          <span className="tabular">
            {candidate.price.kind === "unknown" ? "Preço desconhecido" : candidate.price.originalText}
          </span>
          {row.price.note ? ` · ${row.price.note}` : ""}
          {row.price.cheapest ? " · menor preço desta variante" : ""}
        </span>
        {row.stale ? (
          <span className="meta">
            Preço observado há mais de um dia ({day(candidate.observedAt)}): pode ter mudado.
          </span>
        ) : null}
        <span className={`tag${row.classification === "meets_required" ? "" : " quiet"}`}>
          {CLASSIFICATION[row.classification]}
        </span>
        {row.mark ? (
          <span className="meta">
            {row.mark.by === "person" ? "por você" : "sugerido pela tone"}: {row.mark.reason}
          </span>
        ) : null}
      </div>
      <ul className="decision-cells">
        {row.cells.map((cell) => {
          return (
            <li key={cell.criterionId} className={cell.counts ? "" : "muted"}>
              <span className={`decision-status ${cell.status}`}>{STATUS[cell.status]}</span>{" "}
              <span>{cell.explanation}</span>
              {cell.basis === "inference" ? <span className="meta"> · inferência, sem fonte</span> : null}
              {cell.evidence.map((entry) => (
                <span key={entry.id} className="decision-evidence">
                  “{entry.excerpt}” — {entry.source},{" "}
                  {entry.level === "origin" ? "lido na loja" : "observado no índice"} em {day(entry.observedAt)}
                  {entry.kind === "review" ? " (opinião de avaliações)" : ""}
                </span>
              ))}
            </li>
          );
        })}
      </ul>
      {actionable ? (
        <div className="row-actions">
          {row.state !== "shortlisted" ? (
            <button
              type="button"
              className="btn outline sm"
              onClick={() => onChange([{ type: "shortlist", candidateId: candidate.id, reason: "Escolha da pessoa" }])}
            >
              Na lista curta
            </button>
          ) : null}
          {row.state !== "discarded" ? (
            <button type="button" className="btn ghost sm" onClick={() => setDiscarding(!discarding)}>
              Descartar
            </button>
          ) : (
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => onChange([{ type: "reconsider", candidateId: candidate.id }])}
            >
              Reconsiderar
            </button>
          )}
          <button
            type="button"
            className="icon-btn"
            aria-label={`Ver ${candidate.title} na loja`}
            onClick={() =>
              onAct({
                type: "open",
                url: candidate.url,
                title: candidate.title,
                where: {
                  source: "decision_board",
                  offerId: candidate.offerId,
                  recommended: row.classification === "meets_required",
                },
              })
            }
          >
            <Icon name="external" />
          </button>
        </div>
      ) : null}
      {discarding && actionable ? (
        <fieldset className="row-actions decision-reasons">
          <legend className="sr-only">Motivo do descarte</legend>
          {DISCARD_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              className="btn outline sm"
              onClick={() => {
                setDiscarding(false);
                onChange([{ type: "discard", candidateId: candidate.id, reason }]);
              }}
            >
              {reason}
            </button>
          ))}
        </fieldset>
      ) : null}
    </article>
  );
}

/** Loads the decision through the host and keeps it current after each change. */
export function DecisionBoardLoader(props: {
  decisionId: string;
  title: string;
  actionable: boolean;
  access?: {
    load: () => Promise<DecisionState | null>;
    change: (v: number, ops: DecisionOp[]) => Promise<DecisionState>;
  };
  onAct: (action: GenUIAction) => void;
}) {
  const { access } = props;
  const [state, setState] = useState<DecisionState | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  // The host is rebuilt on each render of the chat; loading follows the decision, not the object.
  const current = useRef(access);
  current.current = access;
  const available = Boolean(access);
  // biome-ignore lint/correctness/useExhaustiveDependencies: reloads when the decision shown changes.
  useEffect(() => {
    const loader = current.current;
    if (!loader) return;
    let live = true;
    loader
      .load()
      .then((loaded) => live && setState(loaded))
      .catch(() => live && setError("Não consegui abrir a decisão. Tente de novo."));
    return () => {
      live = false;
    };
  }, [props.decisionId, available]);
  if (error) return <p className="notice error">{error}</p>;
  if (state === undefined) return <p className="notice">Carregando a decisão…</p>;
  if (!state || state.id !== props.decisionId)
    return <p className="notice">Esta decisão não está guardada nesta conversa.</p>;
  return (
    <DecisionBoardView
      state={state}
      title={props.title}
      actionable={props.actionable && Boolean(access)}
      onAct={props.onAct}
      onChange={(ops) => {
        if (!access) return;
        setError(null);
        access
          .change(state.version, ops)
          .then(setState)
          .catch((failure: unknown) =>
            setError(failure instanceof Error ? failure.message : "Não consegui salvar. Tente de novo."),
          );
      }}
    />
  );
}
