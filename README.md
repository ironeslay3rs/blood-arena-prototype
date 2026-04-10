# Blood Arena (prototype)

Browser-first **fighting game prototype**: hot-seat PvP by default, shared rules for training vs AI and relay netplay. The design contract (pillars, playtest rubric, backlog) lives in the docs below—not in this README alone.

## North star

- **Keep upgrading yourself (core hook):** wins feed **level** and stats; **resources** feed between-round choices—progression stays **visible** in the HUD and log, not mystery loot (see [`docs/BLOOD_ARENA_MASTER_PLAN.md`](docs/BLOOD_ARENA_MASTER_PLAN.md) §1 + §15).
- **Readable before flashy:** spacing, stance, round modifiers, and meter tempo stay obvious; combat juice is tunable and respects reduced motion where implemented.
- **Fair PvP:** same systems for both sides; depth comes from reads and execution, not hidden rules.
- **Honest feedback:** HUD strips, combat log highlights, and post-round summaries tie back to the simulation and log—no cosmetic-only “win” messaging.
- **Long-term aim:** a **PvP-first** fighter that earns a place next to **Street Fighter / KOF–class** games on *fairness and expression* — with **Blood Arena’s own** roster, rules twist, and identity (see [`docs/BLOOD_ARENA_MASTER_PLAN.md`](docs/BLOOD_ARENA_MASTER_PLAN.md) §1).
- **Session sets (locals):** **first-to-3** score, match-point lines (**BP-41**); after someone hits N, the session **locks** until **Next set** (**BP-42**); set-winning KOs also get a **violet line in the match banner** (**BP-43**); **P2-facing session strip** by the fighter cards (**BP-44**); rounds still run for lab / grudge matches.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/BLOOD_ARENA_MASTER_PLAN.md](docs/BLOOD_ARENA_MASTER_PLAN.md) | Milestones, backlog (BP-##), dependencies, §15 design north star (incl. **T5** growth rubric, **BP-45** upgrade panel) |
| [docs/FIGHTING_GAME_ROADMAP.md](docs/FIGHTING_GAME_ROADMAP.md) | Tactical shipped list and code anchors |
| [STUDIO.md](STUDIO.md) | Studio lane and vault pointers |

In-app: **Future upgrades (fighting-game roadmap)** panel on the main arena page mirrors [`src/features/arena/futureUpgrades.ts`](src/features/arena/futureUpgrades.ts).

## Scripts

```bash
npm run dev          # Next.js dev server → http://localhost:3000
npm run build        # Production build
npm run start        # Run production server (after build)
npm run lint         # ESLint
npm run test         # Vitest (arena pure modules + netplay helpers)
npm run relay        # Local WebSocket relay for Online (relay) mode (default port 8765)
```

## Environment (optional)

Copy [`.env.example`](.env.example) to `.env.local` when testing **Online (relay)**:

- `NEXT_PUBLIC_NETPLAY_RELAY_URL` — e.g. `ws://127.0.0.1:8765` (must match `npm run relay`).
- `NETPLAY_RELAY_PORT` — relay listen port (used by `scripts/netplay-relay.mjs`; default `8765`).

Open a second browser tab with `?netplaySlot=1` for Player 2 when using relay lockstep.

## Stack

Next.js (App Router), React 19, Tailwind CSS v4, Vitest. No database; arena state is in-memory with local persistence hooks where documented in code.

## Original template

Bootstrapped with [create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app); upstream Next.js marketing sections were replaced by this project-specific README.
