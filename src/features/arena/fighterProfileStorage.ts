import {
  CANON_CHARACTER_DEFINITIONS,
  type CanonCharacterId,
} from "@/features/shared/canonCharacters";
import type { FighterProfile } from "./arenaTypes";

const STORAGE_KEY = "blood-arena:fighter-profiles:v1";

const VALID_CANON: ReadonlySet<string> = new Set(
  Object.keys(CANON_CHARACTER_DEFINITIONS),
);

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function isProfileRow(v: unknown): v is FighterProfile {
  if (v == null || typeof v !== "object" || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || o.id === "") return false;
  if (typeof o.canonCharacterId !== "string" || !VALID_CANON.has(o.canonCharacterId)) {
    return false;
  }
  if (o.nickname != null && typeof o.nickname !== "string") return false;
  if (!isFiniteNumber(o.wins) || o.wins < 0) return false;
  if (!isFiniteNumber(o.losses) || o.losses < 0) return false;
  if (!isFiniteNumber(o.totalDamageDealt) || o.totalDamageDealt < 0) return false;
  if (!isFiniteNumber(o.totalDamageTaken) || o.totalDamageTaken < 0) return false;
  if (
    o.milestoneArenaRemembersName != null &&
    typeof o.milestoneArenaRemembersName !== "boolean"
  ) {
    return false;
  }
  if (
    o.milestoneNoLongerPrey != null &&
    typeof o.milestoneNoLongerPrey !== "boolean"
  ) {
    return false;
  }
  return true;
}

function migrateProfileRow(val: FighterProfile): FighterProfile {
  const wins = Math.floor(val.wins);
  return {
    ...val,
    wins,
    losses: Math.floor(val.losses),
    milestoneArenaRemembersName:
      val.milestoneArenaRemembersName === true || wins >= 5,
    milestoneNoLongerPrey:
      val.milestoneNoLongerPrey === true || wins >= 10,
  };
}

export function loadFighterProfiles(): Record<string, FighterProfile> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null || raw === "") return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, FighterProfile> = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (!VALID_CANON.has(key)) continue;
      if (!isProfileRow(val)) continue;
      if (val.canonCharacterId !== key) continue;
      const base: FighterProfile = {
        id: val.id,
        canonCharacterId: val.canonCharacterId as CanonCharacterId,
        ...(val.nickname !== undefined ? { nickname: val.nickname } : {}),
        wins: Math.floor(val.wins),
        losses: Math.floor(val.losses),
        totalDamageDealt: val.totalDamageDealt,
        totalDamageTaken: val.totalDamageTaken,
        milestoneArenaRemembersName:
          val.milestoneArenaRemembersName === true,
        milestoneNoLongerPrey: val.milestoneNoLongerPrey === true,
      };
      out[key] = migrateProfileRow(base);
    }
    return out;
  } catch {
    return {};
  }
}

export function saveFighterProfiles(
  profiles: Record<string, FighterProfile>,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    /* quota / private mode */
  }
}
