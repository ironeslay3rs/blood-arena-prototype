import type { ArenaResources } from "@/features/arena/arenaTypes";
import {
  CANON_CHARACTER_DEFINITIONS,
  type CanonCharacterId,
} from "@/features/shared/canonCharacters";
import { trialBonusesFromArenaResources } from "./trialArenaBonuses";
import type { Subject, TrialState } from "./types";

/**
 * Stable trial roster order (all saga identities; same roster every run).
 * Base HP/attack cycle repeats the three original prototype templates so
 * per-slot arena bonus math is unchanged.
 */
const TRIAL_CANON_ORDER: CanonCharacterId[] = [
  "splice",
  "patch",
  "null",
  "grave",
  "raze",
  "aurel",
  "ilyra",
  "korin",
  "cael",
  "vex",
  "briggs",
  "sable",
];

/** Original `BASE_SUBJECTS` stat lines, cycled across the full canon roster. */
const BASE_STAT_CYCLE: readonly { baseHp: number; baseAttack: number }[] = [
  { baseHp: 12, baseAttack: 2 },
  { baseHp: 10, baseAttack: 3 },
  { baseHp: 11, baseAttack: 2 },
];

const TRIAL_OPENING_LOG =
  "The Black Market does not test bodies. It tests people.";

const SPOILS_LOG = "Arena spoils empower your trial.";

export function createTrialFromArena(resources: ArenaResources): TrialState {
  const bonuses = trialBonusesFromArenaResources(resources);
  const subjects: Subject[] = TRIAL_CANON_ORDER.map((canonId, i) => {
    const def = CANON_CHARACTER_DEFINITIONS[canonId];
    const { baseHp, baseAttack } = BASE_STAT_CYCLE[i % BASE_STAT_CYCLE.length]!;
    const maxHp = baseHp + bonuses.subjectHpBonus;
    const attack = baseAttack + bonuses.subjectAttackBonus;
    return {
      id: def.id,
      name: def.name,
      flavorLine: def.combatIdentity,
      maxHp,
      hp: maxHp,
      attack,
    };
  });

  return {
    subjects,
    bonuses,
    resourcesSnapshot: { ...resources },
    log: [
      { id: "trial-opening", message: TRIAL_OPENING_LOG },
      { id: "arena-spoils", message: SPOILS_LOG },
    ],
  };
}
