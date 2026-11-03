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
