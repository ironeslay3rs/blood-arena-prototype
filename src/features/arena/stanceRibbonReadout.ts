import type { CombatStanceId } from "./combatStance";
import { STANCE_UI } from "./combatStance";

/**
 * Compact copy for the glanceable stance ribbon (BP-36) — §15.2 Clarity (stance).
 */
export function stanceRibbonCopy(p1: CombatStanceId, p2: CombatStanceId): {
  displayLine: string;
  srLine: string;
} {
  const a = STANCE_UI[p1];
  const b = STANCE_UI[p2];
  return {
    displayLine: `P1 ${a.label} · P2 ${b.label}`,
    srLine: `Combat stances: Player 1 ${a.label}, ${a.shortHint}. Player 2 ${b.label}, ${b.shortHint}.`,
  };
}
