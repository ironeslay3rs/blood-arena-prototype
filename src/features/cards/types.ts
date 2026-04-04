import type { ArenaResources } from "@/features/arena/arenaTypes";

/** Rune Trials combat row (minimal prototype). */
export interface Subject {
  /** Canon saga id (stable key). */
  id: string;
  /** Display name from canon character definitions. */
  name: string;
  /** Short line for UI (canon `combatIdentity`). */
  flavorLine: string;
  hp: number;
  maxHp: number;
  attack: number;
}

export interface TrialLogEntry {
  id: string;
  message: string;
}

/** Additive modifiers derived from Arena `ArenaResources` (kept small). */
export interface TrialArenaBonuses {
  /** Added to each Subject max HP / current HP at trial start. */
  subjectHpBonus: number;
  /** Added to each Subject attack. */
  subjectAttackBonus: number;
  /** Extra cards drawn at opening (0 or 1). */
  openingDrawBonus: number;
  /** Flat heal applied to each Subject at end of a trial round (placeholder hook). */
  sustainRegenBonus: number;
}

export interface TrialState {
  subjects: Subject[];
  bonuses: TrialArenaBonuses;
  /** Copy at trial start (display only; not written back). */
  resourcesSnapshot: ArenaResources;
  log: TrialLogEntry[];
}
