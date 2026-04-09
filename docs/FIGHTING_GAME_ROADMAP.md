# Blood Arena — fighting-game upgrade roadmap

**Master plan:** [`BLOOD_ARENA_MASTER_PLAN.md`](./BLOOD_ARENA_MASTER_PLAN.md) (milestones, streams, dependencies).

**Audience:** design + engineering  
**North star:** PvP-first, **readable** exchanges, then **spectacle** that does not fight clarity.  
**Reference bar:** Street Fighter / The King of Fighters **feel** (weight, climax, character fantasy) — adapted to a **browser, hot-seat–first** prototype.

---

## Design pillars (locked)

| Pillar | Intent | Guardrail |
|--------|--------|-----------|
| **Readability** | Players parse range, stance, tempo, modifiers at a glance | No VFX that hides hurtboxes / timing |
| **Fair PvP** | Same systems for both humans; AI obeys kit rules | No pay-to-win combat knobs |
| **Spectacle (later)** | Hit weight, KO beats, supers — **after** clarity holds | Juice is tunable in one place (`combatJuiceConfig.ts`) |

**Deeper framing:** player promises, full pillar stack (Clarity → … → Trust), repeatable playtest rubric **T1–T4**, and anti-goals are in [`BLOOD_ARENA_MASTER_PLAN.md`](./BLOOD_ARENA_MASTER_PLAN.md) **§15**. Round-start coaching + SR: **BP-27**; hot-seat **T2** P2 key strip + narration: **BP-29**; round-over recap: **BP-28** (`arenaRoundRecap.ts`).

---

## Gap vs SF / KOF (honest)

- **We have:** spacing reads, stance tradeoffs, round rules, tempo, log discipline, light audio/haptics, **hitstop tiers**, **heavy screen shake / micro-chroma**, **announcer stingers** (clutch + streak), **12/12 card-unique Climax** lines + **faction climax stingers** (BP-15) + meter whiff/chip/ability-whiff tuning, **combo chain toast (×2+)** + **link highlights**, **sim combo damage scaling** on clean chains, **Canvas 2D combat readout** (BP-14 / §9 phase 1).  
- **We lack (for “epic”):** per-move cancel tables, air layer, production-scale animation/VO/stages.

**Strategy:** ship **Phase 1 juice** that multiplies feel without new mechanics depth (hitstop tiers, KO moment). Add **expression** (combos, air) only when simulation + UX can carry it.

---

## Phased delivery

### Phase 1 — Feel multiplier (low systemic risk)

- Hitstop / impact tiers on connect (light vs heavy / blocked) — **shipped** (see Shipped).  
- KO “beat” (short pause + sting — audio + UI) — **shipped**.  
- Screen juice: subtle shake / chroma on heavy — **shipped** (see Shipped); **off** when `prefers-reduced-motion`.  
- Announcer **stingers** (clutch + streak milestones; WebAudio) — **shipped** (see Shipped).  

**Success:** players describe exchanges as “weighty” without reading patch notes.

### Phase 2 — Expression (higher cost)

- **Combo / cancel** — **prototype shipped:** log chains + link window + **sim damage scaling** on clean chains; deeper cancel data **TBD**.  
- **Climax / super** slot — **shipped (prototype):** meter + faction-named climax + whiff/chip economy; P1 **C** + SkillBar; P2 **M** + card UI; dummy uses climax when full + in range; `superFreezeMs` / shake on connect.  
- Per-fighter **win quotes** / intro stingers (data-driven off roster).

**Success:** skill ceiling rises; spectating a hot-seat match is fun for a third viewer.

### Phase 3 — Scale (optional / product-dependent)

- **Air** or **lane variants** — only if camera + input + networking story is clear.  
- **Online** — input delay UX, rollback vs delay, re-sim.  
- **Production** — animated sprites, stages, VO packs.

---

## Metrics (prototype-friendly)

- **Time-to-read:** new player states what the **round rule** is without scrolling log (aligns with master plan **T1**; see **§15.3**).  
- **Reset friction:** rematch ≤ 1 intent (already: R / Esc / Enter) (**T4**).  
- **Clarity under juice:** with hitstop on, players still report **correct** whiff vs hit reasons in playtest prompts.

---

## Code anchors (repo)

| Artifact | Purpose |
|----------|---------|
| `src/features/arena/futureUpgrades.ts` | Typed catalog — single source for UI + planning |
| `src/features/arena/combatJuiceConfig.ts` | Tunable ms / intensity — wire UI/FX here |
| `src/components/arena/FutureUpgradesPanel.tsx` | In-app “what’s next” for team / playtesters |
| `src/components/arena/useKoBeatPresentation.ts` | KO moment hook |
| `src/components/arena/useCombatFeedback.ts` | Combat log–driven card/arena FX; hitstop stretches feedback timeline |
| `src/features/arena/announcerStingerConfig.ts` | Clutch threshold + streak milestone lines |
| `src/components/arena/useAnnouncerStingers.ts` | Clutch + streak stinger state |
| `src/components/arena/AnnouncerStingerToast.tsx` | Arena-layer announcer toast |
| `src/features/arena/arenaActions.ts` | Climax, meter economy, combo depth, damage application |
| `src/features/arena/climaxMeterConfig.ts` | Meter max, deal/taken, whiff, chip |
| `src/features/arena/climaxStrikeProfile.ts` | Faction climax damage + log names |
| `src/features/arena/cancelRouteConfig.ts` | Per-roster link highlight routes + P2 hint line |
| `src/features/arena/onlineNetplayStub.ts` | Rollback tick, `NetplayTransport`, `createMemoryNetplayPair` |
| `src/features/arena/simDeterminism.ts` | Remaining desync risks + helper index |
| `src/features/arena/arenaResources.ts` | `arenaDeterministic01` (dummy / lockstep) |
| `src/features/arena/arenaCanvasConfig.ts` | Canvas layer toggle (BP-09 phase 1) |
| `src/components/arena/ArenaCombatCanvas.tsx` | Canvas 2D lane + fighter pillars |
| `src/features/arena/climaxStingerConfig.ts` | Faction climax sting tones (WebAudio) |
| `src/features/arena/comboChainConfig.ts` | Combo gap, cancel-link ms, outgoing damage scaling |
| `src/components/arena/useComboChainDisplay.ts` | Log-derived ×2+ chains |
| `src/components/arena/ComboChainToast.tsx` | Arena combo pills |
| `docs/BLOOD_ARENA_MASTER_PLAN.md` | Milestones M0–M4, streams, backlog table |
| `src/features/arena/netplayWireCodec.ts` | JSON parse/stringify for `NetplayControlMessage` |
| `src/features/arena/webSocketNetplayTransport.ts` | `createWebSocketNetplayTransport(ws)` |
| `src/features/arena/arenaCombatSpriteConfig.ts` | Optional PNG atlas URL + frame rects |
| `src/features/arena/arenaNetplayLockstep.ts` | `arenaReducerNetplayRun`, `replayInputConfirmMessages`, `peerAdvanceFromArena`, checksum |
| `.github/workflows/ci.yml` | CI: test, lint, build |
| `src/app/dev/netplay-lockstep/page.tsx` | Dev lockstep HUD + `ArenaStage` (BP-24) |
| `src/features/arena/useArenaLockstepHotSeatDev.ts` | Fixed-tick `arenaReducerNetplayFrame` + wire send |
| `scripts/netplay-relay.mjs` | Two-peer relay; `npm run relay` |
| `src/features/arena/arenaNetplayStep.ts` | `applyNetplayLockstepFrame` (cycle-safe vs `arenaReducer`) |
| `src/features/arena/useArenaEngine.ts` | `remote` mode + `NETPLAY_LOCKSTEP_FRAME` + `remoteRelay` status |
| `src/features/arena/netplayRelayClientMessages.ts` | `parseRelayDownlink` (BP-26) |

## Verification

- **`npm run test`** — Vitest (`vitest.config.ts`): memory netplay pair, netplay wire codec, relay downlink parser, lockstep + replay, climax stinger resolve, combat log parse, and related arena unit tests.
- **`npm run lint`** and **`npm run build`** — keep green before tagging a roadmap milestone as shipped.

## Shipped (partial Phase 1)

- **Hitstop tiers** — On damage lines, `resolveHitstopMs` picks light vs heavy (`HITSTOP_HEAVY_DAMAGE_MIN`) plus blocked extra; feedback schedules extend by that duration; `#arena-combat` gets `.hitstop-hold` for a short brightness pulse. Disabled when `prefers-reduced-motion: reduce` (no timeline stretch, no CSS animation).
- **Heavy screen shake / chroma** — On heavy connects (same threshold as heavy hitstop), the arena viewport layer (not the skill row) runs `.arena-screen-shake` with duration/chroma from `COMBAT_JUICE` (`screenShakeOnHeavy` 0 disables). Disabled when `prefers-reduced-motion: reduce`.
- **Announcer stingers** — Clutch line when either fighter is ≤25% HP (once per `matchOrdinal`); streak lines + `stinger_streak` SFX at win-streak 3 / 5 / 10 after P1 wins; clutch uses `stinger_clutch`. Respects combat feedback toggle (no SFX when off). Toast: `AnnouncerStingerToast` over the arena layer.
- **KO beat** — When a round ends, the fight strip (`#arena-combat`) runs a short rose vignette pulse; duration = `COMBAT_JUICE.koBeatMs` (set `0` to disable). Optional **`arenaZoomOnKo`** (`1` = off) scales the strip during the beat. Respects `prefers-reduced-motion` (pulse and zoom suppressed).

## Shipped (expression slice)

- **Climax (both fighters)** — Meter builds on HP **dealt** (+20) and **taken** (+10); **basic whiff** (+4), **damage-ability whiff** (+3, committed), **guard chip** (+3 defender) from `climaxMeterConfig`. At **100**, card **`climaxOverride`** or faction default in `climaxStrikeProfile`. **P1:** **C** + SkillBar. **P2:** **M** / numpad **\***. **Dummy:** prefers Climax when full + in range. **`superFreezeMs`** + shake when the log matches `unleashes … Climax` (`useCombatFeedback`).

- **Combo / link (M2–M3)** — Log toast **×2+**; **link** rings on P1 and hint text on P2 follow [`cancelRouteConfig.ts`](./../src/features/arena/cancelRouteConfig.ts) per `FighterId`. **Sim scaling:** `comboOutgoingDamageMultiplier` + `comboChainDepth` (blocks / whiffs / taking HP clear offensive chain). Tune in [`comboChainConfig.ts`](./../src/features/arena/comboChainConfig.ts).

---

## Risks

- **Juice without readability** — cap shake/hitstop; test colorblind / motion settings.  
- **Scope creep** — “KOF air game” before **ground game** is juicy loses identity.  
- **Networking** — online stub stays stub until rollback plan exists.

---

## Revision

Update this doc when a Phase 1 item **ships** or is **cut**; keep `futureUpgrades.ts` in sync.
