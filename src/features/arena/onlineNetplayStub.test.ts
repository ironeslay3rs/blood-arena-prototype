import { describe, expect, it } from "vitest";
import {
  createMemoryNetplayPair,
  type InputConfirmMessage,
} from "./onlineNetplayStub";

describe("createMemoryNetplayPair", () => {
  it("delivers send from peer A to subscriber on peer B", () => {
    const [a, b] = createMemoryNetplayPair();
    const received: InputConfirmMessage[] = [];
    const unsub = b.subscribe((msg) => {
      if (msg.kind === "input_confirm") received.push(msg);
    });

    const slice = {
      startFrame: 0,
      p0: [{ move: 0 as const, blockHeld: false, buttons: 0 }],
      p1: [{ move: 0 as const, blockHeld: false, buttons: 0 }],
    };
    const out: InputConfirmMessage = {
      kind: "input_confirm",
      frame: 4,
      slice,
    };
    a.send(out);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(out);
    unsub();
  });

  it("delivers bidirectionally", () => {
    const [left, right] = createMemoryNetplayPair();
    const fromRight: unknown[] = [];
    const fromLeft: unknown[] = [];
    const u1 = left.subscribe((m) => fromLeft.push(m));
    const u2 = right.subscribe((m) => fromRight.push(m));

    left.send({ kind: "peer_advance", frame: 1 });
    right.send({ kind: "peer_advance", frame: 2 });

    expect(fromRight).toEqual([{ kind: "peer_advance", frame: 1 }]);
    expect(fromLeft).toEqual([{ kind: "peer_advance", frame: 2 }]);
    u1();
    u2();
  });
});
