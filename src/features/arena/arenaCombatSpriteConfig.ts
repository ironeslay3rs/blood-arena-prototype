/**
 * Optional atlas under fighters (BP-09 / W3). When `url` is `null`, canvas uses procedural pillars only.
 */
export type CombatSpriteFrameRect = { sx: number; sy: number; sw: number; sh: number };

export const ARENA_COMBAT_SPRITE_ATLAS: {
  url: string | null;
  /** Source rectangles in atlas pixels — left fighter, right fighter. */
  frames: readonly [CombatSpriteFrameRect, CombatSpriteFrameRect];
} = {
  url: null,
  frames: [
    { sx: 0, sy: 0, sw: 48, sh: 64 },
    { sx: 48, sy: 0, sw: 48, sh: 64 },
  ],
};
