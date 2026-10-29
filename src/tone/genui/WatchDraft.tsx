// Gerado de toneorg/extension@cab9f784af9d (packages/genui-react/src/WatchDraft.tsx). Não edite aqui.
// T09: the draft of a watch, for the person to review and confirm. The model
// writes only the id; the rule comes from the server and every button is the
// panel's: it saves the person's edits and confirms the version on screen.
import { describeWatch, type Watch, type WatchCondition, type WatchRule } from "@/tone/shared";
import { useEffect, useRef, useState } from "react";
import type { WatchAccess } from "./host";

const STATUS: Record<Watch["status"], string> = {
  draft: "Rascunho: nada roda antes de você confirmar",
  active: "Ativo",
  paused: "Pausado",
  deleted: "Excluído",
};

export function WatchDraftView(props: {
  watch: Watch;
  title: string;
  actionable: boolean;
  onSave: (draft: WatchRule) => void;
  onConfirm: () => void;
}) {
  const { watch, actionable } = props;
  const [condition, setCondition] = useState<WatchCondition>(watch.draft.condition);
  const [email, setEmail] = useState(watch.draft.notify.email);
  useEffect(() => {
    setCondition(watch.draft.condition);
    setEmail(watch.draft.notify.email);
  }, [watch]);
  const edited =
    JSON.stringify(condition) !== JSON.stringify(watch.draft.condition) || email !== watch.draft.notify.email;
  const pending = watch.confirmed && watch.confirmedVersion !== watch.version;
  return (
    <section className="card watch" aria-label={props.title}>
      <h3>{props.title}</h3>
      <p className="meta">
        {STATUS[watch.status]}
        {pending ? " · há mudanças ainda não confirmadas; a versão confirmada continua valendo" : ""}
      </p>
      <ul className="watch-lines">
        {describeWatch(watch.draft).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {watch.review.clarifications.length ? (
        <div className="watch-questions" role="note">
          {watch.review.clarifications.map((c) => (
            <p key={c.field} className="notice">
              {c.question}
            </p>
          ))}
        </div>
      ) : null}
      <ul className="watch-sources">
        {watch.review.sources
          .filter((source) => source.stores.length)
          .map((source) => (
            <li key={source.id}>
              <strong>{source.label}</strong>
              {source.autonomous ? " · roda sem o navegador" : " · só com o navegador aberto"}: {source.note}
            </li>
          ))}
        {watch.review.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      {actionable ? (
        <fieldset className="watch-edit">
          <legend>Quando avisar</legend>
          <label className="checkbox">
            <input
              type="radio"
              name={`cond-${watch.id}`}
              checked={condition.kind === "target_price"}
              onChange={() => setCondition({ kind: "target_price", amount: 100, currency: "BRL" })}
            />
            <span>Preço observado até R$</span>
            {condition.kind === "target_price" ? (
              <input
                className="input watch-amount"
                type="number"
                min={1}
                aria-label="Preço máximo em reais"
                value={condition.amount}
                onChange={(event) =>
                  setCondition({ kind: "target_price", amount: Number(event.target.value) || 1, currency: "BRL" })
                }
              />
            ) : null}
          </label>
          <label className="checkbox">
            <input
              type="radio"
              name={`cond-${watch.id}`}
              checked={condition.kind === "drop_percent"}
              onChange={() => setCondition({ kind: "drop_percent", percent: 15 })}
            />
            <span>Queda desde a primeira observação, em %</span>
            {condition.kind === "drop_percent" ? (
              <input
                className="input watch-amount"
                type="number"
                min={1}
                max={90}
                aria-label="Queda mínima em porcentagem"
                value={condition.percent}
                onChange={(event) =>
                  setCondition({
                    kind: "drop_percent",
                    percent: Math.min(90, Math.max(1, Number(event.target.value) || 1)),
                  })
                }
              />
            ) : null}
          </label>
          {watch.draft.kind === "discovery" ? (
            <label className="checkbox">
              <input
                type="radio"
                name={`cond-${watch.id}`}
                checked={condition.kind === "new_match"}
                onChange={() => setCondition({ kind: "new_match" })}
              />
              <span>Quando aparecer uma alternativa nova</span>
            </label>
          ) : null}
          <label className="checkbox">
            <input type="checkbox" checked={email} onChange={(event) => setEmail(event.target.checked)} />
            <span>Também por e-mail</span>
          </label>
        </fieldset>
      ) : null}
      {actionable ? (
        <div className="row-actions">
          {edited ? (
            <button
              type="button"
              className="btn outline sm"
              onClick={() => props.onSave({ ...watch.draft, condition, notify: { ...watch.draft.notify, email } })}
            >
              Salvar ajustes
            </button>
          ) : null}
          <button
            type="button"
            className="btn solid sm"
            disabled={
              edited ||
              !watch.review.canConfirm ||
              (watch.confirmedVersion === watch.version && watch.status !== "draft")
            }
            onClick={props.onConfirm}
          >
            {watch.confirmed ? "Confirmar esta versão" : "Confirmar e ativar"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function WatchDraftLoader(props: { watchId: string; title: string; actionable: boolean; access?: WatchAccess }) {
  const [watch, setWatch] = useState<Watch | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const current = useRef(props.access);
  current.current = props.access;
  const available = Boolean(props.access);
  // biome-ignore lint/correctness/useExhaustiveDependencies: reloads when the watch shown changes.
  useEffect(() => {
    const access = current.current;
    if (!access) return;
    let live = true;
    access
      .load(props.watchId)
      .then((loaded) => live && setWatch(loaded))
      .catch(() => live && setError("Não consegui abrir o acompanhamento."));
    return () => {
      live = false;
    };
  }, [props.watchId, available]);
  if (error && watch === undefined) return <p className="notice error">{error}</p>;
  if (watch === undefined) return <p className="notice">Carregando o acompanhamento…</p>;
  if (!watch) return <p className="notice">Este acompanhamento não existe mais.</p>;
  const run = (action: Promise<Watch>) => {
    setError(null);
    action
      .then(setWatch)
      .catch((failure: unknown) => setError(failure instanceof Error ? failure.message : "Não deu certo."));
  };
  return (
    <>
      <WatchDraftView
        watch={watch}
        title={props.title}
        actionable={props.actionable && available}
        onSave={(draft) => props.access && run(props.access.save(watch.id, watch.version, draft))}
        onConfirm={() => props.access && run(props.access.confirm(watch.id, watch.version))}
      />
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
