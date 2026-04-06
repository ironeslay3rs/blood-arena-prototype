import type { ArenaState, ReputationSnapshot } from "./arenaTypes";

export function computeReputationSnapshot(input: {
  wins: number;
  losses: number;
  totalDamageDealt: number;
  /** Current run win streak (session); use 0 when not applicable. */
  winStreak: number;
  /** False when we only have W/L (no profile damage). */
  hasDamageStats: boolean;
}): ReputationSnapshot {
  const { wins, losses, totalDamageDealt, winStreak, hasDamageStats } = input;
  const games = wins + losses;

  if (winStreak >= 8) {
    return {
      title: "Unstoppable",
      descriptor: `${winStreak} wins in a row — the arena whispers your name.`,
      prestige: 4,
    };
  }
  if (hasDamageStats && totalDamageDealt >= 80_000 && wins >= 12) {
    return {
      title: "Executioner",
      descriptor: "Lethal lifetime damage — the pit knows your work.",
      prestige: 4,
    };
  }
  if (wins >= 25) {
    return {
      title: "Blood Veteran",
      descriptor: "Season after season, you return.",
      prestige: 3,
    };
  }
  if (games >= 14 && wins >= 6 && losses >= 5) {
    return {
      title: "Arena Survivor",
      descriptor: "You keep standing up — that travels.",
      prestige: 2,
    };
  }
  if (wins >= 12) {
    return {
      title: "Gladiator",
      descriptor: "A known name under the lights.",
      prestige: 2,
    };
  }
  if (wins >= 5) {
    return {
      title: "Rising threat",
      descriptor: "Word is starting to spread.",
      prestige: 1,
    };
  }
  if (wins >= 1 || games >= 3) {
    return {
      title: "Contender",
      descriptor: "You showed up. That counts.",
      prestige: 1,
    };
  }
  return {
    title: "Unproven",
    descriptor: "No reputation yet — only what you do next.",
    prestige: 0,
  };
}

const TRAINING_REPUTATION: ReputationSnapshot = {
  title: "Training target",
  descriptor: "Practice body — no record at stake.",
  prestige: 0,
};

/**
 * Reputation for either fighter using profile (when present) + progress fallback.
 * Session win streak only applies to Player 1 (index 0).
 */
export function reputationForArenaFighter(
  state: ArenaState,
  fighterIdx: 0 | 1,
): ReputationSnapshot {
  const f = state.fighters[fighterIdx];
  if (f.isDummy) return TRAINING_REPUTATION;

  const canon = f.fighterDefinition.canonCharacterId;
  const profile = state.fighterProfiles[canon];
  const prog = state.fighterProgress[f.fighterId];
  const wins = profile?.wins ?? prog.wins;
  const losses = profile?.losses ?? prog.losses;
  const dealt = profile?.totalDamageDealt ?? 0;
  const hasDamage = !!profile;

  return computeReputationSnapshot({
    wins,
    losses,
    totalDamageDealt: dealt,
    winStreak: fighterIdx === 0 ? state.winStreak : 0,
    hasDamageStats: hasDamage,
  });
}

export function matchIntroReputationLines(state: ArenaState): string[] {
  const a = reputationForArenaFighter(state, 0);
  const b = reputationForArenaFighter(state, 1);
  const p1 = state.fighters[0].label;
  const p2 = state.fighters[1].label;
  return [
    `${p1} — ${a.title}. ${a.descriptor}`,
    `${p2} — ${b.title}. ${b.descriptor}`,
  ];
}

/** Short line for win-streak reputation beats (combat log). */
export function reputationStreakLogLine(
  winStreak: number,
  title: string,
): string | null {
  if (winStreak === 3) return `Crowd noise rises — they know a ${title} when they see one.`;
  if (winStreak === 5) return `Five in a row. The handlers mark your name.`;
  if (winStreak === 10) return `Ten straight. Even the gates lean in to watch.`;
  return null;
}
