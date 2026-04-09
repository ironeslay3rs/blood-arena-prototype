/**
 * Minimal two-peer lockstep relay for Blood Arena (BP-25).
 * Run: npm run relay  →  bind ws://127.0.0.1:8765
 *
 * Downlink shapes parsed in the app by `src/features/arena/netplayRelayClientMessages.ts` (BP-26).
 *
 * Protocol (JSON text):
 * - Server → client: { kind: "hello", slot: 0|1 }
 * - Server → all:    { kind: "frame_tick", frame: n }  (~60 Hz)
 * - Client → server:{ kind: "slot_input", frame, slot, input: ArenaInputFrame }
 * - Server → all:    input_confirm (same shape as netplayWireCodec)
 */

import { WebSocketServer } from "ws";

const PORT = Number(process.env.NETPLAY_RELAY_PORT || 8765);
const TICK_MS = 16;

const NEUTRAL = { move: 0, blockHeld: false, buttons: 0 };

const peers = [];

function broadcast(obj) {
  const raw = JSON.stringify(obj);
  for (const p of peers) {
    try {
      p.ws.send(raw);
    } catch {
      /* ignore */
    }
  }
}

/** @type {Map<number, { 0?: object; 1?: object }>} */
const pending = new Map();

function tryFlush(frame) {
  const row = pending.get(frame);
  if (!row) return;
  const n = peers.length;
  const p0 = row[0] ?? NEUTRAL;
  const p1 = row[1] ?? NEUTRAL;
  if (n >= 2 && (row[0] == null || row[1] == null)) return;
  if (n === 0) return;

  const confirm = {
    kind: "input_confirm",
    frame,
    slice: { startFrame: frame, p0: [p0], p1: [p1] },
  };
  broadcast(confirm);
  pending.delete(frame);
}

const wss = new WebSocketServer({ port: PORT, host: "127.0.0.1" });

wss.on("connection", (ws) => {
  if (peers.length >= 2) {
    ws.close(1013, "room full (2 peers)");
    return;
  }
  const slot = peers.length;
  peers.push({ ws, slot });
  ws.send(JSON.stringify({ kind: "hello", slot }));

  ws.on("message", (buf) => {
    let msg;
    try {
      msg = JSON.parse(buf.toString());
    } catch {
      return;
    }
    if (msg?.kind !== "slot_input" || typeof msg.frame !== "number") return;
    if (msg.slot !== 0 && msg.slot !== 1) return;
    if (!msg.input || typeof msg.input !== "object") return;

    let row = pending.get(msg.frame);
    if (!row) {
      row = {};
      pending.set(msg.frame, row);
    }
    row[msg.slot] = msg.input;
    tryFlush(msg.frame);
  });

  ws.on("close", () => {
    const i = peers.findIndex((p) => p.ws === ws);
    if (i >= 0) peers.splice(i, 1);
  });
});

let frame = 0;
setInterval(() => {
  if (peers.length === 0) return;
  frame += 1;
  broadcast({ kind: "frame_tick", frame });
}, TICK_MS);

console.log(`Blood Arena netplay relay listening on ws://127.0.0.1:${PORT}`);
