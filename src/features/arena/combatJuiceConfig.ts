/**
 * Single tuning surface for SF/KOF-style **feel** (hitstop, freeze, shake).
 * Set any hitstop ms to **0** to disable that tier; set `screenShakeOnHeavy` to **0** to disable shake.
 */
/** Damage at or above this uses {@link COMBAT_JUICE.hitstopHeavyMs} (see `resolveHitstopMs`). */
export const HITSTOP_HEAVY_DAMAGE_MIN = 14;

export const COMBAT_JUICE = {
  /** Freeze frames on light connect (ms). 0 = off. */
  hitstopLightMs: 32,
  /** Freeze frames on heavy connect (ms). */
  hitstopHeavyMs: 58,
  /** Extra hitstop when target is in block (readability vs heaviness — tune later). */
  hitstopBlockedExtraMs: 22,
  /** Extra hitstop on Climax connect (ms). 0 = off. */
  superFreezeMs: 88,
  /** KO confirmation beat — vignette pulse on fight strip (ms). 0 = off. */
  koBeatMs: 160,
  /** Transform shake amount on heavy connect — 0–1 (0 = off). */
  screenShakeOnHeavy: 0.38,
  /** Base length of heavy shake (before tempo scaling in UI). */
  screenShakeHeavyMs: 220,
  /** Brief hue-rotate peak (deg), scaled by intensity in CSS. */
  screenShakeChromaDeg: 2.5,
  /** Fight strip scale on KO beat — **1** = off; keep ≤ ~1.08 for readability. */
  arenaZoomOnKo: 1.036,
} as const;

export type CombatJuiceKey = keyof typeof COMBAT_JUICE;

/** Impact freeze duration from tuning + damage tier + block (ms). */
export function resolveHitstopMs(amount: number, blocked: boolean): number {
  const j = COMBAT_JUICE;
  const tierMs =
    amount >= HITSTOP_HEAVY_DAMAGE_MIN ? j.hitstopHeavyMs : j.hitstopLightMs;
  const extra = blocked ? j.hitstopBlockedExtraMs : 0;
  return tierMs + extra;
}
