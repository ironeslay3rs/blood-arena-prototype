import type {
  ArenaResources,
  FighterProgressEntry,
  FighterRole,
  MatchResult,
  ResourceFocusId,
} from "@/features/arena/arenaTypes";
import { WIN_CREDIT_REWARD } from "@/features/arena/arenaActions";
import { ResourceFocusToolbar } from "@/features/arena/ResourceFocusToolbar";
import {
  BRIBE_CREDITS_COST,
  BRIBE_PENALTY_REDUCTION,
  REINFORCE_HP_BONUS,
  REINFORCE_IRONHEART_COST,
  RITUAL_ATTACK_BONUS,
  RITUAL_BLOOD_CHITS_COST,
} from "@/features/arena/arenaSpend";

type MatchHudProps = {
  title: string;
  winner: FighterRole | null;
  resources: ArenaResources;
  lastMatchResult: MatchResult | null;
  pendingHpPenalty: number;
  nextMatchHpBonus: number;
  nextMatchAttackBonus: number;
  spendUnlocked: boolean;
  activeFighterName: string;
  activeFighterCareer: FighterProgressEntry;
  /** Run-wide combat rhythm (−3…+3), mirrored from arena state. */
  combatTempo: number;
  onResetMatch: () => void;
  onReinforceBody: () => void;
  onBribeHandler: () => void;
  onBloodRitual: () => void;
  resourceFocus: ResourceFocusId | null;
  onResourceFocusChange: (focus: ResourceFocusId | null) => void;
};

const TEMPO_MIN = -3;
const TEMPO_MAX = 3;

function clampTempoDisplay(n: number): number {
  return Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, Math.round(n)));
}

function tempoStateLabel(t: number): string {
  if (t <= -2) return "Fractured rhythm";
  if (t >= 2) return "Blood rising";
  return "Balanced tempo";
}

function tempoEffectSummary(t: number): string {
  if (t >= 2) return "Bio hits gain +1 damage";
  if (t <= -2) return "Pure healing gains +1";
  return "No active tempo bonus";
}

function tempoPanelTone(t: number): {
  card: string;
  value: string;
  label: string;
  hint: string;
} {
  if (t <= -2) {
    return {
      card: "border-amber-800/55 bg-amber-950/40 dark:border-amber-800/50 dark:bg-amber-950/30",
      value: "text-amber-100",
      label: "text-amber-200/95",
      hint: "text-amber-200/70",
    };
  }
  if (t >= 2) {
    return {
      card: "border-rose-600/50 bg-rose-950/40 dark:border-rose-600/45 dark:bg-rose-950/35",
      value: "text-rose-100",
      label: "text-rose-200/95",
      hint: "text-rose-200/75",
    };
  }
  return {
    card: "border-zinc-200 bg-zinc-50/90 dark:border-zinc-700 dark:bg-zinc-900/45",
    value: "text-zinc-900 dark:text-zinc-50",
    label: "text-zinc-700 dark:text-zinc-300",
    hint: "text-zinc-500 dark:text-zinc-400",
  };
}

export function MatchHud({
  title,
  winner,
  resources,
  lastMatchResult,
  pendingHpPenalty,
  nextMatchHpBonus,
  nextMatchAttackBonus,
  spendUnlocked,
  activeFighterName,
  activeFighterCareer,
  combatTempo,
  onResetMatch,
  onReinforceBody,
  onBribeHandler,
  onBloodRitual,
  resourceFocus,
  onResourceFocusChange,
}: MatchHudProps) {
  const subtitle =
    winner === "player"
      ? "You cleared the dummy."
      : winner === "opponent"
        ? "You were defeated."
        : "Side-view 1v1 vs. training dummy — local prototype.";

  const showOutcome = winner != null && lastMatchResult != null;
  const r = resources;

  const canReinforce =
    spendUnlocked && r.ironheart >= REINFORCE_IRONHEART_COST;
  const canBribe =
    spendUnlocked &&
    pendingHpPenalty > 0 &&
    r.credits >= BRIBE_CREDITS_COST;
  const canRitual =
    spendUnlocked && r.bloodChits >= RITUAL_BLOOD_CHITS_COST;

  const spendHint = spendUnlocked
    ? "Between bouts or before first blood — spend resources here (no shop)."
    : "Finish the exchange or return to full health to spend resources.";

  const tempo = clampTempoDisplay(combatTempo);
  const tempoTone = tempoPanelTone(tempo);

  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Black Market bridge (not a full economy)
        </p>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
          Credits {r.credits} · Ironheart {r.ironheart} · Blood chits {r.bloodChits}
        </p>
        <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
          Lumens {r.lumens} · Scrap {r.scrap} · Parts {r.parts}
        </p>
        <ResourceFocusToolbar
          focus={resourceFocus}
          onFocusChange={onResourceFocusChange}
        />

        <aside
          className={`mt-3 max-w-sm rounded-lg border px-3 py-2.5 ${tempoTone.card}`}
          aria-label="Combat tempo"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Combat tempo
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span
              className={`text-2xl font-bold tabular-nums leading-none ${tempoTone.value}`}
            >
              {tempo > 0 ? `+${tempo}` : tempo}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              ({TEMPO_MIN} … {TEMPO_MAX})
            </span>
          </div>
          <p className={`mt-1.5 text-sm font-medium ${tempoTone.label}`}>
            {tempoStateLabel(tempo)}
          </p>
          <p className={`mt-1 text-xs leading-snug ${tempoTone.hint}`}>
            {tempoEffectSummary(tempo)}
          </p>
        </aside>

        {(nextMatchHpBonus > 0 || nextMatchAttackBonus > 0) && (
          <p className="mt-2 text-xs text-violet-700 dark:text-violet-300">
            Queued for next reset: +{nextMatchHpBonus} max HP · +
            {nextMatchAttackBonus} attack (consumed when you start the next
            match)
          </p>
        )}
        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
          {activeFighterName} — Lv.{activeFighterCareer.level} ·{" "}
          {activeFighterCareer.wins}W / {activeFighterCareer.losses}L
        </p>
        {showOutcome && lastMatchResult === "win" ? (
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
            Result: win — includes +{WIN_CREDIT_REWARD} credit stipend (totals above)
          </p>
        ) : null}
        {showOutcome && lastMatchResult === "loss" ? (
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
            Result: loss — next spawn max HP reduced by {pendingHpPenalty} (clears
            on a win)
          </p>
        ) : null}
        {winner == null && pendingHpPenalty > 0 ? (
          <p className="mt-1 text-xs text-zinc-500">
            Penalty active: −{pendingHpPenalty} max HP this match.
          </p>
        ) : null}

        <div className="mt-4 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Arena spending
          </p>
          <p className="mt-1 text-xs text-zinc-500">{spendHint}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!canReinforce}
              title={`${REINFORCE_IRONHEART_COST} ironheart → +${REINFORCE_HP_BONUS} max HP on next reset`}
              className="rounded border border-zinc-300 px-2 py-1.5 text-left text-xs disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200"
              onClick={onReinforceBody}
            >
              <span className="font-medium">Reinforce body</span>
              <span className="block text-zinc-500">
                {REINFORCE_IRONHEART_COST} ironheart · +{REINFORCE_HP_BONUS} max
                HP next match
              </span>
            </button>
            <button
              type="button"
              disabled={!canBribe}
              title={`${BRIBE_CREDITS_COST} credits → −${BRIBE_PENALTY_REDUCTION} pending HP penalty`}
              className="rounded border border-zinc-300 px-2 py-1.5 text-left text-xs disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200"
              onClick={onBribeHandler}
            >
              <span className="font-medium">Bribe handler</span>
              <span className="block text-zinc-500">
                {BRIBE_CREDITS_COST} credits · −{BRIBE_PENALTY_REDUCTION} max-HP
                penalty
              </span>
            </button>
            <button
              type="button"
              disabled={!canRitual}
              title={`${RITUAL_BLOOD_CHITS_COST} blood chits → +${RITUAL_ATTACK_BONUS} attack next reset`}
              className="rounded border border-zinc-300 px-2 py-1.5 text-left text-xs disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200"
              onClick={onBloodRitual}
            >
              <span className="font-medium">Blood ritual</span>
              <span className="block text-zinc-500">
                {RITUAL_BLOOD_CHITS_COST} blood chits · +{RITUAL_ATTACK_BONUS}{" "}
                damage next match
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          onClick={onResetMatch}
        >
          Reset match
        </button>
      </div>
    </header>
  );
}
