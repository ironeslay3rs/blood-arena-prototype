import { describe, expect, it } from "vitest";
import {
  growthLevelCombatBonusesLine,
  winsToNextLevelFromWins,
} from "./arenaGrowthReadout";

describe("arenaGrowthReadout", () => {
  it("winsToNextLevelFromWins matches levelFromWins tiers", () => {
    expect(winsToNextLevelFromWins(0)).toBe(3);
    expect(winsToNextLevelFromWins(2)).toBe(1);
    expect(winsToNextLevelFromWins(3)).toBe(3);
    expect(winsToNextLevelFromWins(5)).toBe(1);
    expect(winsToNextLevelFromWins(6)).toBe(3);
  });

  it("growthLevelCombatBonusesLine describes stat bumps", () => {
    expect(growthLevelCombatBonusesLine(1)).toContain("none yet");
    expect(growthLevelCombatBonusesLine(3)).toContain("+10 max HP");
  });
});
