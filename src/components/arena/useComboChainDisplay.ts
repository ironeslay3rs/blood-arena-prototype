"use client";

import type {
  CombatLogEntry,
  FighterRole,
  FighterState,
} from "@/features/arena/arenaTypes";
import { COMBO_CHAIN_GAP_MS } from "@/features/arena/comboChainConfig";
import {
  isBlockedDamageMessage,
  parseDamageLine,
} from "@/features/arena/combatLogParse";

/**
 * Derives **×2+** combo counts from the combat log + arena clock.
 * Blocked hits break the attacker’s chain; gap &gt; {@link COMBO_CHAIN_GAP_MS} ends display.
 */
export function useComboChainDisplay(
  log: readonly CombatLogEntry[],
  fighters: [FighterState, FighterState],
  winner: FighterRole | null,
  arenaNowMs: number,
): { p1Hits: number; p2Hits: number } {
  if (winner != null) {
    return { p1Hits: 0, p2Hits: 0 };
  }

  const youLabel = fighters[0].label;
  const oppLabel = fighters[1].label;

  let p1Count = 0;
  let p2Count = 0;
  let lastP1At = -Infinity;
  let lastP2At = -Infinity;

  for (const e of log) {
    const dmg = parseDamageLine(e.message, youLabel, oppLabel);
    if (!dmg) continue;
    const blocked = isBlockedDamageMessage(e.message);

    if (dmg.attacker === youLabel && dmg.target === oppLabel) {
      if (blocked) {
        p1Count = 0;
        continue;
      }
      if (e.atMs - lastP1At > COMBO_CHAIN_GAP_MS) p1Count = 1;
      else p1Count += 1;
      lastP1At = e.atMs;
    } else if (dmg.attacker === oppLabel && dmg.target === youLabel) {
      if (blocked) {
        p2Count = 0;
        continue;
      }
      if (e.atMs - lastP2At > COMBO_CHAIN_GAP_MS) p2Count = 1;
      else p2Count += 1;
      lastP2At = e.atMs;
    }
  }

  const p1Hits =
    arenaNowMs - lastP1At <= COMBO_CHAIN_GAP_MS && p1Count >= 2 ? p1Count : 0;
  const p2Hits =
    arenaNowMs - lastP2At <= COMBO_CHAIN_GAP_MS && p2Count >= 2 ? p2Count : 0;

  return { p1Hits, p2Hits };
}
