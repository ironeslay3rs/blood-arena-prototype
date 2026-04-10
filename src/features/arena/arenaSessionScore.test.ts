import { describe, expect, it } from "vitest";
import {
  ARENA_SESSION_FIRST_TO,
  formatSessionScoreLine,
  matchBannerSessionSetVictoryLine,
  p2SessionChipSummary,
  sessionDeciderLine,
  sessionMatchPointCopy,
  sessionMatchPointRole,
  sessionSetCompleteHeadline,
  sessionSetIsComplete,
  sessionSetWinnerRole,
} from "./arenaSessionScore";

describe("arenaSessionScore", () => {
  it("formats session line with default first-to", () => {
    expect(formatSessionScoreLine([2, 1])).toBe(
      `Session · first to ${ARENA_SESSION_FIRST_TO} · 2–1`,
    );
  });

  it("detects P1 match point at 2–0 in first-to-3", () => {
    expect(sessionMatchPointRole([2, 0], 3)).toBe("player");
  });

  it("detects P2 match point", () => {
    expect(sessionMatchPointRole([1, 2], 3)).toBe("opponent");
  });

  it("at 2–2 first-to-3, sudden-death copy — not exclusive match point", () => {
    expect(sessionMatchPointRole([2, 2], 3)).toBe(null);
    expect(sessionDeciderLine([2, 2], 3)).toBe("Next round decides the session.");
  });

  it("no match point after someone has won the session", () => {
    expect(sessionMatchPointRole([3, 1], 3)).toBe(null);
  });

  it("match point copy is screen-reader friendly", () => {
    expect(sessionMatchPointCopy("player")).toContain("Player 1");
    expect(sessionMatchPointCopy("opponent")).toContain("Player 2");
  });

  it("detects completed set (BP-42)", () => {
    expect(sessionSetIsComplete([2, 2], 3)).toBe(false);
    expect(sessionSetIsComplete([3, 1], 3)).toBe(true);
  });

  it("resolves set winner (BP-42)", () => {
    expect(sessionSetWinnerRole([3, 1], 3)).toBe("player");
    expect(sessionSetWinnerRole([1, 3], 3)).toBe("opponent");
  });

  it("formats set-complete headline", () => {
    expect(sessionSetCompleteHeadline("player", [3, 1], 3)).toBe(
      "Player 1 wins the set — 3–1 (first to 3)",
    );
  });

  it("match banner set line when round winner took the set (BP-43)", () => {
    expect(
      matchBannerSessionSetVictoryLine("player", [3, 1], 3),
    ).toBe("Player 1 wins the set — 3–1 (first to 3)");
  });

  it("no banner set line when exhibition round after set locked", () => {
    expect(matchBannerSessionSetVictoryLine("opponent", [3, 1], 3)).toBe(null);
  });

  it("P2 chip summary — base and match point (BP-44)", () => {
    expect(p2SessionChipSummary([1, 0], 3)).toBe("FT3 · 1–0");
    expect(p2SessionChipSummary([2, 2], 3)).toContain("next round decides");
    expect(p2SessionChipSummary([3, 1], 3)).toContain("set complete");
  });
});
