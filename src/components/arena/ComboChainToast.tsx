"use client";

export function ComboChainToast({
  p1Hits,
  p2Hits,
}: {
  p1Hits: number;
  p2Hits: number;
}) {
  if (p1Hits < 2 && p2Hits < 2) return null;

  return (
    <div
      className="pointer-events-none absolute right-2 top-2 z-[25] flex flex-col items-end gap-1"
      aria-live="polite"
    >
      {p1Hits >= 2 ? (
        <div className="combo-chain-pill rounded-md border border-rose-500/50 bg-zinc-950/88 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-rose-200 shadow-md shadow-rose-950/40 backdrop-blur-sm">
          P1 ×{p1Hits}
        </div>
      ) : null}
      {p2Hits >= 2 ? (
        <div className="combo-chain-pill rounded-md border border-amber-500/50 bg-zinc-950/88 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-200 shadow-md shadow-amber-950/40 backdrop-blur-sm">
          P2 ×{p2Hits}
        </div>
      ) : null}
    </div>
  );
}
