import {
  CANON_CHARACTER_DEFINITIONS,
  type CanonBookPlacement,
} from "@/features/shared/canonCharacters";
import { FIGHTER_DEFINITIONS, FIGHTER_ORDER } from "./classData";
import type { Faction, FighterId } from "./arenaTypes";

export interface ArenaWorldPillar {
  title: string;
  description: string;
}

export interface FactionLoreEntry {
  faction: Faction;
  historyLine: string;
  arenaPressure: string;
  upgradeFantasy: string;
}

export interface RosterLoreEntry {
  fighterId: FighterId;
  rosterName: string;
  canonName: string;
  faction: Faction;
  bookPlacement: CanonBookPlacement;
  historyBeat: string;
  combatIdentity: string;
  upgradeHook: string;
  signatureMoves: readonly [string, string];
  climaxName: string;
}

/**
 * Black Market lane mapping from the series bible (`lore-canon/01 Master Canon/Locations/Black Market Lanes.md`).
 * Blood Arena is the playable duel layer; fiction ties it to Wrath / spectacle economics.
 */
export const BLOOD_ARENA_LANE_FRAMING = {
  /** Sin-aligned district in the Black Market. */
  laneName: "Wrath" as const,
  /** Formal lane title in canon notes. */
  laneEpithet: "Arena of Blood" as const,
  /** One honest bridge line for UI — does not change combat rules. */
  bridgeLine:
    "Black Market lanes are sin-shaped districts; Blood Arena reads as the Wrath lane’s public ring — violence as spectacle, wager, and proof.",
} as const;

export const ARENA_WORLD_PILLARS: readonly ArenaWorldPillar[] = [
  {
    title: "Classic fighter discipline",
    description:
      "The duel language follows Street Fighter and KOF priorities: readable spacing, committed buttons, visible resource tempo, and honest round flow.",
  },
  {
    title: "History in the ring",
    description:
      "Blood Arena is not a disconnected side mode. Each roster row is a combat-facing version of a Void Wars canon identity, with faction pressure and book history still attached.",
  },
  {
    title: "Upgrades with consequence",
    description:
      "Progression is framed as salvage, vows, reputation, scars, and arena status from the Oblivion lane, not random loot or detached RPG math.",
  },
] as const;

export const FACTION_LORE_ENTRIES: Record<Faction, FactionLoreEntry> = {
  Bio: {
    faction: "Bio",
    historyLine:
      "Bio fighters come from strain lines, failed containment, and pack politics where survival is already public theater.",
    arenaPressure:
      "The arena turns hunger, mutation, and hierarchy into spectacle; every round is proof that the body still answers the call to violence.",
    upgradeFantasy:
      "Upgrades should read as adaptation, feral strain control, and dominance earned through repeated blood matches.",
  },
  Pure: {
    faction: "Pure",
    historyLine:
      "Pure combatants carry sanctum oaths, doctrine, and public judgment into the pit, treating each bout as a moral test made visible.",
    arenaPressure:
      "They are not only trying to win; they are proving that discipline, protection, and ritual authority can survive corruption and chaos.",
    upgradeFantasy:
      "Upgrades should feel like vows deepening, sigils stabilizing, and reputation rising through clean reads and controlled endurance.",
  },
  Mecha: {
    faction: "Mecha",
    historyLine:
      "Mecha fighters come from telemetry culture, drill programs, and war hardware repurposed into sanctioned or semi-sanctioned arena proving grounds.",
    arenaPressure:
      "Every exchange is a field test for chassis rhythm, heat discipline, and whether engineered force can stay elegant under stress.",
    upgradeFantasy:
      "Upgrades should feel like calibration, better venting, hardened plating, and combat data turned into sharper execution.",
  },
  "Black City": {
    faction: "Black City",
    historyLine:
      "Black City contenders rise out of graft markets, salvage economies, hidden contracts, and violence treated as a negotiable service.",
    arenaPressure:
      "Their bouts are commerce as much as combat; the crowd is watching to see who can weaponize instability without being consumed by it.",
    upgradeFantasy:
      "Upgrades should read as illicit tuning, recovered tech, leverage, and dangerous edge bought with favors instead of purity.",
  },
};

export const FACTION_DISPLAY_ORDER: readonly Faction[] = [
  "Bio",
  "Pure",
  "Mecha",
  "Black City",
] as const;

export const ROSTER_LORE_ENTRIES: readonly RosterLoreEntry[] = FIGHTER_ORDER.map(
  (fighterId) => {
    const fighter = FIGHTER_DEFINITIONS[fighterId];
    const canon = CANON_CHARACTER_DEFINITIONS[fighter.canonCharacterId];

    return {
      fighterId,
      rosterName: fighter.name,
      canonName: canon.name,
      faction: fighter.faction,
      bookPlacement: canon.bookPlacement,
      historyBeat: canon.roleSummary,
      combatIdentity: canon.combatIdentity,
      upgradeHook: fighter.passive,
      signatureMoves: [
        fighter.abilities[0].name,
        fighter.abilities[1].name,
      ] as const,
      climaxName: fighter.climaxOverride?.logName ?? "Faction Climax",
    };
  },
);

export function loreEntryForFighter(fighterId: FighterId): RosterLoreEntry {
  const entry = ROSTER_LORE_ENTRIES.find((row) => row.fighterId === fighterId);
  if (!entry) {
    throw new Error(`Missing lore entry for fighter "${fighterId}".`);
  }
  return entry;
}
