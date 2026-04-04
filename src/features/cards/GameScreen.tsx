"use client";

import { useTrialGame } from "./useTrialGame";

export function GameScreen() {
  const { ready, state } = useTrialGame();

  if (!ready || state == null) {
    return (
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Loading Rune Trials…</p>
      </div>
    );
  }

  const b = state.bonuses;
  const r = state.resourcesSnapshot;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Black Market: Rune Trials
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Prototype trial — Arena resources apply as small additive bonuses only.
        </p>
      </header>

      <section
        className="rounded-lg border border-violet-200 bg-violet-50/80 p-4 dark:border-violet-900 dark:bg-violet-950/40"
        aria-label="Active Arena spoils bonuses"
      >
        <h2 className="text-sm font-semibold text-violet-900 dark:text-violet-200">
          Active Arena bonuses
        </h2>
        <ul className="mt-2 space-y-1 text-sm text-violet-950 dark:text-violet-100">
          <li>
            <span className="font-medium">Champions +{b.subjectHpBonus} HP</span>{" "}
            <span className="text-violet-800/90 dark:text-violet-300/90">
              (ironheart {r.ironheart} → +1 per 6, max +3)
            </span>
          </li>
          <li>
            <span className="font-medium">
              Champions +{b.subjectAttackBonus} attack
            </span>{" "}
            <span className="text-violet-800/90 dark:text-violet-300/90">
              (blood chits {r.bloodChits} → +1 per 12, max +2)
            </span>
          </li>
          <li>
            <span className="font-medium">
              Opening draw +{b.openingDrawBonus}
            </span>{" "}
            <span className="text-violet-800/90 dark:text-violet-300/90">
              (if blood chits ≥ 20)
            </span>
          </li>
          <li>
            <span className="font-medium">
              Sustain +{b.sustainRegenBonus} heal / round
            </span>{" "}
            <span className="text-violet-800/90 dark:text-violet-300/90">
              (lumens {r.lumens} → +1 per 10, max +2; hook for end-of-round)
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Trial champions
        </h2>
        <ul className="space-y-2">
          {state.subjects.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-1 rounded border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {s.name}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  HP {s.hp}/{s.maxHp} · Attack {s.attack}
                </span>
              </div>
              <p className="text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                {s.flavorLine}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Trial log
        </h2>
        <ul className="space-y-1 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          {state.log.map((e) => (
            <li key={e.id} className="text-zinc-700 dark:text-zinc-300">
              {e.message}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
