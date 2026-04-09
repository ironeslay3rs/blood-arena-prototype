/**
 * Pure lockstep step — `reduce` is injected so {@link arenaActions.arenaReducer} can call it
 * without importing this module from `arenaNetplayLockstep.ts` (cycle break).
 */

import type { ArenaReducerAction, ArenaState, PlayerInput } from "./arenaTypes";
import type { ArenaInputFrame } from "./onlineNetplayStub";
import { INPUT_BUTTON } from "./onlineNetplayStub";

export function arenaInputFrameToPlayerInput(f: ArenaInputFrame): PlayerInput {
  return { move: f.move, blockHeld: f.blockHeld };
}

function rising(prevButtons: number, nextButtons: number, mask: number): boolean {
  return (nextButtons & mask) !== 0 && (prevButtons & mask) === 0;
}

const NETPLAY_BUTTON_EDGE_ORDER = [
  INPUT_BUTTON.skill1,
  INPUT_BUTTON.skill2,
  INPUT_BUTTON.dash,
  INPUT_BUTTON.attack,
  INPUT_BUTTON.climax,
] as const;

function actionForP0Button(mask: number): ArenaReducerAction | null {
  switch (mask) {
    case INPUT_BUTTON.skill1:
      return { type: "USE_ABILITY", slot: 0 };
    case INPUT_BUTTON.skill2:
      return { type: "USE_ABILITY", slot: 1 };
    case INPUT_BUTTON.dash:
      return { type: "DASH" };
    case INPUT_BUTTON.attack:
      return { type: "BASIC_ATTACK" };
    case INPUT_BUTTON.climax:
      return { type: "USE_CLIMAX" };
    default:
      return null;
  }
}

function actionForP1Button(mask: number): ArenaReducerAction | null {
  switch (mask) {
    case INPUT_BUTTON.skill1:
      return { type: "OPPONENT_USE_ABILITY", slot: 0 };
    case INPUT_BUTTON.skill2:
      return { type: "OPPONENT_USE_ABILITY", slot: 1 };
    case INPUT_BUTTON.dash:
      return { type: "OPPONENT_DASH" };
    case INPUT_BUTTON.attack:
      return { type: "OPPONENT_BASIC_ATTACK" };
    case INPUT_BUTTON.climax:
      return { type: "OPPONENT_USE_CLIMAX" };
    default:
      return null;
  }
}

export function applyNetplayLockstepFrame(
  reduce: (s: ArenaState, a: ArenaReducerAction) => ArenaState,
  state: ArenaState,
  tickMs: number,
  p0: ArenaInputFrame,
  p1: ArenaInputFrame,
  prevP0: ArenaInputFrame,
  prevP1: ArenaInputFrame,
): ArenaState {
  if (state.winner != null) {
    return reduce(state, {
      type: "TICK",
      dtMs: tickMs,
      input: { move: 0, blockHeld: false },
      opponentInput: { move: 0, blockHeld: false },
    });
  }

  let s = state;
  for (const mask of NETPLAY_BUTTON_EDGE_ORDER) {
    if (rising(prevP0.buttons, p0.buttons, mask)) {
      const a = actionForP0Button(mask);
      if (a) s = reduce(s, a);
    }
    if (rising(prevP1.buttons, p1.buttons, mask)) {
      const a = actionForP1Button(mask);
      if (a) s = reduce(s, a);
    }
  }
  return reduce(s, {
    type: "TICK",
    dtMs: tickMs,
    input: arenaInputFrameToPlayerInput(p0),
    opponentInput: arenaInputFrameToPlayerInput(p1),
  });
}
