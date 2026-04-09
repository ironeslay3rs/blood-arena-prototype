import { describe, expect, it } from "vitest";
import {
  hotSeatP2ControlsSrNarration,
  roundStartReadabilityAnnouncement,
  roundStartReadabilityCue,
} from "./arenaReadabilityHints";
import { MATCH_MODIFIER_CYCLE } from "./matchModifiers";
import type { OpponentControllerKind } from "./arenaTypes";

const MODES: OpponentControllerKind[] = ["dummy", "local_human", "remote"];

describe("roundStartReadabilityCue", () => {
  it("covers every modifier × mode with substantive copy", () => {
    for (const modifier of MATCH_MODIFIER_CYCLE) {
      for (const opponentMode of MODES) {
        const c = roundStartReadabilityCue(modifier, opponentMode);
        expect(c.lead.length).toBeGreaterThan(6);
        expect(c.coachingLine.length).toBeGreaterThan(24);
        expect(c.contextLine.length).toBeGreaterThan(20);
      }
    }
  });

  it("announcement strings include round and rule", () => {
    const a = roundStartReadabilityAnnouncement({
      roundNumber: 2,
      modifier: "reduced_hp",
      opponentMode: "local_human",
      ruleLabel: "Reduced HP",
      modeLabel: "Local PvP",
      tempoLabel: "Tempo +1",
    });
    expect(a).toContain("Round 2");
    expect(a).toContain("Reduced HP");
    expect(a).toContain("Hot-seat");
    expect(a).toContain("Player 2");
    expect(a).toContain("Climax");
  });

  it("hot-seat exposes P2 parity line; other modes omit it", () => {
    const hot = roundStartReadabilityCue("faster_cooldowns", "local_human");
    expect(hot.p2ParityLine).toBeDefined();
    expect(hot.p2ParityLine!.length).toBeGreaterThan(48);
    expect(hot.p2ParityLine).toContain("M");

    const train = roundStartReadabilityCue("faster_cooldowns", "dummy");
    expect(train.p2ParityLine).toBeUndefined();
  });

  it("SR narration lists P2 bindings", () => {
    const n = hotSeatP2ControlsSrNarration();
    expect(n).toContain("M for Climax");
    expect(n).toContain("Numpad");
  });
});
