/**
 * Legible copy for the persistent upgrade loop (stream F) — BP-45.
 */

import { levelFromWins, levelStatBonuses } from "./fighterProgress";

/** Wins still needed before the next level tier (3 wins per step from level 1 baseline). */
export function winsToNextLevelFromWins(wins: number): number {
  return Math.max(0, 3 * levelFromWins(wins) - wins);
}

export function growthLevelCombatBonusesLine(level: number): string {
  const { hp, atk } = levelStatBonuses(level);
  if (hp <= 0 && atk <= 0) {
    return "Level combat bonuses: none yet (win rounds to level up).";
  }
  const parts: string[] = [];
  if (hp > 0) parts.push(`+${hp} max HP from level`);
  if (atk > 0) parts.push(`+${atk} base attack from level`);
  return `Level combat bonuses: ${parts.join(" · ")}.`;
}
