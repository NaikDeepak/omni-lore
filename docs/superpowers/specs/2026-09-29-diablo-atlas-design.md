# Diablo-Style Pixel-Gothic World Atlas — Design Spec

- **Date:** 2026-09-29
- **Status:** Approved in conversation, pending written-spec review
- **Scope:** Spec 1 of 2 — renderer rewrite + Reverend Insanity pilot map. Spec 2 (later) hand-authors organic maps for the remaining 5 universes.

---

## 1. Intent

### What the user asked for
- Make the map feel like an RPG world map "like Diablo": more graphical and more interactive.
- Direction chosen: **Diablo IV–style top-down world atlas** (not an isometric walkable world).
- Art style chosen: **pixel-gothic blend** — Diablo mood (dark, moody lighting, parchment/stone, ember/blood accents) rendered with pixel-snapped textures, dithered fog and pixel icons, consistent with DESIGN_SYSTEM.md.
- Interactions required in v1: **hover tooltips + glow**, **animated hero marker**, **waypoint fast-travel**, **live fog reveal**.
- Terrain source: **hand-authored `map.json` per universe**; decorative glyphs **auto-scattered** inside authored shapes, with optional hand-placed landmark glyphs.
- Sequencing: renderer + Reverend Insanity pilot first.
- Plane selection must actually work (per-plane canvases).
- Quality bar: "absolute best, even if we have to rewrite." Effort/time is not a constraint.

### Constraints (from repo rules)
- PixiJS only — no Mapbox/Leaflet/tile services (AGENTS.md §4.5).
- Zero-spoiler temporal integrity: every visible thing derives from `projectTemporalMap(def, userChapter)`; projections stay pure (ARCHITECTURE.md §1–4).
- URL deep-link parity (`?ch=&tab=&char=&loc=`) remains intact.
- Audio only on user interaction and guarded by `isMuted`.
- Must work for all 6 universes; the 5 without `map.json` continue through `adaptGraphToWorldMap()`.

### Success criteria
- The map reads as a game world map: organic terrain, textured biomes, type-specific icons, ornate frame, lighting, atmosphere.
- Scrubbing chapters animates (hero walks, fog dissolves open, discovery banner) instead of redrawing.
- Hover, click, fast-travel and plane warp feel responsive at 60 fps with 200+ locations.
- No spoiler leakage through any new surface (glyphs, tooltips, waypoint list, banner, hero).
- All existing tests remain green; new pure modules are unit-tested; `npm run build` passes.

### Explicit expectation
Until spec 2, the 5 adapter-driven universes still have rectangular plane outlines. They gain every new visual and interaction (icons, glyphs, fog, hero, frame, lighting, waypoints), but not organic shapes. This is not a regression.

---

## 2. Root problem in current engine

`PixiWorldRenderer.renderSnapshot()` destroys and rebuilds all 9 containers, and `RpgWorldAtlas` calls it on every `snapshot` change (i.e. every chapter tick). Consequences:
- A hero cannot walk from its previous waypoint — the old one is destroyed.
- Fog cannot dissolve — it is redrawn from scratch.
- Hover state is lost whenever the scrubber moves.
- Particles re-randomize each tick (visible jumps).

Also: `activePlaneId` is never passed to the projection and map entities carry no `planeId`, so plane selection is cosmetic. Reverend Insanity crams 3 planes onto one 1000×1000 canvas.

The design therefore moves to a **retained, diff-driven** renderer with **per-plane baked static layers**.

---

## 3. Architecture

### 3.1 Approach
Keep PixiJS v8 and `CameraController`; rewrite the renderer into focused modules. Rejected alternatives:
- Rewrite on `pixi-viewport` — swaps a tested camera for no gain.
- Pre-painted raster art per universe — conflicts with hand-authored polygons and temporal fog.

### 3.2 Module layout

```
src/engine/map/
  pixi-world-renderer.ts        Facade. Lifecycle, ticker, plane cache, wires modules.
                                Keeps class name and 9 public top-level containers.
  camera-controller.ts          + worldToScreen / screenToWorld, pinch zoom, keyboard pan.
  anim/tween.ts                 Minimal ticker-driven tween system; retargetable (no queuing).
  input/pointer-controller.ts   Drag threshold (4px), hover hit-testing, click-vs-drag, pinch, wheel.
  scene/static-baker.ts         Terrain + glyphs baked into one RenderTexture per (map, plane, theme).
  scene/terrain-painter.ts      Pixel-gothic biome fills, elevation dithering, coast/cliff outlines.
  scene/glyph-scatter.ts        PURE seeded Poisson-disk scatter per terrain type.
  scene/icon-atlas.ts           16 procedural pixel icons (one per LocationType), theme-tinted.
  scene/pixel-palette.ts        PURE biome palette ramps per theme (4 tones per biome).
  layers/routes-layer.ts        Animated dashed pixel roads / sea lanes / portal arcs.
  layers/markers-layer.ts       Keyed by location id: icon, shadow, danger ring, bob, hover glow.
  layers/hero-layer.ts          Protagonist token walking the journey path.
  layers/fog-layer.ts           Low-res reveal mask + filters/dither-fog-filter.ts (Bayer threshold shader).
  layers/fx-layer.ts            Reveal bursts, warp spiral, ember sparks.
  layers/atmosphere-layer.ts    Per-theme particles + drifting cloud shadows.
  layers/labels-layer.ts        BitmapText (Silkscreen); region titles; zoom level-of-detail.
  filters/dither-fog-filter.ts  Custom Pixi v8 Filter (GLSL + WGSL) for Bayer-dithered fog edges.
  filters/glow-outline-filter.ts Hover outline glow.

src/projections/
  temporal-map.ts               + planeId option, landmark-glyph filtering, waypoint list, planes list.
  map-snapshot-diff.ts          PURE diffMapSnapshots(prev, next).
  map-adapter.ts                + planeId mapping, waypoint derivation.

src/components/map/
  RpgWorldAtlas.tsx             Rewired to retained renderer; hosts DOM overlays.
  AtlasFrame.tsx                Ornate pixel frame overlay with universe runes.
  AtlasTooltip.tsx              D4-style hover card (DOM, Silkscreen).
  WaypointPanel.tsx             Fast-travel list grouped by plane/region.
  DiscoveryBanner.tsx           "NEW AREA DISCOVERED" banner with coalescing.
  AtlasMinimap.tsx              Minimap from baked texture + fog + camera frustum.
  MapHudControls.tsx            + waypoint button; plane selector drives real planes.
  MapLocationDrawer.tsx         Unchanged behavior; receives plane-aware data.
  MapTimelineBar.tsx            Unchanged behavior.
```

### 3.3 Scene graph (9 top-level containers preserved)

| # | Container | Contents | Rebuild trigger |
|---|---|---|---|
| 1 | `backgroundContainer` | Plane backdrop (void/sky/sea beyond land) | plane/theme change |
| 2 | `terrainContainer` | Baked terrain + glyph sprite (one sprite per plane) | map/plane/theme change |
| 3 | `regionsContainer` | Region borders (hover highlight), faction territory tints | plane change; territory alpha tweened on chapter |
| 4 | `routesContainer` | Animated routes | plane change; per-route reveal on chapter |
| 5 | `characterPathContainer` | Journey trail + hero token (hero-layer) | diff-driven |
| 6 | `markersContainer` | Keyed marker display objects | diff-driven add/remove/update |
| 7 | `fogContainer` | Fog sprite with dither filter | mask re-render only on reveal set change |
| 8 | `atmosphereContainer` | Particles, cloud shadows, torch-light, FX | persistent; FX transient |
| 9 | `labelsContainer` | BitmapText labels | diff-driven; LOD alpha per zoom |

### 3.4 Data flow

```
map.json | adaptGraphToWorldMap(graph)
        -> WorldMapDefinition (Zod-validated)
        -> projectTemporalMap(def, userChapter, { planeId, activeCharacterId })   [pure]
        -> ProjectedWorldMapSnapshot
        -> diffMapSnapshots(prevSnapshot, snapshot)                               [pure]
        -> PixiWorldRenderer.applySnapshot(snapshot, diff, theme)
              static layer: cached per plane (bake on first visit)
              dynamic layers: add / remove / tween per diff
```

`renderSnapshot()` remains as a public method (full sync, used on mount/plane/theme change and by existing tests); chapter updates go through `applySnapshot()`.

---

## 4. Data & Schema Changes

All additions are optional so existing data remains valid.

```ts
interface MapPlane {
  id: string;
  name: string;
  width: number;
  height: number;
  revealedAtChapter: number;
  backdrop: 'void' | 'sky' | 'sea' | 'abyss' | 'river';
  order?: number;
}

interface WorldMapDefinition {
  // existing fields…
  planes?: MapPlane[];              // absent => single implicit plane 'main' of width×height
  landmarkGlyphs?: LandmarkGlyph[];
}

interface LandmarkGlyph {
  id: string;
  glyph: 'volcano' | 'spire' | 'ruin' | 'great-tree' | 'citadel' | 'crater' | 'monolith' | 'shipwreck' | 'portal-arch' | 'skull-rock';
  x: number;
  y: number;
  planeId?: string;
  scale?: number;
  revealedAtChapter: number;
}

// planeId?: string added to:
TerrainLayer, MapRegion, MapLocation, MapRoute, FactionTerritory, CharacterWaypoint

// additional fields:
MapLocation.waypoint?: boolean;
MapLocation.dangerLevel?: 'EX' | 'S' | 'A' | 'B' | 'Safe';
TerrainLayer.edgeStyle?: 'coast' | 'cliff' | 'soft';
```

Entities without `planeId` belong to the first plane (or the implicit `main` plane).

### 4.1 Projection changes (`projectTemporalMap`)
- New option `planeId`. When set, all spatial collections are filtered to that plane. When omitted, the first plane.
- Snapshot additions:
  - `planeId: string`
  - `planes: { id, name, isRevealed }[]` — a plane with `revealedAtChapter > userChapter` is listed as `isRevealed: false` and shown as `??? SEALED REALM`, not selectable.
  - `landmarkGlyphs`: only `revealedAtChapter <= userChapter`, on the active plane.
  - `waypoints: { locationId, name, planeId, regionId }[]` — discovered (`DISCOVERED | REVEALED | CURRENT`) waypoint locations **across all revealed planes** (for the fast-travel panel).
  - `heroPosition`: current hero waypoint (plane-aware); `null` if the hero is on another plane.
- Hero waypoints on other planes are excluded from the active plane's path.
- Discovery statuses and all existing behavior otherwise unchanged.

### 4.2 Adapter changes (`adaptGraphToWorldMap`)
- Emits `planes` from graph planes; each location/terrain/region/route gets the `planeId` of its source plane.
- Waypoint derivation rule: `importance === 'critical'` OR `type ∈ { city, sect, portal, castle, temple }`.
- `dangerLevel` passed through from `LocationEntity.danger_level`.

### 4.3 Snapshot diff (`diffMapSnapshots(prev, next)`)
Pure; returns:
```ts
interface MapSnapshotDiff {
  planeChanged: boolean;
  addedLocationIds: string[];       // became visible (not UNKNOWN)
  removedLocationIds: string[];     // backward scrub
  newlyDiscoveredIds: string[];     // fogStatus crossed into DISCOVERED/REVEALED/CURRENT (forward only)
  concealedIds: string[];           // backward: fell out of discovered set
  statusChanges: { id: string; from: FogStatus; to: FogStatus }[];
  addedRouteIds: string[];
  removedRouteIds: string[];
  hero: { from: Point | null; to: Point | null; path: Point[]; direction: 'forward' | 'backward' | 'none' };
  addedGlyphIds: string[];
  removedGlyphIds: string[];
}
```
`hero.path` is the ordered waypoint coordinates between previous and current hero positions (inclusive), clipped to `next.userChapter`.

---

## 5. Visual Design (pixel-gothic)

### 5.1 Pixel pipeline
- Static layer is painted at **world resolution / 2** into a RenderTexture, then displayed with `scaleMode: 'nearest'` at 2× — every "pixel" is a 2×2 world unit block, crisp at all zooms.
- Colors come from `pixel-palette.ts`: for each theme and each `TerrainType`, a 4-tone ramp (deep, base, light, highlight). Palettes are derived from the theme's existing accents and land/sea/mountain colors, so the look stays per-universe.

### 5.2 Terrain painter
- Fill each polygon with its biome base tone.
- Elevation banding: an inner inset (polygon offset inward by N px per elevation step) filled with the next ramp tone; the boundary between tones is ordered-dithered (4×4 Bayer) for a pixel gradient.
- Edges by `edgeStyle`:
  - `coast`: 2px deep-tone outline + 1px highlight inside + animated 1px foam ring outside (foam lives in routes layer to stay animated).
  - `cliff`: 3px dark outline with stepped shadow offset (+2, +2).
  - `soft` (default for interior borders): 1px dithered blend.
- Ocean/sea polygons get a sparse wave-glyph scatter (tiny `~` pixels).
- Rivers render as polylines with 3px width, deep outline, and highlight center line.

### 5.3 Glyph scatter
- `scatterGlyphs(polygon, terrainType, seed, density)` → `{ glyph, x, y, variant, scale }[]` via Poisson-disk sampling with a seeded PRNG (mulberry32). Seed = hash(`mapId + terrainId`). No `Math.random`.
- Glyph set per terrain: mountain (peaks, 3 variants), forest (pines, 3), desert (dunes, 2), swamp (reeds, 2), ice (shards, 2), volcanic (vents, 2), void (cracks, 2), plains (grass tufts, sparse), ocean (waves, sparse).
- Glyphs are procedural pixel sprites (defined as small pixel-grid string maps, rendered to textures once), tinted with the biome ramp; each has a 1px drop shadow.
- Scatter avoids a 22px radius around every location marker to keep icons readable.
- Glyphs are sorted by y for correct overlap.

### 5.4 Frame, lighting, labels
- **AtlasFrame** (DOM overlay, fixed to viewport): 9-slice pixel border (dark iron / bone per theme), corner filigree, universe rune in each corner, inner bevel. Implemented as an inline SVG with `shape-rendering: crispEdges`.
- **Vignette**: world tinted darker toward edges (CSS radial overlay, existing, tuned stronger).
- **Torch-light**: additive radial light sprites (pre-rendered gradient texture, stepped into 6 bands for pixel look) around hero (warm, flickering ±4% via noise) and cursor (faint).
- **Labels**: `BitmapFont.install` from Silkscreen at 2 sizes.
  - Region titles: large, letter-spaced, 60% alpha, visible at zoom < 1.4, fade out as zoom increases.
  - Landmark labels: visible at zoom ≥ 0.9 for critical, ≥ 1.3 for major, ≥ 1.8 for minor.
  - Labels get a 1px dark outline for legibility.
  - KNOWN (not discovered) locations: no label.

### 5.5 Markers
- Icon from `icon-atlas.ts` by `LocationType` (city, village, sect, clan, castle, ruin, dungeon, mountain, cave, battlefield, temple, ocean, island, portal, landmark, lake). 16×16 pixel grids, rendered 2×.
- Pedestal ellipse shadow beneath each icon.
- Danger ring color: EX crimson, S orange, A amber, B slate-blue, Safe emerald; ring shown only at zoom ≥ 1.0.
- Critical landmarks bob ±1px on a 2.4s sine.
- CURRENT location: pulsing halo (tweened scale/alpha loop).
- KNOWN (visible-in-fog) locations: silhouette icon (single dark tone), no interaction beyond tooltip `??? UNCHARTED`.
- Waypoint locations additionally render a small shrine pylon glyph beside the icon that glows when discovered.
- Existing per-location SVGs in `public/assets/pixels/<slug>/locations/` are used in the tooltip and drawer as portrait art (not on the map, to keep iconography consistent).

### 5.6 Routes and journey trail
- Roads: 2px pixel dashes animated along the polyline (dash offset advanced per tick).
- Sea lanes: dotted, slower, lighter.
- Flight/portal: arced dashed lines with shimmer.
- Secret routes: only visible at REVEALED.
- Journey trail: 3px glowing line in secondary accent, draws itself in along new segments when the hero walks (stroke length tweened).

### 5.7 Atmosphere
Per-theme particle kinds (extends `MapTheme.atmosphereParticles.type`):
- Coiling Dragon: embers rising.
- Reverend Insanity: ink mist wisps.
- Lord of the Mysteries: arcane motes + faint fog.
- One Piece: sea spray and gulls (tiny 3-px sprites).
- Solo Leveling: blue mana sparks.
- Demonic Emperor: blood ash falling.

Plus 3–5 large, low-alpha cloud-shadow sprites drifting slowly across land. Particles are persistent across chapter changes (created once per plane).

---

## 6. Interactions

### 6.1 Pointer and input
- `PointerController` owns all canvas input: drag starts only after 4px movement; a pointer-up without drag on a hit target = click.
- Hit-testing via Pixi event system on marker/region display objects; hover state tracked by id and survives chapter changes (markers are retained).
- Wheel zoom anchored on cursor; pinch zoom (two pointers) anchored at midpoint.
- Keyboard (when the atlas has focus): WASD / arrows pan, `+`/`-` zoom, `M` toggles waypoint panel, `Esc` closes panel/drawer/tooltip.

### 6.2 Hover
- Marker scales to 1.25 (tween 120ms) and gets `glow-outline-filter` in theme accent.
- `AtlasTooltip` shows at `camera.worldToScreen(loc)` offset, flipping to stay inside the viewport:
  - Header bar with type icon + name (or `??? UNCHARTED` for KNOWN).
  - Type, danger rating, controlling faction (if active at chapter), first-seen chapter, count of events at this location up to `userChapter`, portrait art if available.
  - Footer hint: `CLICK — OPEN DOSSIER` (and `WAYPOINT` badge if applicable).
- Region hover: border brightens and region name shows in tooltip.

### 6.3 Click
- Location: opens existing `MapLocationDrawer` and flies camera to location (zoom 1.8, 450ms).
- Region: selects region in drawer (existing behavior).
- Event glyph: selects event (existing behavior).

### 6.4 Hero marker
- Token: character avatar from `public/assets/pixels/<slug>/avatars/` (fallback: pixel initial) inside a round pixel frame with a torch-light.
- On `diff.hero.direction === 'forward'`: walk along `diff.hero.path` at constant speed (~220 world px/s), capped to 1.6s total; trail draws in behind.
- On `'backward'`: walk back along path; trail retracts.
- On plane change or jump > 12 waypoints: short fade-out / fade-in at destination (no walk).
- Retargeting: a new diff mid-walk re-plans from the token's current interpolated position to the new target — no animation queue.
- The token's destination is always the projected hero position for the current `userChapter`; it never animates beyond it.
- If the hero is on another plane, a small edge-of-map indicator shows `HERO IN <PLANE>` (click to warp there).

### 6.5 Waypoint fast-travel
- `WaypointPanel` (button in HUD + `M`): lists `snapshot.waypoints` grouped by plane → region, with icon, name and a `CURRENT` badge where the hero stands.
- Selecting a waypoint:
  1. Warp FX at current camera center (spiral collapse + white flash, 350ms), `playPlaneWarp()` (only if not muted; this is a user gesture).
  2. If different plane: switch plane (baked texture from cache or bake), fade transition.
  3. Camera cuts to target at zoom 1.8, then warp FX expands at destination.
  4. Location selected (drawer opens), `?loc=` URL param updates via existing handler.
- Fast travel moves the camera only; the hero stays at its canon position.

### 6.6 Live fog reveal
- Fog mask: a RenderTexture at 1/4 world resolution. Each discovered location / hero waypoint is a soft radial circle (critical 70px, other 45px, waypoints 50px — current values retained).
- Fog sprite = fog color fill, masked by inverted reveal texture, passed through `dither-fog-filter`: the shader thresholds the mask alpha against a 4×4 Bayer matrix, producing pixel-dithered edges; a slow noise offset animates the fog interior (drifting clouds).
- Reveal animation: for each `diff.newlyDiscoveredIds`, the aperture radius tweens 0 → r over 900ms (ease-out) and an ember-ring burst plays in fx-layer at the edge.
- Conceal (backward scrub): aperture tweens r → 0 over 400ms, no burst.
- `DiscoveryBanner`: on newly discovered ids, show `NEW AREA DISCOVERED: <name>` (Silkscreen, gothic plate). Rapid scrubbing coalesces: banner shows the latest name plus `+N MORE`, and restarts its 2.5s timer instead of queuing.
- Fog toggle (HUD) still disables fog layer entirely.

### 6.7 Plane switching
- Plane selector lists `snapshot.planes`; unrevealed planes show locked `??? SEALED REALM`.
- Switching plays a warp transition (fx + `playPlaneWarp()` on user click), swaps baked static texture (cached per plane), and resets camera to plane fit.
- Plane choice is added to URL params as `plane=<id>` (deep-link parity).

### 6.8 Minimap
- `AtlasMinimap` (bottom-right, collapsible): a downscaled copy of the baked plane texture (extracted once per bake), fog overlay from the fog mask texture, hero dot, and a camera frustum rectangle. Click/drag on minimap pans camera.

### 6.9 Reduced motion
With `prefers-reduced-motion: reduce`: no hero walk (instant move), no reveal bursts or warp spiral (simple fade), particles and cloud drift disabled, marker bob disabled.

---

## 7. Zero-Spoiler Rules for New Surfaces

1. All glyph scatter is generic terrain decoration and cannot reveal canon; landmark glyphs are filtered by `revealedAtChapter` in the projection.
2. Fog can be toggled off, so nothing under fog may carry spoiler information; all spoiler filtering happens in `projectTemporalMap`, never in the renderer.
3. Tooltips, labels, waypoint panel, discovery banner, minimap and plane list are built exclusively from the current snapshot/diff.
4. KNOWN locations show only `??? UNCHARTED` and a silhouette.
5. Hero position is never interpolated past the projected position for `userChapter`.
6. Unrevealed planes appear only as `??? SEALED REALM`.

---

## 8. Performance & Resource Management

- Static layer baked once per (map, plane, theme); cached in a `Map<string, RenderTexture>`; cache cleared on universe change and unmount.
- Fog mask texture re-rendered only when the aperture set or an aperture tween changes.
- Marker display objects pooled and keyed by id; diff drives add/remove.
- BitmapText for labels (no per-label canvas textures).
- Particles: one `ParticleContainer` per plane; counts capped per theme (≤ 120).
- Target: 60 fps at 200 locations, 2000 glyphs (baked, so glyph count is free after bake).
- `destroy()` releases RenderTextures, filters, BitmapFonts installed by the atlas, tweens, listeners, and the Pixi app.
- SSR/test safety preserved: all Pixi construction guarded; pure modules have no Pixi imports.

---

## 9. Reverend Insanity Pilot Map

Re-author `data/reverend-insanity/map.json` with organic geometry following the novel's cosmology as closely as possible:

- **Plane `mortal-five-regions`** (e.g. 1600×1100): Central Continent at the center; Southern Border south (karst mountain terrain); Northern Plains north (grassland, Imperial Court blessed land); Western Desert west (dune fields, oases); Eastern Sea east (irregular coastline, archipelagos). **Regional Walls** rendered as cliff-edged mountain ranges separating regions. Regions with 60+ vertices each.
- **Plane `immemorial-two-heavens`**: White Heaven and Black Heaven as floating sky-island clusters over a `sky` backdrop.
- **Plane `river-of-time`**: a winding river across an `abyss` backdrop with Stone Lotus islands.
- All 18 existing locations placed on the correct plane with `planeId`, `dangerLevel`, and `waypoint` flags (key clans, sects, Heavenly Court, blessed lands).
- Landmark glyphs: Crazed Demon Cave (skull-rock), Yi Tian Mountain (spire), Heavenly Court (citadel), Reverse Flow River source (portal-arch), and others, each with canon `revealedAtChapter`.
- Fang Yuan's journey waypoints get `planeId` so cross-plane travel is tracked.
- Existing routes, territories and events migrated to the new coordinates; chapters unchanged.

The data must still pass `WorldMapDefinitionSchema` and `tests/reverend-insanity.test.ts` (updated where coordinates are asserted).

---

## 10. Testing & Verification

### New unit tests
- `glyph-scatter.test.ts`: deterministic output for same seed; different seeds differ; all points inside polygon; exclusion radius around markers respected.
- `pixel-palette.test.ts`: every theme × terrain type yields 4 valid colors.
- `map-snapshot-diff.test.ts`: forward reveal, backward conceal, hero forward/backward path, plane change, no-op diff, route/glyph add/remove.
- `temporal-map.test.ts` additions: plane filtering; landmark glyph spoiler filter; waypoints list only discovered; sealed planes; hero position never beyond `userChapter`; hero on other plane → `heroPosition: null`.
- `map-adapter.test.ts` additions: planes emitted; planeId assignment; waypoint derivation rule.
- `map-schema.test.ts` additions: new optional fields validate; invalid values rejected.
- `tween.test.ts`: interpolation, easing, retarget mid-flight, cancel.
- `camera-controller` tests: `worldToScreen`/`screenToWorld` round-trip at various zooms; pinch anchor.
- `pointer-controller.test.ts`: drag threshold distinguishes click from drag.

### Updated tests
- `pixi-renderer.test.ts`: 9 containers still asserted; add plane cache, applySnapshot diff path, destroy releases cache.
- `rpg-atlas-component.test.ts`: waypoint panel, plane selector with sealed planes, tooltip rendering from snapshot.
- `reverend-insanity.test.ts`: new plane structure.

### Commands
- `npm test` all green; `npx tsc --noEmit` clean; `npm run build` succeeds; `npm run build:extension` unaffected.

### Visual verification
- Run `npm run dev`, capture Chrome screenshots of all 6 universes at early / mid / late chapters, plus a GIF of: chapter scrub (hero walk + fog reveal + banner), hover tooltip, waypoint fast-travel, plane warp.

### Docs
- Update ARCHITECTURE.md §5 (module layout, retained renderer, diff, planes), DESIGN_SYSTEM.md (pixel-gothic map palette, icons, frame, fog), TODO.md (new items; mark mobile pinch done).

---

## 11. Out of Scope (Spec 2 and beyond)

- Organic hand-authored `map.json` for Coiling Dragon, Demonic Emperor, Lord of the Mysteries, One Piece, Solo Leveling.
- Isometric local scenes when zooming deep into a location.
- Chrome extension map views.
