import { describe, expect, it } from "vitest";
import { FIGHTER_ORDER } from "./classData";
import {
  ARENA_WORLD_PILLARS,
  BLOOD_ARENA_LANE_FRAMING,
  FACTION_DISPLAY_ORDER,
  FACTION_LORE_ENTRIES,
  ROSTER_LORE_ENTRIES,
  loreEntryForFighter,
} from "./arenaLoreCodex";

describe("arenaLoreCodex", () => {
  it("keeps lore rows aligned with the playable roster order", () => {
    expect(ROSTER_LORE_ENTRIES.map((entry) => entry.fighterId)).toEqual(
      FIGHTER_ORDER,
    );
  });

  it("exposes a lore card for every arena faction", () => {
    expect(
      FACTION_DISPLAY_ORDER.map((faction) => FACTION_LORE_ENTRIES[faction].faction),
    ).toEqual(["Bio", "Pure", "Mecha", "Black City"]);
  });

  it("joins fighter lore with canon identity and climax naming", () => {
    expect(loreEntryForFighter("feral-hound")).toMatchObject({
      canonName: "Raze",
      bookPlacement: "Book 5",
      climaxName: "Rending Climax",
    });
  });

  it("keeps the world pillars focused on fight identity, canon, and upgrades", () => {
    expect(ARENA_WORLD_PILLARS).toHaveLength(3);
  });

  it("anchors Blood Arena to the Wrath / Arena of Blood lane from the lore vault", () => {
    expect(BLOOD_ARENA_LANE_FRAMING.laneName).toBe("Wrath");
    expect(BLOOD_ARENA_LANE_FRAMING.laneEpithet).toContain("Blood");
  });
});
