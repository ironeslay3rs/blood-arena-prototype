import type {
  FighterState,
  MatchModifierId,
  OpponentControllerKind,
} from "@/features/arena/arenaTypes";
import { ARENA_WIDTH, arenaDistance, fighterDef } from "@/features/arena/arenaUtils";
import { matchModifierShortLabel } from "@/features/arena/matchModifiers";
import {
  opponentModeChipClassName,
  opponentModeChipLabel,
} from "@/features/arena/opponentModeUi";
import { ArenaCombatCanvas } from "./ArenaCombatCanvas";

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
  const pulse = attackPulse ? "combat-attack-pulse scale-105" : "";

  const faceArrow = fighter.facing === 1 ? "→" : "←";

  return (
    <div
      className="absolute bottom-10 z-20 flex w-20 -translate-x-1/2 flex-col items-center gap-0.5 transition-transform"
      style={{
        left: `${leftPct}%`,
        transitionDuration: `${moveTransitionMs}ms`,
      }}
    >
      <span
        className="select-none text-[11px] font-black tabular-nums text-zinc-400"
        title={fighter.facing === 1 ? "Facing right" : "Facing left"}
        aria-hidden
      >
        {faceArrow}
      </span>
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
  pulsePlayer,
  tempoAnimSpeed = 1,
  matchModifier,
  opponentMode,
}: {
  fighters: [FighterState, FighterState];
  /** Opponent wind-up (AI / P2 committing an attack). */
  pulseOpponent?: boolean;
  /** Player 1 connect — mirrors feedback so both sides “pop” on hit. */
  pulsePlayer?: boolean;
  /** Same factor as `tempoCombatAnimationSpeedMultiplier` — movement easing follows rhythm. */
  tempoAnimSpeed?: number;
  /** Current round rule — shown as a chip so players read it without the log. */
  matchModifier: MatchModifierId;
  /** So the stage reads the same format as the mode picker. */
  opponentMode: OpponentControllerKind;
}) {
  const spd = Math.max(0.35, Math.min(1.65, tempoAnimSpeed));
  const moveTransitionMs = Math.round(200 / spd);
  const [a, b] = fighters;
  const dist = arenaDistance(a, b);
  const ra = fighterDef(a).attackRange;
  const rb = fighterDef(b).attackRange;
  const inMeleeThreat = dist <= Math.max(ra, rb);

  const modeLabel = opponentModeChipLabel(opponentMode);
  const modeChipClass = opponentModeChipClassName(opponentMode);

  return (
    <section
      aria-label={`Arena — ${modeLabel}`}
      className="relative h-56 w-full overflow-hidden rounded-xl border border-zinc-300 bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 shadow-inner dark:border-zinc-600"
    >
      <ArenaCombatCanvas fighters={fighters} />
      <div className="pointer-events-none absolute inset-x-3 top-2 z-10 flex flex-wrap items-center justify-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${modeChipClass}`}
        >
          {modeLabel}
        </span>
        <span className="rounded-full border border-zinc-600/80 bg-zinc-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
          Rule: {matchModifierShortLabel(matchModifier)}
        </span>
        <span
          className="rounded-full border border-zinc-700/80 bg-zinc-950/70 px-2 py-0.5 text-[10px] tabular-nums tracking-wide text-zinc-500"
          title="Distance between fighters (arena units)"
        >
          Gap {dist.toFixed(0)}
        </span>
        {inMeleeThreat ? (
          <span className="rounded-full border border-rose-500/70 bg-rose-950/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.35)]">
            Melee range
          </span>
        ) : (
          <span className="rounded-full border border-zinc-700/90 bg-zinc-950/70 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500">
            Out of melee
          </span>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 h-10 bg-zinc-950/90" />
      <FighterSprite
        fighter={fighters[0]}
        attackPulse={pulsePlayer}
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
