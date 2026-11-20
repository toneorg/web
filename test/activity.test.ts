import { describe, expect, it } from "vitest";
import {
  activitySummary,
  applyStatus,
  endActivity,
  missingStores,
  newActivity,
  startWriting,
  storeCounts,
  worthKeeping,
} from "../src/conversas/Activity";
import type { ResearchRunState } from "../src/tone/shared";

const status = (text: string, extra: Record<string, unknown> = {}) => ({ type: "status" as const, text, ...extra });

function run(offers: { store: string }[], sources: { source: string; state: string }[] = []): ResearchRunState {
  return {
    runId: "r",
    sessionId: "s",
    seq: 3,
    stage: "completed",
    message: "Pesquisa concluída.",
    source: null,
    offers: offers.length,
    done: null,
    total: null,
    terminal: true,
    startedAt: "2026-11-20T12:00:00.000Z",
    updatedAt: "2026-11-20T12:00:14.000Z",
    result: {
      offers: offers.map((offer, index) => ({ id: `o${index}`, store: offer.store })),
      sources: sources.map((source) => ({ ...source, url: "https://x.com", observedAt: "", explanation: "" })),
    },
  } as unknown as ResearchRunState;
}

describe("a atividade do turno", () => {
  it("cada etapa fecha a anterior; o que já veio pronto fecha a si mesmo", () => {
    let activity = newActivity(0);
    activity = applyStatus(activity, status("Lendo o seu pedido", { step: "understand" }), 0);
    activity = applyStatus(activity, status("Entendi: calça · linho", { step: "intent", done: true }), 1000);
    activity = applyStatus(activity, status("Procurando nas lojas", { step: "search" }), 1000);
    expect(activity.steps.map((entry) => [entry.text, entry.endedAt])).toEqual([
      ["Lendo o seu pedido", 1000],
      ["Entendi: calça · linho", 1000],
      ["Procurando nas lojas", undefined],
    ]);
  });

  it("escrevendo não se repete quando o modelo escreve em mais de uma rodada", () => {
    let activity = applyStatus(newActivity(0), status("Escrevendo a resposta", { step: "write" }), 0);
    activity = startWriting(activity, 10);
    activity = applyStatus(activity, status("Escrevendo a resposta", { step: "write" }), 20);
    expect(activity.steps).toHaveLength(1);
  });

  it("uma resposta simples não deixa rastro; uma pesquisa deixa uma linha", () => {
    const plain = endActivity(startWriting(applyStatus(newActivity(0), status("Lendo o seu pedido", { step: "understand" }), 0), 500), 3000);
    expect(worthKeeping(plain)).toBe(false);
    const searched = endActivity({ ...newActivity(0), runs: { r: run([{ store: "cea.com.br" }, { store: "cea.com.br" }, { store: "hering.com.br" }]) } }, 41_000);
    expect(worthKeeping(searched)).toBe(true);
    expect(activitySummary(searched)).toBe("Pesquisei 3 ofertas em 2 lojas · 41 s");
  });

  it("conta as ofertas por loja e diz quem não respondeu", () => {
    const runs = [
      run(
        [{ store: "cea.com.br" }, { store: "hering.com.br" }, { store: "cea.com.br" }],
        [
          { source: "oxylabs:shein.com", state: "unavailable" },
          { source: "direct:cea.com.br", state: "ok" },
          { source: "dataforseo.amazon", state: "blocked" },
        ],
      ),
    ];
    expect(storeCounts(runs).map((entry) => [entry.store, entry.offers])).toEqual([
      ["cea.com.br", 2],
      ["hering.com.br", 1],
    ]);
    expect(missingStores(runs)).toEqual([
      { label: "Shein", blocked: false },
      { label: "Amazon", blocked: true },
    ]);
  });
});
