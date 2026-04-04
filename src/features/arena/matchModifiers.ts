import type { FighterState, MatchModifierId } from "./arenaTypes";

export const MATCH_MODIFIER_CYCLE: readonly MatchModifierId[] = [
  "faster_cooldowns",
  "reduced_hp",
  "increased_damage",
  "unstable_resource",
] as const;

/** Cooldown decay multiplier vs frame time when this modifier is active. */
export const MATCH_FASTER_COOLDOWNS_MULT = 1.3;

/** Both fighters’ max HP scaled by this (current HP clamped). */
export const MATCH_REDUCED_HP_FACTOR = 0.82;

/** Outgoing combat damage multiplier (all strikes / ability hits). */
export const MATCH_INCREASED_DAMAGE_MULT = 1.22;

/** Resource regen and block drain scale by this, flipping on a fixed cadence. */
export const MATCH_UNSTABLE_RESOURCE_PERIOD_MS = 1700;
export const MATCH_UNSTABLE_RESOURCE_HIGH = 1.38;
export const MATCH_UNSTABLE_RESOURCE_LOW = 0.58;

export function matchModifierForOrdinal(ordinal: number): MatchModifierId {
  const i = ((ordinal % MATCH_MODIFIER_CYCLE.length) + MATCH_MODIFIER_CYCLE.length) %
    MATCH_MODIFIER_CYCLE.length;
  return MATCH_MODIFIER_CYCLE[i]!;
}

/** Phrase inserted after “The arena shifts: …”. */
export function matchModifierLogPhrase(id: MatchModifierId): string {
  switch (id) {
    case "faster_cooldowns":
      return "faster cooldowns";
    case "reduced_hp":
      return "reduced HP";
    case "increased_damage":
      return "increased damage";
    case "unstable_resource":
      return "unstable resource";
  }
}

export function matchModifierShiftLogLine(id: MatchModifierId): string {
  return `The arena shifts: ${matchModifierLogPhrase(id)}`;
}

/** Deterministic wobble for unstable resource (same for both fighters at a given nowMs). */
export function unstableResourceMultiplier(nowMs: number): number {
  const phase = Math.floor(nowMs / MATCH_UNSTABLE_RESOURCE_PERIOD_MS) & 1;
  return phase === 0
    ? MATCH_UNSTABLE_RESOURCE_HIGH
    : MATCH_UNSTABLE_RESOURCE_LOW;
}

export function applyReducedHpToFighters(
  a: FighterState,
  b: FighterState,
  factor: number,
): [FighterState, FighterState] {
  const scale = (f: FighterState): FighterState => {
    const newMax = Math.max(1, Math.round(f.hpMax * factor));
    return {
      ...f,
      hpMax: newMax,
      hp: Math.min(f.hp, newMax),
    };
  };
  return [scale(a), scale(b)];
}
