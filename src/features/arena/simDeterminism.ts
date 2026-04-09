/**
 * Rollback / GGPO-style netplay requires **identical** simulation given the same
 * inputs. Today the arena has known non-deterministic sources — fix these before
 * wiring `onlineNetplayStub` to real I/O.
 *
 * @see {@link ./onlineNetplayStub.ts}
 */
export const SIM_NON_DETERMINISTIC_SOURCES = [
  "Floating-point across browsers is assumed stable for identical JS builds; re-verify before cross-engine lockstep.",
] as const;

/** Deterministic helpers: monotonic `ArenaState.logSeq` log ids; `arenaDeterministic01` for dummy AI. */
export const SIM_DETERMINISM_HELPERS = [
  "arenaActions.withLog → `${nowMs}-${logSeq}`",
  "arenaDummyAi → arenaResources.arenaDeterministic01(state, salt)",
  "fighterProfileEnsure → fighterProfileDocumentId(canon) = `fp-bmrt-${canon}`",
  "arenaNetplayLockstep → fixed button-edge order + `compactArenaChecksum` + `replayInputConfirmMessages`",
  "arenaReducer → `NETPLAY_LOCKSTEP_FRAME` uses same step as `arenaReducerNetplayFrame`",
  "netplayRelayClientMessages.parseRelayDownlink → relay hello/tick + codec confirms",
] as const;
