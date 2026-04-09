function Kbd({ children }: { children: string }) {
  return (
    <kbd className="rounded border border-zinc-400 bg-zinc-100 px-1 py-0.5 font-mono text-[10px] text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200">
      {children}
    </kbd>
  );
}

export function ArenaKeyboardReference() {
  return (
    <details className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 [&::-webkit-details-marker]:hidden">
        Keyboard reference — P1, P2, quick reset
      </summary>
      <div className="space-y-2.5 border-t border-zinc-200 px-3 py-2 text-xs leading-relaxed text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        <p>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            Quick reset
          </span>{" "}
          (round over or Player 1 at 0 HP):{" "}
          <Kbd>R</Kbd>, <Kbd>Esc</Kbd>, <Kbd>Enter</Kbd> — same as Reset match.
        </p>
        <p>
          <span className="font-semibold text-rose-800 dark:text-rose-300">
            P1
          </span>{" "}
          A/D or ←/→ · <Kbd>Shift</Kbd> dash · <Kbd>F</Kbd> attack ·{" "}
          <Kbd>C</Kbd> Climax (meter full, melee range) · hold <Kbd>G</Kbd> block
          · <Kbd>1</Kbd> / <Kbd>2</Kbd> skills
        </p>
        <p>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            P2
          </span>{" "}
          J/L · <Kbd>O</Kbd> dash · <Kbd>U</Kbd> attack · <Kbd>M</Kbd> Climax ·{" "}
          <Kbd>I</Kbd> block · <Kbd>[</Kbd> <Kbd>]</Kbd> skills
        </p>
        <p className="text-[10px] text-zinc-500">
          P2 numpad: 4/6 move · 8 dash · 5 attack · * Climax · 0 block · 7/9
          skills. After a <span className="font-medium">clean</span> hit, a short{" "}
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            link
          </span>{" "}
          highlights roster-specific dash/skill routes (P1 bar / P2 card text).
        </p>
        <p className="text-[10px] text-zinc-500">
          Combat log → <span className="font-medium">Highlights</span> trims to
          hits, tempo, and key whiffs. Fighter cards show melee reach vs arena
          Gap.
        </p>
      </div>
    </details>
  );
}
