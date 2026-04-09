import { describe, expect, it } from "vitest";
import { parseClimaxUnleashLine } from "./combatLogParse";

describe("parseClimaxUnleashLine", () => {
  it("parses unleash lines", () => {
    expect(
      parseClimaxUnleashLine("Player 1 unleashes Rending Climax!"),
    ).toEqual({
      attackerLabel: "Player 1",
      climaxName: "Rending Climax",
    });
  });

  it("returns null for non-climax lines", () => {
    expect(parseClimaxUnleashLine("Player 1 attacked.")).toBeNull();
  });
});
