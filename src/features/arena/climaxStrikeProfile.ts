import type { Faction, FighterClimaxOverride } from "./arenaTypes";

export interface ClimaxStrikeProfile {
  damageMult: number;
  flatBonus: number;
  /** Log fragment after “unleashes …” (must end with “Climax” for juice parsers). */
  logName: string;
}

/** Faction-tuned super melee — readable spread without per-card data yet. */
export const CLIMAX_STRIKE_BY_FACTION: Record<Faction, ClimaxStrikeProfile> = {
  Bio: { damageMult: 2.35, flatBonus: 5, logName: "Primal Climax" },
  Pure: { damageMult: 2.05, flatBonus: 9, logName: "Sanctified Climax" },
  Mecha: { damageMult: 2.12, flatBonus: 7, logName: "Overdrive Climax" },
  "Black City": { damageMult: 2.28, flatBonus: 5, logName: "Blackout Climax" },
};

export function climaxStrikeDamage(
  faction: Faction,
  baseAttack: number,
  bioBonus: number,
): number {
  const p = CLIMAX_STRIKE_BY_FACTION[faction];
  return Math.round(baseAttack * p.damageMult + p.flatBonus + bioBonus);
}

export function climaxStrikeLogFragment(faction: Faction): string {
  return CLIMAX_STRIKE_BY_FACTION[faction].logName;
}

export function resolveClimaxStrikeDamage(
  faction: Faction,
  override: FighterClimaxOverride | undefined,
  baseAttack: number,
  bioBonus: number,
): number {
  if (override) {
    return Math.round(baseAttack * override.damageMult + override.flatBonus + bioBonus);
  }
  return climaxStrikeDamage(faction, baseAttack, bioBonus);
}

export function resolveClimaxStrikeLogFragment(
  faction: Faction,
  override: FighterClimaxOverride | undefined,
): string {
  return override?.logName ?? climaxStrikeLogFragment(faction);
}
