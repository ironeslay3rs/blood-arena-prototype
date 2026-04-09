import { describe, expect, it } from "vitest";
import { arenaReducer } from "./arenaActions";
import { createInitialArenaState } from "./initialArenaState";
import {
  arenaInputFrameToPlayerInput,
  arenaReducerNetplayFrame,
  arenaReducerNetplayRun,
  compactArenaChecksum,
  mergeInputTimelineSlice,
  NETPLAY_NEUTRAL_INPUT_FRAME,
  peerAdvanceFromArena,
  replayInputConfirmMessages,
} from "./arenaNetplayLockstep";
import {
  parseNetplayControlMessage,
  stringifyNetplayControlMessage,
} from "./netplayWireCodec";
import { INPUT_BUTTON } from "./onlineNetplayStub";
import { NETPLAY_RECOMMENDED_TICK_MS } from "./onlineNetplayStub";
import type { InputConfirmMessage } from "./onlineNetplayStub";

const neutral: Parameters<typeof arenaReducerNetplayRun>[1][number] = {
  p0: { move: 0, blockHeld: false, buttons: 0 },
  p1: { move: 0, blockHeld: false, buttons: 0 },
};

describe("arenaNetplayLockstep", () => {
  it("NETPLAY_LOCKSTEP_FRAME reducer action matches arenaReducerNetplayFrame", () => {
    const s0 = createInitialArenaState(undefined, undefined, {
      opponentController: "local_human",
    });
    const tick = NETPLAY_RECOMMENDED_TICK_MS;
    const p0 = neutral.p0;
    const p1 = neutral.p1;
    const viaHelper = arenaReducerNetplayFrame(
      s0,
      tick,
      p0,
      p1,
      NETPLAY_NEUTRAL_INPUT_FRAME,
      NETPLAY_NEUTRAL_INPUT_FRAME,
    );
    const viaDispatch = arenaReducer(s0, {
      type: "NETPLAY_LOCKSTEP_FRAME",
      tickMs: tick,
      p0,
      p1,
      prevP0: NETPLAY_NEUTRAL_INPUT_FRAME,
      prevP1: NETPLAY_NEUTRAL_INPUT_FRAME,
    });
    expect(viaDispatch).toEqual(viaHelper);
  });

  it("maps frames to PlayerInput", () => {
    expect(
      arenaInputFrameToPlayerInput({
        move: -1,
        blockHeld: true,
        buttons: INPUT_BUTTON.attack,
      }),
    ).toEqual({ move: -1, blockHeld: true });
  });

  it("merges input_confirm slices by frame index", () => {
    const m = new Map<
      number,
      { p0: (typeof neutral.p0); p1: (typeof neutral.p1) }
    >();
    mergeInputTimelineSlice(m, {
      startFrame: 10,
      p0: [
        { move: 1, blockHeld: false, buttons: 0 },
        { move: 0, blockHeld: false, buttons: 0 },
      ],
      p1: [
        { move: -1, blockHeld: false, buttons: 0 },
        { move: 0, blockHeld: false, buttons: 0 },
      ],
    });
    expect(m.get(10)?.p0.move).toBe(1);
    expect(m.get(11)?.p1.move).toBe(0);
  });

  it("produces stable checksums for identical states", () => {
    const s = createInitialArenaState(undefined, undefined, {
      opponentController: "local_human",
    });
    expect(compactArenaChecksum(s)).toBe(compactArenaChecksum(s));
  });

  it("runs deterministic lockstep for the same initial + frames", () => {
    const a = createInitialArenaState(undefined, undefined, {
      opponentController: "local_human",
    });
    const b = createInitialArenaState(undefined, undefined, {
      opponentController: "local_human",
    });
    const frames = [neutral, neutral, neutral];
    const tick = NETPLAY_RECOMMENDED_TICK_MS;
    const sa = arenaReducerNetplayRun(a, frames, tick);
    const sb = arenaReducerNetplayRun(b, frames, tick);
    expect(compactArenaChecksum(sa)).toBe(compactArenaChecksum(sb));
    expect(sa.nowMs).toBe(sb.nowMs);
  });

  it("replays same confirms regardless of arrival order (sort by message frame)", () => {
    const base = () =>
      createInitialArenaState(undefined, undefined, {
        opponentController: "local_human",
      });
    const nf = neutral.p0;
    const msgLate: InputConfirmMessage = {
      kind: "input_confirm",
      frame: 10,
      slice: {
        startFrame: 10,
        p0: [{ move: 0, blockHeld: false, buttons: INPUT_BUTTON.attack }],
        p1: [neutral.p1],
      },
    };
    const msgEarly: InputConfirmMessage = {
      kind: "input_confirm",
      frame: 5,
      slice: {
        startFrame: 5,
        p0: [nf, nf],
        p1: [neutral.p1, neutral.p1],
      },
    };
    const tick = NETPLAY_RECOMMENDED_TICK_MS;
    const a = replayInputConfirmMessages(base(), tick, [msgLate, msgEarly]);
    const b = replayInputConfirmMessages(base(), tick, [msgEarly, msgLate]);
    expect(compactArenaChecksum(a)).toBe(compactArenaChecksum(b));
  });

  it("peer_advance carries compactArenaChecksum", () => {
    const s = createInitialArenaState(undefined, undefined, {
      opponentController: "local_human",
    });
    const msg = peerAdvanceFromArena(s, 42);
    expect(msg.kind).toBe("peer_advance");
    expect(msg.frame).toBe(42);
    expect(msg.stateChecksum).toBe(compactArenaChecksum(s));
  });

  it("wire JSON roundtrips into replay-equivalent confirms", () => {
    const s0 = createInitialArenaState(undefined, undefined, {
      opponentController: "local_human",
    });
    const c: InputConfirmMessage = {
      kind: "input_confirm",
      frame: 2,
      slice: {
        startFrame: 2,
        p0: [{ move: 1, blockHeld: false, buttons: 0 }],
        p1: [{ move: 0, blockHeld: true, buttons: 0 }],
      },
    };
    const raw = stringifyNetplayControlMessage(c);
    const parsed = parseNetplayControlMessage(raw);
    expect(parsed).not.toBeNull();
    const s1 = createInitialArenaState(undefined, undefined, {
      opponentController: "local_human",
    });
    const tick = NETPLAY_RECOMMENDED_TICK_MS;
    expect(compactArenaChecksum(replayInputConfirmMessages(s0, tick, [c]))).toBe(
      compactArenaChecksum(replayInputConfirmMessages(s1, tick, [parsed!])),
    );
  });

  it("applies rising-edge attack before TICK (observable log delta)", () => {
    const s0 = createInitialArenaState(undefined, undefined, {
      opponentController: "local_human",
    });
    const noAttack = arenaReducerNetplayRun(s0, [neutral, neutral], NETPLAY_RECOMMENDED_TICK_MS);
    const s1 = createInitialArenaState(undefined, undefined, {
      opponentController: "local_human",
    });
    const withAttack = arenaReducerNetplayRun(
      s1,
      [
        {
          p0: { move: 0, blockHeld: false, buttons: INPUT_BUTTON.attack },
          p1: neutral.p1,
        },
        neutral,
      ],
      NETPLAY_RECOMMENDED_TICK_MS,
    );
    expect(withAttack.log.length).toBeGreaterThan(noAttack.log.length);
  });
});
