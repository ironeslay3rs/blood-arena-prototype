import type { ArenaState } from "./arenaTypes";

/** Ironheart → extra max HP on the next match spawn (consumed when you reset). */
export const REINFORCE_IRONHEART_COST = 3;
export const REINFORCE_HP_BONUS = 10;

/** Credits → shave pending max-HP penalty (immediate). */
export const BRIBE_CREDITS_COST = 12;
export const BRIBE_PENALTY_REDUCTION = 10;

/** Blood chits → flat attack on next match spawn (consumed on reset). */
export const RITUAL_BLOOD_CHITS_COST = 4;
export const RITUAL_ATTACK_BONUS = 3;

/** Between rounds (winner set) or before first contact (both at full HP). */
export function canSpendArenaPrep(state: ArenaState): boolean {
  if (state.winner != null) return true;
  const [p, o] = state.fighters;
  return p.hp >= p.hpMax && o.hp >= o.hpMax;
}
