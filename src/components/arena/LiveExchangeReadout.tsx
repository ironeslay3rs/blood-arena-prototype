"use client";

import { lastLiveExchangeReadout } from "@/features/arena/arenaLiveExchangeReadout";
import type { CombatLogEntry } from "@/features/arena/arenaTypes";
import { useMemo } from "react";

export function LiveExchangeReadout({ log }: { log: CombatLogEntry[] }) {
  const readout = useMemo(() => lastLiveExchangeReadout(log), [log]);

  if (readout == null) return null;

  const tone =
    readout.kind === "clean" || readout.kind === "climax_clean"
      ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-100 dark:border-emerald-600/35"
      : readout.kind === "blocked" || readout.kind === "climax_blocked"
        ? "border-amber-500/40 bg-amber-950/30 text-amber-100 dark:border-amber-600/35"
        : readout.kind === "whiff"
          ? "border-zinc-500/40 bg-zinc-900/50 text-zinc-300"
          : readout.kind === "climax"
            ? "border-fuchsia-500/40 bg-fuchsia-950/35 text-fuchsia-100 dark:border-fuchsia-600/40"
            : "border-zinc-600/50 bg-zinc-900/40 text-zinc-300";

  return (
    <div
      className={`rounded-md border px-3 py-1.5 text-center text-[11px] font-medium leading-snug ${tone}`}
      role="note"
      aria-label={`Exchange readout. ${readout.srLine}`}
    >
      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
        Last exchange
      </span>
      <span className="mt-0.5 block">{readout.displayLine}</span>
    </div>
  );
}
