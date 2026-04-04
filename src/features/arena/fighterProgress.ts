import { FIGHTER_ORDER } from "./classData";
import type { FighterProgressMap } from "./arenaTypes";

export function levelFromWins(wins: number): number {
  return Math.floor(Math.max(0, wins) / 3) + 1;
}

/** Small combat bonuses applied when spawning a fighter at `level` (level 1 = no bonus). */
export function levelStatBonuses(level: number): { hp: number; atk: number } {
  const L = Math.max(1, Math.floor(level));
  return {
    hp: (L - 1) * 5,
    atk: Math.floor((L - 1) / 2),
  };
}

export function createDefaultFighterProgress(): FighterProgressMap {
  const m = {} as FighterProgressMap;
  for (const id of FIGHTER_ORDER) {
    m[id] = { wins: 0, losses: 0, level: 1 };
  }
  return m;
}

export function mergeLoadedProgress(raw: unknown): FighterProgressMap {
  const defaults = createDefaultFighterProgress();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const obj = raw as Record<string, unknown>;
  const out: FighterProgressMap = { ...defaults };
  for (const id of FIGHTER_ORDER) {
    const e = obj[id];
    if (!e || typeof e !== "object" || Array.isArray(e)) continue;
    const row = e as { wins?: unknown; losses?: unknown };
    const wins =
      typeof row.wins === "number" && Number.isFinite(row.wins)
        ? Math.max(0, Math.floor(row.wins))
        : 0;
    const losses =
      typeof row.losses === "number" && Number.isFinite(row.losses)
        ? Math.max(0, Math.floor(row.losses))
        : 0;
    out[id] = { wins, losses, level: levelFromWins(wins) };
  }
  return out;
}
