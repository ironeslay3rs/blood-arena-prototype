/**
 * Player-facing between-round spend lines (Black Market bridge) — stream F clarity.
 */
import {
  BRIBE_CREDITS_COST,
  BRIBE_PENALTY_REDUCTION,
  REINFORCE_HP_BONUS,
  REINFORCE_IRONHEART_COST,
  RITUAL_ATTACK_BONUS,
  RITUAL_BLOOD_CHITS_COST,
} from "./arenaSpend";

export const ARENA_SPEND_PREVIEW_LINES: readonly string[] = [
  `Reinforce body — ${REINFORCE_IRONHEART_COST} ironheart → +${REINFORCE_HP_BONUS} max HP on next spawn`,
  `Bribe the handler — ${BRIBE_CREDITS_COST} credits → −${BRIBE_PENALTY_REDUCTION} pending max-HP penalty (immediate)`,
  `Blood ritual — ${RITUAL_BLOOD_CHITS_COST} blood chits → +${RITUAL_ATTACK_BONUS} base attack next spawn`,
] as const;
