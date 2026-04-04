import type { CanonCharacterId } from "@/features/shared/canonCharacters";
import type { FighterProfile } from "./arenaTypes";
import { createEmptyFighterProfile } from "./fighterProfileEnsure";

const WIN_MILESTONE_ARENA_REMEMBERS = 5;
const WIN_MILESTONE_NO_LONGER_PREY = 10;

/**
 * Updates the canon fighter profile after a match and returns log lines (summary + new milestones).
 * Milestone lines only fire when crossing the threshold this match; flags stay set in storage.
 */
export function applyMatchEndToFighterProfile(
  profiles: Record<string, FighterProfile>,
  canon: CanonCharacterId,
  displayName: string,
  outcome: "win" | "loss",
  matchDamageDealt: number,
  matchDamageTaken: number,
): { fighterProfiles: Record<string, FighterProfile>; logMessages: string[] } {
  const logMessages: string[] = [];
  const prev =
    profiles[canon] ?? createEmptyFighterProfile(canon);
  const prevWins = prev.wins;
  const prevLosses = prev.losses;

  const wins = prevWins + (outcome === "win" ? 1 : 0);
  const losses = prevLosses + (outcome === "loss" ? 1 : 0);
  const totalDamageDealt = prev.totalDamageDealt + matchDamageDealt;
  const totalDamageTaken = prev.totalDamageTaken + matchDamageTaken;

  const milestoneArenaRemembersName =
    prev.milestoneArenaRemembersName || wins >= WIN_MILESTONE_ARENA_REMEMBERS;
  const milestoneNoLongerPrey =
    prev.milestoneNoLongerPrey || wins >= WIN_MILESTONE_NO_LONGER_PREY;

  logMessages.push(`${displayName} has now survived ${wins} trials.`);

  if (outcome === "win") {
    if (
      wins >= WIN_MILESTONE_ARENA_REMEMBERS &&
      prevWins < WIN_MILESTONE_ARENA_REMEMBERS
    ) {
      logMessages.push("The arena remembers your name.");
    }
    if (
      wins >= WIN_MILESTONE_NO_LONGER_PREY &&
      prevWins < WIN_MILESTONE_NO_LONGER_PREY
    ) {
      logMessages.push("You are no longer prey.");
    }
  }

  const next: FighterProfile = {
    ...prev,
    wins,
    losses,
    totalDamageDealt,
    totalDamageTaken,
    milestoneArenaRemembersName,
    milestoneNoLongerPrey,
  };

  return {
    fighterProfiles: { ...profiles, [canon]: next },
    logMessages,
  };
}
