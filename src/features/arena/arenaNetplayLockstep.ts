/**
 * W5 — Lockstep helpers + replay; frame step lives in {@link arenaNetplayStep.ts}.
 */

import { arenaReducer } from "./arenaActions";
import type { ArenaState } from "./arenaTypes";
import { applyNetplayLockstepFrame } from "./arenaNetplayStep";
import type {
  ArenaInputFrame,
  ArenaInputTimelineSlice,
  InputConfirmMessage,
  PeerAdvanceMessage,
} from "./onlineNetplayStub";

export { arenaInputFrameToPlayerInput } from "./arenaNetplayStep";

export function arenaReducerNetplayFrame(
  state: ArenaState,
  tickMs: number,
  p0: ArenaInputFrame,
  p1: ArenaInputFrame,
  prevP0: ArenaInputFrame,
  prevP1: ArenaInputFrame,
): ArenaState {
  return applyNetplayLockstepFrame(
    arenaReducer,
    state,
    tickMs,
    p0,
    p1,
    prevP0,
    prevP1,
  );
}

/** Default analog + buttons when a frame index has no confirmed row yet. */
export const NETPLAY_NEUTRAL_INPUT_FRAME: ArenaInputFrame = {
  move: 0,
  blockHeld: false,
  buttons: 0,
};

/** Run a sequence of confirmed pairs; `prev` for frame 0 is neutral. */
export function arenaReducerNetplayRun(
  initial: ArenaState,
  frames: readonly { p0: ArenaInputFrame; p1: ArenaInputFrame }[],
  tickMs: number,
): ArenaState {
  let prevP0 = NETPLAY_NEUTRAL_INPUT_FRAME;
  let prevP1 = NETPLAY_NEUTRAL_INPUT_FRAME;
  let s = initial;
  for (const cur of frames) {
    s = arenaReducerNetplayFrame(s, tickMs, cur.p0, cur.p1, prevP0, prevP1);
    prevP0 = cur.p0;
    prevP1 = cur.p1;
  }
  return s;
}

/** Merge authoritative `input_confirm` rows into a frame → pair map. */
export function mergeInputTimelineSlice(
  target: Map<number, { p0: ArenaInputFrame; p1: ArenaInputFrame }>,
  slice: ArenaInputTimelineSlice,
): void {
  const { startFrame, p0, p1 } = slice;
  for (let i = 0; i < p0.length; i++) {
    target.set(startFrame + i, { p0: p0[i]!, p1: p1[i]! });
  }
}

/**
 * Merge one or more `input_confirm` messages (e.g. from wire), then sim from the
 * smallest to largest frame index. Later confirms overwrite the same frame indices.
 */
export function replayInputConfirmMessages(
  initial: ArenaState,
  tickMs: number,
  confirms: readonly InputConfirmMessage[],
): ArenaState {
  if (confirms.length === 0) return initial;
  const sorted = [...confirms].sort((a, b) => a.frame - b.frame);
  const map = new Map<number, { p0: ArenaInputFrame; p1: ArenaInputFrame }>();
  for (const c of sorted) {
    mergeInputTimelineSlice(map, c.slice);
  }
  const keys = [...map.keys()];
  const min = Math.min(...keys);
  const max = Math.max(...keys);
  const neutral = {
    p0: NETPLAY_NEUTRAL_INPUT_FRAME,
    p1: NETPLAY_NEUTRAL_INPUT_FRAME,
  };
  const frames: { p0: ArenaInputFrame; p1: ArenaInputFrame }[] = [];
  for (let f = min; f <= max; f++) {
    frames.push(map.get(f) ?? neutral);
  }
  return arenaReducerNetplayRun(initial, frames, tickMs);
}

/** Build a `peer_advance` line for the wire using {@link compactArenaChecksum}. */
export function peerAdvanceFromArena(
  state: ArenaState,
  frame: number,
): PeerAdvanceMessage {
  return {
    kind: "peer_advance",
    frame,
    stateChecksum: compactArenaChecksum(state),
  };
}

export function compactArenaChecksum(state: ArenaState): string {
  const [a, b] = state.fighters;
  const winCode =
    state.winner === null ? -1 : state.winner === "player" ? 0 : 1;
  const parts: number[] = [
    state.nowMs,
    winCode,
    a.hp,
    b.hp,
    Math.round(a.x * 1000),
    Math.round(b.x * 1000),
    a.resource,
    b.resource,
    state.log.length,
    state.logSeq,
  ];
  let h = 0x811c9dc5;
  for (const n of parts) {
    const x = Math.floor(Number.isFinite(n) ? n : 0) | 0;
    h ^= x;
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
