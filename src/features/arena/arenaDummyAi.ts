import type { ArenaState } from "./arenaTypes";
import {
  ABILITY_RESOURCE_COST,
  arenaDistance,
  canUseAbility,
  fighterDef,
  isWithinRange,
} from "./arenaUtils";

export type DummyCombatIntent =
  | { kind: "none" }
  | { kind: "basic" }
  | { kind: "ability"; slot: 0 | 1 };

function abilityCooldownKey(slot: 0 | 1): "skill1" | "skill2" {
  return slot === 0 ? "skill1" : "skill2";
}

/**
 * Fixed priority, no RNG: basic attack if in range, else ability slot 0, else slot 1.
 * Each ability is only considered when its effect would be meaningful for the dummy.
 */
function abilityEligibleForDummy(state: ArenaState, slot: 0 | 1): boolean {
  const opp = state.fighters[1];
  const pl = state.fighters[0];
  const ability = opp.fighterDefinition.abilities[slot];
  const cdKey = abilityCooldownKey(slot);
  if (
    !canUseAbility(
      opp.cooldowns[cdKey],
      opp.resource,
      ABILITY_RESOURCE_COST,
    )
  ) {
    return false;
  }
  const kit = fighterDef(opp);
  const dist = arenaDistance(opp, pl);

  switch (ability.effectType) {
    case "damage":
      return isWithinRange(opp, pl, kit.attackRange);
    case "heal":
      return opp.hp < opp.hpMax;
    case "buff":
      return true;
    case "dash":
      return dist > kit.attackRange;
    case "shield":
      return true;
  }
}

export function decideDummyCombatIntent(state: ArenaState): DummyCombatIntent {
  if (state.winner != null) return { kind: "none" };
  const opp = state.fighters[1];
  const pl = state.fighters[0];
  if (!opp.isDummy || opp.hp <= 0) return { kind: "none" };

  const def = fighterDef(opp);
  if (opp.cooldowns.attack <= 0 && isWithinRange(opp, pl, def.attackRange)) {
    return { kind: "basic" };
  }
  if (abilityEligibleForDummy(state, 0)) return { kind: "ability", slot: 0 };
  if (abilityEligibleForDummy(state, 1)) return { kind: "ability", slot: 1 };
  return { kind: "none" };
}
