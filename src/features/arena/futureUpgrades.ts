/**
 * Design catalog for **future** fighting-game upgrades (SF/KOF-style spectacle).
 * Used by in-app panel + planning; does not toggle runtime combat by itself.
 */
export type FuturePillar =
  | "readability"
  | "spectacle"
  | "expression"
  | "production"
  | "online";

export type FutureUpgradeId =
  | "hitstop_tiers"
  | "ko_beat"
  | "screen_shake_chroma"
  | "announcer_stingers"
  | "round_resolve_recap"
  | "p2_hot_seat_parity_strip"
  | "combo_cancel_windows"
  | "super_climax_slot"
  | "air_or_lane_variant"
  | "sprite_animation_pipeline"
  | "rollback_netcode";

export type FuturePhase = 1 | 2 | 3;

export type ImplementationStatus = "planned" | "in_progress" | "shipped";

export interface FutureUpgradeEntry {
  id: FutureUpgradeId;
  phase: FuturePhase;
  pillar: FuturePillar;
  headline: string;
  designerIntent: string;
  dependencyNotes?: string;
  /** Engineering / design status — sync when scope lands. */
  implementation?: ImplementationStatus;
}

export const FUTURE_UPGRADE_CATALOG: readonly FutureUpgradeEntry[] = [
  {
    id: "hitstop_tiers",
    phase: 1,
    pillar: "spectacle",
    headline: "Hitstop / impact tiers",
    designerIntent:
      "Sell weight per hit type (light vs heavy, blocked) without hiding causality.",
    implementation: "shipped",
    dependencyNotes:
      "resolveHitstopMs + useCombatFeedback (timeline + .hitstop-hold on #arena-combat).",
  },
  {
    id: "ko_beat",
    phase: 1,
    pillar: "spectacle",
    headline: "KO beat",
    designerIntent:
      "Short readable pause + sting before round UI — the ‘round decided’ moment.",
    implementation: "shipped",
    dependencyNotes:
      "Arena fight strip vignette via combatJuiceConfig.koBeatMs + useKoBeatPresentation; optional KO zoom arenaZoomOnKo (1 = off).",
  },
  {
    id: "screen_shake_chroma",
    phase: 1,
    pillar: "spectacle",
    headline: "Screen juice (shake / flash)",
    designerIntent:
      "Micro-feedback on heavies; capped so spacing stays readable.",
    implementation: "shipped",
    dependencyNotes:
      "Heavy connect: inner arena layer .arena-screen-shake + COMBAT_JUICE.screenShake* (SkillBar outside shake); off if reduced motion.",
  },
  {
    id: "announcer_stingers",
    phase: 1,
    pillar: "spectacle",
    headline: "Announcer / stinger lines",
    designerIntent:
      "Text + SFX hooks for round start, clutch, streak — cheap epic lift.",
    implementation: "shipped",
    dependencyNotes:
      "useAnnouncerStingers + AnnouncerStingerToast; WebAudio stinger_clutch / stinger_streak when combat feedback on.",
  },
  {
    id: "round_resolve_recap",
    phase: 1,
    pillar: "readability",
    headline: "Round-over causality recap",
    designerIntent:
      "After KO, one honest line ties the result to the last readable exchange (Climax / clean / chip) — log-derived, no fake precision.",
    implementation: "shipped",
    dependencyNotes:
      "BP-28: arenaRoundRecap.roundResolveReadability; match banner in ArenaScreen when winner set; Vitest arenaRoundRecap.test.ts.",
  },
  {
    id: "p2_hot_seat_parity_strip",
    phase: 1,
    pillar: "readability",
    headline: "Hot-seat P2 control strip",
    designerIntent:
      "Rubric T2: P2 sees default move / attack / Climax / block / skills on the round-start toast — same facts as the keyboard reference, zero extra menu dive.",
    implementation: "shipped",
    dependencyNotes:
      "BP-29: arenaReadabilityHints p2ParityLine + hotSeatP2ControlsSrNarration; RoundStartOverlay emerald block; useRoundStartAnnouncement 5.2s in local_human.",
  },
  {
    id: "combo_cancel_windows",
    phase: 2,
    pillar: "expression",
    headline: "Combo / cancel routes",
    designerIntent:
      "Skill expression across multiple beats — needs frame feedback + tutorial surface.",
    implementation: "shipped",
    dependencyNotes:
      "cancelRouteConfig per-roster link highlights; comboChainConfig + ComboChainToast; cancelWindowUntilMs; sim comboOutgoingDamageMultiplier. Strict frame cancels TBD.",
  },
  {
    id: "super_climax_slot",
    phase: 2,
    pillar: "expression",
    headline: "Super / climax slot",
    designerIntent:
      "One big readable wind-up with payoff — meter or round-gated.",
    implementation: "shipped",
    dependencyNotes:
      "Climax meter + card overrides; `resolveClimaxStinger` + `playClimaxConnect(fighterId, faction)` on unleash log.",
  },
  {
    id: "air_or_lane_variant",
    phase: 3,
    pillar: "expression",
    headline: "Air or multi-lane",
    designerIntent:
      "KOF/SF geometry — only if camera + input + clarity story is solved.",
    dependencyNotes: "Major scope; prototype may stay ground-only.",
  },
  {
    id: "sprite_animation_pipeline",
    phase: 3,
    pillar: "production",
    headline: "Sprite / animation pipeline",
    designerIntent:
      "Silhouette, anticipation, recovery — production path to AAA feel.",
    dependencyNotes:
      "BP-09 §9 — arenaCombatSpriteConfig atlas URL, ArenaCombatCanvas drawImage; climax sampleUrl + public/audio.",
  },
  {
    id: "rollback_netcode",
    phase: 3,
    pillar: "online",
    headline: "Rollback online",
    designerIntent:
      "Competitive integrity for real PvP — separate from hot-seat excellence.",
    dependencyNotes:
      "BP-25: npm run relay + NEXT_PUBLIC_NETPLAY_RELAY_URL + Online (relay); rollback/auth still TBD.",
  },
] as const;

export function futureUpgradesForPhase(phase: FuturePhase): FutureUpgradeEntry[] {
  return FUTURE_UPGRADE_CATALOG.filter((e) => e.phase === phase);
}
