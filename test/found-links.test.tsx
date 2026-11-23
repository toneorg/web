// 23/11/2026: "Ver na loja" did nothing on offers the open search found outside the store list
// (saintmartini.com, ogjerseyshop.com). A page the tone's own search found opens; a page only the
// model wrote opens only on a listed store; and a button that would open nothing is not drawn.
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Item } from "@/conversas/Conversation";
import { foundOfferUrls } from "@/conversas/research-context";
import type { ResearchResult, ResearchRunState } from "@/tone/shared";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => undefined }) }));
import { openStore, Program, type ProgramHost, storeLink } from "../src/conversas/Program";

const found = "https://saintmartini.com/products/sandalia-arizona-birken-preta";
const host: ProgramHost = {
  sessionId: "s1",
  interactive: true,
  answer: () => undefined,
  say: () => undefined,
  picked: null,
  pick: () => undefined,
};
const carousel = `root = View([c])
c = ProductCarousel("Birkenstock Arizona preta", [p])
p = Product("Sandália Arizona Birken Preta", "${found}", 399.9)`;
const draw = (h: ProgramHost) => renderToStaticMarkup(<Program code={carousel} streaming={false} host={h} />);

const result = (urls: string[]) => ({ offers: urls.map((url) => ({ url })) }) as unknown as ResearchResult;
const run = (runId: string, urls: string[]): ResearchRunState => ({
  runId,
  sessionId: "s1",
  seq: 0,
  stage: "completed",
  message: "ok",
  source: null,
  offers: urls.length,
  done: null,
  total: null,
  terminal: true,
  startedAt: "2026-11-23T00:00:00Z",
  updatedAt: "2026-11-23T00:00:00Z",
  result: result(urls),
});

afterEach(() => vi.unstubAllGlobals());

describe("links que a pesquisa achou", () => {
  it("abre a página de uma loja fora da lista quando a pesquisa da tone a achou", () => {
    const open = vi.fn();
    vi.stubGlobal("window", { open });
    vi.stubGlobal("navigator", { sendBeacon: () => true });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null)));
    const urls = new Set([found, "https://saintmartini.com/checkout/cart", "http://saintmartini.com/p"]);
    openStore("s1", found, "Arizona", { source: "generated_ui" }, [], urls);
    // Found, but a checkout or plain HTTP still never opens; an address only the model wrote neither.
    openStore("s1", "https://saintmartini.com/checkout/cart", "Carrinho", { source: "generated_ui" }, [], urls);
    openStore("s1", "http://saintmartini.com/p", "Sem HTTPS", { source: "generated_ui" }, [], urls);
    openStore("s1", "https://ogjerseyshop.com/p", "Inventado", { source: "generated_ui" }, [], urls);
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(found, "_blank", "noopener,noreferrer");
    expect(storeLink(found)).toBeNull();
  });

  it("não desenha Ver na loja que não abriria; desenha quando a pesquisa achou a página", () => {
    expect(draw(host)).not.toContain("Ver na loja");
    expect(draw({ ...host, foundUrls: new Set([found]) })).toContain("Ver na loja");
  });

  it("junta as ofertas das pesquisas guardadas e das que rodam agora", () => {
    const items = [
      { id: "run-1", session: "s1", kind: "research", run: run("r1", ["https://femizzalojas.com/p"]), old: true },
      {
        id: "a1",
        session: "s1",
        kind: "activity",
        activity: { startedAt: 0, runs: { r2: run("r2", [found]), r3: { ...run("r3", []), result: null } } },
      },
    ] as unknown as Item[];
    expect([...foundOfferUrls(items)].sort()).toEqual([found, "https://femizzalojas.com/p"].sort());
  });
});
