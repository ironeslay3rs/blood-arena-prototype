/**
 * Persistent Black Market: Rune Trials / Void Wars character identities.
 * Data-only layer — combat wiring stays in arena until explicitly bridged.
 */

export type CanonCharacterId =
  | "splice"
  | "patch"
  | "null"
  | "grave"
  | "raze"
  | "aurel"
  | "ilyra"
  | "korin"
  | "cael"
  | "vex"
  | "briggs"
  | "sable";

/** Aligns with arena combat kit templates (werewolf / paladin / silver-knight). */
export type CanonCombatClass = "werewolf" | "paladin" | "silver-knight";

export type CanonFaction = "Bio" | "Mecha" | "Pure" | "Black City";

export type CanonBookPlacement = "Book 3" | "Book 4" | "Book 5";

export interface CanonCharacterDefinition {
  id: CanonCharacterId;
  name: string;
  class: CanonCombatClass;
  faction: CanonFaction;
  bookPlacement: CanonBookPlacement;
  /** Narrative hook in 1–2 lines (lore / story placement). */
  roleSummary: string;
  /** Short gameplay-facing identity (mechanics flavor, not stats). */
  combatIdentity: string;
}

export const CANON_CHARACTER_DEFINITIONS: Record<
  CanonCharacterId,
  CanonCharacterDefinition
> = {
  splice: {
    id: "splice",
    name: "Splice",
    class: "silver-knight",
    faction: "Black City",
    bookPlacement: "Book 4",
    roleSummary:
      "A gutter-scholar of forbidden grafts who trades in other people’s edges. Runs salvage for the Black Market’s Rune Trials circuit.",
    combatIdentity:
      "Mid-range pressure: strip tempo, punish overextension, cash in on debuffed targets.",
  },
  patch: {
    id: "patch",
    name: "Patch",
    class: "silver-knight",
    faction: "Mecha",
    bookPlacement: "Book 3",
    roleSummary:
      "Field tech who keeps war-forged rigs alive past their warranty. Owes favors up and down the Mecha sanctums.",
    combatIdentity:
      "Stamina bruiser: shield windows, short bursts, outlasts sloppy aggression.",
  },
  null: {
    id: "null",
    name: "Null",
    class: "paladin",
    faction: "Black City",
    bookPlacement: "Book 5",
    roleSummary:
      "Records-eraser turned duelist—proof is a weapon when truth is for sale. The Trials use them as a living gag order.",
    combatIdentity:
      "Denial specialist: silence windows, anti-buff pressure, closes on low-resource foes.",
  },
  grave: {
    id: "grave",
    name: "Grave",
    class: "werewolf",
    faction: "Bio",
    bookPlacement: "Book 4",
    roleSummary:
      "Carrier strain turned deliberate: they walk the Bio line between hunger and hierarchy. Crowds chant their name in the pit.",
    combatIdentity:
      "Bleed-and-chase: ramping melee threat, rewards staying on a marked target.",
  },
  raze: {
    id: "raze",
    name: "Raze",
    class: "werewolf",
    faction: "Bio",
    bookPlacement: "Book 5",
    roleSummary:
      "Former containment breach who chose the arena over a cell. Aurel’s sermons and Grave’s pack politics both want a piece of them.",
    combatIdentity:
      "All-in skirmisher: explosive trades, thrives when the fight turns messy.",
  },
  aurel: {
    id: "aurel",
    name: "Aurel",
    class: "paladin",
    faction: "Pure",
    bookPlacement: "Book 3",
    roleSummary:
      "Trial chaplain of the Sanctum ladder—kind voice, iron verdicts. Books Ilyra as a sister-in-oaths and Korin as a necessary blade.",
    combatIdentity:
      "Frontline anchor: mitigation auras, clean punishes on greedy dives.",
  },
  ilyra: {
    id: "ilyra",
    name: "Ilyra",
    class: "paladin",
    faction: "Pure",
    bookPlacement: "Book 4",
    roleSummary:
      "Inquisitor-engineer who treats corruption like a structural fault. Sends field reports that read like hymns.",
    combatIdentity:
      "Zone controller: consecrated space, strong against sustained aggression.",
  },
  korin: {
    id: "korin",
    name: "Korin",
    class: "paladin",
    faction: "Pure",
    bookPlacement: "Book 5",
    roleSummary:
      "The Order’s reluctant champion in foreign arenas—wins ugly, prays harder. Void Wars scouts already have his file.",
    combatIdentity:
      "Burst punisher: windows of sanctified spike damage after successful reads.",
  },
  cael: {
    id: "cael",
    name: "Cael",
    class: "silver-knight",
    faction: "Mecha",
    bookPlacement: "Book 3",
    roleSummary:
      "Test pilot who maps new chassis to old muscle memory. Briggs files the telemetry; Patch rewires what breaks.",
    combatIdentity:
      "Heat manager: high ceiling on overdrive, collapses if heat is mishandled.",
  },
  vex: {
    id: "vex",
    name: "Vex",
    class: "werewolf",
    faction: "Black City",
    bookPlacement: "Book 4",
    roleSummary:
      "Street myth with a Bio-adjacent bite and City paperwork—nobody agrees what they are, only that they collect debts.",
    combatIdentity:
      "Hit-and-bleed: mobility feints, rewards catching dodges on cooldown.",
  },
  briggs: {
    id: "briggs",
    name: "Briggs",
    class: "silver-knight",
    faction: "Mecha",
    bookPlacement: "Book 5",
    roleSummary:
      "Siege-line veteran rotated into Trials for ‘morale calibration.’ Treats the arena like a proving ground for the next war.",
    combatIdentity:
      "Heavy line: slow advance, massive single hits, breaks bunkered defense.",
  },
  sable: {
    id: "sable",
    name: "Sable",
    class: "paladin",
    faction: "Black City",
    bookPlacement: "Book 3",
    roleSummary:
      "Oath-bound to a dead charter—still enforces it with Pure technique and City pragmatism. Brokers between sanctum law and market law.",
    combatIdentity:
      "Duelist-templar: parry timing, single-target lockdown, weak to spread pressure.",
  },
};
