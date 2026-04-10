"use client";

import type {
  ArenaResources,
  FighterProgressEntry,
  LastBoutLedger,
  UnifiedFighterIdentity,
} from "@/features/arena/arenaTypes";
import { lastBoutLedgerLine } from "@/features/arena/arenaGrowthLedgerReadout";
import {
  growthLevelCombatBonusesLine,
  winsToNextLevelFromWins,
} from "@/features/arena/arenaGrowthReadout";
import { ARENA_SPEND_PREVIEW_LINES } from "@/features/arena/arenaSpendReadout";

/** Surfaces stream F — career, identity, ledger, spend clarity (BP-45 + BP-46). */
export function GrowthUpgradePanel({
  fighterName,
  career,
  resources,
  identity,
  lastBoutLedger,
  winStreak,
  pendingHpPenalty,
  nextMatchHpBonus,
  nextMatchAttackBonus,
  peerCareer,
}: {
  fighterName: string;
  career: FighterProgressEntry;
  resources: ArenaResources;
  identity: UnifiedFighterIdentity;
  lastBoutLedger: LastBoutLedger | null;
  winStreak: number;
  pendingHpPenalty: number;
  nextMatchHpBonus: number;
  nextMatchAttackBonus: number;
  /** Relay: opponent-disclosed career (symmetric); optional `displayLabel` from `?netplayLabel=`. */
  peerCareer: { wins: number; level: number; displayLabel?: string } | null;
}) {
  const need = winsToNextLevelFromWins(career.wins);
  const lastBout = lastBoutLedgerLine(lastBoutLedger, winStreak);
  const prepParts: string[] = [];
  if (pendingHpPenalty > 0) {
    prepParts.push(`next spawn max HP −${pendingHpPenalty} from last loss`);
  }
  if (nextMatchHpBonus > 0) {
    prepParts.push(`+${nextMatchHpBonus} max HP from Reinforce (next spawn)`);
  }
  if (nextMatchAttackBonus > 0) {
    prepParts.push(`+${nextMatchAttackBonus} attack from Blood ritual (next spawn)`);
  }
  const prepLine =
    prepParts.length > 0 ? `Queued: ${prepParts.join(" · ")}.` : null;

  return (
    <details className="rounded-lg border border-rose-200/80 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/25">
      <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-rose-900 dark:text-rose-100 [&::-webkit-details-marker]:hidden">
        Your upgrade path (persistent) — stream F
      </summary>
      <div className="space-y-2 border-t border-rose-200/80 px-3 py-2 text-xs leading-relaxed text-zinc-700 dark:border-rose-900/45 dark:text-zinc-300">
        <p>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {fighterName}
          </span>
          {" — "}
          <span className="tabular-nums">
            Lv.{career.level} · {career.wins}W / {career.losses}L
          </span>
        </p>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-rose-800 dark:text-rose-200">
            {identity.displayName}
          </span>
          {" — "}
          {identity.arenaTitle} · {identity.keyTraitDisplay} ·{" "}
          {identity.evolutionTierDisplay}
        </p>
        <p className="text-[11px] italic text-zinc-600 dark:text-zinc-400">
          “{identity.identityLine}”
        </p>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-rose-800 dark:text-rose-200">
            {identity.reputation.title}
          </span>
          {" — "}
          {identity.reputation.descriptor}
        </p>
        <p className="text-[11px] tabular-nums text-zinc-600 dark:text-zinc-400">
          Career damage (profile): {identity.totalDamageDealt.toLocaleString()}{" "}
          dealt · {identity.totalDamageTaken.toLocaleString()} taken
        </p>
        {peerCareer != null ? (
          <p className="text-[11px] text-violet-800 dark:text-violet-200/90">
            Online opponent (disclosed)
            {peerCareer.displayLabel != null && peerCareer.displayLabel.length > 0
              ? ` “${peerCareer.displayLabel}”`
              : ""}
            : Lv.{peerCareer.level} · {peerCareer.wins} career wins — same ladder
            rules as you (symmetric).
          </p>
        ) : null}
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-rose-800 dark:text-rose-200">
            {need} win{need === 1 ? "" : "s"}
          </span>{" "}
          to the next level tier (three career wins per level step).
        </p>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
          {growthLevelCombatBonusesLine(career.level)}
        </p>
        {lastBout != null ? (
          <p className="text-[11px] text-zinc-700 dark:text-zinc-300">{lastBout}</p>
        ) : (
          <p className="text-[11px] text-zinc-500">
            Last bout: finish a round to see stipend or salvage here.
          </p>
        )}
        {prepLine != null ? (
          <p className="text-[11px] text-amber-900/90 dark:text-amber-200/85">
            {prepLine}
          </p>
        ) : null}
        <div className="rounded-md border border-zinc-200/90 bg-white/60 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-950/50">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Between-round spends (header buttons when unlocked)
          </p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px] text-zinc-700 dark:text-zinc-300">
            {ARENA_SPEND_PREVIEW_LINES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-zinc-200/90 bg-white/60 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-950/50">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Black Market resources (totals)
          </p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-zinc-800 dark:text-zinc-200">
            Credits {resources.credits} · Ironheart {resources.ironheart} · Blood{" "}
            {resources.bloodChits} · Lumens {resources.lumens} · Scrap{" "}
            {resources.scrap} · Parts {resources.parts}
          </p>
        </div>
        <p className="text-[10px] text-zinc-500">
          Honest ledger for the &quot;keep upgrading yourself&quot; hook (master plan §1,
          §15).
        </p>
      </div>
    </details>
  );
}
