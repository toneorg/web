// Gerado de toneorg/server@ca2edd86218b (packages/shared/src/memory-keys.ts). Não edite aqui.
/**
 * Canonical memory keys the server turns into search constraints. Lists are comma separated;
 * the budget is a number in BRL. Older keys ("roupa.marca_evitada") are matched by `memoryKeyKind`.
 */
export const MEMORY_KEY_SUFFIXES = {
  size: "tamanho",
  colorsWanted: "cores_desejadas",
  colorsAvoided: "cores_evitadas",
  budget: "orcamento_max",
  brandsPreferred: "marcas_preferidas",
  brandsAvoided: "marcas_evitadas",
  storesAvoided: "lojas_evitadas",
} as const;

export type MemoryKeyKind = keyof typeof MEMORY_KEY_SUFFIXES;

/** The canonical key of one kind in one category ("roupa" + "size" gives "roupa.tamanho"). */
export function memoryKey(category: string, kind: MemoryKeyKind): string {
  return `${category}.${MEMORY_KEY_SUFFIXES[kind]}`;
}

const fold = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** A word as a whole piece of the key, so "corpo" and "corte" are not "cor". */
const segment = (suffix: string, words: string) => new RegExp(`(^|[._])(${words})($|[._])`).test(suffix);

/**
 * What a memory key says, by the part after the category. Canonical suffixes match exactly; older
 * keys match loosely: the suffix has "cor", "marca" or "loja" with "evit", "prefer" or "desej"
 * (a color with no modifier counts as wanted). Null when the key is not one of these.
 */
export function memoryKeyKind(key: string): { category: string; kind: MemoryKeyKind } | null {
  const [category, ...rest] = fold(key).split(".");
  const suffix = rest.join(".");
  if (!category || !suffix) return null;
  for (const [kind, canonical] of Object.entries(MEMORY_KEY_SUFFIXES))
    if (suffix === canonical) return { category, kind: kind as MemoryKeyKind };
  const avoided = suffix.includes("evit");
  const wanted = suffix.includes("prefer") || suffix.includes("desej");
  if (suffix.includes("loja") && avoided) return { category, kind: "storesAvoided" };
  if (suffix.includes("marca") && avoided) return { category, kind: "brandsAvoided" };
  if (suffix.includes("marca") && wanted) return { category, kind: "brandsPreferred" };
  if (segment(suffix, "cor|cores")) return { category, kind: avoided ? "colorsAvoided" : "colorsWanted" };
  if (segment(suffix, "tamanho")) return { category, kind: "size" };
  if (segment(suffix, "orcamento")) return { category, kind: "budget" };
  return null;
}

/**
 * Keys that may reveal racial or ethnic origin (LGPD, art. 5º, II): skin tone, undertone, personal
 * coloring and skin type. They are saved only with the person's specific consent (art. 11, I), and
 * never as an inference.
 */
export const SENSITIVE_KEYS = ["beleza.tom", "beleza.subtom", "beleza.coloracao", "beleza.tipo_de_pele"] as const;
const SENSITIVE_PREFIX = "beleza.pele.";
/** Under these categories, a key that starts with one of these words is sensitive ("beleza.tom.verao"). */
const SENSITIVE_CATEGORIES = new Set(["beleza", "maquiagem"]);
const SENSITIVE_START = /^(tom|subtom|coloracao|tipo_de_pele)($|[._])/;
/** Anywhere in a key, even at the top level ("tom_de_pele", from "tom de pele: médio"). */
const SENSITIVE_PART = /^(tom_de_pele|cor_da_pele)($|_)/;

/** Whether a memory key is sensitive data, whatever its accents, case or spaces. */
export function isSensitiveKey(key: string): boolean {
  const folded = fold(key)
    .trim()
    .replace(/[^a-z0-9._]+/g, "_");
  if ((SENSITIVE_KEYS as readonly string[]).includes(folded) || folded.startsWith(SENSITIVE_PREFIX)) return true;
  const [category = "", ...rest] = folded.split(".");
  if (SENSITIVE_CATEGORIES.has(category) && SENSITIVE_START.test(rest.join("."))) return true;
  return folded.split(".").some((part) => SENSITIVE_PART.test(part));
}
