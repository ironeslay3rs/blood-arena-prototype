"use client";

import type {
  CombatLogEntry,
  FighterState,
} from "@/features/arena/arenaTypes";
import {
  COMBAT_JUICE,
  HITSTOP_HEAVY_DAMAGE_MIN,
  resolveHitstopMs,
} from "@/features/arena/combatJuiceConfig";
import {
  isBlockedDamageMessage,
  parseDamageLine,
} from "@/features/arena/combatLogParse";
import {
  startTransition,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

export type CardCombatFeedback = {
  targetedGlow: boolean;
  showTargetedCaption: boolean;
  traitLabel: string | null;
  damageNumber: number | null;
  /** Evolution aggression — first-hit bonus connecting (opponent card). */
  evolutionFirstHitFlash: boolean;
  /** Evolution sustain — bonus heal (player card). */
  evolutionHealPulse: boolean;
  /** Evolution control — bonus shield tear (opponent card, shield row). */
  evolutionShieldCrack: boolean;
};

export type ArenaCombatFeedback = {
  /** Brief pulse on opponent sprite during their attack wind-up (AI / P2). */
  pulseOpponent: boolean;
  /** Brief pulse on Player 1 sprite when their hit connects — mirrors arena read for both sides. */
  pulsePlayer: boolean;
  /** Impact freeze strip — pairs timeline stretch with `#arena-combat` `.hitstop-hold`. */
  hitstopHold: boolean;
  /** Tempo-scaled ms for heavy shake on `#arena-combat` — 0 = off. */
  screenShakeDurationMs: number;
};

const PHASE_TARGET_MS = 0;
const PHASE_TRAIT_MS = 200;
const PHASE_ATTACK_MS = 420;
const PHASE_DAMAGE_MS = 650;
const PHASE_CLEAR_MS = 1450;

function subscribePrefersReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const emptyCard: CardCombatFeedback = {
  targetedGlow: false,
  showTargetedCaption: false,
  traitLabel: null,
  damageNumber: null,
  evolutionFirstHitFlash: false,
  evolutionHealPulse: false,
  evolutionShieldCrack: false,
};

function traitTagForAbility(
  abilityName: string,
  opponent: FighterState,
): string {
  const abs = opponent.fighterDefinition.abilities;
  const a = abs.find((x) => x.name === abilityName);
  if (!a) return "CONTROL";
  switch (a.effectType) {
    case "damage":
      return "AGGRESSION";
    case "heal":
      return "SAFE";
    case "shield":
      return "CONTROL";
    case "buff":
      return "CONTROL";
    case "dash":
      return "CHAOS";
    default:
      return "CONTROL";
  }
}

export function useCombatFeedback(
  log: CombatLogEntry[],
  fighters: [FighterState, FighterState],
  /** Same factor as `tempoCombatAnimationSpeedMultiplier` — scales JS-timed beats to match CSS. */
  tempoAnimSpeed: number = 1,
) {
  const [playerCard, setPlayerCard] = useState<CardCombatFeedback>(emptyCard);
  const [opponentCard, setOpponentCard] = useState<CardCombatFeedback>(emptyCard);
  const [arena, setArena] = useState<ArenaCombatFeedback>({
    pulseOpponent: false,
    pulsePlayer: false,
    hitstopHold: false,
    screenShakeDurationMs: 0,
  });

  const prefersReducedMotion = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotion,
    () => false,
  );

  const cursorRef = useRef(0);
  const didInitCursorRef = useRef(false);
  const fightersRef = useRef(fighters);
  const tempoAnimSpeedRef = useRef(tempoAnimSpeed);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useLayoutEffect(() => {
    fightersRef.current = fighters;
    tempoAnimSpeedRef.current = tempoAnimSpeed;
  });
  const seqRef = useRef(0);

  const clearAllTimeouts = () => {
    for (const id of timeoutIdsRef.current) {
      clearTimeout(id);
    }
    timeoutIdsRef.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timeoutIdsRef.current.push(id);
    return id;
  };

  useEffect(() => {
    if (log.length < cursorRef.current) {
      cursorRef.current = 0;
      didInitCursorRef.current = false;
      clearAllTimeouts();
      startTransition(() => {
        setPlayerCard(emptyCard);
        setOpponentCard(emptyCard);
        setArena({
          pulseOpponent: false,
          pulsePlayer: false,
          hitstopHold: false,
          screenShakeDurationMs: 0,
        });
      });
    }

    if (!didInitCursorRef.current) {
      didInitCursorRef.current = true;
      cursorRef.current = log.length;
      return;
    }

    const [you, opp] = fightersRef.current;
    const youLabel = you.label;
    const oppLabel = opp.label;

    const newEntries = log.slice(cursorRef.current);
    cursorRef.current = log.length;

    if (newEntries.length === 0) return;

    const spd = Math.max(
      0.35,
      Math.min(1.65, tempoAnimSpeedRef.current || 1),
    );
    const beat = (ms: number) => ms / spd;

    let pendingTrait: string | null = null;

    const runAiSequence = (
      damage: number,
      trait: string,
      hitstopMs: number,
      applyScreenShake: boolean,
    ) => {
      const mySeq = ++seqRef.current;
      clearAllTimeouts();
      const hs = hitstopMs > 0 ? beat(hitstopMs) : 0;
      const shakeDur =
        applyScreenShake && COMBAT_JUICE.screenShakeOnHeavy > 0
          ? beat(COMBAT_JUICE.screenShakeHeavyMs)
          : 0;

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setPlayerCard({
          ...emptyCard,
          targetedGlow: true,
          showTargetedCaption: true,
        });
        setOpponentCard({ ...emptyCard });
        setArena({
          pulseOpponent: false,
          pulsePlayer: false,
          hitstopHold: false,
          screenShakeDurationMs: 0,
        });
      }, beat(PHASE_TARGET_MS));

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setPlayerCard((p) => ({
          ...p,
          targetedGlow: true,
          showTargetedCaption: true,
        }));
        setOpponentCard({
          ...emptyCard,
          traitLabel: trait,
        });
      }, beat(PHASE_TRAIT_MS));

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setArena({
          pulseOpponent: true,
          pulsePlayer: false,
          hitstopHold: false,
          screenShakeDurationMs: 0,
        });
      }, beat(PHASE_ATTACK_MS));

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setPlayerCard((p) => ({
          ...p,
          damageNumber: damage,
          targetedGlow: true,
        }));
        setOpponentCard((o) => ({ ...o, traitLabel: trait }));
        setArena({
          pulseOpponent: false,
          pulsePlayer: false,
          hitstopHold: hs > 0,
          screenShakeDurationMs: shakeDur,
        });
      }, beat(PHASE_DAMAGE_MS));

      if (hs > 0) {
        schedule(() => {
          if (seqRef.current !== mySeq) return;
          setArena((a) => ({ ...a, hitstopHold: false }));
        }, beat(PHASE_DAMAGE_MS) + hs);
      }

      if (shakeDur > 0) {
        schedule(() => {
          if (seqRef.current !== mySeq) return;
          setArena((a) => ({ ...a, screenShakeDurationMs: 0 }));
        }, beat(PHASE_DAMAGE_MS) + shakeDur);
      }

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setPlayerCard(emptyCard);
        setOpponentCard(emptyCard);
        setArena({
          pulseOpponent: false,
          pulsePlayer: false,
          hitstopHold: false,
          screenShakeDurationMs: 0,
        });
      }, beat(PHASE_CLEAR_MS) + hs);
    };

    const runPlayerHit = (
      damage: number,
      firstHitEvolution: boolean | undefined,
      hitstopMs: number,
      applyScreenShake: boolean,
    ) => {
      const mySeq = ++seqRef.current;
      clearAllTimeouts();
      const hs = hitstopMs > 0 ? beat(hitstopMs) : 0;
      const shakeDur =
        applyScreenShake && COMBAT_JUICE.screenShakeOnHeavy > 0
          ? beat(COMBAT_JUICE.screenShakeHeavyMs)
          : 0;
      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setArena({
          pulseOpponent: false,
          pulsePlayer: true,
          hitstopHold: false,
          screenShakeDurationMs: 0,
        });
      }, beat(32));
      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setOpponentCard({
          ...emptyCard,
          damageNumber: damage,
          evolutionFirstHitFlash: firstHitEvolution ?? false,
        });
        setPlayerCard(emptyCard);
        setArena({
          pulseOpponent: false,
          pulsePlayer: false,
          hitstopHold: hs > 0,
          screenShakeDurationMs: shakeDur,
        });
      }, beat(120));
      if (hs > 0) {
        schedule(() => {
          if (seqRef.current !== mySeq) return;
          setArena((a) => ({ ...a, hitstopHold: false }));
        }, beat(120) + hs);
      }
      if (shakeDur > 0) {
        schedule(() => {
          if (seqRef.current !== mySeq) return;
          setArena((a) => ({ ...a, screenShakeDurationMs: 0 }));
        }, beat(120) + shakeDur);
      }
      if (firstHitEvolution) {
        schedule(() => {
          if (seqRef.current !== mySeq) return;
          setOpponentCard((o) => ({ ...o, evolutionFirstHitFlash: false }));
        }, beat(480) + hs);
      }
      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setOpponentCard(emptyCard);
      }, beat(1000) + hs);
    };

    /** Does not bump seq — avoids cancelling scheduled damage feedback in the same log batch. */
    const pulseHealEvolution = () => {
      schedule(() => {
        setPlayerCard((p) => ({ ...p, evolutionHealPulse: true }));
      }, 0);
      schedule(() => {
        setPlayerCard((p) => ({ ...p, evolutionHealPulse: false }));
      }, beat(520));
    };

    const pulseShieldCrack = () => {
      schedule(() => {
        setOpponentCard((o) => ({ ...o, evolutionShieldCrack: true }));
      }, 0);
      schedule(() => {
        setOpponentCard((o) => ({ ...o, evolutionShieldCrack: false }));
      }, beat(600));
    };

    const processEntry = (entry: CombatLogEntry, i: number) => {
      if (entry.kind === "tempo" && !entry.evolutionCue) return;
      if (entry.evolutionCue === "heal_bonus_pulse") {
        pulseHealEvolution();
        return;
      }
      if (entry.evolutionCue === "shield_strip_crack") {
        pulseShieldCrack();
        return;
      }
      if (entry.evolutionCue === "first_hit_impact") return;
      if (entry.kind === "tempo") return;

      const msg = entry.message;

      if (msg.includes("— out of range")) {
        pendingTrait = null;
        return;
      }

      if (/^(.+) healed \d+ HP with/.test(msg)) {
        pendingTrait = null;
        return;
      }

      const mAtt = /^(.+) attacked\.$/.exec(msg);
      if (mAtt?.[1] === oppLabel) {
        pendingTrait = "AGGRESSION";
        return;
      }

      const mDash = /^(.+) used (.+) \(dash\)\.$/.exec(msg);
      if (mDash?.[1] === oppLabel) {
        pendingTrait = "CHAOS";
        return;
      }

      const mUse = /^(.+) used (.+)\.$/.exec(msg);
      if (mUse?.[1] === oppLabel && !msg.includes("(dash)")) {
        pendingTrait = traitTagForAbility(mUse[2]!, opp);
        return;
      }

      const dmg = parseDamageLine(msg, youLabel, oppLabel);
      if (!dmg) return;

      const prevMsg = i > 0 ? (newEntries[i - 1]?.message ?? "") : "";
      const climaxFollows = /unleashes .*Climax/i.test(prevMsg);

      const rawHitstop =
        resolveHitstopMs(dmg.amount, isBlockedDamageMessage(msg)) +
        (climaxFollows && COMBAT_JUICE.superFreezeMs > 0
          ? COMBAT_JUICE.superFreezeMs
          : 0);
      const hitstopMs = prefersReducedMotion ? 0 : rawHitstop;
      const applyScreenShake =
        !prefersReducedMotion &&
        COMBAT_JUICE.screenShakeOnHeavy > 0 &&
        (dmg.amount >= HITSTOP_HEAVY_DAMAGE_MIN || climaxFollows);

      if (dmg.attacker === oppLabel && dmg.target === youLabel) {
        runAiSequence(
          dmg.amount,
          pendingTrait ?? "AGGRESSION",
          hitstopMs,
          applyScreenShake,
        );
        pendingTrait = null;
        return;
      }

      if (dmg.attacker === youLabel && dmg.target === oppLabel) {
        const nextE = newEntries[i + 1];
        const firstHitEvolution =
          nextE?.evolutionCue === "first_hit_impact" ? true : false;
        runPlayerHit(
          dmg.amount,
          firstHitEvolution,
          hitstopMs,
          applyScreenShake,
        );
        pendingTrait = null;
        return;
      }

      pendingTrait = null;
    };

    for (let i = 0; i < newEntries.length; i++) {
      const e = newEntries[i]!;
      const prev = newEntries[i - 1];
      if (
        e.evolutionCue === "first_hit_impact" &&
        prev &&
        parseDamageLine(prev.message, youLabel, oppLabel)?.attacker ===
          youLabel
      ) {
        continue;
      }
      processEntry(e, i);
    }

    return () => {
      clearAllTimeouts();
    };
  }, [log, prefersReducedMotion]);

  return { playerCard, opponentCard, arena };
}
