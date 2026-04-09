import { describe, expect, it } from "vitest";
import {
  CLIMAX_STINGER_BY_FACTION,
  resolveClimaxStinger,
} from "./climaxStingerConfig";

describe("resolveClimaxStinger", () => {
  it("uses card override when present", () => {
    const card = resolveClimaxStinger("hex-splicer", "Black City");
    const faction = CLIMAX_STINGER_BY_FACTION["Black City"];
    expect(card.durationSec).not.toBe(faction.durationSec);
    expect(card.freq).toBe(200);
  });

  it("falls back to faction when no card entry", () => {
    const t = resolveClimaxStinger("feral-hound", "Bio");
    expect(t).toEqual(CLIMAX_STINGER_BY_FACTION.Bio);
  });

  it("exposes sampleUrl for authored card rows", () => {
    const t = resolveClimaxStinger("bone-plating", "Bio");
    expect(t.sampleUrl).toBe("/audio/climax/bone-plating.ogg");
  });
});
