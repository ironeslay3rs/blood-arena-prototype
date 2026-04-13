# Blood Arena (prototype)

[![CI](https://github.com/ironeslay3rs/blood-arena-prototype/actions/workflows/ci.yml/badge.svg)](https://github.com/ironeslay3rs/blood-arena-prototype/actions/workflows/ci.yml)

Browser-first **fighting game prototype**: hot-seat PvP by default, shared
rules for training vs AI and relay netplay. The design contract (pillars,
playtest rubric, backlog) lives in the docs below, not in this README alone.

## North star

- **Lore with consequence:** the roster, factions, and progression framing pull
  from **Evolution: Void Wars: Oblivion**, so Blood Arena reads like a world
  with history instead of a detached sparring toy.
- **Keep upgrading yourself (core hook):** wins feed **level** and stats;
  **resources** feed between-round choices, and progression stays **visible** in
  the HUD and log, not mystery loot (see
  [`docs/BLOOD_ARENA_MASTER_PLAN.md`](docs/BLOOD_ARENA_MASTER_PLAN.md) section 1
  and section 15).
- **Readable before flashy:** spacing, stance, round modifiers, and meter tempo
  stay obvious; combat juice is tunable and respects reduced motion where
  implemented.
- **Fair PvP:** same systems for both sides; depth comes from reads and
  execution, not hidden rules.
- **Honest feedback:** HUD strips, combat log highlights, and post-round
  summaries tie back to the simulation and log, not cosmetic-only win
  messaging.
- **Long-term aim:** a **PvP-first** fighter that earns a place next to
  **Street Fighter / KOF-class** games on *fairness and expression* with
  **Blood Arena's own** roster, rules twist, and identity (see
  [`docs/BLOOD_ARENA_MASTER_PLAN.md`](docs/BLOOD_ARENA_MASTER_PLAN.md) section
  1).
- **Session sets (locals):** **first-to-3** score, match-point lines
  (**BP-41**); after someone hits N, the session **locks** until **Next set**
  (**BP-42**); set-winning KOs also get a **violet line in the match banner**
  (**BP-43**); **P2-facing session strip** by the fighter cards (**BP-44**);
  rounds still run for lab / grudge matches.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/PROJECT_MEMORY.md](docs/PROJECT_MEMORY.md) | **Living handoff** — append last session, next plan, env snapshot (update after each work slice) |
| [lore-canon/](lore-canon/) | **Series bible** (books, factions, Black Market lanes) — narrative source; game implements slices in code + [`docs/VOIDWARS_LORE_IMPLEMENTATION.md`](docs/VOIDWARS_LORE_IMPLEMENTATION.md) |
| [docs/BLOOD_ARENA_MASTER_PLAN.md](docs/BLOOD_ARENA_MASTER_PLAN.md) | Milestones, backlog (BP-##), dependencies, section 15 design north star (including **T5** growth rubric and **BP-45** upgrade panel) |
| [docs/FIGHTING_GAME_ROADMAP.md](docs/FIGHTING_GAME_ROADMAP.md) | Tactical shipped list and code anchors |
| [docs/VOIDWARS_LORE_IMPLEMENTATION.md](docs/VOIDWARS_LORE_IMPLEMENTATION.md) | Canon/lore positioning: how Blood Arena uses Evolution: Void Wars: Oblivion for factions, roster identity, and upgrade framing |
| [STUDIO.md](STUDIO.md) | Studio lane and vault pointers |

In-app: **Future upgrades (fighting-game roadmap)** panel on the main arena
page mirrors [`src/features/arena/futureUpgrades.ts`](src/features/arena/futureUpgrades.ts).

## Scripts

```bash
npm run dev          # Next.js dev server -> http://localhost:3000
npm run build        # Production build
npm run start        # Run production server (after build)
npm run lint         # ESLint (cached; see .eslintcache in .gitignore)
npm run test         # Vitest (arena pure modules + netplay helpers)
npm run typecheck    # TypeScript (tsc --noEmit)
npm run verify       # lint + typecheck + test + build — same as CI
npm run relay        # Local WebSocket relay for Online (relay) mode (default port 8765)
```

## Environment (optional)

Copy [`.env.example`](.env.example) to `.env.local` when testing
**Online (relay)**:

- `NEXT_PUBLIC_NETPLAY_RELAY_URL` - for example `ws://127.0.0.1:8765` (must
  match `npm run relay`).
- `NETPLAY_RELAY_PORT` - relay listen port (used by `scripts/netplay-relay.mjs`;
  default `8765`).

Open a second browser tab with `?netplaySlot=1` for Player 2 when using relay
lockstep.

## Stack

Next.js (App Router), React 19, Tailwind CSS v4, Vitest. No database; arena
state is in-memory with local persistence hooks where documented in code.

## Deployment (Vercel + GitHub)

This repo is set up so **GitHub Actions** is the quality gate and **Vercel** can
host previews and production from the same Git history.

**Production (live):** [blood-arena-prototype.vercel.app](https://blood-arena-prototype.vercel.app) — deploys from **`main`** via the linked GitHub integration (and matches [`vercel.json`](vercel.json): `npm ci`, `npm run build`).

1. **Vercel project** — Linked to this repo (`blood-arena-prototype` under team
   `ironeslay3rs-projects`). New setup: [Import Git Repository](https://vercel.com/new)
   → pick **GitHub** → select `ironeslay3rs/blood-arena-prototype`. Vercel will
   detect Next.js and use [`vercel.json`](vercel.json) (`npm ci` + `npm run
   build`, Node **≥22** via [`package.json`](package.json) `engines`).
2. **Branch mapping** — Production deploys from **`main`** or **`master`**
   (whichever you use); every **pull request** gets a **Preview Deployment**
   URL (Vercel comments on the PR when the build finishes).
3. **Environment variables** — Add `NEXT_PUBLIC_*` and relay-related vars in the
   Vercel project under **Settings → Environment Variables**, scoped to
   **Production** / **Preview** as needed. Keep local-only values in
   [`.env.example`](.env.example); do not commit secrets.
4. **CI before merge** — In GitHub: **Settings → Rules → Rulesets** (or branch
   protection) require the **CI** workflow to pass before merging, so broken
   builds do not reach `main` / Vercel production.

Manual re-runs: **Actions → CI → Run workflow** (`workflow_dispatch`).

## Original template

Bootstrapped with
[create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app);
upstream Next.js marketing sections were replaced by this project-specific
README.
