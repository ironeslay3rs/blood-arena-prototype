import {
  CANON_CHARACTER_DEFINITIONS,
  type CanonCharacterId,
} from "@/features/shared/canonCharacters";
import type { FighterProfile } from "./arenaTypes";

/** Rune Trials combat evolution lane (from canon faction). */
export type ProfileEvolutionPath =
  | "aggression"
  | "sustain"
  | "control"
  | "chaos";

/**
 * Small, capped modifiers from career wins. Tier 0 = below first milestone.
 * Values stay conservative so balance doesn’t hinge on profile grind.
 */
export interface ProfileEvolution {
  path: ProfileEvolutionPath;
  /** 0 = under 5 wins, 1 = 5–9 wins, 2 = 10+ wins */
  tier: 0 | 1 | 2;
  /** Bio / aggression: flat damage on the first connecting hit of the match. */
  firstHitAttackBonus: number;
  /** Pure / sustain: extra HP on ability heal and Pure passive mend. */
  healBonus: number;
  /** Mecha / control: extra shield-only tear when a hit connects vs temp shield. */
  shieldStripBonus: number;
  /** Black City / chaos: deterministic “proc” rate (0–100 scale) for a micro bonus. */
  chaosProcPercent: number;
}

export function evolutionPathForCanon(canon: CanonCharacterId): ProfileEvolutionPath {
  const faction = CANON_CHARACTER_DEFINITIONS[canon].faction;
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
 * Derives gameplay modifiers from {@link FighterProfile} wins and canon lane.
 * Milestone copy in the profile is unrelated — only `wins` and `canonCharacterId` matter here.
 */
export function getProfileEvolution(profile: FighterProfile): ProfileEvolution {
  const path = evolutionPathForCanon(profile.canonCharacterId);
  const w = profile.wins;
  const tier: 0 | 1 | 2 = w >= 10 ? 2 : w >= 5 ? 1 : 0;

  const out: ProfileEvolution = {
    path,
    tier,
    firstHitAttackBonus: 0,
    healBonus: 0,
    shieldStripBonus: 0,
    chaosProcPercent: 0,
  };

  if (tier === 0) return out;

  switch (path) {
    case "aggression":
      out.firstHitAttackBonus = tier >= 2 ? 2 : 1;
      break;
    case "sustain":
      out.healBonus = tier >= 2 ? 2 : 1;
      break;
    case "control":
      out.shieldStripBonus = tier >= 2 ? 2 : 1;
      break;
    case "chaos":
      out.chaosProcPercent = tier >= 2 ? 18 : 12;
      break;
  }

  return out;
}

/** Deterministic proc from arena time + strike index — no Math.random. */
export function chaosEvolutionBonusProc(
  nowMs: number,
  blackCityStrikeCycleAfterHit: number,
  evolution: ProfileEvolution,
): boolean {
  if (evolution.path !== "chaos" || evolution.chaosProcPercent <= 0) return false;
  const mix =
    Math.imul(nowMs >>> 5, 1103515245) ^
    Math.imul(blackCityStrikeCycleAfterHit, 12345);
  const u = (mix >>> 0) % 100;
  return u < evolution.chaosProcPercent;
}
