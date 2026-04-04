import type {
  ArenaResources,
  ArenaState,
  Faction,
  ResourceFocusId,
} from "./arenaTypes";

const FOCUS_WIN_BOOST = 1.22;
const FOCUS_WIN_TAX = 0.92;

type TrioKey = "ironheart" | "bloodChits" | "lumens";

const FOCUS_TO_TRIO: Record<ResourceFocusId, TrioKey> = {
  ironheart: "ironheart",
  bloodChits: "bloodChits",
  lumens: "lumens",
};

const TRIO_KEYS: TrioKey[] = ["ironheart", "bloodChits", "lumens"];

/** Tilts win bundle toward the chosen bridge resource; other trio buckets dip slightly. */
export function applyResourceFocusToWinDelta(
  delta: ArenaResources,
  focus: ResourceFocusId | null,
): ArenaResources {
  if (focus == null) return { ...delta };
  const primary = FOCUS_TO_TRIO[focus];
  const out = { ...delta };
  for (const k of TRIO_KEYS) {
    const v = out[k];
    if (v <= 0) continue;
    const mult = k === primary ? FOCUS_WIN_BOOST : FOCUS_WIN_TAX;
    out[k] = Math.max(0, Math.round(v * mult));
  }
  return out;
}

export const DEFAULT_ARENA_RESOURCES: ArenaResources = {
  credits: 0,
  ironheart: 0,
  bloodChits: 0,
  lumens: 0,
  scrap: 0,
  parts: 0,
};

export function mergeArenaResources(
  partial?: Partial<ArenaResources> | null,
): ArenaResources {
  return { ...DEFAULT_ARENA_RESOURCES, ...partial };
}

export function addArenaResources(
  a: ArenaResources,
  b: Partial<ArenaResources>,
): ArenaResources {
  return {
    credits: a.credits + (b.credits ?? 0),
    ironheart: a.ironheart + (b.ironheart ?? 0),
    bloodChits: a.bloodChits + (b.bloodChits ?? 0),
    lumens: a.lumens + (b.lumens ?? 0),
    scrap: a.scrap + (b.scrap ?? 0),
    parts: a.parts + (b.parts ?? 0),
  };
}

/** Exported for UI; win bundle uses the same base credit line. */
export const WIN_CREDIT_BASE = 15;

function hashArenaMoment(state: ArenaState): number {
  const id = state.fighters[0].fighterId;
  let h = state.nowMs ^ (id.length << 16);
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export type WinRewardResult = {
  delta: ArenaResources;
  /** Combat-log lines (flavor, not a full economy). */
  logLines: string[];
};

function buildWinRewardLogLines(
  faction: Faction,
  tuned: ArenaResources,
): string[] {
  const logLines: string[] = [];

  switch (faction) {
    case "Bio":
      logLines.push(
        `Blood chits claimed from the fallen (+${tuned.bloodChits} this victory).`,
      );
      logLines.push(
        `You salvaged ironheart from the arena (+${tuned.ironheart} this victory).`,
      );
      break;
    case "Mecha":
      logLines.push(
        `You salvaged ironheart from the arena (+${tuned.ironheart} this victory).`,
      );
      logLines.push(
        `Blood chits claimed from the fallen (+${tuned.bloodChits} this victory).`,
      );
      break;
    case "Pure":
      logLines.push(
        `Sanctum lumen-glass gathered from the trial (+${tuned.lumens} — crystal placeholder for Rune Trials).`,
      );
      logLines.push(
        `You salvaged ironheart from the arena (+${tuned.ironheart} this victory).`,
      );
      logLines.push(
        `Blood chits claimed from the fallen (+${tuned.bloodChits} this victory).`,
      );
      break;
    case "Black City":
      logLines.push(
        "Black Market haul: mixed salvage from the pit — credits, chits, ironheart, scrap, and parts.",
      );
      logLines.push(
        `Blood chits claimed from the fallen (+${tuned.bloodChits} this victory).`,
      );
      logLines.push(
        `You salvaged ironheart from the arena (+${tuned.ironheart} this victory).`,
      );
      break;
  }

  logLines.unshift(
    `Arena stipend: +${tuned.credits} credits (Black Market bridge, not a full economy).`,
  );

  return logLines;
}

/** Every win: credits + ironheart + bloodChits; faction tilts the mix (bridge to Black Market / Rune Trials). */
export function buildWinResourceRewards(state: ArenaState): WinRewardResult {
  const faction = state.fighters[0].fighterDefinition.faction;
  const h = hashArenaMoment(state);

  const delta: ArenaResources = {
    credits: WIN_CREDIT_BASE,
    ironheart: 2,
    bloodChits: 2,
    lumens: 0,
    scrap: 0,
    parts: 0,
  };

  switch (faction) {
    case "Bio":
      delta.bloodChits += 5;
      delta.ironheart += 1;
      break;
    case "Mecha":
      delta.ironheart += 6;
      delta.bloodChits += 1;
      break;
    case "Pure":
      delta.lumens += 5;
      delta.credits += 3;
      break;
    case "Black City": {
      const mix = h % 3;
      delta.scrap += 2;
      delta.parts += 1;
      delta.bloodChits += 2 + (mix === 0 ? 2 : 0);
      delta.ironheart += 2 + (mix === 1 ? 2 : 0);
      delta.scrap += mix === 2 ? 2 : 0;
      break;
    }
  }

  const tuned = applyResourceFocusToWinDelta(delta, state.resourceFocus);
  const logLines = buildWinRewardLogLines(faction, tuned);

  return { delta: tuned, logLines };
}

export type LossSalvageResult = {
  resources: ArenaResources;
  logLines: string[];
};

/**
 * Deterministic “small chance” from match timing + fighter id (no RNG API).
 * ~30% to gain scrap OR parts.
 */
export function rollLossSalvage(state: ArenaState): LossSalvageResult {
  const h = hashArenaMoment(state);
  const roll = h % 100;
  if (roll >= 30) {
    return { resources: state.resources, logLines: [] };
  }
  const pick = h % 2;
  const amt = 1 + (h % 2);
  const next = { ...state.resources };
  if (pick === 0) {
    next.scrap += amt;
    return {
      resources: next,
      logLines: [
        `You scavenged ${amt} scrap from the arena floor while crawling away.`,
      ],
    };
  }
  next.parts += amt;
  return {
    resources: next,
    logLines: [
      `You salvaged ${amt} parts from the wreckage before the gates closed.`,
    ],
  };
}
