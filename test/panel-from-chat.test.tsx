// The chat's draft card: tapped answers go as a panel turn, a confirmed panel opens its page, and
// a draft reopened in the "Novo painel" sheet answers in a session of its own, never in the chat.
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("posthog-js", () => ({ default: { capture: () => undefined, get_property: () => undefined } }));
const { watchAction } = await import("../src/conversas/Program");
const { reviewSession } = await import("../src/conversas/NewPanel");

describe("cartão do painel no chat", () => {
  it("answer_watch manda as respostas como turno de painel", () => {
    const answerWatch = vi.fn();
    const handled = watchAction(
      { type: "answer_watch", watchId: "w1", text: "Qual modelo? Pegasus 41" },
      { answerWatch, openPanel: () => undefined },
    );
    expect(handled).toBe(true);
    expect(answerWatch).toHaveBeenCalledWith("w1", "Qual modelo? Pegasus 41");
  });

  it("open_panel navega para a página do painel", () => {
    const openPanel = vi.fn();
    watchAction({ type: "open_panel", watchId: "w1" }, { answerWatch: () => undefined, openPanel });
    expect(openPanel).toHaveBeenCalledWith("/paineis/w1");
  });

  it("outras ações não são do painel", () => {
    expect(watchAction({ type: "say", text: "oi" }, { answerWatch: vi.fn(), openPanel: vi.fn() })).toBe(false);
  });

  it("rascunho reaberto responde numa sessão nova", () => {
    expect(reviewSession()).toBeNull();
  });
});
