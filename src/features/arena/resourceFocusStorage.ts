import type { ResourceFocusId } from "./arenaTypes";

const STORAGE_KEY = "blood-arena:arena-resource-focus:v1";

const VALID: ReadonlySet<string> = new Set([
  "ironheart",
  "bloodChits",
  "lumens",
]);

export function loadResourceFocus(): ResourceFocusId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "" || raw === "null") return null;
    if (VALID.has(raw)) return raw as ResourceFocusId;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveResourceFocus(focus: ResourceFocusId | null): void {
  if (typeof window === "undefined") return;
  try {
    if (focus == null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, focus);
  } catch {
    /* quota / private mode */
  }
}
