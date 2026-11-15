// Gerado de toneorg/server@b3447d8df18a (packages/shared/src/search.ts). Não edite aqui.
// The search of the web's single chat: what the person typed is found in what they and the tone
// said, ignoring case and accents ("tenis" finds "Tênis"). The server picks the messages and cuts
// the snippet; the web marks the same words in it, with the same rule.

/** One character without its accent, in lower case: the comparison is made on these. */
function fold(char: string): string {
  return char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** The words of a search: at most eight, each of two characters or more. */
export function searchTerms(query: string): string[] {
  const words = query
    .split(/\s+/)
    .map((word) => [...word].map(fold).join(""))
    .filter((word) => word.length >= 2);
  return [...new Set(words)].slice(0, 8);
}

/**
 * Where each word of the search appears in `text`, as [start, end) offsets into `text` itself,
 * sorted and merged. Empty when some word is missing: a match has every word.
 */
export function matchRanges(text: string, query: string): [number, number][] {
  const terms = searchTerms(query);
  if (!terms.length) return [];
  // The folded text, with the offset in `text` of each folded character.
  let folded = "";
  const origin: number[] = [];
  let at = 0;
  for (const char of text) {
    const plain = fold(char);
    for (let i = 0; i < plain.length; i++) origin.push(at);
    folded += plain;
    at += char.length;
  }
  origin.push(at);
  const ranges: [number, number][] = [];
  for (const term of terms) {
    let from = folded.indexOf(term);
    if (from < 0) return [];
    while (from >= 0) {
      const start = origin[from] ?? 0;
      const last = origin[from + term.length - 1] ?? start;
      // The end is after the whole original character the last folded one came from.
      const end = last + ((text.codePointAt(last) ?? 0) > 0xffff ? 2 : 1);
      ranges.push([start, end]);
      from = folded.indexOf(term, from + term.length);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const previous = merged.at(-1);
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  return merged;
}

/**
 * A short piece of `text` around its first match, cut at word boundaries, with "…" where it was
 * cut. `null` when the text does not match.
 */
export function searchSnippet(text: string, query: string, room = 140): string | null {
  const line = text.replace(/\s+/g, " ").trim();
  const ranges = matchRanges(line, query);
  const first = ranges[0];
  if (!first) return null;
  if (line.length <= room) return line;
  let start = Math.max(0, first[0] - Math.floor(room / 3));
  let end = Math.min(line.length, start + room);
  start = Math.max(0, end - room);
  if (start > 0) {
    const space = line.indexOf(" ", start);
    if (space >= 0 && space < first[0]) start = space + 1;
  }
  if (end < line.length) {
    const space = line.lastIndexOf(" ", end);
    if (space > first[1]) end = space;
  }
  return `${start > 0 ? "…" : ""}${line.slice(start, end)}${end < line.length ? "…" : ""}`;
}
