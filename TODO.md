# OmniLore — Living Task Backlog & Engineering Roadmap

*Last updated: September 28, 2026*

This document tracks all features, bug fixes, enhancements, and technical debt for OmniLore across priority tiers.

---

## 🚦 Summary Dashboard

| Priority | Focus Area | Status | Progress |
| :--- | :--- | :---: | :---: |
| 🔥 **P0** | Foundation & Core Explorers | **DONE** | **100% (4/4)** |
| 🟠 **P1** | Rich World Engagement & Cartography | **DONE** | **100% (4/4)** |
| 🚀 **EXT** | OmniLore Reader Chrome Extension (MV3) | **DONE** | **100% (6/6)** |
| 🟢 **P2** | Map Engine v3 & 6th Universe Expansion | **DONE** | **100% (3/3)** |
| 🟣 **P2.1** | AI Intelligence & Cosmic Arena | **PLANNED** | **0% (0/2)** |
| 🟢 **P3** | Retention & Local Bookmarks | **IN PROGRESS** | **50% (1/2)** |

---

## 🔥 Priority P0: Core Foundations (100% Complete)

- [x] **Temporal Graph Engine Foundation**
  - [x] Fact-based temporal interval modeling (`[valid_from, valid_to]`).
  - [x] Point-in-time state resolution via `TemporalEngine.getActiveFact()`.
  - [x] Conflict resolution engine prioritizing latest canonical breakthroughs (`ConflictEngine`).
  - [x] 100% test coverage with automated Vitest suites (`tests/temporal-engine.test.ts`).
- [x] **Character Explorer (Central Graph Nexus)**
  - [x] Scanline-framed retro pixel portrait with masked identity detection (`EyeOff`, `[UNKNOWN ENIGMA]`).
  - [x] Quick-jump protagonist selector chips and searchable character dropdown.
  - [x] Stepped horizontal power journey rail (`Mortal ── Saint ── God ── Highgod ── Sovereign`).
  - [x] Categorized relationship network matrix (`Master`, `Disciple`, `Ally`, `Rival`, `Enemy`, `Family`).
  - [x] Visited geographic landmark footprint with one-click **SHOW ON MAP** buttons.
  - [x] Chronological story milestones filtered strictly prior to `userChapter`.
  - [x] Direct actions: challenge in Duel Arena, view in Power Ladder, explore in Faction Web.
- [x] **Interactive Power Ladder & Realm Codex**
  - [x] Interactive realm tiers sorted hierarchically.
  - [x] Dynamic occupants at `userChapter` with recent advance badges.
  - [x] Clickable realm cards opening the **Canonical Realm Codex Modal** (`RealmLoreModal.tsx`).
  - [x] Displaying breakthrough criteria, canonical phenomena, and mortality risk.
  - [x] Instant jump from occupant cards to Character Explorer.
- [x] **Story Timeline & Arc Scrubber**
  - [x] Arc navigation with chapter ranges and one-click quick-scrub buttons.
  - [x] Event filtering pills: Battles, Breakthroughs, Politics, Discoveries, Tragedies.
  - [x] Event cross-linking to map landmarks ("SHOW ON MAP") and key figures ("VIEW CHARACTER").
- [x] **URL State Deep-Linking & Snapshot Sharing**
  - [x] Query param hydration on mount (`?ch=`, `?tab=`, `?char=`, `?loc=`).
  - [x] Real-time URL synchronization via `window.history.replaceState`.
  - [x] "SHARE SNAPSHOT" button copying current link with clipboard toast.
- [x] **Homepage Brand & Knowledge Boundary Alignment**
  - [x] 3-layer brand hierarchy: OmniLore / Explore the Unknown / Temporal Knowledge Graph.
  - [x] Dynamic knowledge boundary gauge (`KNOWLEDGE BOUNDARY: CH X ● CURRENT INDEX` vs `INDEXED THROUGH CH X / TOTAL`).

---

## 🟠 Priority P1: Rich World Engagement (100% Complete)

- [x] **Faction Web & Political Network**
  - [x] Dual viewing modes: interactive 2D physics network canvas (`PixelNetworkCanvas.tsx`) and dossier cards.
  - [x] Filter controls: All Network, Factions only, Characters only, and specific faction membership.
  - [x] Interactive slide-over Node Dossier Drawer (`NodeDossierDrawer.tsx`).
  - [x] Faction emblems, member counts, and relationship badges.
- [x] **Character Journey Progression**
  - [x] Pure functional projection transform (`character-journey.ts`).
  - [x] Stepped progression rail showing unlocked vs locked stages.
  - [x] Temporal breakthrough stamps (`Ch. 115 Saint`, `Ch. 450 God`).
- [x] **Fog-of-War Pixel Cartography**
  - [x] Handcrafted SVG pixel cartography for all 5 universes across multiple planes.
  - [x] Procedural SVG `<mask id="fog-of-war-mask">` with soft gaussian blur edges (`feGaussianBlur stdDeviation="12"`).
  - [x] Radial clearing apertures around discovered landmarks (`105px`), voyage routes (`80px`), and active posts (`125px`).
  - [x] Retro 8-bit dither texture (`<pattern id="retro-fog-dither">`) and scanlines covering unexplored territory.
  - [x] Atmospheric uncharted sector runes (`░░ UNCHARTED (CH X+) ░░`).
  - [x] Dedicated toolbar toggle (`[ 🌫️ FOG: ON / OFF ]`).
  - [x] Real-time fog dissolve as the chapter scrubber advances.
- [x] **RPG Duel Simulator**
  - [x] Turn-based 1v1 battle simulator with dynamic realm scaling.
  - [x] Damage mitigation, breakthrough crits, and narrative combat commentary.
  - [x] Web Audio API 8-bit sound synthesizers.
  - [x] Direct deep linking from Character Explorer and Faction Web.

---

## 🚀 Priority EXT: OmniLore Reader — Chrome Extension (100% Complete)

- [x] **Manifest V3 Architecture & Side Panel Engine**
  - [x] Ephemeral background service worker (`background/service-worker.ts`) using `chrome.storage.session`.
  - [x] Automatic side panel opening via `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`.
  - [x] Real-time chapter badge counter on extension icon.
  - [x] Context menu integration: "OmniLore: Who is '%s'?" with zero-spoiler text selection lookup.
- [x] **Active Chapter Detectors (Adapter Architecture)**
  - [x] MangaPlus (`mangaplus.shueisha.co.jp`) with viewer path & DOM inspection.
  - [x] Webnovel (`webnovel.com`) with book and chapter slug parsing.
  - [x] Wuxiaworld (`wuxiaworld.com`) with novel chapter path extraction.
  - [x] Tapas (`tapas.io`) episode parser.
  - [x] Generic fallback regex detector for community scanlation sites (Asura, Reaper, Flame).
- [x] **Retro Game-HUD Side Panel UI**
  - [x] 3-tier Spoiler Shield selector: `🛡️ SAFE` (strict chapter limit), `⚠️ CONTEXT` (background lore), `🔥 FULL` (unrestricted).
  - [x] 6-tab game HUD navigation: `👤 ROSTER`, `⚡ POWER`, `🔐 SECRETS`, `🕸 TIES`, `⚔ DUEL`, `💬 ASK`.
  - [x] Mini RPG Duel Simulator with chapter parity stat balancing and "Simulation — not canon" verification disclaimer.
  - [x] "Ask about this chapter" grounded Oracle Q&A computing answers strictly from temporal knowledge graph snapshots.
  - [x] 100% offline capability with embedded lore data for all 5 universes (~790 KB).

---

## 🟢 Priority P2: Map Engine v3 & 6th Universe Expansion (100% Complete)

- [x] **Map Engine v2 & Interactive RPG Atlas**
  - [x] 9-layer PixiJS 8 WebGL cartographic scene graph (`PixiWorldRenderer`).
  - [x] Smooth camera controller (`CameraController`) with inertial pan, boundary clamping, and animated `flyTo`.
  - [x] Multi-plane cartography, vector terrain polygons, dynamic travel routes, and waypoint character journey paths.
  - [x] Faction spheres of influence with thematic border strokes and fills.
  - [x] Zero-spoiler temporal map projection (`projectTemporalMap()`) and fog of war clearing.
  - [x] Universal graph fallback adapter (`adaptGraphToWorldMap()`) synthesizing full map definitions for all universes.
  - [x] Retro HUD controls with layer toggles, plane selector, minimap, and location dossier cards (`RpgWorldAtlas.tsx`).
- [x] **Flagship 6th Universe: Reverend Insanity (`reverend-insanity`)**
  - [x] 2,334 chapters indexed with complete 9-rank Gu cultivation hierarchy.
  - [x] 3 spatial planes: Mortal Five Regions, Immemorial Two Heavens, Cosmic River of Time.
  - [x] 81 entities: 26 figures, 10 factions, 18 locations, 6 canonical books/arcs, 9 historical milestones.
  - [x] Multi-persona temporal identity unmasking for Fang Yuan across 6 distinct aliases (*Chang Shan Yin*, *Liu Guan Yi*, etc.).
  - [x] 54 custom Xianxia retro pixel SVGs (avatars, faction crests, landmark pins).
  - [x] 6 canonical duel presets in RPG Duel Simulator with signature moves.
- [x] **Map Engine v3 — Level-Select Tileset Atlas**
  - [x] Retained, diff-driven `PixiWorldRenderer` with a coalescing snapshot queue (only the newest pending snapshot commits, so rapid chapter scrubbing never backs up).
  - [x] Tileset plane compositor: pure `buildPlaneLayout()` + browser-only `paintPlane()` baking Puny World (CC0) and MrBeast mountains (CC-BY 3.0) tilesets to a cached Canvas 2D texture per `(map, plane, universe)`.
  - [x] Per-universe looks (`UNIVERSE_LOOKS`): tint/saturation grade plus water/sand/foam/fog colors for all 6 universes.
  - [x] Multi-plane support with `?plane=<id>` URL deep-linking, cross-plane waypoint travel, and sealed-plane (`??? SEALED REALM`) gating.
  - [x] Hand-authored rivers (`MapRiver`) with bridges, painted as geography (never chapter-gated).
  - [x] Hero dirt-path walk (constant speed, capped duration, retargetable) along a packed-earth trail distinct from roads/sea lanes/flight arcs.
  - [x] Light dithered cloud fog: world-anchored Bayer-4 `Mesh` shader (GLSL ES 1.00) with per-universe opacity, lowered after browser review so tileset terrain reads through.
  - [x] Numbered journey badges, hover tooltips, coalescing "NEW AREA DISCOVERED (+N MORE)" banner, waypoint panel, pixel frame and minimap.
  - [x] Reverend Insanity re-authored across 3 organic planes with roughened coastlines and winding mountain-ribbon regional walls.
  - [x] Art credits in `CREDITS.md` and the atlas frame's "Art:" links (CC-BY 3.0 attribution requirement).

---

## 🟣 Priority P2.1: AI Layer & Cosmic Arena (Next Milestone)

- [ ] **Ask OmniLore (Spoiler-Safe AI Lore Companion)**
  - [ ] Implement slide-out chat drawer or modal powered by Gemini API.
  - [ ] Temporal Knowledge Graph context injection: strictly inject entities, facts, and events `< userChapter`.
  - [ ] Strict spoiler refusal system prompt: "I cannot reveal future events beyond Chapter X."
  - [ ] Chapter citations on every answer ("Confirmed in Chapter 115").
  - [ ] Suggested contextual prompts based on the currently viewed character or map location.
- [ ] **Universe Comparison & Cross-Cosmology Arena**
  - [ ] Universal 10-tier cosmic power scale (Street Level to Multiversal Apex).
  - [ ] Cross-universe duel matchmaker:
    - Linley Baruch (Sovereign) vs. Sung Jin-Woo (Shadow Monarch)
    - Monkey D. Luffy (Gear 5) vs. Klein Moretti (Lord of Mysteries)
    - Zhuo Fan (Demonic Emperor) vs. Beirut (Lord of Darkness)
    - Fang Yuan (Demon Venerable) vs. Linley Baruch (Grand Mist Sovereign)
  - [ ] Power system ontology comparison (Qi vs. Haki vs. Mana vs. Beyonder Potions vs. Gu Dao).

---

## 🟢 Priority P3: Retention & Local Bookmarks (50% Complete)

- [x] **User Profiles & Local Reading Tracker**
  - [x] LocalStorage-backed progress saver remembering last read chapter per universe (`UserProgressService`).
  - [x] "CONTINUE YOUR SAGA" shelf on homepage with live segmented progress meters and quick `[-1]`, `[+1]`, `[+10]` chapter nudges (`ContinueReadingShelf.tsx`).
  - [x] Interactive character pinning directly from character dossiers in the Character Explorer (`★ PIN` / `★ PINNED`).
  - [x] Head-to-head clash saving (`💾 SAVE SHOWDOWN`) in the 1v1 RPG Duel Simulator with replay links.
  - [x] Dedicated retro **Saga Log Modal** (`UserBookmarksModal.tsx`) with 4 tabs: Expeditions, Pinned Figures, Saved Duels, and JSON Backup / Restore.
  - [x] Cross-component real-time reactivity via `omnilore-progress-updated` custom events.
- [ ] **Community Annotations & Theorycrafting**
  - [ ] Chapter-gated user comment threads on story events and breakthroughs.
  - [ ] Theorycrafting cards with spoiler tag warnings.
  - [ ] Community voting on power tier rankings and duel fairness.

---

## 🛠️ Technical Debt & Polish Backlog

- [x] **Mobile Touch Optimization:** Pinch-to-zoom and drag on the atlas handled via the pure `GestureTracker` (`src/engine/map/input/gesture-tracker.ts`) — two-finger pinch distance → scale, click-vs-drag threshold.
- [ ] **Audio Policy Fallback:** Add graceful fallback for iOS Safari audio autoplay policy when SFX are unmuted.
- [x] **Universe Data Expansion:** Add pilot universe 6 (*Reverend Insanity* complete with 2,334 chapters, 3 planes, 81 entities, and 54 pixel assets).
- [ ] **Spec 2: Hand-author organic map.json (with rivers and lakes) for Coiling Dragon, Demonic Emperor, Lord of the Mysteries, One Piece, Solo Leveling** — these 5 universes currently render through `adaptGraphToWorldMap()`'s synthesized fallback rather than a bespoke, organically-shaped map definition.

---

## 🧪 Verification Commands
 
```bash
# Run complete Vitest suite (Must pass 310/310 tests across 37 test files)
npm test

# Build Chrome Extension (Manifest V3 unpacked bundle in chrome-extension/dist)
npm run build:extension

# Run Next.js production Turbopack build
npm run build

# Start local development server
npm run dev
```
