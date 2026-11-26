"use client";
// "Escolher lojas" (25/11/2026): the stores tone looks at first for one kind of product. It used to
// sit open above the composer after every search ("está fixo e fica aparecendo, e não ta intuitivo");
// now it is a folha opened from the line of the search it changes, with the stores as chips and one
// action that does what the person came for: search again with them.
import { useEffect, useId, useRef, useState } from "react";
import { STORE_CATEGORY_LABELS, type StorePreferenceCategory, type StoreOption } from "@/tone/shared";
import { track } from "./analytics";
import { api } from "./api";
import { Sheet, useSheetClose } from "./Sheet";
import { preferredDomain, saveStorePreferences } from "./store-preferences";
import { field, outlineButton, solidButton } from "./ui";

/** The known stores of each kind, offered even before a search found them. */
const SUGGESTIONS: Partial<Record<StorePreferenceCategory, string[]>> = {
  tenis: ["centauro.com.br", "netshoes.com.br", "dafiti.com.br", "nike.com.br", "adidas.com.br", "mercadolivre.com.br"],
  calcados: ["dafiti.com.br", "arezzo.com.br", "centauro.com.br", "netshoes.com.br"],
  roupa: ["cea.com.br", "lojasrenner.com.br", "hering.com.br", "zara.com", "dafiti.com.br"],
  perfumaria: ["sephora.com.br", "epocacosmeticos.com.br", "belezanaweb.com.br", "amazon.com.br"],
  beleza: ["sephora.com.br", "epocacosmeticos.com.br", "belezanaweb.com.br", "drogaraia.com.br"],
  eletronicos: [
    "amazon.com.br",
    "mercadolivre.com.br",
    "magazineluiza.com.br",
    "kabum.com.br",
    "casasbahia.com.br",
    "fastshop.com.br",
  ],
  outros: ["amazon.com.br", "mercadolivre.com.br", "magazineluiza.com.br"],
};

/** The names people know, for the domains of the suggestions. */
const NAMES: Record<string, string> = {
  "amazon.com.br": "Amazon",
  "mercadolivre.com.br": "Mercado Livre",
  "magazineluiza.com.br": "Magalu",
  "kabum.com.br": "KaBuM!",
  "casasbahia.com.br": "Casas Bahia",
  "fastshop.com.br": "Fast Shop",
  "centauro.com.br": "Centauro",
  "netshoes.com.br": "Netshoes",
  "dafiti.com.br": "Dafiti",
  "nike.com.br": "Nike",
  "adidas.com.br": "Adidas",
  "arezzo.com.br": "Arezzo",
  "cea.com.br": "C&A",
  "lojasrenner.com.br": "Renner",
  "hering.com.br": "Hering",
  "zara.com": "Zara",
  "sephora.com.br": "Sephora",
  "epocacosmeticos.com.br": "Época Cosméticos",
  "belezanaweb.com.br": "Beleza na Web",
  "drogaraia.com.br": "Droga Raia",
};

const chip =
  "press inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function StorePreferenceBody(props: {
  category: StorePreferenceCategory;
  suggested: string[];
  options: StoreOption[];
  busy: boolean;
  onResearch?: () => Promise<void>;
}) {
  const { category } = props;
  const close = useSheetClose();
  const id = useId();
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [domain, setDomain] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  useEffect(() => {
    let cancelled = false;
    api
      .storePreferences(category)
      .then((value) => {
        if (cancelled) return;
        setSaved(value.stores);
        setSelected(value.stores);
        setCustom(value.stores);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setError("Não consegui ler suas lojas. Feche e abra de novo.");
      });
    return () => {
      cancelled = true;
    };
  }, [category]);
  const found = props.suggested.map(preferredDomain).filter((value): value is string => Boolean(value));
  const stores = [...new Set([...custom, ...(SUGGESTIONS[category] ?? []), ...found])].slice(0, 16);
  const label = (store: string) =>
    props.options.find((option) => option.domain === store)?.label ?? NAMES[store] ?? store.replace(/^www\./, "");
  const changed = selected.length !== saved.length || selected.some((store) => !saved.includes(store));
  const toggle = (store: string) =>
    setSelected((values) => (values.includes(store) ? values.filter((value) => value !== store) : [...values, store]));

  async function save(research: boolean) {
    if (locked.current || !loaded || props.busy) return;
    locked.current = true;
    setWorking(true);
    setError("");
    try {
      // The search goes on in the conversation: the folha closes as soon as the stores are saved.
      await saveStorePreferences(category, selected, api.saveStorePreferences);
      track("store_preferences_saved", { category, stores: selected.length, research });
      close();
      if (research) void props.onResearch?.();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não consegui salvar agora. Tente de novo.");
      locked.current = false;
      setWorking(false);
    }
  }

  const disabled = !loaded || props.busy || working;
  const noun = STORE_CATEGORY_LABELS[category].toLocaleLowerCase("pt-BR");
  return (
    <div className="flex flex-col gap-5">
      <p className="text-small text-graphite text-pretty">
        Marque onde olhar primeiro quando a busca for de {noun}. Outras lojas ainda aparecem se tiverem um preço melhor.
      </p>
      {!loaded && !error ? (
        <p role="status" className="text-small text-graphite">
          Lendo suas lojas…
        </p>
      ) : null}
      <div role="group" aria-label="Lojas" className="flex flex-wrap gap-2">
        {stores.map((store) => {
          const on = selected.includes(store);
          return (
            <button
              key={store}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(store)}
              className={`${chip} ${on ? "bg-ink text-on-ink" : "bg-surface text-ink shadow-raised"}`}
            >
              {on ? <CheckIcon /> : null}
              {label(store)}
            </button>
          );
        })}
        {adding ? null : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAdding(true)}
            className={`${chip} text-graphite underline-offset-4 hover:text-ink hover:underline`}
          >
            Outra loja
          </button>
        )}
      </div>
      {adding ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = preferredDomain(domain);
            if (!value) {
              setError("Escreva só o endereço da loja, como loja.com.br.");
              return;
            }
            if (!selected.includes(value) && selected.length >= 10) {
              setError("Dá para marcar até 10 lojas por tipo de produto.");
              return;
            }
            setCustom((values) => [...new Set([value, ...values])]);
            setSelected((values) => [...new Set([...values, value])]);
            setDomain("");
            setError("");
            setAdding(false);
          }}
          className="flex flex-col gap-2"
        >
          <label htmlFor={`${id}-domain`} className="text-ui text-ink">
            Endereço da loja
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={`${id}-domain`}
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              disabled={disabled}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
              placeholder="loja.com.br"
              className={`${field} min-w-0 flex-1`}
            />
            <button type="submit" className={outlineButton} disabled={disabled || !domain.trim()}>
              Adicionar
            </button>
          </div>
        </form>
      ) : null}
      {error ? (
        <p role="alert" className="text-small text-alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {props.onResearch ? (
          <>
            <button type="button" className={solidButton} disabled={disabled} onClick={() => void save(true)}>
              {working ? "Salvando…" : "Pesquisar de novo"}
            </button>
            <button type="button" className={outlineButton} disabled={disabled || !changed} onClick={() => void save(false)}>
              Só salvar
            </button>
          </>
        ) : (
          <button type="button" className={solidButton} disabled={disabled || !changed} onClick={() => void save(false)}>
            {working ? "Salvando…" : "Salvar"}
          </button>
        )}
      </div>
    </div>
  );
}

/** The folha: opened from "Escolher lojas" on the line of a search. */
export function StorePreferencesSheet(props: {
  category: StorePreferenceCategory;
  /** The stores of the search it came from, offered beside the known ones. */
  suggested?: string[];
  options?: StoreOption[];
  busy: boolean;
  /** Repeats the search it came from with the stores saved, keeping its constraints. */
  onResearch?: () => Promise<void>;
  onClose: () => void;
}) {
  const noun = STORE_CATEGORY_LABELS[props.category].toLocaleLowerCase("pt-BR");
  return (
    <Sheet title={`Lojas para ${noun}`} onClose={props.onClose}>
      <StorePreferenceBody
        category={props.category}
        suggested={props.suggested ?? []}
        options={props.options ?? []}
        busy={props.busy}
        onResearch={props.onResearch}
      />
    </Sheet>
  );
}
