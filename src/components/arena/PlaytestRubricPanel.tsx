"use client";

import { useCallback, useState } from "react";
import {
  PLAYTEST_ANTI_GOALS,
  PLAYTEST_RUBRIC,
  PLAYTEST_SESSION_GUIDANCE,
} from "@/features/arena/playtestRubric";
import { buildPlaytestRubricClipboardText } from "@/features/arena/playtestRubricClipboard";

export function PlaytestRubricPanel() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "err">("idle");

  const copyWorksheet = useCallback(async () => {
    const text = buildPlaytestRubricClipboardText();
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("err");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  }, []);

  return (
    <details className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 [&::-webkit-details-marker]:hidden">
        Playtest rubric (T1–T6) — §15
      </summary>
      <div className="space-y-3 border-t border-zinc-200 px-3 py-2 text-xs leading-relaxed text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded border border-zinc-300 bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-800 transition hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            onClick={() => void copyWorksheet()}
          >
            Copy worksheet to clipboard
          </button>
          {copyState === "copied" ? (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
              Copied.
            </span>
          ) : null}
          {copyState === "err" ? (
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              Clipboard blocked — select text manually.
            </span>
          ) : null}
        </div>
        <p>{PLAYTEST_SESSION_GUIDANCE}</p>
        <ol className="list-decimal space-y-2 pl-4">
          {PLAYTEST_RUBRIC.map((row) => (
            <li key={row.id}>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {row.id} — {row.title}
              </span>
              <span className="block text-[11px] text-zinc-600 dark:text-zinc-400">
                {row.prompt}
              </span>
            </li>
          ))}
        </ol>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Anti-goals (avoid)
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-zinc-500">
            {PLAYTEST_ANTI_GOALS.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <p className="text-[10px] text-zinc-500">
          Full contract:{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
            docs/BLOOD_ARENA_MASTER_PLAN.md
          </code>{" "}
          section 15.
        </p>
      </div>
    </details>
  );
}
