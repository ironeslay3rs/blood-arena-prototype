/**
 * Session round wins (FT display) — BP-41. **BP-42:** session locks after first-to; further rounds
 * don’t inflate the score until “Next set”; sim still runs round-by-round.
 */

import type { FighterRole } from "./arenaTypes";

/** Default “first to” for session display (Street Fighter / KOF locals style). */
export const ARENA_SESSION_FIRST_TO = 3;

export function formatSessionScoreLine(
  wins: [number, number],
  firstTo: number = ARENA_SESSION_FIRST_TO,
): string {
  const [p1, p2] = wins;
  return `Session · first to ${firstTo} · ${p1}–${p2}`;
}

/**
 * Who has exclusive match point (one side at N−1, the other below N−1). At 2–2 in first-to-3, use {@link sessionDeciderLine}.
 */
export function sessionMatchPointRole(
  wins: [number, number],
  firstTo: number = ARENA_SESSION_FIRST_TO,
): "player" | "opponent" | null {
  const [p1, p2] = wins;
  if (p1 >= firstTo || p2 >= firstTo) return null;
  const need = firstTo - 1;
  if (p1 === need && p2 < need) return "player";
  if (p2 === need && p1 < need) return "opponent";
  return null;
}

/** Both at N−1 — next round wins the session (e.g. 2–2 first to 3). */
export function sessionDeciderLine(
  wins: [number, number],
  firstTo: number = ARENA_SESSION_FIRST_TO,
): string | null {
  const [p1, p2] = wins;
  const need = firstTo - 1;
  if (p1 >= firstTo || p2 >= firstTo) return null;
  if (p1 === need && p2 === need) return "Next round decides the session.";
  return null;
}

export function sessionMatchPointCopy(
  role: "player" | "opponent",
): string {
  return role === "player"
    ? "Player 1 — match point for the session."
    : "Player 2 — match point for the session.";
}

export function sessionSetIsComplete(
  wins: [number, number],
  firstTo: number = ARENA_SESSION_FIRST_TO,
): boolean {
  const [p1, p2] = wins;
  return p1 >= firstTo || p2 >= firstTo;
}

/** Winner of a completed first-to-N session (one side ≥ N). */
export function sessionSetWinnerRole(
  wins: [number, number],
  firstTo: number = ARENA_SESSION_FIRST_TO,
): "player" | "opponent" | null {
  if (!sessionSetIsComplete(wins, firstTo)) return null;
  const [p1, p2] = wins;
  if (p1 > p2) return "player";
  if (p2 > p1) return "opponent";
  return null;
}

export function sessionSetCompleteHeadline(
  role: "player" | "opponent",
  wins: [number, number],
  firstTo: number = ARENA_SESSION_FIRST_TO,
): string {
  const [p1, p2] = wins;
  const label = role === "player" ? "Player 1" : "Player 2";
  return `${label} wins the set — ${p1}–${p2} (first to ${firstTo})`;
}

/**
 * If this round’s winner also reached first-to on the session score, banner copy (BP-43).
 * Returns null for exhibition rounds after the set is locked (BP-42).
 */
export function matchBannerSessionSetVictoryLine(
  roundWinner: FighterRole,
  sessionWins: [number, number],
  firstTo: number = ARENA_SESSION_FIRST_TO,
): string | null {
  if (!sessionSetIsComplete(sessionWins, firstTo)) return null;
  const setWinner = sessionSetWinnerRole(sessionWins, firstTo);
  if (setWinner == null || setWinner !== roundWinner) return null;
  return sessionSetCompleteHeadline(setWinner, sessionWins, firstTo);
}

/**
 * One line for the P2 parity strip near fighter cards (BP-44) — mirrors header session, shorter.
 */
export function p2SessionChipSummary(
  wins: [number, number],
  firstTo: number = ARENA_SESSION_FIRST_TO,
): string {
  const [p1, p2] = wins;
  const base = `FT${firstTo} · ${p1}–${p2}`;
  if (sessionSetIsComplete(wins, firstTo)) {
    return `${base} · set complete — Next set (top of screen)`;
  }
  const mp = sessionMatchPointRole(wins, firstTo);
  if (mp === "opponent") return `${base} · P2 match point`;
  if (mp === "player") return `${base} · P1 match point`;
  const dec = sessionDeciderLine(wins, firstTo);
  if (dec != null) return `${base} · next round decides`;
  return base;
}
