import { describe, expect, it } from "vitest";
import { filterStores, mentionAt, pickStore, readingLabel } from "@/conversas/store-mention";
import type { StoreOption } from "@/tone/shared";

const stores: StoreOption[] = [
  { domain: "belezanaweb.com.br", label: "Beleza na Web", reading: "unblock" },
  { domain: "dior.com", label: "Dior", reading: "catalog" },
  { domain: "epocacosmeticos.com.br", label: "Época Cosméticos", reading: "catalog" },
  { domain: "sephora.com.br", label: "Sephora", reading: "catalog" },
  { domain: "kabum.com.br", label: "KaBuM!", reading: "direct" },
];

describe("menção de loja com @", () => {
  it("acha o @ antes do cursor, no começo ou depois de espaço", () => {
    expect(mentionAt("perfume @sep", 12)).toEqual({ start: 8, query: "sep" });
    expect(mentionAt("@", 1)).toEqual({ start: 0, query: "" });
    expect(mentionAt("perfume @beleza na", 18)).toEqual({ start: 8, query: "beleza na" });
  });
  it("não abre em e-mail, depois de quebra de linha nem com o cursor antes do @", () => {
    expect(mentionAt("ana@sephora", 11)).toBeNull();
    expect(mentionAt("@sep\nhoje", 9)).toBeNull();
    expect(mentionAt("perfume @sep", 3)).toBeNull();
  });
  it("filtra por nome ou domínio sem acento e tira as já escolhidas", () => {
    expect(filterStores(stores, "epoca", []).map((s) => s.domain)).toEqual(["epocacosmeticos.com.br"]);
    expect(filterStores(stores, "kabum", []).map((s) => s.label)).toEqual(["KaBuM!"]);
    expect(filterStores(stores, "", ["dior.com"]).map((s) => s.domain)).not.toContain("dior.com");
    expect(filterStores(stores, "beleza na", []).map((s) => s.domain)).toEqual(["belezanaweb.com.br"]);
    // The name starting with the words comes first.
    expect(filterStores(stores, "s", [])[0]?.domain).toBe("sephora.com.br");
  });
  it("troca o @termo pela loja: o texto fica sem a menção e o cursor no lugar dela", () => {
    expect(pickStore("perfume @sep para mim", { start: 8, query: "sep" })).toEqual({
      text: "perfume para mim",
      caret: 8,
    });
    expect(pickStore("@dior", { start: 0, query: "dior" })).toEqual({ text: "", caret: 0 });
  });
  it("diz como a loja é lida, em palavras de gente", () => {
    expect(readingLabel("catalog")).toBe("catálogo da loja");
    expect(readingLabel("index")).toBe("preço anunciado");
  });
});
