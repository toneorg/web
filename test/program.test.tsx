// T06: the agent's components on the web are the extension's own (src/tone/genui). Links open
// only store pages that do not pay, in a new tab; images come only from store CDNs.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { openStore, Program, type ProgramHost, storeLink } from "../src/conversas/Program";

const host: ProgramHost = {
  sessionId: "s1",
  interactive: true,
  answer: () => undefined,
  say: () => undefined,
  picked: null,
  pick: () => undefined,
};
const draw = (code: string, h: ProgramHost = host) =>
  renderToStaticMarkup(<Program code={code} streaming={false} host={h} />);

describe("componentes na web (T06)", () => {
  it("deixa selecionar um produto e mostra a foto do Google Shopping da pesquisa", () => {
    const code = `root = View([c])
c = ProductCarousel("Perfumes", [p])
p = Product("Perfume A", "https://www.amazon.com.br/dp/B0A", 199, "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:x")`;
    expect(draw(code)).toContain("Selecionar");
    expect(draw(code)).toContain("encrypted-tbn2.gstatic.com");
    expect(draw(code, { ...host, picked: "https://www.amazon.com.br/dp/B0A" })).toContain("Selecionado");
  });

  it("mostra os produtos como na extensão: foto da loja, preço e o porquê", () => {
    const html = draw(`root = View([c])
c = ProductCarousel("Fones", [p1, p2])
p1 = Product("Fone A", "https://www.amazon.com.br/dp/B0A", 99.9, "https://m.media-amazon.com/images/I/a.jpg", 4.5, 10, ["Bateria longa"], "Estojo grande", "Melhor escolha")
p2 = Product("Fone B", "https://www.amazon.com.br/dp/B0B", 80, "https://tracker.example.com/p.gif")`);
    expect(html).toContain("Fone A");
    expect(html).toContain("Bateria longa");
    expect(html).toContain("Estojo grande");
    expect(html).toContain("m.media-amazon.com");
    expect(html).not.toContain("tracker.example.com");
    expect(html).toContain("Ver na loja");
  });

  it("desenha também o que antes só a extensão desenhava", () => {
    const html = draw(`root = View([w])
w = WristFit(40, 16, "Casio 40 mm no seu pulso")`);
    expect(html).toContain("Casio 40 mm no seu pulso");
    expect(html).toContain("<svg");
    expect(html).not.toContain("aparece completo na extensão");
  });

  it("perguntas só respondem na última resposta", () => {
    const code = `root = View([q])
q = PreferenceChips("Para que você vai usar?", "fone.uso", ["Treino", "Trabalho"])`;
    expect(draw(code)).not.toMatch(/<button[^>]*disabled=""[^>]*>Treino/);
    expect(draw(code, { ...host, interactive: false })).toMatch(/<button[^>]*disabled=""[^>]*>Treino/);
  });

  it("abre a loja em outra aba só para HTTPS de loja e nunca checkout", () => {
    const open = vi.fn();
    vi.stubGlobal("window", { open });
    vi.stubGlobal("navigator", { sendBeacon: () => true });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null)));
    openStore("s1", "https://www.amazon.com.br/dp/B0A", "Fone A", { source: "generated_ui" });
    openStore("s1", "https://www.amazon.com.br/gp/buy/spc/handlers/display.html", "Fone B", { source: "generated_ui" });
    openStore("s1", "https://tracker.example.com/p", "Fone C", { source: "generated_ui" });
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith("https://www.amazon.com.br/dp/B0A", "_blank", "noopener,noreferrer");
    vi.unstubAllGlobals();
  });

  it("só liga para HTTPS de loja e nunca para checkout", () => {
    expect(storeLink("https://produto.mercadolivre.com.br/MLB-1")).not.toBeNull();
    expect(storeLink("http://www.amazon.com.br/dp/1")).toBeNull();
    expect(storeLink("https://pagamento.mercadolivre.com.br/x")).toBeNull();
    expect(storeLink("https://amazon.com.br.example.com/dp/1")).toBeNull();
  });
});
