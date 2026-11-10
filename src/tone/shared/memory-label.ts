// Gerado de toneorg/extension@440b05322b9f (packages/shared/src/memory-label.ts). Não edite aqui.
// A memory key ("calcado.marca_preferida") is for the agent; the person reads a name
// ("Marca preferida (calçado)"). Keys are free text from the model, so this reads any of them:
// the last part is what it is, the first is the category, what is in between is the situation.

/** Words the model writes without accents, as they read in Portuguese. */
const WORDS: Record<string, string> = {
  calcado: "calçado",
  calcados: "calçados",
  relogio: "relógio",
  relogios: "relógios",
  eletronicos: "eletrônicos",
  eletronico: "eletrônico",
  orcamento: "orçamento",
  familia: "família",
  numero: "número",
  genero: "gênero",
  padrao: "padrão",
  cabeca: "cabeça",
  pescoco: "pescoço",
  maos: "mãos",
  pe: "pé",
  pes: "pés",
  oculos: "óculos",
  cosmeticos: "cosméticos",
  acessorios: "acessórios",
  preco: "preço",
  tenis: "tênis",
  colecao: "coleção",
  ocasiao: "ocasião",
  estacao: "estação",
  regiao: "região",
  musica: "música",
  video: "vídeo",
  audio: "áudio",
  diametro: "diâmetro",
  proxima: "próxima",
  proximo: "próximo",
  ultima: "última",
  ultimo: "último",
  medio: "médio",
  media: "média",
  rapido: "rápido",
  agua: "água",
};

const UNIT = /_(cm|mm|kg|m|ml|g|pol)$/;

function words(part: string): string {
  return part
    .replace(UNIT, "")
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => WORDS[word] ?? word)
    .join(" ");
}

const capital = (text: string) => text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);

/**
 * The name a person reads for a memory key: "Tamanho (calçado)", "Altura". With a condition, the
 * last part of the key is that situation: "roupa.cores.trabalho" reads "Cores (roupa, trabalho)".
 */
export function memoryLabel(key: string, condition?: string | null): string {
  const parts = key
    .split(".")
    .map((part) => words(part.trim().toLowerCase()))
    .filter(Boolean);
  if (parts.length === 0) return "Anotação";
  if (parts.length === 1) return capital(parts[0] ?? "");
  const [category, ...rest] = parts;
  const situated = Boolean(condition) && rest.length > 1;
  const field = situated ? rest.slice(0, -1).join(" ") : rest.join(" ");
  const situation = situated ? rest.at(-1) : null;
  const context = [category === "geral" ? null : category, situation].filter(Boolean).join(", ");
  return context ? `${capital(field)} (${context})` : capital(field);
}
