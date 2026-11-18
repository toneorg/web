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
    expect(html).toContain("Cadeira Apoio Pro");
    expect(html).toContain("214");
    expect(html).toContain("11");
  });

  it("hides the stage from screen readers and shows no discarded card at the end", () => {
    expect(html).toMatch(/data-stage[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-stage/);
    const discarded = html.match(/<div[^>]*data-card="discard"[^>]*>/g) ?? [];
    expect(discarded.length).toBeGreaterThanOrEqual(8);
    for (const card of discarded) expect(card).toMatch(/opacity:0[;"]/);
  });
});
