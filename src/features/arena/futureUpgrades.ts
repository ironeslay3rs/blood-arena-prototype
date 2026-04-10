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
  | "next_match_rule_preview"
  | "primary_rematch_cta"
  | "live_exchange_readout"
  | "round_hp_exchange_totals"
  | "combo_depth_hud"
  | "stance_ribbon"
  | "reduced_motion_card_fx"
  | "playtest_rubric_panel"
  | "combo_cancel_windows"
  | "super_climax_slot"
  | "air_or_lane_variant"
  | "sprite_animation_pipeline"
  | "rollback_netcode"
  | "netplay_trust_readout"
  | "netplay_confirm_backlog"
  | "pvp_session_ft_scoreboard"
  | "pvp_session_set_lock"
  | "pvp_set_win_match_banner"
  | "p2_session_parity_strip"
  | "growth_upgrade_panel"
  | "growth_ledger_identity_spend"
  | "netplay_peer_trust_supplement"
  | "netplay_desync_recovery_ui"
  | "netplay_peer_display_label"
  | "cancel_link_window_ms_readout"
  | "playtest_rubric_clipboard"
  | "growth_profile_damage_totals";

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
    id: "next_match_rule_preview",
    phase: 1,
    pillar: "readability",
    headline: "Next-match rule preview",
    designerIntent:
      "Pillar Rhythm: when a round ends, show the upcoming global rule (next ordinal) + same coaching as round start — players pivot before reset, not after.",
    implementation: "shipped",
    dependencyNotes:
      "BP-30: nextMatchRulePreview(finishedOrdinal) in arenaReadabilityHints; violet callout on match banner when winner set.",
  },
  {
    id: "primary_rematch_cta",
    phase: 1,
    pillar: "readability",
    headline: "Primary Rematch control",
    designerIntent:
      "Rubric T4: one obvious control after round resolve — Rematch in the result card, keyboard parity unchanged, focus lands on the button when the fight ends.",
    implementation: "shipped",
    dependencyNotes:
      "BP-31: ArenaScreen match banner; winner-colored button; requestAnimationFrame focus; aria-label on Rematch.",
  },
  {
    id: "live_exchange_readout",
    phase: 1,
    pillar: "readability",
    headline: "Live last-exchange readout",
    designerIntent:
      "Rubric T3: during the round, a single line classifies the latest relevant log exchange — clean, blocked chip, whiff, or Climax — without opening the full log.",
    implementation: "shipped",
    dependencyNotes:
      "BP-32 + BP-34: lastLiveExchangeReadout (incl. Climax→damage chain); LiveExchangeReadout under SkillBar; Vitest arenaLiveExchangeReadout.test.ts.",
  },
  {
    id: "round_hp_exchange_totals",
    phase: 1,
    pillar: "readability",
    headline: "Round HP exchange totals",
    designerIntent:
      "After the round, show P1 and P2 HP damage dealt/taken from sim counters — honest numbers beside the qualitative recap (BP-28).",
    implementation: "shipped",
    dependencyNotes:
      "BP-33: roundHpExchangeTotals from matchPlayerDamageDealt/Taken; P2 mirrors 1v1 exchange; ArenaScreen match banner.",
  },
  {
    id: "combo_depth_hud",
    phase: 2,
    pillar: "expression",
    headline: "Active combo depth HUD",
    designerIntent:
      "Pillar Fantasy/Expression: when a chain is live, show both fighters’ sim combo depth — same numbers that drive scaling, not a separate estimate.",
    implementation: "shipped",
    dependencyNotes:
      "BP-35: activeComboDepthSummary; ComboDepthReadout beside LiveExchangeReadout; hidden when both depths are zero.",
  },
  {
    id: "stance_ribbon",
    phase: 1,
    pillar: "readability",
    headline: "Stance ribbon",
    designerIntent:
      "Pillar Clarity: both players’ Aggressive / Defensive / Control choice is visible next to the arena — same data as the cards, zero extra navigation.",
    implementation: "shipped",
    dependencyNotes:
      "BP-36: stanceRibbonCopy from STANCE_UI; StanceRibbonReadout first in the readout row; SR repeats shortHints.",
  },
  {
    id: "reduced_motion_card_fx",
    phase: 1,
    pillar: "readability",
    headline: "Reduced motion — card & float FX",
    designerIntent:
      "OS “reduce motion” disables translate/scale/pulse animations on fighter-card damage floats, captions, attack pulse, and evolution overlays — information stays, spectacle drops.",
    implementation: "shipped",
    dependencyNotes:
      "BP-37: globals.css under prefers-reduced-motion; complements existing arena shake / KO / toast / hitstop rules.",
  },
  {
    id: "playtest_rubric_panel",
    phase: 1,
    pillar: "readability",
    headline: "Playtest rubric panel (T1–T6)",
    designerIntent:
      "Ship §15.3 in the UI so sessions use the same qualitative bar — session length, six checks (T1–T6), anti-goals — without opening the master plan.",
    implementation: "shipped",
    dependencyNotes:
      "BP-38 + T6 (BP-46): playtestRubric.ts mirrors §15.3; PlaytestRubricPanel; Vitest playtestRubric.test.ts.",
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
    implementation: "planned",
    dependencyNotes: "Major scope; prototype may stay ground-only.",
  },
  {
    id: "sprite_animation_pipeline",
    phase: 3,
    pillar: "production",
    headline: "Sprite / animation pipeline",
    designerIntent:
      "Silhouette, anticipation, recovery — production path to AAA feel.",
    implementation: "shipped",
    dependencyNotes:
      "Prototype shipped: optional ARENA_COMBAT_SPRITE_ATLAS.url + ArenaCombatCanvas drawImage; climax sampleUrl + combatAudio — full art pipeline / VO production still expandable (BP-09 §9).",
  },
  {
    id: "rollback_netcode",
    phase: 3,
    pillar: "online",
    headline: "Rollback online",
    designerIntent:
      "Competitive integrity for real PvP — separate from hot-seat excellence.",
    implementation: "planned",
    dependencyNotes:
      "Relay lockstep prototype shipped (BP-25); prediction + rollback + relay auth/rooms still out of scope for this repo slice.",
  },
  {
    id: "netplay_trust_readout",
    phase: 2,
    pillar: "online",
    headline: "Netplay trust strip (lockstep frame + checksum)",
    designerIntent:
      "Trust pillar: in relay mode, show confirmed sim frame, lockstep tick, and a compact state checksum so sessions feel inspectable — groundwork for peer desync compare.",
    implementation: "shipped",
    dependencyNotes:
      "BP-39: netplayLockstepFrame in useArenaEngine; compactArenaChecksum in UI; NetplayRelayStrip; Vitest netplayTrustReadout.test.ts.",
  },
  {
    id: "netplay_confirm_backlog",
    phase: 2,
    pillar: "online",
    headline: "Netplay confirm backlog counter",
    designerIntent:
      "When `input_confirm` messages arrive faster than the sim can drain them (or out-of-order), show how many frames are buffered — reduces ‘frozen mystery’ in relay tests.",
    implementation: "shipped",
    dependencyNotes:
      "BP-40: netplayPendingConfirmCount from pendingConfirmsRef.size after each apply; netplayTrustReadout copy; NetplayRelayStrip.",
  },
  {
    id: "pvp_session_ft_scoreboard",
    phase: 1,
    pillar: "readability",
    headline: "Session first-to score (locals)",
    designerIntent:
      "Street Fighter / KOF couch set: running games in a first-to-N session, match-point and sudden-death lines — PvP clarity without faking a full tournament bracket in sim.",
    implementation: "shipped",
    dependencyNotes:
      "BP-41: arenaSessionScore.ts; sessionRoundWins in useArenaEngine (logSeq-keyed); MatchHud emerald card; hidden in training vs dummy.",
  },
  {
    id: "pvp_session_set_lock",
    phase: 1,
    pillar: "readability",
    headline: "Session set complete + Next set",
    designerIntent:
      "When first-to is reached, freeze session scoring until players opt into a new set — honest locals flow; exhibition rounds don’t inflate the score.",
    implementation: "shipped",
    dependencyNotes:
      "BP-42: sessionSetIsComplete guard in useArenaEngine; violet set banner; startNextSessionSet action; Vitest sessionSetWinnerRole.",
  },
  {
    id: "pvp_set_win_match_banner",
    phase: 1,
    pillar: "readability",
    headline: "Set-winning KO in match banner",
    designerIntent:
      "When the round that hits first-to is the dramatic KO, echo set victory in the same card as round recap — spectators and players on small viewports don’t miss the set.",
    implementation: "shipped",
    dependencyNotes:
      "BP-43: matchBannerSessionSetVictoryLine; ArenaScreen violet strip; Vitest arenaSessionScore.test.ts.",
  },
  {
    id: "p2_session_parity_strip",
    phase: 1,
    pillar: "readability",
    headline: "P2 session score near cards",
    designerIntent:
      "T2 parity: Player 2 sees the same session facts (FT, games, match point, set lock) next to the fight row — no craning to the page header.",
    implementation: "shipped",
    dependencyNotes:
      "BP-44: p2SessionChipSummary; P2SessionParityStrip under FighterPanel grid; hidden vs dummy.",
  },
  {
    id: "growth_upgrade_panel",
    phase: 1,
    pillar: "readability",
    headline: "Upgrade path panel (stream F)",
    designerIntent:
      "Core hook delivery: career level, wins-to-next tier, combat bonuses from level, and resource totals in one honest ledger — plus T5 rubric for growth legibility.",
    implementation: "shipped",
    dependencyNotes:
      "BP-45: arenaGrowthReadout.ts, GrowthUpgradePanel, playtestRubric T5; Vitest arenaGrowthReadout.test.ts.",
  },
  {
    id: "growth_ledger_identity_spend",
    phase: 1,
    pillar: "readability",
    headline: "Growth ledger + identity + spend preview",
    designerIntent:
      "Stream F closure: reputation and unified identity beside career; last-bout resource delta; queued prep; explicit spend costs/effects in-panel.",
    implementation: "shipped",
    dependencyNotes:
      "BP-46: LastBoutLedger in arena state; arenaSpendReadout; GrowthUpgradePanel; formatResourceDeltaBetween.",
  },
  {
    id: "netplay_peer_trust_supplement",
    phase: 2,
    pillar: "online",
    headline: "Relay peer career + RTT + checksum compare",
    designerIntent:
      "Pδ slice: symmetric disclosed career over relay; ping RTT; exchange per-frame compactArenaChecksum for desync visibility.",
    implementation: "shipped",
    dependencyNotes:
      "BP-46: netplay-relay.mjs player_meta / peer_checksum / ping; useArenaEngine; NetplayRelayStrip + netplayRelayTrustSupplementLine.",
  },
  {
    id: "netplay_desync_recovery_ui",
    phase: 2,
    pillar: "online",
    headline: "Desync recovery callout + assertive relay live region",
    designerIntent:
      "When peer checksum mismatches, show one actionable Rematch line — not only monospace strip jargon.",
    implementation: "shipped",
    dependencyNotes:
      "BP-47: netplayRelayDesyncRecoveryLine; NetplayRelayStrip role=alert + aria-live assertive on mismatch/error.",
  },
  {
    id: "netplay_peer_display_label",
    phase: 2,
    pillar: "online",
    headline: "Optional peer display name (relay)",
    designerIntent:
      "Symmetric human-readable handle via ?netplayLabel= — forwarded in peer_ledger for trust + growth panel.",
    implementation: "shipped",
    dependencyNotes:
      "BP-47: netplay-relay.mjs displayLabel; parseRelayDownlink; GrowthUpgradePanel + netplayRelayTrustSupplementLine.",
  },
  {
    id: "cancel_link_window_ms_readout",
    phase: 2,
    pillar: "expression",
    headline: "Cancel link window ms readout",
    designerIntent:
      "Surface remaining combo-link time next to P1 controls — same sim clock as cancelWindowUntilMs.",
    implementation: "shipped",
    dependencyNotes: "BP-47: SkillBar arenaNowMs + cancelWindowUntilMs; ArenaScreen wires state.nowMs.",
  },
  {
    id: "playtest_rubric_clipboard",
    phase: 1,
    pillar: "readability",
    headline: "Playtest worksheet clipboard export",
    designerIntent:
      "One-click plain-text rubric + anti-goals for session notes — no separate doc hunt.",
    implementation: "shipped",
    dependencyNotes:
      "BP-47: playtestRubricClipboard.buildPlaytestRubricClipboardText; PlaytestRubricPanel button.",
  },
  {
    id: "growth_profile_damage_totals",
    phase: 1,
    pillar: "readability",
    headline: "Profile career damage in growth panel",
    designerIntent:
      "Lifetime dealt/taken from FighterProfile — honest long-arc stat beside reputation.",
    implementation: "shipped",
    dependencyNotes:
      "BP-47: GrowthUpgradePanel uses UnifiedFighterIdentity totalDamageDealt/Taken.",
  },
] as const;

export function futureUpgradesForPhase(phase: FuturePhase): FutureUpgradeEntry[] {
  return FUTURE_UPGRADE_CATALOG.filter((e) => e.phase === phase);
}
