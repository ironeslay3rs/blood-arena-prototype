"use client";

import type { ResourceFocusId } from "./arenaTypes";

export function resourceFocusHudLabel(focus: ResourceFocusId | null): string {
  if (focus === "ironheart") return "Focus: ironheart salvage";
  if (focus === "bloodChits") return "Focus: blood chits";
  if (focus === "lumens") return "Focus: lumens";
  return "Resource focus: balanced";
}

type ResourceFocusToolbarProps = {
  focus: ResourceFocusId | null;
  onFocusChange: (focus: ResourceFocusId | null) => void;
};

const BTN =
  "rounded border border-zinc-300 px-2 py-1 text-xs transition dark:border-zinc-600 dark:text-zinc-200";
const ACTIVE =
  "border-violet-500 bg-violet-50 font-medium text-violet-900 dark:border-violet-400 dark:bg-violet-950/50 dark:text-violet-100";

export function ResourceFocusToolbar({
  focus,
  onFocusChange,
}: ResourceFocusToolbarProps) {
  return (
    <div className="mt-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Resource focus (win rewards)
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        Favored type pays out more; other bridge resources dip slightly. No skill
        tree — pick anytime.
      </p>
      <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">
        {resourceFocusHudLabel(focus)}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className={`${BTN} ${focus === null ? ACTIVE : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
          onClick={() => onFocusChange(null)}
        >
          Balanced
        </button>
        <button
          type="button"
          className={`${BTN} ${focus === "ironheart" ? ACTIVE : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
          onClick={() => onFocusChange("ironheart")}
        >
          Ironheart
        </button>
        <button
          type="button"
          className={`${BTN} ${focus === "bloodChits" ? ACTIVE : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
          onClick={() => onFocusChange("bloodChits")}
        >
          Blood chits
        </button>
        <button
          type="button"
          className={`${BTN} ${focus === "lumens" ? ACTIVE : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
          onClick={() => onFocusChange("lumens")}
        >
          Lumens
        </button>
      </div>
    </div>
  );
}
