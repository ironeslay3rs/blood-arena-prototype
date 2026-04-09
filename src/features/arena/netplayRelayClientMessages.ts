/**
 * Messages the **relay** sends to browsers (BP-26). Uplink `slot_input` stays inline in `useArenaEngine`.
 * Netplay control lines reuse {@link parseNetplayControlMessage}.
 */

import { parseNetplayControlMessage } from "./netplayWireCodec";
import type { NetplayControlMessage } from "./onlineNetplayStub";

export type RelayHello = { kind: "hello"; slot: 0 | 1 };

export type RelayFrameTick = { kind: "frame_tick"; frame: number };

export type RelayDownlinkMessage =
  | RelayHello
  | RelayFrameTick
  | NetplayControlMessage;

/** Parse one WebSocket text frame from `scripts/netplay-relay.mjs` or future relays. */
export function parseRelayDownlink(raw: string): RelayDownlinkMessage | null {
  let u: unknown;
  try {
    u = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!u || typeof u !== "object") return null;
  const o = u as Record<string, unknown>;
  if (o.kind === "hello" && (o.slot === 0 || o.slot === 1)) {
    return { kind: "hello", slot: o.slot };
  }
  if (
    o.kind === "frame_tick" &&
    typeof o.frame === "number" &&
    Number.isFinite(o.frame)
  ) {
    return { kind: "frame_tick", frame: o.frame };
  }
  return parseNetplayControlMessage(raw);
}
