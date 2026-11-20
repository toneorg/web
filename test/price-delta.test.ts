// The change of a product's price since the day before, as the panel card says it.
import { describe, expect, it } from "vitest";
import { priceDelta } from "../src/conversas/price-delta";

describe("mudança do preço", () => {
  it("queda, alta, igual e sem dia anterior", () => {
    expect(priceDelta(599, 679)).toEqual({ text: "↓ R$ 80", good: true });
    expect(priceDelta(679, 649)).toEqual({ text: "↑ R$ 30", good: false });
    expect(priceDelta(649, 649)).toEqual({ text: "igual", good: false });
    expect(priceDelta(649, null)).toBeNull();
    expect(priceDelta(null, 649)).toBeNull();
  });

  it("centavos só quando a diferença os tem", () => {
    expect(priceDelta(89.9, 99.8)).toEqual({ text: "↓ R$ 9,90", good: true });
  });
});
