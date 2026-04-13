# Project memory — living handoff

**Purpose:** One place to **append** what shipped, what’s next, and loose technical context so any session (human or AI) can pick up fast. **Update this file** when you finish a slice of work or reprioritize.

**Canonical references (don’t duplicate in full):**

- Design contract + backlog table: [`BLOOD_ARENA_MASTER_PLAN.md`](./BLOOD_ARENA_MASTER_PLAN.md)
- Shipped tactical list: [`FIGHTING_GAME_ROADMAP.md`](./FIGHTING_GAME_ROADMAP.md)
- In-app upgrade catalog: [`../src/features/arena/futureUpgrades.ts`](../src/features/arena/futureUpgrades.ts)
- **Series lore vault (books + master canon):** [`../lore-canon/`](../lore-canon/) — Obsidian notes; code implements slices via `arenaLoreCodex.ts` / `canonCharacters.ts`

---

## How to update (quick)

1. Under **Last session**, add date + 3–8 bullets (what changed, PR/commit if useful).
2. Adjust **Next plan** to match reality (move done items out; add new intent).
3. Touch **Environment / commands** only when scripts, env vars, or relay behavior changes.

---

## Current focus (one line)

*Replace with the active goal, e.g. “Harden netplay UX” or “BP-48 feature X”.*

→ *(empty — set on next session)*

---

## Next plan (priority order)

*Edit this list freely. Keep it short; details live in master plan or issues.*

1. *(example)* Bump Next.js to ≥16.2.3 (npm audit GHSA-q4gf-8mx6-v5v3).
2. *(example)* Resolve or document `useArenaEngine` `exhaustive-deps` warnings.
3. *(example)* Production netplay: out of scope until auth/rooms spec exists.

---

## Last session

### 2026-04-04

- **Docs:** Linked **`lore-canon/`** in README, `VOIDWARS_LORE_IMPLEMENTATION.md` (vault as narrative source), and `PROJECT_MEMORY.md`; added Dependabot row + lore codex pointers in implementation map.
- **Workflow:** `verify` = lint → typecheck → test → build (README scripts updated); ESLint ignores `lore-canon/**`.
- **Vercel + GitHub:** [`vercel.json`](../vercel.json) (`npm ci` / `next` build), `package.json` **`engines.node` ≥22**, CI badge + README deployment section, PR template, **`workflow_dispatch`** on CI.
- **Game/lore:** Black Market **Wrath** lane framing surfaced in codex (`arenaLoreCodex.ts` / `LoreCodexPanel`).
- **Tests:** Fixed `arenaNetplayLockstep.test.ts` wire roundtrip typing (`parseNetplayControlMessage` union → narrow to `InputConfirmMessage`).

### 2026-04-06 — GitHub + Vercel integration

- **GitHub:** Default branch set to **`main`** via `gh repo edit` (was `cursor/rune-trials-arena-app`).
- **Vercel:** `vercel link` → project **`blood-arena-prototype`**, GitHub repo **connected**; CLI deploy validated build; production alias **https://blood-arena-prototype.vercel.app**
- **Repo:** Pushed **`main`** so Actions CI + Vercel Git deploys track the same commits as local.

### YYYY-MM-DD

- *What shipped*
- *What was deferred and why*
- *Follow-ups*

---

## Completed work log (append-only)

*Optional chronological log; trim only if it gets unwieldy, or archive old sections to a second file.*

| When       | Summary |
|-----------|---------|
| *(add rows as you go)* | |

---

## Environment / commands (snapshot)

*Refresh when workflow changes.*

| Item | Value |
|------|--------|
| Verify locally | `npm run verify` (= lint + typecheck + test + build, matches CI) |
| CI | `.github/workflows/ci.yml` — push/PR to `main` / `master`; **Run workflow** in Actions tab |
| Hosting | Production **https://blood-arena-prototype.vercel.app** — [`vercel.json`](../vercel.json) (`npm ci`); GitHub **default branch `main`** |
| Dependabot | `.github/dependabot.yml` — weekly npm updates |
| Relay | `npm run relay` — default `ws://127.0.0.1:8765` |
| Netplay env | See [`.env.example`](../.env.example), `NEXT_PUBLIC_NETPLAY_RELAY_URL` |
| P2 in relay | Second tab: `?netplaySlot=1`; optional `?netplayLabel=Name` |

---

## Implementation map (pointers)

*High-signal file paths — extend as features land.*

| Area | Where |
|------|--------|
| Lore codex + lane framing | `src/features/arena/arenaLoreCodex.ts`, `LoreCodexPanel.tsx` |
| Arena UI shell | `src/components/arena/ArenaScreen.tsx` |
| Combat reducer | `src/features/arena/arenaActions.ts` |
| Netplay hook | `src/features/arena/useArenaEngine.ts` |
| Relay script | `scripts/netplay-relay.mjs` |
| Relay wire parse | `src/features/arena/netplayRelayClientMessages.ts` |
| Growth / stream F panel | `src/components/arena/GrowthUpgradePanel.tsx` |
| Playtest rubric | `src/features/arena/playtestRubric.ts`, `PlaytestRubricPanel.tsx` |

---

## Prompt snippet for AI sessions

Copy-paste and fill brackets:

```text
Read docs/PROJECT_MEMORY.md (Current focus, Next plan, Last session).
Repo: blood-arena-prototype — Next.js app, arena combat in arenaActions/useArenaEngine.
Goal for this session: [ ]
Constraints: [ ]
After work: append Last session + update Next plan in PROJECT_MEMORY.md.
```
