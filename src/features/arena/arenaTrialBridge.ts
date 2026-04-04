/**
 * Black Market: Rune Trials — read-only access to Arena-persisted resources.
 * Card trial code should import from here (single entry, no duplicate storage keys).
 */
import type { ArenaResources } from "./arenaTypes";
import { loadArenaResources } from "./arenaResourcesStorage";

export type { ArenaResources } from "./arenaTypes";

export function readArenaResourcesForCardTrial(): ArenaResources {
  return loadArenaResources();
}
