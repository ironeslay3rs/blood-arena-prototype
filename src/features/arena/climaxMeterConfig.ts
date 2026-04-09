/** Shared climax tuning — imported by sim, AI, and UI (avoids cycles). */
export const CLIMAX_METER_MAX = 100;
export const CLIMAX_METER_PER_DEALT_HP = 20;
export const CLIMAX_METER_PER_TAKEN_HP = 10;
export const CLIMAX_POST_ATTACK_COOLDOWN_MS = 780;

/** Meter when a **basic** attack is started but target is out of range (pressure tax / comeback glue). */
export const CLIMAX_METER_BASIC_ATTACK_WHIFF = 4;

/** Extra meter for the defender when a hit connects **through guard** (chip still counts). */
export const CLIMAX_METER_DEFENDER_ON_CHIP = 3;

/** Meter when a **damage** ability is committed but whiffs range (smaller than basic whiff). */
export const CLIMAX_METER_ABILITY_DAMAGE_WHIFF = 3;
