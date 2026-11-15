// Access sessions on the profile: the current one is marked and cannot be ended here; others can.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AccessSession } from "../src/tone/shared";

vi.mock("../src/conversas/api", () => ({
  ApiError: class ApiError extends Error {},
  api: { accessSessions: vi.fn(), endAccessSession: vi.fn() },
}));
const { AccessSessionsView, withoutSession, endSession } = await import("../src/conversas/AccessSessions");
const { api } = await import("../src/conversas/api");

const session = (overrides: Partial<AccessSession> = {}): AccessSession => ({
  id: "s1",
  createdAt: "2026-11-01T12:00:00.000Z",
  lastUsedAt: "2026-11-10T12:00:00.000Z",
  expiresAt: null,
  current: false,
  ...overrides,
});

describe("AccessSessionsView", () => {
  it("lists sessions with the current one marked", () => {
    const html = renderToStaticMarkup(
      <AccessSessionsView
        sessions={[session({ id: "a", current: true }), session({ id: "b" })]}
        busy={null}
        onEnd={() => undefined}
      />,
    );
    expect(html).toContain("Este aparelho");
    expect(html.match(/>Encerrar</g)?.length).toBe(1);
    expect(html).toContain("10/11/2026");
  });

  it("disables the button of the session being ended", () => {
    const html = renderToStaticMarkup(
      <AccessSessionsView sessions={[session({ id: "b" })]} busy="b" onEnd={() => undefined} />,
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain("Encerrando…");
  });
});

describe("ending sessions", () => {
  it("ending another session removes it from the list", async () => {
    vi.mocked(api.endAccessSession).mockResolvedValue(undefined);
    const list = [session({ id: "a", current: true }), session({ id: "b" })];
    await endSession("b");
    expect(api.endAccessSession).toHaveBeenCalledWith("b");
    expect(withoutSession(list, "b").map((entry) => entry.id)).toEqual(["a"]);
  });
});
