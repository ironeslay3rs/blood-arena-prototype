"use client";

import {
  roundStartReadabilityAnnouncement,
  roundStartReadabilityCue,
} from "@/features/arena/arenaReadabilityHints";
import type {
  MatchModifierId,
  OpponentControllerKind,
} from "@/features/arena/arenaTypes";
import { formatCombatTempoForChip } from "@/features/arena/arenaUtils";
import { matchModifierShortLabel } from "@/features/arena/matchModifiers";
import { opponentModeChipLabel } from "@/features/arena/opponentModeUi";

export function RoundStartOverlay({
  visible,
  roundNumber,
  matchModifier,
  opponentMode,
  combatTempo,
}: {
  visible: boolean;
  roundNumber: number;
  matchModifier: MatchModifierId;
  opponentMode: OpponentControllerKind;
  combatTempo: number;
}) {
  if (!visible) return null;

  const mod = matchModifierShortLabel(matchModifier);
  const modeChip = opponentModeChipLabel(opponentMode);
  const tempoChip = formatCombatTempoForChip(combatTempo);
  const cue = roundStartReadabilityCue(matchModifier, opponentMode);
  const ariaLabel = roundStartReadabilityAnnouncement({
    roundNumber,
    modifier: matchModifier,
    opponentMode,
    ruleLabel: mod,
    modeLabel: modeChip,
    tempoLabel: tempoChip,
  });

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-8 z-20 flex justify-center px-2"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <div className="round-start-toast max-w-md rounded-xl border border-rose-400/60 bg-zinc-950/92 px-4 py-2.5 text-center shadow-lg shadow-rose-950/40 backdrop-blur-sm dark:border-rose-500/45">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-rose-300/95">
          Round start
        </p>
        <p className="mt-1 text-lg font-black tabular-nums text-white">
          Round {roundNumber}
        </p>
        <p className="mt-0.5 text-xs font-medium text-zinc-300">
          Rule: <span className="text-rose-200">{mod}</span>
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
          {modeChip} · {tempoChip}
        </p>
        <div className="mt-2 border-t border-zinc-700/80 pt-2 text-left">
          <p className="text-[11px] font-semibold leading-snug text-zinc-200">
            {cue.lead}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-zinc-400">
            {cue.coachingLine}
          </p>
          <p className="mt-1.5 text-[10px] leading-snug text-zinc-500">
            {cue.contextLine}
          </p>
          {cue.p2ParityLine != null ? (
            <div className="mt-2 border-t border-emerald-800/60 pt-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/95">
                P2 on this keyboard
              </p>
              <p className="mt-1 font-mono text-[10px] leading-snug text-emerald-100/90">
                {cue.p2ParityLine}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
