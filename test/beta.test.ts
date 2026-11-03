// What the beta depends on to learn from its testers: analytics that group by endpoint,
// PostHog through this site, feedback that always arrives somewhere, and a tour shown once.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const capture = vi.fn();
const posthog = { capture, get_session_id: () => "replay-1", __loaded: true };
vi.mock("posthog-js", () => ({ default: posthog }));
vi.mock("next/navigation", () => ({ usePathname: () => "/conversas" }));

const { routeOf } = await import("../src/conversas/analytics");
const { posthogRewrites, posthogUiHost } = await import("../posthog-proxy");
const { sendFeedback } = await import("../src/conversas/Feedback");
const { onboardingSeen } = await import("../src/conversas/Onboarding");

beforeEach(() => capture.mockReset());
afterEach(() => vi.unstubAllGlobals());

describe("analytics", () => {
  it("agrupa as falhas por rota, sem ids", () => {
    expect(routeOf("sessions/0b7c2f1e-9a1d-4c55-8d3e-1f2a3b4c5d6e/transcript")).toBe("sessions/:id/transcript");
    expect(routeOf("watches/w_abc123/check")).toBe("watches/:id/check");
    expect(routeOf("auth/web/login")).toBe("auth/web/login");
    expect(routeOf("me")).toBe("me");
  });
});

describe("PostHog pelo próprio site", () => {
  it("encaminha /ingest para a região certa do PostHog Cloud", () => {
    expect(posthogUiHost("https://us.i.posthog.com")).toBe("https://us.posthog.com");
    expect(posthogUiHost("https://eu.i.posthog.com/")).toBe("https://eu.posthog.com");
    expect(posthogRewrites("https://eu.i.posthog.com").at(-1)).toEqual({
      source: "/ingest/:path*",
      destination: "https://eu.i.posthog.com/:path*",
    });
  });

  it("um host próprio ou ausente é chamado direto, sem proxy", () => {
    expect(posthogUiHost("https://posthog.empresa.com")).toBeNull();
    expect(posthogRewrites(undefined)).toEqual([]);
  });
});

describe("feedback", () => {
  it("vai ao servidor com o replay do momento", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    expect(await sendFeedback("bug", "O botão não respondeu", "/conversas", "s1")).toBe("server");
    const body = JSON.parse(String((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body).toEqual({
      sessionId: "s1",
      events: [
        { type: "feedback_submitted", kind: "bug", message: "O botão não respondeu", path: "/conversas", replaySessionId: "replay-1" },
      ],
    });
    expect(capture).not.toHaveBeenCalled();
  });

  it("se o servidor recusa, vai direto ao PostHog e não se perde", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 400 })));
    expect(await sendFeedback("missing", "Queria comparar", "/conversas", null)).toBe("posthog");
    expect(capture).toHaveBeenCalledWith(
      "feedback_submitted",
      expect.objectContaining({ kind: "missing", message: "Queria comparar", delivered: "posthog_only" }),
    );
  });
});

describe("tour", () => {
  it("aparece uma vez por conta neste navegador", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) },
    });
    expect(onboardingSeen("u1")).toBe(false);
    store.set("tone.onboarding.v1:u1", "completed:2026-11-03");
    expect(onboardingSeen("u1")).toBe(true);
    expect(onboardingSeen("u2")).toBe(false);
  });

  it("com o armazenamento bloqueado, não insiste", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(onboardingSeen("u1")).toBe(true);
  });
});
