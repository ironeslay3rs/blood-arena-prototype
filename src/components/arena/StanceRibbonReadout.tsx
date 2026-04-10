"use client";

import type { CombatStanceId } from "@/features/arena/arenaTypes";
import { stanceRibbonCopy } from "@/features/arena/stanceRibbonReadout";
import { useMemo } from "react";

export function StanceRibbonReadout({
  p1Stance,
  p2Stance,
}: {
  p1Stance: CombatStanceId;
  p2Stance: CombatStanceId;
}) {
  const copy = useMemo(
    () => stanceRibbonCopy(p1Stance, p2Stance),
    [p1Stance, p2Stance],
  );

  return (
    <div
      className="rounded-md border border-rose-500/30 bg-rose-950/15 px-3 py-1.5 text-center text-[11px] font-medium leading-snug text-rose-100/95 dark:border-rose-600/35 dark:bg-rose-950/25"
      role="note"
      aria-label={copy.srLine}
    >
      <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400/90">
        Stance
      </span>
      <span className="mt-0.5 block tabular-nums">{copy.displayLine}</span>
    </div>
  );
}
