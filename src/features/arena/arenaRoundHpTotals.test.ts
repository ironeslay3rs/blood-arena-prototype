import { describe, expect, it } from "vitest";
import {
  roundHpExchangeSrAnnouncement,
  roundHpExchangeTotals,
} from "./arenaRoundHpTotals";

describe("roundHpExchangeTotals", () => {
  it("mirrors P1 dealt/taken to P2 for 1v1 exchange", () => {
    const t = roundHpExchangeTotals({
      matchPlayerDamageDealt: 100,
      matchPlayerDamageTaken: 77,
    });
    expect(t.p1Dealt).toBe(100);
    expect(t.p1Taken).toBe(77);
    expect(t.p2Dealt).toBe(77);
    expect(t.p2Taken).toBe(100);
  });

  it("SR line includes all four numbers", () => {
    const s = roundHpExchangeSrAnnouncement(
      roundHpExchangeTotals({
        matchPlayerDamageDealt: 12,
        matchPlayerDamageTaken: 34,
      }),
    );
    expect(s).toContain("12");
    expect(s).toContain("34");
    expect(s).toContain("Player 1");
    expect(s).toContain("Player 2");
  });
});
