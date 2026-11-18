// The scroll progress of the public pages: how far a section has gone, as a number from 0 to 1.
import { describe, expect, it } from "vitest";
import { countUp, measure, phaseAt, span } from "../src/landing/scroll";

describe("progresso da rolagem", () => {
  it("span maps the progress inside a stretch, held at both ends", () => {
    expect(span(0.4, 0.2, 0.6)).toBeCloseTo(0.5);
    expect(span(0.1, 0.2, 0.6)).toBe(0);
    expect(span(0.9, 0.2, 0.6)).toBe(1);
    expect(span(0.5, 0.5, 0.5)).toBe(1);
  });

  it("countUp rolls a number to its target", () => {
    expect(countUp(0.4, 0.2, 0.6, 214)).toBe(107);
    expect(countUp(0, 0.2, 0.6, 214)).toBe(0);
    expect(countUp(1, 0.2, 0.6, 214)).toBe(214);
  });

  it("phaseAt counts the cuts already passed", () => {
    const cuts = [0.2, 0.6, 0.85];
    expect(phaseAt(0.1, cuts)).toBe(0);
    expect(phaseAt(0.2, cuts)).toBe(1);
    expect(phaseAt(0.7, cuts)).toBe(2);
    expect(phaseAt(1, cuts)).toBe(3);
  });

  it("a pinned section goes from its top at the top of the screen to its bottom at the bottom", () => {
    expect(measure("pin", 0, 3000, 1000)).toBe(0);
    expect(measure("pin", 500, 3000, 1000)).toBe(0);
    expect(measure("pin", -1000, 3000, 1000)).toBeCloseTo(0.5);
    expect(measure("pin", -2000, 3000, 1000)).toBe(1);
    expect(measure("pin", -2600, 3000, 1000)).toBe(1);
    // A section no taller than the screen has nothing to scroll through: it is done.
    expect(measure("pin", 0, 800, 1000)).toBe(1);
  });

  it("a block in view goes from entering at the bottom to leaving at the top", () => {
    expect(measure("view", 1000, 500, 1000)).toBe(0);
    expect(measure("view", 250, 500, 1000)).toBeCloseTo(0.5);
    expect(measure("view", -500, 500, 1000)).toBe(1);
  });
});
