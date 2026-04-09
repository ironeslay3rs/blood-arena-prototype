/**
 * Combo / cancel tuning (M2 expression slice).
 * Chains are **read** from the combat log + arena clock; cancel window is **sim**-backed on fighters.
 */
/** Max ms between two clean hits by the same attacker to continue a chain. */
export const COMBO_CHAIN_GAP_MS = 2400;

/** After a clean HP connect, attacker may “link” into dash/skills (UI hint duration). */
export const COMBO_CANCEL_LINK_MS = 420;

/**
 * Sim-side combo scaling: each prior clean hit in the current gap adds this fraction to outgoing HP damage.
 * Depth is advanced only on clean connects; blocked hits and whiffs reset the attacker chain.
 */
export const COMBO_OUTGOING_DAMAGE_BONUS_PER_DEPTH = 0.055;

/** Max depth steps that add damage (further hits stay at this cap). */
export const COMBO_DAMAGE_BONUS_MAX_STEPS = 4;

export function comboOutgoingDamageMultiplier(chainDepth: number): number {
  const steps = Math.min(
    COMBO_DAMAGE_BONUS_MAX_STEPS,
    Math.max(0, Math.floor(chainDepth)),
  );
  return 1 + steps * COMBO_OUTGOING_DAMAGE_BONUS_PER_DEPTH;
}
