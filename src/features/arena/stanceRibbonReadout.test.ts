import { describe, expect, it } from "vitest";
import { stanceRibbonCopy } from "./stanceRibbonReadout";

describe("stanceRibbonCopy", () => {
  it("includes labels and SR hints", () => {
    const c = stanceRibbonCopy("aggressive", "defensive");
    expect(c.displayLine).toContain("Aggressive");
    expect(c.displayLine).toContain("Defensive");
    expect(c.srLine).toContain("Player 1");
    expect(c.srLine).toContain("Player 2");
  });
});
