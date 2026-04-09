"use client";

import { arenaReducer } from "@/features/arena/arenaActions";
import type { ArenaState, FighterId } from "@/features/arena/arenaTypes";
import { ensurePlayerFighterProfile } from "@/features/arena/fighterProfileEnsure";
import { createInitialArenaState } from "@/features/arena/initialArenaState";
import {
  arenaReducerNetplayFrame,
  NETPLAY_NEUTRAL_INPUT_FRAME,
  peerAdvanceFromArena,
} from "@/features/arena/arenaNetplayLockstep";
import {
  opponentKeyIsAttack,
  opponentKeyIsBlock,
  opponentKeyIsClimax,
  opponentKeyIsDash,
  opponentKeyIsMoveLeft,
  opponentKeyIsMoveRight,
  opponentKeyIsSkill1,
  opponentKeyIsSkill2,
  type OpponentKeysHeld,
} from "@/features/arena/opponentInputMapping";
import {
  createMemoryNetplayPair,
  NETPLAY_RECOMMENDED_TICK_MS,
  INPUT_BUTTON,
} from "@/features/arena/onlineNetplayStub";
import type { InputConfirmMessage } from "@/features/arena/onlineNetplayStub";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type KeysHeld = { left: boolean; right: boolean; block: boolean };

/**
 * Fixed-tick hot-seat sim + memory `NetplayTransport` traffic (BP-24).
 * Discrete actions use `INPUT_BUTTON` edges only — no parallel `BASIC_ATTACK` dispatches.
 */
export function useArenaLockstepHotSeatDev() {
  const [state, setState] = useState<ArenaState>(() =>
    ensurePlayerFighterProfile(
      createInitialArenaState(undefined, undefined, {
        opponentController: "local_human",
      }),
    ),
  );

  const keysRef = useRef<KeysHeld>({
    left: false,
    right: false,
    block: false,
  });
  const opponentKeysRef = useRef<OpponentKeysHeld>({
    left: false,
    right: false,
    block: false,
  });
  const p0ButtonsRef = useRef(0);
  const p1ButtonsRef = useRef(0);
  const prevP0Ref = useRef(NETPLAY_NEUTRAL_INPUT_FRAME);
  const prevP1Ref = useRef(NETPLAY_NEUTRAL_INPUT_FRAME);
  const simFrameRef = useRef(0);

  const pairRef = useRef<ReturnType<typeof createMemoryNetplayPair> | null>(null);
  const getPair = () => {
    if (pairRef.current === null) {
      pairRef.current = createMemoryNetplayPair();
    }
    return pairRef.current;
  };

  const [wireRxCount, setWireRxCount] = useState(0);
  const [lastPeerChecksum, setLastPeerChecksum] = useState<string | null>(null);
  const [simFrameUi, setSimFrameUi] = useState(0);

  useEffect(() => {
    const [, client] = getPair();
    return client.subscribe((msg) => {
      setWireRxCount((n) => n + 1);
      if (msg.kind === "peer_advance" && msg.stateChecksum) {
        setLastPeerChecksum(msg.stateChecksum);
      }
    });
  }, []);

  useLayoutEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const rawTarget = e.target;
      if (
        rawTarget instanceof HTMLElement &&
        rawTarget.closest(
          'input, textarea, select, [contenteditable="true"]',
        )
      ) {
        return;
      }
      const t = e.code;

      if (
        t === "KeyR" ||
        t === "Escape" ||
        t === "Enter" ||
        t === "NumpadEnter"
      ) {
        e.preventDefault();
        simFrameRef.current = 0;
        setSimFrameUi(0);
        setWireRxCount(0);
        setLastPeerChecksum(null);
        prevP0Ref.current = NETPLAY_NEUTRAL_INPUT_FRAME;
        prevP1Ref.current = NETPLAY_NEUTRAL_INPUT_FRAME;
        p0ButtonsRef.current = 0;
        p1ButtonsRef.current = 0;
        setState((prev) => arenaReducer(prev, { type: "RESET_MATCH" }));
        return;
      }

      if (t === "ArrowLeft" || t === "KeyA") keysRef.current.left = true;
      if (t === "ArrowRight" || t === "KeyD") keysRef.current.right = true;
      if (t === "KeyG") keysRef.current.block = true;

      if (t === "ShiftLeft" || t === "ShiftRight") {
        e.preventDefault();
        p0ButtonsRef.current |= INPUT_BUTTON.dash;
      }
      if (t === "KeyF") {
        e.preventDefault();
        p0ButtonsRef.current |= INPUT_BUTTON.attack;
      }
      if (t === "KeyC") {
        e.preventDefault();
        p0ButtonsRef.current |= INPUT_BUTTON.climax;
      }
      if (t === "Digit1") {
        e.preventDefault();
        p0ButtonsRef.current |= INPUT_BUTTON.skill1;
      }
      if (t === "Digit2") {
        e.preventDefault();
        p0ButtonsRef.current |= INPUT_BUTTON.skill2;
      }

      if (opponentKeyIsMoveLeft(t)) opponentKeysRef.current.left = true;
      if (opponentKeyIsMoveRight(t)) opponentKeysRef.current.right = true;
      if (opponentKeyIsBlock(t)) opponentKeysRef.current.block = true;
      if (opponentKeyIsDash(t)) {
        e.preventDefault();
        p1ButtonsRef.current |= INPUT_BUTTON.dash;
      }
      if (opponentKeyIsAttack(t)) {
        e.preventDefault();
        p1ButtonsRef.current |= INPUT_BUTTON.attack;
      }
      if (opponentKeyIsSkill1(t)) {
        e.preventDefault();
        p1ButtonsRef.current |= INPUT_BUTTON.skill1;
      }
      if (opponentKeyIsSkill2(t)) {
        e.preventDefault();
        p1ButtonsRef.current |= INPUT_BUTTON.skill2;
      }
      if (opponentKeyIsClimax(t)) {
        e.preventDefault();
        p1ButtonsRef.current |= INPUT_BUTTON.climax;
      }
    };

    const up = (e: KeyboardEvent) => {
      const t = e.code;
      if (t === "ArrowLeft" || t === "KeyA") keysRef.current.left = false;
      if (t === "ArrowRight" || t === "KeyD") keysRef.current.right = false;
      if (t === "KeyG") keysRef.current.block = false;

      if (t === "ShiftLeft" || t === "ShiftRight") {
        p0ButtonsRef.current &= ~INPUT_BUTTON.dash;
      }
      if (t === "KeyF") p0ButtonsRef.current &= ~INPUT_BUTTON.attack;
      if (t === "KeyC") p0ButtonsRef.current &= ~INPUT_BUTTON.climax;
      if (t === "Digit1") p0ButtonsRef.current &= ~INPUT_BUTTON.skill1;
      if (t === "Digit2") p0ButtonsRef.current &= ~INPUT_BUTTON.skill2;

      if (opponentKeyIsMoveLeft(t)) opponentKeysRef.current.left = false;
      if (opponentKeyIsMoveRight(t)) opponentKeysRef.current.right = false;
      if (opponentKeyIsBlock(t)) opponentKeysRef.current.block = false;
      if (opponentKeyIsDash(t)) p1ButtonsRef.current &= ~INPUT_BUTTON.dash;
      if (opponentKeyIsAttack(t)) p1ButtonsRef.current &= ~INPUT_BUTTON.attack;
      if (opponentKeyIsSkill1(t)) p1ButtonsRef.current &= ~INPUT_BUTTON.skill1;
      if (opponentKeyIsSkill2(t)) p1ButtonsRef.current &= ~INPUT_BUTTON.skill2;
      if (opponentKeyIsClimax(t)) p1ButtonsRef.current &= ~INPUT_BUTTON.climax;
    };

    const blur = () => {
      keysRef.current = { left: false, right: false, block: false };
      opponentKeysRef.current = { left: false, right: false, block: false };
      p0ButtonsRef.current = 0;
      p1ButtonsRef.current = 0;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => {
    const [host] = getPair();
    const tickMs = NETPLAY_RECOMMENDED_TICK_MS;
    const id = window.setInterval(() => {
      const k = keysRef.current;
      const ok = opponentKeysRef.current;
      let move: -1 | 0 | 1 = 0;
      if (k.left && !k.right) move = -1;
      else if (k.right && !k.left) move = 1;
      let omove: -1 | 0 | 1 = 0;
      if (ok.left && !ok.right) omove = -1;
      else if (ok.right && !ok.left) omove = 1;

      const p0 = {
        move,
        blockHeld: k.block,
        buttons: p0ButtonsRef.current,
      };
      const p1 = {
        move: omove,
        blockHeld: ok.block,
        buttons: p1ButtonsRef.current,
      };

      let simFrameAfter: number | null = null;
      setState((prev) => {
        if (prev.winner != null) {
          return arenaReducer(prev, {
            type: "TICK",
            dtMs: tickMs,
            input: { move: 0, blockHeld: false },
            opponentInput: { move: 0, blockHeld: false },
          });
        }

        const next = arenaReducerNetplayFrame(
          prev,
          tickMs,
          p0,
          p1,
          prevP0Ref.current,
          prevP1Ref.current,
        );
        prevP0Ref.current = p0;
        prevP1Ref.current = p1;
        simFrameRef.current += 1;
        const fr = simFrameRef.current;
        simFrameAfter = fr;

        const cfm: InputConfirmMessage = {
          kind: "input_confirm",
          frame: fr,
          slice: { startFrame: fr, p0: [p0], p1: [p1] },
        };
        host.send(cfm);
        host.send(peerAdvanceFromArena(next, fr));
        return next;
      });
      if (simFrameAfter != null) {
        setSimFrameUi(simFrameAfter);
      }
    }, tickMs);
    return () => window.clearInterval(id);
  }, []);

  const actions = useMemo(
    () => ({
      setPlayerFighter: (fighterId: FighterId) => {
        setState((prev) =>
          arenaReducer(prev, { type: "SET_PLAYER_FIGHTER", fighterId }),
        );
      },
    }),
    [],
  );

  return {
    state,
    simFrame: simFrameUi,
    wireRxCount,
    lastPeerChecksum,
    actions,
  };
}
