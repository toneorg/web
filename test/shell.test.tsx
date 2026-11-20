// T16: the web app's frame (since 15/11/2026 a messaging app: one chat, the search and the
// avatar in the top bar), the person's panels and what the research can do here.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { BudgetStatement, Me, ResearchRunState, WatchResult } from "../src/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
const { researchNote } = await import("../src/conversas/Conversation");
const { lowestOf, weekLeftPercent } = await import("../src/conversas/Panels");
const { ResearchRunSummary } = await import("../src/conversas/Activity");
const { Shell, initialOf, isSearchShortcut } = await import("../src/conversas/Shell");
const { Chat } = await import("../src/conversas/Chat");
const { api, forgetCached } = await import("../src/conversas/api");

const me = (remoteStores?: string[]): Me => ({
  id: "u1",
  name: "ana",
  email: "ana@example.com",
  onboarded: true,
  spentTodayUsd: 0,
  dailyCapUsd: 1,
  ...(remoteStores ? { remoteStores } : {}),
});
const budget = (availableUsd: number, weeklyCapUsd = 1): BudgetStatement => ({
  windowStart: "2026-10-27T00:00:00.000Z",
  windowEnd: "2026-11-03T00:00:00.000Z",
  weeklyCapUsd,
  spentUsd: 0,
  reservedUsd: 0,
  availableUsd,
  overheadUsd: null,
  complete: true,
  pending: [],
  resumesAt: null,
  categories: [],
  totalsByBasis: { measuredUsd: 0, estimatedUsd: 0, allocatedUsd: 0 },
  tokens: { inputTokens: 0, outputTokens: 0 },
  indirectCosts: [],
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
      <Shell me={me()} onSearch={() => undefined} onProfile={() => undefined}>
        <p>conversa</p>
      </Shell>,
    );
    expect(html).toContain('aria-label="Seus painéis"');
    expect(html).toContain("Seus painéis");
    expect(html).toContain("conversa");
    // No tabs any more: the search and the avatar (the person's initial) open their folhas.
    expect(html).not.toContain('aria-label="Seções"');
    expect(html).toMatch(/aria-label="Buscar nas mensagens"[^>]*>/);
    expect(html).toMatch(/aria-haspopup="dialog" aria-expanded="false" aria-label="Seu perfil"/);
    expect(html).toContain(">A<");
  });

  it("fora da conversa, a busca e o avatar levam à conversa com a folha aberta", () => {
    const html = renderToStaticMarkup(
      <Shell me={me()}>
        <p>painel</p>
      </Shell>,
    );
    expect(html).toContain('href="/conversas?buscar=1"');
    expect(html).toContain('href="/conversas?perfil=1"');
  });

  it("a inicial do avatar e o atalho da busca", () => {
    expect(initialOf("ana souza")).toBe("A");
    expect(initialOf("  élio")).toBe("É");
    expect(initialOf("")).toBe("?");
    expect(isSearchShortcut({ key: "k", metaKey: true, ctrlKey: false, altKey: false, shiftKey: false })).toBe(true);
    expect(isSearchShortcut({ key: "K", metaKey: false, ctrlKey: true, altKey: false, shiftKey: false })).toBe(true);
    expect(isSearchShortcut({ key: "k", metaKey: false, ctrlKey: false, altKey: false, shiftKey: false })).toBe(false);
    expect(isSearchShortcut({ key: "k", metaKey: true, ctrlKey: false, altKey: false, shiftKey: true })).toBe(false);
  });

  it("o uso da semana é uma porcentagem: US$ 1 por semana é o uso cheio", () => {
    expect(weekLeftPercent(budget(1))).toBe(100);
    expect(weekLeftPercent(budget(0.72))).toBe(72);
    expect(weekLeftPercent(budget(0))).toBe(0);
    // Never below zero nor above the cap, and a missing cap is no use at all.
    expect(weekLeftPercent(budget(-0.5))).toBe(0);
    expect(weekLeftPercent(budget(2))).toBe(100);
    expect(weekLeftPercent(budget(1, 0))).toBe(0);
  });

  it("o painel mostra o menor preço comparável da última leitura", () => {
    expect(lowestOf(result([{ priceText: "R$ 300,00", amount: 300 }, { priceText: "R$ 250,00", amount: 250 }]))).toBe(
      "R$ 250,00",
    );
    expect(lowestOf(result([{ priceText: "preço desconhecido", amount: null }]))).toBeNull();
    expect(lowestOf(null)).toBeNull();
  });

  it("diz em quais lojas a pesquisa também lê direto", () => {
    expect(researchNote(me())).not.toMatch(/extensão/i);
    expect(researchNote(me(["mercadolivre.com.br", "dior.com"]))).toBeNull();
  });

  it("a conversa única não tem lista de conversas nem fala de extensão", async () => {
    forgetCached();
    vi.stubGlobal("fetch", async (url: string) => Response.json(String(url).endsWith("/me") ? me() : []));
    await api.me();
    const html = renderToStaticMarkup(<Chat />);
    vi.unstubAllGlobals();
    forgetCached();
    expect(html).toContain('id="mensagem"');
    expect(html).toContain("já dá para escrever");
    expect(html).not.toContain("Suas conversas");
    expect(html).not.toContain("Nova conversa");
    expect(html).not.toMatch(/extensão/i);
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
    // 20/11/2026: a run read back is one folded line; the stores and where prices came from inside it,
    // never the raw offers before the tone chose.
    const html = renderToStaticMarkup(<ResearchRunSummary run={run} />);
    expect(html).toContain("Pesquisei 1 oferta em 1 loja");
    expect(html).toContain("Dior <span");
    expect(html).toContain("navegador remoto da tone, sem login");
    expect(html).not.toContain("R$ 899.00");
  });
});
