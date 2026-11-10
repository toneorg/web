// A product tapped on a panel page travels to the conversation it opens, once.
import { beforeEach, describe, expect, it } from "vitest";
import { pickForSession, takePicked } from "../src/conversas/picked-handoff";

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  });
});

const product = { url: "https://www.amazon.com.br/dp/1", title: "iPhone 18 256 GB", price: 7499, image: null };

describe("produto levado do painel para a conversa", () => {
  it("devolve o produto uma vez só", () => {
    pickForSession("s1", product);
    expect(takePicked("s1")).toEqual(product);
    expect(takePicked("s1")).toBeNull();
  });

  it("JSON inválido vira null", () => {
    store.set("tone:picked:s2", "{nope");
    expect(takePicked("s2")).toBeNull();
  });
});
