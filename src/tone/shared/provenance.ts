// Gerado de toneorg/server@e9a826ebdde9 (packages/shared/src/provenance.ts). Não edite aqui.
// T13/T14/T16: where the prices of a research run came from, said the same way
// in the panel and on the web: observed in the index (T04) or read in the store's
// search by a remote browser of tone (T16). Rows from the retired extension (T14)
// still read as "extension".
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
  "kabum.com.br": "KaBuM!",
  "iplace.com.br": "iPlace",
  "carrefour.com.br": "Carrefour",
  "fastshop.com.br": "Fast Shop",
  "pontofrio.com.br": "Ponto",
  "extra.com.br": "Extra",
  "apple.com": "Apple",
  "google.com": "Google Shopping",
  "dior.com": "Dior",
  "shein.com": "Shein",
  "hering.com.br": "Hering",
  "usereserva.com": "Reserva",
  "tf.com.br": "Track&Field",
  "johnjohndenim.com.br": "John John",
  "lelis.com.br": "Le Lis",
  "malwee.com.br": "Malwee",
  // Read through Tilion (20/11/2026).
  "zara.com": "Zara",
  "dafiti.com.br": "Dafiti",
  "centauro.com.br": "Centauro",
  "farmrio.com.br": "Farm",
};
/** A store's name as people say it, from its domain. */
export const storeLabel = (store: string) => STORE_NAMES[store] ?? store;

// legado: só leitura de linhas antigas ("extension")
export type PriceProvenance = "index" | "amazon" | "local" | "extension" | "remote" | "direct" | "catalog" | "shopify";

/** The kinds of reading behind the offers of a run, from its evidence. */
export function provenanceOf(run: Pick<ResearchRunState, "result">): Set<PriceProvenance> {
  const kinds = new Set<PriceProvenance>();
  for (const entry of run.result?.evidence ?? [])
    kinds.add(
      // The catalog copy is the store's own data at either level: re-read now, or as of its last sync.
      entry.source.startsWith("catalog:")
        ? "catalog"
        : // The catalog of Shopify stores: what each store published to the platform, not its page.
          entry.source.startsWith("shopify:")
          ? "shopify"
          : entry.level === "index"
            ? entry.source.startsWith("dataforseo.")
              ? "amazon"
              : "index"
            : entry.source.startsWith("local:")
              ? "local"
              : entry.source.startsWith("remote:")
                ? "remote"
                : entry.source.startsWith("direct:")
                  ? "direct"
                  : "extension",
    );
  return kinds;
}

export function provenanceNote(run: Pick<ResearchRunState, "result">): string {
  const kinds = provenanceOf(run);
  const when = run.result
    ? ` em ${new Date(run.result.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`
    : "";
  if (kinds.size > 1)
    return "Os preços vêm de fontes diferentes, indicadas em cada evidência; a loja pode ter outro valor, frete ou estoque.";
  if (kinds.has("amazon"))
    return `Preços anunciados na listagem da Amazon Brasil, obtidos por um provedor de dados${when}; vendedor, variante, frete e estoque podem precisar de confirmação.`;
  if (kinds.has("shopify"))
    return `Preços publicados pelas próprias lojas no catálogo da Shopify${when}; a página da loja pode ter outro valor, frete ou estoque.`;
  if (kinds.has("catalog"))
    return `Preços do catálogo da própria loja, copiado pela tone e conferido na loja${when}; frete e estoque do seu endereço podem mudar.`;
  if (kinds.has("local"))
    return `Preços lidos por uma integração própria da tone na loja, sem login${when}; frete e estoque do seu endereço podem mudar.`;
  if (kinds.has("direct"))
    return `Preços lidos na busca da própria loja pela tone, sem login${when}; frete e estoque do seu endereço podem mudar.`;
  if (kinds.has("remote"))
    return `Preços lidos na busca da loja por um navegador remoto da tone, sem login${when}; frete e estoque do seu endereço podem mudar.`;
  if (kinds.has("extension"))
    return `Preços lidos na página da loja pela extensão, no seu Chrome${when}; frete e estoque podem mudar no carrinho.`;
  return `Preços anunciados pelas lojas${when}; a loja pode ter outro valor, frete ou estoque.`;
}
