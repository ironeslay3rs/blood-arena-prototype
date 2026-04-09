import { describe, expect, it } from "vitest";
import { parseNetplayControlMessage, stringifyNetplayControlMessage } from "./netplayWireCodec";
import type { InputConfirmMessage, PeerAdvanceMessage } from "./onlineNetplayStub";

const sampleFrame = {
  move: 0 as const,
  blockHeld: false,
  buttons: 0,
};

describe("netplayWireCodec", () => {
  it("roundtrips input_confirm", () => {
    const msg: InputConfirmMessage = {
      kind: "input_confirm",
      frame: 12,
      slice: {
        startFrame: 12,
        p0: [sampleFrame],
        p1: [{ move: 1, blockHeld: true, buttons: 3 }],
      },
    };
    const raw = stringifyNetplayControlMessage(msg);
    expect(parseNetplayControlMessage(raw)).toEqual(msg);
  });

  it("roundtrips peer_advance with optional checksum", () => {
    const msg: PeerAdvanceMessage = {
      kind: "peer_advance",
      frame: 99,
      stateChecksum: "abc",
    };
    const raw = stringifyNetplayControlMessage(msg);
    expect(parseNetplayControlMessage(raw)).toEqual(msg);
  });

  it("rejects invalid JSON", () => {
    expect(parseNetplayControlMessage("not json")).toBeNull();
  });

  it("rejects unknown kind", () => {
    expect(parseNetplayControlMessage('{"kind":"nope"}')).toBeNull();
  });

  it("rejects mismatched p0/p1 lengths", () => {
    expect(
      parseNetplayControlMessage(
        JSON.stringify({
          kind: "input_confirm",
          frame: 1,
          slice: { startFrame: 1, p0: [sampleFrame], p1: [] },
        }),
      ),
    ).toBeNull();
  });
});
