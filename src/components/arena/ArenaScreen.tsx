"use client";

import type { CSSProperties } from "react";
import type { FighterId, OpponentControllerKind } from "@/features/arena/arenaTypes";
import { tempoCombatAnimationSpeedMultiplier } from "@/features/arena/arenaActions";
import { canSpendArenaPrep } from "@/features/arena/arenaSpend";
import { buildUnifiedPlayerIdentity } from "@/features/arena/fighterIdentity";
import { reputationForArenaFighter } from "@/features/arena/fighterReputation";
import { useArenaEngine } from "@/features/arena/useArenaEngine";
import { ArenaStage } from "./ArenaStage";
import { CombatLog } from "./CombatLog";
import { FighterPanel } from "./FighterPanel";
import { MatchHud } from "./MatchHud";
import { SkillBar } from "./SkillBar";
import { useCombatFeedback } from "./useCombatFeedback";

/** Local PvP first — training vs AI is secondary. */
const OPPONENT_MODES: {
  id: OpponentControllerKind;
  label: string;
  description: string;
}[] = [
  {
    id: "local_human",
    label: "Local PvP (hot-seat)",
    description: "Default — Player 1 vs Player 2, same combat systems.",
  },
  {
    id: "dummy",
    label: "Training (vs AI)",
    description: "Solo practice — bot controls Player 2 with the same kit rules.",
  },
  { id: "remote", label: "Online (stub)", description: "Reserved." },
];

const PLAYER_FIGHTER_OPTIONS: { label: string; fighterId: FighterId }[] = [
  { label: "Werewolf", fighterId: "feral-hound" },
  { label: "Paladin", fighterId: "vault-disciple" },
  { label: "Silver Knight", fighterId: "ironheart-cadet" },
  { label: "Feral Hound", fighterId: "feral-hound" },
  { label: "Vault Disciple", fighterId: "vault-disciple" },
  { label: "Ironheart Cadet", fighterId: "ironheart-cadet" },
  { label: "Scrap Hound", fighterId: "scrap-hound" },
];

function matchBannerText(mode: OpponentControllerKind): string {
  if (mode === "dummy") return "Training — Player 1 vs AI";
  if (mode === "local_human") return "Player 1 vs Player 2 — same rules, shared screen";
  return "Player 1 vs Player 2 — online (stub)";
}

export function ArenaScreen() {
  const { state, actions } = useArenaEngine();
  const [player, opponent] = state.fighters;
  const controlsLocked = player.hp <= 0 || state.winner != null;
  const playerCareer = state.fighterProgress[player.fighterId];
  const playerIdentity = buildUnifiedPlayerIdentity(state);
  const spendUnlocked = canSpendArenaPrep(state);
  const tempoAnimSpeed = tempoCombatAnimationSpeedMultiplier(state.combatTempo);
  const combatFx = useCombatFeedback(
    state.log,
    state.fighters,
    tempoAnimSpeed,
  );

  return (
    <div
      className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8"
      style={
        {
          "--combat-tempo-anim-speed": tempoAnimSpeed,
        } as CSSProperties
      }
    >
      <MatchHud
        title="Blood Arena"
        winner={state.winner}
        resources={state.resources}
        lastMatchResult={state.lastMatchResult}
        pendingHpPenalty={state.pendingHpPenalty}
        nextMatchHpBonus={state.nextMatchHpBonus}
        nextMatchAttackBonus={state.nextMatchAttackBonus}
        spendUnlocked={spendUnlocked}
        activeFighterName={state.playerFighter.name}
        activeFighterCareer={playerCareer}
        combatTempo={state.combatTempo}
        opponentController={state.opponentController}
        playerReputation={playerIdentity.reputation}
        onResetMatch={actions.resetMatch}
        onReinforceBody={actions.reinforceBody}
        onBribeHandler={actions.bribeHandler}
        onBloodRitual={actions.bloodRitual}
        resourceFocus={state.resourceFocus}
        onResourceFocusChange={actions.setResourceFocus}
      />

      <section
        className="rounded-lg border border-rose-200/80 bg-rose-50/60 px-4 py-3 text-center dark:border-rose-900/50 dark:bg-rose-950/30"
        aria-label="Match format"
      >
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {matchBannerText(state.opponentController)}
        </p>
      </section>

      <ArenaStage
        fighters={state.fighters}
        pulseOpponent={combatFx.arena.pulseOpponent}
        tempoAnimSpeed={tempoAnimSpeed}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FighterPanel
          fighter={player}
          identity={playerIdentity}
          combatFeedback={combatFx.playerCard}
          onCombatStanceChange={(s) => actions.setCombatStance(0, s)}
          stanceChangeLocked={state.winner != null}
        />
        <FighterPanel
          fighter={opponent}
          combatFeedback={combatFx.opponentCard}
          reputation={reputationForArenaFighter(state, 1)}
          onCombatStanceChange={
            opponent.isDummy ? undefined : (s) => actions.setCombatStance(1, s)
          }
          stanceChangeLocked={state.winner != null}
        />
      </div>

      <SkillBar
        player={player}
        disabled={controlsLocked}
        onAttack={actions.basicAttack}
        onDash={actions.dash}
        onSkill1={actions.useSkill1}
        onSkill2={actions.useSkill2}
        onBlockDown={actions.startBlock}
        onBlockUp={actions.stopBlock}
      />

      <CombatLog entries={state.log} />

      <section className="flex flex-col gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Match setup
        </h2>
        <p className="text-xs text-zinc-500">
          Changing fighter or mode starts a fresh round. PvP is the default experience.
        </p>
        <p className="text-sm text-zinc-500">Player 1 — roster</p>
        <div className="flex flex-wrap gap-2">
          {PLAYER_FIGHTER_OPTIONS.map(({ label, fighterId }) => (
            <button
              key={label}
              type="button"
              className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600"
              onClick={() => actions.setPlayerFighter(fighterId)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Opponent mode
        </p>
        <div className="flex flex-wrap gap-2">
          {OPPONENT_MODES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`rounded border px-2 py-1 text-sm ${
                state.opponentController === id
                  ? "border-rose-600 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/40"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
              onClick={() => actions.setOpponentController(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          {OPPONENT_MODES.find((m) => m.id === state.opponentController)
            ?.description ?? ""}
        </p>
      </section>
    </div>
  );
}
