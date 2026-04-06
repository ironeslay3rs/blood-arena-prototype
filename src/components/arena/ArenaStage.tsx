import type { FighterState } from "@/features/arena/arenaTypes";
import { ARENA_WIDTH, fighterDef } from "@/features/arena/arenaUtils";

function FighterSprite({
  fighter,
  attackPulse,
  moveTransitionMs,
}: {
  fighter: FighterState;
  attackPulse?: boolean;
  /** Horizontal slide; scales with combat tempo (snappier when high). */
  moveTransitionMs: number;
}) {
  const leftPct = (fighter.x / ARENA_WIDTH) * 100;
  const def = fighterDef(fighter);
  const ring = fighter.blocking
    ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950"
    : "";
  const pulse =
    attackPulse && fighter.role === "opponent"
      ? "combat-attack-pulse scale-105"
      : "";

  return (
    <div
      className="absolute bottom-10 flex w-20 -translate-x-1/2 flex-col items-center gap-1 transition-transform"
      style={{
        left: `${leftPct}%`,
        transitionDuration: `${moveTransitionMs}ms`,
      }}
    >
      <div
        className={`flex h-24 w-16 items-center justify-center rounded-md border-2 text-center text-[10px] font-bold leading-tight text-white shadow-md ${ring} ${pulse} ${
          fighter.role === "player"
            ? "border-rose-400 bg-rose-900/90"
            : "border-zinc-400 bg-zinc-800/90"
        }`}
      >
        {fighter.label}
      </div>
      <span className="max-w-[5rem] truncate text-center text-[10px] text-zinc-400">
        {def.displayName}
      </span>
    </div>
  );
}

export function ArenaStage({
  fighters,
  pulseOpponent,
  tempoAnimSpeed = 1,
}: {
  fighters: [FighterState, FighterState];
  /** When true, brief emphasis on fighter 1 sprite during attack wind-up (UI only). */
  pulseOpponent?: boolean;
  /** Same factor as `tempoCombatAnimationSpeedMultiplier` — movement easing follows rhythm. */
  tempoAnimSpeed?: number;
}) {
  const spd = Math.max(0.35, Math.min(1.65, tempoAnimSpeed));
  const moveTransitionMs = Math.round(200 / spd);

  return (
    <section
      aria-label="Arena"
      className="relative h-56 w-full overflow-hidden rounded-xl border border-zinc-300 bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 shadow-inner dark:border-zinc-600"
    >
      <div className="pointer-events-none absolute inset-x-4 top-3 text-center text-[10px] uppercase tracking-widest text-zinc-500">
        Side view
      </div>
      <div className="absolute inset-x-0 bottom-0 h-10 bg-zinc-950/90" />
      <FighterSprite
        fighter={fighters[0]}
        moveTransitionMs={moveTransitionMs}
      />
      <FighterSprite
        fighter={fighters[1]}
        attackPulse={pulseOpponent}
        moveTransitionMs={moveTransitionMs}
      />
    </section>
  );
}
