"use client";

import {
  ARENA_SESSION_FIRST_TO,
  p2SessionChipSummary,
  sessionSetIsComplete,
} from "@/features/arena/arenaSessionScore";

/** Hot-seat / relay: same session facts as the header, beside the cards (T2). BP-44. */
export function P2SessionParityStrip({
  sessionRoundWins,
  sessionFirstTo = ARENA_SESSION_FIRST_TO,
}: {
  sessionRoundWins: [number, number];
  sessionFirstTo?: number;
}) {
  const line = p2SessionChipSummary(sessionRoundWins, sessionFirstTo);
  const locked = sessionSetIsComplete(sessionRoundWins, sessionFirstTo);

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center text-xs leading-snug sm:text-right ${
        locked
          ? "border-violet-500/45 bg-violet-950/35 text-violet-50 dark:border-violet-500/40 dark:bg-violet-950/45"
          : "border-emerald-700/40 bg-emerald-950/25 text-emerald-50 dark:border-emerald-600/35 dark:bg-emerald-950/35"
      }`}
      role="status"
      aria-live="polite"
      aria-label={`Session score for player 2 side: ${line}`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-wide ${
          locked ? "text-violet-200/90" : "text-emerald-300/90"
        }`}
      >
        P2 read — session
      </p>
      <p className="mt-1 font-mono tabular-nums">{line}</p>
    </div>
  );
}
