import type { CombatLogEntry } from "./arenaTypes";

export type LiveExchangeKind =
  | "clean"
  | "blocked"
  | "climax_clean"
  | "climax_blocked"
  | "no_damage"
  | "climax"
  | "whiff";

export type LiveExchangeReadout = {
  kind: LiveExchangeKind;
  /** Short line for the HUD strip. */
  displayLine: string;
  /** Fuller phrase for aria-label / tooltips. */
  srLine: string;
};

const KO_RE =
  /Player 1 is down\.|Player 2 is down\.|Training opponent down/;

function isNoise(e: CombatLogEntry): boolean {
  return e.message === "\u200b" || KO_RE.test(e.message);
}

function prevNonNoiseIndex(
  log: readonly CombatLogEntry[],
  from: number,
): number {
  for (let j = from - 1; j >= 0; j--) {
    if (!isNoise(log[j]!)) return j;
  }
  return -1;
}

/**
 * Most recent readable exchange while the round is live — log-derived (§15.3 T3).
 * Walks backward from the latest entry; skips KO lines and evolution placeholders.
 * If the latest HP line immediately follows an `unleashes` line, reports Climax → outcome (BP-34).
 */
export function lastLiveExchangeReadout(
  log: readonly CombatLogEntry[],
): LiveExchangeReadout | null {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i]!;
    if (isNoise(e)) continue;
    const m = e.message;

    if (/for \d+ HP/.test(m)) {
      const prevIdx = prevNonNoiseIndex(log, i);
      const afterClimax =
        prevIdx >= 0 && log[prevIdx]!.message.includes("unleashes");
      if (m.includes("(clean)")) {
        if (afterClimax) {
          return {
            kind: "climax_clean",
            displayLine: "Last: Climax → clean",
            srLine:
              "Last exchange: Climax super, then a clean connect for health damage.",
          };
        }
        return {
          kind: "clean",
          displayLine: "Last hit: clean connect",
          srLine: "Last exchange: damage was clean, not fully guarded.",
        };
      }
      if (m.includes("(blocked)")) {
        if (afterClimax) {
          return {
            kind: "climax_blocked",
            displayLine: "Last: Climax → chip",
            srLine:
              "Last exchange: Climax super, then damage through guard as chip.",
          };
        }
        return {
          kind: "blocked",
          displayLine: "Last hit: chip through guard",
          srLine: "Last exchange: damage came through while guarding.",
        };
      }
    }
    if (m.includes("(no damage)")) {
      return {
        kind: "no_damage",
        displayLine: "Last exchange: no HP damage",
        srLine: "Last exchange: attack connected for no health damage.",
      };
    }
    if (m.includes("unleashes")) {
      return {
        kind: "climax",
        displayLine: "Last read: Climax",
        srLine: "Last exchange: Climax super flash.",
      };
    }
    if (m.includes("out of range")) {
      return {
        kind: "whiff",
        displayLine: "Last attack: whiff",
        srLine: "Last exchange: attack was out of range.",
      };
    }
  }
  return null;
}
