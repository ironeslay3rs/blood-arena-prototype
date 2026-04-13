import type { Faction } from "@/features/arena/arenaTypes";
import {
  ARENA_WORLD_PILLARS,
  BLOOD_ARENA_LANE_FRAMING,
  FACTION_DISPLAY_ORDER,
  FACTION_LORE_ENTRIES,
  ROSTER_LORE_ENTRIES,
} from "@/features/arena/arenaLoreCodex";

const FACTION_ACCENT_CLASS: Record<Faction, string> = {
  Bio: "border-emerald-500/35 bg-emerald-950/20 text-emerald-100",
  Pure: "border-amber-500/35 bg-amber-950/20 text-amber-100",
  Mecha: "border-sky-500/35 bg-sky-950/20 text-sky-100",
  "Black City": "border-violet-500/35 bg-violet-950/25 text-violet-100",
};

export function LoreCodexPanel() {
  return (
    <details className="rounded-lg border border-zinc-300/80 bg-zinc-50/70 dark:border-zinc-700 dark:bg-zinc-950/20">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-100 [&::-webkit-details-marker]:hidden">
        World, history, and lore codex
      </summary>
      <div className="space-y-4 border-t border-zinc-200 px-3 py-3 text-xs leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-300">
        <p className="max-w-3xl text-sm text-zinc-700 dark:text-zinc-300">
          Blood Arena takes its duel discipline from Street Fighter and KOF,
          but its story spine, faction tensions, and upgrade fantasy come from
          Evolution: Void Wars: Oblivion. The point is not only to spar; it is
          to make canon history playable.
        </p>

        <aside
          className="rounded-md border border-rose-500/30 bg-rose-950/15 px-3 py-2 text-[11px] leading-relaxed text-rose-100/95 dark:border-rose-800/40 dark:bg-rose-950/30"
          aria-label="Black Market lane placement"
        >
          <p className="font-semibold text-rose-200 dark:text-rose-100">
            {BLOOD_ARENA_LANE_FRAMING.laneName} lane —{" "}
            {BLOOD_ARENA_LANE_FRAMING.laneEpithet}
          </p>
          <p className="mt-1 text-rose-100/85 dark:text-rose-200/90">
            {BLOOD_ARENA_LANE_FRAMING.bridgeLine}
          </p>
          <p className="mt-1 text-[10px] text-rose-200/70">
            Source note: series lore vault{" "}
            <code className="rounded bg-black/20 px-1 text-[10px]">
              lore-canon/01 Master Canon/Locations/Black Market Lanes.md
            </code>
          </p>
        </aside>

        <div className="grid gap-3 md:grid-cols-3">
          {ARENA_WORLD_PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-md border border-zinc-200/90 bg-white/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/45"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                {pillar.title}
              </p>
              <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                {pillar.description}
              </p>
            </article>
          ))}
        </div>

        <section className="space-y-2" aria-label="Faction history">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Faction history in the pit
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {FACTION_DISPLAY_ORDER.map((faction) => {
              const entry = FACTION_LORE_ENTRIES[faction];
              return (
                <article
                  key={faction}
                  className="rounded-md border border-zinc-200/90 bg-white/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/45"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {faction}
                    </p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${FACTION_ACCENT_CLASS[faction]}`}
                    >
                      canon pressure
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                    {entry.historyLine}
                  </p>
                  <p className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      Arena role:
                    </span>{" "}
                    {entry.arenaPressure}
                  </p>
                  <p className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      Upgrade fantasy:
                    </span>{" "}
                    {entry.upgradeFantasy}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-2" aria-label="Roster lore">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Roster lore and arena variants
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {ROSTER_LORE_ENTRIES.map((entry) => (
              <article
                key={entry.fighterId}
                className="rounded-md border border-zinc-200/90 bg-white/70 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/45"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {entry.rosterName}
                  </p>
                  <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
                    {entry.canonName}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${FACTION_ACCENT_CLASS[entry.faction]}`}
                  >
                    {entry.faction}
                  </span>
                  <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
                    {entry.bookPlacement}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                  {entry.historyBeat}
                </p>
                <p className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    Combat identity:
                  </span>{" "}
                  {entry.combatIdentity}
                </p>
                <p className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    Upgrade hook:
                  </span>{" "}
                  {entry.upgradeHook}
                </p>
                <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Signature tools: {entry.signatureMoves[0]} /{" "}
                  {entry.signatureMoves[1]} / {entry.climaxName}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </details>
  );
}
