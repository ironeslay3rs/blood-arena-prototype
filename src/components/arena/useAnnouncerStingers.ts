"use client";

import type { FighterRole, FighterState } from "@/features/arena/arenaTypes";
import {
  ANNOUNCER_STINGER,
  streakMilestoneLine,
} from "@/features/arena/announcerStingerConfig";
import { startTransition, useEffect, useRef, useState } from "react";

export type AnnouncerStingerPayload = {
  id: number;
  kind: "clutch" | "streak";
  line: string;
};

let stingerSeq = 0;

/**
 * Short announcer lines: clutch (low HP both alive) and streak milestones on P1 wins.
 */
export function useAnnouncerStingers(
  fighters: [FighterState, FighterState],
  winner: FighterRole | null,
  winStreak: number,
  matchOrdinal: number,
) {
  const [active, setActive] = useState<AnnouncerStingerPayload | null>(null);

  const clutchFiredForOrdinalRef = useRef<number | null>(null);
  const streakMilestonesAnnouncedRef = useRef<Set<number>>(new Set());

  const pushStinger = (payload: Omit<AnnouncerStingerPayload, "id">) => {
    stingerSeq += 1;
    startTransition(() =>
      setActive({ ...payload, id: stingerSeq }),
    );
  };

  useEffect(() => {
    if (winStreak === 0) {
      streakMilestonesAnnouncedRef.current.clear();
    }
  }, [winStreak]);

  useEffect(() => {
    if (winner != null) return;

    const [p, o] = fighters;
    if (p.hp <= 0 || o.hp <= 0) return;

    const pRatio = p.hpMax > 0 ? p.hp / p.hpMax : 1;
    const oRatio = o.hpMax > 0 ? o.hp / o.hpMax : 1;
    const clutch =
      pRatio <= ANNOUNCER_STINGER.clutchHpFraction ||
      oRatio <= ANNOUNCER_STINGER.clutchHpFraction;

    if (!clutch) return;
    if (clutchFiredForOrdinalRef.current === matchOrdinal) return;

    clutchFiredForOrdinalRef.current = matchOrdinal;
    pushStinger({
      kind: "clutch",
      line: ANNOUNCER_STINGER.clutchLine,
    });
  }, [fighters, winner, matchOrdinal]);

  useEffect(() => {
    if (winner !== "player") return;

    for (const m of ANNOUNCER_STINGER.streakMilestones) {
      if (winStreak !== m) continue;
      if (streakMilestonesAnnouncedRef.current.has(m)) continue;
      streakMilestonesAnnouncedRef.current.add(m);
      pushStinger({
        kind: "streak",
        line: streakMilestoneLine(winStreak),
      });
      break;
    }
  }, [winner, winStreak]);

  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setActive(null), 2600);
    return () => window.clearTimeout(t);
  }, [active]);

  return { active };
}
