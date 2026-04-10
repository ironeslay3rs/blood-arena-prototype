import { describe, expect, it } from "vitest";
import { lastLiveExchangeReadout } from "./arenaLiveExchangeReadout";
import type { CombatLogEntry } from "./arenaTypes";

function line(message: string): CombatLogEntry {
  return { id: "x", atMs: 0, message };
}

describe("lastLiveExchangeReadout", () => {
  it("returns null for empty log", () => {
    expect(lastLiveExchangeReadout([])).toBeNull();
  });

  it("prefers latest damage line", () => {
    const log: CombatLogEntry[] = [
      line("A hit B for 3 HP (blocked)"),
      line("A hit B for 8 HP (clean)"),
    ];
    const r = lastLiveExchangeReadout(log);
    expect(r?.kind).toBe("clean");
  });

  it("detects whiff", () => {
    const r = lastLiveExchangeReadout([line("Z attacked — out of range.")]);
    expect(r?.kind).toBe("whiff");
  });

  it("detects climax line", () => {
    const r = lastLiveExchangeReadout([line("A unleashes Test Climax!")]);
    expect(r?.kind).toBe("climax");
  });

  it("skips KO lines when scanning", () => {
    const log: CombatLogEntry[] = [
      line("A hit B for 1 HP (clean)"),
      line("Player 2 is down. Player 1 wins."),
    ];
    expect(lastLiveExchangeReadout(log)?.kind).toBe("clean");
  });

  it("detects Climax then clean as climax_clean (BP-34)", () => {
    const log: CombatLogEntry[] = [
      line("X unleashes Primal Climax!"),
      line("X hit Y for 22 HP (clean)"),
    ];
    expect(lastLiveExchangeReadout(log)?.kind).toBe("climax_clean");
  });

  it("detects Climax then blocked as climax_blocked", () => {
    const log: CombatLogEntry[] = [
      line("X unleashes Primal Climax!"),
      line("X hit Y for 3 HP (blocked)"),
    ];
    expect(lastLiveExchangeReadout(log)?.kind).toBe("climax_blocked");
  });

  it("skips zero-width noise between unleash and damage", () => {
    const log: CombatLogEntry[] = [
      line("X unleashes Z!"),
      line("\u200b"),
      line("X hit Y for 1 HP (clean)"),
    ];
    expect(lastLiveExchangeReadout(log)?.kind).toBe("climax_clean");
  });
});
