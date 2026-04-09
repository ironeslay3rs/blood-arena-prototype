/**
 * Browser {@link NetplayTransport} over a single WebSocket (BP-08 / W4).
 * Server relay / matchmaking is out of scope — pair with your signaling layer.
 */

import {
  parseNetplayControlMessage,
  stringifyNetplayControlMessage,
} from "./netplayWireCodec";
import type { NetplayControlMessage, NetplayTransport } from "./onlineNetplayStub";

/**
 * Wraps an existing `WebSocket` (caller opens/closes). Ignores non-JSON or invalid payloads.
 */
export function createWebSocketNetplayTransport(ws: WebSocket): NetplayTransport {
  const handlers = new Set<(msg: NetplayControlMessage) => void>();

  const onMessage = (ev: MessageEvent) => {
    if (typeof ev.data !== "string") return;
    const msg = parseNetplayControlMessage(ev.data);
    if (!msg) return;
    for (const h of handlers) {
      h(msg);
    }
  };

  ws.addEventListener("message", onMessage);

  return {
    send(msg: NetplayControlMessage) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(stringifyNetplayControlMessage(msg));
      }
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
  };
}
