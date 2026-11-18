// "A pesquisa": the section of the home page where tone's research plays with the scroll.
// The server draws the final state, so this is what a person without script, or
// with reduced motion, reads.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Research } from "../src/landing/Research";

const html = renderToStaticMarkup(<Research />);

describe("a pesquisa na página principal", () => {
  it("keeps the three steps as a real list, with the section heading", () => {
    expect(html).toMatch(/<h2[^>]*id="como"/);
    const list = html.match(/<ol[\s\S]*?<\/ol>/)?.[0] ?? "";
    expect(list).toContain("Você conta.");
    expect(list).toContain("Ela pesquisa.");
    expect(list).toContain("Você decide.");
  });

  it("ends on the answer, with the counters at their totals", () => {
    expect(html).toContain("Eu começaria pela");
    expect(html).toContain("Cadeira Apoio Pro");
    expect(html).toContain("214");
    expect(html).toContain("11");
  });

  it("fills the screen with windows behind the steps, hidden from screen readers", () => {
    expect(html).toMatch(/data-desk[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-desk/);
    const windows = html.match(/<div[^>]*data-window="[a-z]+"[^>]*>/g) ?? [];
    expect(windows.length).toBeGreaterThanOrEqual(16);
  });

  it("has merged every picked window into the answer at the end", () => {
    const picked = html.match(/<div[^>]*data-window="picked"[^>]*>/g) ?? [];
    expect(picked.length).toBeGreaterThanOrEqual(4);
    for (const window of picked) expect(window).toMatch(/opacity:0[;"]/);
  });
});
