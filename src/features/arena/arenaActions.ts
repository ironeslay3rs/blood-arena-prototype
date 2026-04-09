import type {
  AbilityDefinition,
  ArenaReducerAction,
  ArenaState,
  CombatLogEntry,
  FighterState,
  MatchModifierId,
  PlayerInput,
} from "./arenaTypes";
import {
  ABILITY_RESOURCE_COST,
  ARENA_WIDTH,
  canUseAbility,
  clamp,
  clampHp,
  clampResource,
  fighterDef,
  isWithinRange,
  tickCooldowns,
} from "./arenaUtils";
import { decideDummyCombatIntent } from "./arenaDummyAi";
import { applyMatchEndToFighterProfile } from "./fighterProfileMatch";
import {
  createEmptyFighterProfile,
  ensurePlayerFighterProfile,
} from "./fighterProfileEnsure";
import {
  chaosEvolutionBonusProc,
  getProfileEvolution,
} from "./fighterProfileEvolution";
import { CANON_CHARACTER_DEFINITIONS } from "@/features/shared/canonCharacters";
import {
  createInitialArenaState,
  rematchKeepingRoster,
  resetArenaWithPlayerClass,
} from "./initialArenaState";
import {
  isOpponentHumanController,
  shouldRunDummyAi,
  shouldShiftDummyTowardPlayer,
} from "./opponentPolicy";
import { applyNetplayLockstepFrame } from "./arenaNetplayStep";
import { levelFromWins } from "./fighterProgress";
import {
  BRIBE_CREDITS_COST,
  BRIBE_PENALTY_REDUCTION,
  REINFORCE_HP_BONUS,
  REINFORCE_IRONHEART_COST,
  RITUAL_ATTACK_BONUS,
  RITUAL_BLOOD_CHITS_COST,
  canSpendArenaPrep,
} from "./arenaSpend";
import {
  DEFAULT_COMBAT_STANCE,
  stanceIncomingHpMult,
  stanceOutgoingDamageMult,
  stanceResourceRegenMult,
} from "./combatStance";
import {
  reputationForArenaFighter,
  reputationStreakLogLine,
} from "./fighterReputation";
import {
  addArenaResources,
  buildWinResourceRewards,
  rollLossSalvage,
} from "./arenaResources";
import {
  LOSS_STREAK_ABSOLUTE_HP_CAP,
  scaleWinRewardDelta,
  streakLossExtraPenalty,
  winStreakRewardMultiplier,
} from "./arenaWinStreak";
import {
  NEAR_DEATH_HP_RATIO,
  combatLogLossFlavor,
  combatLogNearDeathFlavor,
  combatLogStreakFlavor,
  combatLogWinFlavor,
} from "./combatLogFlavor";
import {
  BIO_FURY_DURATION_MS,
  BIO_HP_REGEN_PER_SEC,
  BLACK_CITY_ONHIT_BUFF,
  BLACK_CITY_ONHIT_RESOURCE,
  BLACK_CITY_ONHIT_SHIELD,
  BLACK_CITY_RECOIL_DAMAGE,
  BLACK_CITY_RECOIL_EVERY,
  MECHA_COOLDOWN_RECOVERY_MULT,
  MECHA_HIGH_RESOURCE_RATIO,
  MECHA_ION_INTERVAL_MS,
  MECHA_ION_SHIELD,
  PURE_ABILITY_HEAL,
  PURE_LOW_HP_DAMAGE_MULT,
  PURE_LOW_HP_RATIO,
  PURE_SOUL_LOG_COOLDOWN_MS,
  bioFuryDamageBonus,
} from "./factionCombatPassives";
import {
  MATCH_FASTER_COOLDOWNS_MULT,
  MATCH_INCREASED_DAMAGE_MULT,
  unstableResourceMultiplier,
} from "./matchModifiers";
import {
  COMBO_CANCEL_LINK_MS,
  COMBO_CHAIN_GAP_MS,
  comboOutgoingDamageMultiplier,
} from "./comboChainConfig";
import {
  CLIMAX_METER_MAX,
  CLIMAX_METER_ABILITY_DAMAGE_WHIFF,
  CLIMAX_METER_BASIC_ATTACK_WHIFF,
  CLIMAX_METER_DEFENDER_ON_CHIP,
  CLIMAX_METER_PER_DEALT_HP,
  CLIMAX_METER_PER_TAKEN_HP,
  CLIMAX_POST_ATTACK_COOLDOWN_MS,
} from "./climaxMeterConfig";
import {
  resolveClimaxStrikeDamage,
  resolveClimaxStrikeLogFragment,
} from "./climaxStrikeProfile";

export { CLIMAX_METER_MAX } from "./climaxMeterConfig";

function grantClimaxMeter(
  state: ArenaState,
  fighterIdx: 0 | 1,
  delta: number,
): ArenaState {
  if (state.winner != null || delta <= 0) return state;
  const next = structuredClone(state) as ArenaState;
  const f = next.fighters[fighterIdx];
  f.climaxMeter = Math.min(CLIMAX_METER_MAX, f.climaxMeter + delta);
  return next;
}

function resetOffensiveComboChain(fighter: FighterState): void {
  fighter.comboChainDepth = 0;
  fighter.comboChainExpireAtMs = 0;
}

const MAX_LOG = 48;
const DEFAULT_MANUAL_MOVE_MS = 16;

/** Combat tempo: carried across matches, clamped to keep bonuses bounded. */
const COMBAT_TEMPO_MIN = -3;
const COMBAT_TEMPO_MAX = 3;

/** Min gap between same-class tempo bonus lines during a match. */
const TEMPO_BONUS_LOG_COOLDOWN_MS = 5200;

/** Min gap between tempo “fight style” narrative lines (combat log). */
const TEMPO_NARRATIVE_COOLDOWN_MS = 11000;

/** Player-only: scales effective cooldown tick rate (no new combat stats). */
const TEMPO_CD_MULT_PER_STEP = 0.032;

const HIGH_TEMPO_PRESS_LINES = [
  "You keep pressing forward.",
  "The exchange rides your rhythm—step in again.",
  "No space between beats; that is your tempo.",
] as const;

const LOW_TEMPO_SURVIVAL_LINES = [
  "You shorten your stance and force the next beat wide.",
  "Survive the frame—answer when it opens.",
  "Measured breath. Still in the fight.",
] as const;

function clampCombatTempo(n: number): number {
  return Math.min(COMBAT_TEMPO_MAX, Math.max(COMBAT_TEMPO_MIN, Math.round(n)));
}

/** Player only: higher tempo ticks cooldowns down slightly faster (feel, not a new rule). */
function tempoPlayerCooldownMultiplier(tempo: number): number {
  return 1 + clampCombatTempo(tempo) * TEMPO_CD_MULT_PER_STEP;
}

/**
 * Playback speed for combat UI motion (damage float, hit flashes, staged attack beats, arena pulse).
 * Matches player cooldown pacing so high tempo reads as one rhythm: snappier motion and faster
 * ability recovery; low tempo stretches both.
 *
 * Use as a speed factor: `durationMs / tempoCombatAnimationSpeedMultiplier(tempo)`.
 */
export function tempoCombatAnimationSpeedMultiplier(tempo: number): number {
  return tempoPlayerCooldownMultiplier(tempo);
}

function appendTempoFightStyleNarrative(
  s: ArenaState,
  pre: {
    attackerIdx: 0 | 1;
    targetIdx: 0 | 1;
    grossMit: number;
    /** True when a Bio momentum tempo line was just appended this frame. */
    skipHighPersona: boolean;
  },
): ArenaState {
  if (pre.grossMit <= 0) return s;
  if (s.nowMs < s.tempoNarrativeSilenceUntilMs) return s;
  const tempo = clampCombatTempo(s.combatTempo);
  let line: string | null = null;
  if (pre.attackerIdx === 0 && tempo >= 2 && !pre.skipHighPersona) {
    const i =
      Math.abs(Math.floor(s.nowMs / 1000)) % HIGH_TEMPO_PRESS_LINES.length;
    line = HIGH_TEMPO_PRESS_LINES[i]!;
  } else if (pre.targetIdx === 0 && tempo <= -2) {
    const i =
      Math.abs(Math.floor(s.nowMs / 700)) % LOW_TEMPO_SURVIVAL_LINES.length;
    line = LOW_TEMPO_SURVIVAL_LINES[i]!;
  }
  if (!line) return s;
  let out = withLog(s, line, { kind: "tempo" });
  out = {
    ...out,
    tempoNarrativeSilenceUntilMs: s.nowMs + TEMPO_NARRATIVE_COOLDOWN_MS,
  };
  return out;
}

function formatTempoForLog(t: number): string {
  if (t > 0) return `+${t}`;
  return `${t}`;
}

/** Re-export for call sites that still import from `arenaActions`. */
export { ABILITY_RESOURCE_COST } from "./arenaUtils";

/** Same numeric base as `WIN_CREDIT_BASE` in `arenaResources` (arena stipend per win). */
export { WIN_CREDIT_BASE as WIN_CREDIT_REWARD } from "./arenaResources";

const ABILITY_DAMAGE_MULT = 1.35;
const ABILITY_HEAL_FLAT = 26;
const ABILITY_BUFF_FLAT = 8;
const ABILITY_SHIELD_FLAT = 18;
const LOSS_HP_PENALTY_STEP = 18;
const LOSS_HP_PENALTY_CAP = 54;

function abilityCooldownKey(slot: 0 | 1): "skill1" | "skill2" {
  return slot === 0 ? "skill1" : "skill2";
}

function abilityDamageAmount(player: FighterState, nowMs: number): number {
  return Math.max(
    1,
    Math.round(
      player.fighterDefinition.baseAttack * ABILITY_DAMAGE_MULT +
        bioFuryDamageBonus(player, nowMs),
    ),
  );
}

function appendFighterProfileProgressLogs(
  s: ArenaState,
  preMatch: ArenaState,
  outcome: "win" | "loss",
): ArenaState {
  const canon = preMatch.fighters[0].fighterDefinition.canonCharacterId;
  const displayName = CANON_CHARACTER_DEFINITIONS[canon].name;
  const { fighterProfiles, logMessages } = applyMatchEndToFighterProfile(
    preMatch.fighterProfiles,
    canon,
    displayName,
    outcome,
    preMatch.matchPlayerDamageDealt,
    preMatch.matchPlayerDamageTaken,
  );
  let next = { ...s, fighterProfiles };
  for (const message of logMessages) {
    next = withLog(next, message);
  }
  return next;
}

function withLog(
  state: ArenaState,
  message: string,
  opts?: {
    kind?: CombatLogEntry["kind"];
    evolutionCue?: CombatLogEntry["evolutionCue"];
  },
): ArenaState {
  const nextSeq = state.logSeq + 1;
  const id = `${state.nowMs}-${nextSeq}`;
  const entry: CombatLogEntry = {
    id,
    atMs: state.nowMs,
    message,
    ...(opts?.kind ? { kind: opts.kind } : {}),
    ...(opts?.evolutionCue ? { evolutionCue: opts.evolutionCue } : {}),
  };
  return {
    ...state,
    logSeq: nextSeq,
    log: [...state.log, entry].slice(-MAX_LOG),
  };
}

function resolveFacing(player: FighterState, opponent: FighterState): 1 | -1 {
  return player.x < opponent.x ? 1 : -1;
}

function mitigatedDamage(target: FighterState, raw: number): number {
  if (raw <= 0) return 0;
  const def = fighterDef(target);
  let mit = raw;
  if (target.blocking && target.resource > 0) {
    mit *= 1 - def.blockMitigation;
  }
  if (
    target.fighterDefinition.faction === "Pure" &&
    target.hpMax > 0 &&
    target.hp > 0
  ) {
    const ratio = target.hp / target.hpMax;
    if (ratio <= PURE_LOW_HP_RATIO) {
      mit *= PURE_LOW_HP_DAMAGE_MULT;
    }
  }
  return mit;
}

function applyDamageTo(
  state: ArenaState,
  attackerIdx: 0 | 1,
  targetIdx: 0 | 1,
  rawDamage: number,
  verb: string,
): ArenaState {
  if (state.winner != null || rawDamage <= 0) return state;
  let raw = rawDamage;
  let firstHitEvolutionFlash = false;
  if (attackerIdx === 0) {
    const pre = state.fighters[0];
    if (!pre.openingStrikeConsumed) {
      const canon = pre.fighterDefinition.canonCharacterId;
      const profile =
        state.fighterProfiles[canon] ?? createEmptyFighterProfile(canon);
      const evo = getProfileEvolution(profile);
      if (evo.path === "aggression" && evo.firstHitAttackBonus > 0) {
        raw += evo.firstHitAttackBonus;
        firstHitEvolutionFlash = true;
      }
    }
  }
  if (state.matchModifier === "increased_damage") {
    raw *= MATCH_INCREASED_DAMAGE_MULT;
  }
  // High tempo: Bio (“aggression”) deals +1 on hits and damage abilities.
  const bioMomentumFromTempo =
    state.combatTempo >= 2 &&
    state.fighters[attackerIdx].fighterDefinition.faction === "Bio";
  if (bioMomentumFromTempo) {
    raw += 1;
  }
  if (raw <= 0) return state;
  const next = structuredClone(state) as ArenaState;
  const attacker = next.fighters[attackerIdx];
  const target = next.fighters[targetIdx];
  if (state.nowMs > attacker.comboChainExpireAtMs) {
    attacker.comboChainDepth = 0;
  }
  if (!target.blocking) {
    raw *= comboOutgoingDamageMultiplier(attacker.comboChainDepth);
  }
  raw *= stanceOutgoingDamageMult(attacker.combatStance);
  if (raw <= 0) return state;
  const grossMit = mitigatedDamage(target, raw);
  let toHp = grossMit;
  const absorbedBase = Math.min(target.tempShield, toHp);
  let bonusStrip = 0;
  if (
    attackerIdx === 0 &&
    grossMit > 0 &&
    attacker.fighterDefinition.faction === "Mecha"
  ) {
    const canon = attacker.fighterDefinition.canonCharacterId;
    const profile =
      state.fighterProfiles[canon] ?? createEmptyFighterProfile(canon);
    const evo = getProfileEvolution(profile);
    if (evo.path === "control" && evo.shieldStripBonus > 0) {
      bonusStrip = Math.min(
        evo.shieldStripBonus,
        Math.max(0, target.tempShield - absorbedBase),
      );
    }
  }
  const totalShieldHit = absorbedBase + bonusStrip;
  target.tempShield -= totalShieldHit;
  toHp -= absorbedBase;
  toHp *= stanceIncomingHpMult(target.combatStance);
  const hpBefore = target.hp;
  target.hp = clampHp(target.hp - toHp, target.hpMax);
  const hpDamage = Math.round(toHp);
  if (attackerIdx === 0) {
    next.matchPlayerDamageDealt += hpDamage;
  }
  if (targetIdx === 0) {
    next.matchPlayerDamageTaken += hpDamage;
  }
  if (attackerIdx === 0 && grossMit > 0) {
    attacker.openingStrikeConsumed = true;
  }

  const shieldBit =
    totalShieldHit > 0
      ? ` (${Math.round(totalShieldHit)} absorbed by shield)`
      : "";
  let s = withLog(
    next,
    toHp > 0 || totalShieldHit > 0
      ? `${attacker.label} ${verb} ${target.label} for ${Math.round(toHp)} HP${shieldBit} (${target.blocking ? "blocked" : "clean"})`
      : `${attacker.label} ${verb} ${target.label} (no damage)`,
  );

  if (firstHitEvolutionFlash && grossMit > 0) {
    s = withLog(s, "\u200b", { evolutionCue: "first_hit_impact" });
  }

  let skipHighPersona = false;
  if (
    bioMomentumFromTempo &&
    grossMit > 0 &&
    s.nowMs >= s.tempoLogSilenceBioUntilMs
  ) {
    s = {
      ...s,
      tempoLogSilenceBioUntilMs: s.nowMs + TEMPO_BONUS_LOG_COOLDOWN_MS,
    };
    s = withLog(s, "Bio momentum hit (+1 damage).", { kind: "tempo" });
    skipHighPersona = true;
  }

  if (
    bonusStrip > 0 &&
    s.nowMs >= s.tempoLogSilenceMechaControlUntilMs
  ) {
    s = {
      ...s,
      tempoLogSilenceMechaControlUntilMs: s.nowMs + TEMPO_BONUS_LOG_COOLDOWN_MS,
    };
    s = withLog(s, "Mecha control bonus: extra shield stripped.", {
      kind: "tempo",
    });
  }

  if (bonusStrip > 0) {
    s = withLog(s, "\u200b", { evolutionCue: "shield_strip_crack" });
  }

  if (
    target.fighterDefinition.faction === "Bio" &&
    hpBefore > target.hp &&
    target.hp >= 0
  ) {
    const wasCold = target.bioFuryUntilMs <= s.nowMs;
    target.bioFuryUntilMs = s.nowMs + BIO_FURY_DURATION_MS;
    if (wasCold) {
      s = withLog(s, "Your body adapts");
    }
  }

  if (grossMit > 0 && attacker.fighterDefinition.faction === "Black City") {
    const phase = attacker.blackCityStrikeCycle % 3;
    attacker.blackCityStrikeCycle += 1;
    if (phase === 0) {
      attacker.tempShield += BLACK_CITY_ONHIT_SHIELD;
    } else if (phase === 1) {
      attacker.damageBonusNextAttack += BLACK_CITY_ONHIT_BUFF;
    } else {
      attacker.resource = clampResource(
        attacker.resource + BLACK_CITY_ONHIT_RESOURCE,
        attacker.resourceMax,
      );
    }
    s = withLog(s, "Chaos answers");
    if (attackerIdx === 0) {
      const canon = attacker.fighterDefinition.canonCharacterId;
      const profile =
        state.fighterProfiles[canon] ?? createEmptyFighterProfile(canon);
      const evo = getProfileEvolution(profile);
      if (
        chaosEvolutionBonusProc(
          state.nowMs,
          attacker.blackCityStrikeCycle,
          evo,
        )
      ) {
        attacker.resource = clampResource(
          attacker.resource + 1,
          attacker.resourceMax,
        );
      }
    }
  }

  if (
    targetIdx === 0 &&
    target.hp > 0 &&
    target.hpMax > 0 &&
    !target.nearDeathFlavorLogged
  ) {
    const beforeR = hpBefore / target.hpMax;
    const afterR = target.hp / target.hpMax;
    if (afterR <= NEAR_DEATH_HP_RATIO && beforeR > NEAR_DEATH_HP_RATIO) {
      const canon = target.fighterDefinition.canonCharacterId;
      s = withLog(s, combatLogNearDeathFlavor(canon));
      target.nearDeathFlavorLogged = true;
    }
  }

  s = appendTempoFightStyleNarrative(s, {
    attackerIdx,
    targetIdx,
    grossMit,
    skipHighPersona,
  });

  if (grossMit > 0 && target.blocking) {
    resetOffensiveComboChain(attacker);
  }

  if (hpDamage > 0) {
    resetOffensiveComboChain(target);
    attacker.climaxMeter = Math.min(
      CLIMAX_METER_MAX,
      attacker.climaxMeter + CLIMAX_METER_PER_DEALT_HP,
    );
    target.climaxMeter = Math.min(
      CLIMAX_METER_MAX,
      target.climaxMeter + CLIMAX_METER_PER_TAKEN_HP,
    );
    if (target.blocking && CLIMAX_METER_DEFENDER_ON_CHIP > 0) {
      target.climaxMeter = Math.min(
        CLIMAX_METER_MAX,
        target.climaxMeter + CLIMAX_METER_DEFENDER_ON_CHIP,
      );
    }
    if (!target.blocking) {
      attacker.cancelWindowUntilMs = state.nowMs + COMBO_CANCEL_LINK_MS;
      attacker.comboChainDepth += 1;
      attacker.comboChainExpireAtMs = state.nowMs + COMBO_CHAIN_GAP_MS;
    }
  }

  s = evaluateWinner(s);
  return s;
}

function recordPlayerLoss(state: ArenaState): ArenaState["fighterProgress"] {
  const pid = state.fighters[0].fighterId;
  const prev = state.fighterProgress[pid];
  const losses = prev.losses + 1;
  return {
    ...state.fighterProgress,
    [pid]: {
      wins: prev.wins,
      losses,
      level: levelFromWins(prev.wins),
    },
  };
}

function recordPlayerWin(state: ArenaState): ArenaState["fighterProgress"] {
  const pid = state.fighters[0].fighterId;
  const prev = state.fighterProgress[pid];
  const wins = prev.wins + 1;
  return {
    ...state.fighterProgress,
    [pid]: {
      wins,
      losses: prev.losses,
      level: levelFromWins(wins),
    },
  };
}

function evaluateWinner(state: ArenaState): ArenaState {
  if (state.winner != null) return state;
  const [p, o] = state.fighters;
  if (p.hp <= 0) {
    const hadStreak = state.winStreak;
    const baseCapped = Math.min(
      LOSS_HP_PENALTY_CAP,
      state.pendingHpPenalty + LOSS_HP_PENALTY_STEP,
    );
    const streakExtra = streakLossExtraPenalty(hadStreak);
    const nextPenalty = Math.min(
      LOSS_STREAK_ABSOLUTE_HP_CAP,
      baseCapped + streakExtra,
    );
    let s: ArenaState = {
      ...state,
      combatTempo: clampCombatTempo(state.combatTempo - 1),
      fighterProgress: recordPlayerLoss(state),
      winner: "opponent",
      lastMatchResult: "loss",
      pendingHpPenalty: nextPenalty,
      winStreak: 0,
    };
    s = withLog(
      s,
      shouldRunDummyAi(state.opponentController)
        ? "Player 1 is down. Defeat."
        : "Player 1 is down. Player 2 wins.",
    );
    s = withLog(
      s,
      `Tempo falls to ${formatTempoForLog(s.combatTempo)}.`,
      { kind: "tempo" },
    );
    if (hadStreak >= 3) {
      s = withLog(s, "The arena watches you.");
    }
    const lossCanon = state.fighters[0].fighterDefinition.canonCharacterId;
    // One canon personality line per defeat: streak break takes precedence.
    s = withLog(
      s,
      hadStreak >= 3
        ? combatLogStreakFlavor(lossCanon)
        : combatLogLossFlavor(lossCanon),
    );
    s = withLog(
      s,
      `Consequence: next match max HP −${nextPenalty} (cap ${LOSS_STREAK_ABSOLUTE_HP_CAP}).`,
    );
    const salvage = rollLossSalvage(state);
    s = { ...s, resources: salvage.resources };
    for (const line of salvage.logLines) {
      s = withLog(s, line);
    }
    return appendFighterProfileProgressLogs(s, state, "loss");
  }
  if (o.hp <= 0) {
    const nextStreak = state.winStreak + 1;
    const { delta: rawDelta, logLines } = buildWinResourceRewards(state);
    const delta = scaleWinRewardDelta(
      rawDelta,
      winStreakRewardMultiplier(nextStreak),
    );
    const nextResources = addArenaResources(state.resources, delta);
    let s: ArenaState = {
      ...state,
      combatTempo: clampCombatTempo(state.combatTempo + 1),
      fighterProgress: recordPlayerWin(state),
      winner: "player",
      lastMatchResult: "win",
      resources: nextResources,
      pendingHpPenalty: 0,
      winStreak: nextStreak,
    };
    s = withLog(
      s,
      shouldRunDummyAi(state.opponentController)
        ? "Training opponent down. Player 1 wins."
        : "Player 2 is down. Player 1 wins.",
    );
    s = withLog(
      s,
      `Tempo rises to ${formatTempoForLog(s.combatTempo)}.`,
      { kind: "tempo" },
    );
    const streakRep = reputationStreakLogLine(
      nextStreak,
      reputationForArenaFighter(s, 0).title,
    );
    if (streakRep) {
      s = withLog(s, streakRep, { kind: "reputation" });
    }
    for (const line of logLines) {
      s = withLog(s, line);
    }
    const winCanon = state.fighters[0].fighterDefinition.canonCharacterId;
    // One canon personality line per victory: streak milestone takes precedence.
    s = withLog(
      s,
      nextStreak >= 3
        ? combatLogStreakFlavor(winCanon)
        : combatLogWinFlavor(winCanon),
    );
    if (nextStreak >= 2) {
      s = withLog(s, "Streak growing…");
    }
    if (nextStreak >= 5) {
      s = withLog(s, "The arena watches you.");
    }
    return appendFighterProfileProgressLogs(s, state, "win");
  }
  return state;
}

function tickFighter(
  f: FighterState,
  dtMs: number,
  opts: {
    regen: boolean;
    isPlayerTick: boolean;
    input?: PlayerInput;
    /** Training dummy: same regen formula as the player so it can spend resource on abilities. */
    dummyResourceRegen?: boolean;
    matchModifier: MatchModifierId;
    /** Current arena clock after this frame’s time step (for unstable resource phase). */
    arenaNowMs: number;
    /** Run-wide tempo: adjusts player cooldown pacing only (feel). */
    combatTempo: number;
  },
): { fighter: FighterState; logs: string[] } {
  const def = fighterDef(f);
  const faction = f.fighterDefinition.faction;
  const logs: string[] = [];

  const resMult =
    opts.matchModifier === "unstable_resource"
      ? unstableResourceMultiplier(opts.arenaNowMs)
      : 1;

  let cdDt = dtMs;
  if (
    faction === "Mecha" &&
    f.resourceMax > 0 &&
    f.resource / f.resourceMax >= MECHA_HIGH_RESOURCE_RATIO
  ) {
    cdDt = dtMs * MECHA_COOLDOWN_RECOVERY_MULT;
  }
  if (opts.matchModifier === "faster_cooldowns") {
    cdDt *= MATCH_FASTER_COOLDOWNS_MULT;
  }
  if (opts.isPlayerTick) {
    cdDt *= tempoPlayerCooldownMultiplier(opts.combatTempo);
  }

  const next = { ...f, cooldowns: tickCooldowns(f.cooldowns, cdDt) };

  if (opts.isPlayerTick && opts.input) {
    const wantBlock = opts.input.blockHeld && next.resource > 0 && next.hp > 0;
    next.blocking = wantBlock;
    if (wantBlock) {
      next.resource = clampResource(
        next.resource -
          (def.blockResourceDrainPerSec * resMult * dtMs) / 1000,
        next.resourceMax,
      );
      if (next.resource <= 0) next.blocking = false;
    }
  }

  const allowRegen =
    f.hp > 0 &&
    !next.blocking &&
    ((!f.isDummy && opts.regen) || (f.isDummy && opts.dummyResourceRegen));

  if (allowRegen) {
    next.resource = clampResource(
      next.resource +
        (def.resourceRegenPerSec *
          resMult *
          stanceResourceRegenMult(next.combatStance) *
          dtMs) /
          1000,
      next.resourceMax,
    );
  }

  if (
    faction === "Bio" &&
    next.hp > 0 &&
    next.hp < next.hpMax &&
    !next.blocking
  ) {
    next.hp = clampHp(
      next.hp + BIO_HP_REGEN_PER_SEC * (dtMs / 1000),
      next.hpMax,
    );
  }

  if (faction === "Mecha" && next.hp > 0) {
    let acc = next.mechaIonAccumulatorMs + dtMs;
    let pulsed = false;
    while (acc >= MECHA_ION_INTERVAL_MS) {
      acc -= MECHA_ION_INTERVAL_MS;
      next.tempShield += MECHA_ION_SHIELD;
      pulsed = true;
    }
    next.mechaIonAccumulatorMs = acc;
    if (pulsed) logs.push("Systems optimize");
  }

  return { fighter: next, logs };
}

function shiftFighterHorizontal(
  state: ArenaState,
  fighterIdx: 0 | 1,
  direction: -1 | 1,
  dtMs: number,
): ArenaState {
  if (state.winner != null) return state;
  const f = state.fighters[fighterIdx];
  if (f.hp <= 0 || f.blocking) return state;
  const def = fighterDef(f);
  const next = structuredClone(state) as ArenaState;
  const p = next.fighters[fighterIdx];
  p.x = clamp(
    p.x + direction * def.moveSpeedPerSec * (dtMs / 1000),
    0,
    ARENA_WIDTH,
  );
  p.facing = resolveFacing(p, next.fighters[fighterIdx === 0 ? 1 : 0]);
  return next;
}

function moveLeft(state: ArenaState, dtMs: number): ArenaState {
  return shiftFighterHorizontal(state, 0, -1, dtMs);
}

function moveRight(state: ArenaState, dtMs: number): ArenaState {
  return shiftFighterHorizontal(state, 0, 1, dtMs);
}

function dashFrom(state: ArenaState, attackerIdx: 0 | 1): ArenaState {
  if (state.winner != null) return state;
  const next = structuredClone(state) as ArenaState;
  const player = next.fighters[attackerIdx];
  const def = fighterDef(player);
  if (player.hp <= 0) return state;
  if (player.cooldowns.dash > 0) return state;

  const dir = player.facing;
  player.x = clamp(
    player.x + dir * def.dashDistance,
    0,
    ARENA_WIDTH,
  );
  player.cooldowns.dash = def.dashCooldownMs;
  let s = withLog(next, `${player.label} dashed ${dir > 0 ? "right" : "left"}.`);
  s = evaluateWinner(s);
  return s;
}

function dash(state: ArenaState): ArenaState {
  return dashFrom(state, 0);
}

function basicAttackFrom(state: ArenaState, attackerIdx: 0 | 1): ArenaState {
  if (state.winner != null) return state;
  const targetIdx = (attackerIdx === 0 ? 1 : 0) as 0 | 1;
  const attacker = state.fighters[attackerIdx];
  const target = state.fighters[targetIdx];
  const def = fighterDef(attacker);
  if (attacker.hp <= 0) return state;
  if (attacker.cooldowns.attack > 0) return state;

  if (!isWithinRange(attacker, target, def.attackRange)) {
    let s = state;
    if (CLIMAX_METER_BASIC_ATTACK_WHIFF > 0) {
      s = grantClimaxMeter(s, attackerIdx, CLIMAX_METER_BASIC_ATTACK_WHIFF);
      resetOffensiveComboChain(s.fighters[attackerIdx]);
    }
    return withLog(s, `${attacker.label} attacked — out of range.`);
  }

  const next = structuredClone(state) as ArenaState;
  const p = next.fighters[attackerIdx];
  const bonus = p.damageBonusNextAttack;
  p.damageBonusNextAttack = 0;
  p.cooldowns.attack = def.attackCooldownMs;
  let s = withLog(next, `${p.label} attacked.`);
  const strike =
    def.attackDamage + bonus + bioFuryDamageBonus(p, state.nowMs);
  s = applyDamageTo(s, attackerIdx, targetIdx, strike, "hit");
  return s;
}

function basicAttack(state: ArenaState): ArenaState {
  return basicAttackFrom(state, 0);
}

function fighterClimaxAttack(
  state: ArenaState,
  attackerIdx: 0 | 1,
): ArenaState {
  if (state.winner != null) return state;
  const targetIdx = (attackerIdx === 0 ? 1 : 0) as 0 | 1;
  const attacker = state.fighters[attackerIdx];
  const target = state.fighters[targetIdx];
  const def = fighterDef(attacker);
  if (attacker.hp <= 0) return state;
  if (attacker.climaxMeter < CLIMAX_METER_MAX) return state;

  if (!isWithinRange(attacker, target, def.attackRange)) {
    return withLog(state, `${attacker.label} — Climax out of range.`);
  }

  const next = structuredClone(state) as ArenaState;
  const p = next.fighters[attackerIdx];
  resetOffensiveComboChain(p);
  p.cooldowns.attack = Math.max(
    p.cooldowns.attack,
    CLIMAX_POST_ATTACK_COOLDOWN_MS,
  );
  p.climaxMeter = 0;

  const fd = p.fighterDefinition;
  const climaxName = resolveClimaxStrikeLogFragment(
    fd.faction,
    fd.climaxOverride,
  );
  let s = withLog(next, `${p.label} unleashes ${climaxName}!`);
  const strike = resolveClimaxStrikeDamage(
    fd.faction,
    fd.climaxOverride,
    def.attackDamage,
    bioFuryDamageBonus(p, state.nowMs),
  );
  s = applyDamageTo(s, attackerIdx, targetIdx, strike, "hit");
  return s;
}

/**
 * Discrete guard up (for tests or future input modes). Real-time hold still
 * comes from TICK + `PlayerInput.blockHeld`.
 */
function startBlock(state: ArenaState): ArenaState {
  if (state.winner != null) return state;
  const player = state.fighters[0];
  if (player.hp <= 0 || player.resource <= 0) return state;
  if (player.blocking) return state;
  const next = structuredClone(state) as ArenaState;
  next.fighters[0].blocking = true;
  return withLog(next, `${next.fighters[0].label} raised guard.`);
}

function stopBlock(state: ArenaState): ArenaState {
  const player = state.fighters[0];
  if (!player.blocking) return state;
  const next = structuredClone(state) as ArenaState;
  next.fighters[0].blocking = false;
  return withLog(next, `${next.fighters[0].label} lowered guard.`);
}

function applyAbilityEffect(
  state: ArenaState,
  actorIdx: 0 | 1,
  ability: AbilityDefinition,
): ArenaState {
  const actor = state.fighters[actorIdx];
  const otherIdx = (actorIdx === 0 ? 1 : 0) as 0 | 1;

  switch (ability.effectType) {
    case "damage": {
      const raw = abilityDamageAmount(actor, state.nowMs);
      return applyDamageTo(
        state,
        actorIdx,
        otherIdx,
        raw,
        `struck with ${ability.name}`,
      );
    }
    case "heal": {
      const p = state.fighters[actorIdx];
      const before = p.hp;
      let healAmt = ABILITY_HEAL_FLAT;
      let sustainEvolutionHeal = false;
      if (actorIdx === 0) {
        const canon = state.fighters[0].fighterDefinition.canonCharacterId;
        const profile =
          state.fighterProfiles[canon] ?? createEmptyFighterProfile(canon);
        const evo = getProfileEvolution(profile);
        if (evo.path === "sustain" && evo.healBonus > 0) {
          healAmt += evo.healBonus;
          sustainEvolutionHeal = true;
        }
      }
      const pureTempoHeal =
        state.combatTempo <= -2 && p.fighterDefinition.faction === "Pure";
      if (pureTempoHeal) healAmt += 1;
      p.hp = clampHp(p.hp + healAmt, p.hpMax);
      const gained = Math.round(p.hp - before);
      let s = withLog(
        state,
        `${p.label} healed ${gained} HP with ${ability.name}.`,
      );
      if (actorIdx === 0 && sustainEvolutionHeal && gained > 0) {
        s = withLog(s, "\u200b", { evolutionCue: "heal_bonus_pulse" });
      }
      if (
        pureTempoHeal &&
        gained > 0 &&
        s.nowMs >= s.tempoLogSilencePureHealUntilMs
      ) {
        s = {
          ...s,
          tempoLogSilencePureHealUntilMs: s.nowMs + TEMPO_BONUS_LOG_COOLDOWN_MS,
        };
        s = withLog(s, "Pure recovery bonus (+1 heal).", { kind: "tempo" });
      }
      return evaluateWinner(s);
    }
    case "buff": {
      const p = state.fighters[actorIdx];
      p.damageBonusNextAttack += ABILITY_BUFF_FLAT;
      return evaluateWinner(
        withLog(
          state,
          `${p.label} empowered their next attack (+${ABILITY_BUFF_FLAT}) with ${ability.name}.`,
        ),
      );
    }
    case "dash": {
      const p = state.fighters[actorIdx];
      const kit = fighterDef(actor);
      const dir = p.facing;
      p.x = clamp(
        p.x + dir * kit.dashDistance,
        0,
        ARENA_WIDTH,
      );
      return evaluateWinner(
        withLog(state, `${p.label} used ${ability.name} (dash).`),
      );
    }
    case "shield": {
      const p = state.fighters[actorIdx];
      p.tempShield += ABILITY_SHIELD_FLAT;
      return evaluateWinner(
        withLog(
          state,
          `${p.label} gained ${ABILITY_SHIELD_FLAT} shield with ${ability.name}.`,
        ),
      );
    }
  }
}

function performFighterAbility(
  state: ArenaState,
  actorIdx: 0 | 1,
  slot: 0 | 1,
): ArenaState {
  if (state.winner != null) return state;
  const actor = state.fighters[actorIdx];
  const opponent = state.fighters[actorIdx === 0 ? 1 : 0];
  if (actor.hp <= 0) return state;

  const ability = actor.fighterDefinition.abilities[slot];
  const cdKey = abilityCooldownKey(slot);

  if (
    !canUseAbility(
      actor.cooldowns[cdKey],
      actor.resource,
      ABILITY_RESOURCE_COST,
    )
  ) {
    return state;
  }

  const kit = fighterDef(actor);
  const actorIdxSafe = actorIdx;
  if (ability.effectType === "damage") {
    if (!isWithinRange(actor, opponent, kit.attackRange)) {
      const next = structuredClone(state) as ArenaState;
      const p = next.fighters[actorIdxSafe];
      p.resource = clampResource(
        p.resource - ABILITY_RESOURCE_COST,
        p.resourceMax,
      );
      p.cooldowns[cdKey] = ability.cooldown;
      resetOffensiveComboChain(p);
      let s = withLog(
        next,
        `${p.label} used ${ability.name} (whiff — out of range).`,
      );
      if (CLIMAX_METER_ABILITY_DAMAGE_WHIFF > 0) {
        s = grantClimaxMeter(
          s,
          actorIdxSafe,
          CLIMAX_METER_ABILITY_DAMAGE_WHIFF,
        );
      }
      s = applyFactionAbilityFollowup(s, actorIdxSafe);
      return evaluateWinner(s);
    }
  }

  const next = structuredClone(state) as ArenaState;
  const p = next.fighters[actorIdx];
  p.resource = clampResource(
    p.resource - ABILITY_RESOURCE_COST,
    p.resourceMax,
  );
  p.cooldowns[cdKey] = ability.cooldown;

  let s = withLog(next, `${p.label} used ${ability.name}.`);
  s = applyAbilityEffect(s, actorIdx, ability);
  s = applyFactionAbilityFollowup(s, actorIdx);
  return s;
}

function applyFactionAbilityFollowup(
  state: ArenaState,
  actorIdx: 0 | 1,
): ArenaState {
  const actor = state.fighters[actorIdx];
  const faction = actor.fighterDefinition.faction;
  let s = state;

  if (faction === "Pure" && actor.hp > 0) {
    const before = actor.hp;
    let mend = PURE_ABILITY_HEAL;
    let sustainMendEvolution = false;
    if (actorIdx === 0) {
      const canon = state.fighters[0].fighterDefinition.canonCharacterId;
      const profile =
        state.fighterProfiles[canon] ?? createEmptyFighterProfile(canon);
      const evo = getProfileEvolution(profile);
      if (evo.path === "sustain" && evo.healBonus > 0) {
        mend += evo.healBonus;
        sustainMendEvolution = true;
      }
    }
    const pureTempoMend =
      state.combatTempo <= -2 && actor.fighterDefinition.faction === "Pure";
    if (pureTempoMend) mend += 1;
    actor.hp = clampHp(actor.hp + mend, actor.hpMax);
    if (
      actor.hp > before &&
      state.nowMs >= actor.pureSoulLogSilenceUntilMs
    ) {
      actor.pureSoulLogSilenceUntilMs =
        state.nowMs + PURE_SOUL_LOG_COOLDOWN_MS;
      s = withLog(s, "The soul responds");
    }
    if (
      pureTempoMend &&
      actor.hp > before &&
      s.nowMs >= s.tempoLogSilencePureHealUntilMs
    ) {
      s = {
        ...s,
        tempoLogSilencePureHealUntilMs: s.nowMs + TEMPO_BONUS_LOG_COOLDOWN_MS,
      };
      s = withLog(s, "Pure recovery bonus (+1 heal).", { kind: "tempo" });
    }
    if (sustainMendEvolution && actorIdx === 0 && actor.hp > before) {
      s = withLog(s, "\u200b", { evolutionCue: "heal_bonus_pulse" });
    }
  }

  if (faction === "Black City" && actor.hp > 0) {
    actor.blackCityAbilityIndex += 1;
    if (actor.blackCityAbilityIndex % BLACK_CITY_RECOIL_EVERY === 0) {
      actor.hp = clampHp(actor.hp - BLACK_CITY_RECOIL_DAMAGE, actor.hpMax);
      s = withLog(s, "Chaos answers");
    }
  }

  return evaluateWinner(s);
}

function performPlayerAbility(state: ArenaState, slot: 0 | 1): ArenaState {
  return performFighterAbility(state, 0, slot);
}

function opponentDiscreteBasicAttack(state: ArenaState): ArenaState {
  if (!isOpponentHumanController(state.opponentController)) return state;
  return basicAttackFrom(state, 1);
}

function opponentDiscreteDash(state: ArenaState): ArenaState {
  if (!isOpponentHumanController(state.opponentController)) return state;
  return dashFrom(state, 1);
}

function opponentDiscreteAbility(state: ArenaState, slot: 0 | 1): ArenaState {
  if (!isOpponentHumanController(state.opponentController)) return state;
  return performFighterAbility(state, 1, slot);
}

function shiftOpponentTowardPlayer(
  state: ArenaState,
  dtMs: number,
): ArenaState {
  if (state.winner != null) return state;
  if (!shouldShiftDummyTowardPlayer(state.opponentController)) return state;
  const opp = state.fighters[1];
  if (!opp.isDummy || opp.hp <= 0) return state;
  const next = structuredClone(state) as ArenaState;
  const o = next.fighters[1];
  const p = next.fighters[0];
  const def = fighterDef(o);
  const dx = p.x - o.x;
  if (Math.abs(dx) < 0.05) return next;
  const dir = dx > 0 ? 1 : -1;
  o.x = clamp(
    o.x + dir * def.moveSpeedPerSec * (dtMs / 1000),
    0,
    ARENA_WIDTH,
  );
  return next;
}

/** Training dummy only — human P2 uses {@link basicAttackFrom} via input. */
function opponentBasicAttack(state: ArenaState): ArenaState {
  return basicAttackFrom(state, 1);
}

function spendReinforceBody(state: ArenaState): ArenaState {
  if (!canSpendArenaPrep(state)) return state;
  if (state.resources.ironheart < REINFORCE_IRONHEART_COST) return state;
  return withLog(
    {
      ...state,
      resources: {
        ...state.resources,
        ironheart: state.resources.ironheart - REINFORCE_IRONHEART_COST,
      },
      nextMatchHpBonus: state.nextMatchHpBonus + REINFORCE_HP_BONUS,
    },
    "Ironheart plating reinforced your frame.",
  );
}

function spendBribeHandler(state: ArenaState): ArenaState {
  if (!canSpendArenaPrep(state)) return state;
  if (state.pendingHpPenalty <= 0) return state;
  if (state.resources.credits < BRIBE_CREDITS_COST) return state;
  return withLog(
    {
      ...state,
      resources: {
        ...state.resources,
        credits: state.resources.credits - BRIBE_CREDITS_COST,
      },
      pendingHpPenalty: Math.max(
        0,
        state.pendingHpPenalty - BRIBE_PENALTY_REDUCTION,
      ),
    },
    "Credits cross the right palms — your max-HP penalty eases.",
  );
}

function setResourceFocus(
  state: ArenaState,
  focus: ArenaState["resourceFocus"],
): ArenaState {
  if (state.resourceFocus === focus) return state;
  let message: string;
  if (focus === "ironheart") message = "You lean into ironheart salvage.";
  else if (focus === "bloodChits") message = "You harvest blood above all.";
  else if (focus === "lumens")
    message = "You gather lumens before lesser spoils.";
  else message = "You set aside a single resource focus.";
  return withLog({ ...state, resourceFocus: focus }, message);
}

function spendBloodRitual(state: ArenaState): ArenaState {
  if (!canSpendArenaPrep(state)) return state;
  if (state.resources.bloodChits < RITUAL_BLOOD_CHITS_COST) return state;
  return withLog(
    {
      ...state,
      resources: {
        ...state.resources,
        bloodChits: state.resources.bloodChits - RITUAL_BLOOD_CHITS_COST,
      },
      nextMatchAttackBonus: state.nextMatchAttackBonus + RITUAL_ATTACK_BONUS,
    },
    "Blood chits burned for power.",
  );
}

function applyDummyCombatStep(state: ArenaState): ArenaState {
  if (!shouldRunDummyAi(state.opponentController)) return state;
  const intent = decideDummyCombatIntent(state);
  switch (intent.kind) {
    case "none":
      return state;
    case "climax":
      return fighterClimaxAttack(state, 1);
    case "basic":
      return opponentBasicAttack(state);
    case "ability":
      return performFighterAbility(state, 1, intent.slot);
  }
}

export function arenaReducer(
  state: ArenaState,
  action: ArenaReducerAction,
): ArenaState {
  switch (action.type) {
    case "NETPLAY_LOCKSTEP_FRAME":
      return applyNetplayLockstepFrame(
        arenaReducer,
        state,
        action.tickMs,
        action.p0,
        action.p1,
        action.prevP0,
        action.prevP1,
      );
    case "RESET_MATCH":
      return rematchKeepingRoster(state);
    case "SET_PLAYER_CLASS":
      return ensurePlayerFighterProfile(
        resetArenaWithPlayerClass(state, action.classId),
      );
    case "SET_PLAYER_FIGHTER":
      return ensurePlayerFighterProfile(
        createInitialArenaState(action.fighterId, state.enemyFighter.id, {
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
          combatTempo: state.combatTempo,
          opponentController: state.opponentController,
          combatStances: [DEFAULT_COMBAT_STANCE, DEFAULT_COMBAT_STANCE],
        }),
      );
    case "SET_OPPONENT_CONTROLLER":
      return ensurePlayerFighterProfile(
        createInitialArenaState(state.playerFighter.id, state.enemyFighter.id, {
          resources: state.resources,
          pendingHpPenalty: state.pendingHpPenalty,
          lastMatchResult: null,
          fighterProgress: state.fighterProgress,
          nextMatchHpBonus: state.nextMatchHpBonus,
          nextMatchAttackBonus: state.nextMatchAttackBonus,
          resourceFocus: state.resourceFocus,
          /** Keep same match index: `createInitialArenaState` does `carry + 1`. */
          matchOrdinal: state.matchOrdinal - 1,
          winStreak: state.winStreak,
          fighterProfiles: state.fighterProfiles,
          combatTempo: state.combatTempo,
          opponentController: action.controller,
          combatStances: [DEFAULT_COMBAT_STANCE, DEFAULT_COMBAT_STANCE],
        }),
      );
    case "SET_COMBAT_STANCE": {
      if (state.winner != null) return state;
      const next = structuredClone(state) as ArenaState;
      next.fighters[action.fighterIdx].combatStance = action.stance;
      return next;
    }
    case "SPEND_REINFORCE_BODY":
      return spendReinforceBody(state);
    case "SPEND_BRIBE_HANDLER":
      return spendBribeHandler(state);
    case "SPEND_BLOOD_RITUAL":
      return spendBloodRitual(state);
    case "SET_RESOURCE_FOCUS":
      return setResourceFocus(state, action.focus);
    case "BASIC_ATTACK":
      return basicAttack(state);
    case "USE_CLIMAX":
      return fighterClimaxAttack(state, 0);
    case "OPPONENT_USE_CLIMAX":
      return fighterClimaxAttack(state, 1);
    case "DASH":
      return dash(state);
    case "USE_ABILITY":
      return performPlayerAbility(state, action.slot);
    case "OPPONENT_BASIC_ATTACK":
      return opponentDiscreteBasicAttack(state);
    case "OPPONENT_DASH":
      return opponentDiscreteDash(state);
    case "OPPONENT_USE_ABILITY":
      return opponentDiscreteAbility(state, action.slot);
    case "BLOCK_START":
      return startBlock(state);
    case "BLOCK_END":
      return stopBlock(state);
    case "MOVE_LEFT":
      return moveLeft(state, action.dtMs ?? DEFAULT_MANUAL_MOVE_MS);
    case "MOVE_RIGHT":
      return moveRight(state, action.dtMs ?? DEFAULT_MANUAL_MOVE_MS);
    case "TICK": {
      if (state.winner != null) {
        return { ...state, nowMs: state.nowMs + action.dtMs };
      }
      const dt = action.dtMs;
      const next: ArenaState = {
        ...state,
        nowMs: state.nowMs + dt,
        fighters: structuredClone(state.fighters) as ArenaState["fighters"],
      };
      const [p0, p1] = next.fighters;
      const oppHuman = isOpponentHumanController(next.opponentController);

      const t0 = tickFighter(p0, dt, {
        regen: true,
        isPlayerTick: true,
        input: action.input,
        matchModifier: next.matchModifier,
        arenaNowMs: next.nowMs,
        combatTempo: next.combatTempo,
      });
      const t1 = tickFighter(p1, dt, {
        regen: oppHuman,
        isPlayerTick: oppHuman,
        input: oppHuman ? action.opponentInput : undefined,
        dummyResourceRegen: !oppHuman && p1.isDummy,
        matchModifier: next.matchModifier,
        arenaNowMs: next.nowMs,
        combatTempo: next.combatTempo,
      });
      next.fighters[0] = t0.fighter;
      next.fighters[1] = t1.fighter;

      let stepped = next;
      for (const line of [...t0.logs, ...t1.logs]) {
        stepped = withLog(stepped, line);
      }
      const player = stepped.fighters[0];
      const opponent = stepped.fighters[1];

      if (player.hp > 0) {
        const move = action.input.move;
        if (move === -1 && !player.blocking) stepped = moveLeft(stepped, dt);
        else if (move === 1 && !player.blocking) stepped = moveRight(stepped, dt);
        stepped.fighters[0].facing = resolveFacing(
          stepped.fighters[0],
          opponent,
        );
      }

      stepped = shiftOpponentTowardPlayer(stepped, dt);

      if (oppHuman && stepped.fighters[1].hp > 0) {
        const om = action.opponentInput.move;
        if (om === -1 && !stepped.fighters[1].blocking) {
          stepped = shiftFighterHorizontal(stepped, 1, -1, dt);
        } else if (om === 1 && !stepped.fighters[1].blocking) {
          stepped = shiftFighterHorizontal(stepped, 1, 1, dt);
        }
      }

      stepped.fighters[1].facing = resolveFacing(
        stepped.fighters[1],
        stepped.fighters[0],
      );
      stepped = applyDummyCombatStep(stepped);

      return evaluateWinner(stepped);
    }
  }
}
