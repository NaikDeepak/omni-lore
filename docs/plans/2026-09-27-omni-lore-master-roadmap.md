# OmniLore Master Implementation Plan: Missing Features & Next Steps

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform OmniLore from a prototype into an authentic, deeply populated, interactive visual lore explorer across One Piece, Demonic Emperor, and Coiling Dragon, featuring complete character rosters, interactive visual 2D faction network webs, head-to-head RPG battle simulations, and robust multi-universe ops.

**Architecture:** GitOps Jamstack on Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS. Projections strictly derived from normalized `CanonicalLoreGraph` entities, temporal facts, and relationships filtered at `userChapter` via `TemporalEngine`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide Icons, Vitest, SVG Pixel Art Engine.

**Spec:** `DESIGN.md` in repository root.

## Global Constraints

- **Strict Temporal Invariants:** No entity, fact, or relationship may leak future spoilers prior to `userChapter`.
- **Pixel Art Purity:** All avatars, faction crests, and location landmarks must adhere to crisp 32×32 pixel art SVG standards with `shape-rendering="crispEdges"`.
- **Zero Coordinate Distortion:** Map and network canvases must use calibrated coordinate spaces with pan/zoom math and responsive aspect ratios.
- **Test Integrity:** All modifications must maintain 100% test pass rate across `vitest` suite (`npm test`) and zero TypeScript compiler warnings (`npm run typecheck`).

---

## Progress Dashboard

| Milestone | Scope | Status | Tasks Completed |
| :--- | :--- | :---: | :---: |
| **M0: Map Overhaul & Demonic Emperor Data** | Canvas calibration, custom cartography, Demonic Emperor 23 locations | ✅ **DONE** | Complete (Commits `638c642`, `f413b43`) |
| **M1: Roster Expansion & Pixel Parity** | +16 One Piece chars, +15 Coiling Dragon chars, 4 CD factions, 13 CD loc SVGs | ✅ **DONE** | 3 / 3 (Commits `2eb649e`, `b9568d2`) |
| **M2: Interactive Visual Faction Web** | 2D SVG Network Canvas, animated links, pan/zoom, Dossier drawer | ✅ **DONE** | 3 / 3 (Commit `c1371d0`) |
| **M3: RPG Duel & Battle Simulator** | Side-by-side matchup, stat comparison matrix, combat log | ✅ **DONE** | 3 / 3 (Commit `6752fdc`) |
| **M4: Power Ladder Interactivity** | Breakthrough pulses, realm requirements lore drawer | ✅ **DONE** | 2 / 2 (Commit `01a422d`) |
| **M5: Chronicles & Timeline 2.0** | Event type filtering, "Show on Map" cross-links | ✅ **DONE** | 2 / 2 (Commit `01a422d`) |
| **M6: Universal Ops & Data Integrity** | Multi-universe monitoring, automated integrity audits | ✅ **DONE** | 2 / 2 (Commit `76d1c8f`) |

---

## Detailed Task Specifications

### Milestone 1: Character Roster Expansion & Pixel Asset Parity

#### Task 1: Expand One Piece Character Roster (+16 Characters)
**Files:**
- Modify: `data/one-piece/graph.json`
- Create: `public/assets/pixels/one-piece/avatars/*.svg` (16 files)
- Test: `tests/datastore.test.ts`

**Interfaces:**
- Produces: 16 new `CharacterEntity` entries with `power_stage` facts, `faction` facts, and `relationship` edges.
- Target Characters:
  1. `vivi` (Nefertari Vivi & Karoo - Ch. 103, Straw Hat honorary member)
  2. `arlong` (Arlong the Saw - Ch. 69, Arlong Pirates captain)
  3. `kuro` (Captain Kuro - Ch. 23, Black Cat Pirates)
  4. `krieg` (Don Krieg - Ch. 44, Krieg Armada)
  5. `tashigi` (Tashigi - Ch. 96, Marine Master Chief)
  6. `bon-clay` (Bentham / Mr. 2 Bon Clay - Ch. 129, Baroque Works / Okama ally)
  7. `marco` (Marco the Phoenix - Ch. 234, Whitebeard 1st Division Commander)
  8. `sengoku` (Fleet Admiral Sengoku - Ch. 234, Marine Fleet Admiral)
  9. `magellan` (Chief Warden Magellan - Ch. 526, Impel Down Warden)
  10. `katakuri` (Charlotte Katakuri - Ch. 860, Big Mom Sweet Commander)
  11. `pudding` (Charlotte Pudding - Ch. 827, Sanji fiancée / Big Mom 35th Daughter)
  12. `vegapunk` (Dr. Vegapunk Stella - Ch. 1066, World Government Supreme Scientist)
  13. `bonney` (Jewelry Bonney - Ch. 498, South Blue Supernova / Kuma's daughter)
  14. `king` (King the Conflagration - Ch. 920, Beast Pirates All-Star / Lunarian)
  15. `queen` (Queen the Plague - Ch. 920, Beast Pirates All-Star / Ancient Zoan)
  16. `momonosuke` (Kozuki Momonosuke - Ch. 684, Shogun of Wano / Oden's son)

- [x] **Step 1.1**: Write test in `tests/datastore.test.ts` verifying One Piece has at least 50 characters and all have valid `avatar_url`.
- [x] **Step 1.2**: Create script `scratch/expand_one_piece_roster.mjs` to insert character entities, temporal facts (power stages, bounties, factions), and relationships.
- [x] **Step 1.3**: Generate 16 handcrafted 32×32 pixel art avatar SVGs in `public/assets/pixels/one-piece/avatars/`.
- [x] **Step 1.4**: Run script, verify `graph.json` integrity and run `npm test`.
- [x] **Step 1.5**: Git commit: `feat(one-piece): expand character roster to 54 characters with pixel avatars` (Commit `2eb649e`).

---

#### Task 2: Expand Coiling Dragon Character Roster (+15 Characters & 4 Factions)
**Files:**
- Modify: `data/coiling-dragon/graph.json`
- Create: `public/assets/pixels/coiling-dragon/avatars/*.svg` (15 files)
- Create: `public/assets/pixels/coiling-dragon/factions/*.svg` (4 files)
- Test: `tests/datastore.test.ts`

**Interfaces:**
- Produces: 15 new `CharacterEntity` entries and 4 `FactionEntity` entries with full temporal facts.
- Target Characters:
  1. `hogg-baruch` (Hogg Baruch - Ch. 1, Linley's father, Dragonblood lineage)
  2. `wharton-baruch` (Wharton Baruch - Ch. 1, Linley's younger brother, Dragonblood warrior)
  3. `hillman` (Hillman - Ch. 1, Baruch military instructor)
  4. `yale` (Yale - Ch. 21, Dawson Conglomerate heir / Ernst roommate #1)
  5. `reynolds` (Reynolds - Ch. 21, Ernst roommate #2)
  6. `george` (George - Ch. 21, Ernst roommate #3)
  7. `alice` (Alice - Ch. 35, Linley's first love)
  8. `heidens` (Holy Emperor Heidens - Ch. 110, Radiant Church Supreme Pontiff)
  9. `obrien` (God of War O'Brien - Ch. 130, Founder of O'Brien Empire / Deity)
  10. `high-priest` (High Priest of Light - Ch. 140, Yulan Deity of Life)
  11. `barker` (Barker - Ch. 165, Undying Warrior leader)
  12. `haeru` (Haeru the Black Panther - Ch. 95, Saint Magical Beast companion)
  13. `olivier` (Olivier - Ch. 150, Prodigy of Light and Darkness)
  14. `desri` (Desri - Ch. 185, Prime Saint Grand Magus of Light)
  15. `phusro` (Phusro - Ch. 520, Purgatory Commander / Lava Beast Highgod)
- Target Factions:
  1. `faction-baruch` (Baruch Dragonblood Clan & Empire)
  2. `faction-obrien` (O'Brien Empire & God of War College)
  3. `faction-beirut` (Forest of Darkness & Lord Beirut's Domain)
  4. `faction-four-beasts` (Four Divine Beasts Clan of Indigo Prefecture)

- [x] **Step 2.1**: Write test in `tests/datastore.test.ts` checking Coiling Dragon has at least 20 characters and 5 factions with valid avatars/emblems.
- [x] **Step 2.2**: Create script `scratch/expand_coiling_dragon_roster.mjs` to inject the 15 characters, 4 factions, power stage facts, and relationships.
- [x] **Step 2.3**: Generate 15 pixel avatar SVGs in `public/assets/pixels/coiling-dragon/avatars/`.
- [x] **Step 2.4**: Generate 4 pixel faction crest SVGs in `public/assets/pixels/coiling-dragon/factions/`.
- [x] **Step 2.5**: Run script and verify with `npm test`.
- [x] **Step 2.6**: Git commit: `feat(coiling-dragon): expand character roster to 20 characters and 5 factions with pixel art` (Commit `b9568d2`).

---

#### Task 3: Generate Coiling Dragon Location Pixel SVGs (13 Locations)
**Files:**
- Create: `public/assets/pixels/coiling-dragon/locations/*.svg` (13 files)
- Modify: `data/coiling-dragon/graph.json`

- [x] **Step 3.1**: Create script `scratch/generate_coiling_dragon_location_pixels.mjs` defining 32×32 pixel designs for all 13 locations.
- [x] **Step 3.2**: Execute script and verify all 13 SVGs exist.
- [x] **Step 3.3**: Update `thumbnail_url` for all 13 locations in `data/coiling-dragon/graph.json`.
- [x] **Step 3.4**: Git commit: `feat(coiling-dragon): add 13 location pixel art SVGs and link to graph` (Commit `b9568d2`).

---

### Milestone 2: Interactive Visual 2D Faction & Relationship Web

#### Task 4: Build `PixelNetworkCanvas.tsx`
**Files:**
- Create: `src/components/pixel/PixelNetworkCanvas.tsx`
- Consumes: `GraphNode[]`, `GraphEdge[]` from `projectRelationshipWeb(graph, userChapter)`
- Produces: Interactive 2D pan/zoom network canvas with circular/orbital cluster layout.

- [x] **Step 4.1**: Implement `PixelNetworkCanvas.tsx` with:
  - SVG viewport (`viewBox="0 0 1000 650"`).
  - Pan & Zoom engine (zoom state `0.5x` to `2.5x`, mouse drag panning, reset view button).
  - Orbital layout calculation: Faction nodes positioned as gravitational centers; affiliated characters placed in circular orbits around their faction leader. Independent characters positioned along outer perimeter.
  - Animated relationship link paths with stroke colors by tie category:
    - Alliance / Crew: `#10b981` (emerald green)
    - Rivalry / Enemy: `#ef4444` (blood red)
    - Master / Disciple: `#06b6d4` (cyan)
    - Command / Subordinate: `#f59e0b` (amber)
  - Node rendering with `PixelAvatar` sprites (factions: 48px crests; characters: 36px avatars).
  - Hover tooltip and ping indicator on selection.
- [x] **Step 4.2**: Verify rendering with synthetic node & edge fixture.

---

#### Task 5: Build Node Dossier Drawer (`NodeDossierDrawer.tsx`)
**Files:**
- Create: `src/components/pixel/NodeDossierDrawer.tsx`
- Consumes: Selected `GraphNode`, `GraphEdge[]`, `onSelectCharacter`, `onSelectFaction`

- [x] **Step 5.1**: Build drawer that slides up / over when a node is clicked:
  - Header: Large pixel avatar/emblem, display name, masked identity warning if active.
  - Lore synopsis: Bio, current faction, power rank.
  - Connected ties list: Clickable relationship badges that pan camera to the target node.
  - Action buttons: "Open in RPG Status Screen" / "Focus on Map".

---

#### Task 6: Integrate Network Canvas into `world-explorer.tsx`
**Files:**
- Modify: `src/app/[slug]/world-explorer.tsx:568-793`

- [x] **Step 6.1**: Replace the flat 3-column card grid in `activeTab === 'web'` with:
  - Mode toggle: `[🕸️ VISUAL NETWORK WEB]` vs `[📋 DOSSIER GRID]`.
  - Pass `nodes={relationshipWeb.nodes}`, `edges={relationshipWeb.edges}`, `userChapter={userChapter}`, and selection callbacks.
- [x] **Step 6.2**: Test interactive switching, filtering, and clicking across One Piece, Demonic Emperor, and Coiling Dragon.
- [x] **Step 6.3**: Git commit: `feat(network): replace static web with interactive 2D PixelNetworkCanvas` (Commit `c1371d0`).

---

### Milestone 3: RPG Head-to-Head Duel Mode (Battle Simulator)

#### Task 7: Build `RpgDuelSimulator.tsx`
**Files:**
- Create: `src/components/pixel/RpgDuelSimulator.tsx`
- Consumes: `graph`, `userChapter`, `onSelectCharacter`

- [x] **Step 7.1**: Implement dual character selectors (Fighter 1 vs Fighter 2).
- [x] **Step 7.2**: Provide universe-specific canon showdown presets:
  - One Piece: *Luffy vs Arlong (Ch. 90)*, *Luffy vs Crocodile (Ch. 180)*, *Luffy vs Lucci (Ch. 420)*, *Zoro vs Mihawk (Ch. 50)*, *Whitebeard vs Akainu (Ch. 570)*.
  - Demonic Emperor: *Zhuo Fan vs Hell Valley (Ch. 140)*, *Zhuo Fan vs Huangpu Qingtian (Ch. 310)*, *Zhuo Fan vs Ye Lin (Ch. 680)*.
  - Coiling Dragon: *Linley vs Kalan (Ch. 45)*, *Linley vs Clayde (Ch. 120)*, *Linley vs Olivier (Ch. 210)*.

---

#### Task 8: Duel Simulation Engine & Combat Visualizer
**Files:**
- Create: `src/engine/duel-simulator.ts`
- Test: `tests/duel-simulator.test.ts`

- [x] **Step 8.1**: Write unit tests for power comparison math:
  - Takes two characters at `userChapter`.
  - Resolves active `power_stage.order`.
  - Calculates comparative advantage percentage, key artifacts, and win probability.
- [x] **Step 8.2**: Implement `simulateDuel(charA, charB, userChapter, graph)`.
- [x] **Step 8.3**: Build combat log visualizer with retro pixel HP bar depletion and turn-by-turn battle chronicle.
- [x] **Step 8.4**: Run `npm test` to verify simulator tests pass.

---

#### Task 9: Integrate Duel Simulator into RPG Status Screen
**Files:**
- Modify: `src/app/[slug]/world-explorer.tsx:452-566`
- Modify: `src/components/pixel/RpgStatusScreen.tsx`

- [x] **Step 9.1**: Add a `[⚔️ VS DUEL SIMULATOR]` button to the RPG Status Screen.
- [x] **Step 9.2**: Enable seamless transition between single-character status and head-to-head comparison.
- [x] **Step 9.3**: Git commit: `feat(rpg): add Head-to-Head Duel Simulator with canon battle presets` (Commit `6752fdc`).

---

### Milestone 4: Power Ladder Interactivity & Realm Lore

#### Task 10: Breakthrough Pulses & Recent Advance Badges
**Files:**
- Modify: `src/app/[slug]/world-explorer.tsx:366-450`

- [x] **Step 10.1**: Calculate `isRecentBreakthrough = Math.abs(userChapter - char.achieved_at_chapter) <= 30`.
- [x] **Step 10.2**: Render pulsing gold ring and `★ RECENT ADVANCE` badge on qualifying characters.

---

#### Task 11: Realm Breakthrough Lore Drawer
**Files:**
- Create: `src/components/pixel/RealmLoreModal.tsx`
- Modify: `src/projections/power-ladder.ts`

- [x] **Step 11.1**: Add breakthrough requirements, mortality risk, and cultivation phenomena descriptions to `powerLadder.tiers`.
- [x] **Step 11.2**: Clicking any realm header opens the modal displaying the canonical cultivation manual / criteria.
- [x] **Step 11.3**: Git commit: `feat(ladder,timeline): add realm codex modals, breakthrough pulses, timeline filters, and map cross-linking` (Commit `01a422d`).

---

### Milestone 5: Chronicles & Timeline 2.0

#### Task 12: Event Type Filtering & Horizontal Track
**Files:**
- Modify: `src/app/[slug]/world-explorer.tsx:795-860`

- [x] **Step 12.1**: Add event category filter pills: `[ALL]`, `[⚔️ BATTLES]`, `[⚡ BREAKTHROUGHS]`, `[👑 POLITICS]`, `[🧭 DISCOVERIES]`, `[💀 TRAGEDIES]`.
- [x] **Step 12.2**: Add quick timeline scrubber to jump directly to specific arc starting chapters.

---

#### Task 13: "Show on Map" Cross-Linking
**Files:**
- Modify: `src/app/[slug]/world-explorer.tsx`
- Modify: `src/components/pixel/PixelMapCanvas.tsx`

- [x] **Step 13.1**: Add `selectedLocationId` prop to allow timeline events with a `location_id` to switch tabs to `map` and center the camera on the landmark.
- [x] **Step 13.2**: Add featured character chips on timeline cards jumping directly to character journey.
- [x] **Step 13.3**: Git commit: `feat(ladder,timeline): add realm codex modals, breakthrough pulses, timeline filters, and map cross-linking` (Commit `01a422d`).

---

### Milestone 6: Universal Ops & Data Integrity Dashboard

#### Task 14: Upgrade `/ops` to Multi-Universe Monitoring
**Files:**
- Modify: `src/app/ops/page.tsx`

- [x] **Step 14.1**: Remove hardcoded `coiling-dragon` references.
- [x] **Step 14.2**: Query and aggregate metrics across all series in `data/` (`one-piece`, `demonic-emperor`, `coiling-dragon`).
- [x] **Step 14.3**: Display multi-universe comparative telemetry table.

---

#### Task 15: Automated Graph Integrity Verification
**Files:**
- Modify: `src/engine/conflict-engine.ts`
- Modify: `src/app/ops/page.tsx`
- Test: `tests/conflict-engine.test.ts`

- [x] **Step 15.1**: Add detection rules for:
  - Orphaned locations (locations pointing to invalid plane IDs).
  - Dangling edges (relationships pointing to non-existent characters/factions).
  - Missing thumbnails or avatars.
  - Temporal inversions (`valid_to < valid_from`, arc start > end).
- [x] **Step 15.2**: Render visual health score gauge (100% = Pure Canon Integrity) and issue log table in `/ops`.
- [x] **Step 15.3**: Git commit: `feat(ops): universal multi-universe monitoring and automated integrity audits` (Commit `76d1c8f`).

---

## Verification & Review Gates

Every task must pass the following validation protocol before being checked off:
1. `npm run typecheck --prefix ../omni-lore` must exit with code 0.
2. `npm test --prefix ../omni-lore` must pass 100% of tests.
3. Relevant Next.js pages (`/one-piece`, `/demonic-emperor`, `/coiling-dragon`, `/ops`, `/pixel-studio`) must return HTTP 200 via `curl`.
4. Git commit with descriptive conventional commit message.
