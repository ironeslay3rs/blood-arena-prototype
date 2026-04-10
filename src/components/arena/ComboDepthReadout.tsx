"use client";

import { activeComboDepthSummary } from "@/features/arena/comboDepthReadout";
import { useMemo } from "react";

export function ComboDepthReadout({
  p1Depth,
  p2Depth,
}: {
  p1Depth: number;
  p2Depth: number;
}) {
  const copy = useMemo(
    () => activeComboDepthSummary(p1Depth, p2Depth),
    [p1Depth, p2Depth],
  );

  if (!copy.visible) return null;

  return (
    <div
      className="rounded-md border border-sky-500/35 bg-sky-950/25 px-3 py-1.5 text-center text-[11px] font-medium leading-snug text-sky-100 dark:border-sky-600/40 dark:bg-sky-950/35"
      role="note"
      aria-label={copy.srLine}
    >
      <span className="text-[9px] font-bold uppercase tracking-wider text-sky-400/90">
        Expression
      </span>
      <span className="mt-0.5 block tabular-nums">{copy.displayLine}</span>
    </div>
  );
}
