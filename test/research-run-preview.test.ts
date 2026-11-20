import { describe, expect, it } from "vitest";
import { previewOffers } from "../src/conversas/ResearchRun";

const offer = (id: string, store: string, title: string) => ({ id, store, title });
const titleOf = (entry: { title: string }) => entry.title;

describe("previewOffers", () => {
  it("counts the sizes of one piece once", () => {
    const shown = previewOffers(
      [
        offer("a", "cea.com.br", "calça reta feminina com linho bege - 36"),
        offer("b", "cea.com.br", "calça reta feminina com linho bege - 38"),
        offer("c", "cea.com.br", "calça reta feminina com linho bege – GG"),
        offer("d", "cea.com.br", "calça wide leg feminina bege - 34"),
      ],
      titleOf,
    );
    expect(shown.map((entry) => entry.id)).toEqual(["a", "d"]);
  });

  it("takes turns between stores", () => {
    const shown = previewOffers(
      [
        offer("a", "cea.com.br", "calça 1"),
        offer("b", "cea.com.br", "calça 2"),
        offer("c", "cea.com.br", "calça 3"),
        offer("d", "sawary.com.br", "calça 4"),
        offer("e", "emporium.com.br", "calça 5"),
      ],
      titleOf,
      4,
    );
    expect(shown.map((entry) => entry.id)).toEqual(["a", "d", "e", "b"]);
  });

  it("keeps a number that is part of the name", () => {
    const shown = previewOffers([offer("a", "x.com", "iPhone 16 128GB"), offer("b", "x.com", "iPhone 16 256GB")], titleOf);
    expect(shown).toHaveLength(2);
  });
});
