/** Copy + thresholds for arena announcer toasts (Blood Arena). */
export const ANNOUNCER_STINGER = {
  /** Either fighter at or below this HP% while both alive → one “clutch” line per round. */
  clutchHpFraction: 0.25,
  clutchLine: "Crunch time — finish it.",
  /** Fire a stinger when P1’s win streak hits these values (after the round). */
  streakMilestones: [3, 5, 10] as const,
} as const;

export function streakMilestoneLine(streak: number): string {
  if (streak >= 10) return `On a tear — ×${streak} and rising`;
  if (streak >= 5) return `Hot streak ×${streak}`;
  return `Streak ×${streak} — stay sharp`;
}
