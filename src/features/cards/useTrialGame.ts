"use client";

import { useEffect, useState } from "react";
import { readArenaResourcesForCardTrial } from "@/features/arena/arenaTrialBridge";
import { createTrialFromArena } from "./trialState";
import type { TrialState } from "./types";

/** Loads persisted Arena resources once on mount and builds trial state (client-only). */
export function useTrialGame() {
  const [state, setState] = useState<TrialState | null>(null);

  useEffect(() => {
    const resources = readArenaResourcesForCardTrial();
    setState(createTrialFromArena(resources));
  }, []);

  return { ready: state != null, state };
}
