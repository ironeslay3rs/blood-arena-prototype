/**
 * Qualitative playtest rubric — mirrors docs/BLOOD_ARENA_MASTER_PLAN.md §15.3 (BP-38).
 * Single source for in-app panel + tests.
 */

export const PLAYTEST_SESSION_GUIDANCE =
  "Use 5–10 minute sessions. Pass = 3 of 4 players agree.";

export type PlaytestRubricItem = {
  id: "T1" | "T2" | "T3" | "T4" | "T5" | "T6";
  title: string;
  /** Question to ask players / observe. */
  prompt: string;
};

export const PLAYTEST_RUBRIC: readonly PlaytestRubricItem[] = [
  {
    id: "T1",
    title: "Rule read",
    prompt:
      "After the round-start toast, can the player state one risk change for this modifier without scrolling the log?",
  },
  {
    id: "T2",
    title: "Parity",
    prompt:
      "P2 describes how climax and skills work for their side without asking P1.",
  },
  {
    id: "T3",
    title: "Juice honesty",
    prompt:
      "With combat FX on, players still correctly identify whiff vs blocked vs hit reason (not only damage number).",
  },
  {
    id: "T4",
    title: "Reset friction",
    prompt:
      "Rematch in ≤1 intentional action after round resolve.",
  },
  {
    id: "T5",
    title: "Growth legibility",
    prompt:
      "After two matches, can the player name one thing that leveled up or which resource they’re saving — without guessing? (Persistent upgrade must read as real, not cosmetic.)",
  },
  {
    id: "T6",
    title: "Meta & online honesty",
    prompt:
      "Can they repeat what each between-round spend costs and does, and (in relay) what the netplay strip says about peer career / checksum / latency — without treating it as hidden power?",
  },
] as const;

export const PLAYTEST_ANTI_GOALS: readonly string[] = [
  "Air lanes or advanced movement before ground neutral reads clean in T1–T3.",
  "New characters before every FighterId climax/link teaching surface is honest in UI.",
  "Netplay rollback before relay lockstep proves fun in T2 (hot-seat excellence first).",
  "Selling ‘upgrade’ without surfacing level/resources/reputation in UI (opaque growth).",
];
