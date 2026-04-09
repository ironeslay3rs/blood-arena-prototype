import type { OpponentControllerKind } from "./arenaTypes";

/** Short label used on the arena and match banner (same copy everywhere). */
export function opponentModeChipLabel(mode: OpponentControllerKind): string {
  switch (mode) {
    case "local_human":
      return "Hot-seat PvP";
    case "dummy":
      return "Training vs AI";
    case "remote":
      return "Online (stub)";
  }
}

/** Tailwind classes for the mode chip (banner + stage). */
export function opponentModeChipClassName(
  mode: OpponentControllerKind,
): string {
  switch (mode) {
    case "local_human":
      return "border-emerald-700/50 bg-emerald-950/75 text-emerald-200/95";
    case "dummy":
      return "border-amber-700/50 bg-amber-950/75 text-amber-200/95";
    case "remote":
      return "border-zinc-600/80 bg-zinc-950/80 text-zinc-400";
  }
}
