// Moving between screens reuses what was just read; any change forgets it.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("posthog-js", () => ({ default: { capture: () => undefined, get_property: () => undefined, identify: () => undefined, reset: () => undefined } }));
const { api, forgetCached, peek } = await import("../src/conversas/api");

const fetchMock = vi.fn();
beforeEach(() => {
  forgetCached();
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => new Response("[]", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe("cópia curta das leituras", () => {
  it("duas telas pedindo a mesma lista ao mesmo tempo fazem um pedido só", async () => {
    await Promise.all([api.watches(), api.watches()]);
    await api.watches();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(peek("watches")).toEqual([]);
  });

  it("uma mudança enviada esquece as cópias", async () => {
    await api.sessions();
    await api.deleteWatch("w1");
    expect(peek("sessions")).toBeUndefined();
    await api.sessions();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("acompanhar uma leitura pede de novo a cada vez", async () => {
    await api.watchResults("w1");
    await api.watchResults("w1", { fresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("um erro não fica guardado", async () => {
    fetchMock.mockImplementationOnce(async () => new Response("{}", { status: 500 }));
    await expect(api.memories()).rejects.toThrow();
    await api.memories();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("abrir a conversa sem esperar o /me (20/11/2026)", () => {
  const sessions = [1, 2, 3, 4].map((n) => ({ id: `s${n}`, onboarding: false, startedAt: "2026-11-20T10:00:00.000Z", lastAt: "2026-11-20T10:00:00.000Z", messages: 2 }));
  const paths = () => fetchMock.mock.calls.map(([url]) => String(url).replace("/api/tone/", ""));

  it("pede a lista e as três conversas mais novas logo, e as telas usam o que já veio", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      new Response(JSON.stringify(String(url).endsWith("chat/sessions") ? sessions : []), { status: 200 }),
    );
    const { prefetchChat } = await import("../src/conversas/api");
    prefetchChat();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(paths()).toEqual([
      "chat/sessions",
      ...["s1", "s2", "s3"].flatMap((id) => [`sessions/${id}/transcript`, `sessions/${id}/research-runs`, `sessions/${id}/review-runs`]),
    ]);
    const asked = fetchMock.mock.calls.length;
    await api.chatSessions().catch(() => undefined);
    await Promise.all([api.transcript("s1"), api.researchRuns("s2"), api.reviewRuns("s3")]).catch(() => undefined);
    expect(fetchMock).toHaveBeenCalledTimes(asked);
    // Used once: asking again goes to the server.
    await api.transcript("s1").catch(() => undefined);
    expect(fetchMock).toHaveBeenCalledTimes(asked + 1);
  });
});
