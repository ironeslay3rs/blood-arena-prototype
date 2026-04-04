import type {
  AbilityDefinition,
  ClassId,
  FighterDefinition,
  FighterId,
} from "./arenaTypes";

export interface SkillDefinition {
  id: string;
  name: string;
  resourceCost: number;
  cooldownMs: number;
  damage: number;
  range: number;
  /** Optional self-heal (Paladin cleanse/heal skill) */
  healSelf?: number;
}

/** Legacy combat kit used by the current arena sim (until BMRT fighters map here). */
export interface ClassDefinition {
  id: ClassId;
  displayName: string;
  /** UI label for the resource bar (Rage / Conviction / Heat, etc.) */
  resourceLabel: string;
  /** Tailwind class for the resource bar fill */
  resourceBarFillClass: string;
  hpMax: number;
  resourceMax: number;
  resourceRegenPerSec: number;
  moveSpeedPerSec: number;
  dashDistance: number;
  dashCooldownMs: number;
  attackDamage: number;
  attackRange: number;
  attackCooldownMs: number;
  /** Fraction of damage absorbed while blocking (0–1) */
  blockMitigation: number;
  blockResourceDrainPerSec: number;
  skill1: SkillDefinition;
  skill2: SkillDefinition;
}

/** Default spawns when no UI fighter picker exists yet. */
export const DEFAULT_PLAYER_FIGHTER_ID: FighterId = "feral-hound";
export const DEFAULT_ENEMY_FIGHTER_ID: FighterId = "bone-plating";

/** Maps legacy class picker → default BMRT fighter (until UI selects `FighterId`). */
export const CLASS_DEFAULT_FIGHTER: Record<ClassId, FighterId> = {
  werewolf: "feral-hound",
  paladin: "vault-disciple",
  "silver-knight": "ironheart-cadet",
};

/** BMRT roster — faction blocks, then alphabetical within faction. */
export const FIGHTER_ORDER: FighterId[] = [
  "feral-hound",
  "blood-surge",
  "bone-plating",
  "vault-disciple",
  "radiant-ward",
  "ember-seal",
  "ironheart-cadet",
  "precision-burst",
  "servo-harness",
  "scrap-hound",
  "runic-decoder",
  "hex-splicer",
];

export const FIGHTER_DEFINITIONS: Record<FighterId, FighterDefinition> = {
  "feral-hound": {
    id: "feral-hound",
    canonCharacterId: "raze",
    name: "Feral Hound",
    faction: "Bio",
    maxHealth: 86,
    baseAttack: 18,
    movementSpeed: 36,
    resourceType: "rage",
    abilities: [
      {
        id: "feral-bite",
        name: "Bite",
        description: "Quick snapping melee strike.",
        cooldown: 3000,
        effectType: "damage",
      },
      {
        id: "feral-frenzy-dash",
        name: "Frenzy Dash",
        description: "Lunge forward in a reckless rush.",
        cooldown: 5200,
        effectType: "dash",
      },
    ],
    passive:
      "Bio predator: light frame, fast legs, and bite damage that spikes in short windows—trade HP for tempo and burst.",
  },
  "blood-surge": {
    id: "blood-surge",
    canonCharacterId: "grave",
    name: "Blood Surge",
    faction: "Bio",
    maxHealth: 94,
    baseAttack: 21,
    movementSpeed: 34,
    resourceType: "rage",
    abilities: [
      {
        id: "blood-letting-cleave",
        name: "Bloodletting Cleave",
        description: "Wide swing that trades safety for berserker pressure.",
        cooldown: 3600,
        effectType: "damage",
      },
      {
        id: "surging-dive",
        name: "Surging Dive",
        description: "Throw yourself at the target while the surge peaks.",
        cooldown: 5000,
        effectType: "dash",
      },
    ],
    passive:
      "Bio berserker: lower life pool, cruel cleave damage, and surge mobility—reward all-in trades over long guards.",
  },
  "bone-plating": {
    id: "bone-plating",
    canonCharacterId: "vex",
    name: "Bone Plating",
    faction: "Bio",
    maxHealth: 124,
    baseAttack: 10,
    movementSpeed: 22,
    resourceType: "rage",
    abilities: [
      {
        id: "bone-bulwark",
        name: "Bone Bulwark",
        description: "Harden plating to soak the next burst of damage.",
        cooldown: 6200,
        effectType: "shield",
      },
      {
        id: "rib-cracker",
        name: "Rib Cracker",
        description: "Slow, heavy slam when you refuse to give ground.",
        cooldown: 4400,
        effectType: "damage",
      },
    ],
    passive:
      "Bio bruiser (still lighter than other factions’ tanks): plating trades total HP for faster footspeed and a punishing rib shot cadence.",
  },
  "vault-disciple": {
    id: "vault-disciple",
    canonCharacterId: "sable",
    name: "Vault Disciple",
    faction: "Pure",
    maxHealth: 152,
    baseAttack: 11,
    movementSpeed: 23,
    resourceType: "conviction",
    abilities: [
      {
        id: "vault-sigil-strike",
        name: "Vault Sigil Strike",
        description: "Inscribed hit that punishes sloppy approaches.",
        cooldown: 4400,
        effectType: "damage",
      },
      {
        id: "disciples-aegis",
        name: "Disciple's Aegis",
        description: "Brief vow of protection; room for ally shielding later.",
        cooldown: 6800,
        effectType: "shield",
      },
    ],
    passive:
      "Pure bulwark: deep health pool, softer baseline damage, and aegis uptime—let block and shields carry the lane.",
  },
  "radiant-ward": {
    id: "radiant-ward",
    canonCharacterId: "aurel",
    name: "Radiant Ward",
    faction: "Pure",
    maxHealth: 188,
    baseAttack: 8,
    movementSpeed: 19,
    resourceType: "conviction",
    abilities: [
      {
        id: "heal-pulse",
        name: "Heal Pulse",
        description: "Channel restorative light to mend wounds—faster pulse than other kits.",
        cooldown: 3800,
        effectType: "heal",
      },
      {
        id: "shield-aura",
        name: "Shield Aura",
        description: "Wrap nearby space in a soft protective barrier.",
        cooldown: 5600,
        effectType: "shield",
      },
    ],
    passive:
      "Pure healer: massive HP budget and the shortest heal cadence in the roster—more healing touches per minute at the cost of kill pressure.",
  },
  "ember-seal": {
    id: "ember-seal",
    canonCharacterId: "ilyra",
    name: "Ember Seal",
    faction: "Pure",
    maxHealth: 156,
    baseAttack: 12,
    movementSpeed: 24,
    resourceType: "conviction",
    abilities: [
      {
        id: "seal-strike",
        name: "Seal Strike",
        description: "Tagged blow that sets up the next exchange.",
        cooldown: 4000,
        effectType: "damage",
      },
      {
        id: "ember-brand",
        name: "Ember Brand",
        description: "Mark the foe to amplify your next effort.",
        cooldown: 5600,
        effectType: "buff",
      },
    ],
    passive:
      "Pure duelist: sturdy body, measured damage, and seal/buff rhythm tuned for long defensive wins.",
  },
  "ironheart-cadet": {
    id: "ironheart-cadet",
    canonCharacterId: "cael",
    name: "Ironheart Cadet",
    faction: "Mecha",
    maxHealth: 122,
    baseAttack: 12,
    movementSpeed: 25,
    resourceType: "heat",
    abilities: [
      {
        id: "training-burst",
        name: "Training Burst",
        description: "Controlled burst from the cadet’s line weapon.",
        cooldown: 2800,
        effectType: "damage",
      },
      {
        id: "formation-dash",
        name: "Formation Dash",
        description: "Drill forward to close distance or reset spacing.",
        cooldown: 4800,
        effectType: "dash",
      },
    ],
    passive:
      "Mecha cadence: mid-weight frame with heat abilities cycling quickly—drill burst and dash on shorter clocks than other factions.",
  },
  "precision-burst": {
    id: "precision-burst",
    canonCharacterId: "korin",
    name: "Precision Burst",
    faction: "Mecha",
    maxHealth: 112,
    baseAttack: 16,
    movementSpeed: 24,
    resourceType: "heat",
    abilities: [
      {
        id: "target-shot",
        name: "Target Shot",
        description: "Fast lining shot for poking space.",
        cooldown: 2600,
        effectType: "damage",
      },
      {
        id: "charged-shot",
        name: "Charged Shot",
        description: "Commit extra heat into a heavier line attack.",
        cooldown: 5600,
        effectType: "damage",
      },
    ],
    passive:
      "Mecha line rifle: mid HP, excellent cooldown efficiency on poke and commit shots.",
  },
  "servo-harness": {
    id: "servo-harness",
    canonCharacterId: "briggs",
    name: "Servo Harness",
    faction: "Mecha",
    maxHealth: 132,
    baseAttack: 12,
    movementSpeed: 23,
    resourceType: "heat",
    abilities: [
      {
        id: "mag-plating-vent",
        name: "Mag Plating Vent",
        description:
          "Snap-deploy plates—Mecha shield rhythm with shorter downtime than other factions.",
        cooldown: 4200,
        effectType: "shield",
      },
      {
        id: "hydraulic-slam",
        name: "Hydraulic Slam",
        description: "Drive augmented limbs through the guard.",
        cooldown: 4000,
        effectType: "damage",
      },
    ],
    passive:
      "Mecha bruiser: leans on frequent shield vents (same shield potency as global rules) plus hydraulic finishers.",
  },
  "scrap-hound": {
    id: "scrap-hound",
    canonCharacterId: "patch",
    name: "Scrap Hound",
    faction: "Black City",
    maxHealth: 84,
    baseAttack: 18,
    movementSpeed: 32,
    resourceType: "instability",
    abilities: [
      {
        id: "junk-flurry",
        name: "Junk Flurry",
        description:
          "Rake with salvaged edges—volatile tempo: high payoff if you connect, thin margin for error.",
        cooldown: 3400,
        effectType: "damage",
      },
      {
        id: "scavenge-dash",
        name: "Scavenge Dash",
        description: "Skid forward to steal initiative and scrap.",
        cooldown: 4800,
        effectType: "dash",
      },
    ],
    passive:
      "Black City scavenger: low HP and high damage—reward aggression; one bad trade hurts more than on other factions.",
  },
  "runic-decoder": {
    id: "runic-decoder",
    canonCharacterId: "null",
    name: "Runic Decoder",
    faction: "Black City",
    maxHealth: 88,
    baseAttack: 15,
    movementSpeed: 26,
    resourceType: "instability",
    abilities: [
      {
        id: "disrupt",
        name: "Disrupt",
        description:
          "Strip a beneficial rune or buff from the target (implementation later).",
        cooldown: 4400,
        effectType: "damage",
      },
      {
        id: "silence-strike",
        name: "Silence Strike",
        description: "A hit aimed at muting the opponent’s options briefly.",
        cooldown: 5200,
        effectType: "damage",
      },
    ],
    passive:
      "Black City control: glassy HP with above-average attack and fast decode windows—higher ceiling, harsh mistakes.",
  },
  "hex-splicer": {
    id: "hex-splicer",
    canonCharacterId: "splice",
    name: "Hex Splicer",
    faction: "Black City",
    maxHealth: 90,
    baseAttack: 14,
    movementSpeed: 28,
    resourceType: "instability",
    abilities: [
      {
        id: "splice-boost",
        name: "Splice Boost",
        description:
          "Splice unstable power inward—big next-hit payoff; your HP bar is the risk meter (self-harm rules TBD).",
        cooldown: 4800,
        effectType: "buff",
      },
      {
        id: "overload-shot",
        name: "Overload Shot",
        description:
          "Volatile bolt—shorter fuse than other factions’ nukes for spike damage.",
        cooldown: 3600,
        effectType: "damage",
      },
    ],
    passive:
      "Black City splicer: unstable buff→burst loop on aggressive cooldowns; statline trades bulk for explosive turns.",
  },
};

export const CLASS_ORDER: ClassId[] = ["werewolf", "paladin", "silver-knight"];

export const CLASS_DATA: Record<ClassId, ClassDefinition> = {
  werewolf: {
    id: "werewolf",
    displayName: "Werewolf",
    resourceLabel: "Rage",
    resourceBarFillClass: "bg-red-600",
    hpMax: 110,
    resourceMax: 84,
    resourceRegenPerSec: 11,
    moveSpeedPerSec: 32,
    dashDistance: 28,
    dashCooldownMs: 1550,
    attackDamage: 15,
    attackRange: 12,
    attackCooldownMs: 410,
    blockMitigation: 0.32,
    blockResourceDrainPerSec: 23,
    skill1: {
      id: "maul",
      name: "Maul",
      resourceCost: 22,
      cooldownMs: 4500,
      damage: 28,
      range: 12,
    },
    skill2: {
      id: "blood-frenzy",
      name: "Blood Frenzy",
      resourceCost: 28,
      cooldownMs: 7000,
      damage: 20,
      range: 11,
    },
  },
  paladin: {
    id: "paladin",
    displayName: "Paladin",
    resourceLabel: "Conviction",
    resourceBarFillClass: "bg-amber-500",
    hpMax: 165,
    resourceMax: 108,
    resourceRegenPerSec: 10.5,
    moveSpeedPerSec: 19,
    dashDistance: 17,
    dashCooldownMs: 2700,
    attackDamage: 11,
    attackRange: 15,
    attackCooldownMs: 620,
    blockMitigation: 0.82,
    blockResourceDrainPerSec: 8,
    skill1: {
      id: "smite",
      name: "Smite",
      resourceCost: 20,
      cooldownMs: 4000,
      damage: 22,
      range: 15,
    },
    skill2: {
      id: "lay-on-hands",
      name: "Lay on Hands",
      resourceCost: 35,
      cooldownMs: 8000,
      damage: 0,
      range: 0,
      healSelf: 40,
    },
  },
  "silver-knight": {
    id: "silver-knight",
    displayName: "Silver Knight",
    resourceLabel: "Heat",
    resourceBarFillClass: "bg-orange-500",
    hpMax: 138,
    resourceMax: 96,
    resourceRegenPerSec: 10,
    moveSpeedPerSec: 24,
    dashDistance: 24,
    dashCooldownMs: 1750,
    attackDamage: 12,
    attackRange: 14,
    attackCooldownMs: 495,
    blockMitigation: 0.52,
    blockResourceDrainPerSec: 12,
    skill1: {
      id: "impaling-dash",
      name: "Impaling Dash",
      resourceCost: 26,
      cooldownMs: 5200,
      damage: 30,
      range: 15,
    },
    skill2: {
      id: "heat-vent",
      name: "Heat Vent",
      resourceCost: 24,
      cooldownMs: 6000,
      damage: 18,
      range: 13,
    },
  },
};
