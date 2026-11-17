// Gerado de toneorg/server@bfcce76fe9c9 (packages/shared/src/memory-keys.ts). Não edite aqui.
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
 * never as an inference. Any key under `beleza.pele.` counts too.
 */
export const SENSITIVE_KEYS = ["beleza.tom", "beleza.subtom", "beleza.coloracao", "beleza.tipo_de_pele"] as const;
const SENSITIVE_PREFIX = "beleza.pele.";

/** Whether a memory key is sensitive data, whatever its accents or case. */
export function isSensitiveKey(key: string): boolean {
  const folded = fold(key).trim();
  return (SENSITIVE_KEYS as readonly string[]).includes(folded) || folded.startsWith(SENSITIVE_PREFIX);
}
