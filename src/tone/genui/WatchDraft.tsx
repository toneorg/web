// Gerado de toneorg/extension@9e0a42adc746 (packages/genui-react/src/WatchDraft.tsx). Não edite aqui.
// T09: the draft of a watch, for the person to review and confirm. The model
// writes only the id; the rule comes from the server and every button is the
// panel's: it saves the person's edits and confirms the version on screen.
//
// Read top to bottom: what it is and its state, the plan in a few labelled
// lines, the questions that change the plan (tapped, never written in a
// chat), when to notify (following the price by default, or near a value the
// person has in mind), and one action. Where and how the price is read is
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
  if (condition.kind === "near_price") {
    const value = Number(amount.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(value) && value >= 1 ? { ...condition, amount: value } : null;
  }
  return condition;
}

function amountOf(condition: WatchCondition): string {
  if (condition.kind === "near_price" || condition.kind === "target_price")
    return condition.amount >= 1 ? String(condition.amount) : "";
  return "";
}

/**
 * Where the form starts. A draft without a condition starts on following the price (10/11/2026: the
 * person may have no price in mind); the conditions before that date stay as they were.
 */
function initial(rule: WatchRule): WatchCondition {
  if (rule.condition.kind !== "none") return rule.condition;
  return rule.kind === "discovery" ? { kind: "new_match" } : { kind: "price_drop" };
}

const LEGACY = new Set<WatchCondition["kind"]>(["target_price", "drop_percent"]);

export function WatchDraftView(props: {
  watch: Watch;
  title: string;
  actionable: boolean;
  onSave: (draft: WatchRule) => void;
  onConfirm: () => void;
  /** Saves the edits and confirms the saved version in one step. Without it, saving comes first. */
  onSaveAndConfirm?: (draft: WatchRule) => void;
  /**
   * Sends the person's answers to the open questions, for the tone to adjust the plan. Without it
   * (the conversation), the person answers by writing, and the card only shows the questions.
   */
  onAnswer?: (answers: string) => void;
  busy?: boolean;
}) {
  const { watch, actionable } = props;
  const ids = useId();
  const [condition, setCondition] = useState<WatchCondition>(initial(watch.draft));
  const [amount, setAmount] = useState(amountOf(watch.draft.condition));
  const [email, setEmail] = useState(watch.draft.notify.email);
  const [picks, setPicks] = useState<Record<string, string[]>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  // Back to the saved rule only when another version arrives: a refetch of the same version
  // (a new object) used to undo what the person had just ticked, and the tick "did not stick".
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed by id and version on purpose.
  useEffect(() => {
    setCondition(initial(watch.draft));
    setAmount(amountOf(watch.draft.condition));
    setEmail(watch.draft.notify.email);
    setPicks({});
    setTexts({});
  }, [watch.id, watch.version]);

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
  // What the card itself can answer (when to notify) is the form; the rest are questions.
  const answerable = actionable && Boolean(props.onAnswer);
  const questions = watch.review.clarifications.filter((c) => !(actionable && c.field === "condition"));
  const conditionMissing =
    draft.condition.kind === "none" && watch.review.clarifications.some((c) => c.field === "condition");
  const incomplete = condition.kind !== "none" && !chosen;
  const keyOf = (c: (typeof questions)[number]) => c.id ?? c.field;
  const answered = questions.every((c) =>
    c.options?.length ? (picks[keyOf(c)]?.length ?? 0) > 0 : Boolean(texts[keyOf(c)]?.trim()),
  );
  const blocked = questions.length > 0 || conditionMissing || incomplete;
  const reason = incomplete
    ? amount
      ? "Diga um valor a partir de R$ 1."
      : "Escreva o valor que você tem em mente."
    : questions.length
      ? answerable
        ? "Responda as perguntas acima para eu ajustar o plano."
        : "Para ativar, responda o que falta na conversa."
      : conditionMissing
        ? "Para ativar, escolha quando avisar."
        : null;

  const confirm = () => {
    if (!edited) return props.onConfirm();
    if (props.onSaveAndConfirm) return props.onSaveAndConfirm(draft);
    props.onSave(draft);
  };
  const answer = () => {
    if (!props.onAnswer || !answered) return;
    props.onAnswer(
      questions
        .map((c) => `${c.question} ${c.options?.length ? (picks[keyOf(c)] ?? []).join(", ") : texts[keyOf(c)]?.trim()}`)
        .join("\n"),
    );
  };
  const toggle = (key: string, option: string, multiple: boolean) =>
    setPicks((current) => {
      const now = current[key] ?? [];
      if (!multiple) return { ...current, [key]: [option] };
      return { ...current, [key]: now.includes(option) ? now.filter((o) => o !== option) : [...now, option] };
    });
  // Choosing an option that needs a number moves the keyboard to its field.
  const amountField = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState(0);
  useEffect(() => {
    if (picked) amountField.current?.focus();
  }, [picked]);
  const pick = (next: WatchCondition) => {
    setCondition(next);
    setAmount(amountOf(next));
    if (next.kind === "near_price") setPicked((value) => value + 1);
  };
  const legacy = LEGACY.has(watch.draft.condition.kind) ? watch.draft.condition : null;

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

      {questions.length ? (
        <div className="watch-questions">
          <p className="watch-questions-title">
            {answerable ? "Antes de montar, me ajude a acertar" : "Falta combinar"}
          </p>
          {questions.map((c) => {
            const key = keyOf(c);
            if (!answerable)
              return <p key={key}>{c.options?.length ? `${c.question} (${c.options.join(", ")})` : c.question}</p>;
            return c.options?.length ? (
              <fieldset key={key} className="watch-question">
                <legend>
                  {c.question}
                  {c.multiple ? <span className="hint"> Pode marcar mais de um.</span> : null}
                </legend>
                <div className="choices">
                  {c.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="choice"
                      aria-pressed={(picks[key] ?? []).includes(option)}
                      disabled={props.busy}
                      onClick={() => toggle(key, option, Boolean(c.multiple))}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <label key={key} className="watch-question">
                <span>{c.question}</span>
                <input
                  className="input"
                  value={texts[key] ?? ""}
                  disabled={props.busy}
                  onChange={(event) => setTexts((current) => ({ ...current, [key]: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") answer();
                  }}
                />
              </label>
            );
          })}
          {answerable ? (
            <div className="watch-actions">
              <button type="button" className="btn solid" disabled={!answered || props.busy} onClick={answer}>
                {props.busy ? "Ajustando o plano…" : "Ajustar o plano"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {actionable ? (
        <fieldset className="watch-edit">
          <legend>Quando avisar</legend>
          {watch.draft.kind === "monitoring" ? (
            <div className={`watch-option${condition.kind === "price_drop" ? " selected" : ""}`}>
              <label className="watch-choice">
                <input
                  type="radio"
                  name={`${ids}-cond`}
                  checked={condition.kind === "price_drop"}
                  aria-describedby={`${ids}-drop`}
                  onChange={() => pick({ kind: "price_drop" })}
                />
                <span>Acompanhar a variação do preço</span>
              </label>
              <p id={`${ids}-drop`} className="watch-option-hint">
                Eu sigo o histórico e aviso quando o preço cair bem abaixo do normal.
              </p>
            </div>
          ) : null}
          <div className={`watch-option${condition.kind === "near_price" ? " selected" : ""}`}>
            <label className="watch-choice">
              <input
                type="radio"
                name={`${ids}-cond`}
                checked={condition.kind === "near_price"}
                aria-describedby={`${ids}-near`}
                onChange={() => pick({ kind: "near_price", amount: 0, currency: "BRL" })}
              />
              <span>Quando o preço estiver perto de</span>
            </label>
            {condition.kind === "near_price" ? (
              <span className="watch-amount">
                <span aria-hidden="true">R$</span>
                <input
                  ref={amountField}
                  className="input"
                  inputMode="decimal"
                  aria-label="Valor que você tem em mente, em reais"
                  placeholder="300"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^\d,.]/g, ""))}
                />
              </span>
            ) : null}
            <p id={`${ids}-near`} className="watch-option-hint">
              Aviso quando chegar perto desse valor, um pouco acima ou abaixo.
            </p>
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
          {legacy ? (
            <div className={`watch-option${condition.kind === legacy.kind ? " selected" : ""}`}>
              <label className="watch-choice">
                <input
                  type="radio"
                  name={`${ids}-cond`}
                  checked={condition.kind === legacy.kind}
                  onChange={() => pick(legacy)}
                />
                <span>
                  {watchFacts({ ...watch.draft, condition: legacy }).find(([label]) => label === "Quando avisar")?.[1]}
                </span>
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
