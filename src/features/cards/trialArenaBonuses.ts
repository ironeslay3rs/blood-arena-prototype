import type { ArenaResources } from "@/features/arena/arenaTypes";
import type { TrialArenaBonuses } from "./types";

/**
 * Small additive bonuses only — tuned so typical Arena totals don’t dominate.
 * ironheart → Subject HP, bloodChits → attack + draw gate, lumens → sustain regen.
 */
export function trialBonusesFromArenaResources(
  r: ArenaResources,
): TrialArenaBonuses {
  return {
    subjectHpBonus: Math.min(3, Math.floor(r.ironheart / 6)),
    subjectAttackBonus: Math.min(2, Math.floor(r.bloodChits / 12)),
    openingDrawBonus: r.bloodChits >= 20 ? 1 : 0,
    sustainRegenBonus: Math.min(2, Math.floor(r.lumens / 10)),
  };
}
