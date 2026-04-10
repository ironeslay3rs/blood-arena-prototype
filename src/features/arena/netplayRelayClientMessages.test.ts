import { describe, expect, it } from "vitest";
import { parseRelayDownlink } from "./netplayRelayClientMessages";

describe("parseRelayDownlink", () => {
  it("parses peer_ledger (BP-46)", () => {
    const m = parseRelayDownlink(
      JSON.stringify({
        kind: "peer_ledger",
        slot: 1,
        wins: 4,
        level: 2,
      }),
    );
    expect(m).toEqual({
      kind: "peer_ledger",
      slot: 1,
      wins: 4,
      level: 2,
    });
  });

  it("parses peer_ledger displayLabel (BP-47)", () => {
    const m = parseRelayDownlink(
      JSON.stringify({
        kind: "peer_ledger",
        slot: 0,
        wins: 1,
        level: 1,
        displayLabel: "TestUser",
      }),
    );
    expect(m).toEqual({
      kind: "peer_ledger",
      slot: 0,
      wins: 1,
      level: 1,
      displayLabel: "TestUser",
    });
  });

  it("parses peer_checksum", () => {
    const m = parseRelayDownlink(
      JSON.stringify({
        kind: "peer_checksum",
        fromSlot: 0,
        frame: 12,
        checksum: "abc123",
      }),
    );
    expect(m).toEqual({
      kind: "peer_checksum",
      fromSlot: 0,
      frame: 12,
      checksum: "abc123",
    });
  });

  it("parses pong", () => {
    const m = parseRelayDownlink(JSON.stringify({ kind: "pong", t: 12345.6 }));
    expect(m).toEqual({ kind: "pong", t: 12345.6 });
  });
});
