// Gerado de toneorg/server@d5cb05dc2283 (packages/shared/src/fashion.ts). Não edite aqui.
// The fashion taxonomy of tone's discovery (19/11/2026): categories and attributes with closed
// values and the Portuguese words people and stores use for each one. One list serves to widen a
// search by words, to bound what a model may extract (enums), to explain values to the chat model
// and to compare a product with what the person asked. Values are canonical ids in Portuguese,
// without accents ("wide_leg", "algodao"); labels are what the person reads.

export interface TaxonomyValue {
  id: string;
  label: string;
  /** Other ways to write it, folded or not; the id and the label count too. */
  synonyms: readonly string[];
}

export interface FashionCategory extends TaxonomyValue {
  /** Categories close enough to show as an alternative (a polo for a "camisa"), never excluded. */
  related: readonly string[];
}

export const AUDIENCES = ["feminino", "masculino", "infantil", "unissex"] as const;
export type Audience = (typeof AUDIENCES)[number];

const cat = (id: string, label: string, synonyms: string[], related: string[] = []): FashionCategory => ({
  id,
  label,
  synonyms,
  related,
});

export const FASHION_CATEGORIES: readonly FashionCategory[] = [
  cat("camisa", "camisa", ["camisas", "camisa social", "camisao"], ["polo", "blusa"]),
  cat(
    "camiseta",
    "camiseta",
    ["camisetas", "t-shirt", "tshirt", "t shirt", "tee", "camiseta basica"],
    ["regata", "polo", "blusa"],
  ),
  cat("polo", "polo", ["camisa polo", "polos"], ["camisa", "camiseta"]),
  cat("blusa", "blusa", ["blusas", "bata", "top", "body"], ["camisa", "camiseta", "regata"]),
  cat("regata", "regata", ["regatas", "tank top"], ["camiseta", "blusa"]),
  cat("calca", "calça", ["calcas", "pantalona", "legging", "jogger", "calca jeans"], []),
  cat("bermuda", "bermuda", ["bermudas"], ["short"]),
  cat("short", "short", ["shorts", "shortinho"], ["bermuda", "saia"]),
  cat("saia", "saia", ["saias", "saia midi", "saia longa"], ["short", "vestido"]),
  cat("vestido", "vestido", ["vestidos", "chemise"], ["macacao", "saia"]),
  cat("macacao", "macacão", ["macacoes", "jardineira", "macaquinho"], ["vestido"]),
  cat(
    "jaqueta",
    "jaqueta",
    ["jaquetas", "jacket", "corta vento", "corta-vento", "puffer", "bomber", "aviador", "jaqueta jeans"],
    ["casaco", "blazer", "colete"],
  ),
  cat("casaco", "casaco", ["casacos", "sobretudo", "trench coat", "parka", "capa de chuva"], ["jaqueta", "blazer"]),
  cat("blazer", "blazer", ["blazers", "palito", "paleto", "terno"], ["jaqueta", "casaco"]),
  cat("colete", "colete", ["coletes"], ["jaqueta"]),
  cat(
    "moletom",
    "moletom",
    ["moletons", "hoodie", "blusa de moletom", "casaco de moletom"],
    ["sueter", "cardigan", "jaqueta"],
  ),
  cat("sueter", "suéter", ["sueteres", "pulover", "blusa de trico", "trico"], ["cardigan", "moletom"]),
  cat("cardigan", "cardigã", ["cardiga", "cardigas", "cardigans"], ["sueter", "moletom"]),
  cat("tenis", "tênis", ["sneaker", "sneakers", "tenis casual"], ["sapato"]),
  cat(
    "sapato",
    "sapato",
    ["sapatos", "oxford", "mocassim", "loafer", "scarpin", "sapatilha", "derby"],
    ["tenis", "bota"],
  ),
  cat("sandalia", "sandália", ["sandalias", "rasteira", "rasteirinha", "salto bloco", "papete"], ["chinelo"]),
  cat("chinelo", "chinelo", ["chinelos", "slide", "havaianas"], ["sandalia"]),
  cat("bota", "bota", ["botas", "coturno", "chelsea", "galocha"], ["sapato"]),
  cat("bolsa", "bolsa", ["bolsas", "mochila", "pochete", "clutch", "tote"], []),
  cat("cinto", "cinto", ["cintos"], []),
  cat("bone", "boné", ["bones", "chapeu", "bucket"], []),
  cat("oculos", "óculos", ["oculos de sol"], []),
  cat("biquini", "biquíni", ["biquinis", "maio", "saida de praia"], ["sunga"]),
  cat("sunga", "sunga", ["sungas", "short de praia", "bermuda de praia"], ["biquini", "bermuda"]),
  cat("pijama", "pijama", ["pijamas", "camisola"], []),
];

const val = (id: string, label: string, synonyms: string[] = []): TaxonomyValue => ({ id, label, synonyms });

export interface FashionAttribute {
  key: string;
  label: string;
  /** Several values may hold at once (colors, materials); otherwise one. */
  multiple: boolean;
  /**
   * What the photo judges better than the store's words (color, print): the photo outranks the title
   * here. Elsewhere (fit, length, collar) the store names the model and the photo only fills gaps.
   */
  visual: boolean;
  values: readonly TaxonomyValue[];
}

export const FASHION_ATTRIBUTES: readonly FashionAttribute[] = [
  {
    key: "cor",
    label: "cor",
    multiple: true,
    visual: true,
    values: [
      val("branco", "branco", [
        "branca",
        "brancas",
        "brancos",
        "off white",
        "offwhite",
        "off-white",
        "marfim",
        "creme",
        "gelo",
        "perola",
        "cru",
      ]),
      val("preto", "preto", ["preta", "pretas", "pretos", "black", "onix"]),
      val("cinza", "cinza", ["grafite", "chumbo", "mescla", "cinza mescla"]),
      val("bege", "bege", ["nude", "areia", "camel", "fendi"]),
      val("caqui", "cáqui", ["kaki", "khaki", "caqui"]),
      val("marrom", "marrom", ["chocolate", "cafe", "caramelo", "tabaco", "conhaque", "whisky", "castanho"]),
      val("azul", "azul", ["azul claro", "celeste", "azul bebe", "azul royal", "indigo"]),
      val("marinho", "azul-marinho", ["azul marinho", "azul-marinho", "navy"]),
      val("verde", "verde", ["verde militar", "militar", "oliva", "musgo", "verde agua", "menta"]),
      val("vermelho", "vermelho", ["vermelha", "vermelhas", "vermelhos", "red"]),
      val("bordo", "bordô", ["vinho", "marsala", "burgundy"]),
      val("rosa", "rosa", ["pink", "rose", "rosado", "fucsia"]),
      val("roxo", "roxo", ["roxa", "lilas", "lavanda", "violeta"]),
      val("amarelo", "amarelo", ["amarela", "mostarda"]),
      val("laranja", "laranja", ["terracota", "coral", "ferrugem"]),
      val("dourado", "dourado", ["dourada", "ouro"]),
      val("prata", "prata", ["prateado", "prateada"]),
    ],
  },
  {
    key: "estampa",
    label: "estampa",
    multiple: false,
    visual: true,
    values: [
      val("lisa", "lisa", ["liso", "lisas", "lisos", "sem estampa", "basica"]),
      val("listrada", "listrada", ["listrado", "listras", "riscas"]),
      val("xadrez", "xadrez", ["quadriculado", "tartan", "vichy"]),
      val("floral", "floral", ["flores", "florido", "florida"]),
      val("poa", "poá", ["bolinhas", "pois"]),
      val("animal_print", "animal print", ["oncinha", "zebra", "animal print", "cobra"]),
      val("geometrica", "geométrica", ["geometrico"]),
      val("tie_dye", "tie dye", ["tie-dye", "tiedye"]),
      val("estampada", "estampada", ["estampado", "estampa"]),
    ],
  },
  {
    key: "tecido",
    label: "tecido",
    multiple: true,
    visual: false,
    values: [
      val("algodao", "algodão", ["cotton", "algodao", "pima", "supima"]),
      val("linho", "linho", ["linen", "linhos"]),
      val("viscose", "viscose", ["viscolinho", "rayon"]),
      val("poliester", "poliéster", ["poliester", "polyester"]),
      val("elastano", "elastano", ["lycra", "spandex"]),
      val("seda", "seda", ["silk"]),
      val("cetim", "cetim", ["satin", "acetinado"]),
      val("crepe", "crepe", []),
      val("la", "lã", ["la", "wool", "merino", "cashmere", "caxemira"]),
      val("trico", "tricô", ["tricot", "trico", "tricoline"]),
      val("moletom", "moletom", ["fleece", "moleton", "moletinho"]),
      val("jeans", "jeans", ["denim", "brim"]),
      val("sarja", "sarja", ["twill", "gabardine"]),
      val("couro", "couro", ["leather", "couro legitimo"]),
      val("couro_sintetico", "couro sintético", ["couro ecologico", "sintetico", "courino", "pu"]),
      val("nylon", "náilon", ["nylon", "poliamida"]),
      val("malha", "malha", ["meia malha", "malha fria", "suedine"]),
      val("suede", "suede", ["camurca", "nobuck"]),
      val("veludo", "veludo", ["velvet", "plush"]),
      val("chiffon", "chiffon", ["musseline"]),
      val("renda", "renda", ["guipir"]),
    ],
  },
  {
    key: "caimento",
    label: "caimento",
    multiple: false,
    visual: false,
    values: [
      val("slim", "slim", ["skinny", "justo", "justa", "ajustado", "ajustada", "slim fit"]),
      val("reto", "reto", ["reta", "regular", "tradicional", "regular fit", "straight"]),
      val("relaxed", "solto", ["solta", "soltinho", "soltinha", "relaxed", "relax", "confortavel"]),
      val("oversized", "oversized", ["oversize", "ampla", "amplo", "boxy", "over"]),
      val("wide_leg", "wide leg", ["wide leg", "wideleg", "pantalona", "calca larga", "perna larga", "larga", "largo"]),
      val("flare", "flare", ["boca de sino", "bootcut"]),
      val("jogger", "jogger", ["punho na barra"]),
      val("baggy", "baggy", ["mom", "mom jeans", "balloon", "balao"]),
    ],
  },
  {
    key: "cintura",
    label: "cintura",
    multiple: false,
    visual: false,
    values: [
      val("alta", "cintura alta", ["cintura alta", "cos alto", "high waist", "hot pants"]),
      val("media", "cintura média", ["cintura media", "cos medio", "mid rise"]),
      val("baixa", "cintura baixa", ["cos baixo", "low rise"]),
    ],
  },
  {
    key: "comprimento",
    label: "comprimento",
    multiple: false,
    visual: false,
    values: [
      val("cropped", "cropped", ["cropped", "curtinho"]),
      val("curto", "curto", ["curta", "mini"]),
      val("midi", "midi", ["meia canela", "abaixo do joelho"]),
      val("longo", "longo", ["longa", "maxi", "longuete"]),
    ],
  },
  {
    key: "gola",
    label: "gola ou decote",
    multiple: false,
    visual: false,
    values: [
      val("cubana", "gola cubana", ["gola cubana", "resort", "gola havaiana", "colarinho aberto", "gola camp"]),
      val("padre", "gola padre", ["gola padre", "mandarim", "gola chinesa"]),
      val("polo", "gola polo", ["gola polo"]),
      val("v", "gola V", ["gola v", "decote v", "decote em v"]),
      val("redonda", "gola redonda", ["gola redonda", "gola careca", "decote redondo"]),
      val("alta", "gola alta", ["gola alta", "role", "gola role", "cacharrel"]),
      val("quadrado", "decote quadrado", ["decote quadrado", "gola quadrada"]),
      val("tomara_que_caia", "tomara que caia", ["tomara que caia", "strapless"]),
      val("ombro_a_ombro", "ombro a ombro", ["ombro a ombro", "ciganinha", "ombros de fora"]),
      val("social", "colarinho", ["colarinho", "gola social", "gola italiana"]),
    ],
  },
  {
    key: "manga",
    label: "manga",
    multiple: false,
    visual: false,
    values: [
      val("curta", "manga curta", ["manga curta", "mangas curtas", "mc"]),
      val("longa", "manga longa", ["manga longa", "mangas longas", "ml"]),
      val("tres_quartos", "manga 3/4", ["manga 3/4", "manga tres quartos"]),
      val("sem_manga", "sem manga", ["sem manga", "regata", "alcinha", "alcas finas"]),
      val("bufante", "manga bufante", ["manga bufante", "manga balone"]),
    ],
  },
  {
    key: "ocasiao",
    label: "ocasião",
    multiple: true,
    visual: false,
    values: [
      val("casual", "casual", ["dia a dia", "basico", "casual"]),
      val("trabalho", "trabalho", ["escritorio", "corporativo", "reuniao"]),
      val("festa", "festa", ["balada", "noite", "evento"]),
      val("casamento", "casamento", ["madrinha", "convidada", "padrinho", "casamento"]),
      val("praia", "praia", ["praia", "resort", "verao", "piscina", "beachwear"]),
      val("esporte", "esporte", ["academia", "treino", "corrida", "fitness", "esportivo"]),
      val("formal", "formal", ["social", "black tie", "gala", "formal"]),
    ],
  },
  {
    key: "estetica",
    label: "estética",
    multiple: true,
    visual: false,
    values: [
      val("minimalista", "minimalista", ["basico", "clean", "minimal", "atemporal"]),
      val("streetwear", "streetwear", ["street", "urbano", "skate"]),
      val("classico", "clássico", ["old money", "classico", "tradicional", "preppy"]),
      val("boho", "boho", ["boemio", "hippie", "bohemian", "boho chic"]),
      val("romantico", "romântico", ["delicado", "romantica", "babados"]),
      val("esportivo", "esportivo", ["athleisure", "sporty"]),
      val("sofisticado", "sofisticado", ["elegante", "chique", "sofisticada", "refinado", "casual sofisticado"]),
      val("vintage", "vintage", ["retro", "anos 70", "anos 90"]),
    ],
  },
  {
    key: "transparencia",
    label: "transparência",
    multiple: false,
    visual: false,
    values: [
      val("transparente", "transparente", ["transparencia", "fica transparente", "tule", "telinha"]),
      val("opaco", "não transparente", [
        "nao transparente",
        "nao fica transparente",
        "opaco",
        "opaca",
        "sem transparencia",
        "forrado",
        "forrada",
      ]),
    ],
  },
];

export const ATTRIBUTE_KEYS = FASHION_ATTRIBUTES.map((attribute) => attribute.key);

/** Lower case, no accents, punctuation as spaces: the form every match runs on. */
export function foldText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9%/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The words that name a value: its label and synonyms, and its id only when the id is the label
 * ("alta" alone is not "gola alta": it would match "cintura alta").
 */
const forms = (entry: TaxonomyValue) => {
  const id = foldText(entry.id.replace(/_/g, " "));
  const label = foldText(entry.label);
  return [...new Set([...(id === label ? [id] : []), label, ...entry.synonyms.map(foldText)].filter(Boolean))];
};

/** Position of a whole phrase inside folded text, or -1. */
function phraseAt(folded: string, phrase: string): number {
  const padded = ` ${folded} `;
  const index = padded.indexOf(` ${phrase} `);
  return index;
}

export const attributeOf = (key: string): FashionAttribute | undefined =>
  FASHION_ATTRIBUTES.find((attribute) => attribute.key === key);

/** The attribute key a person or a model may write for an attribute ("material" is "tecido"). */
export function attributeKey(value: string): string | null {
  const folded = foldText(value);
  const aliases: Record<string, string> = {
    material: "tecido",
    composicao: "tecido",
    fit: "caimento",
    modelagem: "caimento",
    corte: "caimento",
    silhueta: "caimento",
    decote: "gola",
    colarinho: "gola",
    tamanho_da_manga: "manga",
    ocasiao: "ocasiao",
    estilo: "estetica",
    estetica: "estetica",
    print: "estampa",
    padrao: "estampa",
    cores: "cor",
    color: "cor",
  };
  const key = folded.replace(/ /g, "_");
  if (ATTRIBUTE_KEYS.includes(key)) return key;
  return aliases[key] ?? null;
}

/** The category a text names first ("calça de moletom" is a calça), or null. */
export function detectCategory(text: string): string | null {
  const folded = foldText(text);
  let best: { id: string; at: number; length: number } | null = null;
  for (const category of FASHION_CATEGORIES)
    for (const form of forms(category)) {
      const at = phraseAt(folded, form);
      if (at < 0) continue;
      if (!best || at < best.at || (at === best.at && form.length > best.length))
        best = { id: category.id, at, length: form.length };
    }
  return best?.id ?? null;
}

/** A category id from what a model or a person wrote, or null when it is not in the taxonomy. */
export function canonicalCategory(text: string): string | null {
  const folded = foldText(text);
  const exact = FASHION_CATEGORIES.find((category) => forms(category).includes(folded));
  return exact?.id ?? detectCategory(text);
}

export const categoryOf = (id: string) => FASHION_CATEGORIES.find((category) => category.id === id);

/** Whether a product of category `found` can answer a request for `asked`: same or related. */
export function categoryRelation(asked: string, found: string): "same" | "related" | "other" {
  if (asked === found) return "same";
  const category = categoryOf(asked);
  return category?.related.includes(found) || categoryOf(found)?.related.includes(asked) ? "related" : "other";
}

/** Every attribute value a text names, by its words ("calça pantalona preta de linho"). */
export function detectAttributes(text: string): Record<string, string[]> {
  const folded = foldText(text);
  const found: Record<string, string[]> = {};
  for (const attribute of FASHION_ATTRIBUTES) {
    // Longest phrase first, so "azul marinho" is marinho, not azul too.
    const matches: { id: string; at: number; end: number }[] = [];
    const candidates = attribute.values
      .flatMap((value) => forms(value).map((form) => ({ id: value.id, form })))
      .sort((a, b) => b.form.length - a.form.length);
    for (const { id, form } of candidates) {
      const at = phraseAt(folded, form);
      if (at < 0) continue;
      const end = at + form.length;
      if (matches.some((match) => at < match.end && end > match.at)) continue;
      matches.push({ id, at, end });
    }
    const ids = [...new Set(matches.sort((a, b) => a.at - b.at).map((match) => match.id))];
    if (ids.length) found[attribute.key] = attribute.multiple ? ids : ids.slice(0, 1);
  }
  return found;
}

/** A value id of one attribute from what a model or a person wrote, or null when it is not one. */
export function canonicalValue(key: string, text: string): string | null {
  const attribute = attributeOf(key);
  if (!attribute) return null;
  const folded = foldText(text);
  const exact = attribute.values.find((value) => value.id === text || forms(value).includes(folded));
  if (exact) return exact.id;
  return detectAttributes(text)[key]?.[0] ?? null;
}

export function valueLabel(key: string, id: string): string {
  return attributeOf(key)?.values.find((value) => value.id === id)?.label ?? id.replace(/_/g, " ");
}

/** Words of a value a store would write: its label and synonyms, for widening a search by words. */
export function valueWords(key: string, id: string): string[] {
  const value = attributeOf(key)?.values.find((entry) => entry.id === id);
  return value ? [value.label, ...value.synonyms] : [];
}

export interface Fiber {
  fiber: string;
  pct: number;
}

/**
 * The composition a store writes ("80% Algodão 20% Linho", "Composição: 100% linho"), as fibers of
 * the taxonomy with their share, largest first. Fibers outside the taxonomy are left out.
 */
export function parseComposition(text: string): Fiber[] {
  const folded = foldText(text);
  const fibers = new Map<string, number>();
  const lookup = (word: string) => canonicalValue("tecido", word);
  // "80% algodao", "80 % algodao", "algodao 80%"
  for (const match of folded.matchAll(/(\d{1,3}(?:[.,]\d+)?)\s*%\s*(?:de\s+)?([a-z]+(?:\s[a-z]+)?)/g)) {
    const pct = Number((match[1] as string).replace(",", "."));
    const words = match[2] as string;
    const id = lookup(words) ?? lookup(words.split(" ")[0] as string);
    if (id && pct > 0 && pct <= 100) fibers.set(id, (fibers.get(id) ?? 0) + pct);
  }
  for (const match of folded.matchAll(/([a-z]+)\s(\d{1,3}(?:[.,]\d+)?)\s*%/g)) {
    const id = lookup(match[1] as string);
    const pct = Number((match[2] as string).replace(",", "."));
    if (id && !fibers.has(id) && pct > 0 && pct <= 100) fibers.set(id, pct);
  }
  return [...fibers].map(([fiber, pct]) => ({ fiber, pct: Math.min(100, pct) })).sort((a, b) => b.pct - a.pct);
}

/** One line of the taxonomy for the chat model's instructions: keys and their values. */
export function taxonomyGuide(): string {
  return FASHION_ATTRIBUTES.map(
    (attribute) => `${attribute.key}: ${attribute.values.map((value) => value.id).join(", ")}`,
  ).join("; ");
}
