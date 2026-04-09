import type { FighterId, FighterState } from "./arenaTypes";

/**
 * Which actions get the **link** highlight after a clean hit (UI + copy).
 * Sim always allows the inputs; this is routing / teaching data (BP-06).
 */
export type CancelLinkRoutes = {
  dash: boolean;
  skill1: boolean;
  skill2: boolean;
};

export const DEFAULT_CANCEL_LINK_ROUTES: CancelLinkRoutes = {
  dash: true,
  skill1: true,
  skill2: true,
};

/**
 * Per-roster link affordances — partial overrides merge onto defaults.
 * Tune for character fantasy (slow plates vs skirmishers, etc.).
 */
export const CANCEL_LINK_ROUTES_BY_FIGHTER: Partial<
  Record<FighterId, Partial<CancelLinkRoutes>>
> = {
  /** Berserker: diving surge continues pressure; wide cleave is a stop. */
  "blood-surge": { skill1: false },
  /** Bruiser: chain through skills, not kit dash. */
  "bone-plating": { dash: false },
  /** Bulwark: sigil strike links; aegis is a reset, not a chain beat. */
  "vault-disciple": { skill2: false },
  /** Healer: only reposition links; abilities are tempo resets. */
  "radiant-ward": { skill1: false, skill2: false },
  /** Duelist: seal strike links; brand is a setup beat. */
  "ember-seal": { skill2: false },
  /** Cadet: kit dash + burst; formation ability is redundant in link read. */
  "ironheart-cadet": { skill2: false },
  /** Rifle: fast poke + reposition; charged commit is not a link cue. */
  "precision-burst": { skill2: false },
  /** Control: silence strike is the chain tool; disrupt is a setup. */
  "runic-decoder": { skill1: false },
  /** Bruiser: vent is defensive tempo, not a link cue. */
  "servo-harness": { skill1: false },
  /** Scavenger: skid continues pressure; flurry reads as a chain ender. */
  "scrap-hound": { skill1: false },
  /** Splicer: buff sets spike; bolt carries the link. */
  "hex-splicer": { skill1: false },
};

export function resolveCancelLinkRoutes(fighterId: FighterId): CancelLinkRoutes {
  const o = CANCEL_LINK_ROUTES_BY_FIGHTER[fighterId];
  return {
    dash: o?.dash ?? DEFAULT_CANCEL_LINK_ROUTES.dash,
    skill1: o?.skill1 ?? DEFAULT_CANCEL_LINK_ROUTES.skill1,
    skill2: o?.skill2 ?? DEFAULT_CANCEL_LINK_ROUTES.skill2,
  };
}

/** P2 hot-seat copy — lists only highlighted link actions for this roster row. */
export function formatLinkHintLine(
  fighter: FighterState,
  windowOpen: boolean,
): string | null {
  if (!windowOpen) return null;
  const r = resolveCancelLinkRoutes(fighter.fighterId);
  const [a0, a1] = fighter.fighterDefinition.abilities;
  const parts: string[] = [];
  if (r.dash) parts.push("O dash");
  if (r.skill1) parts.push(`7 ${a0.name}`);
  if (r.skill2) parts.push(`9 ${a1.name}`);
  if (parts.length === 0) return null;
  return `Link — ${parts.join(" · ")}`;
}
