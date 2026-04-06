"use client";

import type {
  CombatLogEntry,
  FighterState,
} from "@/features/arena/arenaTypes";
import { useEffect, useRef, useState } from "react";

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
  /** Brief pulse on fighter 1 (opponent) sprite when they attack */
  pulseOpponent: boolean;
};

const PHASE_TARGET_MS = 0;
const PHASE_TRAIT_MS = 200;
const PHASE_ATTACK_MS = 420;
const PHASE_DAMAGE_MS = 650;
const PHASE_CLEAR_MS = 1450;

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

function parseDamageLine(
  msg: string,
  youLabel: string,
  oppLabel: string,
): { attacker: string; target: string; amount: number } | null {
  const dm = msg.match(/ for (\d+) HP/);
  if (!dm) return null;
  const amount = parseInt(dm[1]!, 10);
  if (!Number.isFinite(amount)) return null;
  const pre = msg.split(" for ")[0] ?? "";

  const hitSep = " hit ";
  const hi = pre.indexOf(hitSep);
  if (hi !== -1) {
    return {
      attacker: pre.slice(0, hi),
      target: pre.slice(hi + hitSep.length),
      amount,
    };
  }

  const sw = " struck with ";
  const wi = pre.indexOf(sw);
  if (wi !== -1) {
    const rest = pre.slice(wi + sw.length);
    if (rest.endsWith(youLabel)) {
      return {
        attacker: pre.slice(0, wi),
        target: youLabel,
        amount,
      };
    }
    if (rest.endsWith(oppLabel)) {
      return {
        attacker: pre.slice(0, wi),
        target: oppLabel,
        amount,
      };
    }
  }

  return null;
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
  });

  const cursorRef = useRef(0);
  const didInitCursorRef = useRef(false);
  const fightersRef = useRef(fighters);
  fightersRef.current = fighters;
  const tempoAnimSpeedRef = useRef(tempoAnimSpeed);
  tempoAnimSpeedRef.current = tempoAnimSpeed;
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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
      setPlayerCard(emptyCard);
      setOpponentCard(emptyCard);
      setArena({ pulseOpponent: false });
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

    const runAiSequence = (damage: number, trait: string) => {
      const mySeq = ++seqRef.current;
      clearAllTimeouts();

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setPlayerCard({
          ...emptyCard,
          targetedGlow: true,
          showTargetedCaption: true,
        });
        setOpponentCard({ ...emptyCard });
        setArena({ pulseOpponent: false });
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
        setArena({ pulseOpponent: true });
      }, beat(PHASE_ATTACK_MS));

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setPlayerCard((p) => ({
          ...p,
          damageNumber: damage,
          targetedGlow: true,
        }));
        setOpponentCard((o) => ({ ...o, traitLabel: trait }));
        setArena({ pulseOpponent: false });
      }, beat(PHASE_DAMAGE_MS));

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setPlayerCard(emptyCard);
        setOpponentCard(emptyCard);
        setArena({ pulseOpponent: false });
      }, beat(PHASE_CLEAR_MS));
    };

    const runPlayerHit = (damage: number, firstHitEvolution?: boolean) => {
      const mySeq = ++seqRef.current;
      clearAllTimeouts();
      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setOpponentCard({
          ...emptyCard,
          damageNumber: damage,
          evolutionFirstHitFlash: firstHitEvolution ?? false,
        });
        setPlayerCard(emptyCard);
        setArena({ pulseOpponent: false });
      }, beat(120));
      if (firstHitEvolution) {
        schedule(() => {
          if (seqRef.current !== mySeq) return;
          setOpponentCard((o) => ({ ...o, evolutionFirstHitFlash: false }));
        }, beat(480));
      }
      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setOpponentCard(emptyCard);
      }, beat(1000));
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

      if (dmg.attacker === oppLabel && dmg.target === youLabel) {
        runAiSequence(dmg.amount, pendingTrait ?? "AGGRESSION");
        pendingTrait = null;
        return;
      }

      if (dmg.attacker === youLabel && dmg.target === oppLabel) {
        const nextE = newEntries[i + 1];
        const firstHitEvolution =
          nextE?.evolutionCue === "first_hit_impact" ? true : false;
        runPlayerHit(dmg.amount, firstHitEvolution);
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
  }, [log]);

  return { playerCard, opponentCard, arena };
}
