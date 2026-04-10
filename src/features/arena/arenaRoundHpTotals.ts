/**
 * Post-round HP damage totals from arena bookkeeping (BP-33).
 * P1 counters come from the sim; in 1v1, P2 exchange mirrors (dealt to P1 = P2’s outgoing HP damage to P1).
 */

export type RoundHpExchangeTotals = {
  p1Dealt: number;
  p1Taken: number;
  p2Dealt: number;
  p2Taken: number;
};

export function roundHpExchangeTotals(state: {
  matchPlayerDamageDealt: number;
  matchPlayerDamageTaken: number;
}): RoundHpExchangeTotals {
  const p1Dealt = state.matchPlayerDamageDealt;
  const p1Taken = state.matchPlayerDamageTaken;
  return {
    p1Dealt,
    p1Taken,
    p2Dealt: p1Taken,
    p2Taken: p1Dealt,
  };
}

/** One line for screen readers (both sides). */
export function roundHpExchangeSrAnnouncement(t: RoundHpExchangeTotals): string {
  return (
    `Round HP through hits: Player 1 dealt ${t.p1Dealt} and took ${t.p1Taken}. ` +
    `Player 2 dealt ${t.p2Dealt} and took ${t.p2Taken}.`
  );
}
