# GSD — Get Shit Done

Working doc for **Blood Arena** → strike-fighter style PvP, powered by **Evolution: Voidwars** lore.  
Ship in **small vertical slices**. No scope creep in a single session.

---

## North star

- **Feel**: Competitive side-view arena fighter (read: *strike fighter* — readable hits, spacing, cooldowns, commitment).
- **Multiplayer**: Real humans in the same match (later — not in the current local prototype).
- **Lore**: **Evolution: Voidwars** book is canon reference for factions, tone, and character identity.
- **Roster v1**: **12 playable characters** at launch of that phase (design + data + kits — not all at once on day one).

---

## Where we are now (honest)

- [x] Local **1v1 vs training dummy** in browser (Next.js, TS, Tailwind).
- [x] Thin `page.tsx`, UI under `src/components/arena`, combat under `src/features/arena`.
- [x] **3** starter classes wired (Werewolf, Paladin, Silver Knight) — feel different, not balanced.
- [ ] Networking / accounts / persistence — **explicitly out** until a dedicated “online” milestone.
- [ ] **12 characters** — **not** implemented; next step is **data + design grid**, then add fighters in batches.

---

## Principles

1. **Fun before features** — Does combat feel good with one dummy? Fix that before netcode.
2. **Lore serves gameplay** — Every character needs a readable kit, then flavor text ties to Voidwars.
3. **One detail at a time** — Anim hit-stop, range clarity, UI feedback, sound hooks, etc. each get their own pass.
4. **No economy / permaloss / body loot** until a milestone says so (see prior scope lock).

---

## Milestones (rough order)

### M0 — Prototype polish (current lane)

- [ ] Hit feedback: clearer whiff vs connect (log, optional flash, damage number stub).
- [ ] Dummy behavior: idle / simple pattern / telegraph (pick **one**).
- [ ] Class readability: tooltips or HUD lines for “what this bar means.”
- [ ] Keyboard + mouse parity QA on all actions.

### M1 — Roster foundation (toward 12)

- [ ] **Character grid** doc: 12 names, role (assassin/bruiser/tank), resource fantasy, hook line from Voidwars.
- [ ] Extend `classData` pattern to **12 `ClassId`s** with placeholder stats (clone a template, tune later).
- [ ] In-arena **character select** (local) before spawn.

### M2 — PvP local

- [ ] Second human input device OR shared-keyboard **hot-seat** spar (ugly but proves 1v1 human).
- [ ] Win / reset / simple round flow.

### M3 — Online (later)

- [ ] Authoritative server or lockstep — **spike first**, then implement.
- [ ] Matchmaking / rooms — smallest viable (friend code or room id).

### M4 — Voidwars presentation

- [ ] Lore strings per character (from book beats, paraphrased where needed).
- [ ] Arena skins / UI chrome that match faction tone (after combat is solid).

---

## Next 5 micro-tasks (do these, in order)

1. Add `docs/voidwars-roster.md` **or** a “Roster” section below with **12 working names + one-line hook** (book-aligned).
2. Define **shared stat template** in code (`CharacterTemplate` + migrate Werewolf/Paladin/Silver Knight to it).
3. Pick **4th character** — implement full kit + bar labels (proves scaling to 12).
4. **Combat log** categories (move / attack / skill / system) for easier scanning.
5. **Win / loss** screen stub (same page, no new routes) — copy + rematch CTA.

---

## Session starter (copy-paste)

> Open `gsd.md`, check “Next 5 micro-tasks,” pick **one** box, implement, run `npm run lint` + `npm run build`, update this file checkboxes.

---

*Last aligned with repo: Blood Arena prototype (`src/features/arena`, `src/components/arena`).*
