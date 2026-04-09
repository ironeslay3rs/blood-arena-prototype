"use client";

import type { AnnouncerStingerPayload } from "./useAnnouncerStingers";

export function AnnouncerStingerToast({
  stinger,
}: {
  stinger: AnnouncerStingerPayload | null;
}) {
  if (!stinger) return null;

  const label = stinger.kind === "streak" ? "Crowd" : "Arena";

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-2"
      role="status"
      aria-live="polite"
    >
      <div className="announcer-stinger-toast max-w-md rounded-lg border border-amber-500/45 bg-zinc-950/90 px-4 py-2 text-center shadow-lg shadow-amber-950/30 backdrop-blur-sm dark:border-amber-400/35">
        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-amber-200/90">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-amber-50">
          {stinger.line}
        </p>
      </div>
    </div>
  );
}
