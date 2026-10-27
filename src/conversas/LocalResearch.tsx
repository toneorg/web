"use client";
// T14: asking the person's own Chrome to read a store, in the extension's one work tab.
// Shown only when the extension is on and was seen recently; otherwise it says what is needed.
import { type FormEvent, useEffect, useState } from "react";
import { LOCAL_STORES, type LocalStore } from "@/tone/shared";
import { ApiError, api, nudgeExtension } from "./api";

const LABEL: Record<LocalStore, string> = { "amazon.com.br": "Amazon", "mercadolivre.com.br": "Mercado Livre" };

export function LocalResearch(props: { sessionId: string; suggestion: string; onStarted: (runId: string) => void }) {
  const [bridge, setBridge] = useState<{ available: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [stores, setStores] = useState<LocalStore[]>(["mercadolivre.com.br"]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    api
      .localBridge()
      .then((state) => live && setBridge(state))
      .catch(() => live && setBridge({ available: false }));
    return () => {
      live = false;
    };
  }, []);
  if (!bridge) return null;
  if (!bridge.available)
    return (
      <p className="text-caption text-graphite">
        Ler uma loja no seu Chrome precisa da extensão aberta, com “Deixar a tone pela web pesquisar no meu Chrome”
        ligado em “Você”.
      </p>
    );
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const run = await api.localRun(props.sessionId, query.trim(), stores);
      nudgeExtension(run.id);
      props.onStarted(run.id);
      setOpen(false);
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Não deu certo. Tente de novo.");
    } finally {
      setBusy(false);
    }
  };
  if (!open)
    return (
      <button
        type="button"
        onClick={() => {
          setQuery(props.suggestion.slice(0, 120));
          setOpen(true);
        }}
        className="min-h-11 self-start rounded-full bg-surface px-4 text-ui text-ink shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Pesquisar no meu Chrome
      </button>
    );
  return (
    <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-3 rounded-panel bg-surface p-4 shadow-raised">
      <p className="text-small text-ink">
        A extensão abre uma aba de trabalho no seu Chrome, sem tirar você da aba atual, e lê a busca e até dois produtos
        por loja. Se você fechar ou usar essa aba, ela para.
      </p>
      <label htmlFor="local-query" className="text-ui text-ink">
        O que procurar
      </label>
      <input
        id="local-query"
        value={query}
        maxLength={120}
        onChange={(event) => setQuery(event.target.value)}
        className="min-h-13 rounded-input border border-rule bg-surface px-4 text-body text-ink focus-visible:outline-2 focus-visible:outline-ink"
      />
      <fieldset className="flex flex-wrap gap-3">
        <legend className="mb-1 text-ui text-ink">Lojas</legend>
        {LOCAL_STORES.map((store) => (
          <label key={store} className="flex min-h-11 items-center gap-2 text-small text-ink">
            <input
              type="checkbox"
              checked={stores.includes(store)}
              onChange={(event) =>
                setStores(event.target.checked ? [...stores, store] : stores.filter((entry) => entry !== store))
              }
            />
            {LABEL[store]}
          </label>
        ))}
      </fieldset>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || !query.trim() || stores.length === 0}
          className="min-h-11 rounded-full bg-ink px-5 text-ui text-on-ink disabled:bg-rule disabled:text-graphite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {busy ? "Pedindo…" : "Pesquisar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-full px-4 text-ui text-ink focus-visible:outline-2 focus-visible:outline-ink">
          Cancelar
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-small font-medium text-alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
