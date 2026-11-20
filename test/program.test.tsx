// T06: the agent's components on the web come from src/tone/genui. Links open
// only store pages that do not pay, in a new tab; images come only from store CDNs.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { savedFrameCode } from "../src/conversas/frames";
import { openStore, Program, type ProgramHost, storeHostsOf, storeLink } from "../src/conversas/Program";

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
  it("abre o Google Shopping só na página de produto, nunca outro endereço do Google", () => {
    expect(storeLink("https://www.google.com/search?prds=gpcid:1")).toBe("https://www.google.com/search?prds=gpcid:1");
    expect(storeLink("https://www.google.com/url?q=https://evil.example", "google.com")).toBeNull();
    expect(storeLink("https://www.epocacosmeticos.com.br/perfume/p")).toBe("https://www.epocacosmeticos.com.br/perfume/p");
    expect(storeLink("https://loja.example/p")).toBeNull();
  });

  it("deixa selecionar um produto e mostra a foto do Google Shopping da pesquisa", () => {
    const code = `root = View([c])
c = ProductCarousel("Perfumes", [p])
p = Product("Perfume A", "https://www.amazon.com.br/dp/B0A", 199, "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:x")`;
    expect(draw(code)).toContain("Selecionar");
    expect(draw(code)).toContain("encrypted-tbn2.gstatic.com");
    expect(draw(code, { ...host, picked: "https://www.amazon.com.br/dp/B0A" })).toContain("Selecionado");
  });

  it("mostra os produtos com foto da loja, preço e o porquê", () => {
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

  it("põe a melhor escolha primeiro, diz a loja e dá setas e um 'não curti' por cartão", () => {
    // 20/11/2026: o modelo escreveu a melhor escolha em segundo; a loja não aparecia no cartão.
    const html = draw(`root = View([c])
c = ProductCarousel("Tênis brancos", [p1, p2])
p1 = Product("Tênis Bellaro", "https://www.amazon.com.br/dp/B0A", 329, null, null, null, ["Couro"], null, null)
p2 = Product("Tênis Ankor", "https://www.epocacosmeticos.com.br/tenis/p", 139.9, null, null, null, ["Liso"], null, "Melhor escolha")`);
    expect(html.indexOf("Tênis Ankor")).toBeLessThan(html.indexOf("Tênis Bellaro"));
    expect(html).toContain("Amazon");
    expect(html).toContain('aria-label="Próximas opções"');
    expect(html.match(/aria-label="Não curti /g)).toHaveLength(2);
  });

  it("desenha o encaixe do relógio no pulso", () => {
    const html = draw(`root = View([w])
w = WristFit(40, 16, "Casio 40 mm no seu pulso")`);
    expect(html).toContain("Casio 40 mm no seu pulso");
    expect(html).toContain("<svg");
    expect(html).not.toMatch(/extensão/i);
  });

  it("monta caminhos para uma situação: o que a pessoa já tem aparece sem link nem preço", () => {
    const html = draw(`root = View([s])
s = SolutionSet("Casamento à tarde · jardim", [a])
a = SolutionPath("A melhor escolha", [d, own], "Tecido leve e combina com a sua sandália.", "Menos marcante")
d = SolutionItem("Vestido midi verde", "Vestido", false, "https://www.amazon.com.br/dp/B0A", null, 289.9)
own = SolutionItem("Sua sandália dourada", "Seu sapato", true, "https://tracker.example.com/x", null, 999)`);
    expect(html).toContain("Casamento à tarde · jardim");
    expect(html).toContain("Você já tem");
    expect(html).toContain("Ver Vestido midi verde na loja");
    expect(html).not.toContain("Ver Sua sandália dourada na loja");
    expect(html).not.toContain("999");
    expect(html).toContain("Em troca: Menos marcante");
  });

  it("pergunta se a hipótese está certa com três respostas fixas", () => {
    const html = draw(`root = View([m])
m = MemoryCheck("roupa.comprimento.formal", "Para eventos formais, você prefere midi")`);
    for (const label of ["Sim", "Mais ou menos", "Não"]) expect(html).toContain(`>${label}<`);
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

  it("abre a página da Dior no host do catálogo listado em /api/me, e nunca o checkout dela", () => {
    const open = vi.fn();
    vi.stubGlobal("window", { open });
    vi.stubGlobal("navigator", { sendBeacon: () => true });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null)));
    const hosts = storeHostsOf([{ domain: "dior.com", label: "Dior", reading: "catalog", hosts: ["shop.dior.com.br"] }]);
    expect(hosts).toEqual(["dior.com", "shop.dior.com.br"]);
    const page = "https://shop.dior.com.br/sauvage-eau-de-parfum/p?skuId=1";
    // Without the list from /api/me the link was refused and the button did nothing (15/11/2026).
    openStore("s1", page, "Sauvage", { source: "generated_ui" });
    expect(open).not.toHaveBeenCalled();
    openStore("s1", page, "Sauvage", { source: "generated_ui" }, hosts);
    openStore("s1", "https://shop.dior.com.br/checkout/#/cart", "Carrinho", { source: "generated_ui" }, hosts);
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(page, "_blank", "noopener,noreferrer");
    vi.unstubAllGlobals();
  });

  it("desenha uma comparação de opções que não são produtos, com escala e aviso", () => {
    const html = draw(`root = View([cmp, warn])
cmp = Comparison("As linhas do Sauvage", ["EDT", "EDP"], [r1, r2], ["Dia a dia no calor", "Noite"], null, null)
r1 = CompareRow("Concentração", ["Eau de Toilette", "Eau de Parfum"], null)
r2 = ScaleRow("Intensidade", "Leve", "Marcante", [2, 4])
warn = Callout("atencao", "Eau Sauvage é outro perfume", "É um clássico de 1966, não é da linha Sauvage.")`);
    expect(html).toContain("<table");
    expect(html).toContain("As linhas do Sauvage");
    expect(html).toContain("Eau de Parfum");
    expect(html).toContain("Eau Sauvage é outro perfume");
  });

  it("open never opens a checkout url", () => {
    const open = vi.fn();
    vi.stubGlobal("window", { open });
    vi.stubGlobal("navigator", { sendBeacon: () => true });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null)));
    openStore("s1", "https://www.amazon.com.br/gp/buy/spc/handlers/display.html", "Carrinho", { source: "generated_ui" });
    expect(open).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("um quadro salvo de uma conversa antiga é desenhado pelos componentes da web", () => {
    const code = savedFrameCode({
      id: "c1",
      name: "show_products",
      props: {
        title: "Fones",
        products: [
          {
            title: "Fone \"A\"",
            url: "https://www.amazon.com.br/dp/B0A",
            price: 99.9,
            image: null,
            rating: 4.5,
            reasons: ["Bateria longa"],
            caveat: null,
          },
        ],
      },
    });
    expect(code).not.toBeNull();
    const html = draw(code ?? "", { ...host, interactive: false });
    expect(html).toContain("Fones");
    expect(html).toContain("Fone &quot;A&quot;");
    expect(html).toContain("Bateria longa");
    expect(draw(savedFrameCode({ id: "c2", name: "show_fit", props: { caseMm: 40, wristCm: 16, label: "No pulso" } }) ?? "")).toContain("<svg");
    const product = (title: string) => ({ title, url: "https://www.amazon.com.br/dp/B0A", price: 10, image: null, rating: null, reasons: [], caveat: null });
    const comparison = savedFrameCode({
      id: "c5",
      name: "show_comparison",
      props: { products: [product("X"), product("Y")], attributes: [{ label: "Bateria", values: ["10 h", "8 h"] }], recommended: 0, verdict: "Fique com o X" },
    });
    expect(draw(comparison ?? "", { ...host, interactive: false })).toContain("Fique com o X");
    const question = savedFrameCode({ id: "c6", name: "quick_question", props: { question: "Qual tamanho?", memoryKey: "roupa.tamanho", options: ["P", "M"] } });
    expect(draw(question ?? "", { ...host, interactive: false })).toContain("Qual tamanho?");
    const choice = savedFrameCode({
      id: "c7",
      name: "ask_this_or_that",
      props: { question: "Qual estilo?", memoryKey: "relogio.estilo", options: [{ label: "Clássico", image: null }, { label: "Esportivo", image: null }] },
    });
    expect(draw(choice ?? "", { ...host, interactive: false })).toContain("Esportivo");
    expect(savedFrameCode({ id: "c3", name: "show_products", props: { title: 1 } })).toBeNull();
    expect(savedFrameCode({ id: "c4", name: "desconhecido", props: {} })).toBeNull();
  });

  it("só liga para HTTPS de loja e nunca para checkout", () => {
    expect(storeLink("https://produto.mercadolivre.com.br/MLB-1")).not.toBeNull();
    expect(storeLink("http://www.amazon.com.br/dp/1")).toBeNull();
    expect(storeLink("https://pagamento.mercadolivre.com.br/x")).toBeNull();
    expect(storeLink("https://amazon.com.br.example.com/dp/1")).toBeNull();
  });
});
