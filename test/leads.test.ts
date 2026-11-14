import { afterEach, describe, expect, it, vi } from "vitest";
import { receive } from "@/lib/leads";

const request = (body: unknown) =>
  new Request("http://localhost/api", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

const pilot = { name: "Ana", email: "ana@loja.com", store: "www.loja.com.br", platform: "Shopify", traffic: "10 mil a 50 mil" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("leads", () => {
  it("refuses an e-mail out of format and names the field", async () => {
    const response = await receive("waitlist", request({ email: "ana" }));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "invalid", field: "email" });
  });

  it("answers 503 when no webhook is configured", async () => {
    vi.stubEnv("LEADS_WEBHOOK_URL", "");
    expect((await receive("pilot", request(pilot))).status).toBe(503);
  });

  it("pretends a bot's entry worked and forwards nothing", async () => {
    vi.stubEnv("LEADS_WEBHOOK_URL", "https://hook.test");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const response = await receive("waitlist", request({ email: "ana@b.co", website: "spam" }));
    expect(response.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("forwards a valid pilot request without the trap field", async () => {
    vi.stubEnv("LEADS_WEBHOOK_URL", "https://hook.test");
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const response = await receive("pilot", request({ ...pilot, website: "" }));
    expect(response.status).toBe(200);
    const sent = JSON.parse(fetch.mock.calls[0][1].body);
    expect(sent).toMatchObject({ kind: "pilot", ...pilot });
    expect(sent).not.toHaveProperty("website");
  });

  it("answers 502 when the webhook fails", async () => {
    vi.stubEnv("LEADS_WEBHOOK_URL", "https://hook.test");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await receive("waitlist", request({ email: "ana@b.co" }))).status).toBe(502);
  });
});
