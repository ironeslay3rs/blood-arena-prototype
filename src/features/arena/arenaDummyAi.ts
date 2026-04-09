import type { ArenaState, Faction } from "./arenaTypes";
import { arenaDeterministic01 } from "./arenaResources";
import { CLIMAX_METER_MAX } from "./climaxMeterConfig";
import {
  ABILITY_RESOURCE_COST,
  arenaDistance,
  canUseAbility,
  fighterDef,
  isWithinRange,
} from "./arenaUtils";

export type DummyCombatIntent =
  | { kind: "none" }
  | { kind: "climax" }
  | { kind: "basic" }
  | { kind: "ability"; slot: 0 | 1 };

function abilityCooldownKey(slot: 0 | 1): "skill1" | "skill2" {
  return slot === 0 ? "skill1" : "skill2";
}

/**
 * Maps dummy faction to the same “lane” used elsewhere for combat identity
 * (Bio = aggression, Pure = sustain, Mecha = control, Black City = chaos).
 */
type AiCombatLane = "aggression" | "sustain" | "control" | "chaos";

function aiLaneForFaction(faction: Faction): AiCombatLane {
  switch (faction) {
    case "Bio":
      return "aggression";
    case "Pure":
      return "sustain";
    case "Mecha":
      return "control";
    case "Black City":
      return "chaos";
  }
}

/**
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

/** Basic attack or a damage ability — subject to “panic” survival rules. */
function isOffensiveIntent(
  intent: DummyCombatIntent,
  state: ArenaState,
): boolean {
  if (intent.kind === "climax") return true;
  if (intent.kind === "basic") return true;
  if (intent.kind === "ability") {
    const ab = state.fighters[1].fighterDefinition.abilities[intent.slot];
    return ab.effectType === "damage";
  }
  return false;
}

/**
 * Same priority as the legacy AI: basic (if in range & off CD) → ability 0 → ability 1.
 * Index 0 = best, index 1 = second-best when present.
 */
function buildOrderedOptions(state: ArenaState): DummyCombatIntent[] {
  const opp = state.fighters[1];
  const pl = state.fighters[0];
  const def = fighterDef(opp);
  const out: DummyCombatIntent[] = [];

  if (
    opp.climaxMeter >= CLIMAX_METER_MAX &&
    opp.cooldowns.attack <= 0 &&
    isWithinRange(opp, pl, def.attackRange)
  ) {
    out.push({ kind: "climax" });
  }
  if (opp.cooldowns.attack <= 0 && isWithinRange(opp, pl, def.attackRange)) {
    out.push({ kind: "basic" });
  }
  if (abilityEligibleForDummy(state, 0)) {
    out.push({ kind: "ability", slot: 0 });
  }
  if (abilityEligibleForDummy(state, 1)) {
    out.push({ kind: "ability", slot: 1 });
  }
  return out;
}

/**
 * Training dummy AI with controlled imperfection:
 *
 * 1) Decision noise — second-best pick uses {@link arenaDeterministic01} (same
 *    state + tick always → same choice; rollback-safe).
 *    - Default lanes: threshold in [10%, 15%].
 *    - Chaos (Black City): fixed 30%.
 *
 * 2) Sustain (Pure) — if current HP fraction &lt; 40% (“survival” low), 50% (det.)
 *    to skip offensive actions entirely (holds back when dying).
 *
 * 3) Aggression (Bio) — same low-HP band, but ignores that panic rule 70% of the
 *    time; the remaining 30% × 50% det. branch is the “bail” mix.
 *
 * Control / chaos lanes do not add the sustain cancel (they keep pressing or use
 * noise only); chaos still gets the stronger second-best rate above.
 */
export function decideDummyCombatIntent(state: ArenaState): DummyCombatIntent {
  if (state.winner != null) return { kind: "none" };
  const opp = state.fighters[1];
  if (!opp.isDummy || opp.hp <= 0) return { kind: "none" };

  const options = buildOrderedOptions(state);
  if (options.length === 0) return { kind: "none" };

  const lane = aiLaneForFaction(opp.fighterDefinition.faction);

  let chosen = options[0]!;

  if (options.length >= 2) {
    const secondBestChance =
      lane === "chaos" ? 0.3 : 0.1 + arenaDeterministic01(state, 0xda11) * 0.05;
    if (arenaDeterministic01(state, 0xda22) < secondBestChance) {
      chosen = options[1]!;
    }
  }

  const hpRatio = opp.hpMax > 0 ? opp.hp / opp.hpMax : 1;
  const lowSurvival = hpRatio < 0.4;

  if (lowSurvival && isOffensiveIntent(chosen, state)) {
    if (lane === "sustain") {
      if (arenaDeterministic01(state, 0xda33) < 0.5) {
        return { kind: "none" };
      }
    } else if (lane === "aggression") {
      if (
        arenaDeterministic01(state, 0xda44) < 0.3 &&
        arenaDeterministic01(state, 0xda55) < 0.5
      ) {
        return { kind: "none" };
      }
    }
  }

  return chosen;
}
