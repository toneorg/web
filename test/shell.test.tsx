// T16: the web app's frame, the person's panels and what the research can do here.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Me, ResearchRunState, WatchResult } from "../src/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
const { researchNote } = await import("../src/conversas/Conversation");
const { lowestOf } = await import("../src/conversas/Panels");
const { ResearchRun } = await import("../src/conversas/ResearchRun");
const { Shell } = await import("../src/conversas/Shell");

const me = (remoteStores?: string[]): Me => ({
  id: "u1",
  name: "ana",
  email: "ana@example.com",
  onboarded: true,
  spentTodayUsd: 0,
  dailyCapUsd: 1,
  ...(remoteStores ? { remoteStores } : {}),
});
const result = (matches: { priceText: string; amount: number | null }[]): WatchResult => ({
  id: "r1",
  version: 1,
  outcome: "ok",
  conditionMet: false,
  observedAt: "2026-10-27T12:00:00.000Z",
  summary: {
    message: "2 ofertas",
    matches: matches.map((match, index) => ({ title: `Fone ${index}`, store: "amazon.com.br", url: "https://x", ...match })),
  },
});

describe("moldura da web (T16)", () => {
  it("tem barra de cima, painéis à esquerda e o trabalho no meio", () => {
    const html = renderToStaticMarkup(
      <Shell me={me()} current="conversas">
        <p>conversa</p>
      </Shell>,
    );
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="Seus painéis"');
    expect(html).toContain("Seus painéis");
    expect(html).toContain("conversa");
    expect(html).toContain(">A<");
  });

  it("o painel mostra o menor preço comparável da última leitura", () => {
    expect(lowestOf(result([{ priceText: "R$ 300,00", amount: 300 }, { priceText: "R$ 250,00", amount: 250 }]))).toBe(
      "R$ 250,00",
    );
    expect(lowestOf(result([{ priceText: "preço desconhecido", amount: null }]))).toBeNull();
    expect(lowestOf(null)).toBeNull();
  });

  it("diz quando a pesquisa também usa navegador remoto, sem abrir abas", () => {
    expect(researchNote(me())).toMatch(/ações na loja só pela extensão/);
    expect(researchNote(me(["mercadolivre.com.br", "dior.com"]))).toBe(
      "Pesquisa pelo servidor e em Mercado Livre, Dior por navegador remoto, sem abrir abas",
    );
  });

  it("o cartão da pesquisa diz que os preços foram lidos por navegador remoto", () => {
    const run: ResearchRunState = {
      runId: "r",
      sessionId: "s",
      seq: 2,
      stage: "completed",
      message: "Pesquisa concluída com 1 oferta.",
      source: null,
      offers: 1,
      done: null,
      total: null,
      terminal: true,
      startedAt: "2026-10-27T12:00:00.000Z",
      updatedAt: "2026-10-27T12:00:00.000Z",
      result: {
        schemaVersion: 1,
        id: "r",
        revision: 1,
        createdAt: "2026-10-27T12:00:00.000Z",
        intent: { id: "i", query: "sauvage", storeScope: { kind: "unrestricted" }, requirements: [] },
        products: [{ id: "p", title: "Sauvage 100 ml", brand: null, model: null }],
        variants: [{ id: "v", productId: "p", label: "Sauvage 100 ml", attributes: {} }],
        offers: [
          {
            id: "o",
            variantId: "v",
            store: "dior.com",
            seller: null,
            url: "https://www.dior.com/pt_br/beauty/products/Y0785220",
            price: { kind: "full", amount: 899, currency: "BRL", originalText: "R$ 899.00" },
            priceEvidenceIds: ["e"],
            delivery: null,
            finalTotal: null,
            assessments: [],
          },
        ],
        evidence: [
          {
            id: "e",
            subjectId: "o",
            source: "remote:dior.com",
            url: "https://www.dior.com/pt_br/beauty/products/Y0785220",
            observedAt: "2026-10-27T12:00:00.000Z",
            sourceUpdatedAt: null,
            level: "origin",
            supportedFields: ["title", "price"],
            excerpt: "Sauvage 100 ml; R$ 899.00",
          },
        ],
        sources: [],
      },
    };
    const html = renderToStaticMarkup(<ResearchRun run={run} />);
    expect(html).toContain("Dior · R$ 899.00");
    expect(html).toContain("navegador remoto da tone, sem login");
  });
});
