import { describe, expect, it } from "vitest";
import { lastBoutLedgerLine } from "./arenaGrowthLedgerReadout";
import type { LastBoutLedger } from "./arenaTypes";
import {
  DEFAULT_ARENA_RESOURCES,
  formatResourceDeltaBetween,
  mergeArenaResources,
} from "./arenaResources";

describe("arenaGrowthLedgerReadout", () => {
  it("lastBoutLedgerLine includes streak on win", () => {
    const ledger: LastBoutLedger = {
      result: "win",
      resourceLine: "+15 credits · +2 ironheart",
    };
    expect(lastBoutLedgerLine(ledger, 3)).toContain("streak 3");
  });

  it("formatResourceDeltaBetween lists non-zero keys", () => {
    const before = mergeArenaResources(DEFAULT_ARENA_RESOURCES);
    const after = mergeArenaResources({ ...before, credits: before.credits + 10 });
    expect(formatResourceDeltaBetween(before, after)).toContain("+10 credits");
  });
});
