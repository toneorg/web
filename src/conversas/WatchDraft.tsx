"use client";
// T09 on the web: a watch draft to review and confirm. Only the person confirms, the version on screen.
import { useEffect, useState } from "react";
import { describeWatch, type Watch } from "@/tone/shared";
import { api } from "./api";

const STATUS = { draft: "Rascunho: nada roda antes de você confirmar", active: "Ativo", paused: "Pausado", deleted: "Excluído" } as const;

export function WatchDraft(props: { watchId: string; title: string }) {
  const [watch, setWatch] = useState<Watch | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    api
      .watch(props.watchId)
      .then((loaded) => live && setWatch(loaded))
      .catch(() => live && setError("Não consegui abrir o acompanhamento."));
    return () => {
      live = false;
    };
  }, [props.watchId]);
  if (watch === undefined && !error) return <p className="text-small text-graphite">Carregando o acompanhamento…</p>;
  if (!watch) return <p className="text-small text-graphite">{error ?? "Este acompanhamento não existe mais."}</p>;
  const confirmable = watch.review.canConfirm && !(watch.confirmedVersion === watch.version && watch.status !== "draft");
  return (
    <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-raised" aria-label={props.title}>
      <h3 className="text-subheading text-ink">{props.title}</h3>
      <p className="text-caption text-graphite">{STATUS[watch.status]}</p>
      <ul className="list-disc pl-5 text-small text-ink">
        {describeWatch(watch.draft).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {watch.review.clarifications.map((c) => (
        <p key={c.field} className="text-small text-ink">
          {c.question}
        </p>
      ))}
      <ul className="text-caption text-graphite">
        {watch.review.sources
          .filter((source) => source.stores.length)
          .map((source) => (
            <li key={source.id}>
              {source.label} ({source.autonomous ? "roda sem o navegador" : "só com o navegador aberto"}): {source.note}
            </li>
          ))}
        {watch.review.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <button
        type="button"
        disabled={!confirmable}
        onClick={() =>
          api
            .confirmWatch(watch.id, watch.version)
            .then(setWatch)
            .catch((failure: unknown) => setError(failure instanceof Error ? failure.message : "Não deu certo."))
        }
        className="min-h-11 self-start rounded-full bg-ink px-5 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {watch.confirmed ? "Confirmar esta versão" : "Confirmar e ativar"}
      </button>
      {!watch.review.canConfirm ? <p className="text-caption text-graphite">Responda as perguntas acima na conversa para poder confirmar.</p> : null}
      {error ? (
        <p role="alert" className="text-small font-medium text-alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
