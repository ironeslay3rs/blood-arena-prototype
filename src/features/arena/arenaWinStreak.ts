import type { ArenaResources } from "./arenaTypes";

/** +10% reward per consecutive win (applied after this win). */
export const STREAK_REWARD_PCT_PER = 0.1;
/** Max +50% from streak. */
export const STREAK_REWARD_MAX_PCT = 0.5;

/** Extra max-HP penalty per streak step when you lose (on top of base loss step). */
export const STREAK_LOSS_EXTRA_PER = 6;
export const STREAK_LOSS_EXTRA_MAX = 36;

/** Ceiling for total pending HP penalty including streak pressure. */
export const LOSS_STREAK_ABSOLUTE_HP_CAP = 78;

export function winStreakRewardMultiplier(streakAfterWin: number): number {
  const s = Math.max(0, streakAfterWin);
  const bonus = Math.min(STREAK_REWARD_MAX_PCT, s * STREAK_REWARD_PCT_PER);
  return 1 + bonus;
}

export function scaleWinRewardDelta(
  delta: ArenaResources,
  mult: number,
): ArenaResources {
  const q = (n: number) => Math.max(0, Math.round(n * mult));
  return {
    credits: q(delta.credits),
    ironheart: q(delta.ironheart),
    bloodChits: q(delta.bloodChits),
    lumens: q(delta.lumens),
    scrap: q(delta.scrap),
    parts: q(delta.parts),
  };
}

export function streakLossExtraPenalty(currentStreak: number): number {
  const s = Math.max(0, currentStreak);
  return Math.min(STREAK_LOSS_EXTRA_MAX, s * STREAK_LOSS_EXTRA_PER);
}
