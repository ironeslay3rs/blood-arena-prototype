"use client";

import type { FighterProfile } from "@/features/arena/arenaTypes";

type FighterProfilePanelProps = {
  profile: FighterProfile | undefined;
  /** Canon / saga display name */
  identityName: string;
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="tabular-nums text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  );
}

function MilestoneLine({
  label,
  earned,
}: {
  label: string;
  earned: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-2 text-sm ${
        earned
          ? "text-zinc-800 dark:text-zinc-200"
          : "text-zinc-400 dark:text-zinc-500"
      }`}
    >
      <span className="mt-0.5 w-4 shrink-0 font-mono text-xs" aria-hidden>
        {earned ? "✓" : "·"}
      </span>
      <span>{label}</span>
    </div>
  );
}

export function FighterProfilePanel({
  profile,
  identityName,
}: FighterProfilePanelProps) {
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const dealt = profile?.totalDamageDealt ?? 0;
  const taken = profile?.totalDamageTaken ?? 0;
  const arenaRemembers = profile?.milestoneArenaRemembersName === true;
  const noLongerPrey = profile?.milestoneNoLongerPrey === true;

  return (
    <article
      className="rounded-xl border border-zinc-200 bg-zinc-50/90 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/50"
      aria-label="Fighter profile"
    >
      <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {identityName}
      </h2>
      <p className="mb-4 text-xs text-zinc-500">Rune Trials profile</p>

      <div className="mb-4 space-y-2 border-b border-zinc-200 pb-4 dark:border-zinc-700">
        <StatRow label="Record" value={`${wins}W / ${losses}L`} />
        <StatRow
          label="Damage dealt"
          value={Math.round(dealt).toLocaleString()}
        />
        <StatRow
          label="Damage taken"
          value={Math.round(taken).toLocaleString()}
        />
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Milestones
      </p>
      <div className="space-y-2">
        <MilestoneLine
          earned={arenaRemembers}
          label="Arena remembers your name"
        />
        <MilestoneLine earned={noLongerPrey} label="You are no longer prey" />
      </div>
    </article>
  );
}
