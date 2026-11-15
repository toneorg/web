// The @ picker (15/11/2026): each store with its icon, the list follows the arrows, and a message
// sent with @Dior shows the store again when the conversation is reopened.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { storeInitial, storeLogoUrl } from "../src/conversas/store-mention";
import { type StoreOption, TranscriptItem } from "../src/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("posthog-js", () => ({ default: { capture: () => undefined, get_property: () => undefined } }));
const { itemsOf } = await import("../src/conversas/Conversation");
const { StoreOptions, UserMessage } = await import("../src/conversas/StoreMention");

const stores: StoreOption[] = [
  { domain: "dior.com", label: "Dior", reading: "catalog", hosts: ["shop.dior.com.br"] },
  { domain: "epocacosmeticos.com.br", label: "Época Cosméticos", reading: "catalog" },
];

describe("lojas do @ com o ícone", () => {
  it("mostra o ícone da loja ao lado do nome, sem mandar a página de onde veio", () => {
    const html = renderToStaticMarkup(
      <StoreOptions id="lojas" options={stores} active={1} onPick={() => undefined} onActive={() => undefined} />,
    );
    expect(html).toContain(`src="${storeLogoUrl("dior.com")}"`);
    expect(html).toContain('referrerPolicy="no-referrer"');
    expect(html).toMatch(/id="lojas-1" role="option" aria-selected="true"/);
    expect(html).toMatch(/id="lojas-0" role="option" aria-selected="false"/);
  });
  it("sem ícone, a inicial do nome sem acento", () => {
    expect(storeInitial("Época Cosméticos")).toBe("E");
    expect(storeInitial("KaBuM!")).toBe("K");
    expect(storeLogoUrl("dior.com")).toBe("https://icons.duckduckgo.com/ip3/dior.com.ico");
  });
});

describe("mensagem com @ reaberta", () => {
  it("traz as lojas da transcrição e desenha @Dior antes do texto", () => {
    const [saved] = TranscriptItem.array().parse([
      { kind: "user", text: "eu quero o perfume sauvage", stores: ["dior.com"] },
    ]);
    const [item] = itemsOf(saved as TranscriptItem);
    expect(item).toMatchObject({ kind: "user", text: "eu quero o perfume sauvage", stores: ["dior.com"] });
    const html = renderToStaticMarkup(
      <UserMessage text="eu quero o perfume sauvage" stores={["dior.com"]} options={stores} />,
    );
    expect(html.replace(/<[^>]+>/g, "")).toBe("Você: @Dior eu quero o perfume sauvage");
  });
  it("uma mensagem antiga, sem lojas, fica como era", () => {
    const [saved] = TranscriptItem.array().parse([{ kind: "user", text: "oi" }]);
    expect(itemsOf(saved as TranscriptItem)[0]).not.toHaveProperty("stores");
  });
});
