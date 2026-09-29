# Level-Select Tileset World Atlas — Design Spec (v2)

- **Date:** 2026-09-29
- **Status:** v2 — rewritten after the visual spike; pending written-spec review
- **Supersedes:** v1 "pixel-gothic Diablo atlas" (commit `910fddc`). The engine architecture of v1 is kept; the art direction and art pipeline are replaced.
- **Scope:** Spec 1 of 2 — renderer rewrite + tileset art pipeline + Reverend Insanity re-author. Spec 2 (later) hand-authors organic maps for the remaining 5 universes (they already benefit from this spec through automatic coast roughening).

---

## 1. Intent

### What the user asked for
- A map that feels like an RPG game world map, "more graphical and interactive".
- After seeing the v1 direction, the user supplied a target reference: a bright 16-bit **"LEVEL SELECT / WORLD 1"** overworld — dense tree clumps, shaded snow-capped mountain ranges, lakes, a river with a bridge, castle, cave, ship, winding dirt path with numbered stage nodes, ornate frame. The map "should look like at least" that.
- Current tool look (confirmed by screenshot): flat translucent rectangles, straight lines, tiny diamonds, dark void.

### Decisions made with the user
| Topic | Decision |
|---|---|
| Map type | Top-down overworld atlas (not an isometric walkable world) |
| Art source | **Real pixel tilesets**, composed from map data (not code-drawn glyphs, not per-plane painted images) |
| Mood | **Per-universe palette**: same tiles, each universe color-graded (RI jade, LotM misty violet, One Piece bright ocean, Solo Leveling dark dungeon, etc.) |
| Mountains | Download CC-BY 3.0 mountain tiles; attribution required |
| Interactions (v1, kept) | Hover tooltips + glow, animated hero marker, waypoint fast-travel, live fog reveal |
| Terrain data | Hand-authored `map.json` per universe; RI re-authored in this spec |
| Planes | Real per-plane canvases (plane selector works, `?plane=` deep link) |
| Quality bar | "Absolute best, even if we have to rewrite." |

### Spike evidence (throwaway, not product code)
An offline Python/PIL composer rendered the RI mortal plane from the v1 organic control points plus the tilesets. Result matched the reference look: jagged coasts with shallows, sand rim and foam; forest clumps plus lone trees; snowy mountain chains; desert with oasis and palms; river with bridge; castles/halls/houses/caves; winding dirt path with numbered nodes; framed border. A violet grade of the same render proved the per-universe palette. Spike defects to avoid in the product: square wall layout (a data problem), overly uniform peaks.

### Constraints (from repo rules)
- PixiJS only for rendering; no Mapbox/Leaflet/tile services (AGENTS.md §4.5). Static image assets under `public/` are allowed (the repo already ships pixel SVGs there).
- Zero-spoiler temporal integrity: all chapter filtering in `projectTemporalMap`; projections pure.
- URL deep-link parity (`?ch=&tab=&char=&loc=`) plus new `plane=`.
- Audio only on user gesture, `isMuted`-guarded.
- Works for all 6 universes; the 5 without `map.json` go through `adaptGraphToWorldMap()`.

### Success criteria
- Side by side with the reference, the RI mortal plane reads as the same genre and quality: textured grass, dense forests, mountain ranges, shaded water with shore, props, dirt paths, numbered nodes, frame.
- Each universe is recognizably tinted.
- Adapter universes no longer look like rectangles (coasts roughened automatically).
- Scrubbing animates (hero walks the dirt path, fog clouds part, discovery banner); hover/click/fast-travel/plane warp responsive at 60 fps.
- No spoiler leak through any surface.
- All tests green; `npm run build` passes; art licenses honored (CREDITS.md + in-app credit line).

---

## 2. Art Assets & Licensing

| Sheet | File | Size | License | Use |
|---|---|---|---|---|
| Puny World overworld tileset (Shade) | `public/assets/tilesets/punyworld/punyworld-overworld-tileset.png` | 432×1040 | **CC0** | grass, conifers, round trees, palms, rocks, castles, halls, houses, cave |
| Worldmap mountains (MrBeast, commissioned by OpenGameArt.org) | `public/assets/tilesets/oga-worldmap/mountains.png` | 192×160 | **CC-BY 3.0** | grey and snow peaks |

- Attribution: `CREDITS.md` at repo root plus a small "Art credits" line in the atlas frame linking to the source pages.
- Code-drawn pixel sprites (v1) remain only for things the sheets lack: fallback location icons (battlefield, portal, landmark, ruin, ocean, island, lake), landmark glyphs (volcano, spire, crater, …), waypoint pylon, numbered badges.

---

## 3. Architecture

### 3.1 Unchanged from v1
Plane-aware projection, pure snapshot diff, retained/coalescing `PixiWorldRenderer` facade with 9 containers, tween manager, gesture tracker, deterministic picking, markers/routes/hero/fog/fx/atmosphere/labels layers, DOM overlays (tooltip, discovery banner, waypoint panel, frame, minimap), plane deep links, fresh canvas per renderer instance, world-anchored fog mesh shader.

### 3.2 Replaced: the static art pipeline
v1 painted Pixi `Graphics` with biome ramps and scattered 8×8 code-drawn glyphs. v2 composes each plane from tilesets on a Canvas 2D surface in two strictly separated stages:

```
snapshot.terrain / rivers / plane  (never chapter-gated)
      │
      ▼
buildPlaneLayout(snapshot)            PURE, deterministic, node-testable
  • world → pixel space (0.5 px per world unit; 1 tile = 32 world units)
  • coast roughening: fractal midpoint displacement of every terrain ring,
    capped at ~256 vertices per ring (dense hand-smoothed rings get fewer iterations)
  • fills in terrain order: ground kinds, `lake` (water enclosed by land) or
    `water` (open sea); fills carry bounding boxes for fast point queries
  • grass tone patches, forest/lone trees, mountain peaks, desert rocks,
    oasis palms — seeded value-noise + jittered grids, y-sorted
  • rivers + bridges
      │  PlaneLayout (plain data)
      ▼
paintPlane(ctx2d, layout, sheets, look)   browser only; tested with a recording fake context
  • backdrop (sea/sky/abyss/void/river) with deep-water blobs and wave glints
  • open-water fills in plain sea color (before the coast, so shores stay intact)
  • shelf / shallows / sand rim / foam strokes around land (sea & river backdrops),
    cloud rim (sky), drop shadow (abyss/void)
  • ground fills (grass tile pattern, sand, snow, ash, bog, voidstone)
  • lake fills with sand rim (lakes, oases)
  • river strokes + bridges
  • stamps (trees, peaks with triangle-masked silhouettes + outline, rocks, palms)
  • per-universe color grade (pure pixel function)
      │  canvas
      ▼
Texture.from(canvas), nearest filtering, displayed at 2× (world units)
```

Spoiler rule: the layout uses only terrain, rivers and plane data, which are never chapter-gated. Locations, events, routes, territories and landmark glyphs stay dynamic in layers. Trees are **not** cleared around locations at bake time (that would reveal future locations with fog off); instead each visible marker draws a grass clearing under itself.

### 3.3 Module layout (changes vs v1)

```
src/engine/map/scene/
  prng.ts, geometry.ts        kept (+ jagPolygon)
  noise.ts                    NEW  seeded value noise + fbm
  sprite-catalog.ts           NEW  sheet table (url, size, license, credit) + sprite rects + location→prop map
  tile-atlas.ts               NEW  loads sheets (Pixi Assets), sub-textures for markers, raw images for painter
  universe-look.ts            NEW  per-universe grade + water/sand/fog colors; pure gradePixels()
  pixel-palette.ts            SLIMMED  color math, DANGER_COLORS, sprite palettes for code-drawn sprites
  pixel-sprites.ts            SLIMMED  fallback icons, landmark glyphs, pylon (terrain glyphs removed)
  icon-atlas.ts               SLIMMED  code-drawn textures + soft disc (glyph() removed)
  plane-layout.ts             NEW  pure layout
  plane-painter.ts            NEW  Canvas 2D executor
  (glyph-scatter.ts, terrain-painter.ts, static-baker.ts from v1 are dropped)
```

### 3.4 Data flow (unchanged shape)
`map.json | adaptGraphToWorldMap → projectTemporalMap(def, ch, { planeId }) → diffMapSnapshots → PixiWorldRenderer.applySnapshot()`; the static plane is baked on first visit per `(mapId, planeId, universe)` and cached.

---

## 4. Data & Schema

All v1 additions stay (planes, `planeId` everywhere, `waypoint`, `dangerLevel`, `landmarkGlyphs`, `edgeStyle` — the last is accepted but ignored by the v2 painter). New:

```ts
interface MapRiver {
  id: string;
  name: string;
  points: [number, number][];   // world units, ≥ 2
  width: number;                // world units
  planeId?: string;
  bridges?: [number, number][]; // world points where a bridge is drawn
}
WorldMapDefinition.rivers?: MapRiver[];
```

- Zod: `MapRiverSchema`; river points and bridges bounds-checked against their plane.
- Projection: `snapshot.rivers` = rivers on the active plane (not chapter-gated: rivers are geography).
- Lakes/oases: `ocean`/`river`-typed terrain polygons whose centroid lies inside a land fill become **lakes** (sand rim, shallows). Other water polygons are **open sea**, painted plain and under the coastline.
- Adapter (fallback) maps: plane regions hold locations, so they are always land (water inferences become `plains`, slug-based mountain/ocean fallbacks removed); the whole-plane base is `plains`, or omitted on sea-backdrop universes (One Piece, Lord of the Mysteries) so plane regions read as islands.
- Mountain ranges: thin winding `mountain` polygons (hand-authored as ribbons around spine lines).

Terrain type → paint class:

| TerrainType | Class | Decoration |
|---|---|---|
| plains, custom | grass | tone patches, sparse clumps (noise > 0.62), lone trees |
| forest | grass | dense trees (noise > 0.42) |
| mountain | grass | peaks, 35% snow, small peaks near edges |
| desert | sand | rocks/stones; palms ring any water inside |
| ice | snow | rocks |
| volcanic | ash | rocks |
| swamp | bog | round trees, sparse |
| void | voidstone | rocks |
| ocean, river | water | — |

---

## 5. Visual Design

### 5.1 Scale
- Baked texture: 0.5 px per world unit; sprites keep native 16 px tiles, so 1 tile = 32 world units (reference-like chunkiness). RI mortal plane 1600×1100 world → 800×550 px texture shown at 2×.
- Markers/props on the live layers use the same sheets at scale 2 (world units per sheet pixel) so baked and live art match.

### 5.2 Water and coasts
- Sea: base blue, darker deep blobs from noise, sparse wave glints.
- Around land: shelf (lighter, 14 px), shallows (7 px), sand rim (3 px), 1 px foam line.
- Coast roughening: every terrain ring is jagged with seeded fractal midpoint displacement (4 iterations, amplitude ∝ plane size) — organic shapes even from rectangles.

### 5.3 Land
- Grass: 64 px pattern tile assembled from 4 Puny grass tiles, plus darker noise patches.
- Forests: individual conifers (70%) and round trees on a jittered 8×7 px grid where noise passes the threshold, y-sorted so canopies overlap.
- Mountains: peaks sampled from the MrBeast sheet, clipped to a triangle silhouette with a 1 px dark outline, 9×7 px jittered grid, snow variants 35%.
- Desert: sand with speckle, rocks, oasis palms.

### 5.4 Per-universe look (`UNIVERSE_LOOKS`)
Each universe defines `tint`, `amount`, `saturation` (applied by `gradePixels`), and water/sand/foam/fog colors:

| Universe | Tint / amount / saturation | Feel |
|---|---|---|
| reverend-insanity | `#14966e` / 0.12 / 0.90 | jade, misty |
| lord-of-the-mysteries | `#503282` / 0.22 / 0.60 | Victorian violet fog |
| coiling-dragon | `#f0a030` / 0.08 / 1.05 | warm amber |
| demonic-emperor | `#8a1830` / 0.16 / 0.75 | crimson dusk |
| one-piece | `#1080d0` / 0.05 / 1.10 | bright ocean |
| solo-leveling | `#102850` / 0.25 / 0.70 | dark dungeon blue |

Fog is soft cloud (light, per-universe `fogColor`), not black.

### 5.5 Markers, paths, badges
- Location props from the sheets: city → castle, castle → red castle, sect/temple → teal hall, clan/village → house, dungeon/cave/mountain → cave; other types use the code-drawn fallback icons.
- Each visible marker draws a grass clearing ellipse under itself.
- KNOWN (undiscovered) locations: prop tinted to a dark silhouette at 70% alpha, no pylon, tooltip `??? UNCHARTED`.
- Hero trail rendered as the reference's dirt path (dark brown edge, tan center); roads the same; sea lanes dotted white; flight/portal shimmering dashes; secret routes dashed red.
- **Numbered stage badges**: gold square badges numbered by the order the hero first visited each location on this plane, only for visits ≤ current chapter.

### 5.6 Frame, labels, lighting, atmosphere
Ornate pixel frame (universe rune corners) + "Art credits" link; Silkscreen labels with zoom LOD; hero torch-light kept subtle; per-universe particles kept.

---

## 6. Interactions
Unchanged from v1: hover tooltips with glow, click → dossier + fly, walking hero (retargetable, capped 1.6 s, never ahead of the chapter), waypoint panel (`M`) with warp FX and cross-plane warps, fog clouds parting with ember bursts and coalescing "NEW AREA DISCOVERED" banner, sealed planes, minimap with frustum, keyboard (WASD/arrows/±/M/Esc), pinch zoom, reduced-motion support.

---

## 7. Zero-Spoiler Rules
1. **Geography is intentionally ungated; names are gated.** The baked layer contains the physical world — terrain, coastlines, lakes, rivers, bridges, decoration — from chapter 1, because the shape of the land is not a narrative spoiler (a real atlas shows the whole continent). Everything that carries story information stays chapter-gated in the projection: location markers and names, labels, region names in tooltips and the waypoint list, events, routes, the hero trail, territories, landmark glyphs, planes.
2. No bake-time clearing around locations (that would pin down *where* unrevealed places are); clearings are drawn by visible markers only.
3. Tooltips, labels, badges, waypoint list, banner, minimap and plane list come only from the snapshot/diff.
4. KNOWN locations: silhouette, `??? UNCHARTED`, no pylon, no badge.
5. Hero position never interpolated past the projected position; badges only for visits ≤ chapter.
6. Unrevealed planes appear only as `??? SEALED REALM`.

---

## 8. Performance
- Layout: ≈ 8k candidates on the RI mortal plane; bounding-box rejection plus the ~256-vertex ring cap keep it well under the tested budget of 250 ms in node (typically tens of ms in the browser).
- Paint: one Canvas 2D pass per plane (≈ 800×550 px) + one `getImageData`/`putImageData` grade; cached per `(map, plane, universe)`.
- Live layers unchanged from v1 (pooled, keyed, diff-driven).
- Sheets loaded once through Pixi `Assets` and shared by painter and markers.

---

## 9. Reverend Insanity Re-author
- Mortal plane (1600×1100, sea): four landmasses (Northern Plains, Western Desert, Central Continent, Southern Border) plus Eastern Sea islands; **regional walls as thin winding mountain ribbons** (not a square ring); karst ranges in the south; **rivers**: Reverse Flow River across the Northern Plains to the west coast, a southern river from the karst to the sea, each with a bridge where the journey path crosses; Crescent Lake; desert oasis.
- Two Heavens (1400×800, sky): White Heaven (ice) and Black Heaven (void) island clusters.
- River of Time (1400×700, abyss): winding water ribbon with Stone Lotus islands.
- Locations, landmark glyphs, routes, territories and journey waypoints as in v1 (ids, chapters and metadata preserved).

---

## 10. Testing & Verification
- Pure units: schema (rivers), projection (rivers per plane), diff, geometry + `jagPolygon`, noise, sprite catalog (rects inside sheets, credits), universe look + `gradePixels`, plane layout (determinism; stamps inside land and outside water/rivers; forest has trees, mountains have peaks, desert has none; y-sorted; pixel scale), tween, gestures, picking, walker, apertures, labels LOD, UI state helpers.
- Painter: recording fake 2D context (backdrop first, one drawImage per stamp, grade applied once, sheet-missing tolerance).
- Layers & facade: headless (renderer null) as in v1.
- Browser smoke check in the wiring task (console clean, baked plane visible, fog, dither anchored, StrictMode, `?loc=` on mount) and full in-browser review at the end with side-by-side comparison to the reference.
- `npm test`, `npx tsc --noEmit`, `npm run build`, `npm run build:extension`.

---

## 11. Out of Scope
- Hand-authored organic maps for the other 5 universes (spec 2).
- Isometric local scenes; animated water tiles; ships/boats (no licensed sprite yet).
- Chrome extension map views.

---

## 12. Implementation Deviations (recorded)
1. Hover glow is an additive, accent-tinted back-sprite rather than an outline filter.
2. No bake-time tree clearing around locations (spoiler reason); markers draw clearings.
3. `LocationEntity` has no danger field, so adapter maps leave `dangerLevel` undefined.
4. Secret routes are chapter-filtered in the projection.
5. Fog is a custom world-space Mesh shader (not a Filter); WebGL/GLSL only.
6. `edgeStyle` stays in the schema for compatibility but the v2 painter ignores it.
