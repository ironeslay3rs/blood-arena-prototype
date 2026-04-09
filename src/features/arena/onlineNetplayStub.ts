/**
 * BP-08 — Rollback-oriented **wire spec** (no sockets, no matchmaking).
 * Pair with {@link simDeterminism.ts} before implementing transport.
 */

/** Match pacing target for lockstep / rollback prototypes (ms per sim tick). */
export const NETPLAY_RECOMMENDED_TICK_MS = 16;

/** Suggested upper bound for resimulation after input confirmation (tune per RTT). */
export const NETPLAY_DEFAULT_MAX_ROLLBACK_FRAMES = 8;

/**
 * P1 action bits — extend without reordering existing values (wire compatibility).
 * Combine with `ArenaInputFrame.buttons` via bitwise OR.
 */
export const INPUT_BUTTON = {
  skill1: 1 << 0,
  skill2: 1 << 1,
  dash: 1 << 2,
  attack: 1 << 3,
  climax: 1 << 4,
} as const;

/** One frame of held directions / buttons from a single player (engine-agnostic). */
export interface ArenaInputFrame {
  move: -1 | 0 | 1;
  blockHeld: boolean;
  /** Bitfield: {@link INPUT_BUTTON} */
  buttons: number;
}

/** Ordered inputs for a slice of simulation (rollback resimulates from confirmed frame). */
export interface ArenaInputTimelineSlice {
  startFrame: number;
  /** Parallel arrays: same length, one entry per frame. */
  p0: readonly ArenaInputFrame[];
  p1: readonly ArenaInputFrame[];
}

export type RollbackConfidence = "predicted" | "confirmed";

export interface RollbackFrameMeta {
  frame: number;
  confidence: RollbackConfidence;
}

/** Authoritative slice broadcast from host / relay after a confirmed frame. */
export interface InputConfirmMessage {
  kind: "input_confirm";
  frame: number;
  /** Raw frames for both peers starting at `frame`. */
  slice: ArenaInputTimelineSlice;
}

/** Peer announces it is up to `frame` with optional checksum for desync detect (TBD). */
export interface PeerAdvanceMessage {
  kind: "peer_advance";
  frame: number;
  /** Optional FNV / xxhash of compacted fight state — format TBD when sim is pure. */
  stateChecksum?: string;
}

export type NetplayControlMessage = InputConfirmMessage | PeerAdvanceMessage;

export interface RollbackSessionConfig {
  tickMs: number;
  maxRollbackFrames: number;
  /** When true, reducer must not branch on wall-clock or Math.random in fight logic. */
  requireDeterministicSim: boolean;
}

export const DEFAULT_ROLLBACK_SESSION: RollbackSessionConfig = {
  tickMs: NETPLAY_RECOMMENDED_TICK_MS,
  maxRollbackFrames: NETPLAY_DEFAULT_MAX_ROLLBACK_FRAMES,
  requireDeterministicSim: true,
};

/**
 * Browser adapter: {@link createWebSocketNetplayTransport} in `webSocketNetplayTransport.ts`.
 */
export interface NetplayTransport {
  send(msg: NetplayControlMessage): void;
  /** Returns unsubscribe. */
  subscribe(handler: (msg: NetplayControlMessage) => void): () => void;
}

/**
 * Two transports — each `send` delivers to the other side’s subscribers (in-process POC).
 * Use to test serialization / sync loops before WebSocket/WebRTC.
 */
export function createMemoryNetplayPair(): [NetplayTransport, NetplayTransport] {
  const aToB = new Set<(msg: NetplayControlMessage) => void>();
  const bToA = new Set<(msg: NetplayControlMessage) => void>();

  const create = (
    outgoing: Set<(msg: NetplayControlMessage) => void>,
    incoming: Set<(msg: NetplayControlMessage) => void>,
  ): NetplayTransport => ({
    send(msg) {
      for (const h of outgoing) {
        h(msg);
      }
    },
    subscribe(handler) {
      incoming.add(handler);
      return () => {
        incoming.delete(handler);
      };
    },
  });

  return [create(aToB, bToA), create(bToA, aToB)];
}
