"use client";

import type {
  CombatLogEntry,
  FighterState,
} from "@/features/arena/arenaTypes";
import {
  isBlockedDamageMessage,
  parseClimaxUnleashLine,
  parseDamageLine,
} from "@/features/arena/combatLogParse";
import { useEffect, useLayoutEffect, useRef } from "react";
import { vibrateCombat, type CombatAudioController } from "./combatAudio";

export function useCombatSounds(
  log: CombatLogEntry[],
  fighters: [FighterState, FighterState],
  enabled: boolean,
  audio: CombatAudioController | null,
) {
  const cursorRef = useRef(0);
  const didInitRef = useRef(false);
  const fightersRef = useRef(fighters);

  useLayoutEffect(() => {
    fightersRef.current = fighters;
  });

  useEffect(() => {
    if (!audio) return;

    if (log.length < cursorRef.current) {
      cursorRef.current = 0;
      didInitRef.current = false;
    }

    if (!didInitRef.current) {
      didInitRef.current = true;
      cursorRef.current = log.length;
      return;
    }

    const [you, opp] = fightersRef.current;
    const youLabel = you.label;
    const oppLabel = opp.label;
    const newEntries = log.slice(cursorRef.current);
    cursorRef.current = log.length;

    if (!enabled) return;

    for (const entry of newEntries) {
      if (entry.kind === "tempo" && !entry.evolutionCue) continue;
      if (entry.evolutionCue === "first_hit_impact") continue;

      const msg = entry.message;
      const climax = parseClimaxUnleashLine(msg);
      if (climax) {
        const f = fightersRef.current.find(
          (x) => x.label === climax.attackerLabel,
        );
        if (f) {
          audio.playClimaxConnect(
            f.fighterId,
            f.fighterDefinition.faction,
          );
          vibrateCombat([20, 45, 25]);
        }
        continue;
      }

      const dmg = parseDamageLine(msg, youLabel, oppLabel);
      if (!dmg) continue;

      const blocked = isBlockedDamageMessage(msg);
      const kind = blocked
        ? "blocked_hit"
        : dmg.attacker === youLabel && dmg.target === oppLabel
          ? "player_hit"
          : dmg.attacker === oppLabel && dmg.target === youLabel
            ? "opponent_hit"
            : null;

      if (!kind) continue;

      audio.play(kind);
      if (blocked) {
        vibrateCombat([10, 25, 10]);
      } else if (kind === "player_hit") {
        vibrateCombat(18);
      } else if (kind === "opponent_hit") {
        vibrateCombat(22);
      }
    }
  }, [log, enabled, audio]);
}
