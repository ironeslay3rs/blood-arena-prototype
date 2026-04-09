import type { CombatLogEntry, FighterRole, FighterState } from "./arenaTypes";

/** Log lines emitted when a fighter hits 0 HP (see `evaluateWinner`). */
const KO_LINE_RE =
  /Player 1 is down\.|Player 2 is down\.|Training opponent down/;

function findLastKoLogIndex(log: readonly CombatLogEntry[]): number {
  for (let i = log.length - 1; i >= 0; i--) {
    if (KO_LINE_RE.test(log[i]!.message)) return i;
  }
  return -1;
}

function isLogNoise(entry: CombatLogEntry): boolean {
  return entry.message === "\u200b";
}

function parseDamageToTarget(
  message: string,
  loserLabel: string,
): "clean" | "blocked" | null {
  const needle = ` ${loserLabel} for `;
  if (!message.includes(needle)) return null;
  if (message.includes("(no damage)")) return null;
  if (message.includes("(clean)")) return "clean";
  if (message.includes("(blocked)")) return "blocked";
  return null;
}

function winnerUnleashedClimaxRecently(
  entries: readonly CombatLogEntry[],
  winnerLabel: string,
): boolean {
  return entries.some(
    (e) =>
      e.message.startsWith(`${winnerLabel} `) &&
      e.message.includes("unleashes"),
  );
}

export type RoundRecapKind =
  | "climax"
  | "clean_finisher"
  | "blocked_chip"
  | "unknown";

export interface RoundResolveReadability {
  kind: RoundRecapKind;
  /** One honest line for the match banner (round over). */
  causeLine: string;
  /** Screen reader string (combined with outcome elsewhere if desired). */
  srAnnouncement: string;
}

/**
 * Derives a short, log-faithful recap of *how* the round ended — no extra sim state.
 * Supports design promise “I can read why I lost” (master plan §15.1) and rubric T3.
 */
export function roundResolveReadability(
  winner: FighterRole,
  fighters: readonly [FighterState, FighterState],
  log: readonly CombatLogEntry[],
): RoundResolveReadability {
  const [p1, p2] = fighters;
  const winnerFighter = winner === "player" ? p1 : p2;
  const loserFighter = winner === "player" ? p2 : p1;
  const winLabel = winnerFighter.label;
  const loseLabel = loserFighter.label;

  const koIdx = findLastKoLogIndex(log);
  const preKo =
    koIdx <= 0
      ? ([] as CombatLogEntry[])
      : log.slice(0, koIdx).filter((e) => !isLogNoise(e));

  const climaxWindow = preKo.slice(Math.max(0, preKo.length - 12));
  const climaxRecent = winnerUnleashedClimaxRecently(climaxWindow, winLabel);

  let lastDamageKind: "clean" | "blocked" | null = null;
  for (let i = preKo.length - 1; i >= 0; i--) {
    const k = parseDamageToTarget(preKo[i]!.message, loseLabel);
    if (k) {
      lastDamageKind = k;
      break;
    }
  }

  if (climaxRecent) {
    return {
      kind: "climax",
      causeLine:
        "Deciding stretch: the winner landed Climax pressure before the KO.",
      srAnnouncement:
        "Round recap. The winning fighter used Climax in the final exchange window.",
    };
  }
  if (lastDamageKind === "clean") {
    return {
      kind: "clean_finisher",
      causeLine:
        "Deciding hit: last damage to the fallen fighter was clean (not guarded).",
      srAnnouncement:
        "Round recap. Last damage to the fallen fighter was a clean hit.",
    };
  }
  if (lastDamageKind === "blocked") {
    return {
      kind: "blocked_chip",
      causeLine:
        "Deciding hit: last damage was through guard — chip closed it out.",
      srAnnouncement:
        "Round recap. Last damage to the fallen fighter was blocked-type chip.",
    };
  }
  return {
    kind: "unknown",
    causeLine:
      "Tip: the combat log has the exact final hits if you want frame-by-frame detail.",
    srAnnouncement:
      "Round recap. Open the combat log for the exact final exchange.",
  };
}
