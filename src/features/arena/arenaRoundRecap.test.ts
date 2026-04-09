import { describe, expect, it } from "vitest";
import { roundResolveReadability } from "./arenaRoundRecap";
import type {
  CombatLogEntry,
  FighterRole,
  FighterState,
} from "./arenaTypes";

function f(label: string, role: FighterRole): FighterState {
  return { label, role } as FighterState;
}

function entry(message: string): CombatLogEntry {
  return { id: "t", atMs: 0, message };
}

describe("roundResolveReadability", () => {
  it("detects clean finisher when last damage to loser was clean", () => {
    const fighters: [FighterState, FighterState] = [
      f("Alpha", "player"),
      f("Beta", "opponent"),
    ];
    const log: CombatLogEntry[] = [
      entry("Alpha hit Beta for 12 HP (clean)"),
      entry("Player 2 is down. Player 1 wins."),
    ];
    const r = roundResolveReadability("player", fighters, log);
    expect(r.kind).toBe("clean_finisher");
    expect(r.causeLine).toContain("clean");
    expect(r.srAnnouncement).toContain("clean");
  });

  it("detects blocked chip when last damage to loser was blocked", () => {
    const fighters: [FighterState, FighterState] = [
      f("Alpha", "player"),
      f("Beta", "opponent"),
    ];
    const log: CombatLogEntry[] = [
      entry("Alpha struck with Burst Beta for 3 HP (blocked)"),
      entry("Player 2 is down. Player 1 wins."),
    ];
    const r = roundResolveReadability("player", fighters, log);
    expect(r.kind).toBe("blocked_chip");
    expect(r.causeLine).toContain("guard");
  });

  it("prioritizes climax in the final window over older hit lines", () => {
    const fighters: [FighterState, FighterState] = [
      f("Alpha", "player"),
      f("Beta", "opponent"),
    ];
    const log: CombatLogEntry[] = [
      entry("Alpha hit Beta for 2 HP (blocked)"),
      entry("Alpha unleashes Test Climax!"),
      entry("Alpha hit Beta for 40 HP (clean)"),
      entry("Player 2 is down. Player 1 wins."),
    ];
    const r = roundResolveReadability("player", fighters, log);
    expect(r.kind).toBe("climax");
    expect(r.causeLine).toContain("Climax");
  });

  it("uses training KO line", () => {
    const fighters: [FighterState, FighterState] = [
      f("Alpha", "player"),
      f("Beta", "opponent"),
    ];
    const log: CombatLogEntry[] = [
      entry("Beta hit Alpha for 1 HP (clean)"),
      entry("Player 1 is down. Defeat."),
    ];
    const r = roundResolveReadability("opponent", fighters, log);
    expect(r.kind).toBe("clean_finisher");
  });

  it("returns unknown when KO line is missing", () => {
    const fighters: [FighterState, FighterState] = [
      f("Alpha", "player"),
      f("Beta", "opponent"),
    ];
    const log: CombatLogEntry[] = [entry("Alpha hit Beta for 5 HP (clean)")];
    const r = roundResolveReadability("player", fighters, log);
    expect(r.kind).toBe("unknown");
  });
});
