"use client";
import { useEffect, useId, useRef, useState } from "react";
import { STORE_CATEGORY_LABELS, type StorePreferenceCategory, type StoreOption } from "@/tone/shared";
import { api } from "./api";
import { preferredDomain, saveStorePreferences } from "./store-preferences";
import { field, outlineButton, solidButton } from "./ui";

const SUGGESTIONS: Partial<Record<StorePreferenceCategory, string[]>> = {
  tenis: ["centauro.com.br", "netshoes.com.br", "dafiti.com.br", "nike.com.br", "adidas.com.br"],
  calcados: ["dafiti.com.br", "arezzo.com.br", "centauro.com.br"],
  roupa: ["cea.com.br", "lojasrenner.com.br", "hering.com.br"],
  perfumaria: ["sephora.com.br", "epocacosmeticos.com.br", "belezanaweb.com.br"],
  beleza: ["sephora.com.br", "epocacosmeticos.com.br", "belezanaweb.com.br"],
  eletronicos: ["kabum.com.br", "magazineluiza.com.br", "amazon.com.br"],
};

export function StorePreferenceEditor({ category, suggested = [], options = [], busy, onResearch }: {
  category: StorePreferenceCategory;
  suggested?: string[];
  options?: StoreOption[];
  busy: boolean;
  /** The conversation replays its saved request, preserving the original constraints. */
  onResearch?: () => Promise<void>;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [domain, setDomain] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const locked = useRef(false);
  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    api.storePreferences(category).then((value) => {
      if (cancelled) return;
      setSelected(value.stores);
      setCustom(value.stores);
      setLoaded(true);
      setError("");
    }).catch(() => { if (!cancelled) setError("Não consegui ler suas preferências. Feche e abra para tentar de novo."); });
    return () => { cancelled = true; };
  }, [category, loaded, open]);
  const stores = [...new Set([...(SUGGESTIONS[category] ?? []), ...suggested.map(preferredDomain).filter((value): value is string => Boolean(value)), ...custom])];
  const label = (store: string) => options.find((option) => option.domain === store)?.label ?? store;
  async function save(research: boolean) {
    if (locked.current || !loaded || busy) return;
    locked.current = true;
    setWorking(true);
    setError("");
    setNotice("");
    try {
      await saveStorePreferences(category, selected, api.saveStorePreferences, research ? onResearch : undefined);
      setNotice(research ? "Preferências salvas. Pesquisa refeita nesta conversa." : "Preferências salvas para suas próximas pesquisas nesta categoria.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não consegui salvar agora. Tente de novo.");
    } finally { locked.current = false; setWorking(false); }
  }
  return (
    <details className="rounded-panel bg-surface text-ink shadow-raised" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="min-h-11 cursor-pointer rounded-panel px-4 py-3 text-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
        Lojas para {STORE_CATEGORY_LABELS[category].toLocaleLowerCase("pt-BR")}
      </summary>
      <div className="flex flex-col gap-3 px-4 pb-4">
        <p className="text-small text-graphite">Quais lojas você quer priorizar nas próximas pesquisas de {STORE_CATEGORY_LABELS[category].toLocaleLowerCase("pt-BR")}? Salvo na sua conta, só para esta categoria. Outras lojas ainda podem aparecer.</p>
        {!loaded && !error ? <p role="status" className="text-small text-graphite">Lendo suas preferências…</p> : null}
        <fieldset disabled={!loaded || busy || working}>
          <legend className="sr-only">Lojas prioritárias</legend>
          <div className="grid gap-x-4 sm:grid-cols-2">
            {stores.map((store) => (
              <label key={store} className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-body">
                <input type="checkbox" checked={selected.includes(store)} onChange={(event) => { setNotice(""); setSelected((values) => event.target.checked ? [...values, store] : values.filter((value) => value !== store)); }} className="size-6 shrink-0 accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink" />
                <span className="break-all">{label(store)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <form onSubmit={(event) => {
          event.preventDefault();
          const value = preferredDomain(domain);
          if (!value) { setError("Informe o domínio da loja, como loja.com.br, sem https:// ou caminhos."); return; }
          if (!selected.includes(value) && selected.length >= 10) { setError("Escolha até 10 lojas por categoria."); return; }
          setCustom((values) => [...new Set([...values, value])]);
          setSelected((values) => [...new Set([...values, value])]);
          setDomain(""); setError(""); setNotice("");
        }} className="flex flex-col gap-2">
          <label htmlFor={`${id}-domain`} className="text-ui">Faltou uma loja?</label>
          <div className="flex flex-wrap items-center gap-2">
            <input id={`${id}-domain`} value={domain} onChange={(event) => setDomain(event.target.value)} disabled={!loaded || busy || working} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="loja.com.br" aria-describedby={`${id}-help`} className={`${field} min-w-0 flex-1`} />
            <button type="submit" className={outlineButton} disabled={!loaded || busy || working || !domain.trim()}>Adicionar loja</button>
          </div>
          <p id={`${id}-help`} className="text-caption text-graphite">Adicionar uma loja não confirma sua reputação. Para remover uma preferência, desmarque a loja e salve.</p>
        </form>
        {error ? <p role="alert" className="text-small text-alert">{error}</p> : null}
        <p role="status" className={notice ? "text-small text-graphite" : "sr-only"}>{notice}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={outlineButton} disabled={!loaded || busy || working} onClick={() => void save(false)}>{working ? "Salvando…" : "Salvar preferências"}</button>
          {onResearch ? <button type="button" className={solidButton} disabled={!loaded || busy || working} onClick={() => void save(true)}>Salvar e pesquisar agora</button> : null}
        </div>
        <p className="text-caption text-graphite">Salvar preferências não inicia uma pesquisa. Pesquisar agora repete o pedido anterior com os mesmos critérios.</p>
      </div>
    </details>
  );
}
