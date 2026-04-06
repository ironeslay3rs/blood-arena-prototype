import { CANON_CHARACTER_DEFINITIONS } from "@/features/shared/canonCharacters";
import type { ArenaState, FighterKeyTrait, UnifiedFighterIdentity } from "./arenaTypes";
import { createEmptyFighterProfile } from "./fighterProfileEnsure";
import { getProfileEvolution } from "./fighterProfileEvolution";
import { reputationForArenaFighter } from "./fighterReputation";
import { levelFromWins } from "./fighterProgress";

const TRAIT_DISPLAY: Record<FighterKeyTrait, string> = {
  aggression: "Aggression",
  sustain: "Sustain",
  control: "Control",
  chaos: "Chaos",
};

const EVOLUTION_TIER_DISPLAY: Record<0 | 1 | 2, string> = {
  0: "Latent",
  1: "Tier I",
  2: "Tier II",
};

function arenaTitleFrom(
  tier: 0 | 1 | 2,
  milestoneName: boolean,
  milestonePrey: boolean,
): string {
  if (milestonePrey) return "No longer prey";
  if (milestoneName) return "Named in the arena";
  if (tier >= 2) return "Veteran";
  if (tier >= 1) return "Hunter";
  return "Unranked";
}

/** One strong identity line — trait × tier, with milestone peaks. */
function identityLineFrom(
  trait: FighterKeyTrait,
  tier: 0 | 1 | 2,
  milestoneName: boolean,
  milestonePrey: boolean,
): string {
  if (milestonePrey) return "Survivor of blood matches";
  if (milestoneName) return "The arena speaks your name";
  const byTrait: Record<FighterKeyTrait, [string, string, string]> = {
    aggression: [
      "Hunger in every exchange",
      "Predator of the arena",
      "They break before you do",
    ],
    sustain: [
      "Still on your feet",
      "Unbroken striker",
      "Outlasts the storm",
    ],
    control: [
      "Measured hands",
      "Architect of the lane",
      "Nothing wasted, nothing given",
    ],
    chaos: [
      "Edge of the knife",
      "Wild card of the pit",
      "Patternless and cruel",
    ],
  };
  return byTrait[trait][tier];
}

/**
 * Builds the single identity view for the human player from arena state.
 * Record and milestones come from {@link ArenaState.fighterProfiles} for the current canon id
 * (the persistent source updated at match end).
 */
export function buildUnifiedPlayerIdentity(
  state: ArenaState,
): UnifiedFighterIdentity {
  const player = state.fighters[0];
  const canon = player.fighterDefinition.canonCharacterId;
  const profile =
    state.fighterProfiles[canon] ?? createEmptyFighterProfile(canon);
  const evo = getProfileEvolution(profile);
  const canonName = CANON_CHARACTER_DEFINITIONS[canon].name;
  const rosterName = state.playerFighter.name;
  const nicknameRaw = profile.nickname?.trim();
  const nickname = nicknameRaw ? nicknameRaw : undefined;
  const displayName = nickname ?? canonName;
  const trait = evo.path as FighterKeyTrait;

  return {
    arenaLabel: player.label,
    rosterName,
    canonName,
    nickname,
    displayName,
    wins: profile.wins,
    losses: profile.losses,
    level: levelFromWins(profile.wins),
    evolutionTier: evo.tier,
    keyTrait: trait,
    keyTraitDisplay: TRAIT_DISPLAY[trait],
    evolutionTierDisplay: EVOLUTION_TIER_DISPLAY[evo.tier],
    arenaTitle: arenaTitleFrom(
      evo.tier,
      profile.milestoneArenaRemembersName,
      profile.milestoneNoLongerPrey,
    ),
    identityLine: identityLineFrom(
      trait,
      evo.tier,
      profile.milestoneArenaRemembersName,
      profile.milestoneNoLongerPrey,
    ),
    totalDamageDealt: profile.totalDamageDealt,
    totalDamageTaken: profile.totalDamageTaken,
    milestoneArenaRemembersName: profile.milestoneArenaRemembersName,
    milestoneNoLongerPrey: profile.milestoneNoLongerPrey,
    reputation: reputationForArenaFighter(state, 0),
  };
}
