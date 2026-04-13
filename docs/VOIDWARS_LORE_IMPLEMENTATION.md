# Blood Arena - Void Wars lore implementation

## Lore vault in this repo

The **series bible** (books, master canon, Black Market lanes, art bible) lives in
**`lore-canon/`** at the repository root (Obsidian-friendly markdown). It is the
**narrative source of truth**; the game code selectively implements slices (e.g.
faction pressure, roster↔canon mapping, **Wrath lane / Arena of Blood** placement).

When canon and code disagree, **update the vault first**, then align
`src/features/shared/canonCharacters.ts`, `arenaLoreCodex.ts`, and this doc.

## Positioning

Blood Arena is a Street Fighter / King of Fighters-inspired arena fighter, but
its identity should come from Evolution: Void Wars: Oblivion rather than from
genre imitation alone.

The combat contract stays classic and readable:

- committed buttons
- visible meter and tempo
- symmetrical PvP rules
- rounds that are easy to parse

The world contract comes from Void Wars:

- factions carry history into the pit
- fighters are arena variants of canon identities
- upgrades feel like salvage, vows, scars, telemetry, or reputation
- lore should explain why the arena exists and why these people keep coming back

## What is implemented in the prototype

- Canon identity data lives in `src/features/shared/canonCharacters.ts`.
- The playable roster already maps each fighter row to canon through
  `fighterDefinition.canonCharacterId`.
- Persistent growth already exists through career level, reputation, resources,
  between-round spends, and identity presentation.
- The in-app lore codex now surfaces:
  - world pillars
  - faction history and pressure
  - roster-to-canon mapping
  - upgrade framing tied to each fighter kit

## Lore pillars

### 1. History in the ring

The arena is not a disconnected training room. It is a pressure chamber where
existing faction conflict becomes public spectacle.

Every roster row should answer:

- which canon identity is fighting here
- what faction baggage they bring in with them
- what the crowd is really watching them prove

### 2. Upgrades with consequence

Progression should never read like random RPG loot.

When a player levels up or spends resources, the fiction should suggest:

- Bio: adaptation, strain control, dominance, pack standing
- Pure: vows, sanctified mastery, earned status, ritual endurance
- Mecha: calibration, vent discipline, telemetry gains, hardened systems
- Black City: salvage, leverage, graft tuning, dangerous edge

### 3. Readability first

Lore is there to sharpen identity, not to hide rules.

That means:

- story flavor cannot make the combat log dishonest
- persistent growth must stay legible in UI
- character fantasy must remain readable in motion and in the HUD

## Faction framing

### Bio

Containment failures, engineered strain lines, and pack hierarchy. Their arena
fantasy is body pressure and adaptation under stress.

### Pure

Oaths, doctrine, sanctum order, and judgment. Their arena fantasy is disciplined
survival, warding space, and proving moral authority through combat.

### Mecha

War hardware, telemetry culture, drills, and system optimization. Their arena
fantasy is controlled force, heat rhythm, and engineered advantage.

### Black City

Salvage economies, secret contracts, graft markets, and negotiated violence.
Their arena fantasy is instability weaponized for profit and survival.

## Implementation rules for future work

- Do not add a new fighter without a canon identity and a clear faction angle.
- Do not write lore that fights the combat read model.
- Do not describe upgrades as abstract numbers only; anchor them to fiction.
- Keep Blood Arena distinct from the book by making the arena itself a new
  proving ground, not a retelling of the novel.

## Good next narrative slices

- pre-fight rivalry lines keyed by selected roster pair
- stage flavor tied to faction ownership or sponsorship
- post-set announcer lines that react to reputation and streaks
- lore-aware matchup blurbs in character select once the full roster screen lands
- pull **short** epithets from other Black Market lanes (Gluttony, Envy, …) only
  when a new stage/mode needs them — keep UI copy tied to `lore-canon` headings
