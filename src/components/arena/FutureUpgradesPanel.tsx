"use client";

import { useMemo } from "react";
import {
  FUTURE_UPGRADE_CATALOG,
  futureUpgradesForPhase,
  type FuturePhase,
  type ImplementationStatus,
} from "@/features/arena/futureUpgrades";

const PHASE_LABEL: Record<FuturePhase, string> = {
  1: "Phase 1 — Feel multiplier",
  2: "Phase 2 — Expression",
  3: "Phase 3 — Scale",
};

function statusLabel(s?: ImplementationStatus): string {
  if (!s) return "Planned";
  if (s === "shipped") return "Shipped";
  if (s === "in_progress") return "In progress";
  return "Planned";
}

function statusClass(s?: ImplementationStatus): string {
  if (s === "shipped") {
    return "border-emerald-600/60 text-emerald-800 dark:border-emerald-600/50 dark:text-emerald-300";
  }
  if (s === "in_progress") {
    return "border-amber-600/60 text-amber-900 dark:border-amber-600/50 dark:text-amber-200";
  }
  return "border-zinc-400 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400";
}

function UpgradeCard({
  headline,
  intent,
  notes,
  pillar,
  implementation,
}: {
  headline: string;
  intent: string;
  notes?: string;
  pillar: string;
  implementation?: ImplementationStatus;
}) {
  const st = statusLabel(implementation);
  return (
    <li className="rounded-md border border-zinc-200/90 bg-white/40 px-2.5 py-2 dark:border-zinc-700 dark:bg-zinc-900/35">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">
          {headline}
        </p>
        <span
          className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${statusClass(implementation)}`}
        >
          {st}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] leading-snug text-zinc-600 dark:text-zinc-400">
        {intent}
      </p>
      {notes ? (
        <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-500">
          Note: {notes}
        </p>
      ) : null}
      <p className="mt-1 text-[9px] uppercase tracking-wider text-zinc-400">
        {pillar}
      </p>
    </li>
  );
}

export function FutureUpgradesPanel() {
  const statusCounts = useMemo(() => {
    let shipped = 0;
    let planned = 0;
    let inProgress = 0;
    for (const e of FUTURE_UPGRADE_CATALOG) {
      const i = e.implementation ?? "planned";
      if (i === "shipped") shipped += 1;
      else if (i === "in_progress") inProgress += 1;
      else planned += 1;
    }
    return { shipped, planned, inProgress, total: FUTURE_UPGRADE_CATALOG.length };
  }, []);

  return (
    <details className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 [&::-webkit-details-marker]:hidden">
        Future upgrades (fighting-game roadmap)
      </summary>
      <div className="border-t border-zinc-200 px-3 py-3 text-xs dark:border-zinc-700">
        <p className="mb-2 rounded-md border border-zinc-200/80 bg-zinc-50/80 px-2 py-1.5 font-mono text-[10px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
          Catalog: {statusCounts.total} items ·{" "}
          <span className="text-emerald-700 dark:text-emerald-400">
            shipped {statusCounts.shipped}
          </span>
          {" · "}
          <span className="text-zinc-500">
            planned {statusCounts.planned}
          </span>
          {statusCounts.inProgress > 0 ? (
            <>
              {" · "}
              <span className="text-amber-700 dark:text-amber-400">
                in progress {statusCounts.inProgress}
              </span>
            </>
          ) : null}
        </p>
        <p className="mb-3 leading-relaxed text-zinc-600 dark:text-zinc-400">
          Planned direction toward SF/KOF-style <strong>weight</strong> and{" "}
          <strong>climax</strong>, without breaking PvP readability. Master
          plan (milestones, BP backlog, §15 rubric):{" "}
          <code className="rounded bg-zinc-100 px-1 text-[10px] dark:bg-zinc-800">
            docs/BLOOD_ARENA_MASTER_PLAN.md
          </code>{" "}
          · tactical list:{" "}
          <code className="rounded bg-zinc-100 px-1 text-[10px] dark:bg-zinc-800">
            docs/FIGHTING_GAME_ROADMAP.md
          </code>
          .
        </p>
        {([1, 2, 3] as const).map((phase) => (
          <div key={phase} className="mb-4 last:mb-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              {PHASE_LABEL[phase]}
            </p>
            <ul className="space-y-2">
              {futureUpgradesForPhase(phase).map((u) => (
                <UpgradeCard
                  key={u.id}
                  headline={u.headline}
                  intent={u.designerIntent}
                  notes={u.dependencyNotes}
                  pillar={u.pillar}
                  implementation={u.implementation}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
