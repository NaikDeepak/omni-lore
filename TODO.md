# OmniLore — Living Task Backlog & Engineering Roadmap

*Last updated: September 28, 2026*

This document tracks all features, bug fixes, enhancements, and technical debt for OmniLore across priority tiers.

---

## 🚦 Summary Dashboard

| Priority | Focus Area | Status | Progress |
| :--- | :--- | :---: | :---: |
| 🔥 **P0** | Foundation & Core Explorers | **DONE** | **100% (4/4)** |
| 🟠 **P1** | Rich World Engagement & Cartography | **DONE** | **100% (4/4)** |
| 🟢 **P2** | AI Intelligence & Universe Expansion | **NEXT** | **0% (0/2)** |
| 🟢 **P3** | User Profiles & Community Platform | **PLANNED** | **0% (0/2)** |

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

## 🟢 Priority P2: AI Layer & Universe Expansion (Next Up)

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
  - [ ] Power system ontology comparison (Qi vs. Haki vs. Mana vs. Beyonder Potions).

---

## 🟢 Priority P3: Retention & Community Platform (Future)

- [ ] **User Profiles & Bookmarks**
  - [ ] LocalStorage-backed progress saver remembering last read chapter per universe.
  - [ ] "Continue Reading" shelf on homepage with quick jump buttons.
  - [ ] Pinned favorite characters, custom duel bookmarks, and saved map snapshots.
  - [ ] Optional account sync (Supabase / Firebase Auth).
- [ ] **Community Annotations & Theorycrafting**
  - [ ] Chapter-gated user comment threads on story events and breakthroughs.
  - [ ] Theorycrafting cards with spoiler tag warnings.
  - [ ] Community voting on power tier rankings and duel fairness.

---

## 🛠️ Technical Debt & Polish Backlog

- [ ] **Mobile Touch Optimization:** Ensure pinch-to-zoom on `PixelMapCanvas.tsx` handles multi-touch gestures smoothly on mobile Safari/Chrome.
- [ ] **Audio Policy Fallback:** Add graceful fallback for iOS Safari audio autoplay policy when SFX are unmuted.
- [ ] **Universe Data Expansion:** Add pilot universe 6 (*Reverend Insanity* or *Omniscient Reader's Viewpoint*) to test another distinct cultivation / webnovel system.

---

## 🧪 Verification Commands

```bash
# Run Vitest test suite (Must pass 37/37 tests)
npm test

# Run Next.js production Turbopack build
npm run build

# Start local development server
npm run dev
```
