"use client";

import type { FighterRole } from "@/features/arena/arenaTypes";
import { COMBAT_JUICE } from "@/features/arena/combatJuiceConfig";
import { useEffect, useRef, useState } from "react";

/**
 * Phase 1 spectacle: one-shot presentation when {@link winner} becomes non-null.
 * Respects {@link COMBAT_JUICE.koBeatMs}; 0 disables.
 */
export function useKoBeatPresentation(winner: FighterRole | null): boolean {
  const [active, setActive] = useState(false);
  const prevWinner = useRef<FighterRole | null>(null);
  const beatEndTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const ms = COMBAT_JUICE.koBeatMs;
    const prev = prevWinner.current;

    if (ms <= 0) {
      prevWinner.current = winner;
      return;
    }

    if (prev === null && winner !== null) {
      prevWinner.current = winner;
      let cancelled = false;

      queueMicrotask(() => {
        if (cancelled) return;
        setActive(true);
        if (beatEndTimeoutRef.current !== null) {
          window.clearTimeout(beatEndTimeoutRef.current);
        }
        beatEndTimeoutRef.current = window.setTimeout(() => {
          beatEndTimeoutRef.current = null;
          setActive(false);
        }, ms);
      });

      return () => {
        cancelled = true;
        if (beatEndTimeoutRef.current !== null) {
          window.clearTimeout(beatEndTimeoutRef.current);
          beatEndTimeoutRef.current = null;
        }
        setActive(false);
      };
    }

    prevWinner.current = winner;
  }, [winner]);

  return active;
}
