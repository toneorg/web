// The small line of a panel card: the lowest price per day, nothing to read but the shape.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Sparkline } from "../src/conversas/Sparkline";

const day = (n: number, amount: number) => ({ day: `2026-11-${String(n).padStart(2, "0")}`, amount, store: null });

describe("mini gráfico do card", () => {
  it("sparkline draws nothing below two points", () => {
    expect(renderToStaticMarkup(<Sparkline points={[]} />)).toBe("");
    expect(renderToStaticMarkup(<Sparkline points={[day(1, 100)]} />)).toBe("");
  });

  it("sparkline path spans the width", () => {
    const html = renderToStaticMarkup(<Sparkline points={[day(1, 100), day(2, 90), day(3, 95)]} />);
    expect(html).toContain('aria-hidden="true"');
    const path = html.match(/ d="([^"]+)"/)?.[1] ?? "";
    expect(path.startsWith("M0.0,")).toBe(true);
    expect(path).toContain("L100.0,");
  });
});
