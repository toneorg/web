// T06: the web's back end for front end. The browser talks only to this site;
// the tone API credential stays in an HttpOnly cookie on this origin.
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRequest, proxyToTone, rewriteSetCookie, upstreamHeaders, upstreamPath } from "../src/lib/tone-bff";

afterEach(() => vi.unstubAllGlobals());
const site = "https://tone.example";

describe("BFF da web (T06)", () => {
  it("só repassa caminhos conhecidos da API, sem travessia", () => {
    expect(upstreamPath(["sessions", "abc-123", "transcript"])).toBe("/api/sessions/abc-123/transcript");
    expect(upstreamPath(["agent", "turn"])).toBe("/api/agent/turn");
    expect(upstreamPath(["auth", "web", "link"])).toBe("/api/auth/web/link");
    expect(upstreamPath(["auth", "redeem"])).toBeNull();
    expect(upstreamPath(["auth", "extension", "link"])).toBeNull();
    expect(upstreamPath(["..", "admin"])).toBeNull();
    expect(upstreamPath(["sessions", "a%2F..%2Fadmin"])).toBeNull();
    expect(upstreamPath(["admin"])).toBeNull();
    // Local research: the web asks and follows; only the extension takes steps or beats.
    expect(upstreamPath(["local-runs"])).toBe("/api/local-runs");
    expect(upstreamPath(["local-runs", "abc", "stop"])).toBe("/api/local-runs/abc/stop");
    expect(upstreamPath(["local-runs", "next"])).toBe("/api/local-runs/next");
    expect(upstreamPath(["local-runs", "abc", "steps", "0"])).toBeNull();
    expect(upstreamPath(["local-bridge", "heartbeat"])).toBeNull();
    // T11: the center's actions and the mute link of an e-mail.
    expect(upstreamPath(["watches", "w1", "mute"])).toBe("/api/watches/w1/mute");
    expect(upstreamPath(["watches", "w1", "unmute"])).toBe("/api/watches/w1/unmute");
    expect(upstreamPath(["watch-mute"])).toBe("/api/watch-mute");
    expect(upstreamPath(["watch-mute", "x"])).toBeNull();
  });

  it("exige o cabeçalho da web e a mesma origem para mudar algo", () => {
    const headers = (entries: Record<string, string>) => new Headers(entries);
    expect(checkRequest("GET", headers({}), site)).toEqual({ ok: true });
    expect(checkRequest("POST", headers({ origin: site }), site)).toMatchObject({ ok: false, status: 403 });
    expect(checkRequest("POST", headers({ "x-tone-web": "1", origin: "https://ataque.example" }), site)).toMatchObject({
      ok: false,
    });
    expect(checkRequest("POST", headers({ "x-tone-web": "1", "sec-fetch-site": "cross-site" }), site)).toMatchObject({
      ok: false,
    });
    expect(checkRequest("POST", headers({ "x-tone-web": "1", origin: site }), site)).toEqual({ ok: true });
  });

  it("repassa só o cookie da tone e nunca uma credencial da extensão", () => {
    const out = upstreamHeaders(
      new Headers({
        cookie: "outro=1; tone_web=segredo; _ga=x",
        authorization: "Bearer da-extensao",
        "content-type": "application/json",
        origin: site,
      }),
    );
    expect(out.get("cookie")).toBe("tone_web=segredo");
    expect(out.get("authorization")).toBeNull();
    expect(out.get("origin")).toBeNull();
    expect(out.get("x-tone-web")).toBe("1");
  });

  it("regrava o cookie para esta origem, HttpOnly, Strict e Secure em HTTPS", () => {
    const rewritten = rewriteSetCookie("tone_web=abc; Max-Age=2592000; Domain=api.tone.example; Path=/api; HttpOnly; SameSite=Strict", true);
    expect(rewritten).toMatch(/^tone_web=abc;/);
    expect(rewritten).toMatch(/Path=\/api\/tone/);
    expect(rewritten).not.toMatch(/Domain=/i);
    expect(rewritten).toMatch(/HttpOnly/);
    expect(rewritten).toMatch(/SameSite=Strict/);
    expect(rewritten).toMatch(/Secure/);
    expect(rewriteSetCookie("outro=1; Path=/", true)).toBeNull();
  });

  it("encaminha ao servidor e devolve o stream sem expor a credencial", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      const headers = new Headers({ "content-type": "text/event-stream", "x-request-id": "r1" });
      headers.append("set-cookie", "tone_web=novo; Max-Age=10; Path=/api; HttpOnly; SameSite=Strict");
      return new Response("data: {}\n\n", { status: 200, headers });
    });
    const request = new Request(`${site}/api/tone/agent/turn`, {
      method: "POST",
      headers: { "x-tone-web": "1", origin: site, cookie: "tone_web=velho", "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "s", input: {} }),
    });
    const response = await proxyToTone(request, ["agent", "turn"], { apiUrl: "https://api.tone.example", siteUrl: site });
    expect(calls[0]?.url).toBe("https://api.tone.example/api/agent/turn");
    expect(new Headers(calls[0]?.init.headers).get("cookie")).toBe("tone_web=velho");
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(response.headers.get("cache-control")).toMatch(/no-store/);
    expect(response.headers.get("set-cookie")).toMatch(/Path=\/api\/tone/);
    expect(await response.text()).toBe("data: {}\n\n");
  });

  it("recusa caminho desconhecido e pedido de outro site sem chamar o servidor", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const config = { apiUrl: "https://api.tone.example", siteUrl: site };
    expect((await proxyToTone(new Request(`${site}/api/tone/admin`), ["admin"], config)).status).toBe(404);
    const foreign = new Request(`${site}/api/tone/memories`, { method: "POST", headers: { origin: "https://x.example" } });
    expect((await proxyToTone(foreign, ["memories"], config)).status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("indica servidor indisponível sem detalhar o erro", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("ECONNREFUSED 10.0.0.1:8787 segredo");
    });
    const response = await proxyToTone(new Request(`${site}/api/tone/me`), ["me"], {
      apiUrl: "https://api.tone.example",
      siteUrl: site,
    });
    expect(response.status).toBe(502);
    expect(await response.text()).not.toMatch(/ECONNREFUSED|segredo/);
  });
});
