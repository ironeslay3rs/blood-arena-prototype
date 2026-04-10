import { describe, expect, it } from "vitest";
import { activeComboDepthSummary } from "./comboDepthReadout";

describe("activeComboDepthSummary", () => {
  it("hides when both sides below 1", () => {
    expect(activeComboDepthSummary(0, 0).visible).toBe(false);
  });

  it("shows when either side has depth", () => {
    const a = activeComboDepthSummary(2, 0);
    expect(a.visible).toBe(true);
    expect(a.displayLine).toContain("×2");
    expect(a.displayLine).toContain("×0");
    expect(a.srLine).toContain("Player 1 2");
  });

  it("shows both nonzero", () => {
    const b = activeComboDepthSummary(1, 3);
    expect(b.displayLine).toContain("P1 ×1");
    expect(b.displayLine).toContain("P2 ×3");
  });
});
