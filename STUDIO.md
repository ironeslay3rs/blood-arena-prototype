# Blood Arena — studio lane

**Repo:** `blood-arena-prototype` — PvP / fighter identity (builds, records, profiles).

## Vault (canon & locked rules)

`C:\Users\irone\Evolution Void Wars Vault -for game studio\Evolution Void Wars Vault\03 Games\Blood Arena\`

- Core rules: `Locked Rules/Core Rules.md`
- Obsidian lane: `00 - Game Studio Lane.md` (if present)

## Sibling games (do not blend mechanics)

- [../black-market-survivor/STUDIO.md](../black-market-survivor/STUDIO.md) — Ash Run / survivor
- [../black-market-rune-trials/STUDIO.md](../black-market-rune-trials/STUDIO.md) — Rune Trials (card)
- [../webbrowsergame2/STUDIO.md](../webbrowsergame2/STUDIO.md) — old browser game

## Studio root

- [../../README.md](../../README.md) — Game Studio hub
- [../../WORKFLOW.md](../../WORKFLOW.md) — cross-game workflow
- `../../total pvp.txt` — design dump at studio level (optional reference)

## Prompts

Follow vault: `Evolution Void Wars Vault/99 Core Rules/04 - Prompt Formatting Rules.md`

## Fighting-game roadmap (this repo)

- [docs/BLOOD_ARENA_MASTER_PLAN.md](docs/BLOOD_ARENA_MASTER_PLAN.md) — milestones M0–M4, work streams, dependencies; **§15** design north star; **BP-27–29** readability (round start, P2 parity strip, round-over recap)  
- [docs/FIGHTING_GAME_ROADMAP.md](docs/FIGHTING_GAME_ROADMAP.md) — tactical shipped list, pillars, metrics  
- Dev: [app/dev/netplay-lockstep/page.tsx](app/dev/netplay-lockstep/page.tsx) — fixed-tick lockstep + memory `NetplayTransport` (BP-24); link at bottom of main arena  
- Online relay: `npm run relay` → `ws://127.0.0.1:8765` · set `NEXT_PUBLIC_NETPLAY_RELAY_URL=ws://127.0.0.1:8765` · main arena **Online (relay)** · P2 window: `?netplaySlot=1` (BP-25)  
- **Verify:** `npm run test` (Vitest — netplay pair, wire codec, relay downlink, lockstep + replay, stinger resolve, log parse) · `npm run lint` · `npm run build` · CI: `.github/workflows/ci.yml`
- Code: `src/features/arena/futureUpgrades.ts`, `combatJuiceConfig.ts`, `climaxMeterConfig.ts`, `climaxStrikeProfile.ts`, `climaxStingerConfig.ts`, `comboChainConfig.ts`, `cancelRouteConfig.ts`, `arenaCanvasConfig.ts`, `arenaCombatSpriteConfig.ts`, `arenaNetplayLockstep.ts`, `onlineNetplayStub.ts`, `netplayWireCodec.ts`, `netplayRelayClientMessages.ts`, `webSocketNetplayTransport.ts`, `simDeterminism.ts`, `FutureUpgradesPanel.tsx`, `useKoBeatPresentation.ts`, `useComboChainDisplay.ts`, `ArenaCombatCanvas.tsx`, `vitest.config.ts`
