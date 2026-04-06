import type { PlayerInput } from "./arenaTypes";

/** Held keys for player 2 (hot-seat); mirrors P1 shape. */
export type OpponentKeysHeld = {
  left: boolean;
  right: boolean;
  block: boolean;
};

export function buildOpponentInput(keys: OpponentKeysHeld): PlayerInput {
  let move: -1 | 0 | 1 = 0;
  if (keys.left && !keys.right) move = -1;
  else if (keys.right && !keys.left) move = 1;
  return { move, blockHeld: keys.block };
}

/**
 * Temporary second-player bindings (no overlap with P1: Arrows/WASD, G, Shift, F, 1–2).
 * Numpad duplicates help laptops without a full numpad.
 */
export function opponentKeyIsMoveLeft(code: string): boolean {
  return code === "KeyJ" || code === "Numpad4";
}

export function opponentKeyIsMoveRight(code: string): boolean {
  return code === "KeyL" || code === "Numpad6";
}

export function opponentKeyIsBlock(code: string): boolean {
  return code === "KeyI" || code === "Numpad0";
}

export function opponentKeyIsDash(code: string): boolean {
  return code === "KeyO" || code === "Numpad8";
}

export function opponentKeyIsAttack(code: string): boolean {
  return code === "KeyU" || code === "Numpad5";
}

export function opponentKeyIsSkill1(code: string): boolean {
  return code === "BracketLeft" || code === "Numpad7";
}

export function opponentKeyIsSkill2(code: string): boolean {
  return code === "BracketRight" || code === "Numpad9";
}
