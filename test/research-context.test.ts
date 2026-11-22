// 21/11/2026: each answer's "Usei" comes from the search of its own turn.
import { describe, expect, it } from "vitest";
import type { Item } from "@/conversas/Conversation";
import { researchContexts } from "@/conversas/research-context";
import type { ResearchContext, ResearchRunState } from "@/tone/shared";

const context = (label: string): ResearchContext => ({
  used: [{ id: "pessoa_orcamento", label, source: "memory" }],
  widened: [],
  note: null,
});
const run = (runId: string, startedAt: string, ctx: ResearchContext | null): ResearchRunState => ({
  runId,
  sessionId: "s",
  seq: 0,
  stage: "completed",
  message: "ok",
  source: null,
  offers: 1,
  done: null,
  total: null,
  terminal: true,
  startedAt,
  updatedAt: startedAt,
  result: null,
  context: ctx,
});
const activity = (id: string, runs: ResearchRunState[]): Item =>
  ({
    id,
    session: "s",
    kind: "activity",
    activity: { startedAt: 0, runs: Object.fromEntries(runs.map((entry) => [entry.runId, entry])) },
  }) as unknown as Item;
const answer = (id: string, at?: string, old?: true, activityId?: string): Item => ({ id, session: "s", kind: "assistant", text: "x", ...(at ? { at } : {}), ...(old ? { old } : {}), ...(activityId ? { activityId } : {}) });
const user = (id: string, at: string, old?: true): Item => ({ id, session: "s", kind: "user", text: "q", at, ...(old ? { old } : {}) });

describe("o Usei de cada resposta", () => {
  it("ao vivo, vem da atividade do próprio turno, sem comparar relógios", () => {
    const map = researchContexts([
      user("u1", "2026-11-21T10:00:00Z"),
      activity("a1", [run("r1", "2026-11-21T09:00:00Z", context("até R$ 150"))]),
      // The client clock is behind the server's: the answer still gets its search.
      answer("x1", "2026-11-21T08:00:00Z", undefined, "a1"),
      activity("a2", [run("r2", "2026-11-21T11:00:00Z", null)]),
      answer("x2", "2026-11-21T11:00:05Z", undefined, "a2"),
      // The next turn did not search: its activity was dropped at the end, and the answer keeps no "Usei".
      user("u3", "2026-11-21T11:10:00Z"),
      answer("x3", "2026-11-21T11:10:05Z", undefined, "a3"),
    ]);
    expect(map.get("x1")?.used[0]?.label).toBe("até R$ 150");
    // A turn without a search of its own has no "Usei".
    expect(map.has("x2")).toBe(false);
    expect(map.has("x3")).toBe(false);
  });

  it("reaberta, liga pela hora do servidor, entre a mensagem e a resposta", () => {
    const map = researchContexts([
      user("u1", "2026-11-21T10:00:00Z", true),
      answer("x1", "2026-11-21T10:01:00Z", true),
      user("u2", "2026-11-21T10:05:00Z", true),
      answer("x2", "2026-11-21T10:06:00Z", true),
      { id: "run-r1", session: "s", kind: "research", run: run("r1", "2026-11-21T10:00:10Z", context("até R$ 150")), old: true },
      { id: "run-r2", session: "s", kind: "research", run: run("r2", "2026-11-21T10:05:10Z", context("até R$ 200")), old: true },
    ]);
    expect(map.get("x1")?.used[0]?.label).toBe("até R$ 150");
    expect(map.get("x2")?.used[0]?.label).toBe("até R$ 200");
  });

  it("reaberta, a resposta a um toque não herda o Usei do turno anterior", () => {
    const map = researchContexts([
      user("u1", "2026-11-21T10:00:00Z", true),
      answer("x1", "2026-11-21T10:01:00Z", true),
      { id: "t1", session: "s", kind: "notice", text: "Você respondeu: amadeirado", saved: true, tapped: true, at: "2026-11-21T10:02:00Z", old: true },
      answer("x2", "2026-11-21T10:03:00Z", true),
      { id: "run-r1", session: "s", kind: "research", run: run("r1", "2026-11-21T10:00:10Z", context("até R$ 150")), old: true },
    ]);
    expect(map.get("x1")?.used[0]?.label).toBe("até R$ 150");
    expect(map.has("x2")).toBe(false);
  });
});
