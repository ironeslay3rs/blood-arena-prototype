import type {
  ArenaResources,
  ArenaState,
  ClassId,
  CombatLogEntry,
  FighterId,
  FighterProgressMap,
  FighterProfile,
  FighterState,
  LastBoutLedger,
  MatchResult,
  OpponentControllerKind,
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
import {
  DEFAULT_COMBAT_STANCE,
  type CombatStanceId,
} from "./combatStance";
import { matchIntroReputationLines } from "./fighterReputation";

export type ArenaProgressCarry = {
  /** @deprecated use `resources.credits` */
  credits?: number;
  resources?: ArenaResources;
  pendingHpPenalty?: number;
  lastMatchResult?: MatchResult | null;
  lastBoutLedger?: LastBoutLedger | null;
  fighterProgress?: FighterProgressMap;
  /** Applied on this spawn, then zeroed in returned state. */
  nextMatchHpBonus?: number;
  nextMatchAttackBonus?: number;
  resourceFocus?: ResourceFocusId | null;
  /** Previous match index; next match becomes `this + 1`. */
  matchOrdinal?: number;
  winStreak?: number;
  fighterProfiles?: Record<string, FighterProfile>;
  combatTempo?: number;
  opponentController?: OpponentControllerKind;
  /** Per-fighter stance; rematch preserves; roster change resets in reducer. */
  combatStances?: [CombatStanceId, CombatStanceId];
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
  const lastBoutLedger = carry?.lastBoutLedger ?? null;
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

  const opponentController: OpponentControllerKind =
    carry?.opponentController ?? "local_human";
  const opponentIsTrainingDummy = opponentController === "dummy";

  const stance0 = carry?.combatStances?.[0] ?? DEFAULT_COMBAT_STANCE;
  const stance1 = carry?.combatStances?.[1] ?? DEFAULT_COMBAT_STANCE;

  const player = makeFighterFromDefinition("player", playerFighter, {
    x: 22,
    label: "Player 1",
    isDummy: false,
    hpMaxOverride: playerMax,
    progressionLevel: playerLevel,
    flatAttackBonus: atkPrep,
    combatStance: stance0,
  });
  const enemy = makeFighterFromDefinition("opponent", enemyFighter, {
    x: 78,
    label: opponentIsTrainingDummy ? "Training (AI)" : "Player 2",
    isDummy: opponentIsTrainingDummy,
    combatStance: stance1,
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

  const baseLog: CombatLogEntry[] = [
    {
      id: "welcome",
      atMs: 0,
      message:
        opponentController === "dummy"
          ? "Training mode — Player 1 vs AI. Same combat rules; the bot auto-presses and uses abilities."
          : opponentController === "local_human"
            ? "Blood Arena — Player 1 vs Player 2 (local hot-seat). Same combat systems for both. P2: U attack, O dash, J/L move, I block, [ ]."
            : "Blood Arena — Player 1 vs Player 2 (online slot reserved; offline stub).",
    },
    {
      id: "match-modifier",
      atMs: 0,
      message: `${matchModifierShiftLogLine(matchModifier)}.`,
    },
  ];

  const draft: ArenaState = {
    fighters,
    playerFighter,
    enemyFighter,
    log: baseLog,
    winner: null,
    nowMs: 0,
    resources,
    lastMatchResult,
    lastBoutLedger,
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
    combatTempo: carry?.combatTempo ?? 0,
    tempoLogSilenceBioUntilMs: 0,
    tempoLogSilencePureHealUntilMs: 0,
    tempoLogSilenceMechaControlUntilMs: 0,
    tempoNarrativeSilenceUntilMs: 0,
    opponentController,
    logSeq: 0,
  };

  const repIntro = matchIntroReputationLines(draft).map((message, i) => ({
    id: `rep-intro-${i}`,
    atMs: 0,
    message,
    kind: "reputation" as const,
  }));

  const bootLog = [...draft.log, ...repIntro];
  return {
    ...draft,
    log: bootLog,
    logSeq: bootLog.length,
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
      lastBoutLedger: null,
      fighterProgress: state.fighterProgress,
      nextMatchHpBonus: state.nextMatchHpBonus,
      nextMatchAttackBonus: state.nextMatchAttackBonus,
      resourceFocus: state.resourceFocus,
      matchOrdinal: state.matchOrdinal,
      winStreak: state.winStreak,
      fighterProfiles: state.fighterProfiles,
      combatTempo: state.combatTempo,
      opponentController: state.opponentController,
      combatStances: [
        state.fighters[0].combatStance,
        state.fighters[1].combatStance,
      ],
    },
  );
}

/** New round, same roster: keep credits; apply any pending HP penalty then clear it. */
export function rematchKeepingRoster(state: ArenaState): ArenaState {
  return createInitialArenaState(state.playerFighter.id, state.enemyFighter.id, {
    resources: state.resources,
    pendingHpPenalty: state.pendingHpPenalty,
    lastMatchResult: null,
    lastBoutLedger: state.lastBoutLedger,
    fighterProgress: state.fighterProgress,
    nextMatchHpBonus: state.nextMatchHpBonus,
    nextMatchAttackBonus: state.nextMatchAttackBonus,
    resourceFocus: state.resourceFocus,
    matchOrdinal: state.matchOrdinal,
    winStreak: state.winStreak,
    fighterProfiles: state.fighterProfiles,
    combatTempo: state.combatTempo,
    opponentController: state.opponentController,
    combatStances: [
      state.fighters[0].combatStance,
      state.fighters[1].combatStance,
    ],
  });
}
