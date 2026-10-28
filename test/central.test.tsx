// T11: the center of watches in the panels, and the mute link of the e-mail.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Watch, WatchRule } from "../src/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
const { actionsOf, panelFacts } = await import("../src/conversas/Panels");
const { MuteLink } = await import("../src/conversas/MuteLink");

const rule: WatchRule = {
  goal: "Avisar quando o Casio A158 baixar",
  kind: "monitoring",
  query: "Casio A158",
  brands: ["Casio"],
  categories: [],
  variants: [],
  products: [{ title: "Casio A158", variantLabel: null, url: null, offerId: null }],
  storeScope: { kind: "explicit", stores: ["amazon.com.br"] },
  condition: { kind: "target_price", amount: 150, currency: "BRL" },
  frequency: "daily",
  notify: { email: true, digest: false },
};
const watch = (overrides: Partial<Watch> = {}): Watch => ({
  id: "w1",
  sessionId: null,
  status: "active",
  version: 1,
  draft: rule,
  confirmed: rule,
  confirmedVersion: 1,
  review: { canConfirm: true, clarifications: [], sources: [], notes: [] },
  createdAt: "2026-10-27T12:00:00.000Z",
  updatedAt: "2026-10-27T12:00:00.000Z",
  confirmedAt: "2026-10-27T12:00:00.000Z",
  lastCheckAt: "2026-10-28T12:00:00.000Z",
  nextCheckAt: "2026-10-29T12:00:00.000Z",
  mutedAt: null,
  lastState: "ok",
  ...overrides,
});
const now = new Date("2026-10-28T15:00:00.000Z");

describe("central de acompanhamentos (T11)", () => {
  it("mostra última e próxima verificação no horário de Brasília e avisa dado antigo", () => {
    const facts = panelFacts(watch(), now);
    expect(facts.checked).toBe("Última verificação em 28/10/2026, 09:00");
    expect(facts.next).toBe("Próxima em 29/10/2026, 09:00");
    expect(facts.stale).toBe(false);
    expect(panelFacts(watch(), new Date("2026-10-30T13:00:00.000Z")).stale).toBe(true);
    // A paused watch does not run, so its reading is not "late" and there is no next check.
    expect(panelFacts(watch({ status: "paused" }), new Date("2026-11-30T00:00:00.000Z"))).toMatchObject({
      stale: false,
      next: null,
    });
  });

  it("diz quando a fonte falhou ou o saldo não cobriu, sem fingir que não houve mudança", () => {
    expect(panelFacts(watch({ lastState: "source_failed" }), now).problem).toMatch(/fonte não respondeu/);
    expect(panelFacts(watch({ lastState: "budget_exceeded" }), now).problem).toMatch(/saldo/);
    expect(panelFacts(watch(), now).problem).toBeNull();
  });

  it("oferece as ações que o estado permite", () => {
    expect(actionsOf(watch())).toEqual(["check", "pause", "mute", "delete"]);
    expect(actionsOf(watch({ mutedAt: "2026-10-28T10:00:00.000Z" }))).toEqual(["check", "pause", "unmute", "delete"]);
    expect(actionsOf(watch({ confirmed: { ...rule, notify: { email: false, digest: false } } }))).toEqual([
      "check",
      "pause",
      "delete",
    ]);
    expect(actionsOf(watch({ status: "paused" }))).toEqual(["resume", "delete"]);
    expect(actionsOf(watch({ status: "draft", confirmed: null }))).toEqual(["delete"]);
  });
});

describe("link para parar os e-mails (T11)", () => {
  it("abrir a página não silencia nada: a pessoa confirma com um clique", () => {
    const html = renderToStaticMarkup(<MuteLink token="abc.1.sig" />);
    expect(html).toContain("Parar os e-mails deste acompanhamento");
    expect(html).toContain("continua rodando");
  });

  it("link sem token leva à central", () => {
    expect(renderToStaticMarkup(<MuteLink token={null} />)).toContain('href="/conversas"');
  });
});
