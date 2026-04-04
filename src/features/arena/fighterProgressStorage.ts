import type { FighterProgressMap } from "./arenaTypes";
import { createDefaultFighterProgress, mergeLoadedProgress } from "./fighterProgress";

const STORAGE_KEY = "blood-arena:fighter-progress:v1";

export function loadFighterProgress(): FighterProgressMap {
  if (typeof window === "undefined") return createDefaultFighterProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return createDefaultFighterProgress();
    return mergeLoadedProgress(JSON.parse(raw) as unknown);
  } catch {
    return createDefaultFighterProgress();
  }
}

export function saveFighterProgress(progress: FighterProgressMap): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    /* quota / private mode */
  }
}
