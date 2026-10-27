// T06: the agent's components on the web. Links open only store pages that do not pay;
// images come only from store CDNs; components without a web drawing stay readable.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Program, type ProgramHost, storeLink } from "../src/conversas/Program";

const host: ProgramHost = { sessionId: "s1", interactive: true, answer: () => undefined, say: () => undefined };
const draw = (code: string) => renderToStaticMarkup(<Program code={code} streaming={false} host={host} />);

describe("componentes na web (T06)", () => {
  it("mostra produtos com link para a loja em outra aba, sem imagem de fora das lojas", () => {
    const html = draw(`root = View([c])
c = ProductCarousel("Fones", [p1, p2])
p1 = Product("Fone A", "https://www.amazon.com.br/dp/B0A", 99.9, "https://m.media-amazon.com/images/I/a.jpg", 4.5, 10, ["Bateria longa"], null, "Melhor escolha")
p2 = Product("Fone B", "https://www.amazon.com.br/gp/buy/spc/handlers/display.html", 80, "https://tracker.example.com/p.gif")`);
    expect(html).toContain("Fone A");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("m.media-amazon.com");
    expect(html).not.toContain("tracker.example.com");
    expect(html).not.toContain("/gp/buy/");
  });

  it("componente sem desenho na web continua legível", () => {
    const html = draw(`root = View([w])
w = WristFit(40, 16, "Casio 40 mm no seu pulso")`);
    expect(html).toContain("Casio 40 mm no seu pulso");
    expect(html).toContain("aparece completo na extensão");
  });

  it("perguntas só respondem na última resposta", () => {
    const code = `root = View([q])
q = PreferenceChips("Para que você vai usar?", "fone.uso", ["Treino", "Trabalho"])`;
    expect(draw(code)).not.toMatch(/<button[^>]* disabled=""[^>]*>Treino/);
    const closed = renderToStaticMarkup(<Program code={code} streaming={false} host={{ ...host, interactive: false }} />);
    expect(closed).toMatch(/<button[^>]* disabled=""[^>]*>Treino/);
  });

  it("só liga para HTTPS de loja e nunca para checkout", () => {
    expect(storeLink("https://produto.mercadolivre.com.br/MLB-1")).not.toBeNull();
    expect(storeLink("http://www.amazon.com.br/dp/1")).toBeNull();
    expect(storeLink("https://pagamento.mercadolivre.com.br/x")).toBeNull();
    expect(storeLink("https://amazon.com.br.example.com/dp/1")).toBeNull();
  });
});
