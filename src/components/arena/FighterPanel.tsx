import type { FighterProgressEntry, FighterState } from "@/features/arena/arenaTypes";
import { fighterDef } from "@/features/arena/arenaUtils";

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
};

export function FighterPanel({ fighter, career }: FighterPanelProps) {
  const def = fighterDef(fighter);
  const status = fighter.hp <= 0 ? "Down" : fighter.blocking ? "Blocking" : "Ready";

  return (
    <article className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
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
