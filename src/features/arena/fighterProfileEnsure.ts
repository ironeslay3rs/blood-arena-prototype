import {
  CANON_CHARACTER_DEFINITIONS,
  type CanonCharacterId,
} from "@/features/shared/canonCharacters";
import type { ArenaState, FighterProfile } from "./arenaTypes";
import { FIGHTER_DEFINITIONS } from "./classData";

function newProfileInstanceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `fp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createEmptyFighterProfile(canon: CanonCharacterId): FighterProfile {
  return {
    id: newProfileInstanceId(),
    canonCharacterId: canon,
    wins: 0,
    losses: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    milestoneArenaRemembersName: false,
    milestoneNoLongerPrey: false,
  };
}

/**
 * Ensures a {@link FighterProfile} exists for the current player roster row’s canon id.
 * Does not alter combat; stats stay at current values until match hooks write them.
 */
export function ensurePlayerFighterProfile(state: ArenaState): ArenaState {
  const canon = FIGHTER_DEFINITIONS[state.playerFighter.id].canonCharacterId;
  if (state.fighterProfiles[canon]) return state;
  if (!CANON_CHARACTER_DEFINITIONS[canon]) return state;
  const profile = createEmptyFighterProfile(canon);
  return {
    ...state,
    fighterProfiles: { ...state.fighterProfiles, [canon]: profile },
  };
}
