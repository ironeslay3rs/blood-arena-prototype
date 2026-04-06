import type { OpponentControllerKind } from "./arenaTypes";

/**
 * Who drives fighter index 1: training AI, second local human, or future network peer.
 * Online multiplayer: `remote` will consume server/peer input; structure only for now.
 */
export function isOpponentHumanController(
  k: OpponentControllerKind,
): boolean {
  return k === "local_human" || k === "remote";
}

export function shouldRunDummyAi(controller: OpponentControllerKind): boolean {
  return controller === "dummy";
}

/** Auto-walk the training dummy toward the player (AI onboarding only). */
export function shouldShiftDummyTowardPlayer(
  controller: OpponentControllerKind,
): boolean {
  return controller === "dummy";
}
