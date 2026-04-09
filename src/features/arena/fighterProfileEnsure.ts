import {
  CANON_CHARACTER_DEFINITIONS,
  type CanonCharacterId,
} from "@/features/shared/canonCharacters";
import type { ArenaState, FighterProfile } from "./arenaTypes";
import { FIGHTER_DEFINITIONS } from "./classData";

/**
 * Stable document id per canon (offline BMRT). Survives refresh; no RNG — see `simDeterminism.ts`.
 */
export function fighterProfileDocumentId(canon: CanonCharacterId): string {
  return `fp-bmrt-${canon}`;
}

export function createEmptyFighterProfile(canon: CanonCharacterId): FighterProfile {
  return {
    id: fighterProfileDocumentId(canon),
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
