"use client";

import type { CombatLogEntry } from "@/features/arena/arenaTypes";
import { useEffect, useMemo, useRef, useState } from "react";

/** Tempo, reputation, HP exchanges, whiffs, and attack telegraphs — faster to scan than full log. */
function isCombatHighlight(e: CombatLogEntry): boolean {
  if (e.kind === "tempo" || e.kind === "reputation") return true;
  const m = e.message;
  if (/ for \d+ HP/.test(m)) return true;
  if (m.includes("out of range")) return true;
  if (/\.attacked\.$/.test(m.trim())) return true;
  if (m.includes("struck with") && m.includes("HP")) return true;
  if (m.includes("(blocked)") || m.includes("(clean)")) return true;
  if (m.includes("(no damage)")) return true;
  return false;
}

function lineClassName(e: CombatLogEntry): string | undefined {
  if (e.kind === "tempo" || e.kind === "reputation") return undefined;
  const m = e.message;
  if (m.includes(" for ") && m.includes("HP") && /for \d+ HP/.test(m)) {
    return "border-l-2 border-rose-500/80 pl-2 text-rose-950/95 dark:border-rose-500/60 dark:text-rose-100/95";
  }
  return undefined;
}

export function CombatLog({ entries }: { entries: CombatLogEntry[] }) {
  const bottomRef = useRef<HTMLLIElement>(null);
  const [filter, setFilter] = useState<"all" | "highlights">("all");

  const visible = useMemo(
    () =>
      filter === "all" ? entries : entries.filter(isCombatHighlight),
    [entries, filter],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [entries.length, visible.length, filter]);

  return (
    <section
      className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
      aria-label="Combat log"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Combat log
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex rounded-md border border-zinc-300 p-0.5 dark:border-zinc-600"
            role="group"
            aria-label="Log filter"
          >
            <button
              type="button"
              aria-pressed={filter === "all"}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
                filter === "all"
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            <button
              type="button"
              aria-pressed={filter === "highlights"}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
                filter === "highlights"
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
              onClick={() => setFilter("highlights")}
            >
              Highlights
            </button>
          </div>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
            HP damage tinted
          </p>
        </div>
      </div>
      <ul
        className="max-h-52 space-y-1 overflow-y-auto font-mono text-xs text-zinc-700 dark:text-zinc-300"
        aria-live="polite"
        aria-relevant="additions"
      >
        {visible.length === 0 ? (
          <li className="py-2 text-zinc-500">No lines match this filter yet.</li>
        ) : (
          visible.map((e) => {
            const special =
              e.kind === "tempo"
                ? "border-l-2 border-zinc-400 pl-2 font-sans text-[11px] font-medium tracking-wide text-zinc-600 dark:border-zinc-500 dark:text-zinc-400"
                : e.kind === "reputation"
                  ? "border-l-2 border-rose-500 pl-2 font-sans text-[11px] font-medium italic text-rose-900/90 dark:border-rose-500 dark:text-rose-200/95"
                  : lineClassName(e);
            return (
              <li key={e.id} className={special}>
                {e.message}
              </li>
            );
          })
        )}
        <li ref={bottomRef} className="h-0 overflow-hidden p-0" aria-hidden />
      </ul>
    </section>
  );
}
