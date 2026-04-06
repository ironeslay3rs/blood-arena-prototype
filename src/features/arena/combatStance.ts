/**
 * Minimal “build” layer: one stance per fighter, no items or trees.
 * PvP-fair: same three options and tuning for every fighter.
 */
export type CombatStanceId = "aggressive" | "defensive" | "control";

export const DEFAULT_COMBAT_STANCE: CombatStanceId = "control";

/** Outgoing damage that reaches mitigation (strikes & damage abilities). */
export function stanceOutgoingDamageMult(s: CombatStanceId): number {
  return s === "aggressive" ? 1.04 : 1;
}

/** HP loss after shields — defensive only. */
export function stanceIncomingHpMult(s: CombatStanceId): number {
  return s === "defensive" ? 0.96 : 1;
}

/** Resource regen while not blocking. */
export function stanceResourceRegenMult(s: CombatStanceId): number {
  return s === "control" ? 1.1 : 1;
}

export const STANCE_ORDER: readonly CombatStanceId[] = [
  "aggressive",
  "defensive",
  "control",
] as const;

export const STANCE_UI: Record<
  CombatStanceId,
  { label: string; shortHint: string }
> = {
  aggressive: { label: "Aggressive", shortHint: "+4% damage" },
  defensive: { label: "Defensive", shortHint: "−4% HP taken" },
  control: { label: "Control", shortHint: "+10% resource regen" },
};
