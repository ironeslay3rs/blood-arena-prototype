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
import {
  ARENA_SESSION_FIRST_TO,
  formatSessionScoreLine,
  sessionDeciderLine,
  sessionMatchPointCopy,
  sessionMatchPointRole,
  sessionSetCompleteHeadline,
  sessionSetIsComplete,
  sessionSetWinnerRole,
} from "@/features/arena/arenaSessionScore";
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
  /** Sound + optional vibration on hits and round start; persists in localStorage. */
  combatFeedbackEnabled?: boolean;
  onToggleCombatFeedback?: () => void;
  /** Local / relay PvP: running session games won (hidden for training vs AI). */
  sessionRoundWins?: [number, number] | null;
  sessionFirstTo?: number;
  /** After first-to is reached — zeroes session score for the next locals set (BP-42). */
  onNextSessionSet?: () => void;
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

/** One line — tempo is a combat feel lever, not a manual. */
function tempoFightStyleBody(t: number): string {
  if (t >= 2) {
    return "Hot rhythm — faster tools & motion. Bio damage spikes.";
  }
  if (t <= -2) {
    return "Cold rhythm — heavier recovery. Pure heals spike.";
  }
  if (t >= 1) {
    return "Pressing — slightly faster cooldowns & UI beats.";
  }
  if (t <= -1) {
    return "Measured — slightly slower recovery cadence.";
  }
  return "Neutral pacing — no faction tempo swing.";
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
  return "Online — relay lockstep (see strip below when connected).";
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
  combatFeedbackEnabled = true,
  onToggleCombatFeedback,
  sessionRoundWins = null,
  sessionFirstTo = ARENA_SESSION_FIRST_TO,
  onNextSessionSet,
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

  const sessionComplete =
    sessionRoundWins != null &&
    sessionSetIsComplete(sessionRoundWins, sessionFirstTo);
  const sessionSetWin =
    sessionRoundWins != null && sessionComplete
      ? sessionSetWinnerRole(sessionRoundWins, sessionFirstTo)
      : null;
  const sessionMp =
    sessionRoundWins != null && !sessionComplete
      ? sessionMatchPointRole(sessionRoundWins, sessionFirstTo)
      : null;
  const sessionDecider =
    sessionRoundWins != null && !sessionComplete
      ? sessionDeciderLine(sessionRoundWins, sessionFirstTo)
      : null;

  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        <p className="mt-1 text-xs leading-snug text-zinc-500 dark:text-zinc-500">
          PvP-first · one shared screen · stance and spacing decide trades
        </p>
        <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p>
        {sessionRoundWins != null ? (
          <div
            className={`mt-2 max-w-md rounded-lg border px-3 py-2 ${
              sessionComplete
                ? "border-violet-500/50 bg-violet-950/40 dark:border-violet-500/40 dark:bg-violet-950/45"
                : "border-emerald-700/40 bg-emerald-950/30 dark:border-emerald-600/35 dark:bg-emerald-950/40"
            }`}
            role="status"
            aria-live="polite"
            aria-label={
              sessionComplete && sessionSetWin != null
                ? sessionSetCompleteHeadline(
                    sessionSetWin,
                    sessionRoundWins,
                    sessionFirstTo,
                  )
                : sessionMp != null
                  ? `${formatSessionScoreLine(sessionRoundWins, sessionFirstTo)}. ${sessionMatchPointCopy(sessionMp)}`
                  : sessionDecider != null
                    ? `${formatSessionScoreLine(sessionRoundWins, sessionFirstTo)}. ${sessionDecider}`
                    : formatSessionScoreLine(sessionRoundWins, sessionFirstTo)
            }
          >
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                sessionComplete
                  ? "text-violet-200/95"
                  : "text-emerald-300/95"
              }`}
            >
              Session set
            </p>
            <p
              className={`mt-0.5 text-sm font-bold tabular-nums ${
                sessionComplete ? "text-violet-50" : "text-emerald-50"
              }`}
            >
              {formatSessionScoreLine(sessionRoundWins, sessionFirstTo)}
            </p>
            {sessionComplete && sessionSetWin != null ? (
              <>
                <p className="mt-1 text-sm font-semibold text-violet-100">
                  {sessionSetCompleteHeadline(
                    sessionSetWin,
                    sessionRoundWins,
                    sessionFirstTo,
                  )}
                </p>
                {onNextSessionSet != null ? (
                  <button
                    type="button"
                    className="mt-2 w-full rounded-md border border-violet-400/50 bg-violet-900/50 px-3 py-1.5 text-xs font-semibold text-violet-50 transition hover:bg-violet-800/60"
                    onClick={onNextSessionSet}
                  >
                    Next set — reset session score
                  </button>
                ) : null}
              </>
            ) : sessionMp != null ? (
              <p className="mt-1 text-xs font-medium text-emerald-200/95">
                {sessionMatchPointCopy(sessionMp)}
              </p>
            ) : sessionDecider != null ? (
              <p className="mt-1 text-xs font-medium text-emerald-200/95">
                {sessionDecider}
              </p>
            ) : null}
          </div>
        ) : null}
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
        <details className="mt-3 max-w-lg rounded-lg border border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/40">
          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Between-match resources & spending (optional meta)
          </summary>
          <div className="border-t border-zinc-200 px-3 pb-3 pt-2 dark:border-zinc-700">
            <p className="text-xs text-zinc-500">
              Black Market bridge — not a full economy. Collapse this to focus on the fight.
            </p>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              Credits {r.credits} · Ironheart {r.ironheart} · Blood chits{" "}
              {r.bloodChits}
            </p>
            <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
              Lumens {r.lumens} · Scrap {r.scrap} · Parts {r.parts}
            </p>
            <ResourceFocusToolbar
              focus={resourceFocus}
              onFocusChange={onResourceFocusChange}
            />
            <div className="mt-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-700">
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
                    {REINFORCE_IRONHEART_COST} ironheart · +{REINFORCE_HP_BONUS}{" "}
                    max HP next match
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
                    {BRIBE_CREDITS_COST} credits · −{BRIBE_PENALTY_REDUCTION}{" "}
                    max-HP penalty
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
        </details>

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
            Result: win — +{WIN_CREDIT_REWARD} credits (see Between-match resources)
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
      </div>
      <div className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          title="After a round ends or if Player 1 is down: R, Esc, or Enter also reset"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          onClick={onResetMatch}
        >
          Reset match
        </button>
        {onToggleCombatFeedback ? (
          <button
            type="button"
            aria-pressed={combatFeedbackEnabled}
            aria-label={
              combatFeedbackEnabled
                ? "Turn off combat feedback sounds"
                : "Turn on combat feedback sounds"
            }
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
              combatFeedbackEnabled
                ? "border-emerald-600/70 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-600/50 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
            onClick={onToggleCombatFeedback}
          >
            Combat feedback: {combatFeedbackEnabled ? "On" : "Off"}
          </button>
        ) : null}
      </div>
    </header>
  );
}
