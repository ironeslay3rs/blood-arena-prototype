/**
 * Player-facing coaching at round start (BP-27) — authored for clarity, not lore dumps.
 * @see docs/BLOOD_ARENA_MASTER_PLAN.md §15
 */

import type { MatchModifierId, OpponentControllerKind } from "./arenaTypes";

export type RoundStartReadabilityCue = {
  /** Matches the rule chip — reinforces the modifier name. */
  lead: string;
  /** What to *do* with that information this round. */
  coachingLine: string;
  /** How the session is framed (training / hot-seat / relay). */
  contextLine: string;
  /**
   * Hot-seat only (BP-29) — compact P2 default bindings so T2 parity holds without opening the reference drawer.
   */
  p2ParityLine?: string;
};

/** Screen-reader phrasing; keep in sync with `ArenaKeyboardReference` P2 row. */
export function hotSeatP2ControlsSrNarration(): string {
  return (
    "Player 2 moves with J and L, O to dash, U to attack, M for Climax when meter is full and in range, " +
    "I to hold block, left bracket and right bracket for skills. " +
    "Numpad alternate: 4 and 6 move, 8 dash, 5 attack, asterisk Climax, 0 block, 7 and 9 skills."
  );
}

function modifierCoaching(id: MatchModifierId): { lead: string; coachingLine: string } {
  switch (id) {
    case "faster_cooldowns":
      return {
        lead: "Skills return faster",
        coachingLine:
          "You can afford more probes—still check range before you commit big resources.",
      };
    case "reduced_hp":
      return {
        lead: "Lower life totals",
        coachingLine:
          "Trades decide rounds quickly; respect spacing and block when you’re disadvantaged.",
      };
    case "increased_damage":
      return {
        lead: "Harder hits",
        coachingLine:
          "Bursts end neutral faster—don’t sleep on defense, especially after a clean connect.",
      };
    case "unstable_resource":
      return {
        lead: "Resource rhythm shifts",
        coachingLine:
          "Block drain and regen breathe with the clock—glance at gauges before long pressure.",
      };
  }
}

function modeContext(mode: OpponentControllerKind): string {
  switch (mode) {
    case "dummy":
      return "Training — the dummy plays by the same kit rules; use it to rehearse reads.";
    case "local_human":
      return "Hot-seat — one screen, two rosters; take turns owning the log so calls stay fair.";
    case "remote":
      return "Relay lockstep — inputs sync on a fixed tick; prioritize clean spacing over mash.";
  }
}

const HOT_SEAT_P2_CONTROLS_COMPACT =
  "P2 — J/L move · O dash · U attack · M Climax · I block · [ ] skills · numpad 4/6 · 8 · 5 · * · 0 · 7/9.";

/** Copy for the round-start toast + screen readers. */
export function roundStartReadabilityCue(
  modifier: MatchModifierId,
  opponentMode: OpponentControllerKind,
): RoundStartReadabilityCue {
  const { lead, coachingLine } = modifierCoaching(modifier);
  const base: RoundStartReadabilityCue = {
    lead,
    coachingLine,
    contextLine: modeContext(opponentMode),
  };
  if (opponentMode === "local_human") {
    return { ...base, p2ParityLine: HOT_SEAT_P2_CONTROLS_COMPACT };
  }
  return base;
}

/** Full sentence for `aria-label` / polite live region on the overlay. */
export function roundStartReadabilityAnnouncement(args: {
  roundNumber: number;
  modifier: MatchModifierId;
  opponentMode: OpponentControllerKind;
  ruleLabel: string;
  modeLabel: string;
  tempoLabel: string;
}): string {
  const cue = roundStartReadabilityCue(args.modifier, args.opponentMode);
  const parts = [
    `Round ${args.roundNumber}.`,
    `Rule: ${args.ruleLabel}.`,
    `${cue.lead}. ${cue.coachingLine}`,
    `${cue.contextLine}`,
  ];
  if (args.opponentMode === "local_human") {
    parts.push(hotSeatP2ControlsSrNarration());
  }
  parts.push(`${args.modeLabel}, ${args.tempoLabel}.`);
  return parts.join(" ");
}
