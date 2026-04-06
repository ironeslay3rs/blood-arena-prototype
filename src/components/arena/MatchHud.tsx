import type {
  ArenaResources,
  FighterProgressEntry,
  FighterRole,
  MatchResult,
  OpponentControllerKind,
  ReputationSnapshot,
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
  opponentController: OpponentControllerKind;
  /** Player-visible reputation (offline). */
  playerReputation: ReputationSnapshot;
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

/** How this tempo *reads* as a fighting identity (HUD). */
function tempoFightStyleHeadline(t: number): string {
  if (t >= 2) return "You dictate the exchange";
  if (t <= -2) return "You fight like you have something to lose";
  if (t >= 1) return "Edging into their space";
  if (t <= -1) return "Picking your windows";
  return "Even footing";
}

/** Mechanical reminder + pacing hint (same bonuses as before). */
function tempoFightStyleBody(t: number): string {
  if (t >= 2) {
    return "Burst rhythm—tools and combat motion both run hotter; combat log leans aggressive. Bio strikes +1.";
  }
  if (t <= -2) {
    return "Grind rhythm—tools and on-screen recovery both run heavier; combat log leans survival. Pure heals +1.";
  }
  if (t >= 1) {
    return "Slightly faster exchanges—cooldowns and on-screen beats both pick up. No faction tempo bonus yet.";
  }
  if (t <= -1) {
    return "Slightly heavier recovery—cooldowns and combat motion both ease down. No faction tempo bonus yet.";
  }
  return "Neutral—no faction tempo bonus; even pacing.";
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

function matchSubtitle(
  winner: FighterRole | null,
  mode: OpponentControllerKind,
): string {
  if (winner === "player") {
    if (mode === "dummy") return "Player 1 wins — training opponent down.";
    return "Player 1 wins the exchange.";
  }
  if (winner === "opponent") {
    if (mode === "dummy") return "Player 1 is down — training continues.";
    return "Player 2 wins the exchange.";
  }
  if (mode === "dummy") {
    return "Training vs AI — same combat rules as PvP; bot uses the same kit.";
  }
  if (mode === "local_human") {
    return "Local PvP — Player 1 vs Player 2, same systems, shared screen.";
  }
  return "Online PvP (stub) — reserved for networked play.";
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
  opponentController,
  playerReputation,
  onResetMatch,
  onReinforceBody,
  onBribeHandler,
  onBloodRitual,
  resourceFocus,
  onResourceFocusChange,
}: MatchHudProps) {
  const subtitle = matchSubtitle(winner, opponentController);

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
        <div
          className="mt-2 max-w-md rounded-lg border border-amber-200/90 bg-amber-50/60 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/35"
          aria-label="Your reputation"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900/90 dark:text-amber-300/90">
            Known in the arena
          </p>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {playerReputation.title}
          </p>
          <p className="text-xs leading-snug text-zinc-600 dark:text-zinc-400">
            {playerReputation.descriptor}
          </p>
        </div>
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
            {tempoFightStyleHeadline(tempo)}
          </p>
          <p className={`mt-1 text-xs leading-snug ${tempoTone.hint}`}>
            {tempoFightStyleBody(tempo)}
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
