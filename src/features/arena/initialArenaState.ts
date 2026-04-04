import type {
  ArenaResources,
  ArenaState,
  ClassId,
  FighterId,
  FighterProgressMap,
  FighterProfile,
  FighterState,
  MatchResult,
  ResourceFocusId,
} from "./arenaTypes";
import {
  CLASS_DEFAULT_FIGHTER,
  DEFAULT_ENEMY_FIGHTER_ID,
  DEFAULT_PLAYER_FIGHTER_ID,
  FIGHTER_DEFINITIONS,
} from "./classData";
import { createDefaultFighterProgress, levelStatBonuses } from "./fighterProgress";
import { mergeArenaResources } from "./arenaResources";
import { makeFighterFromDefinition } from "./arenaUtils";
import {
  applyReducedHpToFighters,
  matchModifierForOrdinal,
  matchModifierShiftLogLine,
  MATCH_REDUCED_HP_FACTOR,
} from "./matchModifiers";

export type ArenaProgressCarry = {
  /** @deprecated use `resources.credits` */
  credits?: number;
  resources?: ArenaResources;
  pendingHpPenalty?: number;
  lastMatchResult?: MatchResult | null;
  fighterProgress?: FighterProgressMap;
  /** Applied on this spawn, then zeroed in returned state. */
  nextMatchHpBonus?: number;
  nextMatchAttackBonus?: number;
  resourceFocus?: ResourceFocusId | null;
  /** Previous match index; next match becomes `this + 1`. */
  matchOrdinal?: number;
  winStreak?: number;
  fighterProfiles?: Record<string, FighterProfile>;
};

function playerMaxWithPenalty(cardMax: number, pendingPenalty: number): number {
  if (pendingPenalty <= 0) return cardMax;
  const floor = Math.ceil(cardMax * 0.35);
  return Math.max(floor, cardMax - pendingPenalty);
}

export function createInitialArenaState(
  playerFighterId: FighterId = DEFAULT_PLAYER_FIGHTER_ID,
  enemyFighterId: FighterId = DEFAULT_ENEMY_FIGHTER_ID,
  carry?: ArenaProgressCarry,
): ArenaState {
  const playerFighter = FIGHTER_DEFINITIONS[playerFighterId];
  const enemyFighter = FIGHTER_DEFINITIONS[enemyFighterId];

  const pending = carry?.pendingHpPenalty ?? 0;
  const lastMatchResult = carry?.lastMatchResult ?? null;
  const fighterProgress =
    carry?.fighterProgress ?? createDefaultFighterProgress();
  let resources = mergeArenaResources(carry?.resources);
  if (carry?.credits != null && carry.resources == null) {
    resources = { ...resources, credits: carry.credits };
  }

  const playerLevel = fighterProgress[playerFighterId].level;
  const { hp: progHpBonus } = levelStatBonuses(playerLevel);
  const hpPrep = carry?.nextMatchHpBonus ?? 0;
  const atkPrep = carry?.nextMatchAttackBonus ?? 0;
  const playerMax = playerMaxWithPenalty(
    playerFighter.maxHealth + progHpBonus + hpPrep,
    pending,
  );

  const player = makeFighterFromDefinition("player", playerFighter, {
    x: 22,
    label: "You",
    isDummy: false,
    hpMaxOverride: playerMax,
    progressionLevel: playerLevel,
    flatAttackBonus: atkPrep,
  });
  const enemy = makeFighterFromDefinition("opponent", enemyFighter, {
    x: 78,
    label: "Training Dummy",
    isDummy: true,
  });

  const matchOrdinal = (carry?.matchOrdinal ?? -1) + 1;
  const matchModifier = matchModifierForOrdinal(matchOrdinal);

  let fighters: [FighterState, FighterState] = [player, enemy];
  if (matchModifier === "reduced_hp") {
    fighters = applyReducedHpToFighters(
      fighters[0],
      fighters[1],
      MATCH_REDUCED_HP_FACTOR,
    );
  }

  return {
    fighters,
    playerFighter,
    enemyFighter,
    log: [
      {
        id: "welcome",
        atMs: 0,
        message: "Blood Arena — move, dash, strike, and block the dummy.",
      },
      {
        id: "match-modifier",
        atMs: 0,
        message: `${matchModifierShiftLogLine(matchModifier)}.`,
      },
    ],
    winner: null,
    nowMs: 0,
    resources,
    lastMatchResult,
    /** Carried until a win clears it; applied to spawn max HP above. */
    pendingHpPenalty: pending,
    fighterProgress,
    nextMatchHpBonus: 0,
    nextMatchAttackBonus: 0,
    resourceFocus: carry?.resourceFocus ?? null,
    matchOrdinal,
    matchModifier,
    winStreak: carry?.winStreak ?? 0,
    fighterProfiles: carry?.fighterProfiles
      ? { ...carry.fighterProfiles }
      : {},
    matchPlayerDamageDealt: 0,
    matchPlayerDamageTaken: 0,
  };
}

/** Legacy class picker → swap player’s BMRT fighter, keep progress. */
export function resetArenaWithPlayerClass(
  state: ArenaState,
  classId: ClassId,
): ArenaState {
  return createInitialArenaState(
    CLASS_DEFAULT_FIGHTER[classId],
    state.enemyFighter.id,
    {
      resources: state.resources,
      pendingHpPenalty: state.pendingHpPenalty,
      lastMatchResult: null,
      fighterProgress: state.fighterProgress,
      nextMatchHpBonus: state.nextMatchHpBonus,
      nextMatchAttackBonus: state.nextMatchAttackBonus,
      resourceFocus: state.resourceFocus,
      matchOrdinal: state.matchOrdinal,
      winStreak: state.winStreak,
      fighterProfiles: state.fighterProfiles,
    },
  );
}

/** New round, same roster: keep credits; apply any pending HP penalty then clear it. */
export function rematchKeepingRoster(state: ArenaState): ArenaState {
  return createInitialArenaState(state.playerFighter.id, state.enemyFighter.id, {
    resources: state.resources,
    pendingHpPenalty: state.pendingHpPenalty,
    lastMatchResult: null,
    fighterProgress: state.fighterProgress,
    nextMatchHpBonus: state.nextMatchHpBonus,
    nextMatchAttackBonus: state.nextMatchAttackBonus,
    resourceFocus: state.resourceFocus,
    matchOrdinal: state.matchOrdinal,
    winStreak: state.winStreak,
    fighterProfiles: state.fighterProfiles,
  });
}
