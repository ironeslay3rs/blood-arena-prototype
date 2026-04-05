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
};

export type ArenaCombatFeedback = {
  /** Brief pulse on dummy sprite when they attack */
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
        setOpponentCard(emptyCard);
        setArena({ pulseOpponent: false });
      }, PHASE_TARGET_MS);

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
      }, PHASE_TRAIT_MS);

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setArena({ pulseOpponent: true });
      }, PHASE_ATTACK_MS);

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setPlayerCard((p) => ({
          ...p,
          damageNumber: damage,
          targetedGlow: true,
        }));
        setOpponentCard((o) => ({ ...o, traitLabel: trait }));
        setArena({ pulseOpponent: false });
      }, PHASE_DAMAGE_MS);

      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setPlayerCard(emptyCard);
        setOpponentCard(emptyCard);
        setArena({ pulseOpponent: false });
      }, PHASE_CLEAR_MS);
    };

    const runPlayerHit = (damage: number) => {
      const mySeq = ++seqRef.current;
      clearAllTimeouts();
      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setOpponentCard({ ...emptyCard, damageNumber: damage });
        setPlayerCard(emptyCard);
        setArena({ pulseOpponent: false });
      }, 120);
      schedule(() => {
        if (seqRef.current !== mySeq) return;
        setOpponentCard(emptyCard);
      }, 1000);
    };

    const processEntry = (entry: CombatLogEntry) => {
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
        runPlayerHit(dmg.amount);
        pendingTrait = null;
        return;
      }

      pendingTrait = null;
    };

    for (const e of newEntries) {
      processEntry(e);
    }

    return () => {
      clearAllTimeouts();
    };
  }, [log]);

  return { playerCard, opponentCard, arena };
}
