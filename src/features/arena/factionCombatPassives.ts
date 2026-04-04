import type { FighterState } from "./arenaTypes";

/** Bio — passive HP trickle (per second). */
export const BIO_HP_REGEN_PER_SEC = 0.48;

/** Bio — flat damage while fury window is active. */
export const BIO_FURY_FLAT_DAMAGE = 5;
export const BIO_FURY_DURATION_MS = 2600;

/** Mecha — cooldown recovery multiplier when resource is above this fraction. */
export const MECHA_HIGH_RESOURCE_RATIO = 0.66;
export const MECHA_COOLDOWN_RECOVERY_MULT = 1.2;

/** Mecha — micro-shield pulse interval (ms). */
export const MECHA_ION_INTERVAL_MS = 4000;
export const MECHA_ION_SHIELD = 7;

/** Pure — small mend after any ability. */
export const PURE_ABILITY_HEAL = 5;
/** Pure — damage taken multiplier at or below this HP fraction. */
export const PURE_LOW_HP_RATIO = 0.36;
export const PURE_LOW_HP_DAMAGE_MULT = 0.87;

/** Black City — deterministic on-hit cycle length. */
export const BLACK_CITY_ONHIT_SHIELD = 6;
export const BLACK_CITY_ONHIT_BUFF = 5;
export const BLACK_CITY_ONHIT_RESOURCE = 12;

/** Black City — every Nth ability causes recoil. */
export const BLACK_CITY_RECOIL_EVERY = 2;
export const BLACK_CITY_RECOIL_DAMAGE = 4;

/** Min gap between “The soul responds” lines (ms). */
export const PURE_SOUL_LOG_COOLDOWN_MS = 6500;

export function bioFuryDamageBonus(fighter: FighterState, nowMs: number): number {
  if (fighter.fighterDefinition.faction !== "Bio") return 0;
  if (nowMs >= fighter.bioFuryUntilMs) return 0;
  return BIO_FURY_FLAT_DAMAGE;
}
