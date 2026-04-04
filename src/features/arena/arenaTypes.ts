import type { CanonCharacterId } from "@/features/shared/canonCharacters";

export type ClassId = "werewolf" | "paladin" | "silver-knight";

/** Black Market: Rune Trials — fighter factions. */
export type Faction = "Bio" | "Pure" | "Mecha" | "Black City";

/** Arena resource flavor tied to fighter kits (combat tuning comes later). */
export type FighterResourceType =
  | "rage"
  | "conviction"
  | "heat"
  | "instability";

/**
 * Playable roster id for BMRT characters. Combat layer still uses {@link ClassId}
 * until abilities are wired to this catalog.
 */
/** Black Market: Rune Trials roster ids (card names → kebab-case). */
export type FighterId =
  | "feral-hound"
  | "blood-surge"
  | "bone-plating"
  | "vault-disciple"
  | "radiant-ward"
  | "ember-seal"
  | "ironheart-cadet"
  | "precision-burst"
  | "servo-harness"
  | "scrap-hound"
  | "runic-decoder"
  | "hex-splicer";

/** High-level effect category for UI and future combat wiring (no logic yet). */
export type AbilityEffectType =
  | "damage"
  | "buff"
  | "heal"
  | "dash"
  | "shield";

/** Data-only ability row (Black Market: Rune Trials). */
export interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  /** Cooldown in ms. */
  cooldown: number;
  effectType: AbilityEffectType;
}

/** Card-game roster row: lore + baseline stats + two signature abilities (data only). */
export interface FighterDefinition {
  id: FighterId;
  /** Persistent story/commerce identity; {@link FighterId} remains the variant/slug layer. */
  canonCharacterId: CanonCharacterId;
  name: string;
  faction: Faction;
  maxHealth: number;
  baseAttack: number;
  movementSpeed: number;
  resourceType: FighterResourceType;
  abilities: readonly [AbilityDefinition, AbilityDefinition];
  passive: string;
}

export type FighterRole = "player" | "opponent";

export interface CooldownsMs {
  dash: number;
  attack: number;
  skill1: number;
  skill2: number;
}

export interface FighterState {
  role: FighterRole;
  /** BMRT card identity + baseline stats (HP, attack, move come from here). */
  fighterId: FighterId;
  fighterDefinition: FighterDefinition;
  /** Combat kit template (skills, ranges, block tuning) until abilities are data-driven. */
  classId: ClassId;
  label: string;
  /** Logical X in arena units, 0 = left edge, ARENA_WIDTH = right edge */
  x: number;
  /** Points toward positive X when 1 */
  facing: 1 | -1;
  hp: number;
  hpMax: number;
  resource: number;
  resourceMax: number;
  blocking: boolean;
  cooldowns: CooldownsMs;
  isDummy: boolean;
  /** Absorbs damage before HP (shield abilities). */
  tempShield: number;
  /** Flat damage added to the next basic attack (buff abilities). */
  damageBonusNextAttack: number;
  /** Bio: until this arena `nowMs`, passive adds flat damage to outgoing hits (inactive when expired). */
  bioFuryUntilMs: number;
  /** Mecha: ms banked toward periodic micro-shield. */
  mechaIonAccumulatorMs: number;
  /** Black City: advances on each qualifying hit; drives deterministic on-hit buffs. */
  blackCityStrikeCycle: number;
  /** Black City: ability count for alternating recoil. */
  blackCityAbilityIndex: number;
  /** Pure: suppress duplicate “soul responds” log until this `nowMs`. */
  pureSoulLogSilenceUntilMs: number;
  /** Log-only: one near-death personality line per match for this fighter. */
  nearDeathFlavorLogged: boolean;
  /** Cleared each spawn; profile evolution “first hit” uses this flag. */
  openingStrikeConsumed: boolean;
}

export interface CombatLogEntry {
  id: string;
  atMs: number;
  message: string;
}

/** Outcome of the most recently finished round (cleared on reset / new match spawn). */
export type MatchResult = "win" | "loss";

/**
 * Black Market / Rune Trials bridge currencies (local only, no shop).
 * Faction wins tilt which buckets fill fastest; `lumens` is the Pure “crystal” placeholder.
 */
export interface ArenaResources {
  credits: number;
  ironheart: number;
  bloodChits: number;
  lumens: number;
  scrap: number;
  parts: number;
}

/** Per-roster-row career stats; `level` is derived from wins (floor(wins/3)+1) and stored for display. */
export interface FighterProgressEntry {
  wins: number;
  losses: number;
  level: number;
}

export type FighterProgressMap = Record<FighterId, FighterProgressEntry>;

/**
 * Persistent PvP identity for the human player, keyed by canon id in
 * {@link ArenaState.fighterProfiles}.
 */
export interface FighterProfile {
  /** Unique document id for this profile instance. */
  id: string;
  canonCharacterId: CanonCharacterId;
  nickname?: string;
  wins: number;
  losses: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  /** Career win milestone: logged once at 5 wins. */
  milestoneArenaRemembersName: boolean;
  /** Career win milestone: logged once at 10 wins. */
  milestoneNoLongerPrey: boolean;
}

/** Win-payout specialization (ironheart / blood chits / lumens only). */
export type ResourceFocusId = "ironheart" | "bloodChits" | "lumens";

/** One global rule per match; rotated by {@link ArenaState.matchOrdinal}. */
export type MatchModifierId =
  | "faster_cooldowns"
  | "reduced_hp"
  | "increased_damage"
  | "unstable_resource";

export interface ArenaState {
  fighters: [FighterState, FighterState];
  /** Roster row chosen for the human (index 0). */
  playerFighter: FighterDefinition;
  /** Roster row chosen for the opponent (index 1). */
  enemyFighter: FighterDefinition;
  log: CombatLogEntry[];
  winner: FighterRole | null;
  /** Monotonic ms used for cooldowns and log ordering */
  nowMs: number;
  /** Arena → Black Market resource bridge (persisted locally). */
  resources: ArenaResources;
  /** Set when a round ends; used for HUD until reset. */
  lastMatchResult: MatchResult | null;
  /**
   * Loss consequence: total HP stripped from the player’s true max on the next spawn.
   * Consumed when a new match is created; floored at ~35% of card maxHealth.
   */
  pendingHpPenalty: number;
  /** Persistent W/L and level per fighter id (player roster only; dummy does not write here). */
  fighterProgress: FighterProgressMap;
  /**
   * Flat max-HP added on next `createInitialArenaState` spawn, then cleared.
   * Stack by spending ironheart between rounds.
   */
  nextMatchHpBonus: number;
  /**
   * Flat base attack added on next spawn only (blood ritual), then cleared.
   */
  nextMatchAttackBonus: number;
  /** Optional win-reward tilt toward one bridge resource; persisted locally. */
  resourceFocus: ResourceFocusId | null;
  /** How many matches have started this session (0 = first); picks {@link matchModifier}. */
  matchOrdinal: number;
  /** Global fight rule for this match; both fighters are affected. */
  matchModifier: MatchModifierId;
  /** Consecutive wins this run; 0 after a loss; scales rewards and loss risk. */
  winStreak: number;
  /**
   * Player fighter profiles by canon id (one slot per saga identity).
   * Created or reused when the player picks a roster row.
   */
  fighterProfiles: Record<string, FighterProfile>;
  /** Cleared each spawn; applied to {@link FighterProfile} when the match ends. */
  matchPlayerDamageDealt: number;
  matchPlayerDamageTaken: number;
}

export interface PlayerInput {
  move: -1 | 0 | 1;
  blockHeld: boolean;
}

export type ArenaReducerAction =
  | { type: "TICK"; dtMs: number; input: PlayerInput }
  | { type: "BASIC_ATTACK" }
  | { type: "DASH" }
  | { type: "USE_ABILITY"; slot: 0 | 1 }
  | { type: "SET_PLAYER_CLASS"; classId: ClassId }
  | { type: "SET_PLAYER_FIGHTER"; fighterId: FighterId }
  | { type: "RESET_MATCH" }
  | { type: "SPEND_REINFORCE_BODY" }
  | { type: "SPEND_BRIBE_HANDLER" }
  | { type: "SPEND_BLOOD_RITUAL" }
  | { type: "BLOCK_START" }
  | { type: "BLOCK_END" }
  | { type: "MOVE_LEFT"; dtMs?: number }
  | { type: "MOVE_RIGHT"; dtMs?: number }
  | { type: "SET_RESOURCE_FOCUS"; focus: ResourceFocusId | null };
