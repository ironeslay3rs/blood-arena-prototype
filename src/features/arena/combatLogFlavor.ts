import type { CanonCharacterId } from "@/features/shared/canonCharacters";

/** HP fraction (after damage) that counts as “near death” for one voice line per match. */
export const NEAR_DEATH_HP_RATIO = 0.28;

type FlavorTable = Record<
  CanonCharacterId,
  { win: string; loss: string; streak: string; nearDeath: string }
>;

const FLAVOR: FlavorTable = {
  raze: {
    win: "Raze roars through your ribs—another throat for the tally.",
    loss: "Raze’s fury gutters; instinct will want blood back.",
    streak: "The pack-smell is on you—Raze does not forget a hot streak.",
    nearDeath: "Raze’s pulse hammers: cornered is where the teeth come out.",
  },
  aurel: {
    win: "Aurel inclines his head—light held, judgment earned.",
    loss: "Aurel’s voice stays even; failure is just another verse.",
    streak: "Aurel marks the streak without smile—duty, not pride.",
    nearDeath: "Aurel steadies your breath; the Sanctum still stands behind you.",
  },
  null: {
    win: "Null indexes the win—noise dropped, signal clean.",
    loss: "Null notes the loss: data point, not drama.",
    streak: "Null observes the streak—pattern risk rising; adjust.",
    nearDeath: "Null’s calm sharpens at the redline—calculate the next breath.",
  },
  splice: {
    win: "Splice whistles low—another splice paid out in full.",
    loss: "Splice spits; the graft didn’t hold this round.",
    streak: "Splice grins at the streak—Black Market math is smiling back.",
    nearDeath: "Splice hisses through pain—edges still cut, use them.",
  },
  patch: {
    win: "Patch taps casing—run hot, still standing.",
    loss: "Patch sighs; she’ll patch you back together off-clock.",
    streak: "Patch clocks the streak—systems love a winner who lasts.",
    nearDeath: "Patch reroutes fear—vent pressure, hold the line.",
  },
  grave: {
    win: "Grave’s grin is quiet—the pit remembers your name.",
    loss: "Grave tastes ash; the Bio line doesn’t forgive soft falls.",
    streak: "Grave feels the streak in his bones—hunger likes momentum.",
    nearDeath: "Grave digs in—low HP is just another kind of hungry.",
  },
  ilyra: {
    win: "Ilyra seals the round—corruption held at the threshold.",
    loss: "Ilyra exhales; the seal broke, not your oath.",
    streak: "Ilyra’s seal-ink warms—consecration follows consistency.",
    nearDeath: "Ilyra anchors you—this is the test you trained for.",
  },
  korin: {
    win: "Korin mutters thanks—ugly win, honest prayer.",
    loss: "Korin swears once, then kneels; the next bell matters.",
    streak: "Korin squints at the streak—foreign gods take notice too.",
    nearDeath: "Korin locks stance—pain is just another opponent.",
  },
  cael: {
    win: "Cael vents heat—telemetry says: alive, optimal enough.",
    loss: "Cael’s harness whines; log the loss, reset the run.",
    streak: "Cael rides the streak—overdrive loves a brave idiot.",
    nearDeath: "Cael clamps down—redline is where pilots are forged.",
  },
  vex: {
    win: "Vex laughs once, thin—debt collectors love a live debtor.",
    loss: "Vex vanishes into shadow; the street keeps the tab.",
    streak: "Vex marks you loud—City gossip loves a streak.",
    nearDeath: "Vex goes still—predators smell blood; be faster.",
  },
  briggs: {
    win: "Briggs slams steel—siege mind, trial scale.",
    loss: "Briggs spits grit; sieges turn on the next push.",
    streak: "Briggs nods once—the line holds when you do.",
    nearDeath: "Briggs growls—veterans die standing; you’re not done.",
  },
  sable: {
    win: "Sable’s oath clicks shut—charter satisfied, for now.",
    loss: "Sable’s jaw sets; dead law still demands a rematch.",
    streak: "Sable tracks the streak—oaths stack like interest.",
    nearDeath: "Sable whispers the old words—you bend, you don’t break.",
  },
};

export function combatLogWinFlavor(canon: CanonCharacterId): string {
  return FLAVOR[canon].win;
}

export function combatLogLossFlavor(canon: CanonCharacterId): string {
  return FLAVOR[canon].loss;
}

/** When win streak is at least 3 after this victory. */
export function combatLogStreakFlavor(canon: CanonCharacterId): string {
  return FLAVOR[canon].streak;
}

/** When the player first crosses into near-death HP this match. */
export function combatLogNearDeathFlavor(canon: CanonCharacterId): string {
  return FLAVOR[canon].nearDeath;
}
