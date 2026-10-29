// Gerado de toneorg/extension@cab9f784af9d (packages/shared/src/provenance.ts). Não edite aqui.
// T13/T14/T16: where the prices of a research run came from, said the same way
// in the panel and on the web: observed in the index (T04), read in the store
// by the extension in the person's Chrome (T14), or read in the store's search
// by a remote browser of tone (T16).
import type { ResearchRunState } from "./progress";

const STORE_NAMES: Record<string, string> = {
  "mercadolivre.com.br": "Mercado Livre",
  "amazon.com.br": "Amazon Brasil",
  "amazon.com": "Amazon (EUA)",
  "magazineluiza.com.br": "Magalu",
  "sephora.com.br": "Sephora",
  "lojasrenner.com.br": "Renner",
  "epocacosmeticos.com.br": "Época Cosméticos",
  "belezanaweb.com.br": "Beleza na Web",
  "boticario.com.br": "O Boticário",
  "natura.com.br": "Natura",
  "drogasil.com.br": "Drogasil",
  "drogaraia.com.br": "Droga Raia",
  "paguemenos.com.br": "Pague Menos",
  "drogariasaopaulo.com.br": "Drogaria São Paulo",
  "riachuelo.com.br": "Riachuelo",
  "cea.com.br": "C&A",
  "americanas.com.br": "Americanas",
  "casasbahia.com.br": "Casas Bahia",
  "google.com": "Google Shopping",
  "dior.com": "Dior",
};
/** A store's name as people say it, from its domain. */
export const storeLabel = (store: string) => STORE_NAMES[store] ?? store;

export type PriceProvenance = "index" | "extension" | "remote";

/** The kinds of reading behind the offers of a run, from its evidence. */
export function provenanceOf(run: Pick<ResearchRunState, "result">): Set<PriceProvenance> {
  const kinds = new Set<PriceProvenance>();
  for (const entry of run.result?.evidence ?? [])
    kinds.add(entry.level === "index" ? "index" : entry.source.startsWith("remote:") ? "remote" : "extension");
  return kinds;
}

export function provenanceNote(run: Pick<ResearchRunState, "result">): string {
  const kinds = provenanceOf(run);
  const when = run.result
    ? ` em ${new Date(run.result.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`
    : "";
  if (kinds.size > 1)
    return "Os preços vêm de leituras diferentes: na página da loja e no índice do Google Shopping; a loja pode ter outro valor, frete ou estoque.";
  if (kinds.has("remote"))
    return `Preços lidos na busca da loja por um navegador remoto da tone, sem login${when}; frete e estoque do seu endereço podem mudar.`;
  if (kinds.has("extension"))
    return `Preços lidos na página da loja pela extensão, no seu Chrome${when}; frete e estoque podem mudar no carrinho.`;
  return `Preços observados no índice do Google Shopping${when}; a loja pode ter outro valor, frete ou estoque.`;
}
