"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { COMBAT_JUICE } from "@/features/arena/combatJuiceConfig";
import { roundResolveReadability } from "@/features/arena/arenaRoundRecap";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  FighterId,
  FighterRole,
  OpponentControllerKind,
} from "@/features/arena/arenaTypes";
import { tempoCombatAnimationSpeedMultiplier } from "@/features/arena/arenaActions";
import {
  formatLinkHintLine,
  resolveCancelLinkRoutes,
} from "@/features/arena/cancelRouteConfig";
import { canSpendArenaPrep } from "@/features/arena/arenaSpend";
import { buildUnifiedPlayerIdentity } from "@/features/arena/fighterIdentity";
import { reputationForArenaFighter } from "@/features/arena/fighterReputation";
import { matchModifierShortLabel } from "@/features/arena/matchModifiers";
import { formatCombatTempoForChip } from "@/features/arena/arenaUtils";
import {
  opponentModeChipClassName,
  opponentModeChipLabel,
} from "@/features/arena/opponentModeUi";
import { useArenaEngine } from "@/features/arena/useArenaEngine";
import { ArenaStage } from "./ArenaStage";
import { createCombatAudioController, vibrateCombat } from "./combatAudio";
import { CombatLog } from "./CombatLog";
import { FighterPanel } from "./FighterPanel";
import { MatchHud } from "./MatchHud";
import { ArenaKeyboardReference } from "./ArenaKeyboardReference";
import { AnnouncerStingerToast } from "./AnnouncerStingerToast";
import { ComboChainToast } from "./ComboChainToast";
import { FutureUpgradesPanel } from "./FutureUpgradesPanel";
import { RoundStartOverlay } from "./RoundStartOverlay";
import { SkillBar } from "./SkillBar";
import { useCombatFeedback } from "./useCombatFeedback";
import { useCombatSounds } from "./useCombatSounds";
import { useRoundStartAnnouncement } from "./useRoundStartAnnouncement";
import { useSfxPreference } from "./useSfxPreference";
import { useAnnouncerStingers } from "./useAnnouncerStingers";
import { useKoBeatPresentation } from "./useKoBeatPresentation";
import { useComboChainDisplay } from "./useComboChainDisplay";

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
  {
    id: "remote",
    label: "Online (relay)",
    description:
      "Lockstep: npm run relay + NEXT_PUBLIC_NETPLAY_RELAY_URL. P2 tab: ?netplaySlot=1",
  },
];

/** One entry per roster id — avoids duplicate buttons confusing pickers. */
const PLAYER_FIGHTER_OPTIONS: { label: string; fighterId: FighterId }[] = [
  { label: "Feral Hound", fighterId: "feral-hound" },
  { label: "Vault Disciple", fighterId: "vault-disciple" },
  { label: "Ironheart Cadet", fighterId: "ironheart-cadet" },
  { label: "Scrap Hound", fighterId: "scrap-hound" },
];

function matchBannerText(
  mode: OpponentControllerKind,
  winner: FighterRole | null,
): string {
  if (winner === "player") return "Round over — Player 1 wins";
  if (winner === "opponent") return "Round over — Player 2 wins";
  if (mode === "dummy") return "Training — Player 1 vs AI";
  if (mode === "local_human") return "Player 1 vs Player 2 — same rules, shared screen";
  return "Player 1 vs Player 2 — online (relay lockstep)";
}

export function ArenaScreen() {
  const { state, actions, remoteRelay, remoteRelayConfigured } =
    useArenaEngine();
  const [player, opponent] = state.fighters;
  const controlsLocked = player.hp <= 0 || state.winner != null;
  const inputLockReason: "round_over" | "knockout" | null = state.winner != null
    ? "round_over"
    : player.hp <= 0
      ? "knockout"
      : null;
  const playerCareer = state.fighterProgress[player.fighterId];
  const playerIdentity = buildUnifiedPlayerIdentity(state);
  const spendUnlocked = canSpendArenaPrep(state);
  const tempoAnimSpeed = tempoCombatAnimationSpeedMultiplier(state.combatTempo);
  const combatFx = useCombatFeedback(
    state.log,
    state.fighters,
    tempoAnimSpeed,
  );

  const combatAudio = useMemo(() => createCombatAudioController(), []);
  useEffect(() => () => combatAudio.dispose(), [combatAudio]);

  const { combatFeedbackEnabled, toggleCombatFeedback } = useSfxPreference();

  const audioUnlockedRef = useRef(false);
  const unlockAudioOnGesture = useCallback(() => {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    void combatAudio.unlock();
  }, [combatAudio]);

  const { roundBannerVisible, roundNumber } = useRoundStartAnnouncement(
    state.matchOrdinal,
    state.winner,
    state.opponentController,
  );

  const roundRecap = useMemo(() => {
    if (state.winner == null) return null;
    return roundResolveReadability(state.winner, state.fighters, state.log);
  }, [state.winner, state.fighters, state.log]);

  useCombatSounds(
    state.log,
    state.fighters,
    combatFeedbackEnabled,
    combatAudio,
  );

  useEffect(() => {
    if (!roundBannerVisible || !combatFeedbackEnabled) return;
    void combatAudio.unlock();
    combatAudio.play("round_start");
    vibrateCombat([15, 35, 15]);
  }, [roundBannerVisible, combatFeedbackEnabled, combatAudio]);

  const koBeatActive = useKoBeatPresentation(state.winner);

  const comboChain = useComboChainDisplay(
    state.log,
    state.fighters,
    state.winner,
    state.nowMs,
  );
  const p1LinkWindowOpen =
    state.winner == null && player.cancelWindowUntilMs > state.nowMs;
  const p2LinkWindowOpen =
    state.winner == null && opponent.cancelWindowUntilMs > state.nowMs;

  const announcer = useAnnouncerStingers(
    state.fighters,
    state.winner,
    state.winStreak,
    state.matchOrdinal,
  );

  useEffect(() => {
    const line = announcer.active;
    if (!line || !combatFeedbackEnabled) return;
    void combatAudio.unlock();
    combatAudio.play(
      line.kind === "streak" ? "stinger_streak" : "stinger_clutch",
    );
  }, [announcer.active, combatFeedbackEnabled, combatAudio]);

  /** KO beat + optional zoom on `#arena-combat`; shake runs on inner layer. */
  const arenaStripStyle = useMemo((): CSSProperties | undefined => {
    const koDur = COMBAT_JUICE.koBeatMs;
    const koAnim = koBeatActive && koDur > 0;
    const zoom = COMBAT_JUICE.arenaZoomOnKo;
    const zoomOn = zoom > 1 && zoom <= 1.12;

    const style: CSSProperties = {};
    if (koAnim) {
      style.animationDuration = `${koDur}ms`;
    }
    if (zoomOn) {
      style.transform = koBeatActive ? `scale(${zoom})` : "scale(1)";
      style.transition = `transform ${koDur}ms cubic-bezier(0.22, 1, 0.36, 1)`;
    }

    return Object.keys(style).length > 0 ? style : undefined;
  }, [koBeatActive]);

  const arenaShakeLayerStyle = useMemo((): CSSProperties | undefined => {
    const shakeMs = combatFx.arena.screenShakeDurationMs;
    if (!(shakeMs > 0 && COMBAT_JUICE.screenShakeOnHeavy > 0)) return undefined;
    return {
      "--shake-ms": `${shakeMs}ms`,
      "--shake-intensity": String(COMBAT_JUICE.screenShakeOnHeavy),
      "--chroma-deg": String(COMBAT_JUICE.screenShakeChromaDeg),
    } as CSSProperties;
  }, [combatFx.arena.screenShakeDurationMs]);

  return (
    <main
      className="relative mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8"
      style={
        {
          "--combat-tempo-anim-speed": tempoAnimSpeed,
        } as CSSProperties
      }
      onPointerDownCapture={unlockAudioOnGesture}
    >
      <a
        href="#arena-combat"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:border focus:border-rose-500 focus:bg-zinc-950 focus:px-3 focus:py-2 focus:text-sm focus:text-rose-100"
      >
        Skip to fight
      </a>
      {state.opponentController === "remote" ? (
        <p
          className="rounded-lg border border-amber-600/40 bg-amber-950/25 px-3 py-2 text-xs text-amber-100"
          role="status"
        >
          <span className="font-semibold">Netplay relay</span> —{" "}
          <span className="tabular-nums">{remoteRelay.status}</span>
          {remoteRelay.status === "open" ? (
            <>
              {" "}
              · slot {remoteRelay.slot}
              {remoteRelay.slot === 0
                ? " (P1 keys) — open a second window with ?netplaySlot=1 for P2"
                : " (P2 keys)"}
            </>
          ) : null}
          {remoteRelay.error ? (
            <>
              {" "}
              — {remoteRelay.error}
            </>
          ) : null}
        </p>
      ) : null}
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
        combatFeedbackEnabled={combatFeedbackEnabled}
        onToggleCombatFeedback={toggleCombatFeedback}
      />

      <section
        className={`rounded-lg border px-4 py-3 text-center ${
          state.winner === "player"
            ? "border-emerald-500/60 bg-emerald-50/90 dark:border-emerald-700/50 dark:bg-emerald-950/40"
            : state.winner === "opponent"
              ? "border-amber-500/60 bg-amber-50/90 dark:border-amber-800/50 dark:bg-amber-950/35"
              : "border-rose-200/80 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/30"
        }`}
        aria-label="Match format"
        aria-live="polite"
      >
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {matchBannerText(state.opponentController, state.winner)}
        </p>
        {roundRecap != null ? (
          <p
            className="mt-2 text-xs leading-snug text-zinc-700 dark:text-zinc-300"
            role="status"
            aria-live="polite"
            aria-label={roundRecap.srAnnouncement}
          >
            {roundRecap.causeLine}
          </p>
        ) : null}
        <div
          className="mt-2 flex flex-wrap items-center justify-center gap-2"
          aria-label="Mode and round rule"
        >
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${opponentModeChipClassName(state.opponentController)}`}
          >
            {opponentModeChipLabel(state.opponentController)}
          </span>
          {state.winner == null ? (
            <>
              <span className="rounded-full border border-zinc-600/80 bg-zinc-950/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 dark:bg-zinc-950/80">
                Rule: {matchModifierShortLabel(state.matchModifier)}
              </span>
              <span
                className="rounded-full border border-violet-600/50 bg-violet-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200"
                title="Run-wide rhythm — same as Combat tempo in the header"
              >
                {formatCombatTempoForChip(state.combatTempo)}
              </span>
            </>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-zinc-600 dark:text-zinc-400">
          <span className="font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
            Win streak (P1): {state.winStreak}
          </span>
          {state.winStreak > 0 ? (
            <span> — resets on a loss; win payouts scale with streak.</span>
          ) : (
            <span> — win rounds to raise payouts until you drop one.</span>
          )}
        </p>
        {state.winner != null && state.lastMatchResult != null ? (
          <p className="mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
            Last round (P1):{" "}
            {state.lastMatchResult === "win" ? (
              <span className="text-emerald-700 dark:text-emerald-400">Win</span>
            ) : (
              <span className="text-amber-800 dark:text-amber-300">Loss</span>
            )}
            {state.lastMatchResult === "loss" && state.pendingHpPenalty > 0 ? (
              <span className="font-normal text-zinc-600 dark:text-zinc-400">
                {" "}
                — next spawn −{state.pendingHpPenalty} max HP until you take a
                win
              </span>
            ) : null}
          </p>
        ) : null}
        {state.winner != null ? (
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
            Reset for another round (R / Esc / Enter), or change roster below.
          </p>
        ) : null}
      </section>

      <section
        id="arena-combat"
        className={`scroll-mt-8 flex flex-col gap-4 ${koBeatActive ? "ko-beat-pulse" : ""} ${combatFx.arena.hitstopHold ? "hitstop-hold" : ""}`}
        style={arenaStripStyle}
        aria-label="Fight — arena and Player 1 actions"
      >
        <div
          className={`relative ${combatFx.arena.screenShakeDurationMs > 0 && COMBAT_JUICE.screenShakeOnHeavy > 0 ? "arena-screen-shake" : ""}`}
          style={arenaShakeLayerStyle}
        >
          <RoundStartOverlay
            visible={roundBannerVisible}
            roundNumber={roundNumber}
            matchModifier={state.matchModifier}
            opponentMode={state.opponentController}
            combatTempo={state.combatTempo}
          />
          <AnnouncerStingerToast stinger={announcer.active} />
          <ComboChainToast
            p1Hits={comboChain.p1Hits}
            p2Hits={comboChain.p2Hits}
          />
          <ArenaStage
            fighters={state.fighters}
            pulseOpponent={combatFx.arena.pulseOpponent}
            pulsePlayer={combatFx.arena.pulsePlayer}
            tempoAnimSpeed={tempoAnimSpeed}
            matchModifier={state.matchModifier}
            opponentMode={state.opponentController}
          />
        </div>

        <SkillBar
          player={player}
          disabled={controlsLocked}
          opponentMode={state.opponentController}
          inputLockReason={inputLockReason}
          onAttack={actions.basicAttack}
          onDash={actions.dash}
          onSkill1={actions.useSkill1}
          onSkill2={actions.useSkill2}
          onBlockDown={actions.startBlock}
          onBlockUp={actions.stopBlock}
          climaxMeter={player.climaxMeter}
          onClimax={actions.useClimax}
          linkWindowOpen={p1LinkWindowOpen}
          cancelLinkRoutes={resolveCancelLinkRoutes(player.fighterId)}
        />
      </section>

      <div
        className="grid gap-4 sm:grid-cols-2"
        aria-label="Fighter status"
      >
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
          hotSeatClimax={
            state.opponentController === "local_human" && !opponent.isDummy
              ? {
                  disabled: controlsLocked,
                  onClimax: actions.opponentUseClimax,
                  linkHint:
                    formatLinkHintLine(opponent, p2LinkWindowOpen) ?? undefined,
                }
              : undefined
          }
        />
      </div>

      <CombatLog entries={state.log} />

      <ArenaKeyboardReference />

      <FutureUpgradesPanel />

      <section className="flex flex-col gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Match setup
        </h2>
        <p className="text-xs text-zinc-500">
          Changing fighter or mode starts a fresh round. PvP is the default experience.
        </p>
        <p className="text-sm text-zinc-500">Player 1 — roster</p>
        <div className="flex flex-wrap gap-2">
          {PLAYER_FIGHTER_OPTIONS.map(({ label, fighterId }) => {
            const active = state.playerFighter.id === fighterId;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={active}
                className={`rounded border px-2 py-1 text-sm transition ${
                  active
                    ? "border-rose-600 bg-rose-50 font-medium text-rose-950 dark:border-rose-500 dark:bg-rose-950/50 dark:text-rose-100"
                    : "border-zinc-300 dark:border-zinc-600"
                }`}
                onClick={() => actions.setPlayerFighter(fighterId)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Opponent mode
        </p>
        <div className="flex flex-wrap gap-2">
          {OPPONENT_MODES.map(({ id, label }) => {
            const stub = id === "remote" && !remoteRelayConfigured;
            return (
              <button
                key={id}
                type="button"
                disabled={stub}
                aria-pressed={!stub && state.opponentController === id}
                title={
                  stub
                    ? "Set NEXT_PUBLIC_NETPLAY_RELAY_URL=ws://127.0.0.1:8765 and run npm run relay"
                    : undefined
                }
                className={`rounded border px-2 py-1 text-sm ${
                  stub
                    ? "cursor-not-allowed border-zinc-200 text-zinc-400 opacity-60 dark:border-zinc-700 dark:text-zinc-600"
                    : state.opponentController === id
                      ? "border-rose-600 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/40"
                      : "border-zinc-300 dark:border-zinc-600"
                }`}
                onClick={() => {
                  if (!stub) actions.setOpponentController(id);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-500">
          {OPPONENT_MODES.find((m) => m.id === state.opponentController)
            ?.description ?? ""}
        </p>
      </section>
      <p className="text-center text-[10px] text-zinc-500">
        <Link
          href="/dev/netplay-lockstep"
          className="underline decoration-zinc-600 underline-offset-2 hover:text-zinc-400"
        >
          Dev: fixed-tick netplay lockstep stub
        </Link>
      </p>
    </main>
  );
}
