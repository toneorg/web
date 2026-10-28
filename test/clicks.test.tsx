// Clicks on recommended products on the web: the link records where it was before the store opens.
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoreLink } from "../src/conversas/Program";

afterEach(() => vi.unstubAllGlobals());

type LinkProps = { href: string; onClick?: () => void; onAuxClick?: (event: { button: number }) => void };

describe("cliques nos produtos da web", () => {
  it("o clique e o clique do meio registram o produto e de onde veio; o botão direito não", () => {
    const sent: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
      sent.push({ url, init });
      return Promise.resolve(new Response("{}"));
    });
    const link = StoreLink({
      url: "https://www.dior.com/pt_br/beauty/products/Y0996460.html",
      store: "dior.com",
      click: { sessionId: "s1", title: "Sauvage Elixir", where: { source: "research_run", position: 0, runId: "r1" } },
    }) as ReactElement<LinkProps>;
    link.props.onClick?.();
    link.props.onAuxClick?.({ button: 1 });
    link.props.onAuxClick?.({ button: 2 });
    expect(sent).toHaveLength(2);
    expect(sent[0]?.url).toBe("/api/tone/events");
    expect(sent[0]?.init.keepalive).toBe(true);
    expect(JSON.parse(String(sent[0]?.init.body))).toEqual({
      sessionId: "s1",
      events: [
        {
          type: "recommendation_clicked",
          url: "https://www.dior.com/pt_br/beauty/products/Y0996460.html",
          title: "Sauvage Elixir",
          source: "research_run",
          position: 0,
          runId: "r1",
        },
      ],
    });
  });

  it("loja lida pelo servidor ganha link no cartão da pesquisa; fora dela, não", async () => {
    const { storeLink } = await import("../src/conversas/Program");
    expect(storeLink("https://www.dior.com/pt_br/x.html")).toBeNull();
    expect(storeLink("https://www.dior.com/pt_br/x.html", "dior.com")).toBe("https://www.dior.com/pt_br/x.html");
    expect(storeLink("https://evil.example/x", "dior.com")).toBeNull();
    expect(storeLink("https://www.dior.com/checkout/x", "dior.com")).toBeNull();
  });

  it("link sem contexto de clique não registra nada", () => {
    const sent: unknown[] = [];
    vi.stubGlobal("fetch", (...args: unknown[]) => {
      sent.push(args);
      return Promise.resolve(new Response("{}"));
    });
    const link = StoreLink({ url: "https://www.amazon.com.br/dp/B0X" }) as ReactElement<LinkProps>;
    link.props.onClick?.();
    expect(sent).toEqual([]);
  });
});
