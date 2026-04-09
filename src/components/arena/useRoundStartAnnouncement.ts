"use client";

import type {
  FighterRole,
  OpponentControllerKind,
} from "@/features/arena/arenaTypes";
import { startTransition, useEffect, useRef, useState } from "react";

/**
 * Shows a short “round start” banner when a new match begins (ordinal advances) or on first load.
 */
export function useRoundStartAnnouncement(
  matchOrdinal: number,
  winner: FighterRole | null,
  opponentMode: OpponentControllerKind,
) {
  const [visible, setVisible] = useState(false);
  const lastShownOrdinalRef = useRef<number | null>(null);
  const visibleMs = opponentMode === "local_human" ? 5200 : 4200;

  useEffect(() => {
    if (winner != null) {
      startTransition(() => setVisible(false));
      return;
    }

    if (lastShownOrdinalRef.current === null) {
      lastShownOrdinalRef.current = matchOrdinal;
      startTransition(() => setVisible(true));
      const t = window.setTimeout(() => setVisible(false), visibleMs);
      return () => window.clearTimeout(t);
    }

    if (matchOrdinal !== lastShownOrdinalRef.current) {
      lastShownOrdinalRef.current = matchOrdinal;
      startTransition(() => setVisible(true));
      const t = window.setTimeout(() => setVisible(false), visibleMs);
      return () => window.clearTimeout(t);
    }
  }, [matchOrdinal, winner, visibleMs]);

  const roundNumber = matchOrdinal + 1;

  return { roundBannerVisible: visible, roundNumber };
}
