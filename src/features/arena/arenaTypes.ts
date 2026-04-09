import type { CanonCharacterId } from "@/features/shared/canonCharacters";
import type { CombatStanceId } from "./combatStance";
import type { ArenaInputFrame } from "./onlineNetplayStub";

export type { CombatStanceId } from "./combatStance";

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

/** Optional super melee tuning — overrides faction defaults in `climaxStrikeProfile`. */
export interface FighterClimaxOverride {
  damageMult: number;
  flatBonus: number;
  /** Shown after “unleashes …”; must end with `Climax` for combat-juice parsers. */
  logName: string;
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
  /** Card-specific Climax damage + log; when omitted, faction profile is used. */
  climaxOverride?: FighterClimaxOverride;
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
  /**
   * Climax / super gauge — builds on HP damage dealt and taken; spend at max for a heavy melee strike.
   */
  climaxMeter: number;
  /**
   * Until this arena clock, UI highlights dash/skills as a **link** after a clean HP hit.
   */
  cancelWindowUntilMs: number;
  /**
   * Offensive chain depth for **damage scaling** — clean hits within the combo gap advance it;
   * whiffs, blocks, or taking HP damage clear it.
   */
  comboChainDepth: number;
  /** Arena clock until which the chain is still live for depth (`comboChainConfig` gap). */
  comboChainExpireAtMs: number;
  /**
   * How this fighter lanes right now — immediate modifiers only (no gear).
   * Same three stances for everyone (PvP fair).
   */
  combatStance: CombatStanceId;
}

/** `tempo`: fight rhythm / system bonus lines — rendered apart from damage text. */
/** `reputation`: crowd / recognition flavor (offline reputation system). */
export type CombatLogEntryKind = "tempo" | "reputation";

/** UI-only cues for evolution perks (silent or minimal log message). */
export type EvolutionCueKind =
  | "first_hit_impact"
  | "heal_bonus_pulse"
  | "shield_strip_crack";

export interface CombatLogEntry {
  id: string;
  atMs: number;
  message: string;
  kind?: CombatLogEntryKind;
  evolutionCue?: EvolutionCueKind;
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
 * Combat evolution lane (aligned with `ProfileEvolutionPath` in `fighterProfileEvolution.ts`).
 * Declared here so UI can depend on arena types without importing evolution helpers.
 */
export type FighterKeyTrait = "aggression" | "sustain" | "control" | "chaos";

/**
 * Offline reputation band — titles from wins/losses/damage/streak only (no leaderboard).
 */
export interface ReputationSnapshot {
  title: string;
  descriptor: string;
  prestige: 0 | 1 | 2 | 3 | 4;
}

/**
 * Single UI read model for the active player: merges {@link FighterProfile} (canonical record +
 * milestones) with live roster row + combat label. Use {@link buildUnifiedPlayerIdentity} to build.
 */
export interface UnifiedFighterIdentity {
  /** In-arena slot label (e.g. "Player 1"). */
  arenaLabel: string;
  /** Selected roster / kit name. */
  rosterName: string;
  /** Canon identity name (saga). */
  canonName: string;
  /** Optional call-sign; when set, shown as primary with canon as secondary. */
  nickname?: string;
  /** Primary headline: `nickname ?? canonName`. */
  displayName: string;
  /** Wins / losses — sourced from {@link FighterProfile} (same as match-end persistence). */
  wins: number;
  losses: number;
  /** Derived from profile wins: `floor(wins/3)+1`. */
  level: number;
  /** 0 = before first evolution tier, 1 = 5–9 wins, 2 = 10+ wins. */
  evolutionTier: 0 | 1 | 2;
  keyTrait: FighterKeyTrait;
  /** Short label for trait (e.g. "Aggression"). */
  keyTraitDisplay: string;
  /** Human-readable evolution step (e.g. "Tier I"). */
  evolutionTierDisplay: string;
  /** Arena-facing title from milestones + tier. */
  arenaTitle: string;
  /**
   * Emotional hook — one memorable line (trait/tier/milestones). Distinct from {@link arenaTitle}.
   */
  identityLine: string;
  totalDamageDealt: number;
  totalDamageTaken: number;
  milestoneArenaRemembersName: boolean;
  milestoneNoLongerPrey: boolean;
  /** Visible reputation — fear factor / recognition. */
  reputation: ReputationSnapshot;
}

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

/**
 * Who controls fighter index 1. Does not add mechanics — routes input and AI.
 * - `dummy`: AI controls fighter 1 (training — same kit rules; optional auto spacing)
 * - `local_human`: hot-seat PvP — second human (`opponentInput` on TICK + discrete actions)
 * - `remote`: same input shape as local; network layer to be wired later
 */
export type OpponentControllerKind = "dummy" | "local_human" | "remote";

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
  /** Monotonic counter for combat-log ids (deterministic; no Math.random). */
  logSeq: number;
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
  /**
   * Run-wide combat rhythm: +1 on win, −1 on loss, clamped [−3, 3].
   * High tempo helps Bio damage; low tempo helps Pure heals.
   */
  combatTempo: number;
  /** Match-local: throttle duplicate tempo-bonus log lines (ms, exclusive). */
  tempoLogSilenceBioUntilMs: number;
  tempoLogSilencePureHealUntilMs: number;
  tempoLogSilenceMechaControlUntilMs: number;
  /** Match-local: throttle fight-style tempo narrative lines (ms, exclusive). */
  tempoNarrativeSilenceUntilMs: number;
  /** How fighter 1 is driven: dummy AI vs human/local vs future online. */
  opponentController: OpponentControllerKind;
}

export interface PlayerInput {
  move: -1 | 0 | 1;
  blockHeld: boolean;
}

export type ArenaReducerAction =
  | { type: "TICK"; dtMs: number; input: PlayerInput; opponentInput: PlayerInput }
  | { type: "BASIC_ATTACK" }
  | { type: "USE_CLIMAX" }
  | { type: "OPPONENT_USE_CLIMAX" }
  | { type: "DASH" }
  | { type: "USE_ABILITY"; slot: 0 | 1 }
  | { type: "SET_PLAYER_CLASS"; classId: ClassId }
  | { type: "SET_PLAYER_FIGHTER"; fighterId: FighterId }
  | { type: "SET_OPPONENT_CONTROLLER"; controller: OpponentControllerKind }
  | { type: "RESET_MATCH" }
  | { type: "OPPONENT_BASIC_ATTACK" }
  | { type: "OPPONENT_DASH" }
  | { type: "OPPONENT_USE_ABILITY"; slot: 0 | 1 }
  | { type: "SPEND_REINFORCE_BODY" }
  | { type: "SPEND_BRIBE_HANDLER" }
  | { type: "SPEND_BLOOD_RITUAL" }
  | { type: "BLOCK_START" }
  | { type: "BLOCK_END" }
  | { type: "MOVE_LEFT"; dtMs?: number }
  | { type: "MOVE_RIGHT"; dtMs?: number }
  | { type: "SET_RESOURCE_FOCUS"; focus: ResourceFocusId | null }
  | { type: "SET_COMBAT_STANCE"; fighterIdx: 0 | 1; stance: CombatStanceId }
  | {
      type: "NETPLAY_LOCKSTEP_FRAME";
      tickMs: number;
      p0: ArenaInputFrame;
      p1: ArenaInputFrame;
      prevP0: ArenaInputFrame;
      prevP1: ArenaInputFrame;
    };
