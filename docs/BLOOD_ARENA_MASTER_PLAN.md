# Blood Arena — master upgrade plan

**Purpose:** single north-star document for design + engineering: what “done” looks like, how work is sequenced, and where it lives in code.  
**Companion:** [`FIGHTING_GAME_ROADMAP.md`](./FIGHTING_GAME_ROADMAP.md) (tactical shipped list), [`futureUpgrades.ts`](../src/features/arena/futureUpgrades.ts) (in-app catalog).  
**Onboarding:** repo root [`README.md`](../README.md) (scripts, optional netplay env, links here).  
**Professional design contract (promises, pillar order, T1–T6 rubric, anti-goals):** **§15**.

### Upgrade sequence (executive)

0. **Persistent self-upgrade (core hook)** — players **keep upgrading** across sessions: **wins → level → small stat bonuses** (`fighterProgress`, `levelStatBonuses`), **resources → between-round spend** (`arenaSpend`, `MatchHud` meta), **reputation / identity** (`fighterReputation`, `fighterIdentity`). Fair PvP: power is **legible in UI + log**, not opaque loot RNG.  
1. **Baseline + parity** — core sim, juice, climax meter, P2/dummy (M0–M1).  
2. **Readable expression** — combo readout, link windows, scaling, meter economy, cancel **data** on UI (M2–M3, BP-04–07, 10–11).  
3. **Roster-complete fantasy** — every `FighterId` has card `climaxOverride` + link-route hints where needed (`BP-12`, `classData`, `cancelRouteConfig`).  
4. **Production** — sprite + VO pipeline **locked** below (`BP-09`).  
5. **Online** — deterministic sim cleanup + transport on top of netplay spec (`BP-08`, `simDeterminism.ts`).

---

## 1. North star

- **PvP-first, hot-seat excellent:** both players use the **same** combat rules, inputs, and expression tools (meter, climax, skills).
- **Readability before spectacle:** range, stance, tempo, and round rules remain obvious; juice is capped and tunable in [`combatJuiceConfig.ts`](../src/features/arena/combatJuiceConfig.ts).
- **Reference bar:** SF/KOF-style **weight** and **climax beats**, adapted to a browser prototype (no fake depth).

**Core selling idea — you keep upgrading yourself:** the fantasy is **return + growth**, not a single match. Every run feeds **persistent progression** (career wins/level, resources, between-bout choices) so the title *Arena* reads as **ongoing improvement** — skill *and* loadout evolution — while duel integrity stays SF/KOF-clean.

**Product ambition (not a mode list — a direction):** ship a **PvP-first** game whose long-term integrity competes with the **Street Fighter / The King of Fighters** tier: honest neutral, readable consequences, fair meters, and skill expression that holds up in tournament-style sessions. This is **not** a clone — Blood Arena wins on **its own ruleset, roster fantasy, and brand twist** in the browser. Training vs AI and relay prototypes exist to **ladder into** that duel, not to replace it. The milestones below (M0–M4, BP-##) are the engineering path toward that bar: clarity and parity before rollback-scale online and production art.

---

## 2. Work streams (parallel tracks)

| Stream | Outcome | Primary code |
|--------|---------|----------------|
| **A. Fairness / parity** | P1 and P2 have equivalent meters, climax, and (later) combo affordances | `arenaTypes`, `arenaActions`, `SkillBar`, `FighterPanel`, `opponentInputMapping` |
| **B. Feel (juice)** | Hitstop, shake, KO beat, announcer, climax freeze | `combatJuiceConfig`, `useCombatFeedback`, `globals.css` |
| **C. Expression** | Combos/cancels, richer supers, character-specific fantasy | `arenaActions` (frame-ish data), UI feedback, `classData` |
| **D. Production** | Sprites, VO, stages, polish | assets + render pipeline (future) |
| **E. Online** | Rollback netplay | `onlineNetplayStub.ts` spec + `simDeterminism.ts` audit until transport |
| **F. Growth / upgrade** | Persistent player power & identity — **legible**, not pay-to-win combat | `fighterProgress`, `fighterProgressStorage`, `arenaResources`, `arenaSpend`, `MatchHud` spend strip, `fighterReputation` |

Streams **A + B** are prerequisites for trustworthy playtests. **C** builds on log/sim discipline. **F** is the **return loop** (core hook). **D/E** are optional product bets.

---

## 3. Phased delivery (milestones)

### Milestone M0 — Baseline (shipped)

- Core sim, modifiers, tempo, persistence, training dummy, local PvP.
- Phase 1 juice: hitstop, shake, KO beat/zoom, announcer stingers.

### Milestone M1 — Parity & climax (**shipped** in prototype)

- **Per-fighter climax meter** on `FighterState` (deal/taken HP builds meter for *that* fighter).
- **P2 climax** — **M** / numpad **\*** + `FighterPanel` hot-seat HUD; **dummy** prioritizes climax when full + in range.
- Config: [`climaxMeterConfig.ts`](../src/features/arena/climaxMeterConfig.ts); actions: `USE_CLIMAX` / `OPPONENT_USE_CLIMAX`.

### Milestone M2 — Combo & cancel (**prototype shipped**)

- **Combo readout:** log-derived **×2+** chains per side (`useComboChainDisplay`, `ComboChainToast`); **gap** and **blocked** rules in [`comboChainConfig.ts`](../src/features/arena/comboChainConfig.ts).
- **Cancel link (UI + sim):** `FighterState.cancelWindowUntilMs` set on **clean** HP connects; P1 **SkillBar** rings dash/skills; P2 **FighterPanel** hot-seat line; keyboard reference explains link.
- **Still TBD (M2+):** frame tables, strict whiff-cancel validation in sim, tutorial mode.
- **Data (BP-06):** per-roster **link highlights** in [`cancelRouteConfig.ts`](../src/features/arena/cancelRouteConfig.ts) (UI teaching; inputs stay legal).
- Success (current): spectators see **chain count** and **which actions** read as links after clean hits.

### Milestone M3 — Character & super depth (**prototype slice shipped**)

- **Faction climax** — damage + log name by `FighterDefinition.faction` in [`climaxStrikeProfile.ts`](../src/features/arena/climaxStrikeProfile.ts) (e.g. *Primal / Sanctified / Overdrive / Blackout Climax*).
- **Meter economy** — basic **whiff** meter + defender **chip** bonus in [`climaxMeterConfig.ts`](../src/features/arena/climaxMeterConfig.ts); wired in `arenaActions`.
- **Sim combo scaling** — clean-hit chain depth on `FighterState` + `comboOutgoingDamageMultiplier` in [`comboChainConfig.ts`](../src/features/arena/comboChainConfig.ts).
- **Per-card climax** — **`climaxOverride` on every roster row** in [`classData.ts`](../src/features/arena/classData.ts); resolver in [`climaxStrikeProfile.ts`](../src/features/arena/climaxStrikeProfile.ts).
- **Committed damage-ability whiff** — spends resource + CD, log + meter (`CLIMAX_METER_ABILITY_DAMAGE_WHIFF`) in `arenaActions`.
- **Climax sting (audio)** — faction + sampled card tones on `unleashes …!` (`BP-15`, `resolveClimaxStinger`).
- **Still TBD:** `public/` OGG per card, full guard-push meter, frame-accurate supers.

### Milestone M4 — Scale (**in progress**)

- Air/lane experiments *only* if ground clarity holds.
- Online: rollback **wire types**, **`NetplayTransport`**, **`createMemoryNetplayPair`**, JSON **wire codec** + **browser WebSocket adapter** ([`netplayWireCodec.ts`](../src/features/arena/netplayWireCodec.ts), [`webSocketNetplayTransport.ts`](../src/features/arena/webSocketNetplayTransport.ts)); determinism notes in [`simDeterminism.ts`](../src/features/arena/simDeterminism.ts). Matchmaking / relay server still TBD.

---

## 4. Dependency graph (simplified)

```mermaid
flowchart TD
  M0[M0 Baseline + juice] --> M1[M1 Parity climax]
  M1 --> M2[M2 Combo cancel UI]
  M2 --> M3[M3 Roster supers]
  M1 --> M4[M4 Online]
  M3 --> D[Production art/VO]
```

---

## 5. Metrics (keep measuring)

- **Time-to-read** round rule & stance without scrolling log.
- **Parity check:** P2 can perform every P1 combat action the design promises (meter, climax, skills, block, dash).
- **Clarity under juice:** whiff vs hit reasons stay correct with juice on.
- **Reset friction:** rematch ≤ one clear intent (R / Esc / Enter).
- **Regression guard:** `npm run test` (Vitest) — netplay memory pair, netplay JSON codec, relay downlink parser, lockstep + replay, climax sting resolver, climax log parse.

---

## 6. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Juice hides reads | Single tuning surface; reduced motion; cap zoom/shake |
| Scope creep (air/online) | Gate M4 on M1–M2 sign-off |
| AI feels “cheap” with climax | Same meter rules as human; noisy / lane-based use |

---

## 7. Implementation backlog (executable checklist)

| ID | Milestone | Deliverable | Owner / area | Status |
|----|-----------|-------------|--------------|--------|
| BP-01 | M0 | Core sim, modifiers, HUD, persistence | `arenaActions`, `initialArenaState` | Done |
| BP-02 | M0 | Phase 1 juice (hitstop, shake, KO, announcer) | `combatJuiceConfig`, `useCombatFeedback` | Done |
| BP-03 | M1 | Per-fighter climax + P2 input + dummy | `climaxMeterConfig`, `FighterPanel`, `arenaDummyAi` | Done |
| BP-04 | M2 | Combo display (log + clock) | `useComboChainDisplay`, `ComboChainToast` | Done |
| BP-05 | M2 | Cancel link window + UI rings | `cancelWindowUntilMs`, `SkillBar` | Done |
| BP-06 | M2+ | Per-roster cancel **link** highlights | `cancelRouteConfig.ts`, SkillBar, FighterPanel | Done (UI) |
| BP-07 | M3 | Faction + optional card climax + meter economy | `climaxStrikeProfile`, `climaxMeterConfig`, `classData`, `arenaActions` | Done (prototype) |
| BP-08 | M4 | Rollback spec + `NetplayTransport` + memory pair + JSON codec + WS adapter | `onlineNetplayStub.ts`, `netplayWireCodec.ts`, `webSocketNetplayTransport.ts` | POC + wire |
| BP-09 | D | Sprite / VO pipeline decision | **§9** below; `public/` audio | Recorded |
| BP-10 | M2+ | Sim combo damage scaling | `comboChainConfig`, `FighterState.comboChainDepth` | Done |
| BP-11 | M3 | Committed damage-ability whiff + meter | `arenaActions`, `climaxMeterConfig` | Done |
| BP-12 | M3 | Full roster `climaxOverride` + link-route coverage | `classData.ts`, `cancelRouteConfig.ts` | Done |
| BP-13 | M4 | Combat-path determinism (log ids + dummy PRNG) | `simDeterminism.ts`, `arenaActions`, `arenaDummyAi`, `arenaResources` | Done |
| BP-14 | D / W3 | Canvas 2D combat readout (BP-09 phase 1) | `ArenaCombatCanvas`, `arenaCanvasConfig`, `ArenaStage` | Done |
| BP-15 | D / §9 | Faction + **card** climax stinger (`resolveClimaxStinger`) + log hook | `climaxStingerConfig`, `combatAudio`, `useCombatSounds`, `combatLogParse` | Done |
| BP-16 | — | Vitest harness for arena **pure** modules | `vitest.config.ts`, `*.test.ts`, `npm run test` | Done |
| BP-17 | — | **CI** — test + lint + build on push/PR | `.github/workflows/ci.yml` | Done |
| BP-18 | M4 | **Netplay wire codec** (parse/stringify, Vitest) | `netplayWireCodec.ts` | Done |
| BP-19 | M4 | **`createWebSocketNetplayTransport`** (browser) | `webSocketNetplayTransport.ts` | Done |
| BP-20 | D / W3 | **Optional atlas** under canvas fighters (`url: null` = pillars) | `arenaCombatSpriteConfig.ts`, `ArenaCombatCanvas.tsx` | Done |
| BP-21 | D / §9 | **`sampleUrl`** on climax rows → HTMLAudio with procedural fallback | `climaxStingerConfig.ts`, `combatAudio.ts` | Done (hook) |
| BP-22 | M4 / W5 | **Lockstep bridge** — `ArenaInputFrame` edges + `TICK`, slice merge, `compactArenaChecksum` | `arenaNetplayLockstep.ts` | Done (sim hook) |
| BP-23 | M4 / W5 | **`replayInputConfirmMessages`** + **`peerAdvanceFromArena`** (wire → sim → checksum) | `arenaNetplayLockstep.ts` | Done |
| BP-24 | M4 / W5 | **Dev lockstep page** — fixed tick + memory transport + `ArenaStage` | `useArenaLockstepHotSeatDev.ts`, `app/dev/netplay-lockstep/page.tsx` | Done |
| BP-25 | M4 | **`npm run relay`** + `NEXT_PUBLIC_NETPLAY_RELAY_URL` + **Online (relay)** mode in main arena | `scripts/netplay-relay.mjs`, `useArenaEngine.ts`, `NETPLAY_LOCKSTEP_FRAME` | Done (prototype) |
| BP-26 | M4 | **Relay downlink parser** — typed `hello` / `frame_tick` + codec delegation + Vitest | `netplayRelayClientMessages.ts` | Done |
| BP-27 | Design / M2 | **Round-start readability cues** — coaching copy + longer toast + SR announcement | `arenaReadabilityHints.ts`, `RoundStartOverlay.tsx` | Done |
| BP-28 | Design / M2 | **Round-resolve causality recap** — log-derived one-liner after KO (Climax / clean / chip) + SR | `arenaRoundRecap.ts`, `ArenaScreen` match banner | Done |
| BP-29 | Design / M2 | **Hot-seat P2 parity cue** — default P2 bindings on round-start toast + SR narration; longer toast in `local_human` | `arenaReadabilityHints.ts`, `RoundStartOverlay`, `useRoundStartAnnouncement` | Done |
| BP-30 | Design / M2 | **Next-match rule preview** — after KO, show upcoming `matchOrdinal + 1` modifier + coaching before reset (Rhythm / T1 reinforcement) | `nextMatchRulePreview`, `ArenaScreen` match banner | Done |
| BP-31 | Design / M2 | **Primary Rematch CTA + focus** — winner state: full-width Rematch button, auto-focus on round end, R/Esc/Enter parity text (T4) | `ArenaScreen` match banner | Done |
| BP-32 | Design / M2 | **Live last-exchange readout** — during rounds, HUD strip parses log tail for clean / blocked / whiff / Climax (T3 honesty) | `arenaLiveExchangeReadout.ts`, `LiveExchangeReadout.tsx` | Done |
| BP-33 | Design / M2 | **Round HP exchange totals** — post-KO numeric P1/P2 dealt & taken from sim counters (complements BP-28) | `arenaRoundHpTotals.ts`, match banner | Done |
| BP-34 | Design / M2 | **Climax → hit chain readout** — live strip shows `Climax → clean/chip` when log order matches (T3 refinement on BP-32) | `arenaLiveExchangeReadout.ts`, `LiveExchangeReadout.tsx` | Done |
| BP-35 | Design / M2 | **Active combo depth HUD** — when either fighter has chain depth ≥1, show P1/P2 × depth from sim (Expression pillar; complements toast) | `comboDepthReadout.ts`, `ComboDepthReadout.tsx` | Done |
| BP-36 | Design / M2 | **Stance ribbon** — glanceable P1/P2 stance labels + SR hints near the fight (Clarity / spacing reads) | `stanceRibbonReadout.ts`, `StanceRibbonReadout.tsx` | Done |
| BP-37 | A11y / M2 | **`prefers-reduced-motion` — card & float FX** — disable damage float, caption pop, attack pulse, evolution overlays anim; keep static/readable feedback | `globals.css` | Done |
| BP-38 | Design / QA | **Playtest rubric in-app** — T1–T4 + anti-goals from §15.3 in a collapsible panel (`playtestRubric.ts`); **T5** + growth anti-goal added with **BP-45** | `PlaytestRubricPanel.tsx`, `ArenaScreen` | Done |
| BP-39 | M4 / Trust | **Netplay trust readout** — relay strip shows lockstep **sim frame**, **tick ms**, and local **`compactArenaChecksum`** (Pδ prep: honest “sim is advancing” + screenshot-compare hook) | `netplayTrustReadout.ts`, `NetplayRelayStrip.tsx`, `useArenaEngine` | Done |
| BP-40 | M4 / Trust | **Confirm backlog counter** — relay strip shows how many **`input_confirm`** rows wait for the next sequential frame (out-of-order / catch-up visibility; complements BP-39) | `netplayTrustReadout.ts`, `useArenaEngine` | Done |
| BP-41 | Design / PvP | **Session first-to (FT) scoreboard** — locals-style **first to 3** running games for P1 vs P2 (local + relay); match-point / sudden-death copy; resets on roster or mode change | `arenaSessionScore.ts`, `MatchHud`, `useArenaEngine` | Done |
| BP-42 | Design / PvP | **Session set lock + next set** — after first-to is reached, **no further session inflations** until **Next set**; violet **set complete** line + `startNextSessionSet` (round sim unchanged) | `arenaSessionScore.ts`, `MatchHud`, `useArenaEngine` | Done |
| BP-43 | Design / PvP | **Set-win callout in match banner** — when the KO **also** wins the first-to session, violet line under round recap (**BP-28** stack); `matchBannerSessionSetVictoryLine`; exhibition KOs after lock stay recap-only | `arenaSessionScore.ts`, `ArenaScreen` | Done |
| BP-44 | Design / PvP / T2 | **P2 session parity strip** — compact **first-to** + score + match point / decider / set-lock near fighter cards (`p2SessionChipSummary`) so hot-seat P2 doesn’t rely on header alone | `P2SessionParityStrip.tsx`, `arenaSessionScore.ts`, `ArenaScreen` | Done |
| BP-45 | Design / Growth | **Upgrade path panel + T5 rubric** — collapsible **GrowthUpgradePanel** (level, W/L, wins-to-next tier, stat bonuses, resources); **T5** growth legibility + anti-goal for opaque upgrade (`playtestRubric.ts`) | `arenaGrowthReadout.ts`, `GrowthUpgradePanel.tsx`, `ArenaScreen` | Done |
| BP-46 | Design / Growth / Trust | **Stream F ledger + identity + spend preview + T6** — `lastBoutLedger` resource honesty; unified identity + reputation in panel; `arenaSpendReadout` costs; relay **peer_meta** / **peer_checksum** / **ping** → RTT + peer career + checksum match on **NetplayRelayStrip** | `arenaActions`, `GrowthUpgradePanel`, `netplay-relay.mjs`, `useArenaEngine`, `netplayTrustReadout.ts` | Done |
| BP-47 | Design / Expression / Trust | **Planned-upgrade slice** — desync **recovery callout** + assertive **aria-live** on relay; optional **`?netplayLabel=`** → `peer_ledger.displayLabel`; **cancel link ms** readout on **SkillBar**; **playtest worksheet** clipboard; **profile damage totals** in growth panel | `NetplayRelayStrip`, `SkillBar`, `PlaytestRubricPanel`, `playtestRubricClipboard.ts`, `GrowthUpgradePanel` | Done |

## 8. Next waves (rolling)

| Wave | Focus | Exit criteria |
|------|--------|----------------|
| **W1** | Ground clarity + hot-seat parity | P1/P2 same meters, link read, no regressions in log |
| **W2** | Expression data | Cancel highlights + card climaxes + scaling + economy tunable in config |
| **W3** | Production bet | Canvas layer **shipped** (`BP-14`); first **Aseprite atlas** hooked to same X mapping |
| **W4** | Online bet | Memory pair + **JSON codec tests**; **`createWebSocketNetplayTransport`** for relay wiring |
| **W5** | Integration | **BP-22–25** relay lockstep on `remote`; next: rollback, latency hide, production relay auth |

## 9. Production / sprite pipeline (BP-09)

**Decision (prototype → first ship):**

1. **Characters** — 2D **raster** assets: keyed PNG sequences or texture atlases exported from **Aseprite** (or equivalent). One “combat silhouette” scale target so hit readability matches current UI lane.
2. **Runtime** — phase 1: [`ArenaCombatCanvas.tsx`](../src/components/arena/ArenaCombatCanvas.tsx) + [`arenaCanvasConfig.ts`](../src/features/arena/arenaCanvasConfig.ts) (lane + pillar readout under HTML fighters; toggle `ARENA_COMBAT_CANVAS_ENABLED`). Defer **Pixi/Three** until atlas count justifies it.
3. **VO / SFX** — **`resolveClimaxStinger(fighterId, faction)`** on `… unleashes …!` lines (`climaxStingerConfig.ts`); optional **`sampleUrl`** per card (e.g. `public/audio/climax/*.ogg`) with **HTMLAudio** + procedural fallback in `combatAudio.ts`.
4. **Out of scope for now** — Spine/DragonBones licensing, full story mode cinematics.

## 10. Revision

Update this file when a **milestone** status changes; keep `FIGHTING_GAME_ROADMAP.md` and `futureUpgrades.ts` aligned with what players can actually do in build.

## 11. Overall upgrade map (single page)

```mermaid
flowchart LR
  subgraph done [Shipped prototype]
    M0[M0 baseline + juice]
    M1[M1 climax parity]
    M2[M2 combo / cancel UI]
    M3[M3 roster supers + economy]
  end
  subgraph now [Current tranche]
    CI[BP-17 CI]
    Wire[BP-18/19 netplay wire + WS]
    Art[BP-20/21 atlas + sampleUrl]
    Lock[BP-22–24 lockstep + dev UI]
  end
  subgraph next [Next bets]
    Loop[Rollback + latency + auth]
    VO[Fill public/audio climax]
    Atlas[Drop atlas PNG + set URL]
  end
  done --> now
  now --> next
```

**Execution order for “full upgrade”:** keep **W1–W2** regressions at zero → land **CI (BP-17)** → extend **online wire (BP-18/19)** until a relay can exchange `input_confirm` slices → **`replayInputConfirmMessages`** + **`peerAdvanceFromArena`** for desync probes → **`npm run relay`** + **`NEXT_PUBLIC_NETPLAY_RELAY_URL`** + **Online (relay)** on the main arena (**BP-25**) → drop **OGG** for `sampleUrl` rows → set **`ARENA_COMBAT_SPRITE_ATLAS.url`** when art exists → only then expand **M4** rollback depth or **air/lane** experiments.

## 12. Big plan — at a glance

1. **Combat readability** — hot-seat parity, log discipline, juice caps (`M0–M2`, streams A/B); round start (**BP-27** + **BP-29** P2 strip) + **P2 session chip** (**BP-44**) + round-over recap (**BP-28**) + **post-round HP totals** (**BP-33**) + **next rule preview** (**BP-30**) + **Rematch CTA** (**BP-31**) + **live exchange readout** (**BP-32** + **BP-34**) + **combo depth HUD** (**BP-35**) + **stance ribbon** (**BP-36**) + **reduced-motion card FX** (**BP-37**) + **session FT score** (**BP-41**) + **set lock / next set** (**BP-42**) + **set-win banner** (**BP-43**).  
2. **Persistent upgrade (core hook)** — stream **F**: wins → **level** + bonuses (`fighterProgress`); **resources** + between-round spend (`arenaSpend`, `MatchHud`); **reputation** / identity; all **legible** (§15.1 promise + pillar 6).  
3. **Expression** — combos, cancels, climax economy, roster data (`M3`, stream C).  
4. **Production** — canvas layer, optional atlas URL, optional `sampleUrl` VO (`BP-09`, §9, `BP-14/20/21`).  
5. **Online** — types + memory pair + JSON codec + WebSocket adapter + lockstep replay + checksum (`BP-08/18/19/22/23`); relay HUD **BP-39/40** (frame + checksum + confirm backlog).  
6. **Quality bar** — Vitest + GitHub Actions CI (`BP-16/17`).  
7. **Next major code bet** — rollback + input prediction + **peer checksum compare** + mismatch recovery (beyond lockstep confirm queue; **BP-39** surfaces local frame + checksum; **BP-40** surfaces confirm backlog size).

## 13. Phases (rollup)

| Phase | Scope | Status |
|-------|--------|--------|
| **Pα** | M0–M3 combat readability + expression + CI | Shipped in prototype |
| **Pβ** | Netplay types → wire codec → lockstep → replay → dev page → **relay + `remote`** (BP-08–26) | Shipped (relay prototype) |
| **Pγ** | Production art: `public/audio`, atlas URL, VO polish | Partial hooks only |
| **Pδ** | Rollback netcode, relay auth/rooms, desync UX | **BP-39/40** trust strip (frame + checksum + **confirm backlog**); peer compare TBD |

**Rule of thumb:** finish **Pγ** art hooks that touch shipped UX, then invest in **Pδ** only if competitive online is a product bet.

## 15. Design north star (professional)

This section is the **game-design contract**: what players should *feel* and *understand*, independent of implementation tickets.

### 15.1 Player promises

| Promise | Design meaning | Shipped signal |
|---------|----------------|----------------|
| **Same rules, both sides** | No “PvE rules” that break in PvP | Hot-seat + dummy + relay use one reducer path |
| **I can read why I lost** | Causality beats spectacle | Combat log, hitstop tiers, round start (**BP-27**) + recap (**BP-28**) + **HP totals** (**BP-33**) |
| **Expression is fair** | Depth without arcane knowledge | Combo toast, cancel rings, meter/climax clarity, **BP-35** chain depth HUD |
| **Juice supports reads** | FX never replaces information | `combatJuiceConfig` caps + **BP-37** card/float evolution CSS under `prefers-reduced-motion` (+ existing arena/KO/toast rules) |
| **I keep upgrading** | Growth is the product hook — skill *and* persistent progression | Wins → **level** + stat bumps (`fighterProgress`); **resources** + spend between rounds (`arenaSpend`); **reputation** / profile (`fighterReputation`, `fighterIdentity`) |

### 15.2 Design pillars (priority order)

1. **Clarity** — range, stance, round modifier, resource tempo (**BP-36** surfaces stance beside the arena). If a new feature hides these, it ships behind a toggle or not at all.  
2. **Parity** — P2 and P1 must be able to run the same mental model (mirror HUD affordances where possible).  
3. **Fantasy** — roster voice through climax names, stingers, future VO/art — *after* clarity holds in playtests.  
4. **Rhythm** — match modifiers intentionally reshape risk (`MATCH_MODIFIER_CYCLE`); players should *feel* the shift in tempo, not discover it only in the log (**BP-30** surfaces the *next* rule at round end).  
5. **Trust** — online: deterministic sim + visible desync strategy (future); local: obvious reset/rematch (**BP-27** hot-seat line).  
6. **Growth (persistent upgrade)** — the **return loop** must stay **readable**: where levels/resources came from, what the next spend does, and that PvP rules stay symmetric. Hide power in opaque RNG and the core hook breaks.

### 15.3 Playtest rubric (qualitative, repeatable)

Use in **5–10 minute** sessions; pass = 3/4 players agree.

- **T1 — Rule read:** After the round-start toast, can the player state *one* risk change for this modifier without scrolling the log?  
- **T2 — Parity:** P2 describes how climax and skills work for *their* side without asking P1 (on-screen: **BP-29** round-start P2 strip + keyboard reference).  
- **T3 — Juice honesty:** With combat FX on, players still correctly identify whiff vs blocked vs hit *reason* (not only damage number) — **BP-32** live strip + **BP-34** Climax→hit chain + combat log highlights.  
- **T4 — Reset friction:** Rematch in ≤1 intentional action after round resolve (on-screen: **BP-31** Rematch button + focus; keys unchanged).  
- **T5 — Growth legibility:** After a couple of matches, can the player name what leveled up or which resource they’re saving — without guessing? (**BP-45** panel surfaces stream F.)
- **T6 — Meta & online honesty:** Can they repeat what each between-round spend costs and does, and (in relay) what the netplay strip says about peer career / checksum / latency — without treating it as hidden power? (**BP-46**.)

### 15.4 Anti-goals (design debt traps)

- Air lanes or advanced movement **before** ground neutral reads clean in T1–T3.  
- New characters **before** every `FighterId` climax/link teaching surface is honest in UI.  
- Netplay rollback **before** relay lockstep proves fun in **T2** (hot-seat excellence first).  
- **Selling “upgrade” without delivery** — if progression isn’t surfaced (HUD, log, spend panel), the core hook reads hollow; keep **stream F** honest in UI.

### 15.5 Engineering ↔ design mapping

- **Readability cues** → **BP-27** (`arenaReadabilityHints`, `RoundStartOverlay`).  
- **Hot-seat parity (T2)** → **BP-29** (P2 bindings on round-start toast + `hotSeatP2ControlsSrNarration`) + **BP-44** (`P2SessionParityStrip` — session score at card row).  
- **Post-KO causality (T3)** → **BP-28** (`arenaRoundRecap`, match banner recap line).  
- **Modifier fantasy / rhythm** → `matchModifiers` + log lines + BP-27 lead/coaching + **BP-30** next-rule preview after KO.  
- **Online trust** → BP-25/26 + **BP-39** + **BP-40** + **BP-46** (`netplayTrustReadout` — lockstep frame + tick + checksum + **pending `input_confirm` backlog** + peer career / RTT / peer checksum compare on relay strip) + future Pδ recovery UX.  
- **Reset friction (T4)** → **BP-31** (Rematch button + focus in match banner).  
- **Mid-round causality (T3)** → **BP-32** + **BP-34** (`lastLiveExchangeReadout` — includes Climax→damage chain when the log order matches).  
- **Post-round numbers** → **BP-33** (`roundHpExchangeTotals` — P1/P2 dealt & taken from `matchPlayerDamage*`).  
- **Expression / combo clarity** → **BP-35** (`activeComboDepthSummary`, next to live exchange strip).  
- **Stance clarity** → **BP-36** (`stanceRibbonCopy`, beside live exchange strip).  
- **Motion accessibility** → **BP-37** (`globals.css` — card damage float, evolution flashes, attack pulse).  
- **Playtest discipline** → **BP-38** + **BP-45** + **BP-46** (`playtestRubric.ts` T1–T6 + `GrowthUpgradePanel` — growth legibility + meta/online honesty).  
- **Competitive session clarity (locals)** → **BP-41** + **BP-42** (`arenaSessionScore.ts` — first-to-N, match point, **set complete lock**, **Next set** button in `MatchHud`).  
- **Set win at KO (banner)** → **BP-43** (`matchBannerSessionSetVictoryLine` — same moment as round recap when the round decided the set).  
- **Persistent upgrade / growth** → **stream F** (`fighterProgress`, `arenaResources`, `arenaSpend`, `MatchHud` meta, `fighterReputation`).
