// Gerado de toneorg/server@d32e8f2a3aca (packages/shared/src/store-preferences.ts). Não edite aqui.
import * as z from "zod";

export const StorePreferenceCategory = z.enum([
  "tenis",
  "calcados",
  "roupa",
  "beleza",
  "perfumaria",
  "eletronicos",
  "outros",
]);
export type StorePreferenceCategory = z.infer<typeof StorePreferenceCategory>;
export const STORE_CATEGORY_LABELS: Record<StorePreferenceCategory, string> = {
  tenis: "Tênis",
  calcados: "Calçados",
  roupa: "Roupas",
  beleza: "Beleza",
  perfumaria: "Perfumes",
  eletronicos: "Eletrônicos",
  outros: "Outros produtos",
};
/** A domain is a saved preference, never permission to fetch an arbitrary URL. */
export const PreferredStoreDomain = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/^www\./, ""))
  .pipe(
    z
      .string()
      .max(253)
      .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/)
      .refine(
        (domain) => !/\.(local|localhost|internal|test|invalid|example)$/.test(domain),
        "Informe o domínio público da loja.",
      ),
  );
export const StorePreferenceEdit = z.object({
  stores: z
    .array(PreferredStoreDomain)
    .max(10)
    .refine((stores) => new Set(stores).size === stores.length, "Lojas repetidas."),
});
export type StorePreferenceEdit = z.infer<typeof StorePreferenceEdit>;
export const StorePreferences = StorePreferenceEdit.extend({ category: StorePreferenceCategory });
export type StorePreferences = z.infer<typeof StorePreferences>;
/** Narrow category from the purchase request, not the conversation's broader skill. */
export function storePreferenceCategory(query: string): StorePreferenceCategory {
  const text = query.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  if (/\b(tenis|sneakers?)\b/.test(text)) return "tenis";
  if (/\b(sapatos?|sandalias?|botas?|chinelos?|calcados?|mocassim|scarpin)\b/.test(text)) return "calcados";
  if (/\b(perfumes?|perfumaria|fragrancias?|sauvage)\b/.test(text)) return "perfumaria";
  if (/\b(maquiagem|beleza|cosmeticos?|shampoo|hidratante|skincare|batom|protetor solar)\b/.test(text)) return "beleza";
  if (/\b(camisetas?|camisas?|calcas?|vestidos?|jaquetas?|roupas?|bermudas?|blusas?|saias?)\b/.test(text))
    return "roupa";
  if (
    /\b(celulares?|iphone|smartphone|notebook|computador|monitor|televisao|tv|fones?|headphone|eletronicos?|tablet|ipad|macbook)\b/.test(
      text,
    )
  )
    return "eletronicos";
  return "outros";
}
