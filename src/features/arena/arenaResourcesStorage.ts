import type { ArenaResources } from "./arenaTypes";
import { DEFAULT_ARENA_RESOURCES, mergeArenaResources } from "./arenaResources";

const STORAGE_KEY = "blood-arena:arena-resources:v1";

export function loadArenaResources(): ArenaResources {
  if (typeof window === "undefined") return { ...DEFAULT_ARENA_RESOURCES };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return { ...DEFAULT_ARENA_RESOURCES };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ...DEFAULT_ARENA_RESOURCES };
    }
    return mergeArenaResources(parsed as Partial<ArenaResources>);
  } catch {
    return { ...DEFAULT_ARENA_RESOURCES };
  }
}

export function saveArenaResources(resources: ArenaResources): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
  } catch {
    /* quota / private mode */
  }
}
