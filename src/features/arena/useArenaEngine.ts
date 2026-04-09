"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { arenaReducer } from "./arenaActions";
import { NETPLAY_NEUTRAL_INPUT_FRAME } from "./arenaNetplayLockstep";
import { ensurePlayerFighterProfile } from "./fighterProfileEnsure";
import { loadFighterProfiles, saveFighterProfiles } from "./fighterProfileStorage";
import { createInitialArenaState } from "./initialArenaState";
import { loadArenaResources, saveArenaResources } from "./arenaResourcesStorage";
import { loadFighterProgress, saveFighterProgress } from "./fighterProgressStorage";
import { loadResourceFocus, saveResourceFocus } from "./resourceFocusStorage";
import { loadWinStreak, saveWinStreak } from "./winStreakStorage";
import { parseRelayDownlink } from "./netplayRelayClientMessages";
import {
  buildOpponentInput,
  opponentKeyIsAttack,
  opponentKeyIsBlock,
  opponentKeyIsClimax,
  opponentKeyIsDash,
  opponentKeyIsMoveLeft,
  opponentKeyIsMoveRight,
  opponentKeyIsSkill1,
  opponentKeyIsSkill2,
  type OpponentKeysHeld,
} from "./opponentInputMapping";
import { INPUT_BUTTON, NETPLAY_RECOMMENDED_TICK_MS } from "./onlineNetplayStub";
import type { InputConfirmMessage } from "./onlineNetplayStub";
import type {
  CombatStanceId,
  FighterId,
  OpponentControllerKind,
  PlayerInput,
  ResourceFocusId,
} from "./arenaTypes";

const REMOTE_RELAY_URL =
  typeof process.env.NEXT_PUBLIC_NETPLAY_RELAY_URL === "string"
    ? process.env.NEXT_PUBLIC_NETPLAY_RELAY_URL
    : "";

export const remoteRelayConfigured = REMOTE_RELAY_URL.length > 0;

export type RemoteRelayStatus =
  | "idle"
  | "connecting"
  | "open"
  | "error"
  | "misconfigured";

type AbilitySlot = 0 | 1;

type KeysHeld = { left: boolean; right: boolean; block: boolean };

const DEFAULT_MOVE_MS = 16;

function buildInput(keys: KeysHeld): PlayerInput {
  let move: -1 | 0 | 1 = 0;
  if (keys.left && !keys.right) move = -1;
  else if (keys.right && !keys.left) move = 1;
  return { move, blockHeld: keys.block };
}

/** Subscribes UI to arena combat via one reducer; all combat lives in `arenaActions`. */
export function useArenaEngine() {
  const [state, dispatch] = useReducer(
    arenaReducer,
    undefined,
    () =>
      ensurePlayerFighterProfile(
        createInitialArenaState(undefined, undefined, {
          fighterProgress: loadFighterProgress(),
          resources: loadArenaResources(),
          resourceFocus: loadResourceFocus(),
          winStreak: loadWinStreak(),
          fighterProfiles: loadFighterProfiles(),
        }),
      ),
  );

  const [remoteRelay, setRemoteRelay] = useState<{
    status: RemoteRelayStatus;
    slot: 0 | 1;
    error?: string;
  }>({ status: "idle", slot: 0 });

  const progressSnapshotRef = useRef<string | null>(null);
  const progressHydratedRef = useRef(false);

  useEffect(() => {
    const serialized = JSON.stringify(state.fighterProgress);
    if (!progressHydratedRef.current) {
      progressHydratedRef.current = true;
      progressSnapshotRef.current = serialized;
      return;
    }
    if (serialized === progressSnapshotRef.current) return;
    progressSnapshotRef.current = serialized;
    saveFighterProgress(state.fighterProgress);
  }, [state.fighterProgress]);

  const resourcesSnapshotRef = useRef<string | null>(null);
  const resourcesHydratedRef = useRef(false);

  useEffect(() => {
    const serialized = JSON.stringify(state.resources);
    if (!resourcesHydratedRef.current) {
      resourcesHydratedRef.current = true;
      resourcesSnapshotRef.current = serialized;
      return;
    }
    if (serialized === resourcesSnapshotRef.current) return;
    resourcesSnapshotRef.current = serialized;
    saveArenaResources(state.resources);
  }, [state.resources]);

  const focusSnapshotRef = useRef<string | null>(null);
  const focusHydratedRef = useRef(false);

  useEffect(() => {
    const serialized =
      state.resourceFocus === null ? "null" : state.resourceFocus;
    if (!focusHydratedRef.current) {
      focusHydratedRef.current = true;
      focusSnapshotRef.current = serialized;
      return;
    }
    if (serialized === focusSnapshotRef.current) return;
    focusSnapshotRef.current = serialized;
    saveResourceFocus(state.resourceFocus);
  }, [state.resourceFocus]);

  const streakSnapshotRef = useRef<string | null>(null);
  const streakHydratedRef = useRef(false);

  useEffect(() => {
    const serialized = String(state.winStreak);
    if (!streakHydratedRef.current) {
      streakHydratedRef.current = true;
      streakSnapshotRef.current = serialized;
      return;
    }
    if (serialized === streakSnapshotRef.current) return;
    streakSnapshotRef.current = serialized;
    saveWinStreak(state.winStreak);
  }, [state.winStreak]);

  const profilesSnapshotRef = useRef<string | null>(null);
  const profilesHydratedRef = useRef(false);

  useEffect(() => {
    const serialized = JSON.stringify(state.fighterProfiles);
    if (!profilesHydratedRef.current) {
      profilesHydratedRef.current = true;
      profilesSnapshotRef.current = serialized;
      return;
    }
    if (serialized === profilesSnapshotRef.current) return;
    profilesSnapshotRef.current = serialized;
    saveFighterProfiles(state.fighterProfiles);
  }, [state.fighterProfiles]);

  const arenaStateRef = useRef(state);
  useLayoutEffect(() => {
    arenaStateRef.current = state;
  });

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

  const netplaySlotRef = useRef<0 | 1>(0);
  const netplayPrevP0Ref = useRef(NETPLAY_NEUTRAL_INPUT_FRAME);
  const netplayPrevP1Ref = useRef(NETPLAY_NEUTRAL_INPUT_FRAME);
  const netplayP0ButtonsRef = useRef(0);
  const netplayP1ButtonsRef = useRef(0);
  const netplayLastFrameRef = useRef(0);
  const pendingConfirmsRef = useRef(new Map<number, InputConfirmMessage>());
  const wsRef = useRef<WebSocket | null>(null);

  const resetNetplayLockstepTracking = () => {
    netplayLastFrameRef.current = 0;
    pendingConfirmsRef.current = new Map();
    netplayPrevP0Ref.current = NETPLAY_NEUTRAL_INPUT_FRAME;
    netplayPrevP1Ref.current = NETPLAY_NEUTRAL_INPUT_FRAME;
    netplayP0ButtonsRef.current = 0;
    netplayP1ButtonsRef.current = 0;
  };

  useLayoutEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      netplaySlotRef.current = p.get("netplaySlot") === "1" ? 1 : 0;
    } catch {
      netplaySlotRef.current = 0;
    }
    setRemoteRelay((r) => ({ ...r, slot: netplaySlotRef.current }));
  }, []);

  useEffect(() => {
    if (state.opponentController === "remote") {
      resetNetplayLockstepTracking();
    }
  }, [state.opponentController]);

  const actions = useMemo(
    () => ({
      moveLeft: (dtMs: number = DEFAULT_MOVE_MS) =>
        dispatch({ type: "MOVE_LEFT", dtMs }),
      moveRight: (dtMs: number = DEFAULT_MOVE_MS) =>
        dispatch({ type: "MOVE_RIGHT", dtMs }),
      dash: () => dispatch({ type: "DASH" }),
      basicAttack: () => dispatch({ type: "BASIC_ATTACK" }),
      useClimax: () => dispatch({ type: "USE_CLIMAX" }),
      opponentUseClimax: () => dispatch({ type: "OPPONENT_USE_CLIMAX" }),
      startBlock: () => {
        keysRef.current.block = true;
        dispatch({ type: "BLOCK_START" });
      },
      stopBlock: () => {
        keysRef.current.block = false;
        dispatch({ type: "BLOCK_END" });
      },
      useAbility: (slot: AbilitySlot) =>
        dispatch({ type: "USE_ABILITY", slot }),
      useSkill1: () => dispatch({ type: "USE_ABILITY", slot: 0 }),
      useSkill2: () => dispatch({ type: "USE_ABILITY", slot: 1 }),
      resetMatch: () => {
        resetNetplayLockstepTracking();
        dispatch({ type: "RESET_MATCH" });
      },
      setPlayerFighter: (fighterId: FighterId) =>
        dispatch({ type: "SET_PLAYER_FIGHTER", fighterId }),
      setOpponentController: (controller: OpponentControllerKind) =>
        dispatch({ type: "SET_OPPONENT_CONTROLLER", controller }),
      opponentBasicAttack: () => dispatch({ type: "OPPONENT_BASIC_ATTACK" }),
      opponentDash: () => dispatch({ type: "OPPONENT_DASH" }),
      opponentSkill1: () => dispatch({ type: "OPPONENT_USE_ABILITY", slot: 0 }),
      opponentSkill2: () => dispatch({ type: "OPPONENT_USE_ABILITY", slot: 1 }),
      reinforceBody: () => dispatch({ type: "SPEND_REINFORCE_BODY" }),
      bribeHandler: () => dispatch({ type: "SPEND_BRIBE_HANDLER" }),
      bloodRitual: () => dispatch({ type: "SPEND_BLOOD_RITUAL" }),
      setResourceFocus: (focus: ResourceFocusId | null) =>
        dispatch({ type: "SET_RESOURCE_FOCUS", focus }),
      setCombatStance: (fighterIdx: 0 | 1, stance: CombatStanceId) =>
        dispatch({ type: "SET_COMBAT_STANCE", fighterIdx, stance }),
    }),
    [],
  );

  useEffect(() => {
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
      const s = arenaStateRef.current;
      const netplayRemote = s.opponentController === "remote";

      if (
        t === "KeyR" ||
        t === "Escape" ||
        t === "Enter" ||
        t === "NumpadEnter"
      ) {
        const p1Down = s.fighters[0].hp <= 0;
        const roundSettled = s.winner != null;
        if (roundSettled || p1Down) {
          e.preventDefault();
          if (netplayRemote) resetNetplayLockstepTracking();
          dispatch({ type: "RESET_MATCH" });
        }
        return;
      }

      if (netplayRemote) {
        const slot = netplaySlotRef.current;
        if (slot === 0) {
          if (t === "ArrowLeft" || t === "KeyA") keysRef.current.left = true;
          if (t === "ArrowRight" || t === "KeyD") keysRef.current.right = true;
          if (t === "KeyG") keysRef.current.block = true;
          if (t === "ShiftLeft" || t === "ShiftRight") {
            e.preventDefault();
            netplayP0ButtonsRef.current |= INPUT_BUTTON.dash;
          }
          if (t === "KeyF") {
            e.preventDefault();
            netplayP0ButtonsRef.current |= INPUT_BUTTON.attack;
          }
          if (t === "KeyC") {
            e.preventDefault();
            netplayP0ButtonsRef.current |= INPUT_BUTTON.climax;
          }
          if (t === "Digit1") {
            e.preventDefault();
            netplayP0ButtonsRef.current |= INPUT_BUTTON.skill1;
          }
          if (t === "Digit2") {
            e.preventDefault();
            netplayP0ButtonsRef.current |= INPUT_BUTTON.skill2;
          }
        } else {
          if (opponentKeyIsMoveLeft(t)) opponentKeysRef.current.left = true;
          if (opponentKeyIsMoveRight(t)) opponentKeysRef.current.right = true;
          if (opponentKeyIsBlock(t)) opponentKeysRef.current.block = true;
          if (opponentKeyIsDash(t)) {
            e.preventDefault();
            netplayP1ButtonsRef.current |= INPUT_BUTTON.dash;
          }
          if (opponentKeyIsAttack(t)) {
            e.preventDefault();
            netplayP1ButtonsRef.current |= INPUT_BUTTON.attack;
          }
          if (opponentKeyIsSkill1(t)) {
            e.preventDefault();
            netplayP1ButtonsRef.current |= INPUT_BUTTON.skill1;
          }
          if (opponentKeyIsSkill2(t)) {
            e.preventDefault();
            netplayP1ButtonsRef.current |= INPUT_BUTTON.skill2;
          }
          if (opponentKeyIsClimax(t)) {
            e.preventDefault();
            netplayP1ButtonsRef.current |= INPUT_BUTTON.climax;
          }
        }
        return;
      }

      if (t === "ArrowLeft" || t === "KeyA") keysRef.current.left = true;
      if (t === "ArrowRight" || t === "KeyD") keysRef.current.right = true;
      if (t === "KeyG") {
        keysRef.current.block = true;
        dispatch({ type: "BLOCK_START" });
      }
      if (t === "ShiftLeft" || t === "ShiftRight") {
        e.preventDefault();
        dispatch({ type: "DASH" });
      }
      if (t === "KeyF") {
        e.preventDefault();
        dispatch({ type: "BASIC_ATTACK" });
      }
      if (t === "KeyC") {
        e.preventDefault();
        dispatch({ type: "USE_CLIMAX" });
      }
      if (t === "Digit1") {
        e.preventDefault();
        dispatch({ type: "USE_ABILITY", slot: 0 });
      }
      if (t === "Digit2") {
        e.preventDefault();
        dispatch({ type: "USE_ABILITY", slot: 1 });
      }

      if (opponentKeyIsMoveLeft(t)) opponentKeysRef.current.left = true;
      if (opponentKeyIsMoveRight(t)) opponentKeysRef.current.right = true;
      if (opponentKeyIsBlock(t)) opponentKeysRef.current.block = true;

      if (opponentKeyIsDash(t)) {
        e.preventDefault();
        dispatch({ type: "OPPONENT_DASH" });
      }
      if (opponentKeyIsAttack(t)) {
        e.preventDefault();
        dispatch({ type: "OPPONENT_BASIC_ATTACK" });
      }
      if (opponentKeyIsSkill1(t)) {
        e.preventDefault();
        dispatch({ type: "OPPONENT_USE_ABILITY", slot: 0 });
      }
      if (opponentKeyIsSkill2(t)) {
        e.preventDefault();
        dispatch({ type: "OPPONENT_USE_ABILITY", slot: 1 });
      }
      if (opponentKeyIsClimax(t)) {
        e.preventDefault();
        dispatch({ type: "OPPONENT_USE_CLIMAX" });
      }
    };

    const up = (e: KeyboardEvent) => {
      const t = e.code;
      const netplayRemote =
        arenaStateRef.current.opponentController === "remote";
      const slot = netplaySlotRef.current;

      if (netplayRemote) {
        if (slot === 0) {
          if (t === "ArrowLeft" || t === "KeyA") keysRef.current.left = false;
          if (t === "ArrowRight" || t === "KeyD") keysRef.current.right = false;
          if (t === "KeyG") keysRef.current.block = false;
          if (t === "ShiftLeft" || t === "ShiftRight") {
            netplayP0ButtonsRef.current &= ~INPUT_BUTTON.dash;
          }
          if (t === "KeyF") netplayP0ButtonsRef.current &= ~INPUT_BUTTON.attack;
          if (t === "KeyC") netplayP0ButtonsRef.current &= ~INPUT_BUTTON.climax;
          if (t === "Digit1") netplayP0ButtonsRef.current &= ~INPUT_BUTTON.skill1;
          if (t === "Digit2") netplayP0ButtonsRef.current &= ~INPUT_BUTTON.skill2;
        } else {
          if (opponentKeyIsMoveLeft(t)) opponentKeysRef.current.left = false;
          if (opponentKeyIsMoveRight(t)) opponentKeysRef.current.right = false;
          if (opponentKeyIsBlock(t)) opponentKeysRef.current.block = false;
          if (opponentKeyIsDash(t)) netplayP1ButtonsRef.current &= ~INPUT_BUTTON.dash;
          if (opponentKeyIsAttack(t)) {
            netplayP1ButtonsRef.current &= ~INPUT_BUTTON.attack;
          }
          if (opponentKeyIsSkill1(t)) {
            netplayP1ButtonsRef.current &= ~INPUT_BUTTON.skill1;
          }
          if (opponentKeyIsSkill2(t)) {
            netplayP1ButtonsRef.current &= ~INPUT_BUTTON.skill2;
          }
          if (opponentKeyIsClimax(t)) {
            netplayP1ButtonsRef.current &= ~INPUT_BUTTON.climax;
          }
        }
        return;
      }

      if (t === "ArrowLeft" || t === "KeyA") keysRef.current.left = false;
      if (t === "ArrowRight" || t === "KeyD") keysRef.current.right = false;
      if (t === "KeyG") {
        keysRef.current.block = false;
        dispatch({ type: "BLOCK_END" });
      }

      if (opponentKeyIsMoveLeft(t)) opponentKeysRef.current.left = false;
      if (opponentKeyIsMoveRight(t)) opponentKeysRef.current.right = false;
      if (opponentKeyIsBlock(t)) opponentKeysRef.current.block = false;
    };

    const blur = () => {
      const wasBlock = keysRef.current.block;
      keysRef.current.left = false;
      keysRef.current.right = false;
      keysRef.current.block = false;
      if (wasBlock && arenaStateRef.current.opponentController !== "remote") {
        dispatch({ type: "BLOCK_END" });
      }
      opponentKeysRef.current.left = false;
      opponentKeysRef.current.right = false;
      opponentKeysRef.current.block = false;
      netplayP0ButtonsRef.current = 0;
      netplayP1ButtonsRef.current = 0;
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
    if (state.opponentController === "remote") {
      return;
    }
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      dispatch({
        type: "TICK",
        dtMs: dt,
        input: buildInput(keysRef.current),
        opponentInput: buildOpponentInput(opponentKeysRef.current),
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.opponentController]);

  useEffect(() => {
    if (state.opponentController !== "remote") {
      wsRef.current?.close();
      wsRef.current = null;
      setRemoteRelay({
        status: "idle",
        slot: netplaySlotRef.current,
        error: undefined,
      });
      return;
    }

    if (!remoteRelayConfigured) {
      setRemoteRelay({
        status: "misconfigured",
        slot: netplaySlotRef.current,
        error:
          "Set NEXT_PUBLIC_NETPLAY_RELAY_URL (e.g. ws://127.0.0.1:8765) and run npm run relay",
      });
      return;
    }

    const applyOrQueueConfirm = (msg: InputConfirmMessage) => {
      pendingConfirmsRef.current.set(msg.frame, msg);
      while (true) {
        const want = netplayLastFrameRef.current + 1;
        const next = pendingConfirmsRef.current.get(want);
        if (!next) break;
        pendingConfirmsRef.current.delete(want);
        const p0 = next.slice.p0[0];
        const p1 = next.slice.p1[0];
        if (!p0 || !p1) break;
        dispatch({
          type: "NETPLAY_LOCKSTEP_FRAME",
          tickMs: NETPLAY_RECOMMENDED_TICK_MS,
          p0,
          p1,
          prevP0: netplayPrevP0Ref.current,
          prevP1: netplayPrevP1Ref.current,
        });
        netplayPrevP0Ref.current = p0;
        netplayPrevP1Ref.current = p1;
        netplayLastFrameRef.current = want;
      }
    };

    setRemoteRelay({
      status: "connecting",
      slot: netplaySlotRef.current,
      error: undefined,
    });

    let cancelled = false;
    const ws = new WebSocket(REMOTE_RELAY_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled) return;
      setRemoteRelay({
        status: "open",
        slot: netplaySlotRef.current,
        error: undefined,
      });
    };

    ws.onerror = () => {
      if (cancelled) return;
      setRemoteRelay({
        status: "error",
        slot: netplaySlotRef.current,
        error: "WebSocket error",
      });
    };

    ws.onclose = () => {
      if (cancelled) return;
      setRemoteRelay((r) =>
        r.status === "open" || r.status === "connecting"
          ? {
              status: "error",
              slot: netplaySlotRef.current,
              error: "Disconnected",
            }
          : r,
      );
    };

    ws.onmessage = (ev) => {
      const raw = typeof ev.data === "string" ? ev.data : "";
      const msg = parseRelayDownlink(raw);
      if (!msg) return;
      if (msg.kind === "hello") {
        netplaySlotRef.current = msg.slot;
        setRemoteRelay((r) => ({ ...r, slot: msg.slot }));
        return;
      }
      if (msg.kind === "frame_tick") {
        const slot = netplaySlotRef.current;
        const k = keysRef.current;
        const ok = opponentKeysRef.current;
        let input: typeof NETPLAY_NEUTRAL_INPUT_FRAME;
        if (slot === 0) {
          let move: -1 | 0 | 1 = 0;
          if (k.left && !k.right) move = -1;
          else if (k.right && !k.left) move = 1;
          input = {
            move,
            blockHeld: k.block,
            buttons: netplayP0ButtonsRef.current,
          };
        } else {
          let move: -1 | 0 | 1 = 0;
          if (ok.left && !ok.right) move = -1;
          else if (ok.right && !ok.left) move = 1;
          input = {
            move,
            blockHeld: ok.block,
            buttons: netplayP1ButtonsRef.current,
          };
        }
        ws.send(
          JSON.stringify({
            kind: "slot_input",
            frame: msg.frame,
            slot,
            input,
          }),
        );
        return;
      }
      if (msg.kind === "input_confirm") {
        applyOrQueueConfirm(msg);
      }
    };

    return () => {
      cancelled = true;
      ws.close();
      wsRef.current = null;
    };
  }, [state.opponentController]);

  return {
    state,
    actions,
    remoteRelay,
    remoteRelayConfigured,
  };
}
