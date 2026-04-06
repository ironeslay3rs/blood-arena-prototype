import type { CombatLogEntry } from "@/features/arena/arenaTypes";

export function CombatLog({ entries }: { entries: CombatLogEntry[] }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Combat log
      </h2>
      <ul className="max-h-44 space-y-1 overflow-y-auto font-mono text-xs text-zinc-700 dark:text-zinc-300">
        {entries.map((e) => (
          <li
            key={e.id}
            className={
              e.kind === "tempo"
                ? "border-l-2 border-zinc-400 pl-2 font-sans text-[11px] font-medium tracking-wide text-zinc-600 dark:border-zinc-500 dark:text-zinc-400"
                : e.kind === "reputation"
                  ? "border-l-2 border-rose-500 pl-2 font-sans text-[11px] font-medium italic text-rose-900/90 dark:border-rose-500 dark:text-rose-200/95"
                  : undefined
            }
          >
            {e.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
