// "Não curti" (#28): o clique grava a rejeição no servidor e continua mandando a frase ao chat.
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
vi.mock("posthog-js", () => ({ default: { capture: () => undefined, get_property: () => undefined } }));
const { rejectProduct } = await import("../src/conversas/Program");

afterEach(() => vi.unstubAllGlobals());

const stubFetch = () => {
  const sent: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
    sent.push({ url, init });
    return Promise.resolve(new Response("{}"));
  });
  return sent;
};

describe("não curti", () => {
  it("Estilo grava recommendation_rejected e ainda manda a frase ao chat", () => {
    const sent = stubFetch();
    const say = vi.fn();
    rejectProduct("s1", { type: "reject", url: "https://www.dior.com/p/1", title: "Sauvage", reason: "estilo" }, say);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.url).toBe("/api/tone/events");
    expect(JSON.parse(String(sent[0]?.init.body))).toEqual({
      sessionId: "s1",
      events: [
        { type: "recommendation_rejected", url: "https://www.dior.com/p/1", title: "Sauvage", reason: "estilo" },
      ],
    });
    expect(say).toHaveBeenCalledWith('Não curti "Sauvage". Motivo: estilo.');
  });

  it("leva offerId e runId quando a ação os traz", () => {
    const sent = stubFetch();
    rejectProduct(
      "s1",
      { type: "reject", url: "https://x.test/p", title: "X", reason: "preco", offerId: "o1", runId: "r1" } as never,
      vi.fn(),
    );
    expect(JSON.parse(String(sent[0]?.init.body)).events[0]).toMatchObject({ offerId: "o1", runId: "r1" });
  });

  it("motivo desconhecido não grava nem fala", () => {
    const sent = stubFetch();
    const say = vi.fn();
    rejectProduct("s1", { type: "reject", url: "https://x.test/p", title: "X", reason: "sei la" }, say);
    expect(sent).toEqual([]);
    expect(say).not.toHaveBeenCalled();
  });

  it("falha de rede não quebra o clique", () => {
    vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));
    const say = vi.fn();
    expect(() =>
      rejectProduct("s1", { type: "reject", url: "https://x.test/p", title: "X", reason: "tamanho" }, say),
    ).not.toThrow();
    expect(say).toHaveBeenCalled();
  });
});
