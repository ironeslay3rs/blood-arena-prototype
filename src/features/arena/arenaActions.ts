import type {
  AbilityDefinition,
  ArenaReducerAction,
  ArenaState,
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

const MAX_LOG = 48;
const DEFAULT_MANUAL_MOVE_MS = 16;

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

function withLog(state: ArenaState, message: string): ArenaState {
  const id = `${state.nowMs}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    ...state,
    log: [...state.log, { id, atMs: state.nowMs, message }].slice(-MAX_LOG),
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
  if (attackerIdx === 0) {
    const pre = state.fighters[0];
    if (!pre.openingStrikeConsumed) {
      const canon = pre.fighterDefinition.canonCharacterId;
      const profile =
        state.fighterProfiles[canon] ?? createEmptyFighterProfile(canon);
      const evo = getProfileEvolution(profile);
      if (evo.path === "aggression" && evo.firstHitAttackBonus > 0) {
        raw += evo.firstHitAttackBonus;
      }
    }
  }
  if (state.matchModifier === "increased_damage") {
    raw *= MATCH_INCREASED_DAMAGE_MULT;
  }
  if (raw <= 0) return state;
  const next = structuredClone(state) as ArenaState;
  const attacker = next.fighters[attackerIdx];
  const target = next.fighters[targetIdx];
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
      fighterProgress: recordPlayerLoss(state),
      winner: "opponent",
      lastMatchResult: "loss",
      pendingHpPenalty: nextPenalty,
      winStreak: 0,
      log: [
        ...state.log,
        {
          id: `win-${state.nowMs}`,
          atMs: state.nowMs,
          message: "You were defeated.",
        },
      ].slice(-MAX_LOG),
    };
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
    let { delta, logLines } = buildWinResourceRewards(state);
    delta = scaleWinRewardDelta(
      delta,
      winStreakRewardMultiplier(nextStreak),
    );
    const nextResources = addArenaResources(state.resources, delta);
    let s: ArenaState = {
      ...state,
      fighterProgress: recordPlayerWin(state),
      winner: "player",
      lastMatchResult: "win",
      resources: nextResources,
      pendingHpPenalty: 0,
      winStreak: nextStreak,
      log: [
        ...state.log,
        {
          id: `win-${state.nowMs}`,
          atMs: state.nowMs,
          message: "Training dummy destroyed. Victory!",
        },
      ].slice(-MAX_LOG),
    };
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
      next.resource + (def.resourceRegenPerSec * resMult * dtMs) / 1000,
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

function shiftPlayerHorizontal(
  state: ArenaState,
  direction: -1 | 1,
  dtMs: number,
): ArenaState {
  if (state.winner != null) return state;
  const player = state.fighters[0];
  if (player.hp <= 0 || player.blocking) return state;
  const def = fighterDef(player);
  const next = structuredClone(state) as ArenaState;
  const p = next.fighters[0];
  p.x = clamp(
    p.x + direction * def.moveSpeedPerSec * (dtMs / 1000),
    0,
    ARENA_WIDTH,
  );
  p.facing = resolveFacing(p, next.fighters[1]);
  return next;
}

function moveLeft(state: ArenaState, dtMs: number): ArenaState {
  return shiftPlayerHorizontal(state, -1, dtMs);
}

function moveRight(state: ArenaState, dtMs: number): ArenaState {
  return shiftPlayerHorizontal(state, 1, dtMs);
}

function dash(state: ArenaState): ArenaState {
  if (state.winner != null) return state;
  const next = structuredClone(state) as ArenaState;
  const player = next.fighters[0];
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

function basicAttack(state: ArenaState): ArenaState {
  if (state.winner != null) return state;
  const player = state.fighters[0];
  const opponent = state.fighters[1];
  const def = fighterDef(player);
  if (player.hp <= 0) return state;
  if (player.cooldowns.attack > 0) return state;

  if (!isWithinRange(player, opponent, def.attackRange)) {
    return withLog(state, `${player.label} attacked — out of range.`);
  }

  const next = structuredClone(state) as ArenaState;
  const p = next.fighters[0];
  const bonus = p.damageBonusNextAttack;
  p.damageBonusNextAttack = 0;
  p.cooldowns.attack = def.attackCooldownMs;
  let s = withLog(next, `${p.label} attacked.`);
  const strike =
    def.attackDamage + bonus + bioFuryDamageBonus(p, state.nowMs);
  s = applyDamageTo(s, 0, 1, strike, "hit");
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
      if (actorIdx === 0) {
        const canon = state.fighters[0].fighterDefinition.canonCharacterId;
        const profile =
          state.fighterProfiles[canon] ?? createEmptyFighterProfile(canon);
        const evo = getProfileEvolution(profile);
        if (evo.path === "sustain") healAmt += evo.healBonus;
      }
      p.hp = clampHp(p.hp + healAmt, p.hpMax);
      const gained = Math.round(p.hp - before);
      return evaluateWinner(
        withLog(
          state,
          `${p.label} healed ${gained} HP with ${ability.name}.`,
        ),
      );
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
  if (ability.effectType === "damage") {
    if (!isWithinRange(actor, opponent, kit.attackRange)) {
      return withLog(
        state,
        `${actor.label} tried ${ability.name} — out of range.`,
      );
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
    if (actorIdx === 0) {
      const canon = state.fighters[0].fighterDefinition.canonCharacterId;
      const profile =
        state.fighterProfiles[canon] ?? createEmptyFighterProfile(canon);
      const evo = getProfileEvolution(profile);
      if (evo.path === "sustain") mend += evo.healBonus;
    }
    actor.hp = clampHp(actor.hp + mend, actor.hpMax);
    if (
      actor.hp > before &&
      state.nowMs >= actor.pureSoulLogSilenceUntilMs
    ) {
      actor.pureSoulLogSilenceUntilMs =
        state.nowMs + PURE_SOUL_LOG_COOLDOWN_MS;
      s = withLog(s, "The soul responds");
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

function shiftOpponentTowardPlayer(
  state: ArenaState,
  dtMs: number,
): ArenaState {
  if (state.winner != null) return state;
  const opp = state.fighters[1];
  const pl = state.fighters[0];
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

function opponentBasicAttack(state: ArenaState): ArenaState {
  if (state.winner != null) return state;
  const opp = state.fighters[1];
  const pl = state.fighters[0];
  const def = fighterDef(opp);
  if (!opp.isDummy || opp.hp <= 0 || opp.cooldowns.attack > 0) return state;
  if (!isWithinRange(opp, pl, def.attackRange)) return state;

  const next = structuredClone(state) as ArenaState;
  const o = next.fighters[1];
  const bonus = o.damageBonusNextAttack;
  o.damageBonusNextAttack = 0;
  o.cooldowns.attack = def.attackCooldownMs;
  let s = withLog(next, `${o.label} attacked.`);
  const strike =
    def.attackDamage + bonus + bioFuryDamageBonus(o, state.nowMs);
  s = applyDamageTo(s, 1, 0, strike, "hit");
  return s;
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
  const intent = decideDummyCombatIntent(state);
  switch (intent.kind) {
    case "none":
      return state;
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
        }),
      );
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
    case "DASH":
      return dash(state);
    case "USE_ABILITY":
      return performPlayerAbility(state, action.slot);
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

      const t0 = tickFighter(p0, dt, {
        regen: true,
        isPlayerTick: true,
        input: action.input,
        matchModifier: next.matchModifier,
        arenaNowMs: next.nowMs,
      });
      const t1 = tickFighter(p1, dt, {
        regen: false,
        isPlayerTick: false,
        dummyResourceRegen: p1.isDummy,
        matchModifier: next.matchModifier,
        arenaNowMs: next.nowMs,
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
      stepped.fighters[1].facing = resolveFacing(
        stepped.fighters[1],
        stepped.fighters[0],
      );
      stepped = applyDummyCombatStep(stepped);

      return evaluateWinner(stepped);
    }
  }
}
