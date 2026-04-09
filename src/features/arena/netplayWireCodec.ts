/**
 * JSON codec for {@link NetplayControlMessage} — safe parse + stringify for WebSocket bodies.
 * Keeps wire format explicit before a binary snapshot exists.
 */

import type {
  ArenaInputFrame,
  ArenaInputTimelineSlice,
  InputConfirmMessage,
  NetplayControlMessage,
  PeerAdvanceMessage,
} from "./onlineNetplayStub";

function isMove(n: unknown): n is ArenaInputFrame["move"] {
  return n === -1 || n === 0 || n === 1;
}

function isArenaInputFrame(v: unknown): v is ArenaInputFrame {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    isMove(o.move) &&
    typeof o.blockHeld === "boolean" &&
    typeof o.buttons === "number" &&
    Number.isFinite(o.buttons)
  );
}

function isInputTimelineSlice(v: unknown): v is ArenaInputTimelineSlice {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.startFrame !== "number" || !Number.isFinite(o.startFrame))
    return false;
  if (!Array.isArray(o.p0) || !Array.isArray(o.p1)) return false;
  if (o.p0.length !== o.p1.length) return false;
  for (let i = 0; i < o.p0.length; i++) {
    if (!isArenaInputFrame(o.p0[i]) || !isArenaInputFrame(o.p1[i])) return false;
  }
  return true;
}

function isInputConfirmMessage(v: unknown): v is InputConfirmMessage {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return o.kind === "input_confirm" && typeof o.frame === "number" && isInputTimelineSlice(o.slice);
}

function isPeerAdvanceMessage(v: unknown): v is PeerAdvanceMessage {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.kind !== "peer_advance" || typeof o.frame !== "number") return false;
  if (o.stateChecksum !== undefined && typeof o.stateChecksum !== "string")
    return false;
  return true;
}

/** Returns `null` if JSON is not a valid control message. */
export function parseNetplayControlMessage(raw: string): NetplayControlMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (isInputConfirmMessage(parsed)) return parsed;
  if (isPeerAdvanceMessage(parsed)) return parsed;
  return null;
}

export function stringifyNetplayControlMessage(msg: NetplayControlMessage): string {
  return JSON.stringify(msg);
}
