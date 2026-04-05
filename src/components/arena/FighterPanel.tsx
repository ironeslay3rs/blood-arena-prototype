import type {
  FighterProgressEntry,
  FighterState,
} from "@/features/arena/arenaTypes";
import { fighterDef } from "@/features/arena/arenaUtils";
import type { CardCombatFeedback } from "./useCombatFeedback";

function ResourceBar({
  label,
  current,
  max,
  fillClass,
}: {
  label: string;
  current: number;
  max: number;
  fillClass: string;
}) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{label}</span>
        <span>
          {Math.round(current)} / {max}
        </span>
      </div>
      <div className="mt-0.5 h-2 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full rounded-sm transition-[width] duration-150 ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

type FighterPanelProps = {
  fighter: FighterState;
  /** When set (e.g. player), show persistent career stats. */
  career?: FighterProgressEntry | null;
  combatFeedback?: CardCombatFeedback;
};

export function FighterPanel({
  fighter,
  career,
  combatFeedback,
}: FighterPanelProps) {
  const def = fighterDef(fighter);
  const status =
    fighter.hp <= 0 ? "Down" : fighter.blocking ? "Blocking" : "Ready";

  const fb = combatFeedback;
  const outlineClass = fb?.targetedGlow
    ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-100 dark:ring-offset-zinc-950"
    : "";

  return (
    <article
      className={`relative rounded-lg border border-zinc-200 p-4 transition-shadow duration-200 dark:border-zinc-800 ${outlineClass}`}
    >
      {fb?.showTargetedCaption ? (
        <div
          className="combat-float-caption pointer-events-none absolute -top-2 right-2 rounded bg-yellow-500/95 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-950 shadow"
          aria-live="polite"
        >
          TARGETED
        </div>
      ) : null}

      {fb?.traitLabel ? (
        <div
          className="pointer-events-none absolute -top-2 left-2 rounded border border-zinc-400/80 bg-zinc-800/95 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-200 shadow dark:border-zinc-600"
          aria-label={`AI stance ${fb.traitLabel}`}
        >
          {fb.traitLabel}
        </div>
      ) : null}

      {fb?.damageNumber != null ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          aria-live="polite"
        >
          <span className="combat-damage-float text-2xl font-black tabular-nums text-rose-500 drop-shadow-md dark:text-rose-400">
            −{fb.damageNumber}
          </span>
        </div>
      ) : null}

      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
          {fighter.label}
        </h2>
        <span className="text-xs text-zinc-500">{def.displayName}</span>
      </div>
      {career != null ? (
        <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
          Level {career.level} · {career.wins}W / {career.losses}L
        </p>
      ) : null}
      <div className="space-y-3">
        <ResourceBar
          label="HP"
          current={fighter.hp}
          max={fighter.hpMax}
          fillClass="bg-rose-500"
        />
        <ResourceBar
          label={def.resourceLabel}
          current={fighter.resource}
          max={fighter.resourceMax}
          fillClass={def.resourceBarFillClass}
        />
        <p className="text-xs text-zinc-500">
          Status: <span className="text-zinc-700 dark:text-zinc-300">{status}</span>
        </p>
      </div>
    </article>
  );
}
