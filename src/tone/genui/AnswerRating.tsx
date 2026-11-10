// Gerado de toneorg/extension@62bd2817cbca (packages/genui-react/src/AnswerRating.tsx). Não edite aqui.
// "Esta resposta ajudou?": two thumbs under an answer. A thumb up is one tap; a thumb
// down is kept at once and opens an optional folha with ready reasons and a line of
// the person's own, which can be sent or skipped. Tapping the marked thumb takes it
// back. The surface says where the rating goes (onRate); a failure puts it back.
import {
  ANSWER_COMMENT_MAX,
  ANSWER_RATING_REASONS,
  type AnswerRatingReason,
  type AnswerRatingValue,
} from "@/tone/shared";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon";

export type AnswerRatingChange = "good" | "bad" | "none";
export interface AnswerRatingDetail {
  reasons: AnswerRatingReason[];
  comment?: string;
}

export function AnswerRating(props: {
  rating: AnswerRatingValue | null;
  onRate: (rating: AnswerRatingChange, detail?: AnswerRatingDetail) => Promise<void>;
}) {
  const [rating, setRating] = useState<AnswerRatingValue | null>(props.rating);
  const [status, setStatus] = useState("");
  const [asking, setAsking] = useState(false);
  useEffect(() => setRating(props.rating), [props.rating]);

  const rate = async (next: AnswerRatingChange) => {
    const before = rating;
    setRating(next === "none" ? null : next);
    try {
      await props.onRate(next);
      setStatus(next === "none" ? "" : next === "good" ? "Obrigada!" : "Anotado.");
      if (next === "bad") setAsking(true);
    } catch {
      setRating(before);
      setStatus("Não consegui enviar. Confira a internet e tente de novo.");
    }
  };

  return (
    <div className="answer-rating">
      <button
        type="button"
        className="icon-btn rating-thumb"
        aria-label="Boa resposta"
        aria-pressed={rating === "good"}
        onClick={() => void rate(rating === "good" ? "none" : "good")}
      >
        <Icon name="thumbUp" size={18} stroke={1.5} filled={rating === "good"} />
      </button>
      <button
        type="button"
        className="icon-btn rating-thumb"
        aria-label="Resposta ruim"
        aria-pressed={rating === "bad"}
        aria-haspopup="dialog"
        onClick={() => void rate(rating === "bad" ? "none" : "bad")}
      >
        <Icon name="thumbDown" size={18} stroke={1.5} filled={rating === "bad"} />
      </button>
      <span role="status" className="small muted rating-status">
        {status}
      </span>
      {asking ? (
        <RatingSheet
          onClose={() => setAsking(false)}
          onSend={async (detail) => {
            await props.onRate("bad", detail);
            setStatus("Obrigada por contar.");
          }}
        />
      ) : null}
    </div>
  );
}

/** The folha of a thumb down (components/surface.md), on a native modal dialog. */
function RatingSheet(props: { onClose: () => void; onSend: (detail: AnswerRatingDetail) => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const hint = useId();
  const [reasons, setReasons] = useState<AnswerRatingReason[]>([]);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"writing" | "sending" | "failed">("writing");
  const [leaving, setLeaving] = useState(false);
  const onClose = useRef(props.onClose);
  onClose.current = props.onClose;

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    return () => {
      if (element.open) element.close();
      previous?.focus();
    };
  }, []);

  // The exit is softer than the entrance: 150 ms, then the parent takes the folha away.
  const close = () => {
    if (leaving) return;
    setLeaving(true);
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => onClose.current(), reduced ? 0 : 150);
  };

  const toggle = (value: AnswerRatingReason) =>
    setReasons((list) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]));
  const text = comment.trim();
  const empty = reasons.length === 0 && !text;

  const send = async () => {
    if (state === "sending") return;
    // Nothing chosen or written: the thumb down is already kept, so sending just closes.
    if (empty) return close();
    setState("sending");
    try {
      await props.onSend({ reasons, ...(text ? { comment: text } : {}) });
      close();
    } catch {
      setState("failed");
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape closes the dialog from the keyboard (onCancel).
    <dialog
      ref={dialog}
      aria-labelledby={title}
      aria-describedby={hint}
      className={`rating-sheet${leaving ? " leaving" : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      // A click on the scrim lands on the dialog itself, outside its panel.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <form
        className="rating-panel"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div aria-hidden="true" className="rating-handle" />
        <h2 id={title} className="rating-title">
          O que não ficou bom?
        </h2>
        <p id={hint} className="small muted">
          Opcional. Escolha um ou mais motivos, ou conte com as suas palavras.
        </p>
        <fieldset className="rating-reasons">
          <legend className="visually-hidden">Motivos</legend>
          <div className="choices">
            {ANSWER_RATING_REASONS.map((reason) => (
              <button
                key={reason.value}
                type="button"
                className="choice"
                aria-pressed={reasons.includes(reason.value)}
                onClick={() => toggle(reason.value)}
              >
                {reason.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="rating-field">
          <label className="rating-label" htmlFor={`${title}-comentario`}>
            Quer contar mais?
          </label>
          <textarea
            id={`${title}-comentario`}
            className="rating-comment"
            rows={3}
            maxLength={ANSWER_COMMENT_MAX}
            value={comment}
            placeholder="O que você esperava ver?"
            onChange={(event) => setComment(event.target.value)}
          />
        </div>
        {state === "failed" ? (
          <p role="alert" className="rating-error">
            Não consegui enviar. Confira a internet e tente de novo.
          </p>
        ) : null}
        <div className="rating-actions">
          <button type="button" className="btn ghost" onClick={close}>
            Agora não
          </button>
          <button type="submit" className="btn solid" disabled={state === "sending"}>
            {state === "sending" ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
