"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { arenaReducer } from "./arenaActions";
import { ensurePlayerFighterProfile } from "./fighterProfileEnsure";
import { loadFighterProfiles, saveFighterProfiles } from "./fighterProfileStorage";
import { createInitialArenaState } from "./initialArenaState";
import { loadArenaResources, saveArenaResources } from "./arenaResourcesStorage";
import { loadFighterProgress, saveFighterProgress } from "./fighterProgressStorage";
import { loadResourceFocus, saveResourceFocus } from "./resourceFocusStorage";
import { loadWinStreak, saveWinStreak } from "./winStreakStorage";
import {
  buildOpponentInput,
  opponentKeyIsAttack,
  opponentKeyIsBlock,
  opponentKeyIsDash,
  opponentKeyIsMoveLeft,
  opponentKeyIsMoveRight,
  opponentKeyIsSkill1,
  opponentKeyIsSkill2,
  type OpponentKeysHeld,
} from "./opponentInputMapping";
import type {
  CombatStanceId,
  FighterId,
  OpponentControllerKind,
  PlayerInput,
  ResourceFocusId,
} from "./arenaTypes";

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

  const actions = useMemo(
    () => ({
      moveLeft: (dtMs: number = DEFAULT_MOVE_MS) =>
        dispatch({ type: "MOVE_LEFT", dtMs }),
      moveRight: (dtMs: number = DEFAULT_MOVE_MS) =>
        dispatch({ type: "MOVE_RIGHT", dtMs }),
      dash: () => dispatch({ type: "DASH" }),
      basicAttack: () => dispatch({ type: "BASIC_ATTACK" }),
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
      resetMatch: () => dispatch({ type: "RESET_MATCH" }),
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
      const t = e.code;
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
    };

    const up = (e: KeyboardEvent) => {
      const t = e.code;
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
      if (wasBlock) dispatch({ type: "BLOCK_END" });
      opponentKeysRef.current.left = false;
      opponentKeysRef.current.right = false;
      opponentKeysRef.current.block = false;
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
  }, []);

  return { state, actions };
}
