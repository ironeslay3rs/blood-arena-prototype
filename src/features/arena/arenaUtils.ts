import type {
  ClassId,
  CooldownsMs,
  Faction,
  FighterDefinition,
  FighterState,
} from "./arenaTypes";
import {
  DEFAULT_COMBAT_STANCE,
  type CombatStanceId,
} from "./combatStance";
import { CLASS_DATA, type ClassDefinition } from "./classData";
import { levelStatBonuses } from "./fighterProgress";

export const ARENA_WIDTH = 100;

/** Resource spent per ability use (shared by player, dummy AI, and UI). */
export const ABILITY_RESOURCE_COST = 20;

const RESOURCE_LABEL: Record<FighterDefinition["resourceType"], string> = {
  rage: "Rage",
  conviction: "Conviction",
  heat: "Heat",
  instability: "Instability",
};

const RESOURCE_BAR_FILL: Record<FighterDefinition["resourceType"], string> = {
  rage: "bg-red-600",
  conviction: "bg-amber-500",
  heat: "bg-orange-500",
  instability: "bg-violet-600",
};

/** Which combat kit template backs this faction until skills are per-card. */
export function combatKitForFaction(faction: Faction): ClassId {
  switch (faction) {
    case "Bio":
      return "werewolf";
    case "Pure":
      return "paladin";
    case "Mecha":
    case "Black City":
      return "silver-knight";
  }
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Keeps resource in [0, resourceMax]. */
export function clampResource(amount: number, resourceMax: number): number {
  return clamp(amount, 0, resourceMax);
}

/** Keeps HP in [0, hpMax]. */
export function clampHp(hp: number, hpMax: number): number {
  return clamp(hp, 0, hpMax);
}

/** Display-only chip for HUD (−3…+3, same clamp as tempo panel). */
export function formatCombatTempoForChip(tempo: number): string {
  const t = Math.min(3, Math.max(-3, Math.round(tempo)));
  if (t === 0) return "Tempo 0";
  return `Tempo ${t > 0 ? "+" : ""}${t}`;
}

export function arenaDistance(a: FighterState, b: FighterState): number {
  return Math.abs(a.x - b.x);
}

/** Range check for melee / skills (distance in arena units). */
export function isWithinRange(
  a: FighterState,
  b: FighterState,
  maxRange: number,
): boolean {
  return arenaDistance(a, b) <= maxRange;
}

/** Advance all ability cooldowns by dtMs toward zero. */
export function tickCooldowns(cd: CooldownsMs, dtMs: number): CooldownsMs {
  return {
    dash: Math.max(0, cd.dash - dtMs),
    attack: Math.max(0, cd.attack - dtMs),
    skill1: Math.max(0, cd.skill1 - dtMs),
    skill2: Math.max(0, cd.skill2 - dtMs),
  };
}

export function canUseAbility(
  cdMs: number,
  resource: number,
  cost: number,
): boolean {
  return cdMs <= 0 && resource >= cost;
}

/**
 * Effective combat row: kit from `classId` with HP/attack/move/display overridden
 * by the fighter’s BMRT `FighterDefinition`.
 */
export function fighterDef(f: FighterState): ClassDefinition {
  const base = CLASS_DATA[f.classId];
  const d = f.fighterDefinition;
  const rt = d.resourceType;
  return {
    ...base,
    displayName: d.name,
    resourceLabel: RESOURCE_LABEL[rt],
    resourceBarFillClass: RESOURCE_BAR_FILL[rt],
    hpMax: d.maxHealth,
    moveSpeedPerSec: d.movementSpeed,
    attackDamage: d.baseAttack,
  };
}

/**
 * Spawns runtime {@link FighterState} from roster data. Preserves
 * {@link FighterDefinition.canonCharacterId} and all kit fields via spread into `effectiveDef`.
 */
export function makeFighterFromDefinition(
  role: FighterState["role"],
  definition: FighterDefinition,
  opts: {
    x: number;
    label: string;
    isDummy: boolean;
    hpMaxOverride?: number;
    /** Level 1 = card baseline; higher levels add small max HP and base attack. */
    progressionLevel?: number;
    /** One-match prep bonus (blood ritual); cleared after spawn. */
    flatAttackBonus?: number;
    combatStance?: CombatStanceId;
  },
): FighterState {
  const classId = combatKitForFaction(definition.faction);
  const kit = CLASS_DATA[classId];
  const level = opts.progressionLevel ?? 1;
  const { hp: hpBonus, atk: atkBonus } = levelStatBonuses(level);
  const prepAtk = opts.flatAttackBonus ?? 0;
  const effectiveDef: FighterDefinition = {
    ...definition,
    maxHealth: definition.maxHealth + hpBonus,
    baseAttack: definition.baseAttack + atkBonus + prepAtk,
  };
  const cap = opts.hpMaxOverride ?? effectiveDef.maxHealth;
  return {
    role,
    fighterId: definition.id,
    fighterDefinition: effectiveDef,
    classId,
    label: opts.label,
    x: clamp(opts.x, 0, ARENA_WIDTH),
    facing: 1,
    hp: cap,
    hpMax: cap,
    resource: kit.resourceMax,
    resourceMax: kit.resourceMax,
    blocking: false,
    cooldowns: {
      dash: 0,
      attack: 0,
      skill1: 0,
      skill2: 0,
    },
    isDummy: opts.isDummy,
    tempShield: 0,
    damageBonusNextAttack: 0,
    bioFuryUntilMs: 0,
    mechaIonAccumulatorMs: 0,
    blackCityStrikeCycle: 0,
    blackCityAbilityIndex: 0,
    pureSoulLogSilenceUntilMs: 0,
    nearDeathFlavorLogged: false,
    openingStrikeConsumed: false,
    climaxMeter: 0,
    cancelWindowUntilMs: 0,
    comboChainDepth: 0,
    comboChainExpireAtMs: 0,
    combatStance: opts.combatStance ?? DEFAULT_COMBAT_STANCE,
  };
}
