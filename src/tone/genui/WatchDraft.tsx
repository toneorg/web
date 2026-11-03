// Gerado de toneorg/extension@43abe652d737 (packages/genui-react/src/WatchDraft.tsx). Não edite aqui.
// T09: the draft of a watch, for the person to review and confirm. The model
// writes only the id; the rule comes from the server and every button is the
// panel's: it saves the person's edits and confirms the version on screen.
//
// Read top to bottom: what it is and its state, the plan in a few labelled
// lines, what is still missing, when to notify (the one thing the person
// usually sets here), and one action. Where and how the price is read is
// behind a disclosure: it matters, but it is not the decision.
import { type Watch, type WatchCondition, type WatchRule, watchFacts } from "@/tone/shared";
import { useEffect, useId, useRef, useState } from "react";
import type { WatchAccess } from "./host";

const STATUS: Record<Watch["status"], string> = {
  draft: "Rascunho",
  active: "Ativo",
  paused: "Pausado",
  deleted: "Excluído",
};

/** The condition the person chose, ready to save, or null while it is incomplete. */
function complete(condition: WatchCondition, amount: string): WatchCondition | null {
  if (condition.kind === "target_price") {
    const value = Number(amount.replace(",", "."));
    return Number.isFinite(value) && value >= 1 ? { ...condition, amount: value } : null;
  }
  if (condition.kind === "drop_percent") {
    const value = Math.round(Number(amount));
    return Number.isFinite(value) && value >= 1 && value <= 90 ? { kind: "drop_percent", percent: value } : null;
  }
  return condition;
}

function amountOf(condition: WatchCondition): string {
  if (condition.kind === "target_price") return condition.amount >= 1 ? String(condition.amount) : "";
  if (condition.kind === "drop_percent") return String(condition.percent);
  return "";
}

export function WatchDraftView(props: {
  watch: Watch;
  title: string;
  actionable: boolean;
  onSave: (draft: WatchRule) => void;
  onConfirm: () => void;
  /** Saves the edits and confirms the saved version in one step. Without it, saving comes first. */
  onSaveAndConfirm?: (draft: WatchRule) => void;
  busy?: boolean;
}) {
  const { watch, actionable } = props;
  const ids = useId();
  const [condition, setCondition] = useState<WatchCondition>(watch.draft.condition);
  const [amount, setAmount] = useState(amountOf(watch.draft.condition));
  const [email, setEmail] = useState(watch.draft.notify.email);
  useEffect(() => {
    setCondition(watch.draft.condition);
    setAmount(amountOf(watch.draft.condition));
    setEmail(watch.draft.notify.email);
  }, [watch]);

  const chosen = complete(condition, amount);
  const draft: WatchRule = {
    ...watch.draft,
    condition: chosen ?? watch.draft.condition,
    notify: { ...watch.draft.notify, email },
  };
  const edited =
    JSON.stringify(draft.condition) !== JSON.stringify(watch.draft.condition) || email !== watch.draft.notify.email;
  const pending = Boolean(watch.confirmed) && watch.confirmedVersion !== watch.version;
  const live = watch.confirmedVersion === watch.version && watch.status !== "draft";
  // What the card itself can answer (when to notify) is the form; the rest needs the conversation.
  const conditionQuestion = watch.review.clarifications.find((c) => c.field === "condition");
  const elsewhere = watch.review.clarifications.filter((c) => !(actionable && c.field === "condition"));
  const conditionMissing = draft.condition.kind === "none" && Boolean(conditionQuestion);
  const incomplete = condition.kind !== "none" && !chosen;
  const blocked = elsewhere.length > 0 || conditionMissing || incomplete;
  const reason = incomplete
    ? condition.kind === "drop_percent"
      ? amount
        ? "Diga uma queda entre 1% e 90%."
        : "Escreva a queda, em %."
      : amount
        ? "Diga um preço a partir de R$ 1."
        : "Escreva o preço máximo."
    : conditionMissing && elsewhere.length
      ? "Para ativar, escolha quando avisar e responda o que falta na conversa."
      : conditionMissing
        ? "Para ativar, escolha quando avisar."
        : elsewhere.length
          ? "Para ativar, responda o que falta na conversa."
          : null;

  const confirm = () => {
    if (!edited) return props.onConfirm();
    if (props.onSaveAndConfirm) return props.onSaveAndConfirm(draft);
    props.onSave(draft);
  };
  // Choosing an option that needs a number moves the keyboard to its field.
  const amountField = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState(0);
  useEffect(() => {
    if (picked) amountField.current?.focus();
  }, [picked]);
  const pick = (next: WatchCondition) => {
    setCondition(next);
    setAmount(amountOf(next));
    setPicked((value) => value + 1);
  };

  return (
    <section className="card watch" aria-labelledby={`${ids}-title`}>
      <header className="watch-head">
        <h3 id={`${ids}-title`}>{props.title}</h3>
        <span className={watch.status === "active" ? "tag" : "tag quiet"}>{STATUS[watch.status]}</span>
      </header>
      {watch.status === "draft" || pending ? (
        <p className="meta">
          {pending
            ? "Há mudanças ainda não confirmadas; a versão confirmada continua valendo."
            : "Rascunho: nada roda antes de você confirmar."}
        </p>
      ) : null}

      <dl className="watch-facts">
        {watchFacts(draft).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      {elsewhere.length ? (
        <div className="watch-questions" role="note">
          <p className="watch-questions-title">Falta combinar</p>
          {elsewhere.map((c) => (
            <p key={c.field}>{c.question}</p>
          ))}
        </div>
      ) : null}

      {actionable ? (
        <fieldset className="watch-edit" aria-describedby={conditionQuestion ? `${ids}-why` : undefined}>
          <legend>Quando avisar</legend>
          {conditionQuestion ? (
            <p id={`${ids}-why`} className="hint">
              O que conta como promoção para você?
            </p>
          ) : null}
          <div className={`watch-option${condition.kind === "target_price" ? " selected" : ""}`}>
            <label className="watch-choice">
              <input
                type="radio"
                name={`${ids}-cond`}
                checked={condition.kind === "target_price"}
                onChange={() => pick({ kind: "target_price", amount: 0, currency: "BRL" })}
              />
              <span>Quando o preço ficar em até</span>
            </label>
            {condition.kind === "target_price" ? (
              <span className="watch-amount">
                <span aria-hidden="true">R$</span>
                <input
                  ref={amountField}
                  className="input"
                  inputMode="decimal"
                  aria-label="Preço máximo, em reais"
                  placeholder="300"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^\d,.]/g, ""))}
                />
              </span>
            ) : null}
          </div>
          <div className={`watch-option${condition.kind === "drop_percent" ? " selected" : ""}`}>
            <label className="watch-choice">
              <input
                type="radio"
                name={`${ids}-cond`}
                checked={condition.kind === "drop_percent"}
                onChange={() => pick({ kind: "drop_percent", percent: 15 })}
              />
              <span>Quando cair pelo menos</span>
            </label>
            {condition.kind === "drop_percent" ? (
              <span className="watch-amount">
                <input
                  ref={amountField}
                  className="input"
                  inputMode="numeric"
                  aria-label="Queda mínima, em porcentagem"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").slice(0, 2))}
                />
                <span aria-hidden="true">%</span>
              </span>
            ) : null}
          </div>
          {watch.draft.kind === "discovery" ? (
            <div className={`watch-option${condition.kind === "new_match" ? " selected" : ""}`}>
              <label className="watch-choice">
                <input
                  type="radio"
                  name={`${ids}-cond`}
                  checked={condition.kind === "new_match"}
                  onChange={() => pick({ kind: "new_match" })}
                />
                <span>Quando aparecer uma opção nova</span>
              </label>
            </div>
          ) : null}
          <label className="checkbox watch-email">
            <input type="checkbox" checked={email} onChange={(event) => setEmail(event.target.checked)} />
            <span>Avisar também por e-mail</span>
          </label>
        </fieldset>
      ) : null}

      <details className="watch-sources">
        <summary>Onde e como eu confiro</summary>
        <ul>
          {watch.review.sources
            .filter((source) => source.stores.length)
            .map((source) => (
              <li key={source.id}>
                <strong>{source.label}</strong>
                {source.autonomous ? ", roda sem o navegador" : ", só com o navegador aberto"}: {source.note}
              </li>
            ))}
          {watch.review.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>

      {actionable && !(live && !edited) ? (
        <div className="watch-actions">
          <button type="button" className="btn solid" disabled={blocked || props.busy} onClick={confirm}>
            {props.busy ? "Salvando…" : watch.confirmed ? "Confirmar esta versão" : "Confirmar e ativar"}
          </button>
          {reason ? <p className="hint">{reason}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

export function WatchDraftLoader(props: { watchId: string; title: string; actionable: boolean; access?: WatchAccess }) {
  const [watch, setWatch] = useState<Watch | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
  const run = (action: () => Promise<Watch>) => {
    setError(null);
    setBusy(true);
    action()
      .then(setWatch)
      .catch((failure: unknown) => setError(failure instanceof Error ? failure.message : "Não deu certo."))
      .finally(() => setBusy(false));
  };
  const access = props.access;
  return (
    <>
      <WatchDraftView
        watch={watch}
        title={props.title}
        actionable={props.actionable && available}
        busy={busy}
        onSave={(draft) => access && run(() => access.save(watch.id, watch.version, draft))}
        onConfirm={() => access && run(() => access.confirm(watch.id, watch.version))}
        onSaveAndConfirm={(draft) =>
          access &&
          run(async () => {
            const saved = await access.save(watch.id, watch.version, draft);
            // Something else is still missing (a product, a store): show the saved draft and what is left.
            return saved.review.canConfirm ? await access.confirm(saved.id, saved.version) : saved;
          })
        }
      />
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
