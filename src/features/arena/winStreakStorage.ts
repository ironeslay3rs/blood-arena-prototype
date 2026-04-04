const STORAGE_KEY = "blood-arena:arena-win-streak:v1";

function clampNonNegativeInt(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function loadWinStreak(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return 0;
    const parsed = Number.parseInt(raw, 10);
    return clampNonNegativeInt(parsed);
  } catch {
    return 0;
  }
}

export function saveWinStreak(streak: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, String(clampNonNegativeInt(streak)));
  } catch {
    /* quota / private mode */
  }
}
