// The panel's own page (10/11/2026): results first, conversations kept in the panel, none in the list.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PanelSession, Watch, WatchResult, WatchRule } from "../src/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("posthog-js", () => ({ default: { capture: () => undefined, get_property: () => undefined } }));
const { PanelView } = await import("../src/conversas/PanelPage");
const { backLink } = await import("../src/conversas/Conversation");

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
const draw = (results: WatchResult[], sessions: PanelSession[] = []) =>
  renderToStaticMarkup(
    <PanelView
      watch={watch}
      results={results}
      prices={{ points: [], target: null }}
      sessions={sessions}
      menu={null}
      footer={null}
      onAsk={() => undefined}
      onTalk={() => undefined}
      opening={false}
    />,
  );

describe("página do painel", () => {
  it("panel page without readings shows the first-reading note", () => {
    const html = draw([]);
    expect(html).toContain("iPhone 18");
    expect(html).toContain("Fazendo a primeira leitura");
    expect(html).not.toContain("<figure");
  });

  it("panel page lists products with an ask action", () => {
    const html = draw([reading]);
    expect(html).toContain("Apple iPhone 18 256 GB");
    expect(html).toContain("R$ 6.999");
    expect(html.match(/>Perguntar</g)).toHaveLength(2);
    expect(html).toContain("Conversar sobre este painel");
    expect(html).toContain("O gráfico do preço aparece a partir do segundo dia de leitura.");
  });

  it("panel conversations section is absent when there are none", () => {
    expect(draw([reading])).not.toContain("Conversas deste painel");
    const html = draw([reading], [
      { id: "s1", title: "tem vídeo?", lastAt: "2026-11-10T13:00:00.000Z", messages: 1, origin: "panel" },
    ]);
    expect(html).toContain("Conversas deste painel");
    expect(html).toContain('href="/conversas/s1?painel=w1"');
  });

  it("panel conversation back link points to the panel", () => {
    expect(backLink("w1", "iPhone 18")).toEqual({ href: "/paineis/w1", label: "← iPhone 18" });
    expect(backLink(null, null)).toEqual({ href: "/conversas", label: "← Conversas" });
  });
});
