import { describe, expect, it } from "vitest";
import { parseRelayDownlink } from "./netplayRelayClientMessages";
import type { InputConfirmMessage } from "./onlineNetplayStub";

describe("parseRelayDownlink", () => {
  it("parses hello", () => {
    expect(parseRelayDownlink('{"kind":"hello","slot":1}')).toEqual({
      kind: "hello",
      slot: 1,
    });
  });

  it("rejects invalid hello slot", () => {
    expect(parseRelayDownlink('{"kind":"hello","slot":2}')).toBeNull();
  });

  it("parses frame_tick", () => {
    expect(parseRelayDownlink('{"kind":"frame_tick","frame":42}')).toEqual({
      kind: "frame_tick",
      frame: 42,
    });
  });

  it("delegates input_confirm to netplay codec", () => {
    const c: InputConfirmMessage = {
      kind: "input_confirm",
      frame: 3,
      slice: {
        startFrame: 3,
        p0: [{ move: 0, blockHeld: false, buttons: 0 }],
        p1: [{ move: 1, blockHeld: true, buttons: 0 }],
      },
    };
    expect(parseRelayDownlink(JSON.stringify(c))).toEqual(c);
  });

  it("returns null for invalid JSON", () => {
    expect(parseRelayDownlink("not json")).toBeNull();
  });
});
