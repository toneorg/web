// The smaller scroll moments of the public pages. The server draws their final
// state: that is what a person without script, or with reduced motion, sees.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Converge } from "../src/landing/Converge";
import { ExampleTabs } from "../src/landing/ExampleTabs";
import { GeneralAnswer } from "../src/landing/GeneralAnswer";
import { QuestionReport } from "../src/landing/QuestionReport";
import { TabPile } from "../src/landing/TabPile";

describe("movimentos menores com a rolagem", () => {
  it("the tab pile ends with every tab shown and the full count", () => {
    const html = renderToStaticMarkup(<TabPile />);
    expect(html).toContain("30 abas abertas");
    const tabs = html.match(/<span[^>]*data-tab[^>]*>/g) ?? [];
    expect(tabs).toHaveLength(16);
    for (const tab of tabs) expect(tab).not.toMatch(/opacity:0[;"]/);
  });

  it("the general chat ends with its eight options", () => {
    const html = renderToStaticMarkup(<GeneralAnswer />);
    expect(html).toContain("8 opções");
    for (const name of ["Fritadeira Turbo 4L", "Duo 7L", "Crocante Digital 5L", "Mini Chef 3L"]) expect(html).toContain(name);
  });

  it("the converging lines are drawn whole and hidden from screen readers", () => {
    const html = renderToStaticMarkup(<Converge />);
    expect(html).toContain('aria-hidden="true"');
    expect(html.match(/<path[^>]*pathLength="1"/g)).toHaveLength(9);
  });

  it("the store report lists every question it is given, with its bar", () => {
    const questions = [
      { q: "Fico entre M e G, qual escolho?", n: 54, gap: "9 produtos sem tabela de medidas" },
      { q: "Tem fragrância?", n: 27, gap: "A informação falta" },
    ];
    const html = renderToStaticMarkup(<QuestionReport questions={questions} />);
    expect(html).toContain("Fico entre M e G, qual escolho?");
    expect(html).toContain("27 pessoas");
    expect(html).toContain("width:50%");
  });

  it("the examples include a piece of clothing", () => {
    expect(renderToStaticMarkup(<ExampleTabs />)).toContain("Jaqueta");
  });
});
