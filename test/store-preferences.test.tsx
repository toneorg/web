// Store preferences per category: saving never searches; "save and search" searches once, after the save.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { upstreamPath } from "../src/lib/tone-bff";
import { type StorePreferenceCategory, storePreferenceCategory } from "../src/tone/shared";

vi.mock("../src/conversas/api", () => ({
  api: { storePreferences: vi.fn(), saveStorePreferences: vi.fn() },
}));
const { preferredDomain, saveStorePreferences } = await import("../src/conversas/store-preferences");
const { StorePreferenceBody } = await import("../src/conversas/StorePreferences");

describe("preferências de lojas", () => {
  it("salvar não pesquisa", async () => {
    const save = vi.fn(async (category: StorePreferenceCategory, stores: string[]) => ({ category, stores }));
    const research = vi.fn(async () => undefined);
    await saveStorePreferences("tenis", ["centauro.com.br"], save);
    expect(save).toHaveBeenCalledOnce();
    expect(research).not.toHaveBeenCalled();
  });

  it("salvar e pesquisar pesquisa uma vez, só depois de salvar", async () => {
    const order: string[] = [];
    const save = vi.fn(async (category: StorePreferenceCategory, stores: string[]) => {
      order.push("save");
      return { category, stores };
    });
    const research = vi.fn(async () => {
      order.push("research");
    });
    await saveStorePreferences("tenis", ["centauro.com.br"], save, research);
    expect(order).toEqual(["save", "research"]);
  });

  it("falha ao salvar não pesquisa", async () => {
    const research = vi.fn(async () => undefined);
    await expect(
      saveStorePreferences("tenis", [], () => Promise.reject(new Error("fora do ar")), research),
    ).rejects.toThrow("fora do ar");
    expect(research).not.toHaveBeenCalled();
  });

  it("aceita só domínio público, sem caminho nem protocolo", () => {
    expect(preferredDomain(" WWW.Centauro.com.br ")).toBe("centauro.com.br");
    expect(preferredDomain("https://centauro.com.br/tenis")).toBeNull();
    expect(preferredDomain("loja.local")).toBeNull();
    expect(preferredDomain("centauro")).toBeNull();
  });

  it("a categoria vem do pedido de compra", () => {
    expect(storePreferenceCategory("tênis branco casual")).toBe("tenis");
    expect(storePreferenceCategory("camiseta básica preta")).toBe("roupa");
    expect(storePreferenceCategory("perfume amadeirado")).toBe("perfumaria");
  });

  it("a folha de lojas pesquisa de novo ou só salva, com as lojas conhecidas da categoria", () => {
    const html = renderToStaticMarkup(
      <StorePreferenceBody category="eletronicos" suggested={[]} options={[]} busy={false} onResearch={async () => undefined} />,
    );
    expect(html).toContain("Pesquisar de novo");
    expect(html).toContain("Só salvar");
    expect(html).toContain("Mercado Livre");
    expect(html).toContain("Magalu");
    expect(html).toContain("Outra loja");
  });

  it("sem pesquisa para repetir, só salva", () => {
    const html = renderToStaticMarkup(<StorePreferenceBody category="roupa" suggested={[]} options={[]} busy={false} />);
    expect(html).toContain("Salvar");
    expect(html).not.toContain("Pesquisar de novo");
  });

  it("o BFF repassa só as categorias conhecidas", () => {
    expect(upstreamPath(["store-preferences", "tenis"])).not.toBeNull();
    expect(upstreamPath(["store-preferences", "qualquer"])).toBeNull();
    expect(upstreamPath(["store-preferences", "tenis", "x"])).toBeNull();
  });
});
