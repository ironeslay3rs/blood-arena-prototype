"use client";

import type { FighterState } from "@/features/arena/arenaTypes";
import { ARENA_COMBAT_SPRITE_ATLAS } from "@/features/arena/arenaCombatSpriteConfig";
import { ARENA_COMBAT_CANVAS_ENABLED } from "@/features/arena/arenaCanvasConfig";
import { ARENA_WIDTH } from "@/features/arena/arenaUtils";
import { useEffect, useRef } from "react";

/**
 * Lightweight Canvas 2D mirror of fighter X — placeholder for BP-09 raster playback.
 * Sits behind HTML “sprites”; `pointer-events: none`.
 */
export function ArenaCombatCanvas({
  fighters,
}: {
  fighters: [FighterState, FighterState];
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ARENA_COMBAT_CANVAS_ENABLED) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const atlasUrl = ARENA_COMBAT_SPRITE_ATLAS.url;
    const atlasImg = atlasUrl ? new Image() : null;
    if (atlasImg && atlasUrl) {
      atlasImg.src = atlasUrl;
    }

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr =
        typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 1;
      const cssW = rect.width;
      const cssH = rect.height;
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
      ctx.fillRect(0, 0, cssW, cssH);

      const floorY = cssH * 0.72;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(cssW, floorY);
      ctx.stroke();

      const toX = (arenaX: number) => (arenaX / ARENA_WIDTH) * cssW;

      const pillar = (arenaX: number, fill: string) => {
        const cx = toX(arenaX);
        ctx.fillStyle = fill;
        ctx.fillRect(cx - 7, floorY - 38, 14, 38);
      };

      const useAtlas =
        atlasImg &&
        atlasImg.complete &&
        atlasImg.naturalWidth > 0 &&
        ARENA_COMBAT_SPRITE_ATLAS.frames.length === 2;

      if (useAtlas) {
        const destH = 44;
        for (let i = 0; i < 2; i++) {
          const fr = ARENA_COMBAT_SPRITE_ATLAS.frames[i]!;
          const cx = toX(fighters[i]!.x);
          const scale = destH / fr.sh;
          const dw = fr.sw * scale;
          const dh = fr.sh * scale;
          ctx.drawImage(
            atlasImg,
            fr.sx,
            fr.sy,
            fr.sw,
            fr.sh,
            cx - dw / 2,
            floorY - dh,
            dw,
            dh,
          );
        }
      } else {
        pillar(fighters[0]!.x, "rgba(225, 29, 72, 0.82)");
        pillar(fighters[1]!.x, "rgba(63, 63, 70, 0.88)");
      }
    };

    const onAtlas = () => draw();
    atlasImg?.addEventListener("load", onAtlas);
    atlasImg?.addEventListener("error", onAtlas);

    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    draw();
    return () => {
      ro.disconnect();
      atlasImg?.removeEventListener("load", onAtlas);
      atlasImg?.removeEventListener("error", onAtlas);
    };
  }, [fighters]);

  if (!ARENA_COMBAT_CANVAS_ENABLED) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full rounded-xl"
    />
  );
}
