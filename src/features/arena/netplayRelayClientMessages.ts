/**
 * Messages the **relay** sends to browsers (BP-26). Uplink `slot_input` stays inline in `useArenaEngine`.
 * Netplay control lines reuse {@link parseNetplayControlMessage}.
 */

import { parseNetplayControlMessage } from "./netplayWireCodec";
import type { NetplayControlMessage } from "./onlineNetplayStub";

export type RelayHello = { kind: "hello"; slot: 0 | 1 };

export type RelayFrameTick = { kind: "frame_tick"; frame: number };

/** Relay broadcasts the other peer’s disclosed career (symmetric growth UI). */
export type RelayPeerLedger = {
  kind: "peer_ledger";
  slot: 0 | 1;
  wins: number;
  level: number;
  /** Optional short name from peer `?netplayLabel=` (BP-47). */
  displayLabel?: string;
};

/** Per-frame sim checksum from the other peer — compare to local {@link compactArenaChecksum}. */
export type RelayPeerChecksum = {
  kind: "peer_checksum";
  fromSlot: 0 | 1;
  frame: number;
  checksum: string;
};

export type RelayPong = { kind: "pong"; t: number };

export type RelayDownlinkMessage =
  | RelayHello
  | RelayFrameTick
  | RelayPeerLedger
  | RelayPeerChecksum
  | RelayPong
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
  if (
    o.kind === "peer_ledger" &&
    (o.slot === 0 || o.slot === 1) &&
    typeof o.wins === "number" &&
    typeof o.level === "number"
  ) {
    const row: RelayPeerLedger = {
      kind: "peer_ledger",
      slot: o.slot,
      wins: o.wins,
      level: o.level,
    };
    if (typeof o.displayLabel === "string" && o.displayLabel.length > 0) {
      row.displayLabel = o.displayLabel.slice(0, 24);
    }
    return row;
  }
  if (
    o.kind === "peer_checksum" &&
    (o.fromSlot === 0 || o.fromSlot === 1) &&
    typeof o.frame === "number" &&
    typeof o.checksum === "string"
  ) {
    return {
      kind: "peer_checksum",
      fromSlot: o.fromSlot,
      frame: o.frame,
      checksum: o.checksum,
    };
  }
  if (o.kind === "pong" && typeof o.t === "number" && Number.isFinite(o.t)) {
    return { kind: "pong", t: o.t };
  }
  return parseNetplayControlMessage(raw);
}
