<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# OmniLore — AI Agent & Developer Operating Manual

> **Brand:** OmniLore  
> **Tagline:** Explore the Unknown  
> **Description:** Temporal Knowledge Graph & Spoiler-Free World Explorer  

This manual defines the architecture, invariant rules, workflows, and standards for any AI agent or human engineer contributing to OmniLore.

---

## 🧭 1. Core Philosophy & Guiding Principles

OmniLore is an interactive retro-fantasy operating system for fictional universes (starting with *Coiling Dragon*, *Demonic Emperor*, *Lord of the Mysteries*, *One Piece*, and *Solo Leveling*).

1. **Strict Temporal Integrity (Zero Spoilers):**
   - The user controls their current chapter via the **Spoiler Scrubber**.
   - No character, realm advancement, relationship tie, faction affiliation, event, or geographic landmark may be revealed if its canon debut or breakthrough occurs past `userChapter`.
   - Secret identities operate under alias masking (`[UNKNOWN ENIGMA]`) until the canonical unmasking chapter.
2. **Pure Projection Architecture:**
   - The raw data is stored as a single, normalized, fact-based `CanonicalLoreGraph` per universe in `data/<slug>/graph.json`.
   - All visualizers are **pure projection functions**:
     ```typescript
     projectPowerLadder(graph, userChapter)
     projectRelationshipWeb(graph, userChapter)
     projectWorldMap(graph, userChapter)
     projectTimeline(graph, userChapter)
     projectCharacterJourney(characterId, graph, userChapter)
     ```
   - Never mutate the canonical graph in projections or UI components.
3. **Modern Pixel Fantasy Aesthetic:**
   - Authentic retro RPG status screens, 8-bit sound effects (Web Audio API synthesizers), procedural SVG scanlines, dithered fog of war, and pixel avatars.
   - Clean, dark obsidian theme (`#040814`) with glowing thematic accents per universe (Amber for Coiling Dragon, Purple for Lord of the Mysteries, Sky Blue for Solo Leveling, Indigo for Demonic Emperor, Gold/Red for One Piece).
4. **URL Deep-Linking Parity:**
   - Every state (chapter, tab, selected character, focused landmark) must be synchronized to the URL query parameters (`?ch=250&tab=journey&char=linley-baruch&loc=loc-fenlai-city`) without triggering Next.js server re-renders.

---

## 🗂️ 2. Repository Structure

```text
omni-lore/
├── data/                               # Canonical universe lore graphs
│   ├── coiling-dragon/graph.json       # 98% fidelity cultivation graph
│   ├── demonic-emperor/graph.json      # 95% fidelity dark cultivation graph
│   ├── lord-of-the-mysteries/graph.json# 95% fidelity beyonder graph
│   ├── one-piece/graph.json            # 96% fidelity pirate world atlas
│   └── solo-leveling/graph.json        # 95% fidelity hunter dungeon graph
├── public/assets/pixels/               # Pixel SVG avatars, locations, factions
├── src/
│   ├── app/
│   │   ├── [slug]/                     # Dynamic universe hub route
│   │   │   ├── page.tsx                # Server component loading universe
│   │   │   └── world-explorer.tsx      # Client root mounting scrubber & tabs
│   │   ├── page.tsx                    # Landing page with 5 universe portals
│   │   ├── layout.tsx                  # Global HTML/Font shell
│   │   ├── ops/                        # Operations & data health dashboard
│   │   └── pixel-studio/               # Pixel avatar laboratory
│   ├── components/pixel/               # Retro pixel visualizers
│   │   ├── CharacterExplorer.tsx       # P0: Central character graph nexus
│   │   ├── PixelMapCanvas.tsx          # P1: Procedural Fog-of-War Cartography
│   │   ├── PixelNetworkCanvas.tsx      # P1: 2D physics faction web
│   │   ├── NodeDossierDrawer.tsx       # Faction & character slide-over drawer
│   │   ├── RealmLoreModal.tsx          # Canonical Realm Codex popup
│   │   ├── RpgStatusScreen.tsx         # Retro RPG stats & vitals card
│   │   ├── RpgDuelSimulator.tsx        # 1v1 turn-based arena showdown
│   │   ├── PixelAvatar.tsx             # Scanline-framed retro avatar
│   │   └── PixelGauge.tsx              # Segmented 8-bit progress bar
│   ├── domain/                         # Core domain types and universe themes
│   │   ├── types.ts                    # CanonicalLoreGraph schema
│   │   └── themes.ts                   # Universe styling, rune symbols & colors
│   ├── engine/                         # Temporal & simulation engines
│   │   ├── temporal-engine.ts          # Point-in-time fact resolution
│   │   ├── conflict-engine.ts          # Priority & breakthrough tie-breaking
│   │   └── duel-simulator.ts           # RPG battle math & formula engine
│   ├── lib/                            # Audio and utility libraries
│   │   └── sound-effects.ts            # Web Audio API 8-bit sound effects
│   └── projections/                    # Chapter-bounded projection transforms
│       ├── power-ladder.ts
│       ├── relationship-web.ts
│       ├── world-map.ts
│       ├── timeline.ts
│       └── character-journey.ts
├── tests/                              # Automated Vitest test suite
│   ├── temporal-engine.test.ts
│   ├── projections.test.ts
│   ├── duel-simulator.test.ts
│   ├── conflict-engine.test.ts
│   ├── sound-effects.test.ts
│   ├── pixel-converter.test.ts
│   └── datastore.test.ts
├── ARCHITECTURE.md                     # Technical architecture documentation
├── DESIGN_SYSTEM.md                    # Visual, typography & audio specifications
├── UNIVERSES.md                        # Universe data ontology & guide
├── TODO.md                             # Living roadmap & task tracking
└── AGENTS.md                           # This operating manual
```

---

## ⚡ 3. Essential Commands & Workflows

### Running Tests
Always run before making claims of completion:
```bash
npm test
```
*Requirement:* **37/37 tests must pass.** If modifying projections, update `tests/projections.test.ts` accordingly.

### Testing Next.js Turbopack Production Build
```bash
npm run build
```
*Requirement:* Must compile without TypeScript or routing errors.

### Local Development Server
```bash
npm run dev
```
Available at `http://localhost:3000`.

---

## 🛡️ 4. Invariant Rules for Code Changes

1. **Next.js Agent Notice Preservation:**
   Never remove or alter the `<!-- BEGIN:nextjs-agent-rules -->` block at the top of `AGENTS.md`.
2. **Never Bypass Temporal Engine:**
   When reading facts (location, faction, realm, status), always use `TemporalEngine.getActiveFact()` or the dedicated projection function with `userChapter`. Never read the raw facts directly without temporal filtering.
3. **Preserve Clickable File Links:**
   When referencing files in responses or documentation, always use clickable `file:///` URLs (e.g. `[CharacterExplorer.tsx](file:///Users/deepaknaik/Downloads/world-building/omni-lore/src/components/pixel/CharacterExplorer.tsx)`).
4. **Sound Engine Safety:**
   All sound effects in `SoundEngine` are wrapped in user-initiated audio context triggers and guarded by mute checks (`isMuted`). Never play audio without user interaction.
5. **No External Heavy Map Libraries:**
   Keep the pixel cartography purely procedural and vector-based in SVG (`PixelMapCanvas.tsx`). Do NOT pull in Mapbox, Leaflet, or heavy third-party map tiles; OmniLore's charm relies on authentic pixel graphics.

---

## 📚 5. Reference Documentation Index

- 📐 **[ARCHITECTURE.md](file:///Users/deepaknaik/Downloads/world-building/omni-lore/ARCHITECTURE.md)**: Temporal knowledge graph theory, fact schemas, and projection mechanics.
- 🎨 **[DESIGN_SYSTEM.md](file:///Users/deepaknaik/Downloads/world-building/omni-lore/DESIGN_SYSTEM.md)**: Color palettes, scanline textures, dither patterns, and 8-bit sound synthesis.
- 🌌 **[UNIVERSES.md](file:///Users/deepaknaik/Downloads/world-building/omni-lore/UNIVERSES.md)**: Universe lore structures, power tiers, factions, and benchmark series.
- 📋 **[TODO.md](file:///Users/deepaknaik/Downloads/world-building/omni-lore/TODO.md)**: Living task backlog, priority matrix, and engineering status.
