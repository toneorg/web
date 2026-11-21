// The panel's own page. 20/11/2026: the verdict first, one item per product, no conversation of its own.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Watch, WatchResult, WatchRule, WatchSummary, WatchSummaryProduct } from "../src/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("posthog-js", () => ({ default: { capture: () => undefined, get_property: () => undefined } }));
const { PanelView } = await import("../src/conversas/PanelPage");
const { PanelHistory } = await import("../src/conversas/PanelProducts");

const rule: WatchRule = {
  goal: "Acompanhar o preço do iPhone 18",
  kind: "monitoring",
  query: "iPhone 18",
  brands: [],
  categories: [],
  variants: [],
  products: [{ title: "iPhone 18", variantLabel: null, url: null, offerId: null }],
  storeScope: { kind: "unrestricted" },
  condition: { kind: "price_drop" },
  frequency: "daily",
  notify: { email: false, digest: false },
};
const watch: Watch = {
  id: "w1",
  sessionId: "s0",
  status: "active",
  version: 1,
  draft: rule,
  confirmed: rule,
  confirmedVersion: 1,
  review: { canConfirm: true, clarifications: [], sources: [], notes: [] },
  createdAt: "2026-11-10T12:00:00.000Z",
  updatedAt: "2026-11-10T12:00:00.000Z",
  confirmedAt: "2026-11-10T12:00:00.000Z",
  lastCheckAt: null,
  nextCheckAt: "2026-11-11T12:00:00.000Z",
  mutedAt: null,
  lastState: null,
};
const reading: WatchResult = {
  id: "r1",
  version: 1,
  outcome: "ok",
  conditionMet: false,
  observedAt: "2026-11-10T12:00:00.000Z",
  summary: {
    message: "2 oferta(s)",
    matches: [
      { title: "Apple iPhone 18 256 GB", store: "amazon.com.br", url: "https://www.amazon.com.br/dp/1", priceText: "R$ 7.499", amount: 7499 },
      { title: "Apple iPhone 18 128 GB", store: "kabum.com.br", url: "https://www.kabum.com.br/p/2", priceText: "R$ 6.999", amount: 6999 },
    ],
  },
};
const item = (title: string, amount: number | null, previous: number | null, points: number[] = []): WatchSummaryProduct => ({
  title,
  variantLabel: null,
  best:
    amount === null
      ? null
      : { title: `Tênis ${title}`, priceText: `R$ ${amount}`, amount, store: "amazon.com.br", url: "https://www.amazon.com.br/dp/9", imageUrl: null },
  previous,
  signal: null,
  points: points.map((value, index) => ({ day: `2026-11-1${index}`, amount: value, store: null })),
});
const summaryOf = (kind: WatchSummary["verdict"]["kind"], reason: string, products = [item("Pegasus 41", 599, 679), item("Adizero SL", 649, 649)]): WatchSummary => ({
  observedAt: "2026-11-20T12:00:00.000Z",
  verdict: { kind, productIndex: 0, reason },
  products,
});
const draw = (results: WatchResult[], summary: WatchSummary | null = null) =>
  renderToStaticMarkup(
    <PanelView
      watch={watch}
      results={results}
      summary={summary}
      menu={null}
      footer={null}
      onAsk={() => undefined}
    />,
  );

describe("página do painel", () => {
  it("panel page without readings shows the first-reading note", () => {
    const html = draw([]);
    expect(html).toContain("iPhone 18");
    expect(html).toContain("Fazendo a primeira leitura");
    expect(html).not.toContain("<figure");
  });

  it("abre com o veredito, depois os produtos", () => {
    const html = draw([reading], summaryOf("good", "O menor preço em 30 dias, R$ 80 abaixo do normal."));
    const order = ["Bom momento para comprar", "Tênis Pegasus 41 por R$ 599", "O menor preço em 30 dias, R$ 80 abaixo do normal.", "Ver na loja", "Adizero SL"];
    const at = order.map((text) => html.indexOf(text));
    expect(at.every((index) => index >= 0)).toBe(true);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(html).toContain("https://www.amazon.com.br/dp/9");
    expect(html).toContain("↓ R$ 80");
  });

  it("veredito normal, acima e aprendendo com seus rótulos", () => {
    expect(draw([reading], summaryOf("normal", "x"))).toContain("Preço normal");
    expect(draw([reading], summaryOf("high", "x"))).toContain("Acima do normal");
    expect(draw([reading], summaryOf("learning", "x"))).toContain("Ainda conhecendo o preço");
  });

  it("não oferece conversa do painel e mantém Perguntar nas ofertas", () => {
    const html = draw([reading], summaryOf("normal", "x"));
    expect(html).not.toContain("Conversar sobre este painel");
    expect(html).not.toContain("Conversas deste painel");
    expect(html).toContain("Todas as ofertas");
    expect(html.match(/>Perguntar</g)).toHaveLength(2);
    expect(html).toContain('href="/conversas"');
  });

  it("histórico mostra o produto escolhido", () => {
    const products = [item("Pegasus 41", 599, 679, [680, 679, 599]), item("Adizero SL", 649, 649, [655, 650, 649])];
    const html = renderToStaticMarkup(<PanelHistory products={products} selected={1} onSelect={() => undefined} />);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toMatch(/menor R\$\s649/);
  });
});
