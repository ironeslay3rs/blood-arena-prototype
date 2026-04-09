import type { Faction, FighterId } from "./arenaTypes";

/** Procedural WebAudio climax “sting”; optional `sampleUrl` prefers `public/` OGG/WebM. */
export type ClimaxStingerTone = {
  freq: number;
  freqEnd: number;
  durationSec: number;
  gain: number;
  type?: OscillatorType;
  /** Resolved against site origin — e.g. `/audio/climax/card.ogg`. On decode/play failure, procedural tone runs. */
  sampleUrl?: string;
};

export const CLIMAX_STINGER_BY_FACTION: Record<Faction, ClimaxStingerTone> = {
  Bio: {
    freq: 145,
    freqEnd: 62,
    durationSec: 0.2,
    gain: 0.11,
    type: "sawtooth",
  },
  Pure: {
    freq: 523.25,
    freqEnd: 392,
    durationSec: 0.26,
    gain: 0.09,
    type: "sine",
  },
  Mecha: {
    freq: 220,
    freqEnd: 880,
    durationSec: 0.16,
    gain: 0.095,
    type: "square",
  },
  "Black City": {
    freq: 165,
    freqEnd: 72,
    durationSec: 0.21,
    gain: 0.11,
    type: "sawtooth",
  },
};

/** Optional card-specific sting — falls back to faction. */
export const CLIMAX_STINGER_BY_FIGHTER: Partial<
  Record<FighterId, ClimaxStingerTone>
> = {
  "bone-plating": {
    freq: 88,
    freqEnd: 52,
    durationSec: 0.27,
    gain: 0.1,
    type: "triangle",
    sampleUrl: "/audio/climax/bone-plating.ogg",
  },
  "radiant-ward": {
    freq: 698.46,
    freqEnd: 523.25,
    durationSec: 0.32,
    gain: 0.085,
    type: "sine",
  },
  "precision-burst": {
    freq: 300,
    freqEnd: 1046.5,
    durationSec: 0.15,
    gain: 0.102,
    type: "square",
  },
  "hex-splicer": {
    freq: 200,
    freqEnd: 48,
    durationSec: 0.24,
    gain: 0.12,
    type: "sawtooth",
  },
};

export function resolveClimaxStinger(
  fighterId: FighterId,
  faction: Faction,
): ClimaxStingerTone {
  return CLIMAX_STINGER_BY_FIGHTER[fighterId] ?? CLIMAX_STINGER_BY_FACTION[faction];
}
