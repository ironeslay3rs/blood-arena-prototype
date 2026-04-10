import type { LastBoutLedger, MatchResult } from "./arenaTypes";

/** One paragraph for the growth panel — last bout + optional streak hint. */
export function lastBoutLedgerLine(
  ledger: LastBoutLedger | null,
  winStreak: number,
): string | null {
  if (ledger == null) return null;
  const outcome = ledger.result === "win" ? "Win" : "Loss";
  const streak =
    ledger.result === "win" && winStreak >= 2
      ? ` · streak ${winStreak}`
      : "";
  return `Last bout: ${outcome}${streak} — ${ledger.resourceLine}`;
}

export function matchResultWord(r: MatchResult): string {
  return r === "win" ? "Win" : "Loss";
}
