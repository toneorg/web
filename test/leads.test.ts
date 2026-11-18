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

  describe("confirmação da lista de espera", () => {
    const resend = () => vi.fn().mockImplementation((url: string) =>
      Promise.resolve(
        String(url).startsWith("https://api.resend.com")
          ? Response.json({ id: "email_1" })
          : new Response(null, { status: 200 }),
      ),
    );
    const configure = () => {
      vi.stubEnv("LEADS_WEBHOOK_URL", "https://hook.test");
      vi.stubEnv("RESEND_API_KEY", "re_test");
      vi.stubEnv("MAIL_FROM", "tone <avisos@heytone.app>");
      vi.stubEnv("NEXT_PUBLIC_CONTACT_EMAIL", "contato@heytone.app");
    };

    it("sends 'recebemos seu interesse' once the entry is saved", async () => {
      configure();
      const fetch = resend();
      vi.stubGlobal("fetch", fetch);
      const response = await receive("waitlist", request({ email: " Ana@B.co ", source: "home-abertura" }));
      expect(response.status).toBe(200);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(String(fetch.mock.calls[0][0])).toBe("https://hook.test");
      const [url, init] = fetch.mock.calls[1];
      expect(String(url)).toBe("https://api.resend.com/emails");
      expect(init.headers.authorization).toBe("Bearer re_test");
      expect(init.headers["idempotency-key"]).toMatch(/^waitlist-[0-9a-f]{64}$/);
      const mail = JSON.parse(init.body);
      expect(mail).toMatchObject({
        from: "tone <avisos@heytone.app>",
        to: ["ana@b.co"],
        reply_to: "contato@heytone.app",
        subject: "Recebemos seu interesse na tone",
      });
      expect(mail.text).toContain("lista de espera");
      expect(mail.html).toContain("Recebemos seu interesse");
    });

    it("gives the same e-mail the same key, so a second sign-up is not sent twice", async () => {
      configure();
      const fetch = resend();
      vi.stubGlobal("fetch", fetch);
      await receive("waitlist", request({ email: "ana@b.co" }));
      await receive("waitlist", request({ email: "ANA@b.co" }));
      const keys = fetch.mock.calls.filter(([url]) => String(url).includes("resend")).map(([, init]) => init.headers["idempotency-key"]);
      expect(keys).toHaveLength(2);
      expect(keys[0]).toBe(keys[1]);
    });

    it("sends nothing for a pilot request, a bot, or an entry the webhook refused", async () => {
      configure();
      const fetch = resend();
      vi.stubGlobal("fetch", fetch);
      await receive("pilot", request(pilot));
      await receive("waitlist", request({ email: "ana@b.co", website: "spam" }));
      expect(fetch.mock.calls.some(([url]) => String(url).includes("resend"))).toBe(false);

      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
      vi.spyOn(console, "error").mockImplementation(() => {});
      expect((await receive("waitlist", request({ email: "ana@b.co" }))).status).toBe(502);
    });

    it("keeps the person on the list when the e-mail fails, and logs it without the address", async () => {
      configure();
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation((url: string) =>
          Promise.resolve(new Response(null, { status: String(url).includes("resend") ? 500 : 200 })),
        ),
      );
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const response = await receive("waitlist", request({ email: "ana@b.co" }));
      expect(response.status).toBe(200);
      expect(error).toHaveBeenCalled();
      expect(JSON.stringify(error.mock.calls)).not.toContain("ana@b.co");
    });

    it("still saves the entry when no mail provider is configured", async () => {
      vi.stubEnv("LEADS_WEBHOOK_URL", "https://hook.test");
      vi.stubEnv("RESEND_API_KEY", "");
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
      vi.stubGlobal("fetch", fetch);
      expect((await receive("waitlist", request({ email: "ana@b.co" }))).status).toBe(200);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});
