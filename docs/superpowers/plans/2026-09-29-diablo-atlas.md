# Diablo-Style Pixel-Gothic World Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the OmniLore map into a retained, diff-driven, pixel-gothic Diablo IV–style world atlas with real multi-plane support, animated hero, live dithered fog reveal, hover tooltips and waypoint fast-travel, and re-author the Reverend Insanity map as the showcase.

**Architecture:** Pure layers stay pure: `projectTemporalMap` (now plane-aware) produces a zero-spoiler snapshot, and a new pure `diffMapSnapshots` compares consecutive snapshots. `PixiWorldRenderer` becomes a thin facade over focused modules: a static baker (terrain + scattered glyphs baked to one nearest-scaled texture per plane) plus retained dynamic layers (markers, routes, hero, fog with a Bayer-dither shader, FX, atmosphere, labels) that animate diffs instead of redrawing. React hosts DOM overlays (frame, tooltip, banner, waypoint panel, minimap).

**Tech Stack:** Next.js 16 (App Router, client component), React 19, PixiJS 8.21 (WebGL preference, custom GLSL Mesh shader), Zod 3, Vitest 3, TypeScript 5 strict, Tailwind 3.

**Spec:** `docs/superpowers/specs/2026-09-29-diablo-atlas-design.md`

## Global Constraints

- PixiJS only for map rendering; no Mapbox, Leaflet, map tiles or new rendering dependencies (AGENTS.md §4.5). No new npm dependencies at all.
- Every visible map element derives from `projectTemporalMap(def, userChapter, { planeId, activeCharacterId })`. All spoiler filtering lives in `src/projections/`, never in the renderer.
- Projections and diff functions are pure: never mutate inputs; no `Math.random`, no Pixi imports.
- Glyph scatter is deterministic: seed = `hashString(mapId + ':' + terrainId)`, PRNG = mulberry32.
- Audio only in response to a user gesture, via `SoundEngine.playPlaneWarp()` (already `isMuted`-guarded).
- URL deep-link parity: existing `?ch=&tab=&char=&loc=` keep working; add `plane=<id>`.
- Pixel look: static layer baked at resolution 0.5 with `scaleMode = 'nearest'`; pixel sprites are 1 grid cell = 2 world units (icons) or 2 world units (glyphs) or 3 world units (landmarks).
- `prefers-reduced-motion: reduce` disables hero walk, reveal bursts, warp spiral, particles, cloud drift and marker bob.
- The 9 public top-level containers on `PixiWorldRenderer` (`backgroundContainer` … `labelsContainer`) remain.
- All code must work in the Vitest node environment (no WebGL): anything needing a Pixi `Renderer` must no-op gracefully when it is `null`.
- `npm test`, `npx tsc --noEmit`, `npm run build` must pass at the end of every task that touches TypeScript.
- Commit after every task with a conventional-commit message ending in the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Reference files in docs with clickable `file:///` URLs (AGENTS.md §4.3).

## Plan Deviations From Spec (intentional, recorded in spec during Task 23)

1. **Hover glow** uses an additive, accent-tinted back-sprite instead of a separate outline `Filter` — same look, no extra shader.
2. **Glyph exclusion around markers** is replaced by a dark "clearing" ellipse drawn under each *visible* marker. Baking gaps around *all* locations would leak where future (undiscovered) locations are when fog is toggled off.
3. **Adapter `dangerLevel`**: `LocationEntity` has no `danger_level` field, so adapter-generated maps leave `dangerLevel` undefined (no ring). Hand-authored maps set it.
4. **Secret routes** are filtered in the projection (`routeType === 'secret'` requires `revealedAtChapter <= userChapter`) rather than in the renderer.
5. **Fog is a custom Mesh shader, not a `Filter`,** so its dither is anchored to world space (2-unit cells) and does not crawl while panning; the renderer is forced to WebGL (`preference: 'webgl'`) and the shader ships GLSL only.
6. **Rivers are ribbon polygons.** The schema has no polyline terrain, so the River of Time is authored as a smoothed band polygon rather than a 3 px polyline.
7. **Coast foam ring** (spec §5.2) is replaced by a static shallow-water halo painted into the baked layer; the animated marching dashes on sea lanes carry the "moving water" cue.
8. **One Piece gulls** (spec §5.7) are omitted; One Piece uses swirling sea-spray particles only.

## Review Focus

1. **Rapid scrubbing** (slider dragged across hundreds of chapters per second): renderer must coalesce to the newest snapshot, never queue animations, and end in exactly the last chapter's state — pinned in Task 19.
2. **`?plane=` pointing at a sealed or unknown plane**: projection must fall back to the first plane and the atlas must report the fallback so the URL is rewritten — fallback pinned by unit tests in Task 2; the URL rewrite (a React effect, not reachable from SSR tests) is verified in the browser in Task 23 Step 6.6.
3. **`?loc=` for a location on another plane, present on first mount**: atlas must switch to that location's plane and fly to it — the decision is pinned by `planeSwitchForLocation` tests in Task 21; the mount-time handling (a ref that starts `undefined`) is verified in the browser in Task 21 Step 10.7 and Task 23 Step 6.5.
4. **No hero on the current plane / selected character has no path**: no hero token, no crash, no "HERO IN" chip for a character with no waypoints — pinned in Task 4 and Task 15.
5. **Zero-size container** (tab hidden via `display:none`, then shown): `resize(0, 0)` must be ignored so camera math never divides by zero — pinned in Task 10.

---

## File Structure

```
src/domain/
  map-types.ts                MODIFY  planes, landmark glyphs, planeId fields, waypoint, dangerLevel, edgeStyle
  map-planes.ts               CREATE  getMapPlanes(), planeIdOf(), planeForLocation(), DEFAULT_PLANE_ID
  map-schema.ts               MODIFY  Zod for new fields, plane-aware bounds & reference checks
src/projections/
  temporal-map.ts             MODIFY  planeId option; planes, waypoints, heroPosition, landmarkGlyphs; secret routes
  map-snapshot-diff.ts        CREATE  diffMapSnapshots()
  map-adapter.ts              MODIFY  planes, planeId, waypoint rule, per-plane routes/territories
src/engine/map/
  pixi-world-renderer.ts      REWRITE facade
  camera-controller.ts        MODIFY  setWorldSize, fitWorld, getViewBounds, resize guard
  anim/tween.ts               CREATE  TweenManager, Ease
  input/gesture-tracker.ts    CREATE  click/drag/pinch state machine
  input/picking.ts            CREATE  pickAt() hit testing
  scene/prng.ts               CREATE  hashString, mulberry32
  scene/geometry.ts           CREATE  polygon/polyline math, chaikinSmooth, dashSegments
  scene/glyph-scatter.ts      CREATE  scatterGlyphs()
  scene/pixel-palette.ts      CREATE  biomeRamp, spritePalette, DANGER_COLORS, color math
  scene/pixel-sprites.ts      CREATE  pixel-grid art (icons, glyphs, landmarks, pylon) + drawPixelGrid
  scene/icon-atlas.ts         CREATE  cached texture factory
  scene/terrain-painter.ts    CREATE  paintBackdrop, paintTerrain
  scene/static-baker.ts       CREATE  buildStaticScene()
  layers/layer-context.ts     CREATE  LayerContext type
  layers/regions-layer.ts     CREATE
  layers/markers-layer.ts     CREATE
  layers/routes-layer.ts      CREATE
  layers/hero-walker.ts       CREATE  pure walking math
  layers/hero-layer.ts        CREATE
  layers/fog-apertures.ts     CREATE  pure aperture targets + ApertureField
  layers/fog-layer.ts         CREATE
  layers/fx-layer.ts          CREATE
  layers/atmosphere-layer.ts  CREATE
  layers/labels-layer.ts      CREATE
  layers/fog-material.ts      CREATE  world-anchored GLSL Bayer dither fog (custom Mesh shader)
src/components/map/
  atlas-ui-state.ts           CREATE  pure UI helpers (banner reducer, tooltip model, waypoint grouping)
  AtlasTooltip.tsx            CREATE
  DiscoveryBanner.tsx         CREATE
  WaypointPanel.tsx           CREATE
  AtlasFrame.tsx              CREATE
  AtlasMinimap.tsx            CREATE
  MapHudControls.tsx          MODIFY  locked planes, waypoint button
  RpgWorldAtlas.tsx           REWRITE wiring
src/app/[slug]/world-explorer.tsx  MODIFY  ?plane= param, hero avatar, plane state
scripts/author-reverend-insanity-map.ts  CREATE  control points -> smoothed map.json
data/reverend-insanity/map.json          REGENERATE
tests/                        CREATE/MODIFY (per task)
ARCHITECTURE.md, DESIGN_SYSTEM.md, TODO.md, spec  MODIFY (Task 23)
```

---

### Task 1: Domain types, plane helpers, and schema

**Files:**
- Modify: `src/domain/map-types.ts`
- Create: `src/domain/map-planes.ts`
- Modify: `src/domain/map-schema.ts`
- Test: `tests/map-planes.test.ts`

**Interfaces:**
- Produces:
  - Types `PlaneBackdrop`, `MapPlane`, `LandmarkGlyphKind`, `LandmarkGlyph`, `DangerLevel`, `TerrainEdgeStyle` from `src/domain/map-types.ts`.
  - Optional `planeId?: string` on `TerrainLayer`, `MapRegion`, `MapLocation`, `MapRoute`, `FactionTerritory`, `CharacterWaypoint`; `MapLocation.waypoint?: boolean`, `MapLocation.dangerLevel?: DangerLevel`; `TerrainLayer.edgeStyle?: TerrainEdgeStyle`; `WorldMapDefinition.planes?: MapPlane[]`, `WorldMapDefinition.landmarkGlyphs?: LandmarkGlyph[]`.
  - `DEFAULT_PLANE_ID = 'main'`, `getMapPlanes(def: Pick<WorldMapDefinition,'planes'|'width'|'height'>): MapPlane[]` (sorted by `order`, implicit single plane if none), `planeIdOf(entity: { planeId?: string }, planes: MapPlane[]): string`, `planeForLocation(def: WorldMapDefinition, locationId: string): string | null` from `src/domain/map-planes.ts`.
  - Zod: `MapPlaneSchema`, `LandmarkGlyphSchema`, `DangerLevelSchema`, `PlaneBackdropSchema`; `WorldMapSchema` validates coordinates against the entity's plane dimensions and rejects unknown `planeId` references.

- [ ] **Step 1: Write the failing test**

Create `tests/map-planes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  getMapPlanes,
  planeIdOf,
  planeForLocation,
  DEFAULT_PLANE_ID,
} from '../src/domain/map-planes';
import { safeValidateWorldMap } from '../src/domain/map-schema';
import { WorldMapDefinition } from '../src/domain/map-types';

function multiPlaneMap(): WorldMapDefinition {
  return {
    id: 'mp',
    universeId: 'test',
    coordinateSystem: 'world',
    width: 1000,
    height: 1000,
    planes: [
      { id: 'heaven', name: 'Heaven', width: 800, height: 600, revealedAtChapter: 50, backdrop: 'sky', order: 1 },
      { id: 'mortal', name: 'Mortal', width: 1600, height: 1100, revealedAtChapter: 0, backdrop: 'sea', order: 0 },
    ],
    terrain: [
      { id: 't1', type: 'plains', name: 'Plain', polygon: [[0, 0], [100, 0], [100, 100]], planeId: 'mortal', edgeStyle: 'coast' },
    ],
    regions: [],
    locations: [
      {
        id: 'far-east', name: 'Far East', x: 1500, y: 1000, type: 'city', importance: 'major',
        firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'mortal', waypoint: true, dangerLevel: 'S',
      },
      {
        id: 'cloud', name: 'Cloud Palace', x: 700, y: 500, type: 'temple', importance: 'critical',
        firstAppearanceChapter: 60, revealedAtChapter: 60, planeId: 'heaven',
      },
    ],
    routes: [],
    territories: [],
    events: [],
    characterPaths: [
      {
        characterId: 'hero',
        characterName: 'Hero',
        waypoints: [{ chapter: 1, locationId: 'far-east', x: 1500, y: 1000, planeId: 'mortal' }],
      },
    ],
    landmarkGlyphs: [{ id: 'g1', glyph: 'volcano', x: 1200, y: 900, planeId: 'mortal', revealedAtChapter: 10 }],
  };
}

describe('map planes helpers', () => {
  it('returns an implicit main plane when none are declared', () => {
    const planes = getMapPlanes({ width: 1000, height: 700 });
    expect(planes).toHaveLength(1);
    expect(planes[0]).toMatchObject({ id: DEFAULT_PLANE_ID, width: 1000, height: 700, revealedAtChapter: 0 });
  });

  it('sorts declared planes by order without mutating the input', () => {
    const def = multiPlaneMap();
    const planes = getMapPlanes(def);
    expect(planes.map((p) => p.id)).toEqual(['mortal', 'heaven']);
    expect(def.planes![0].id).toBe('heaven');
  });

  it('falls back to the first plane for entities without planeId', () => {
    const planes = getMapPlanes(multiPlaneMap());
    expect(planeIdOf({}, planes)).toBe('mortal');
    expect(planeIdOf({ planeId: 'heaven' }, planes)).toBe('heaven');
  });

  it('finds the plane of a location by id', () => {
    const def = multiPlaneMap();
    expect(planeForLocation(def, 'cloud')).toBe('heaven');
    expect(planeForLocation(def, 'far-east')).toBe('mortal');
    expect(planeForLocation(def, 'missing')).toBeNull();
  });
});

describe('WorldMapSchema multi-plane validation', () => {
  it('accepts planes, planeId, waypoint, dangerLevel, edgeStyle and landmark glyphs', () => {
    const result = safeValidateWorldMap(multiPlaneMap());
    if (!result.success) console.error(result.error.issues);
    expect(result.success).toBe(true);
  });

  it('validates coordinates against the plane dimensions, not the map dimensions', () => {
    // far-east at x=1500 is valid on the 1600-wide mortal plane even though map width is 1000
    expect(safeValidateWorldMap(multiPlaneMap()).success).toBe(true);

    const def = multiPlaneMap();
    def.locations[1] = { ...def.locations[1], x: 900 }; // heaven plane is only 800 wide
    const result = safeValidateWorldMap(def);
    expect(result.success).toBe(false);
  });

  it('rejects references to unknown planes', () => {
    const def = multiPlaneMap();
    def.locations[0] = { ...def.locations[0], planeId: 'atlantis' };
    const result = safeValidateWorldMap(def);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('unknown plane "atlantis"'))).toBe(true);
    }
  });

  it('rejects invalid danger levels and landmark glyph kinds', () => {
    const badDanger = multiPlaneMap() as unknown as { locations: Array<Record<string, unknown>> };
    badDanger.locations[0].dangerLevel = 'Z';
    expect(safeValidateWorldMap(badDanger).success).toBe(false);

    const badGlyph = multiPlaneMap() as unknown as { landmarkGlyphs: Array<Record<string, unknown>> };
    badGlyph.landmarkGlyphs[0].glyph = 'teapot';
    expect(safeValidateWorldMap(badGlyph).success).toBe(false);
  });

  it('rejects landmark glyphs outside their plane', () => {
    const def = multiPlaneMap();
    def.landmarkGlyphs = [{ id: 'g2', glyph: 'spire', x: 790, y: 700, planeId: 'heaven', revealedAtChapter: 1 }];
    expect(safeValidateWorldMap(def).success).toBe(false);
  });

  it('rejects duplicate plane ids', () => {
    const def = multiPlaneMap();
    def.planes = [...def.planes!, { ...def.planes![0] }];
    expect(safeValidateWorldMap(def).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/map-planes.test.ts`
Expected: FAIL — `Failed to resolve import "../src/domain/map-planes"`.

- [ ] **Step 3: Extend domain types**

In `src/domain/map-types.ts`:

1. After the `LocationType` union, add:

```ts
export type PlaneBackdrop = 'void' | 'sky' | 'sea' | 'abyss' | 'river';

export interface MapPlane {
  id: string;
  name: string;
  width: number;
  height: number;
  revealedAtChapter: number;
  backdrop: PlaneBackdrop;
  order?: number;
}

export type LandmarkGlyphKind =
  | 'volcano'
  | 'spire'
  | 'ruin'
  | 'great-tree'
  | 'citadel'
  | 'crater'
  | 'monolith'
  | 'shipwreck'
  | 'portal-arch'
  | 'skull-rock';

export interface LandmarkGlyph {
  id: string;
  glyph: LandmarkGlyphKind;
  x: number;
  y: number;
  planeId?: string;
  scale?: number;
  revealedAtChapter: number;
  name?: string;
}

export type DangerLevel = 'EX' | 'S' | 'A' | 'B' | 'Safe';

export type TerrainEdgeStyle = 'coast' | 'cliff' | 'soft';
```

2. Add fields (keep all existing fields):
   - `TerrainLayer`: `planeId?: string;` and `edgeStyle?: TerrainEdgeStyle;`
   - `MapRegion`: `planeId?: string;`
   - `MapLocation`: `planeId?: string;`, `waypoint?: boolean;`, `dangerLevel?: DangerLevel;`
   - `MapRoute`: `planeId?: string;`
   - `FactionTerritory`: `planeId?: string;`
   - `CharacterWaypoint`: `planeId?: string;`
   - `WorldMapDefinition`: `planes?: MapPlane[];` and `landmarkGlyphs?: LandmarkGlyph[];`

- [ ] **Step 4: Create plane helpers**

Create `src/domain/map-planes.ts`:

```ts
/**
 * Plane resolution helpers for multi-plane world maps.
 *
 * A WorldMapDefinition without `planes` has one implicit plane ('main')
 * sized to the map. Entities without `planeId` belong to the first plane.
 */

import { MapPlane, WorldMapDefinition } from './map-types';

export const DEFAULT_PLANE_ID = 'main';

export function getMapPlanes(
  def: Pick<WorldMapDefinition, 'planes' | 'width' | 'height'>
): MapPlane[] {
  if (def.planes && def.planes.length > 0) {
    return def.planes
      .map((plane, index) => ({ ...plane, order: plane.order ?? index }))
      .sort((a, b) => (a.order as number) - (b.order as number));
  }
  return [
    {
      id: DEFAULT_PLANE_ID,
      name: 'World',
      width: def.width,
      height: def.height,
      revealedAtChapter: 0,
      backdrop: 'void',
      order: 0,
    },
  ];
}

export function planeIdOf(entity: { planeId?: string }, planes: MapPlane[]): string {
  return entity.planeId ?? planes[0].id;
}

export function planeForLocation(def: WorldMapDefinition, locationId: string): string | null {
  const location = def.locations.find((l) => l.id === locationId);
  if (!location) return null;
  return planeIdOf(location, getMapPlanes(def));
}
```

- [ ] **Step 5: Extend the Zod schema**

In `src/domain/map-schema.ts`:

1. Add import at top: `import { getMapPlanes } from './map-planes';`
2. After `Point2DSchema`, add:

```ts
export const PlaneBackdropSchema = z.enum(['void', 'sky', 'sea', 'abyss', 'river']);

export const MapPlaneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  revealedAtChapter: z.number().int().min(0),
  backdrop: PlaneBackdropSchema,
  order: z.number().int().optional(),
});

export const LandmarkGlyphKindSchema = z.enum([
  'volcano',
  'spire',
  'ruin',
  'great-tree',
  'citadel',
  'crater',
  'monolith',
  'shipwreck',
  'portal-arch',
  'skull-rock',
]);

export const LandmarkGlyphSchema = z.object({
  id: z.string().min(1),
  glyph: LandmarkGlyphKindSchema,
  x: z.number(),
  y: z.number(),
  planeId: z.string().min(1).optional(),
  scale: z.number().positive().optional(),
  revealedAtChapter: z.number().int().min(0),
  name: z.string().optional(),
});

export const DangerLevelSchema = z.enum(['EX', 'S', 'A', 'B', 'Safe']);
export const TerrainEdgeStyleSchema = z.enum(['coast', 'cliff', 'soft']);
```

3. Add `planeId: z.string().min(1).optional(),` to `TerrainLayerSchema`, `MapRegionSchema`, `MapLocationSchema`, `MapRouteSchema`, `FactionTerritorySchema`, `CharacterWaypointSchema`.
4. Add `edgeStyle: TerrainEdgeStyleSchema.optional(),` to `TerrainLayerSchema`.
5. Add `waypoint: z.boolean().optional(),` and `dangerLevel: DangerLevelSchema.optional(),` to `MapLocationSchema`.
6. In `WorldMapSchema`'s `z.object({...})`, add `planes: z.array(MapPlaneSchema).optional(),` and `landmarkGlyphs: z.array(LandmarkGlyphSchema).optional(),`.
7. Replace the whole `.superRefine((data, ctx) => { ... })` body with:

```ts
  .superRefine((data, ctx) => {
    const isNormalized = data.coordinateSystem === 'normalized';
    const planes = getMapPlanes(data as WorldMapDefinition);
    const planeById = new Map(planes.map((p) => [p.id, p]));
    const locationPlane = new Map(
      data.locations.map((loc) => [loc.id, loc.planeId ?? planes[0].id])
    );

    if (data.planes) {
      const seen = new Set<string>();
      data.planes.forEach((plane, idx) => {
        if (seen.has(plane.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate plane id "${plane.id}"`,
            path: ['planes', idx, 'id'],
          });
        }
        seen.add(plane.id);
      });
    }

    type Bounds = { maxX: number; maxY: number };

    const boundsFor = (
      planeId: string | undefined,
      label: string,
      path: (string | number)[]
    ): Bounds | null => {
      if (planeId !== undefined && !planeById.has(planeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} references unknown plane "${planeId}"`,
          path,
        });
        return null;
      }
      if (isNormalized) return { maxX: 1.0, maxY: 1.0 };
      const plane = planeById.get(planeId ?? planes[0].id) ?? planes[0];
      return { maxX: plane.width, maxY: plane.height };
    };

    const checkPoint = (
      x: number,
      y: number,
      bounds: Bounds | null,
      label: string,
      path: (string | number)[]
    ) => {
      if (!bounds) return;
      if (x < 0 || x > bounds.maxX || y < 0 || y > bounds.maxY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} [${x}, ${y}] is out of bounds for ${data.coordinateSystem} coordinate system (expected 0..${bounds.maxX}, 0..${bounds.maxY})`,
          path,
        });
      }
    };

    data.terrain.forEach((terrain, idx) => {
      boundsFor(terrain.planeId, `Terrain "${terrain.name}"`, ['terrain', idx, 'planeId']);
    });

    data.regions.forEach((region, idx) => {
      boundsFor(region.planeId, `Region "${region.name}"`, ['regions', idx, 'planeId']);
    });

    data.locations.forEach((loc, idx) => {
      const bounds = boundsFor(loc.planeId, `Location "${loc.name}" (${loc.id})`, ['locations', idx, 'planeId']);
      checkPoint(loc.x, loc.y, bounds, `Location "${loc.name}" (${loc.id}) coordinate`, ['locations', idx]);
    });

    data.characterPaths.forEach((cp, cpIdx) => {
      cp.waypoints.forEach((wp, wpIdx) => {
        const planeId =
          wp.planeId ?? (wp.locationId ? locationPlane.get(wp.locationId) : undefined);
        const path = ['characterPaths', cpIdx, 'waypoints', wpIdx];
        const bounds = boundsFor(planeId, `Waypoint in character path "${cp.characterName}"`, path);
        checkPoint(wp.x, wp.y, bounds, `Waypoint in character path "${cp.characterName}" at chapter ${wp.chapter}`, path);
      });
    });

    data.routes.forEach((route, rIdx) => {
      const bounds = boundsFor(route.planeId, `Route "${route.name}"`, ['routes', rIdx, 'planeId']);
      route.points.forEach((pt, pIdx) => {
        checkPoint(pt[0], pt[1], bounds, `Route point in "${route.name}"`, ['routes', rIdx, 'points', pIdx]);
      });
    });

    data.territories.forEach((terr, tIdx) => {
      const bounds = boundsFor(terr.planeId, `Territory "${terr.name}"`, ['territories', tIdx, 'planeId']);
      terr.boundary.forEach((pt, pIdx) => {
        checkPoint(pt[0], pt[1], bounds, `Boundary point in territory "${terr.name}"`, ['territories', tIdx, 'boundary', pIdx]);
      });
    });

    (data.landmarkGlyphs ?? []).forEach((glyph, gIdx) => {
      const path = ['landmarkGlyphs', gIdx];
      const bounds = boundsFor(glyph.planeId, `Landmark glyph "${glyph.id}"`, path);
      checkPoint(glyph.x, glyph.y, bounds, `Landmark glyph "${glyph.id}"`, path);
    });
  });
```

- [ ] **Step 6: Run the new test and the full suite**

Run: `npx vitest run tests/map-planes.test.ts && npm test`
Expected: PASS — new file 10 tests pass; full suite still 115 + 10 passing.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output (clean).

- [ ] **Step 8: Commit**

```bash
git add src/domain/map-types.ts src/domain/map-planes.ts src/domain/map-schema.ts tests/map-planes.test.ts
git commit -m "feat(map): add multi-plane, landmark glyph, waypoint and danger schema

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Plane-aware temporal projection

**Files:**
- Modify: `src/projections/temporal-map.ts`
- Modify: `tests/pixi-renderer.test.ts` (fixture only)
- Test: `tests/temporal-map-planes.test.ts`

**Interfaces:**
- Consumes: `getMapPlanes`, `planeIdOf` (Task 1); `MapPlane`, `LandmarkGlyph`, `PlaneBackdrop`, `LocationType`, `CharacterWaypoint` types.
- Produces (exported from `src/projections/temporal-map.ts`):
  - `interface ProjectedPlane { id: string; name: string; width: number; height: number; backdrop: PlaneBackdrop; isRevealed: boolean }`
  - `interface ProjectedWaypoint { locationId: string; name: string; planeId: string; regionId?: string; x: number; y: number; type: LocationType; isCurrent: boolean }`
  - `interface HeroPosition { x: number; y: number; locationId?: string; planeId: string; chapter: number }`
  - `TemporalMapOptions.planeId?: string`
  - `ProjectedWorldMapSnapshot` gains required `planeId: string; planes: ProjectedPlane[]; landmarkGlyphs: LandmarkGlyph[]; waypoints: ProjectedWaypoint[]; heroPosition: HeroPosition | null;` — `width`/`height` are now the active plane's; `currentPosition` is the hero position only when the hero is on the active plane; `locations`, `terrain`, `regions`, `routes`, `territories`, `characterPaths` are filtered to the active plane; `events` stay chapter-filtered only.
  - Secret routes are included only when `revealedAtChapter <= userChapter`.

- [ ] **Step 1: Write the failing test**

Create `tests/temporal-map-planes.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { projectTemporalMap, FogStatus } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

function map(): WorldMapDefinition {
  return {
    id: 'planes-map',
    universeId: 'test',
    coordinateSystem: 'world',
    width: 1000,
    height: 1000,
    planes: [
      { id: 'mortal', name: 'Mortal Realm', width: 1600, height: 1100, revealedAtChapter: 0, backdrop: 'sea', order: 0 },
      { id: 'heaven', name: 'Heaven', width: 800, height: 600, revealedAtChapter: 100, backdrop: 'sky', order: 1 },
    ],
    terrain: [
      { id: 't-mortal', type: 'plains', name: 'Plains', polygon: [[0, 0], [400, 0], [400, 400]], planeId: 'mortal' },
      { id: 't-heaven', type: 'void', name: 'Clouds', polygon: [[0, 0], [300, 0], [300, 300]], planeId: 'heaven' },
    ],
    regions: [
      { id: 'r-mortal', name: 'Mortal', geometry: { type: 'Polygon', coordinates: [[[0, 0], [400, 0], [400, 400]]] }, planeId: 'mortal' },
      { id: 'r-heaven', name: 'Heaven', geometry: { type: 'Polygon', coordinates: [[[0, 0], [300, 0], [300, 300]]] }, planeId: 'heaven' },
    ],
    locations: [
      { id: 'village', name: 'Village', x: 100, y: 100, type: 'village', importance: 'major', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'mortal', waypoint: true },
      { id: 'city', name: 'City', x: 900, y: 800, type: 'city', importance: 'critical', firstAppearanceChapter: 50, revealedAtChapter: 50, planeId: 'mortal', waypoint: true },
      { id: 'tower', name: 'Tower', x: 1400, y: 900, type: 'castle', importance: 'minor', firstAppearanceChapter: 300, revealedAtChapter: 300, planeId: 'mortal', waypoint: true },
      { id: 'palace', name: 'Sky Palace', x: 400, y: 300, type: 'temple', importance: 'critical', firstAppearanceChapter: 120, revealedAtChapter: 120, planeId: 'heaven', waypoint: true },
    ],
    routes: [
      { id: 'road', name: 'Road', points: [[100, 100], [900, 800]], routeType: 'road', visibleFromChapter: 50, planeId: 'mortal' },
      { id: 'secret', name: 'Hidden Path', points: [[100, 100], [200, 200]], routeType: 'secret', visibleFromChapter: 1, revealedAtChapter: 200, planeId: 'mortal' },
      { id: 'sky-bridge', name: 'Sky Bridge', points: [[10, 10], [400, 300]], routeType: 'flight', visibleFromChapter: 120, planeId: 'heaven' },
    ],
    territories: [
      { factionId: 'f-mortal', name: 'Mortal Clan', boundary: [[0, 0], [200, 0], [200, 200]], controlPeriods: [{ fromChapter: 1, toChapter: null, influencePct: 80 }], planeId: 'mortal' },
      { factionId: 'f-heaven', name: 'Heaven Court', boundary: [[0, 0], [200, 0], [200, 200]], controlPeriods: [{ fromChapter: 1, toChapter: null, influencePct: 80 }], planeId: 'heaven' },
    ],
    events: [
      { id: 'ev-1', name: 'Arrival', chapter: 10, locationId: 'village', eventType: 'discovery', importance: 'major' },
      { id: 'ev-2', name: 'Ascension', chapter: 130, locationId: 'palace', eventType: 'ascension', importance: 'critical' },
    ],
    characterPaths: [
      {
        characterId: 'hero',
        characterName: 'Hero',
        waypoints: [
          { chapter: 1, locationId: 'village', x: 100, y: 100 },
          { chapter: 60, locationId: 'city', x: 900, y: 800 },
          { chapter: 130, locationId: 'palace', x: 400, y: 300 },
          { chapter: 310, locationId: 'tower', x: 1400, y: 900 },
        ],
      },
    ],
    landmarkGlyphs: [
      { id: 'volcano', glyph: 'volcano', x: 1200, y: 400, planeId: 'mortal', revealedAtChapter: 80 },
      { id: 'sky-spire', glyph: 'spire', x: 500, y: 200, planeId: 'heaven', revealedAtChapter: 100 },
    ],
  };
}

describe('projectTemporalMap planes', () => {
  it('defaults to the first plane and uses its dimensions', () => {
    const snap = projectTemporalMap(map(), 60);
    expect(snap.planeId).toBe('mortal');
    expect(snap.width).toBe(1600);
    expect(snap.height).toBe(1100);
  });

  it('filters spatial collections to the requested plane', () => {
    const snap = projectTemporalMap(map(), 150, { planeId: 'heaven' });
    expect(snap.planeId).toBe('heaven');
    expect(snap.width).toBe(800);
    expect(snap.locations.map((l) => l.id)).toEqual(['palace']);
    expect(snap.terrain.map((t) => t.id)).toEqual(['t-heaven']);
    expect(snap.regions.map((r) => r.id)).toEqual(['r-heaven']);
    expect(snap.routes.map((r) => r.id)).toEqual(['sky-bridge']);
    expect(snap.territories.map((t) => t.factionId)).toEqual(['f-heaven']);
  });

  it('keeps events chapter-filtered but not plane-filtered', () => {
    const snap = projectTemporalMap(map(), 150, { planeId: 'mortal' });
    expect(snap.events.map((e) => e.id)).toEqual(['ev-1', 'ev-2']);
  });

  it('marks sealed planes and falls back to the first plane when a sealed plane is requested', () => {
    const snap = projectTemporalMap(map(), 60, { planeId: 'heaven' });
    expect(snap.planeId).toBe('mortal');
    expect(snap.planes.find((p) => p.id === 'heaven')?.isRevealed).toBe(false);
    expect(snap.planes.find((p) => p.id === 'mortal')?.isRevealed).toBe(true);
  });

  it('falls back to the first plane when an unknown plane is requested', () => {
    expect(projectTemporalMap(map(), 60, { planeId: 'atlantis' }).planeId).toBe('mortal');
  });

  it('hides landmark glyphs until their reveal chapter and only on their plane', () => {
    expect(projectTemporalMap(map(), 79).landmarkGlyphs).toEqual([]);
    expect(projectTemporalMap(map(), 80).landmarkGlyphs.map((g) => g.id)).toEqual(['volcano']);
    expect(projectTemporalMap(map(), 150, { planeId: 'heaven' }).landmarkGlyphs.map((g) => g.id)).toEqual(['sky-spire']);
  });

  it('lists only discovered waypoint locations across revealed planes', () => {
    const early = projectTemporalMap(map(), 60);
    expect(early.waypoints.map((w) => w.locationId).sort()).toEqual(['city', 'village']);
    expect(early.waypoints.find((w) => w.locationId === 'city')?.isCurrent).toBe(true);

    const late = projectTemporalMap(map(), 150);
    expect(late.waypoints.map((w) => w.locationId).sort()).toEqual(['city', 'palace', 'village']);
    expect(late.waypoints.find((w) => w.locationId === 'palace')?.planeId).toBe('heaven');
  });

  it('reports the hero on another plane without a current position on this plane', () => {
    const snap = projectTemporalMap(map(), 150, { planeId: 'mortal' });
    expect(snap.heroPosition).toMatchObject({ planeId: 'heaven', locationId: 'palace', chapter: 130 });
    expect(snap.currentPosition).toBeNull();
    expect(snap.locations.some((l) => l.isCurrentPosition)).toBe(false);
    // Mortal-plane path excludes the heaven waypoint
    expect(snap.characterPaths[0].waypoints.map((w) => w.locationId)).toEqual(['village', 'city']);
  });

  it('never places the hero beyond userChapter', () => {
    for (let ch = 1; ch <= 400; ch += 7) {
      const snap = projectTemporalMap(map(), ch);
      if (snap.heroPosition) expect(snap.heroPosition.chapter).toBeLessThanOrEqual(ch);
    }
  });

  it('hides secret routes until they are revealed', () => {
    expect(projectTemporalMap(map(), 199).routes.map((r) => r.id)).toEqual(['road']);
    expect(projectTemporalMap(map(), 200).routes.map((r) => r.id)).toEqual(['road', 'secret']);
  });

  it('keeps undiscovered waypoint locations out of the fast-travel list', () => {
    const snap = projectTemporalMap(map(), 299);
    expect(snap.waypoints.some((w) => w.locationId === 'tower')).toBe(false);
    const tower = projectTemporalMap(map(), 305).locations.find((l) => l.id === 'tower');
    expect(tower?.fogStatus).toBe(FogStatus.REVEALED);
  });

  it('projects a single implicit plane for maps without planes', () => {
    const legacy = map();
    delete legacy.planes;
    for (const l of legacy.locations) delete l.planeId;
    for (const t of legacy.terrain) delete t.planeId;
    const snap = projectTemporalMap(legacy, 60);
    expect(snap.planeId).toBe('main');
    expect(snap.planes).toHaveLength(1);
    expect(snap.width).toBe(1000);
  });

  it('does not mutate the map definition', () => {
    const def = map();
    const before = JSON.stringify(def);
    projectTemporalMap(def, 150, { planeId: 'heaven' });
    expect(JSON.stringify(def)).toBe(before);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/temporal-map-planes.test.ts`
Expected: FAIL — e.g. `expected undefined to be 'mortal'` (snapshot has no `planeId`).

- [ ] **Step 3: Implement the projection changes**

In `src/projections/temporal-map.ts`:

1. Extend imports:

```ts
import {
  WorldMapDefinition,
  MapLocation,
  MapRegion,
  MapRoute,
  FactionTerritory,
  MapEvent,
  CharacterPath,
  CharacterWaypoint,
  TerrainLayer,
  CoordinateSystem,
  LandmarkGlyph,
  LocationType,
  PlaneBackdrop,
} from '../domain/map-types';
import { getMapPlanes, planeIdOf } from '../domain/map-planes';
import { CanonicalLoreGraph } from '../domain/types';
```

2. After `ProjectedFactionTerritory`, add:

```ts
export interface ProjectedPlane {
  id: string;
  name: string;
  width: number;
  height: number;
  backdrop: PlaneBackdrop;
  isRevealed: boolean;
}

export interface ProjectedWaypoint {
  locationId: string;
  name: string;
  planeId: string;
  regionId?: string;
  x: number;
  y: number;
  type: LocationType;
  isCurrent: boolean;
}

export interface HeroPosition {
  x: number;
  y: number;
  locationId?: string;
  planeId: string;
  chapter: number;
}
```

3. In `ProjectedWorldMapSnapshot`, add after `userChapter`:

```ts
  planeId: string;
  planes: ProjectedPlane[];
  landmarkGlyphs: LandmarkGlyph[];
  waypoints: ProjectedWaypoint[];
  heroPosition: HeroPosition | null;
```

4. In `TemporalMapOptions`, add `planeId?: string;`.

5. Replace everything in `projectTemporalMap` from the comment `// 1. Sliced Character Paths` to the end of the function with:

```ts
  // 1. Resolve planes (first plane is always revealed)
  const allPlanes = getMapPlanes(map);
  const firstPlaneId = allPlanes[0].id;
  const projectedPlanes: ProjectedPlane[] = allPlanes.map((plane) => ({
    id: plane.id,
    name: plane.name,
    width: plane.width,
    height: plane.height,
    backdrop: plane.backdrop,
    isRevealed: plane.id === firstPlaneId || plane.revealedAtChapter <= userChapter,
  }));
  const activePlane =
    projectedPlanes.find((p) => p.id === options.planeId && p.isRevealed) ?? projectedPlanes[0];

  const locationPlane = new Map(
    (map.locations || []).map((loc) => [loc.id, planeIdOf(loc, allPlanes)])
  );
  const waypointPlaneId = (wp: CharacterWaypoint): string =>
    wp.planeId ?? (wp.locationId ? locationPlane.get(wp.locationId) : undefined) ?? firstPlaneId;
  const onActivePlane = (entity: { planeId?: string }): boolean =>
    planeIdOf(entity, allPlanes) === activePlane.id;

  // 2. Sliced Character Paths (Zero Spoilers: only waypoints up to userChapter, on this plane)
  const projectedCharacterPaths: CharacterPath[] = (map.characterPaths || [])
    .map((path) => ({
      characterId: path.characterId,
      characterName: path.characterName,
      waypoints: (path.waypoints || [])
        .filter((wp) => wp.chapter <= userChapter && waypointPlaneId(wp) === activePlane.id)
        .sort((a, b) => a.chapter - b.chapter),
    }))
    .filter((path) => path.waypoints.length > 0);

  // 3. Resolve Active Character Path for Fog of War calculation
  const activeCharId =
    options.activeCharacterId ||
    map.characterPaths?.[0]?.characterId ||
    projectedCharacterPaths[0]?.characterId;

  const activePath = map.characterPaths?.find((p) => p.characterId === activeCharId) ?? null;

  // 4. Resolve hero position (any plane) and current position (this plane only)
  let heroPosition: HeroPosition | null = null;
  if (activePath && activePath.waypoints.length > 0) {
    const validWaypoints = activePath.waypoints
      .filter((w) => w.chapter <= userChapter)
      .sort((a, b) => a.chapter - b.chapter);
    const latest = validWaypoints[validWaypoints.length - 1];
    if (latest) {
      heroPosition = {
        x: latest.x,
        y: latest.y,
        locationId: latest.locationId,
        planeId: waypointPlaneId(latest),
        chapter: latest.chapter,
      };
    }
  }

  const currentPosition: { x: number; y: number; locationId?: string } | null =
    heroPosition && heroPosition.planeId === activePlane.id
      ? { x: heroPosition.x, y: heroPosition.y, locationId: heroPosition.locationId }
      : null;

  // 5. Project Locations with Fog Status & Filter by Canon Visibility
  const projectedLocations: ProjectedLocation[] = [];

  for (const loc of map.locations || []) {
    if (!onActivePlane(loc)) continue;
    const fogStatus = getLocationFogStatus(loc, userChapter, activePath);
    const isVisible =
      loc.firstAppearanceChapter <= userChapter ||
      loc.revealedAtChapter <= userChapter ||
      Boolean(options.includeUnknown);

    if (isVisible) {
      projectedLocations.push({
        ...loc,
        fogStatus,
        isCurrentPosition:
          currentPosition !== null &&
          (currentPosition.locationId === loc.id ||
            (currentPosition.x === loc.x && currentPosition.y === loc.y)),
      });
    }
  }

  // 6. Fast-travel waypoints: discovered waypoint locations on every revealed plane
  const revealedPlaneIds = new Set(projectedPlanes.filter((p) => p.isRevealed).map((p) => p.id));
  const waypoints: ProjectedWaypoint[] = [];
  for (const loc of map.locations || []) {
    if (!loc.waypoint) continue;
    const planeId = planeIdOf(loc, allPlanes);
    if (!revealedPlaneIds.has(planeId)) continue;
    const status = getLocationFogStatus(loc, userChapter, activePath);
    if (
      status !== FogStatus.CURRENT &&
      status !== FogStatus.DISCOVERED &&
      status !== FogStatus.REVEALED
    ) {
      continue;
    }
    waypoints.push({
      locationId: loc.id,
      name: loc.name,
      planeId,
      regionId: loc.regionId,
      x: loc.x,
      y: loc.y,
      type: loc.type,
      isCurrent: heroPosition?.locationId === loc.id,
    });
  }

  // 7. Filter Events (strictly chapter <= userChapter; plane-agnostic for the timeline)
  const projectedEvents: MapEvent[] = (map.events || [])
    .filter((ev) => ev.chapter <= userChapter)
    .sort((a, b) => a.chapter - b.chapter);

  // 8. Filter Routes (secret routes need an explicit reveal)
  const projectedRoutes: MapRoute[] = (map.routes || []).filter((route) => {
    if (!onActivePlane(route)) return false;
    if (route.routeType === 'secret') {
      return route.revealedAtChapter !== undefined && route.revealedAtChapter <= userChapter;
    }
    return (
      route.visibleFromChapter <= userChapter ||
      (route.revealedAtChapter !== undefined && route.revealedAtChapter <= userChapter)
    );
  });

  // 9. Active Faction Territories (calculate current influence percentage)
  const projectedTerritories: ProjectedFactionTerritory[] = [];
  for (const territory of map.territories || []) {
    if (!onActivePlane(territory)) continue;
    const influence = getTerritoryInfluence(territory, userChapter);
    if (influence > 0) {
      projectedTerritories.push({
        ...territory,
        currentInfluencePct: influence,
      });
    }
  }

  // 10. Filter Regions bounded by visibility
  const projectedRegions: MapRegion[] = (map.regions || []).filter(
    (reg) =>
      onActivePlane(reg) &&
      (reg.visibleFromChapter === undefined ||
        reg.visibleFromChapter <= userChapter ||
        (reg.revealedAtChapter !== undefined && reg.revealedAtChapter <= userChapter))
  );

  // 11. Landmark glyphs (chapter-gated decorations)
  const landmarkGlyphs: LandmarkGlyph[] = (map.landmarkGlyphs || []).filter(
    (glyph) => glyph.revealedAtChapter <= userChapter && onActivePlane(glyph)
  );

  // 12. Calculate Discovered Counts (active plane)
  const discoveredCount = projectedLocations.filter(
    (l) =>
      l.fogStatus === FogStatus.CURRENT ||
      l.fogStatus === FogStatus.DISCOVERED ||
      l.fogStatus === FogStatus.REVEALED
  ).length;

  const terrain: TerrainLayer[] = (map.terrain || []).filter(onActivePlane);

  return {
    id: map.id,
    mapId: map.id,
    universeId: map.universeId,
    coordinateSystem: map.coordinateSystem,
    width: activePlane.width,
    height: activePlane.height,
    userChapter,
    planeId: activePlane.id,
    planes: projectedPlanes,
    landmarkGlyphs,
    waypoints,
    heroPosition,
    activeCharacterId: activeCharId,
    currentPosition,
    terrain,
    regions: projectedRegions,
    locations: projectedLocations,
    routes: projectedRoutes,
    territories: projectedTerritories,
    events: projectedEvents,
    characterPaths: projectedCharacterPaths,
    discoveredCount,
    totalLocationsCount: (map.locations || []).filter(onActivePlane).length,
  };
}
```

- [ ] **Step 4: Update the renderer test fixture for the new required fields**

In `tests/pixi-renderer.test.ts`, inside `sampleSnapshot` right after `userChapter: 100,` add:

```ts
    planeId: 'main',
    planes: [{ id: 'main', name: 'World', width: 1000, height: 1000, backdrop: 'void', isRevealed: true }],
    landmarkGlyphs: [],
    waypoints: [],
    heroPosition: { x: 200, y: 200, locationId: 'loc-qing-mao', planeId: 'main', chapter: 1 },
    currentPosition: { x: 200, y: 200, locationId: 'loc-qing-mao' },
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/temporal-map-planes.test.ts tests/temporal-map.test.ts && npm test`
Expected: PASS — all new tests pass; existing `temporal-map.test.ts` still passes (single implicit plane behaves as before).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean. If any other file builds a `ProjectedWorldMapSnapshot` literal, add the five new fields there the same way as Step 4.

- [ ] **Step 7: Commit**

```bash
git add src/projections/temporal-map.ts tests/temporal-map-planes.test.ts tests/pixi-renderer.test.ts
git commit -m "feat(map): make temporal projection plane-aware with waypoints and hero position

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Adapter emits planes, planeIds and waypoints

**Files:**
- Modify: `src/projections/map-adapter.ts`
- Test: `tests/map-adapter.test.ts` (append)

**Interfaces:**
- Consumes: `MapPlane`, `PlaneBackdrop`, `CharacterWaypoint` (Task 1).
- Produces:
  - `export function isWaypointLocation(loc: Pick<MapLocation, 'importance' | 'type'>): boolean` — true when `importance === 'critical'` or `type ∈ {city, sect, portal, castle, temple}`.
  - `adaptGraphToWorldMap` output: `planes` = graph planes that contain at least one location (sorted by `tier_order`, `order` = index, `width`/`height` = 1000, `backdrop` by universe); every location/region/terrain/route/territory/waypoint carries `planeId` when planes exist; `waypoint` set by rule; one journey route per plane (first keeps id `route-<charId>-path`, later ones `route-<charId>-path-<n>`); base terrain per plane (first keeps id `terrain-base`).

- [ ] **Step 1: Write the failing tests**

Append to `tests/map-adapter.test.ts` (inside the existing top-level `describe`, before its closing `});`), and add `isWaypointLocation` to the adapter import line at the top: `import { adaptGraphToWorldMap, isWaypointLocation } from '../src/projections/map-adapter';`

```ts
  it('emits planes with planeIds on every spatial entity for all legacy universes', async () => {
    for (const slug of ['coiling-dragon', 'solo-leveling', 'lord-of-the-mysteries', 'one-piece', 'demonic-emperor']) {
      const graph = await store.getSeriesGraph(slug);
      const mapDef = adaptGraphToWorldMap(graph!);
      const planeIds = new Set((mapDef.planes ?? []).map((p) => p.id));
      if (planeIds.size === 0) continue;

      for (const loc of mapDef.locations) expect(planeIds.has(loc.planeId!), `${slug} ${loc.id}`).toBe(true);
      for (const t of mapDef.terrain) expect(planeIds.has(t.planeId!)).toBe(true);
      for (const r of mapDef.regions) expect(planeIds.has(r.planeId!)).toBe(true);
      for (const r of mapDef.routes) expect(planeIds.has(r.planeId!)).toBe(true);
      for (const t of mapDef.territories) expect(planeIds.has(t.planeId!)).toBe(true);
      for (const cp of mapDef.characterPaths) {
        for (const wp of cp.waypoints) {
          const loc = mapDef.locations.find((l) => l.id === wp.locationId)!;
          expect(wp.planeId).toBe(loc.planeId);
        }
      }
      expect(WorldMapSchema.safeParse(mapDef).success).toBe(true);
    }
  });

  it('flags waypoint locations by the derivation rule', async () => {
    const graph = await store.getSeriesGraph('coiling-dragon');
    const mapDef = adaptGraphToWorldMap(graph!);
    for (const loc of mapDef.locations) {
      expect(loc.waypoint).toBe(isWaypointLocation(loc));
    }
    expect(mapDef.locations.some((l) => l.waypoint)).toBe(true);
  });

  it('derives waypoints from importance and type', () => {
    expect(isWaypointLocation({ importance: 'critical', type: 'cave' })).toBe(true);
    expect(isWaypointLocation({ importance: 'minor', type: 'city' })).toBe(true);
    expect(isWaypointLocation({ importance: 'major', type: 'portal' })).toBe(true);
    expect(isWaypointLocation({ importance: 'major', type: 'dungeon' })).toBe(false);
  });

  it('only creates planes that contain locations', async () => {
    const graph = await store.getSeriesGraph('coiling-dragon');
    const mapDef = adaptGraphToWorldMap(graph!);
    for (const plane of mapDef.planes ?? []) {
      expect(mapDef.locations.some((l) => l.planeId === plane.id)).toBe(true);
    }
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/map-adapter.test.ts`
Expected: FAIL — `isWaypointLocation is not a function` / `planes` undefined.

- [ ] **Step 3: Implement adapter changes**

In `src/projections/map-adapter.ts`:

1. Extend the map-types import with `MapPlane, PlaneBackdrop, CharacterWaypoint`.
2. After `inferRouteType`, add:

```ts
/**
 * Plane backdrop per universe (what lies beyond the landmass).
 */
function inferBackdrop(seriesSlug: string): PlaneBackdrop {
  if (seriesSlug === 'one-piece') return 'sea';
  if (seriesSlug === 'lord-of-the-mysteries') return 'sea';
  if (seriesSlug === 'solo-leveling') return 'abyss';
  if (seriesSlug === 'demonic-emperor') return 'abyss';
  return 'void';
}

const WAYPOINT_TYPES = new Set<LocationType>(['city', 'sect', 'portal', 'castle', 'temple']);

/**
 * Fast-travel waypoint derivation rule for generated maps.
 */
export function isWaypointLocation(loc: Pick<MapLocation, 'importance' | 'type'>): boolean {
  return loc.importance === 'critical' || WAYPOINT_TYPES.has(loc.type);
}
```

3. In `adaptGraphToWorldMap`, immediately after the `rawCharacters` declaration, add plane resolution (and delete the later `const sortedPlanes = ...` and `const totalPlanes = ...` lines in section 2):

```ts
  // 0. Resolve planes that actually contain locations
  const sortedPlanes = rawPlanes.slice().sort((a, b) => a.tier_order - b.tier_order);
  const planesWithLocations = sortedPlanes.filter((plane) =>
    rawLocations.some((loc) => loc.plane_id === plane.id)
  );
  const mapPlanes: MapPlane[] = planesWithLocations.map((plane, idx) => ({
    id: plane.id,
    name: plane.name,
    width,
    height,
    revealedAtChapter: Math.max(0, plane.revealed_at ?? plane.first_appearance ?? 0),
    backdrop: inferBackdrop(slug),
    order: idx,
  }));
  const planeIdSet = new Set(mapPlanes.map((p) => p.id));
  const resolvePlaneId = (rawPlaneId: string | undefined): string | undefined => {
    if (mapPlanes.length === 0) return undefined;
    return rawPlaneId && planeIdSet.has(rawPlaneId) ? rawPlaneId : mapPlanes[0].id;
  };
  const totalPlanes = Math.max(1, planesWithLocations.length);
```

4. In the location loop, extend the `mapLoc` literal with `planeId: resolvePlaneId(loc.plane_id),` and, right after the literal, add `mapLoc.waypoint = isWaypointLocation(mapLoc);`.

5. Replace the single "Universal Base Terrain Layer" `terrain.push({...})` with:

```ts
  const basePlanes: Array<MapPlane | null> = mapPlanes.length > 0 ? mapPlanes : [null];
  basePlanes.forEach((plane, idx) => {
    terrain.push({
      id: idx === 0 ? 'terrain-base' : `terrain-base-${plane!.id}`,
      type: inferBaseTerrain(slug),
      name: plane ? `${plane.name} Prime Domain` : `${graph.series.title} Prime Domain`,
      polygon: [
        [20, 20],
        [width - 20, 20],
        [width - 20, height - 20],
        [20, height - 20],
      ],
      elevation: 1,
      planeId: plane?.id,
    });
  });
```

6. Change `if (sortedPlanes.length === 0) {` to `if (planesWithLocations.length === 0) {` and `sortedPlanes.forEach((plane, idx) => {` to `planesWithLocations.forEach((plane, idx) => {`. Inside that loop add `planeId: plane.id,` to both the `regions.push({...})` and the `terrain.push({...})` literals.

7. In character-path synthesis, change the waypoint object to include the plane:

```ts
          return {
            chapter: Math.max(0, ev.chapter),
            locationId: loc.id,
            x: loc.x,
            y: loc.y,
            note: ev.name,
            planeId: loc.planeId,
          };
```

8. Replace section "5. Synthesize Routes" with one route per plane:

```ts
  // 5. Synthesize Routes (one journey polyline per plane)
  const routes: MapRoute[] = [];
  if (characterPaths.length > 0) {
    const primary = characterPaths[0];
    const byPlane = new Map<string, CharacterWaypoint[]>();
    for (const wp of primary.waypoints) {
      const key = wp.planeId ?? '__single__';
      const list = byPlane.get(key) ?? [];
      list.push(wp);
      byPlane.set(key, list);
    }
    let routeIndex = 0;
    for (const [key, planeWaypoints] of byPlane) {
      if (planeWaypoints.length < 2) continue;
      routeIndex += 1;
      routes.push({
        id:
          routeIndex === 1
            ? `route-${primary.characterId}-path`
            : `route-${primary.characterId}-path-${routeIndex}`,
        name: `${primary.characterName}'s Journey`,
        points: planeWaypoints.map((wp) => [wp.x, wp.y] as [number, number]),
        routeType: inferRouteType(slug),
        visibleFromChapter: planeWaypoints[0].chapter,
        revealedAtChapter: planeWaypoints[planeWaypoints.length - 1].chapter,
        planeId: key === '__single__' ? undefined : key,
      });
    }
  }
```

9. In section 6 (territories), after computing `factionLocs` and inside `if (factionLocs.length > 0) {`, first narrow to one plane and use `planeLocs` instead of `factionLocs` for the rest of the block:

```ts
      const territoryPlaneId = factionLocs[0].planeId;
      const planeLocs = factionLocs.filter((l) => l.planeId === territoryPlaneId);
```

Replace every `factionLocs` reference after these two lines inside that `if` block with `planeLocs`, and add `planeId: territoryPlaneId,` to the `territories.push({...})` literal.

10. In the returned object add `planes: mapPlanes.length > 0 ? mapPlanes : undefined,`.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/map-adapter.test.ts && npm test`
Expected: PASS. If `synthesizes routes connecting sequential character waypoints` fails for Coiling Dragon because no plane has ≥ 2 journey waypoints, print `mapDef.characterPaths[0].waypoints.map(w => w.planeId)` and confirm; then change that test's expectation to `expect(mapDef.routes.length).toBeGreaterThanOrEqual(0)` **only** if every plane has < 2 waypoints (cross-plane polylines would draw lines between unrelated canvases, which is wrong).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/projections/map-adapter.ts tests/map-adapter.test.ts
git commit -m "feat(map): adapter emits planes, plane ids and fast-travel waypoints

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Pure snapshot diff

**Files:**
- Create: `src/projections/map-snapshot-diff.ts`
- Test: `tests/map-snapshot-diff.test.ts`

**Interfaces:**
- Consumes: `ProjectedWorldMapSnapshot`, `FogStatus`, `projectTemporalMap` (Task 2).
- Produces:
  - `interface MapPoint { x: number; y: number }`
  - `type HeroDirection = 'forward' | 'backward' | 'none'`
  - `interface HeroMove { from: MapPoint | null; to: MapPoint | null; path: MapPoint[]; direction: HeroDirection }`
  - `interface MapSnapshotDiff { planeChanged: boolean; addedLocationIds: string[]; removedLocationIds: string[]; newlyDiscoveredIds: string[]; concealedIds: string[]; statusChanges: { id: string; from: FogStatus; to: FogStatus }[]; addedRouteIds: string[]; removedRouteIds: string[]; addedGlyphIds: string[]; removedGlyphIds: string[]; hero: HeroMove }`
  - `function isDiscoveredStatus(status: FogStatus): boolean`
  - `function diffMapSnapshots(prev: ProjectedWorldMapSnapshot | null, next: ProjectedWorldMapSnapshot): MapSnapshotDiff`
  - Semantics: with `prev === null` or a plane change, discovery lists are empty and hero direction is `'none'`. `hero.path` always ends at `hero.to`; forward path runs from the previous hero point through every intermediate waypoint.

- [ ] **Step 1: Write the failing test**

Create `tests/map-snapshot-diff.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { diffMapSnapshots, isDiscoveredStatus } from '../src/projections/map-snapshot-diff';
import { WorldMapDefinition } from '../src/domain/map-types';

const def: WorldMapDefinition = {
  id: 'diff-map',
  universeId: 'test',
  coordinateSystem: 'world',
  width: 1000,
  height: 1000,
  planes: [
    { id: 'a', name: 'A', width: 1000, height: 1000, revealedAtChapter: 0, backdrop: 'void', order: 0 },
    { id: 'b', name: 'B', width: 500, height: 500, revealedAtChapter: 0, backdrop: 'sky', order: 1 },
  ],
  terrain: [],
  regions: [],
  locations: [
    { id: 'l1', name: 'One', x: 100, y: 100, type: 'village', importance: 'major', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'a' },
    { id: 'l2', name: 'Two', x: 300, y: 100, type: 'city', importance: 'major', firstAppearanceChapter: 20, revealedAtChapter: 20, planeId: 'a' },
    { id: 'l3', name: 'Three', x: 500, y: 300, type: 'castle', importance: 'major', firstAppearanceChapter: 40, revealedAtChapter: 30, planeId: 'a' },
    { id: 'l4', name: 'Four', x: 700, y: 500, type: 'ruin', importance: 'minor', firstAppearanceChapter: 60, revealedAtChapter: 60, planeId: 'a' },
    { id: 'b1', name: 'Sky', x: 100, y: 100, type: 'temple', importance: 'major', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'b' },
  ],
  routes: [
    { id: 'r1', name: 'R1', points: [[100, 100], [300, 100]], routeType: 'road', visibleFromChapter: 20, planeId: 'a' },
  ],
  territories: [],
  events: [],
  characterPaths: [
    {
      characterId: 'hero',
      characterName: 'Hero',
      waypoints: [
        { chapter: 1, locationId: 'l1', x: 100, y: 100 },
        { chapter: 20, locationId: 'l2', x: 300, y: 100 },
        { chapter: 40, locationId: 'l3', x: 500, y: 300 },
        { chapter: 60, locationId: 'l4', x: 700, y: 500 },
      ],
    },
  ],
  landmarkGlyphs: [{ id: 'g1', glyph: 'ruin', x: 400, y: 400, planeId: 'a', revealedAtChapter: 40 }],
};

const at = (ch: number, planeId = 'a') => projectTemporalMap(def, ch, { planeId });

describe('diffMapSnapshots', () => {
  it('treats the first snapshot as a full add with no discoveries and no hero walk', () => {
    const diff = diffMapSnapshots(null, at(20));
    expect(diff.planeChanged).toBe(false);
    expect(diff.addedLocationIds.sort()).toEqual(['l1', 'l2']);
    expect(diff.newlyDiscoveredIds).toEqual([]);
    expect(diff.hero.direction).toBe('none');
    expect(diff.hero.to).toEqual({ x: 300, y: 100 });
  });

  it('reports forward discoveries and a hero walk through every intermediate waypoint', () => {
    const diff = diffMapSnapshots(at(20), at(60));
    expect(diff.addedLocationIds.sort()).toEqual(['l3', 'l4']);
    expect(diff.newlyDiscoveredIds.sort()).toEqual(['l3', 'l4']);
    expect(diff.hero.direction).toBe('forward');
    expect(diff.hero.path).toEqual([
      { x: 300, y: 100 },
      { x: 500, y: 300 },
      { x: 700, y: 500 },
    ]);
    expect(diff.hero.to).toEqual({ x: 700, y: 500 });
    expect(diff.addedGlyphIds).toEqual(['g1']);
  });

  it('reports a KNOWN -> discovered transition as a discovery', () => {
    const diff = diffMapSnapshots(at(35), at(40));
    const l3 = diff.statusChanges.find((c) => c.id === 'l3');
    expect(l3).toEqual({ id: 'l3', from: 'KNOWN', to: 'CURRENT' });
    expect(diff.newlyDiscoveredIds).toContain('l3');
  });

  it('reports backward scrubs as concealment with a reversed hero path', () => {
    const diff = diffMapSnapshots(at(60), at(20));
    expect(diff.removedLocationIds.sort()).toEqual(['l3', 'l4']);
    expect(diff.concealedIds.sort()).toEqual(['l3', 'l4']);
    expect(diff.newlyDiscoveredIds).toEqual([]);
    expect(diff.hero.direction).toBe('backward');
    expect(diff.hero.path).toEqual([
      { x: 700, y: 500 },
      { x: 500, y: 300 },
      { x: 300, y: 100 },
    ]);
    expect(diff.removedGlyphIds).toEqual(['g1']);
  });

  it('returns an empty diff for the same chapter', () => {
    const diff = diffMapSnapshots(at(40), at(40));
    expect(diff.addedLocationIds).toEqual([]);
    expect(diff.removedLocationIds).toEqual([]);
    expect(diff.statusChanges).toEqual([]);
    expect(diff.hero.direction).toBe('none');
  });

  it('flags a plane change without discoveries or a walk', () => {
    const diff = diffMapSnapshots(at(40, 'a'), at(40, 'b'));
    expect(diff.planeChanged).toBe(true);
    expect(diff.newlyDiscoveredIds).toEqual([]);
    expect(diff.removedLocationIds.sort()).toEqual(['l1', 'l2', 'l3']);
    expect(diff.addedLocationIds).toEqual(['b1']);
    expect(diff.hero.direction).toBe('none');
    expect(diff.hero.to).toBeNull();
  });

  it('adds and removes routes', () => {
    expect(diffMapSnapshots(at(10), at(20)).addedRouteIds).toEqual(['r1']);
    expect(diffMapSnapshots(at(20), at(10)).removedRouteIds).toEqual(['r1']);
  });

  it('handles a character with no path without a hero move', () => {
    const prev = projectTemporalMap(def, 10, { planeId: 'a', activeCharacterId: 'nobody' });
    const next = projectTemporalMap(def, 50, { planeId: 'a', activeCharacterId: 'nobody' });
    const diff = diffMapSnapshots(prev, next);
    expect(diff.hero).toEqual({ from: null, to: null, path: [], direction: 'none' });
  });

  it('classifies discovered statuses', () => {
    expect(isDiscoveredStatus('CURRENT')).toBe(true);
    expect(isDiscoveredStatus('DISCOVERED')).toBe(true);
    expect(isDiscoveredStatus('REVEALED')).toBe(true);
    expect(isDiscoveredStatus('KNOWN')).toBe(false);
    expect(isDiscoveredStatus('UNKNOWN')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/map-snapshot-diff.test.ts`
Expected: FAIL — cannot resolve `../src/projections/map-snapshot-diff`.

- [ ] **Step 3: Implement**

Create `src/projections/map-snapshot-diff.ts`:

```ts
/**
 * OmniLore Map Engine v3 - Pure Snapshot Diff
 *
 * Compares two consecutive projected snapshots so the renderer can animate
 * changes (hero walks, fog reveals, marker fades) instead of redrawing.
 */

import { FogStatus, ProjectedWorldMapSnapshot } from './temporal-map';

export interface MapPoint {
  x: number;
  y: number;
}

export type HeroDirection = 'forward' | 'backward' | 'none';

export interface HeroMove {
  from: MapPoint | null;
  to: MapPoint | null;
  path: MapPoint[];
  direction: HeroDirection;
}

export interface MapSnapshotDiff {
  planeChanged: boolean;
  addedLocationIds: string[];
  removedLocationIds: string[];
  newlyDiscoveredIds: string[];
  concealedIds: string[];
  statusChanges: { id: string; from: FogStatus; to: FogStatus }[];
  addedRouteIds: string[];
  removedRouteIds: string[];
  addedGlyphIds: string[];
  removedGlyphIds: string[];
  hero: HeroMove;
}

const DISCOVERED_STATUSES = new Set<FogStatus>([
  FogStatus.DISCOVERED,
  FogStatus.REVEALED,
  FogStatus.CURRENT,
]);

export function isDiscoveredStatus(status: FogStatus): boolean {
  return DISCOVERED_STATUSES.has(status);
}

function idDelta(prev: string[], next: string[]): { added: string[]; removed: string[] } {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  return {
    added: next.filter((id) => !prevSet.has(id)),
    removed: prev.filter((id) => !nextSet.has(id)),
  };
}

function heroPathPoints(snapshot: ProjectedWorldMapSnapshot): MapPoint[] {
  const path = snapshot.characterPaths.find((p) => p.characterId === snapshot.activeCharacterId);
  return path ? path.waypoints.map((w) => ({ x: w.x, y: w.y })) : [];
}

function toPoint(position: { x: number; y: number } | null | undefined): MapPoint | null {
  return position ? { x: position.x, y: position.y } : null;
}

function computeHeroMove(
  prev: ProjectedWorldMapSnapshot | null,
  next: ProjectedWorldMapSnapshot,
  planeChanged: boolean
): HeroMove {
  const to = toPoint(next.currentPosition);
  const still = (from: MapPoint | null): HeroMove => ({
    from,
    to,
    path: to ? [to] : [],
    direction: 'none',
  });

  if (!prev || planeChanged || prev.activeCharacterId !== next.activeCharacterId) {
    return still(null);
  }

  const from = toPoint(prev.currentPosition);
  if (!from || !to) return still(from);

  const prevPoints = heroPathPoints(prev);
  const nextPoints = heroPathPoints(next);
  if (prevPoints.length === nextPoints.length) return still(from);

  const forward = nextPoints.length > prevPoints.length;
  const longer = forward ? nextPoints : prevPoints;
  const lo = Math.min(prevPoints.length, nextPoints.length) - 1;
  const hi = Math.max(prevPoints.length, nextPoints.length) - 1;
  const segment = longer.slice(Math.max(0, lo), hi + 1);

  return {
    from,
    to,
    path: forward ? segment : segment.slice().reverse(),
    direction: forward ? 'forward' : 'backward',
  };
}

export function diffMapSnapshots(
  prev: ProjectedWorldMapSnapshot | null,
  next: ProjectedWorldMapSnapshot
): MapSnapshotDiff {
  const planeChanged = prev !== null && prev.planeId !== next.planeId;
  const comparable = prev && !planeChanged ? prev : null;

  const locationDelta = idDelta(
    (prev?.locations ?? []).map((l) => l.id),
    next.locations.map((l) => l.id)
  );
  const routeDelta = idDelta(
    (prev?.routes ?? []).map((r) => r.id),
    next.routes.map((r) => r.id)
  );
  const glyphDelta = idDelta(
    (prev?.landmarkGlyphs ?? []).map((g) => g.id),
    next.landmarkGlyphs.map((g) => g.id)
  );

  const newlyDiscoveredIds: string[] = [];
  const concealedIds: string[] = [];
  const statusChanges: MapSnapshotDiff['statusChanges'] = [];

  if (comparable) {
    const prevById = new Map(comparable.locations.map((l) => [l.id, l]));
    const nextById = new Map(next.locations.map((l) => [l.id, l]));

    for (const loc of next.locations) {
      const before = prevById.get(loc.id)?.fogStatus ?? FogStatus.UNKNOWN;
      if (before !== loc.fogStatus) {
        statusChanges.push({ id: loc.id, from: before, to: loc.fogStatus });
      }
      if (!isDiscoveredStatus(before) && isDiscoveredStatus(loc.fogStatus)) {
        newlyDiscoveredIds.push(loc.id);
      }
    }

    for (const loc of comparable.locations) {
      const after = nextById.get(loc.id);
      const afterStatus = after?.fogStatus ?? FogStatus.UNKNOWN;
      if (!after) {
        statusChanges.push({ id: loc.id, from: loc.fogStatus, to: FogStatus.UNKNOWN });
      }
      if (isDiscoveredStatus(loc.fogStatus) && !isDiscoveredStatus(afterStatus)) {
        concealedIds.push(loc.id);
      }
    }
  }

  return {
    planeChanged,
    addedLocationIds: locationDelta.added,
    removedLocationIds: locationDelta.removed,
    newlyDiscoveredIds,
    concealedIds,
    statusChanges,
    addedRouteIds: routeDelta.added,
    removedRouteIds: routeDelta.removed,
    addedGlyphIds: glyphDelta.added,
    removedGlyphIds: glyphDelta.removed,
    hero: computeHeroMove(prev, next, planeChanged),
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/map-snapshot-diff.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Export from projections barrel and typecheck**

Append to `src/projections/index.ts`:

```ts
export * from './map-snapshot-diff';
```

Run: `npx tsc --noEmit && npm test`
Expected: clean, all green. (If `index.ts` already re-exports a name that collides, e.g. `MapPoint`, export explicitly instead: `export { diffMapSnapshots, isDiscoveredStatus } from './map-snapshot-diff'; export type { MapSnapshotDiff, HeroMove, HeroDirection } from './map-snapshot-diff';`.)

- [ ] **Step 6: Commit**

```bash
git add src/projections/map-snapshot-diff.ts src/projections/index.ts tests/map-snapshot-diff.test.ts
git commit -m "feat(map): add pure snapshot diff for animated chapter transitions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: PRNG and geometry utilities

**Files:**
- Create: `src/engine/map/scene/prng.ts`
- Create: `src/engine/map/scene/geometry.ts`
- Test: `tests/map-geometry.test.ts`

**Interfaces:**
- Produces (`prng.ts`): `hashString(input: string): number` (FNV-1a, uint32), `type Rng = () => number`, `mulberry32(seed: number): Rng` (values in `[0, 1)`).
- Produces (`geometry.ts`):
  - `type Vec2 = [number, number]`, `interface Pt { x: number; y: number }`, `interface Bounds { minX: number; minY: number; maxX: number; maxY: number }`
  - `polygonBounds(poly: Vec2[]): Bounds`
  - `pointInPolygon(x: number, y: number, poly: Vec2[]): boolean`
  - `polygonCentroid(poly: Vec2[]): Pt` (vertex average)
  - `scalePolygon(poly: Vec2[], factor: number): Vec2[]` (toward centroid)
  - `flattenPoly(poly: Vec2[]): number[]`
  - `distanceToPolygonEdge(x: number, y: number, poly: Vec2[]): number`
  - `polylineLength(points: Pt[]): number`
  - `pointAlongPolyline(points: Pt[], distance: number): Pt`
  - `slicePolyline(points: Pt[], distance: number): Pt[]` (prefix of the polyline up to `distance`, ending at the interpolated point)
  - `dashSegments(points: Pt[], dash: number, gap: number, offset: number): Array<[Pt, Pt]>`
  - `chaikinSmooth(poly: Vec2[], iterations: number, closed?: boolean): Vec2[]`

- [ ] **Step 1: Write the failing test**

Create `tests/map-geometry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { hashString, mulberry32 } from '../src/engine/map/scene/prng';
import {
  polygonBounds,
  pointInPolygon,
  polygonCentroid,
  scalePolygon,
  flattenPoly,
  distanceToPolygonEdge,
  polylineLength,
  pointAlongPolyline,
  slicePolyline,
  dashSegments,
  chaikinSmooth,
  Vec2,
} from '../src/engine/map/scene/geometry';

const square: Vec2[] = [[0, 0], [100, 0], [100, 100], [0, 100]];

describe('prng', () => {
  it('hashes strings deterministically to uint32', () => {
    expect(hashString('map:terrain')).toBe(hashString('map:terrain'));
    expect(hashString('a')).not.toBe(hashString('b'));
    expect(hashString('anything')).toBeGreaterThanOrEqual(0);
    expect(hashString('anything')).toBeLessThan(2 ** 32);
  });

  it('produces a repeatable sequence in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 50 }, () => a());
    const seqB = Array.from({ length: 50 }, () => b());
    expect(seqA).toEqual(seqB);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    const c = mulberry32(43);
    expect(c()).not.toBe(seqA[0]);
  });
});

describe('polygon geometry', () => {
  it('computes bounds, centroid and flattening', () => {
    expect(polygonBounds(square)).toEqual({ minX: 0, minY: 0, maxX: 100, maxY: 100 });
    expect(polygonCentroid(square)).toEqual({ x: 50, y: 50 });
    expect(flattenPoly([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
  });

  it('tests point containment', () => {
    expect(pointInPolygon(50, 50, square)).toBe(true);
    expect(pointInPolygon(150, 50, square)).toBe(false);
    const concave: Vec2[] = [[0, 0], [100, 0], [100, 100], [50, 40], [0, 100]];
    expect(pointInPolygon(50, 80, concave)).toBe(false);
    expect(pointInPolygon(50, 20, concave)).toBe(true);
  });

  it('scales polygons toward the centroid', () => {
    expect(scalePolygon(square, 0.5)).toEqual([[25, 25], [75, 25], [75, 75], [25, 75]]);
  });

  it('measures distance to the nearest edge', () => {
    expect(distanceToPolygonEdge(50, 10, square)).toBeCloseTo(10);
    expect(distanceToPolygonEdge(50, 50, square)).toBeCloseTo(50);
  });

  it('smooths closed polygons with Chaikin corner cutting', () => {
    const once = chaikinSmooth(square, 1);
    expect(once).toHaveLength(8);
    expect(once[0]).toEqual([25, 0]);
    expect(once[1]).toEqual([75, 0]);
    expect(chaikinSmooth(square, 3)).toHaveLength(32);
    expect(chaikinSmooth(square, 0)).toEqual(square);
  });

  it('keeps open polyline endpoints when smoothing open paths', () => {
    const line: Vec2[] = [[0, 0], [100, 0], [100, 100]];
    const smoothed = chaikinSmooth(line, 1, false);
    expect(smoothed[0]).toEqual([0, 0]);
    expect(smoothed[smoothed.length - 1]).toEqual([100, 100]);
  });
});

describe('polyline geometry', () => {
  const path = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }];

  it('measures length and interpolates along the path', () => {
    expect(polylineLength(path)).toBe(150);
    expect(pointAlongPolyline(path, 50)).toEqual({ x: 50, y: 0 });
    expect(pointAlongPolyline(path, 125)).toEqual({ x: 100, y: 25 });
    expect(pointAlongPolyline(path, 999)).toEqual({ x: 100, y: 50 });
    expect(pointAlongPolyline(path, -5)).toEqual({ x: 0, y: 0 });
    expect(pointAlongPolyline([{ x: 3, y: 4 }], 10)).toEqual({ x: 3, y: 4 });
  });

  it('slices a polyline prefix', () => {
    expect(slicePolyline(path, 125)).toEqual([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 25 }]);
    expect(slicePolyline(path, 0)).toEqual([{ x: 0, y: 0 }]);
  });

  it('splits a polyline into dash segments with an animated offset', () => {
    const line = [{ x: 0, y: 0 }, { x: 20, y: 0 }];
    expect(dashSegments(line, 4, 6, 0)).toEqual([
      [{ x: 0, y: 0 }, { x: 4, y: 0 }],
      [{ x: 10, y: 0 }, { x: 14, y: 0 }],
    ]);
    const shifted = dashSegments(line, 4, 6, 2);
    expect(shifted[0]).toEqual([{ x: 2, y: 0 }, { x: 6, y: 0 }]);
    expect(shifted[1]).toEqual([{ x: 12, y: 0 }, { x: 16, y: 0 }]);
    const wrapped = dashSegments(line, 4, 6, 8);
    expect(wrapped[0]).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0 }]);
    expect(wrapped[1]).toEqual([{ x: 8, y: 0 }, { x: 12, y: 0 }]);
    expect(wrapped[2]).toEqual([{ x: 18, y: 0 }, { x: 20, y: 0 }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/map-geometry.test.ts`
Expected: FAIL — cannot resolve `../src/engine/map/scene/prng`.

- [ ] **Step 3: Implement `prng.ts`**

Create `src/engine/map/scene/prng.ts`:

```ts
/**
 * Deterministic pseudo-random helpers for procedural map decoration.
 * Never use Math.random for anything baked into the static layer.
 */

export type Rng = () => number;

/** FNV-1a 32-bit string hash. */
export function hashString(input: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

/** mulberry32 PRNG: fast, deterministic, uniform in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 4: Implement `geometry.ts`**

Create `src/engine/map/scene/geometry.ts`:

```ts
/**
 * Pure 2D geometry helpers for the map engine (no Pixi imports).
 */

export type Vec2 = [number, number];

export interface Pt {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function polygonBounds(poly: Vec2[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

export function pointInPolygon(x: number, y: number, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function polygonCentroid(poly: Vec2[]): Pt {
  let sx = 0;
  let sy = 0;
  for (const [x, y] of poly) {
    sx += x;
    sy += y;
  }
  return { x: sx / poly.length, y: sy / poly.length };
}

export function scalePolygon(poly: Vec2[], factor: number): Vec2[] {
  const c = polygonCentroid(poly);
  return poly.map(([x, y]) => [c.x + (x - c.x) * factor, c.y + (y - c.y) * factor]);
}

export function flattenPoly(poly: Vec2[]): number[] {
  const out: number[] = [];
  for (const [x, y] of poly) out.push(x, y);
  return out;
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function distanceToPolygonEdge(x: number, y: number, poly: Vec2[]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const d = distanceToSegment(x, y, poly[j][0], poly[j][1], poly[i][0], poly[i][1]);
    if (d < best) best = d;
  }
  return best;
}

export function polylineLength(points: Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

export function pointAlongPolyline(points: Pt[], distance: number): Pt {
  if (points.length === 0) return { x: 0, y: 0 };
  if (distance <= 0 || points.length === 1) return { x: points[0].x, y: points[0].y };
  let remaining = distance;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= len) {
      const t = len === 0 ? 0 : remaining / len;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= len;
  }
  const last = points[points.length - 1];
  return { x: last.x, y: last.y };
}

export function slicePolyline(points: Pt[], distance: number): Pt[] {
  if (points.length === 0) return [];
  const out: Pt[] = [{ x: points[0].x, y: points[0].y }];
  if (distance <= 0) return out;
  let remaining = distance;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining < len) {
      const t = len === 0 ? 0 : remaining / len;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      return out;
    }
    out.push({ x: b.x, y: b.y });
    remaining -= len;
  }
  return out;
}

/**
 * Splits a polyline into dash segments. `offset` shifts the pattern forward
 * along the line (animate it to make dashes "march").
 */
export function dashSegments(points: Pt[], dash: number, gap: number, offset: number): Array<[Pt, Pt]> {
  const total = polylineLength(points);
  const period = dash + gap;
  if (total === 0 || period <= 0) return [];
  const segments: Array<[Pt, Pt]> = [];
  const phase = ((offset % period) + period) % period;
  let start = phase - period;
  while (start < total) {
    const a = Math.max(0, start);
    const b = Math.min(total, start + dash);
    if (b > a) segments.push([pointAlongPolyline(points, a), pointAlongPolyline(points, b)]);
    start += period;
  }
  return segments;
}

/** Chaikin corner-cutting. Each iteration doubles the vertex count of a closed ring. */
export function chaikinSmooth(poly: Vec2[], iterations: number, closed = true): Vec2[] {
  let current = poly.map(([x, y]) => [x, y] as Vec2);
  for (let iter = 0; iter < iterations; iter++) {
    const next: Vec2[] = [];
    const count = current.length;
    const edges = closed ? count : count - 1;
    if (!closed) next.push(current[0]);
    for (let i = 0; i < edges; i++) {
      const [x0, y0] = current[i];
      const [x1, y1] = current[(i + 1) % count];
      next.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25]);
      next.push([x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
    }
    if (!closed) next.push(current[count - 1]);
    current = next;
  }
  return current;
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run tests/map-geometry.test.ts`
Expected: PASS (13 tests). Dash convention: a positive `offset` moves the dash pattern forward along the line; a dash that starts before 0 is clipped to 0.

- [ ] **Step 6: Typecheck and commit**

Run: `npx tsc --noEmit`
Expected: clean.

```bash
git add src/engine/map/scene/prng.ts src/engine/map/scene/geometry.ts tests/map-geometry.test.ts
git commit -m "feat(map): add deterministic prng and pure geometry helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Deterministic glyph scatter

**Files:**
- Create: `src/engine/map/scene/glyph-scatter.ts`
- Test: `tests/glyph-scatter.test.ts`

**Interfaces:**
- Consumes: `mulberry32` (Task 5); `polygonBounds`, `pointInPolygon`, `distanceToPolygonEdge`, `Vec2` (Task 5); `TerrainType`.
- Produces:
  - `type GlyphKind = 'peak' | 'pine' | 'dune' | 'reed' | 'shard' | 'vent' | 'crack' | 'tuft' | 'wave'`
  - `interface GlyphSpec { kind: GlyphKind; spacing: number; variants: number }`
  - `const TERRAIN_GLYPHS: Record<TerrainType, GlyphSpec | null>`
  - `interface ScatteredGlyph { kind: GlyphKind; variant: number; x: number; y: number; scale: number }`
  - `interface ScatterOptions { polygon: Vec2[]; terrainType: TerrainType; seed: number; spacingScale?: number; edgeMargin?: number; maxGlyphs?: number }`
  - `scatterGlyphs(options: ScatterOptions): ScatteredGlyph[]` — sorted by `y` then `x`; every glyph strictly inside the polygon, at least `edgeMargin` (default 6) from edges; pairwise distance ≥ spec spacing × `spacingScale`.

- [ ] **Step 1: Write the failing test**

Create `tests/glyph-scatter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { scatterGlyphs, TERRAIN_GLYPHS } from '../src/engine/map/scene/glyph-scatter';
import { pointInPolygon, distanceToPolygonEdge, Vec2 } from '../src/engine/map/scene/geometry';

const blob: Vec2[] = [[50, 40], [420, 20], [560, 260], [400, 480], [120, 430], [20, 220]];

describe('scatterGlyphs', () => {
  it('is deterministic for the same seed', () => {
    const a = scatterGlyphs({ polygon: blob, terrainType: 'mountain', seed: 1234 });
    const b = scatterGlyphs({ polygon: blob, terrainType: 'mountain', seed: 1234 });
    expect(a.length).toBeGreaterThan(20);
    expect(a).toEqual(b);
  });

  it('differs for different seeds', () => {
    const a = scatterGlyphs({ polygon: blob, terrainType: 'mountain', seed: 1 });
    const b = scatterGlyphs({ polygon: blob, terrainType: 'mountain', seed: 2 });
    expect(a).not.toEqual(b);
  });

  it('keeps every glyph inside the polygon and away from its edge', () => {
    const glyphs = scatterGlyphs({ polygon: blob, terrainType: 'forest', seed: 7, edgeMargin: 8 });
    for (const g of glyphs) {
      expect(pointInPolygon(g.x, g.y, blob)).toBe(true);
      expect(distanceToPolygonEdge(g.x, g.y, blob)).toBeGreaterThanOrEqual(7.5);
    }
  });

  it('respects minimum spacing between glyphs', () => {
    const glyphs = scatterGlyphs({ polygon: blob, terrainType: 'desert', seed: 9 });
    const spacing = TERRAIN_GLYPHS.desert!.spacing;
    for (let i = 0; i < glyphs.length; i++) {
      for (let j = i + 1; j < glyphs.length; j++) {
        const d = Math.hypot(glyphs[i].x - glyphs[j].x, glyphs[i].y - glyphs[j].y);
        expect(d).toBeGreaterThanOrEqual(spacing - 1); // -1 tolerates integer rounding
      }
    }
  });

  it('uses the terrain kind and valid variants and scales', () => {
    const glyphs = scatterGlyphs({ polygon: blob, terrainType: 'mountain', seed: 3 });
    const spec = TERRAIN_GLYPHS.mountain!;
    for (const g of glyphs) {
      expect(g.kind).toBe('peak');
      expect(g.variant).toBeGreaterThanOrEqual(0);
      expect(g.variant).toBeLessThan(spec.variants);
      expect(g.scale).toBeGreaterThanOrEqual(0.85);
      expect(g.scale).toBeLessThanOrEqual(1.15);
    }
  });

  it('returns glyphs sorted top-to-bottom for correct overlap', () => {
    const glyphs = scatterGlyphs({ polygon: blob, terrainType: 'forest', seed: 11 });
    for (let i = 1; i < glyphs.length; i++) {
      expect(glyphs[i].y >= glyphs[i - 1].y).toBe(true);
    }
  });

  it('caps the glyph count', () => {
    expect(scatterGlyphs({ polygon: blob, terrainType: 'forest', seed: 5, maxGlyphs: 10 })).toHaveLength(10);
  });

  it('returns nothing for terrain without glyphs or degenerate polygons', () => {
    expect(scatterGlyphs({ polygon: blob, terrainType: 'river', seed: 1 })).toEqual([]);
    expect(scatterGlyphs({ polygon: [[0, 0], [1, 1]], terrainType: 'mountain', seed: 1 })).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/glyph-scatter.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement**

Create `src/engine/map/scene/glyph-scatter.ts`:

```ts
/**
 * Deterministic Poisson-disk style scatter of decorative terrain glyphs
 * (peaks, pines, dunes...) inside hand-authored terrain polygons.
 */

import { TerrainType } from '../../../domain/map-types';
import { mulberry32 } from './prng';
import { polygonBounds, pointInPolygon, distanceToPolygonEdge, Vec2 } from './geometry';

export type GlyphKind = 'peak' | 'pine' | 'dune' | 'reed' | 'shard' | 'vent' | 'crack' | 'tuft' | 'wave';

export interface GlyphSpec {
  kind: GlyphKind;
  spacing: number;
  variants: number;
}

export const TERRAIN_GLYPHS: Record<TerrainType, GlyphSpec | null> = {
  mountain: { kind: 'peak', spacing: 26, variants: 3 },
  forest: { kind: 'pine', spacing: 14, variants: 3 },
  desert: { kind: 'dune', spacing: 34, variants: 2 },
  swamp: { kind: 'reed', spacing: 18, variants: 2 },
  ice: { kind: 'shard', spacing: 24, variants: 2 },
  volcanic: { kind: 'vent', spacing: 30, variants: 2 },
  void: { kind: 'crack', spacing: 40, variants: 2 },
  plains: { kind: 'tuft', spacing: 48, variants: 2 },
  ocean: { kind: 'wave', spacing: 56, variants: 2 },
  river: null,
  custom: null,
};

export interface ScatteredGlyph {
  kind: GlyphKind;
  variant: number;
  x: number;
  y: number;
  scale: number;
}

export interface ScatterOptions {
  polygon: Vec2[];
  terrainType: TerrainType;
  seed: number;
  spacingScale?: number;
  edgeMargin?: number;
  maxGlyphs?: number;
}

export function scatterGlyphs(options: ScatterOptions): ScatteredGlyph[] {
  const spec = TERRAIN_GLYPHS[options.terrainType];
  const poly = options.polygon;
  if (!spec || poly.length < 3) return [];

  const rng = mulberry32(options.seed);
  const spacing = spec.spacing * (options.spacingScale ?? 1);
  const margin = options.edgeMargin ?? 6;
  const maxGlyphs = options.maxGlyphs ?? 4000;
  const bounds = polygonBounds(poly);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const attempts = Math.min(40000, Math.ceil(((width * height) / (spacing * spacing)) * 8));

  const cellSize = spacing / Math.SQRT2;
  const grid = new Map<string, ScatteredGlyph>();
  const keyOf = (x: number, y: number) =>
    `${Math.floor((x - bounds.minX) / cellSize)},${Math.floor((y - bounds.minY) / cellSize)}`;

  const tooClose = (x: number, y: number): boolean => {
    const gx = Math.floor((x - bounds.minX) / cellSize);
    const gy = Math.floor((y - bounds.minY) / cellSize);
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const other = grid.get(`${gx + dx},${gy + dy}`);
        if (other && Math.hypot(other.x - x, other.y - y) < spacing) return true;
      }
    }
    return false;
  };

  const result: ScatteredGlyph[] = [];
  for (let i = 0; i < attempts && result.length < maxGlyphs; i++) {
    const x = Math.round(bounds.minX + rng() * width);
    const y = Math.round(bounds.minY + rng() * height);
    if (!pointInPolygon(x, y, poly)) continue;
    if (distanceToPolygonEdge(x, y, poly) < margin) continue;
    if (tooClose(x, y)) continue;
    const glyph: ScatteredGlyph = {
      kind: spec.kind,
      variant: Math.floor(rng() * spec.variants),
      x,
      y,
      scale: 0.85 + rng() * 0.3,
    };
    grid.set(keyOf(x, y), glyph);
    result.push(glyph);
  }

  return result.sort((a, b) => a.y - b.y || a.x - b.x);
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/glyph-scatter.test.ts`
Expected: PASS (8 tests). If "respects minimum spacing" fails, the grid neighborhood is too small: `cellSize = spacing/√2` guarantees one point per cell and neighbors within `2` cells cover `2·cellSize ≈ 1.41·spacing ≥ spacing`, so check that `keyOf` and `tooClose` use the same origin (`bounds.minX/minY`).

- [ ] **Step 5: Typecheck and commit**

Run: `npx tsc --noEmit`

```bash
git add src/engine/map/scene/glyph-scatter.ts tests/glyph-scatter.test.ts
git commit -m "feat(map): add deterministic poisson glyph scatter for terrain decoration

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Pixel palette and color math

**Files:**
- Create: `src/engine/map/scene/pixel-palette.ts`
- Test: `tests/pixel-palette.test.ts`

**Interfaces:**
- Consumes: `MapTheme`, `TerrainType`, `DangerLevel`, `PlaneBackdrop`, `UNIVERSE_MAP_THEMES`.
- Produces:
  - `hexToRgb(hex: string): { r: number; g: number; b: number }` (accepts `#rgb`, `#rrggbb`, `rgba(...)`/`rgb(...)`)
  - `rgbToHex(r: number, g: number, b: number): string`
  - `mix(a: string, b: string, t: number): string`
  - `shade(hex: string, amount: number): string` (amount in [-1, 1]; negative → toward black, positive → toward white)
  - `luminance(hex: string): number` (0..1, relative)
  - `hexToRgb01(hex: string): [number, number, number]`
  - `type Ramp = [string, string, string, string]` (deep, base, light, highlight)
  - `biomeRamp(theme: MapTheme, terrainType: TerrainType, colorOverride?: string): Ramp`
  - `backdropColor(theme: MapTheme, backdrop: PlaneBackdrop): string`
  - `const DANGER_COLORS: Record<DangerLevel, string>`
  - `type PixelChar = 'o' | 'd' | 'b' | 'l' | 'h' | 's' | 'a' | 'w'`
  - `type PixelSpritePalette = Record<PixelChar, string>`
  - `spritePalette(theme: MapTheme, tint?: string): PixelSpritePalette`
  - `rampPalette(ramp: Ramp, accent: string): PixelSpritePalette`
  - `silhouettePalette(color: string): PixelSpritePalette`

- [ ] **Step 1: Write the failing test**

Create `tests/pixel-palette.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  mix,
  shade,
  luminance,
  hexToRgb01,
  biomeRamp,
  backdropColor,
  DANGER_COLORS,
  spritePalette,
  rampPalette,
  silhouettePalette,
} from '../src/engine/map/scene/pixel-palette';
import { UNIVERSE_MAP_THEMES } from '../src/domain/map-themes';
import { TerrainType } from '../src/domain/map-types';

const HEX = /^#[0-9a-f]{6}$/;
const TERRAIN_TYPES: TerrainType[] = ['ocean', 'river', 'mountain', 'forest', 'desert', 'plains', 'swamp', 'ice', 'volcanic', 'void', 'custom'];

describe('color math', () => {
  it('parses and formats colors', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb('#f80')).toEqual({ r: 255, g: 136, b: 0 });
    expect(hexToRgb('rgba(16, 185, 129, 0.12)')).toEqual({ r: 16, g: 185, b: 129 });
    expect(rgbToHex(255, 128, 0)).toBe('#ff8000');
    expect(hexToRgb01('#ff0000')).toEqual([1, 0, 0]);
  });

  it('mixes and shades toward black and white', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(shade('#808080', -1)).toBe('#000000');
    expect(shade('#808080', 1)).toBe('#ffffff');
    expect(shade('#808080', 0)).toBe('#808080');
  });

  it('computes relative luminance', () => {
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#ffffff')).toBeCloseTo(1);
  });
});

describe('biome ramps', () => {
  it('returns 4 valid, increasingly bright tones for every theme and terrain', () => {
    for (const theme of Object.values(UNIVERSE_MAP_THEMES)) {
      for (const type of TERRAIN_TYPES) {
        const ramp = biomeRamp(theme, type);
        expect(ramp).toHaveLength(4);
        for (const c of ramp) expect(c).toMatch(HEX);
        expect(luminance(ramp[0])).toBeLessThan(luminance(ramp[1]));
        expect(luminance(ramp[1])).toBeLessThan(luminance(ramp[2]));
        expect(luminance(ramp[2])).toBeLessThan(luminance(ramp[3]));
      }
    }
  });

  it('honors a terrain color override as the base tone family', () => {
    const theme = UNIVERSE_MAP_THEMES['reverend-insanity'];
    const ramp = biomeRamp(theme, 'plains', '#aa0000');
    const { r, g, b } = hexToRgb(ramp[1]);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  it('provides backdrop colors for every backdrop', () => {
    const theme = UNIVERSE_MAP_THEMES['one-piece'];
    for (const b of ['void', 'sky', 'sea', 'abyss', 'river'] as const) {
      expect(backdropColor(theme, b)).toMatch(HEX);
    }
  });
});

describe('sprite palettes', () => {
  it('covers every danger level', () => {
    expect(Object.keys(DANGER_COLORS).sort()).toEqual(['A', 'B', 'EX', 'S', 'Safe']);
  });

  it('builds palettes with every pixel character', () => {
    const theme = UNIVERSE_MAP_THEMES['coiling-dragon'];
    for (const palette of [
      spritePalette(theme),
      rampPalette(biomeRamp(theme, 'forest'), '#ff0000'),
      silhouettePalette('#111111'),
    ]) {
      expect(Object.keys(palette).sort()).toEqual(['a', 'b', 'd', 'h', 'l', 'o', 's', 'w']);
      for (const c of Object.values(palette)) expect(c).toMatch(HEX);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pixel-palette.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement**

Create `src/engine/map/scene/pixel-palette.ts`:

```ts
/**
 * Pixel-gothic palette math: biome ramps, backdrops, sprite palettes.
 * Pure (no Pixi). All outputs are lowercase #rrggbb.
 */

import { MapTheme } from '../../../domain/map-themes';
import { DangerLevel, PlaneBackdrop, TerrainType } from '../../../domain/map-types';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(color: string): Rgb {
  const value = color.trim().toLowerCase();
  const rgbMatch = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
  }
  let hex = value.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const num = parseInt(hex.slice(0, 6), 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}

export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.r + (cb.r - ca.r) * t, ca.g + (cb.g - ca.g) * t, ca.b + (cb.b - ca.b) * t);
}

export function shade(color: string, amount: number): string {
  if (amount === 0) {
    const c = hexToRgb(color);
    return rgbToHex(c.r, c.g, c.b);
  }
  return amount < 0 ? mix(color, '#000000', -amount) : mix(color, '#ffffff', amount);
}

export function luminance(color: string): number {
  const { r, g, b } = hexToRgb(color);
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function hexToRgb01(color: string): [number, number, number] {
  const { r, g, b } = hexToRgb(color);
  return [r / 255, g / 255, b / 255];
}

export type Ramp = [string, string, string, string];

/** Neutral gothic base tones per biome; mixed with theme colors for per-universe mood. */
const BIOME_BASE: Record<TerrainType, string> = {
  ocean: '#10263a',
  river: '#1f5f7a',
  mountain: '#4a423a',
  forest: '#1f3d26',
  desert: '#7a6338',
  plains: '#34422a',
  swamp: '#2b3a2e',
  ice: '#8ea9ba',
  volcanic: '#5a2218',
  void: '#241c3d',
  custom: '#3a3a3a',
};

const PARCHMENT_SHADOW = '#2b2620';

function themedBase(theme: MapTheme, terrainType: TerrainType): string {
  const palette = theme.palette as Record<string, unknown>;
  const pick = (key: string) => (typeof palette[key] === 'string' ? (palette[key] as string) : null);
  switch (terrainType) {
    case 'plains':
      return mix(BIOME_BASE.plains, pick('landColor') ?? BIOME_BASE.plains, 0.5);
    case 'ocean':
      return mix(BIOME_BASE.ocean, pick('seaColor') ?? BIOME_BASE.ocean, 0.5);
    case 'mountain':
      return mix(BIOME_BASE.mountain, pick('mountainColor') ?? BIOME_BASE.mountain, 0.35);
    default:
      return mix(BIOME_BASE[terrainType], theme.palette.primaryAccent, 0.08);
  }
}

export function biomeRamp(theme: MapTheme, terrainType: TerrainType, colorOverride?: string): Ramp {
  const source = colorOverride ?? themedBase(theme, terrainType);
  // Gothic mood: pull every base slightly toward a dark parchment tone
  let base = mix(source, PARCHMENT_SHADOW, 0.15);
  // Guarantee headroom for the dark tone on near-black bases
  if (luminance(base) < 0.004) base = shade(base, 0.12);
  return [shade(base, -0.45), base, shade(base, 0.18), shade(base, 0.4)];
}

export function backdropColor(theme: MapTheme, backdrop: PlaneBackdrop): string {
  const bg = theme.palette.background;
  const palette = theme.palette as Record<string, unknown>;
  const sea = typeof palette.seaColor === 'string' ? (palette.seaColor as string) : '#0a1a2a';
  switch (backdrop) {
    case 'sea':
      return mix(sea, '#0b2236', 0.35);
    case 'sky':
      return mix(bg, '#3b4a6b', 0.35);
    case 'abyss':
      return shade(bg, -0.4);
    case 'river':
      return mix(bg, theme.palette.primaryAccent, 0.08);
    case 'void':
    default:
      return shade(bg, 0);
  }
}

export const DANGER_COLORS: Record<DangerLevel, string> = {
  EX: '#dc2626',
  S: '#f97316',
  A: '#f59e0b',
  B: '#64748b',
  Safe: '#10b981',
};

export type PixelChar = 'o' | 'd' | 'b' | 'l' | 'h' | 's' | 'a' | 'w';
export type PixelSpritePalette = Record<PixelChar, string>;

const OUTLINE = '#0b0b10';
const BONE = '#d8d0bc';

/** Palette for landmark and location icons, tinted by the universe accent. */
export function spritePalette(theme: MapTheme, tint?: string): PixelSpritePalette {
  const base = shade(tint ?? mix(theme.palette.primaryAccent, BONE, 0.35), 0);
  return {
    o: OUTLINE,
    d: shade(base, -0.45),
    b: base,
    l: shade(base, 0.3),
    h: shade(base, 0.6),
    s: shade(BONE, -0.1),
    a: shade(theme.palette.secondaryAccent ?? '#dc2626', 0),
    w: '#ffffff',
  };
}

/** Palette for terrain glyphs, derived from the biome ramp they sit on. */
export function rampPalette(ramp: Ramp, accent: string): PixelSpritePalette {
  return {
    o: shade(ramp[0], -0.35),
    d: ramp[0],
    b: shade(ramp[1], 0.08),
    l: ramp[2],
    h: ramp[3],
    s: shade(ramp[3], 0.25),
    a: shade(accent, 0),
    w: '#ffffff',
  };
}

export function silhouettePalette(color: string): PixelSpritePalette {
  const c = shade(color, 0);
  return { o: c, d: c, b: c, l: c, h: c, s: c, a: c, w: c };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/pixel-palette.test.ts`
Expected: PASS (8 tests). If the strictly-increasing luminance assertion fails for a very dark theme base (e.g. `#04100c`), raise the headroom guard threshold in `biomeRamp` from `0.004` to `0.01` and re-run.

- [ ] **Step 5: Typecheck and commit**

Run: `npx tsc --noEmit`

```bash
git add src/engine/map/scene/pixel-palette.ts tests/pixel-palette.test.ts
git commit -m "feat(map): add pixel-gothic biome ramps and sprite palettes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Pixel sprite art and grid renderer

**Files:**
- Create: `src/engine/map/scene/pixel-sprites.ts`
- Test: `tests/pixel-sprites.test.ts`

**Interfaces:**
- Consumes: `LocationType`, `LandmarkGlyphKind` (Task 1); `GlyphKind`, `TERRAIN_GLYPHS` (Task 6); `PixelChar`, `PixelSpritePalette` (Task 7).
- Produces:
  - `LOCATION_ICONS: Record<LocationType, string[]>` — 12×12 grids.
  - `GLYPH_SPRITES: Record<GlyphKind, string[][]>` — per kind, `TERRAIN_GLYPHS[type].variants` variants of 8×8 grids.
  - `LANDMARK_SPRITES: Record<LandmarkGlyphKind, string[]>` — 12×12 grids.
  - `WAYPOINT_PYLON: string[]` — 8 wide × 9 tall.
  - `PIXEL_GRID_CHARS: ReadonlySet<string>` = `. o d b l h s a w`.
  - `drawPixelGrid(g: Graphics, grid: string[], palette: PixelSpritePalette, originX?: number, originY?: number, pixelSize?: number, alpha?: number): void` — draws one rect per non-`.` cell, batched into a single `fill()` per palette color.
  - Grid legend: `.` transparent, `o` outline, `d` dark, `b` base, `l` light, `h` highlight, `s` stone/bone, `a` accent (glow, lava, danger), `w` white.

- [ ] **Step 1: Write the failing test**

Create `tests/pixel-sprites.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Graphics } from 'pixi.js';
import {
  LOCATION_ICONS,
  GLYPH_SPRITES,
  LANDMARK_SPRITES,
  WAYPOINT_PYLON,
  PIXEL_GRID_CHARS,
  drawPixelGrid,
} from '../src/engine/map/scene/pixel-sprites';
import { TERRAIN_GLYPHS } from '../src/engine/map/scene/glyph-scatter';
import { silhouettePalette } from '../src/engine/map/scene/pixel-palette';
import { LocationType, LandmarkGlyphKind } from '../src/domain/map-types';

const LOCATION_TYPES: LocationType[] = ['city', 'village', 'sect', 'clan', 'castle', 'ruin', 'dungeon', 'mountain', 'cave', 'battlefield', 'temple', 'ocean', 'island', 'portal', 'landmark', 'lake'];
const LANDMARK_KINDS: LandmarkGlyphKind[] = ['volcano', 'spire', 'ruin', 'great-tree', 'citadel', 'crater', 'monolith', 'shipwreck', 'portal-arch', 'skull-rock'];

function expectGrid(grid: string[], width: number, height: number, label: string) {
  expect(grid, label).toHaveLength(height);
  for (const row of grid) {
    expect(row.length, `${label}: "${row}"`).toBe(width);
    for (const ch of row) expect(PIXEL_GRID_CHARS.has(ch), `${label}: bad char "${ch}"`).toBe(true);
  }
  expect(grid.join('').replace(/\./g, '').length, `${label} is empty`).toBeGreaterThan(0);
}

describe('pixel sprites', () => {
  it('defines a 12x12 icon for every location type', () => {
    for (const type of LOCATION_TYPES) expectGrid(LOCATION_ICONS[type], 12, 12, `icon ${type}`);
  });

  it('defines the declared number of 8x8 variants for every glyph kind', () => {
    for (const spec of Object.values(TERRAIN_GLYPHS)) {
      if (!spec) continue;
      const variants = GLYPH_SPRITES[spec.kind];
      expect(variants, spec.kind).toHaveLength(spec.variants);
      variants.forEach((grid, i) => expectGrid(grid, 8, 8, `glyph ${spec.kind}#${i}`));
    }
  });

  it('defines a 12x12 sprite for every landmark glyph kind', () => {
    for (const kind of LANDMARK_KINDS) expectGrid(LANDMARK_SPRITES[kind], 12, 12, `landmark ${kind}`);
  });

  it('defines the waypoint pylon', () => {
    expectGrid(WAYPOINT_PYLON, 8, 9, 'pylon');
  });

  it('draws one rect per opaque cell into a Graphics', () => {
    const g = new Graphics();
    const grid = ['o.', '.b'];
    drawPixelGrid(g, grid, silhouettePalette('#123456'), 10, 20, 2);
    const bounds = g.getLocalBounds();
    expect(bounds.x).toBe(10);
    expect(bounds.y).toBe(20);
    expect(bounds.width).toBe(4);
    expect(bounds.height).toBe(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/pixel-sprites.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement**

Create `src/engine/map/scene/pixel-sprites.ts`:

```ts
/**
 * Hand-drawn pixel-grid sprites for the pixel-gothic atlas.
 *
 * Legend: '.' transparent, 'o' outline, 'd' dark, 'b' base, 'l' light,
 * 'h' highlight, 's' stone/bone, 'a' accent (glow/lava/danger), 'w' white.
 */

import { Graphics } from 'pixi.js';
import { LandmarkGlyphKind, LocationType } from '../../../domain/map-types';
import { GlyphKind } from './glyph-scatter';
import { PixelChar, PixelSpritePalette } from './pixel-palette';

export const PIXEL_GRID_CHARS: ReadonlySet<string> = new Set(['.', 'o', 'd', 'b', 'l', 'h', 's', 'a', 'w']);

export function drawPixelGrid(
  g: Graphics,
  grid: string[],
  palette: PixelSpritePalette,
  originX = 0,
  originY = 0,
  pixelSize = 1,
  alpha = 1
): void {
  // Batch by palette character: one fill() per color keeps bake cost low
  const cellsByChar = new Map<PixelChar, Array<[number, number]>>();
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const list = cellsByChar.get(ch as PixelChar) ?? [];
      list.push([x, y]);
      cellsByChar.set(ch as PixelChar, list);
    }
  }
  for (const [ch, cells] of cellsByChar) {
    for (const [x, y] of cells) {
      g.rect(originX + x * pixelSize, originY + y * pixelSize, pixelSize, pixelSize);
    }
    g.fill({ color: palette[ch], alpha });
  }
}

export const LOCATION_ICONS: Record<LocationType, string[]> = {
  city: [
    '............',
    '..o......o..',
    '.obo....obo.',
    '.obo.oo.obo.',
    '.oboobboobo.',
    '.obbbbbbbbo.',
    '.oblbblbblo.',
    '.obbbbbbbbo.',
    '.obloobolbo.',
    '.obbo..obbo.',
    '.oooo..oooo.',
    '............',
  ],
  village: [
    '............',
    '.....oo.....',
    '....ollo....',
    '...ollllo...',
    '..ollllllo..',
    '.oooooooooo.',
    '..obbbbbbo..',
    '..obboobbo..',
    '..obbddbbo..',
    '..obbddbbo..',
    '..oooooooo..',
    '............',
  ],
  sect: [
    '.....oo.....',
    '....obbo....',
    '..oooooooo..',
    '.ollllllllo.',
    '...obbbbo...',
    '..oooooooo..',
    '.ollllllllo.',
    '...obddbo...',
    '...obddbo...',
    '..oooooooo..',
    '............',
    '............',
  ],
  clan: [
    '............',
    '..oooooooo..',
    '..obbbbbbo..',
    '..oblaalbo..',
    '..obaaaabo..',
    '..obllllbo..',
    '..obbbbbbo..',
    '...obbbbo...',
    '....obbo....',
    '.....oo.....',
    '............',
    '............',
  ],
  castle: [
    '............',
    '.o.o.oo.o.o.',
    '.oooooooooo.',
    '.obbbbbbbbo.',
    '.oblbbbblbo.',
    '.obbbbbbbbo.',
    '.obbboobbbo.',
    '.obbddddbbo.',
    '.obbddddbbo.',
    '.oooooooooo.',
    '............',
    '............',
  ],
  ruin: [
    '............',
    '..o.....o...',
    '.obo...obo..',
    '.obo...obo..',
    '.obo....o...',
    '.obo........',
    '.obo..o.....',
    '.obo.obo....',
    '.obo.obo.oo.',
    'ossssssssso.',
    'ooooooooooo.',
    '............',
  ],
  dungeon: [
    '............',
    '...oooooo...',
    '..osssssso..',
    '.ossddddsso.',
    '.osddddddso.',
    '.osdaddadso.',
    '.osddddddso.',
    '.osddddddso.',
    '.osddddddso.',
    '.oooooooooo.',
    '............',
    '............',
  ],
  mountain: [
    '............',
    '.....oo.....',
    '....ohho....',
    '...ohllbo...',
    '...olbbbo...',
    '..olbbbbbo..',
    '..obbbdbbo..',
    '.olbbddbbbo.',
    '.obbddddbbo.',
    'obbdddddddbo',
    'oooooooooooo',
    '............',
  ],
  cave: [
    '............',
    '............',
    '....oooo....',
    '..oossssoo..',
    '.osssssssso.',
    '.ossoddosso.',
    '.osoddddoso.',
    'osoddddddoso',
    'osoddddddoso',
    'oooooooooooo',
    '............',
    '............',
  ],
  battlefield: [
    '............',
    '.o........o.',
    '..o......o..',
    '...h....h...',
    '....h..h....',
    '.....hh.....',
    '.....hh.....',
    '....h..h....',
    '..oah..hao..',
    '..oo....oo..',
    '.o........o.',
    '............',
  ],
  temple: [
    '............',
    '.....oo.....',
    '....ollo....',
    '...ollllo...',
    '..oooooooo..',
    '..os.ss.so..',
    '..os.ss.so..',
    '..os.ss.so..',
    '..os.ss.so..',
    '.oooooooooo.',
    'osssssssssso',
    'oooooooooooo',
  ],
  ocean: [
    '............',
    '............',
    '............',
    '..oo....oo..',
    '.ollo..ollo.',
    'ob..lbbl..bo',
    '............',
    '..oo....oo..',
    '.ollo..ollo.',
    'ob..lbbl..bo',
    '............',
    '............',
  ],
  island: [
    '............',
    '...ooo.oo...',
    '..ollloollo.',
    '.ol..ol..lo.',
    '.....ol.....',
    '.....ol.....',
    '....ool.....',
    '...ossso....',
    '..ossssso...',
    '.obbbbbbbbo.',
    'obbbbbbbbbbo',
    '............',
  ],
  portal: [
    '....oooo....',
    '...oaaaao...',
    '..oa....ao..',
    '..oa.hh.ao..',
    '.oa.hllh.ao.',
    '.oa.hllh.ao.',
    '.oa.hllh.ao.',
    '.oa..hh..ao.',
    '.oa......ao.',
    '.oa......ao.',
    'oooo....oooo',
    '............',
  ],
  landmark: [
    '.....oo.....',
    '.....hh.....',
    '....ohho....',
    '....olbo....',
    '....olbo....',
    '....olbo....',
    '....olbo....',
    '...oolboo...',
    '...olbbbo...',
    '..oooooooo..',
    '..osssssso..',
    '..oooooooo..',
  ],
  lake: [
    '............',
    '............',
    '...oooooo...',
    '..obbbbbbo..',
    '.obblllbbbo.',
    '.oblhhllbbo.',
    '.obbllbbbbo.',
    '..obbbbbbo..',
    '...oooooo...',
    '............',
    '............',
    '............',
  ],
};

export const GLYPH_SPRITES: Record<GlyphKind, string[][]> = {
  peak: [
    [
      '...oo...',
      '..ohho..',
      '..olbo..',
      '.olbbdo.',
      '.obbddo.',
      'olbbdddo',
      'oooooooo',
      '........',
    ],
    [
      '........',
      '..o.....',
      '.oho.o..',
      '.olboho.',
      'olbbolbo',
      'obbdobdo',
      'oooooooo',
      '........',
    ],
    [
      '........',
      '........',
      '...oo...',
      '..ohho..',
      '.olbbdo.',
      'obbbddo.',
      'ooooooo.',
      '........',
    ],
  ],
  pine: [
    [
      '...oo...',
      '..olbo..',
      '.olbbdo.',
      '..obdo..',
      '.olbbdo.',
      'olbbbddo',
      'oooddooo',
      '...dd...',
    ],
    [
      '........',
      '...oo...',
      '..olbo..',
      '.olbbdo.',
      '..obdo..',
      '.olbbdo.',
      '.oooooo.',
      '...dd...',
    ],
    [
      '..oooo..',
      '.olllbo.',
      'olllbbbo',
      'olbbbbdo',
      '.obbddo.',
      '..oddo..',
      '...dd...',
      '...dd...',
    ],
  ],
  dune: [
    [
      '........',
      '........',
      '...oooo.',
      '..ohlllo',
      '.ohlllbo',
      'olllbbbo',
      'oooooooo',
      '........',
    ],
    [
      '........',
      '........',
      '........',
      'oooo....',
      'ollloo..',
      'olllbbo.',
      'oooooooo',
      '........',
    ],
  ],
  reed: [
    [
      '........',
      '.h...h..',
      '.o.h.o..',
      '.o.o.o.h',
      '.o.o.o.o',
      '.oloolo.',
      '..oooo..',
      '........',
    ],
    [
      '........',
      '..h.....',
      '..o..h..',
      '..o.oo..',
      '.oo.o.o.',
      '.o.oo.o.',
      '..oooo..',
      '........',
    ],
  ],
  shard: [
    [
      '...o....',
      '..oho...',
      '..olo.o.',
      '.olbooho',
      '.olbolbo',
      'olbbolbo',
      'oooooooo',
      '........',
    ],
    [
      '....o...',
      '...oho..',
      '...olo..',
      '..olbo..',
      '..olbo..',
      '.olbbdo.',
      '.oooooo.',
      '........',
    ],
  ],
  vent: [
    [
      '...ss...',
      '..s..s..',
      '...ss...',
      '..oooo..',
      '.obaabo.',
      'obbaabbo',
      'oooooooo',
      '........',
    ],
    [
      '....s...',
      '...s....',
      '....s...',
      '........',
      '..oaao..',
      '.obaabo.',
      'oooooooo',
      '........',
    ],
  ],
  crack: [
    [
      '........',
      'o.......',
      '.o......',
      '..oa....',
      '...oao..',
      '....o.a.',
      '......oa',
      '........',
    ],
    [
      '.....o..',
      '....o...',
      '...ao...',
      '..oa....',
      '..o.o...',
      '.o...oa.',
      'o.......',
      '........',
    ],
  ],
  tuft: [
    [
      '........',
      '........',
      '........',
      '........',
      '..l.l...',
      '.lbllb..',
      '..bdb...',
      '........',
    ],
    [
      '........',
      '........',
      '........',
      '........',
      '...l....',
      '.l.b.l..',
      '..bbb...',
      '........',
    ],
  ],
  wave: [
    [
      '........',
      '........',
      '........',
      '.ll.....',
      'l..l..l.',
      '....ll..',
      '........',
      '........',
    ],
    [
      '........',
      '........',
      '........',
      '....ll..',
      '...l..l.',
      '.ll.....',
      '........',
      '........',
    ],
  ],
};

export const LANDMARK_SPRITES: Record<LandmarkGlyphKind, string[]> = {
  volcano: [
    '....aaa.....',
    '.....a......',
    '....oaao....',
    '...oddddo...',
    '...olbddo...',
    '..olbbbddo..',
    '..olbbbddo..',
    '.olbbbbdddo.',
    '.obbbbbdddo.',
    'olbbbbbddddo',
    'oooooooooooo',
    '............',
  ],
  spire: [
    '.....oo.....',
    '.....hh.....',
    '....ohlo....',
    '....olbo....',
    '....olbo....',
    '...oolbdo...',
    '...olbbdo...',
    '...olbbdo...',
    '..oolbbddo..',
    '..olbbbddo..',
    '.oooooooooo.',
    '............',
  ],
  ruin: [
    '............',
    '.o.......o..',
    'oso.....oso.',
    'oso.o...oso.',
    'oso.....oso.',
    'oso..o..oso.',
    'oso.oso.oso.',
    'oso.oso.oso.',
    'oso.oso.oso.',
    'ossssssssso.',
    'ooooooooooo.',
    '............',
  ],
  'great-tree': [
    '...oooooo...',
    '..olllllbo..',
    '.olllllbbbo.',
    'olllllbbbbbo',
    'olllbbbbbbdo',
    '.obbbbbbddo.',
    '..oobddboo..',
    '....oddo....',
    '....oddo....',
    '....oddo....',
    '...oddddo...',
    '..oooooooo..',
  ],
  citadel: [
    '..o..oo..o..',
    '.oho.oo.oho.',
    '.olo.oo.olo.',
    '.olooaaoolo.',
    '.olbbbbbblo.',
    '.olbllllblo.',
    '.olbbbbbblo.',
    '.olbbddbblo.',
    '.olbbddbblo.',
    'oooooooooooo',
    'osssssssssso',
    'oooooooooooo',
  ],
  crater: [
    '............',
    '............',
    '............',
    '...oooooo...',
    '.oollsslloo.',
    'olldddddddlo',
    'olddaaaaddlo',
    'olldddddddlo',
    '.oollsslloo.',
    '...oooooo...',
    '............',
    '............',
  ],
  monolith: [
    '....oooo....',
    '...ossdso...',
    '...osadso...',
    '...ossdso...',
    '...osadso...',
    '...ossdso...',
    '...ossdso...',
    '...osadso...',
    '...ossdso...',
    '..oossdsoo..',
    '.oooooooooo.',
    '............',
  ],
  shipwreck: [
    '............',
    '.....o......',
    '.....o.oo...',
    '....oo.o....',
    '...oso.o....',
    '..osso.o....',
    '.......o....',
    'oooooooooo..',
    'obbdbbdbbo..',
    '.obbbbbbo...',
    '..oooooo....',
    '............',
  ],
  'portal-arch': [
    '...oooooo...',
    '..osssssso..',
    '.osooooooso.',
    '.oso.aa.oso.',
    '.osoahhaoso.',
    '.osoahhaoso.',
    '.osoahhaoso.',
    '.oso.aa.oso.',
    '.oso....oso.',
    '.oso....oso.',
    'ooooo..ooooo',
    '............',
  ],
  'skull-rock': [
    '...oooooo...',
    '..osssssso..',
    '.osssssssso.',
    '.osddssddso.',
    '.osdassadso.',
    '.osddssddso.',
    '.osssddssso.',
    '..osssssso..',
    '..osososso..',
    '...oooooo...',
    '............',
    '............',
  ],
};

export const WAYPOINT_PYLON: string[] = [
  '...oo...',
  '..oaao..',
  '..oaao..',
  '...oo...',
  '..osso..',
  '..osso..',
  '..osso..',
  '.osssso.',
  'oooooooo',
];
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/pixel-sprites.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Typecheck and commit**

Run: `npx tsc --noEmit`

```bash
git add src/engine/map/scene/pixel-sprites.ts tests/pixel-sprites.test.ts
git commit -m "feat(map): add hand-drawn pixel sprite grids for icons, glyphs and landmarks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Retargetable tween manager

**Files:**
- Create: `src/engine/map/anim/tween.ts`
- Test: `tests/tween.test.ts`

**Interfaces:**
- Produces:
  - `type Easing = (t: number) => number`
  - `const Ease: { linear: Easing; outCubic: Easing; inOutCubic: Easing; outBack: Easing }`
  - `interface TweenSpec { from?: number; to: number; durationMs: number; ease?: Easing; onUpdate: (value: number) => void; onComplete?: () => void }`
  - `class TweenManager { to(key: string, spec: TweenSpec): void; value(key: string): number | undefined; isActive(key: string): boolean; cancel(key: string): void; tick(dtMs: number): void; clear(): void; readonly size: number }`
  - Semantics: calling `to()` for a key that is already animating **retargets** from the key's current value (no queue). `durationMs <= 0` applies the final value synchronously. `cancel` stops updates but keeps the last value. `onComplete` may start a new tween on the same key.

- [ ] **Step 1: Write the failing test**

Create `tests/tween.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { TweenManager, Ease } from '../src/engine/map/anim/tween';

describe('TweenManager', () => {
  it('interpolates linearly and completes once', () => {
    const tm = new TweenManager();
    const values: number[] = [];
    const done = vi.fn();
    tm.to('a', { from: 0, to: 100, durationMs: 100, ease: Ease.linear, onUpdate: (v) => values.push(v), onComplete: done });
    tm.tick(50);
    expect(values[values.length - 1]).toBeCloseTo(50);
    tm.tick(60);
    expect(values[values.length - 1]).toBe(100);
    expect(done).toHaveBeenCalledTimes(1);
    expect(tm.isActive('a')).toBe(false);
    tm.tick(50);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('retargets from the current value instead of queuing', () => {
    const tm = new TweenManager();
    let last = 0;
    tm.to('a', { from: 0, to: 100, durationMs: 100, ease: Ease.linear, onUpdate: (v) => (last = v) });
    tm.tick(50);
    tm.to('a', { to: 0, durationMs: 100, ease: Ease.linear, onUpdate: (v) => (last = v) });
    tm.tick(50);
    expect(last).toBeCloseTo(25);
    tm.tick(50);
    expect(last).toBe(0);
    expect(tm.size).toBe(0);
  });

  it('applies zero-duration tweens synchronously', () => {
    const tm = new TweenManager();
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    tm.to('a', { from: 3, to: 7, durationMs: 0, onUpdate, onComplete });
    expect(onUpdate).toHaveBeenCalledWith(7);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(tm.value('a')).toBe(7);
    expect(tm.isActive('a')).toBe(false);
  });

  it('cancels without further updates and keeps the last value', () => {
    const tm = new TweenManager();
    const onUpdate = vi.fn();
    tm.to('a', { from: 0, to: 10, durationMs: 100, ease: Ease.linear, onUpdate });
    tm.tick(50);
    tm.cancel('a');
    tm.tick(100);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(tm.value('a')).toBeCloseTo(5);
  });

  it('allows onComplete to chain a new tween on the same key', () => {
    const tm = new TweenManager();
    let last = 0;
    tm.to('pulse', {
      from: 0,
      to: 1,
      durationMs: 10,
      ease: Ease.linear,
      onUpdate: (v) => (last = v),
      onComplete: () => tm.to('pulse', { to: 0, durationMs: 10, ease: Ease.linear, onUpdate: (v) => (last = v) }),
    });
    tm.tick(10);
    expect(last).toBe(1);
    expect(tm.isActive('pulse')).toBe(true);
    tm.tick(10);
    expect(last).toBe(0);
  });

  it('provides easings that start at 0 and end at 1', () => {
    for (const ease of Object.values(Ease)) {
      expect(ease(0)).toBeCloseTo(0);
      expect(ease(1)).toBeCloseTo(1);
    }
    expect(Ease.outCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('clears everything', () => {
    const tm = new TweenManager();
    tm.to('a', { from: 0, to: 1, durationMs: 100, onUpdate: () => {} });
    tm.to('b', { from: 0, to: 1, durationMs: 100, onUpdate: () => {} });
    tm.clear();
    expect(tm.size).toBe(0);
    expect(tm.value('a')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/tween.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement**

Create `src/engine/map/anim/tween.ts`:

```ts
/**
 * Minimal ticker-driven numeric tween system.
 *
 * Keyed tweens retarget from their current value when restarted, so rapid
 * chapter scrubbing never builds an animation queue.
 */

export type Easing = (t: number) => number;

export const Ease = {
  linear: ((t) => t) as Easing,
  outCubic: ((t) => 1 - Math.pow(1 - t, 3)) as Easing,
  inOutCubic: ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)) as Easing,
  outBack: ((t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }) as Easing,
};

export interface TweenSpec {
  from?: number;
  to: number;
  durationMs: number;
  ease?: Easing;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

interface ActiveTween {
  from: number;
  to: number;
  durationMs: number;
  elapsedMs: number;
  ease: Easing;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

export class TweenManager {
  private readonly tweens = new Map<string, ActiveTween>();
  private readonly values = new Map<string, number>();

  public get size(): number {
    return this.tweens.size;
  }

  public to(key: string, spec: TweenSpec): void {
    const from = spec.from ?? this.values.get(key) ?? spec.to;
    if (spec.durationMs <= 0) {
      this.tweens.delete(key);
      this.values.set(key, spec.to);
      spec.onUpdate(spec.to);
      spec.onComplete?.();
      return;
    }
    this.values.set(key, from);
    this.tweens.set(key, {
      from,
      to: spec.to,
      durationMs: spec.durationMs,
      elapsedMs: 0,
      ease: spec.ease ?? Ease.outCubic,
      onUpdate: spec.onUpdate,
      onComplete: spec.onComplete,
    });
  }

  public value(key: string): number | undefined {
    return this.values.get(key);
  }

  public isActive(key: string): boolean {
    return this.tweens.has(key);
  }

  public cancel(key: string): void {
    this.tweens.delete(key);
  }

  public tick(dtMs: number): void {
    for (const [key, tween] of Array.from(this.tweens.entries())) {
      if (this.tweens.get(key) !== tween) continue;
      tween.elapsedMs += dtMs;
      const t = Math.min(1, tween.elapsedMs / tween.durationMs);
      const value = tween.from + (tween.to - tween.from) * tween.ease(t);
      this.values.set(key, value);
      tween.onUpdate(value);
      if (t >= 1) {
        this.tweens.delete(key);
        tween.onComplete?.();
      }
    }
  }

  public clear(): void {
    this.tweens.clear();
    this.values.clear();
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/tween.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Typecheck and commit**

Run: `npx tsc --noEmit`

```bash
git add src/engine/map/anim/tween.ts tests/tween.test.ts
git commit -m "feat(map): add retargetable tween manager

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Camera additions, gesture tracker and picking

**Files:**
- Modify: `src/engine/map/camera-controller.ts`
- Create: `src/engine/map/input/gesture-tracker.ts`
- Create: `src/engine/map/input/picking.ts`
- Test: `tests/map-input.test.ts`

**Interfaces:**
- Consumes: `ProjectedWorldMapSnapshot`, `FogStatus` (Task 2); `pointInPolygon`, `Vec2` (Task 5).
- Produces:
  - `CameraController.setWorldSize(width: number, height: number): void`
  - `CameraController.fitZoom(padding?: number): number` (default padding 0.92)
  - `CameraController.fitWorld(): void` (center + fit zoom, stops animation)
  - `CameraController.getViewBounds(): { minX: number; minY: number; maxX: number; maxY: number }` (world units)
  - `CameraController.resize(w, h)` ignores non-positive sizes.
  - `type GestureEvent = { type: 'pan'; dx: number; dy: number } | { type: 'pinch'; scale: number; centerX: number; centerY: number } | { type: 'click'; x: number; y: number } | { type: 'hover'; x: number; y: number }`
  - `class GestureTracker { constructor(dragThreshold?: number /* 4 */); readonly isDragging: boolean; down(id: number, x: number, y: number): void; move(id: number, x: number, y: number): GestureEvent | null; up(id: number, x: number, y: number): GestureEvent | null; cancel(): void }`
  - `type PickTarget = { kind: 'location'; id: string } | { kind: 'event'; id: string } | { kind: 'region'; id: string }`
  - `pickAt(snapshot: ProjectedWorldMapSnapshot, worldX: number, worldY: number, zoom: number): PickTarget | null` — events first, then nearest non-UNKNOWN location within `max(16, 12 / zoom)` world units (critical: `max(20, 14 / zoom)`), then the last region polygon containing the point.
  - Constants exported from `picking.ts`: `EVENT_FLAG_OFFSET = { x: 10, y: -26 }` (event flag position relative to its location; reused by the markers layer) and `PICK_CENTER_OFFSET_Y = 10` (location pick circles are centered 10 units above the point, on the bottom-anchored icon).

- [ ] **Step 1: Write the failing test**

Create `tests/map-input.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { CameraController } from '../src/engine/map/camera-controller';
import { GestureTracker } from '../src/engine/map/input/gesture-tracker';
import { pickAt, EVENT_FLAG_OFFSET } from '../src/engine/map/input/picking';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

describe('CameraController additions', () => {
  const make = () => new CameraController({ worldWidth: 1000, worldHeight: 500, viewWidth: 800, viewHeight: 600 });

  it('fits the world into the viewport', () => {
    const cam = make();
    cam.fitWorld();
    expect(cam.zoom).toBeCloseTo(0.8 * 0.92);
    expect(cam.x).toBe(500);
    expect(cam.y).toBe(250);
  });

  it('changes world size and re-clamps position', () => {
    const cam = make();
    cam.setPosition(900, 400);
    cam.setWorldSize(400, 300);
    expect(cam.x).toBe(400);
    expect(cam.y).toBe(300);
  });

  it('reports the visible world bounds', () => {
    const cam = make();
    cam.setPosition(500, 250);
    cam.setZoom(2);
    expect(cam.getViewBounds()).toEqual({ minX: 300, minY: 100, maxX: 700, maxY: 400 });
  });

  it('ignores zero-size resizes', () => {
    const cam = make();
    cam.resize(0, 0);
    expect(cam.viewWidth).toBe(800);
    expect(cam.viewHeight).toBe(600);
    cam.resize(1024, 768);
    expect(cam.viewWidth).toBe(1024);
  });
});

describe('GestureTracker', () => {
  it('turns a small press-release into a click', () => {
    const gt = new GestureTracker(4);
    gt.down(1, 100, 100);
    expect(gt.move(1, 102, 101)).toBeNull();
    expect(gt.up(1, 102, 101)).toEqual({ type: 'click', x: 102, y: 101 });
  });

  it('starts a pan after the threshold with the accumulated delta, then streams deltas', () => {
    const gt = new GestureTracker(4);
    gt.down(1, 100, 100);
    expect(gt.move(1, 110, 100)).toEqual({ type: 'pan', dx: 10, dy: 0 });
    expect(gt.isDragging).toBe(true);
    expect(gt.move(1, 113, 104)).toEqual({ type: 'pan', dx: 3, dy: 4 });
    expect(gt.up(1, 113, 104)).toBeNull();
    expect(gt.isDragging).toBe(false);
  });

  it('reports hover moves when no pointer is down', () => {
    const gt = new GestureTracker();
    expect(gt.move(7, 5, 6)).toEqual({ type: 'hover', x: 5, y: 6 });
  });

  it('reports pinch scale around the midpoint and never clicks after a pinch', () => {
    const gt = new GestureTracker();
    gt.down(1, 100, 100);
    gt.down(2, 200, 100);
    const ev = gt.move(2, 300, 100);
    expect(ev).toEqual({ type: 'pinch', scale: 2, centerX: 200, centerY: 100 });
    expect(gt.up(2, 300, 100)).toBeNull();
    expect(gt.up(1, 100, 100)).toBeNull();
  });

  it('resets on cancel', () => {
    const gt = new GestureTracker();
    gt.down(1, 0, 0);
    gt.move(1, 50, 0);
    gt.cancel();
    expect(gt.isDragging).toBe(false);
    expect(gt.move(1, 60, 0)).toEqual({ type: 'hover', x: 60, y: 0 });
  });
});

describe('pickAt', () => {
  const def: WorldMapDefinition = {
    id: 'pick', universeId: 'test', coordinateSystem: 'world', width: 1000, height: 1000,
    terrain: [],
    regions: [
      { id: 'big', name: 'Big', geometry: { type: 'Polygon', coordinates: [[[0, 0], [1000, 0], [1000, 1000], [0, 1000]]] } },
      { id: 'small', name: 'Small', geometry: { type: 'MultiPolygon', coordinates: [[[[600, 600], [800, 600], [800, 800], [600, 800]]]] } },
    ],
    locations: [
      { id: 'near', name: 'Near', x: 100, y: 100, type: 'city', importance: 'major', firstAppearanceChapter: 1, revealedAtChapter: 1 },
      { id: 'far', name: 'Far', x: 130, y: 100, type: 'city', importance: 'major', firstAppearanceChapter: 1, revealedAtChapter: 1 },
      { id: 'future', name: 'Future', x: 400, y: 400, type: 'city', importance: 'critical', firstAppearanceChapter: 99, revealedAtChapter: 99 },
    ],
    routes: [], territories: [],
    events: [{ id: 'ev', name: 'Battle', chapter: 1, locationId: 'far', eventType: 'battle', importance: 'major' }],
    characterPaths: [],
  };
  const snap = projectTemporalMap(def, 10);

  it('prefers event flags over locations', () => {
    expect(pickAt(snap, 130 + EVENT_FLAG_OFFSET.x, 100 + EVENT_FLAG_OFFSET.y, 1)).toEqual({ kind: 'event', id: 'ev' });
  });

  it('picks the nearest visible location within the radius', () => {
    expect(pickAt(snap, 108, 100, 1)).toEqual({ kind: 'location', id: 'near' });
    expect(pickAt(snap, 124, 100, 1)).toEqual({ kind: 'location', id: 'far' });
  });

  it('never picks locations that are not in the snapshot', () => {
    expect(pickAt(snap, 400, 400, 1)).toEqual({ kind: 'region', id: 'big' });
  });

  it('falls back to the topmost region containing the point', () => {
    expect(pickAt(snap, 700, 700, 1)).toEqual({ kind: 'region', id: 'small' });
    expect(pickAt(snap, -50, -50, 1)).toBeNull();
  });

  it('widens the pick radius when zoomed out', () => {
    expect(pickAt(snap, 100, 110, 1)).toEqual({ kind: 'region', id: 'big' });
    expect(pickAt(snap, 100, 110, 0.5)).toEqual({ kind: 'location', id: 'near' });
  });

  it('centers the pick circle on the bottom-anchored icon', () => {
    // 14 units above the point is inside the icon; 14 below is not
    expect(pickAt(snap, 100, 86, 1)).toEqual({ kind: 'location', id: 'near' });
    expect(pickAt(snap, 100, 114, 1)).toEqual({ kind: 'region', id: 'big' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/map-input.test.ts`
Expected: FAIL — `cam.fitWorld is not a function` / modules missing.

- [ ] **Step 3: Extend CameraController**

In `src/engine/map/camera-controller.ts`:

1. Replace the `resize` method with:

```ts
  /**
   * Resize viewport dimensions (ignores zero/negative sizes from hidden containers)
   */
  public resize(viewWidth: number, viewHeight: number): void {
    if (viewWidth <= 0 || viewHeight <= 0) return;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
  }
```

2. Add these methods before `reset`:

```ts
  /**
   * Change the world (plane) size and re-clamp the camera
   */
  public setWorldSize(width: number, height: number): void {
    this.worldWidth = width;
    this.worldHeight = height;
    this.clampPosition();
  }

  /**
   * Zoom level at which the whole world fits the viewport
   */
  public fitZoom(padding: number = 0.92): number {
    const fit = Math.min(this.viewWidth / this.worldWidth, this.viewHeight / this.worldHeight);
    return this.clampZoom(fit * padding);
  }

  /**
   * Center the world and fit it in the viewport
   */
  public fitWorld(): void {
    this.stopAnimation();
    this.zoom = this.fitZoom();
    this.x = this.worldWidth / 2;
    this.y = this.worldHeight / 2;
  }

  /**
   * Visible world-space rectangle
   */
  public getViewBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const halfW = this.viewWidth / 2 / this.zoom;
    const halfH = this.viewHeight / 2 / this.zoom;
    return { minX: this.x - halfW, minY: this.y - halfH, maxX: this.x + halfW, maxY: this.y + halfH };
  }
```

- [ ] **Step 4: Implement the gesture tracker**

Create `src/engine/map/input/gesture-tracker.ts`:

```ts
/**
 * Pure pointer gesture state machine: distinguishes click vs drag (threshold),
 * streams pan deltas, and reports two-finger pinch scale.
 */

export type GestureEvent =
  | { type: 'pan'; dx: number; dy: number }
  | { type: 'pinch'; scale: number; centerX: number; centerY: number }
  | { type: 'click'; x: number; y: number }
  | { type: 'hover'; x: number; y: number };

interface TrackedPointer {
  x: number;
  y: number;
  startX: number;
  startY: number;
}

export class GestureTracker {
  private readonly pointers = new Map<number, TrackedPointer>();
  private dragging = false;
  private pinchDistance: number | null = null;

  constructor(private readonly dragThreshold: number = 4) {}

  public get isDragging(): boolean {
    return this.dragging;
  }

  public down(id: number, x: number, y: number): void {
    this.pointers.set(id, { x, y, startX: x, startY: y });
    if (this.pointers.size === 2) {
      this.dragging = true;
      this.pinchDistance = this.currentPinchDistance();
    }
  }

  public move(id: number, x: number, y: number): GestureEvent | null {
    const pointer = this.pointers.get(id);
    if (!pointer) return { type: 'hover', x, y };

    if (this.pointers.size >= 2) {
      pointer.x = x;
      pointer.y = y;
      const distance = this.currentPinchDistance();
      if (this.pinchDistance === null || this.pinchDistance === 0) {
        this.pinchDistance = distance;
        return null;
      }
      const scale = distance / this.pinchDistance;
      this.pinchDistance = distance;
      const [a, b] = Array.from(this.pointers.values());
      return { type: 'pinch', scale, centerX: (a.x + b.x) / 2, centerY: (a.y + b.y) / 2 };
    }

    const dx = x - pointer.x;
    const dy = y - pointer.y;
    pointer.x = x;
    pointer.y = y;

    if (!this.dragging) {
      if (Math.hypot(x - pointer.startX, y - pointer.startY) < this.dragThreshold) return null;
      this.dragging = true;
      return { type: 'pan', dx: x - pointer.startX, dy: y - pointer.startY };
    }
    return { type: 'pan', dx, dy };
  }

  public up(id: number, x: number, y: number): GestureEvent | null {
    const pointer = this.pointers.get(id);
    if (!pointer) return null;
    this.pointers.delete(id);
    const wasDragging = this.dragging;
    if (this.pointers.size < 2) this.pinchDistance = null;
    if (this.pointers.size === 0) this.dragging = false;
    if (!wasDragging && this.pointers.size === 0) return { type: 'click', x, y };
    return null;
  }

  public cancel(): void {
    this.pointers.clear();
    this.dragging = false;
    this.pinchDistance = null;
  }

  private currentPinchDistance(): number {
    const [a, b] = Array.from(this.pointers.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  }
}
```

- [ ] **Step 5: Implement picking**

Create `src/engine/map/input/picking.ts`:

```ts
/**
 * Deterministic world-space hit testing for markers, event flags and regions.
 * Used instead of Pixi's per-object event system so drags never trigger clicks.
 */

import { FogStatus, ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { pointInPolygon, Vec2 } from '../scene/geometry';

export type PickTarget =
  | { kind: 'location'; id: string }
  | { kind: 'event'; id: string }
  | { kind: 'region'; id: string };

/** Event flag position relative to its location (world units). */
export const EVENT_FLAG_OFFSET = { x: 10, y: -26 } as const;
/** Icons are bottom-anchored and drawn above the point: pick around the icon's visual center. */
export const PICK_CENTER_OFFSET_Y = 10;
const EVENT_FLAG_RADIUS = 7;

export function pickAt(
  snapshot: ProjectedWorldMapSnapshot,
  worldX: number,
  worldY: number,
  zoom: number
): PickTarget | null {
  const safeZoom = Math.max(zoom, 0.05);
  const byId = new Map(snapshot.locations.map((l) => [l.id, l]));

  // 1. Event flags (drawn above markers)
  for (const ev of snapshot.events) {
    const loc = ev.locationId ? byId.get(ev.locationId) : undefined;
    if (!loc || loc.fogStatus === FogStatus.UNKNOWN) continue;
    const fx = loc.x + EVENT_FLAG_OFFSET.x;
    const fy = loc.y + EVENT_FLAG_OFFSET.y;
    if (Math.hypot(worldX - fx, worldY - fy) <= EVENT_FLAG_RADIUS) return { kind: 'event', id: ev.id };
  }

  // 2. Nearest location within its pick radius
  let best: { id: string; distance: number } | null = null;
  for (const loc of snapshot.locations) {
    if (loc.fogStatus === FogStatus.UNKNOWN) continue;
    const radius =
      loc.importance === 'critical' ? Math.max(20, 14 / safeZoom) : Math.max(16, 12 / safeZoom);
    const distance = Math.hypot(worldX - loc.x, worldY - (loc.y - PICK_CENTER_OFFSET_Y));
    if (distance <= radius && (!best || distance < best.distance)) best = { id: loc.id, distance };
  }
  if (best) return { kind: 'location', id: best.id };

  // 3. Topmost (last drawn) region containing the point
  for (let i = snapshot.regions.length - 1; i >= 0; i--) {
    const region = snapshot.regions[i];
    const polygons =
      region.geometry.type === 'Polygon'
        ? [region.geometry.coordinates as number[][][]]
        : (region.geometry.coordinates as number[][][][]);
    for (const polygon of polygons) {
      const outer = polygon[0] as unknown as Vec2[];
      if (outer && outer.length >= 3 && pointInPolygon(worldX, worldY, outer)) {
        return { kind: 'region', id: region.id };
      }
    }
  }

  return null;
}
```

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/map-input.test.ts tests/pixi-renderer.test.ts`
Expected: PASS. Pick geometry: the pick center for `near` is `(100, 90)`. At zoom 1 the non-critical radius is `max(16, 12)` = 16, so `(100,110)` (distance 20) is a region; at zoom 0.5 the radius is `max(16, 24)` = 24 → location `near`. `(100,86)` is 4 away (location), `(100,114)` is 24 away (region).

- [ ] **Step 7: Typecheck and commit**

Run: `npx tsc --noEmit && npm test`

```bash
git add src/engine/map/camera-controller.ts src/engine/map/input tests/map-input.test.ts
git commit -m "feat(map): add camera fit/bounds, gesture tracker and deterministic picking

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Icon atlas texture factory and layer context

**Files:**
- Create: `src/engine/map/scene/icon-atlas.ts`
- Create: `src/engine/map/layers/layer-context.ts`
- Test: `tests/icon-atlas.test.ts`

**Interfaces:**
- Consumes: sprites (Task 8), palettes (Task 7), `GlyphKind` (Task 6), `TweenManager` (Task 9), `MapTheme`, `LocationType`, `LandmarkGlyphKind`.
- Produces:
  - `interface TextureBaker { generateTexture(target: Container, width: number, height: number): Texture }`
  - `createRendererBaker(renderer: Renderer): TextureBaker` (frame = full grid size, resolution 1, no antialias, `scaleMode = 'nearest'`)
  - `class IconAtlas { constructor(baker: TextureBaker | null, theme: MapTheme); readonly canBake: boolean; location(type: LocationType, variant?: 'lit' | 'silhouette'): Texture; glyph(kind: GlyphKind, variant: number, ramp: Ramp): Texture; landmark(kind: LandmarkGlyphKind): Texture; pylon(lit: boolean): Texture; softDisc(): Texture; destroy(): void }` — every method caches by key; with `baker === null` returns `Texture.EMPTY` (node/test mode). `softDisc()` is a 128×128 white radial disc: full alpha inside 55% radius, stepped falloff to 0 at the edge (used for fog apertures and torch-lights).
  - `interface LayerContext { theme: MapTheme; atlas: IconAtlas; tweens: TweenManager; reducedMotion: boolean }`
  - Constants: `SOFT_DISC_RADIUS = 64`.

- [ ] **Step 1: Write the failing test**

Create `tests/icon-atlas.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { Container, Texture } from 'pixi.js';
import { IconAtlas, TextureBaker, SOFT_DISC_RADIUS } from '../src/engine/map/scene/icon-atlas';
import { getMapTheme } from '../src/domain/map-themes';
import { biomeRamp } from '../src/engine/map/scene/pixel-palette';

function fakeBaker() {
  const made: Array<{ width: number; height: number; destroy: ReturnType<typeof vi.fn> }> = [];
  const baker: TextureBaker = {
    generateTexture: vi.fn((_target: Container, width: number, height: number) => {
      const tex = { width, height, destroy: vi.fn() };
      made.push(tex);
      return tex as unknown as Texture;
    }),
  };
  return { baker, made };
}

describe('IconAtlas', () => {
  const theme = getMapTheme('reverend-insanity');

  it('returns Texture.EMPTY without a baker', () => {
    const atlas = new IconAtlas(null, theme);
    expect(atlas.canBake).toBe(false);
    expect(atlas.location('city')).toBe(Texture.EMPTY);
    expect(atlas.softDisc()).toBe(Texture.EMPTY);
  });

  it('bakes each sprite once and caches it', () => {
    const { baker } = fakeBaker();
    const atlas = new IconAtlas(baker, theme);
    const a = atlas.location('city');
    const b = atlas.location('city');
    expect(a).toBe(b);
    atlas.location('city', 'silhouette');
    atlas.landmark('volcano');
    atlas.pylon(true);
    atlas.pylon(false);
    const ramp = biomeRamp(theme, 'mountain');
    atlas.glyph('peak', 0, ramp);
    atlas.glyph('peak', 0, ramp);
    expect(baker.generateTexture).toHaveBeenCalledTimes(6);
  });

  it('bakes sprites with their full grid frame size', () => {
    const { baker, made } = fakeBaker();
    const atlas = new IconAtlas(baker, theme);
    atlas.location('village');
    atlas.glyph('pine', 1, biomeRamp(theme, 'forest'));
    atlas.pylon(true);
    atlas.softDisc();
    expect(made.map((t) => [t.width, t.height])).toEqual([
      [12, 12],
      [8, 8],
      [8, 9],
      [SOFT_DISC_RADIUS * 2, SOFT_DISC_RADIUS * 2],
    ]);
  });

  it('destroys every baked texture', () => {
    const { baker, made } = fakeBaker();
    const atlas = new IconAtlas(baker, theme);
    atlas.location('city');
    atlas.softDisc();
    atlas.destroy();
    for (const t of made) expect(t.destroy).toHaveBeenCalledWith(true);
    atlas.location('city');
    expect(baker.generateTexture).toHaveBeenCalledTimes(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/icon-atlas.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement the atlas**

Create `src/engine/map/scene/icon-atlas.ts`:

```ts
/**
 * Cached texture factory for pixel sprites. Bakes each Graphics-drawn grid
 * into a nearest-filtered texture exactly once per theme.
 */

import { Container, Graphics, Rectangle, Renderer, Texture } from 'pixi.js';
import { MapTheme } from '../../../domain/map-themes';
import { LandmarkGlyphKind, LocationType } from '../../../domain/map-types';
import { GlyphKind } from './glyph-scatter';
import {
  PixelSpritePalette,
  Ramp,
  rampPalette,
  shade,
  silhouettePalette,
  spritePalette,
} from './pixel-palette';
import {
  GLYPH_SPRITES,
  LANDMARK_SPRITES,
  LOCATION_ICONS,
  WAYPOINT_PYLON,
  drawPixelGrid,
} from './pixel-sprites';

export const SOFT_DISC_RADIUS = 64;

export interface TextureBaker {
  generateTexture(target: Container, width: number, height: number): Texture;
}

export function createRendererBaker(renderer: Renderer): TextureBaker {
  return {
    generateTexture(target, width, height) {
      const texture = renderer.generateTexture({
        target,
        frame: new Rectangle(0, 0, width, height),
        resolution: 1,
        antialias: false,
      });
      texture.source.scaleMode = 'nearest';
      return texture;
    },
  };
}

export class IconAtlas {
  private readonly cache = new Map<string, Texture>();
  private readonly palette: PixelSpritePalette;
  private readonly silhouette: PixelSpritePalette;
  private readonly unlitPylon: PixelSpritePalette;

  constructor(private readonly baker: TextureBaker | null, private readonly theme: MapTheme) {
    this.palette = spritePalette(theme);
    this.silhouette = silhouettePalette(shade(theme.palette.background, -0.2));
    this.unlitPylon = { ...this.palette, a: shade(this.palette.s, -0.35) };
  }

  public get canBake(): boolean {
    return this.baker !== null;
  }

  public location(type: LocationType, variant: 'lit' | 'silhouette' = 'lit'): Texture {
    const grid = LOCATION_ICONS[type];
    return this.bake(`loc:${type}:${variant}`, grid[0].length, grid.length, (g) =>
      drawPixelGrid(g, grid, variant === 'lit' ? this.palette : this.silhouette)
    );
  }

  public glyph(kind: GlyphKind, variant: number, ramp: Ramp): Texture {
    const variants = GLYPH_SPRITES[kind];
    const grid = variants[variant % variants.length];
    const accent = this.theme.palette.secondaryAccent ?? '#dc2626';
    return this.bake(`glyph:${kind}:${variant}:${ramp.join(',')}`, grid[0].length, grid.length, (g) =>
      drawPixelGrid(g, grid, rampPalette(ramp, accent))
    );
  }

  public landmark(kind: LandmarkGlyphKind): Texture {
    const grid = LANDMARK_SPRITES[kind];
    return this.bake(`landmark:${kind}`, grid[0].length, grid.length, (g) =>
      drawPixelGrid(g, grid, this.palette)
    );
  }

  public pylon(lit: boolean): Texture {
    return this.bake(`pylon:${lit}`, WAYPOINT_PYLON[0].length, WAYPOINT_PYLON.length, (g) =>
      drawPixelGrid(g, WAYPOINT_PYLON, lit ? this.palette : this.unlitPylon)
    );
  }

  /** White radial disc: solid core to 55% radius, 8 stepped bands to transparent. */
  public softDisc(): Texture {
    const r = SOFT_DISC_RADIUS;
    return this.bake('soft-disc', r * 2, r * 2, (g) => {
      const bands = 8;
      for (let i = 0; i < bands; i++) {
        const radius = r - (i * (r * 0.45)) / bands;
        g.circle(r, r, radius).fill({ color: '#ffffff', alpha: 1 / bands });
      }
      g.circle(r, r, r * 0.55).fill({ color: '#ffffff', alpha: 1 });
    });
  }

  public destroy(): void {
    for (const texture of this.cache.values()) texture.destroy(true);
    this.cache.clear();
  }

  private bake(key: string, width: number, height: number, draw: (g: Graphics) => void): Texture {
    const cached = this.cache.get(key);
    if (cached) return cached;
    if (!this.baker) return Texture.EMPTY;
    const g = new Graphics();
    draw(g);
    const texture = this.baker.generateTexture(g, width, height);
    g.destroy();
    this.cache.set(key, texture);
    return texture;
  }
}
```

- [ ] **Step 4: Create the layer context**

Create `src/engine/map/layers/layer-context.ts`:

```ts
import { MapTheme } from '../../../domain/map-themes';
import { TweenManager } from '../anim/tween';
import { IconAtlas } from '../scene/icon-atlas';

/** Shared dependencies handed to every renderer layer. */
export interface LayerContext {
  theme: MapTheme;
  atlas: IconAtlas;
  tweens: TweenManager;
  reducedMotion: boolean;
}
```

- [ ] **Step 5: Run tests, typecheck, commit**

Run: `npx vitest run tests/icon-atlas.test.ts && npx tsc --noEmit`
Expected: PASS (4 tests), clean typecheck.

```bash
git add src/engine/map/scene/icon-atlas.ts src/engine/map/layers/layer-context.ts tests/icon-atlas.test.ts
git commit -m "feat(map): add cached pixel texture atlas and shared layer context

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Terrain painter and static scene builder

**Files:**
- Create: `src/engine/map/scene/terrain-painter.ts`
- Create: `src/engine/map/scene/static-baker.ts`
- Test: `tests/static-scene.test.ts`

**Interfaces:**
- Consumes: geometry, prng, palette (Tasks 5, 7), `scatterGlyphs` (Task 6), `IconAtlas` (Task 11), `ProjectedWorldMapSnapshot`, `ProjectedPlane` (Task 2).
- Produces:
  - `ditherEdgePixels(ring: Vec2[], step?: number, depth?: number): Array<[number, number]>` — pure; 2-unit-snapped, de-duplicated pixel cells forming a checkerboard dither band just inside `ring`.
  - `paintBackdrop(g: Graphics, plane: Pick<ProjectedPlane, 'width' | 'height' | 'backdrop'>, theme: MapTheme, seed: number): void`
  - `paintTerrain(g: Graphics, terrain: TerrainLayer, theme: MapTheme): void`
  - `GLYPH_SCALE = 2`
  - `buildStaticScene(input: { snapshot: ProjectedWorldMapSnapshot; theme: MapTheme; atlas: IconAtlas }): Container` — children in order: backdrop `Graphics` (label `backdrop`), terrain `Graphics` (label `terrain`), glyph `Container` (label `glyphs`). Glyphs covered by a later terrain polygon are skipped. Only terrain (never chapter-gated) is baked — no locations, regions or landmark glyphs.

- [ ] **Step 1: Write the failing test**

Create `tests/static-scene.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { buildStaticScene, GLYPH_SCALE } from '../src/engine/map/scene/static-baker';
import { ditherEdgePixels } from '../src/engine/map/scene/terrain-painter';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';
import { Vec2 } from '../src/engine/map/scene/geometry';

const def: WorldMapDefinition = {
  id: 'bake-map',
  universeId: 'coiling-dragon',
  coordinateSystem: 'world',
  width: 800,
  height: 600,
  terrain: [
    { id: 'range', type: 'mountain', name: 'Range', polygon: [[40, 40], [760, 40], [760, 560], [40, 560]], elevation: 2, edgeStyle: 'cliff' },
    { id: 'meadow', type: 'plains', name: 'Meadow', polygon: [[400, 40], [760, 40], [760, 560], [400, 560]], edgeStyle: 'coast' },
  ],
  regions: [],
  locations: [],
  routes: [],
  territories: [],
  events: [],
  characterPaths: [],
};

describe('ditherEdgePixels', () => {
  const ring: Vec2[] = [[0, 0], [100, 0], [100, 100], [0, 100]];

  it('returns unique, 2-unit snapped cells inside the ring', () => {
    const cells = ditherEdgePixels(ring);
    expect(cells.length).toBeGreaterThan(20);
    const keys = new Set(cells.map(([x, y]) => `${x},${y}`));
    expect(keys.size).toBe(cells.length);
    for (const [x, y] of cells) {
      expect(x % 2).toBe(0);
      expect(y % 2).toBe(0);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
    }
  });

  it('is deterministic', () => {
    expect(ditherEdgePixels(ring)).toEqual(ditherEdgePixels(ring));
  });
});

describe('buildStaticScene', () => {
  const theme = getMapTheme('coiling-dragon');
  const snapshot = projectTemporalMap(def, 1);

  it('builds backdrop, terrain and glyph layers', () => {
    const scene = buildStaticScene({ snapshot, theme, atlas: new IconAtlas(null, theme) });
    expect(scene.children.map((c) => c.label)).toEqual(['backdrop', 'terrain', 'glyphs']);
    const glyphs = scene.children[2] as Container;
    expect(glyphs.children.length).toBeGreaterThan(10);
  });

  it('is deterministic across builds', () => {
    const a = buildStaticScene({ snapshot, theme, atlas: new IconAtlas(null, theme) });
    const b = buildStaticScene({ snapshot, theme, atlas: new IconAtlas(null, theme) });
    const pos = (s: Container) => (s.children[2] as Container).children.map((c) => `${c.x},${c.y}`);
    expect(pos(a)).toEqual(pos(b));
  });

  it('skips glyphs hidden under later terrain polygons', () => {
    const scene = buildStaticScene({ snapshot, theme, atlas: new IconAtlas(null, theme) });
    const glyphs = (scene.children[2] as Container).children;
    // The meadow (drawn after the range) covers x >= 400, so no mountain peak may sit there
    const peaksOnRight = glyphs.filter((g) => g.label.startsWith('peak') && g.x > 401);
    expect(peaksOnRight).toEqual([]);
    expect(glyphs.some((g) => g.label.startsWith('peak'))).toBe(true);
    expect(glyphs.some((g) => g.label.startsWith('tuft'))).toBe(true);
    for (const g of glyphs) {
      expect(Math.abs(g.scale.x)).toBe(GLYPH_SCALE);
      expect(g.scale.y).toBe(GLYPH_SCALE);
    }
  });
});
```

The baker sets each glyph sprite's `label` to `` `${glyph.kind}:${glyph.variant}` ``.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/static-scene.test.ts`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Implement the terrain painter**

Create `src/engine/map/scene/terrain-painter.ts`:

```ts
/**
 * Pixel-gothic terrain painting: backdrops, biome fills with dithered
 * elevation bands, and coast/cliff/soft edge treatments.
 */

import { Graphics } from 'pixi.js';
import { MapTheme } from '../../../domain/map-themes';
import { TerrainLayer } from '../../../domain/map-types';
import { ProjectedPlane } from '../../../projections/temporal-map';
import { flattenPoly, polygonCentroid, scalePolygon, Vec2 } from './geometry';
import { backdropColor, biomeRamp, mix, shade } from './pixel-palette';
import { mulberry32 } from './prng';

const PIXEL = 2;

/** Checkerboard dither cells just inside a ring (pure, deterministic). */
export function ditherEdgePixels(ring: Vec2[], step = PIXEL, depth = 3): Array<[number, number]> {
  const c = polygonCentroid(ring);
  const seen = new Set<string>();
  const cells: Array<[number, number]> = [];
  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[(i + 1) % ring.length];
    const len = Math.hypot(bx - ax, by - ay);
    const samples = Math.max(1, Math.floor(len / step));
    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      const toC = Math.hypot(c.x - x, c.y - y) || 1;
      const nx = (c.x - x) / toC;
      const ny = (c.y - y) / toC;
      for (let k = 0; k < depth; k++) {
        const px = Math.floor((x + nx * k * step) / PIXEL) * PIXEL;
        const py = Math.floor((y + ny * k * step) / PIXEL) * PIXEL;
        const checker = ((px / PIXEL + py / PIXEL) & 1) === 0;
        const sparse = ((px / PIXEL) & 1) === 0 && ((py / PIXEL) & 1) === 0;
        if (k === 0 ? !checker : !sparse) continue;
        const key = `${px},${py}`;
        if (seen.has(key)) continue;
        seen.add(key);
        cells.push([px, py]);
      }
    }
  }
  return cells;
}

export function paintBackdrop(
  g: Graphics,
  plane: Pick<ProjectedPlane, 'width' | 'height' | 'backdrop'>,
  theme: MapTheme,
  seed: number
): void {
  const { width, height } = plane;
  const base = backdropColor(theme, plane.backdrop);
  g.rect(0, 0, width, height).fill(base);

  // Pixel speckle texture
  const rng = mulberry32(seed);
  const light = shade(base, 0.08);
  const dark = shade(base, -0.25);
  const specks = Math.floor((width * height) / 900);
  const lightCells: Array<[number, number]> = [];
  const darkCells: Array<[number, number]> = [];
  for (let i = 0; i < specks; i++) {
    const x = Math.floor((rng() * width) / PIXEL) * PIXEL;
    const y = Math.floor((rng() * height) / PIXEL) * PIXEL;
    (rng() < 0.5 ? lightCells : darkCells).push([x, y]);
  }
  // One fill() per color batches thousands of speck rects
  for (const [x, y] of lightCells) g.rect(x, y, PIXEL, PIXEL);
  g.fill(light);
  for (const [x, y] of darkCells) g.rect(x, y, PIXEL, PIXEL);
  g.fill(dark);

  // In-world iron frame
  g.rect(0, 0, width, height).stroke({ color: shade(theme.palette.background, -0.6), width: 6 });
  g.rect(3, 3, width - 6, height - 6).stroke({ color: theme.palette.primaryAccent, width: 1, alpha: 0.5 });
}

export function paintTerrain(g: Graphics, terrain: TerrainLayer, theme: MapTheme): void {
  const poly = terrain.polygon as Vec2[];
  if (!poly || poly.length < 3) return;
  const ramp = biomeRamp(theme, terrain.type, terrain.colorOverride);
  const flat = flattenPoly(poly);
  const edge = terrain.edgeStyle ?? 'soft';

  if (edge === 'cliff') {
    const shadow = poly.map(([x, y]) => [x + 3, y + 4] as Vec2);
    g.poly(flattenPoly(shadow)).fill({ color: shade(ramp[0], -0.4), alpha: 0.9 });
  }
  if (edge === 'coast') {
    g.poly(flattenPoly(scalePolygon(poly, 1.02))).fill({ color: shade(ramp[3], 0.1), alpha: 0.18 });
  }

  g.poly(flat).fill(ramp[1]);

  const steps = Math.max(0, Math.min(3, Math.round(terrain.elevation ?? 1)));
  let previousTone = ramp[1];
  for (let i = 1; i <= steps; i++) {
    const inner = scalePolygon(poly, 1 - 0.16 * i);
    const tone = mix(ramp[1], ramp[2], i / steps);
    g.poly(flattenPoly(inner)).fill(tone);
    const cells = ditherEdgePixels(inner);
    if (cells.length > 0) {
      for (const [x, y] of cells) g.rect(x, y, PIXEL, PIXEL);
      g.fill(previousTone);
    }
    previousTone = tone;
  }

  if (edge === 'coast') {
    g.poly(flat).stroke({ color: ramp[0], width: 3 });
    g.poly(flattenPoly(scalePolygon(poly, 0.992))).stroke({ color: ramp[3], width: 1, alpha: 0.45 });
  } else if (edge === 'cliff') {
    g.poly(flat).stroke({ color: shade(ramp[0], -0.3), width: 3 });
    g.poly(flattenPoly(scalePolygon(poly, 0.99))).stroke({ color: ramp[2], width: 1, alpha: 0.5 });
  } else {
    g.poly(flat).stroke({ color: ramp[0], width: 1, alpha: 0.55 });
  }
}
```

- [ ] **Step 4: Implement the static scene builder**

Create `src/engine/map/scene/static-baker.ts`:

```ts
/**
 * Builds the never-chapter-gated static scene for one plane:
 * backdrop + terrain + deterministic glyph scatter. The facade bakes this
 * into one nearest-scaled texture per (map, plane, theme).
 */

import { Container, Graphics, Sprite } from 'pixi.js';
import { MapTheme } from '../../../domain/map-themes';
import { ProjectedPlane, ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { pointInPolygon, Vec2 } from './geometry';
import { scatterGlyphs } from './glyph-scatter';
import { IconAtlas } from './icon-atlas';
import { biomeRamp } from './pixel-palette';
import { hashString } from './prng';
import { paintBackdrop, paintTerrain } from './terrain-painter';

export const GLYPH_SCALE = 2;

export interface StaticSceneInput {
  snapshot: ProjectedWorldMapSnapshot;
  theme: MapTheme;
  atlas: IconAtlas;
}

export function buildStaticScene({ snapshot, theme, atlas }: StaticSceneInput): Container {
  const root = new Container();
  root.label = 'static-scene';

  const plane: Pick<ProjectedPlane, 'width' | 'height' | 'backdrop'> =
    snapshot.planes.find((p) => p.id === snapshot.planeId) ?? {
      width: snapshot.width,
      height: snapshot.height,
      backdrop: 'void',
    };

  const backdrop = new Graphics();
  backdrop.label = 'backdrop';
  paintBackdrop(backdrop, plane, theme, hashString(`${snapshot.mapId}:${snapshot.planeId}:backdrop`));
  root.addChild(backdrop);

  const land = new Graphics();
  land.label = 'terrain';
  for (const terrain of snapshot.terrain) paintTerrain(land, terrain, theme);
  root.addChild(land);

  const glyphs = new Container();
  glyphs.label = 'glyphs';
  snapshot.terrain.forEach((terrain, index) => {
    const ramp = biomeRamp(theme, terrain.type, terrain.colorOverride);
    const above = snapshot.terrain.slice(index + 1);
    const scattered = scatterGlyphs({
      polygon: terrain.polygon as Vec2[],
      terrainType: terrain.type,
      seed: hashString(`${snapshot.mapId}:${terrain.id}`),
    });
    for (const glyph of scattered) {
      if (above.some((other) => pointInPolygon(glyph.x, glyph.y, other.polygon as Vec2[]))) continue;
      const sprite = new Sprite(atlas.glyph(glyph.kind, glyph.variant, ramp));
      sprite.label = `${glyph.kind}:${glyph.variant}`;
      sprite.anchor.set(0.5, 1);
      sprite.position.set(glyph.x, glyph.y);
      // Integer scale keeps 1 texel per grid cell in the 0.5-resolution bake;
      // the scatter's scale jitter becomes a pixel-safe horizontal mirror instead
      sprite.scale.set(glyph.scale >= 1 ? GLYPH_SCALE : -GLYPH_SCALE, GLYPH_SCALE);
      glyphs.addChild(sprite);
    }
  });
  root.addChild(glyphs);

  return root;
}
```

- [ ] **Step 5: Run tests, typecheck, commit**

Run: `npx vitest run tests/static-scene.test.ts && npx tsc --noEmit`
Expected: PASS (5 tests), clean typecheck.

```bash
git add src/engine/map/scene/terrain-painter.ts src/engine/map/scene/static-baker.ts tests/static-scene.test.ts
git commit -m "feat(map): paint pixel-gothic terrain and build per-plane static scene

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Regions layer and markers layer

**Files:**
- Create: `src/engine/map/layers/regions-layer.ts`
- Create: `src/engine/map/layers/markers-layer.ts`
- Test: `tests/markers-layer.test.ts`

**Interfaces:**
- Consumes: `LayerContext` (Task 11), `EVENT_FLAG_OFFSET` (Task 10), `DANGER_COLORS`, `shade` (Task 7), `isDiscoveredStatus` (Task 4), `ProjectedWorldMapSnapshot`, `FogStatus`, `MapMode`.
- Produces:
  - `class RegionsLayer { constructor(container: Container, ctx: LayerContext); sync(snapshot: ProjectedWorldMapSnapshot): void; setHovered(id: string | null): void; readonly regionCount: number; destroy(): void }`
  - `ICON_SCALE = 2`, `CRITICAL_ICON_SCALE = 3`, `LANDMARK_SCALE = 3` (integers: 1 grid cell = whole world units, so nearest filtering stays crisp); hover adds exactly +1 to the scale. KNOWN markers never show a waypoint pylon.
  - `interface MarkerView { root: Container; glow: Sprite; icon: Sprite; clearing: Graphics; ring: Graphics; halo: Graphics; pylon: Sprite | null; status: FogStatus; critical: boolean; baseScale: number; hover: number; phase: number }`
  - `class MarkersLayer { constructor(container: Container, ctx: LayerContext); readonly markers: Map<string, MarkerView>; readonly landmarks: Map<string, Sprite>; readonly eventFlags: Map<string, Graphics>; sync(snapshot: ProjectedWorldMapSnapshot, animate: boolean): void; setHovered(id: string | null): void; readonly hoveredId: string | null; setZoom(zoom: number): void; setMode(mode: MapMode): void; update(dtMs: number): void; destroy(): void }`

- [ ] **Step 1: Write the failing test**

Create `tests/markers-layer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { MarkersLayer, ICON_SCALE, CRITICAL_ICON_SCALE } from '../src/engine/map/layers/markers-layer';
import { RegionsLayer } from '../src/engine/map/layers/regions-layer';
import { LayerContext } from '../src/engine/map/layers/layer-context';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap, FogStatus } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

const def: WorldMapDefinition = {
  id: 'markers', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
  terrain: [],
  regions: [{ id: 'reg', name: 'Region', geometry: { type: 'Polygon', coordinates: [[[0, 0], [500, 0], [500, 500]]] } }],
  locations: [
    { id: 'home', name: 'Home', x: 100, y: 100, type: 'village', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1, waypoint: true, dangerLevel: 'Safe' },
    { id: 'rumor', name: 'Rumored Keep', x: 300, y: 300, type: 'castle', importance: 'major', firstAppearanceChapter: 50, revealedAtChapter: 10, waypoint: true },
    { id: 'later', name: 'Later', x: 600, y: 600, type: 'dungeon', importance: 'minor', firstAppearanceChapter: 80, revealedAtChapter: 80, dangerLevel: 'EX' },
  ],
  routes: [],
  territories: [{ factionId: 'f', name: 'F', boundary: [[0, 0], [100, 0], [100, 100]], controlPeriods: [{ fromChapter: 1, toChapter: null, influencePct: 50 }] }],
  events: [{ id: 'ev', name: 'Fight', chapter: 5, locationId: 'home', eventType: 'battle', importance: 'major' }],
  characterPaths: [{ characterId: 'hero', characterName: 'Hero', waypoints: [{ chapter: 1, locationId: 'home', x: 100, y: 100 }] }],
  landmarkGlyphs: [{ id: 'volcano', glyph: 'volcano', x: 800, y: 200, revealedAtChapter: 40 }],
};

function ctx(reducedMotion = false): LayerContext {
  const theme = getMapTheme('reverend-insanity');
  return { theme, atlas: new IconAtlas(null, theme), tweens: new TweenManager(), reducedMotion };
}

describe('MarkersLayer', () => {
  it('creates markers only for visible locations and marks KNOWN ones', () => {
    const layer = new MarkersLayer(new Container(), ctx());
    layer.sync(projectTemporalMap(def, 20), false);
    expect([...layer.markers.keys()].sort()).toEqual(['home', 'rumor']);
    expect(layer.markers.get('rumor')!.status).toBe(FogStatus.KNOWN);
    expect(layer.markers.get('home')!.pylon).not.toBeNull();
    expect(layer.markers.get('home')!.pylon!.visible).toBe(true);
    // KNOWN waypoint: pylon hidden so fast-travel status does not leak
    expect(layer.markers.get('rumor')!.pylon!.visible).toBe(false);
    expect(layer.markers.get('home')!.baseScale).toBe(CRITICAL_ICON_SCALE);
    expect(layer.markers.get('rumor')!.baseScale).toBe(ICON_SCALE);
  });

  it('adds and removes markers, landmarks and event flags across chapters', () => {
    const layer = new MarkersLayer(new Container(), ctx());
    layer.sync(projectTemporalMap(def, 90), false);
    expect(layer.markers.size).toBe(3);
    expect([...layer.landmarks.keys()]).toEqual(['volcano']);
    expect([...layer.eventFlags.keys()]).toEqual(['ev']);
    layer.sync(projectTemporalMap(def, 2), true);
    expect([...layer.markers.keys()]).toEqual(['home']);
    expect(layer.landmarks.size).toBe(0);
    expect(layer.eventFlags.size).toBe(0);
  });

  it('fades new markers in when animating', () => {
    const c = ctx();
    const layer = new MarkersLayer(new Container(), c);
    layer.sync(projectTemporalMap(def, 20), false);
    layer.sync(projectTemporalMap(def, 90), true);
    const later = layer.markers.get('later')!;
    expect(later.root.alpha).toBe(0);
    c.tweens.tick(400);
    expect(later.root.alpha).toBe(1);
  });

  it('scales the hovered marker up and back down', () => {
    const c = ctx();
    const layer = new MarkersLayer(new Container(), c);
    layer.sync(projectTemporalMap(def, 20), false);
    layer.setHovered('home');
    expect(layer.hoveredId).toBe('home');
    c.tweens.tick(200);
    const home = layer.markers.get('home')!;
    expect(home.icon.scale.x).toBe(CRITICAL_ICON_SCALE + 1);
    expect(home.glow.alpha).toBeGreaterThan(0.5);
    layer.setHovered(null);
    c.tweens.tick(200);
    expect(home.icon.scale.x).toBe(CRITICAL_ICON_SCALE);
  });

  it('hides danger rings when zoomed out', () => {
    const layer = new MarkersLayer(new Container(), ctx());
    layer.sync(projectTemporalMap(def, 90), false);
    layer.setZoom(0.6);
    expect(layer.markers.get('later')!.ring.visible).toBe(false);
    layer.setZoom(1.2);
    expect(layer.markers.get('later')!.ring.visible).toBe(true);
  });

  it('does not bob critical markers under reduced motion', () => {
    const layer = new MarkersLayer(new Container(), ctx(true));
    layer.sync(projectTemporalMap(def, 20), false);
    const y0 = layer.markers.get('home')!.icon.y;
    layer.update(600);
    expect(layer.markers.get('home')!.icon.y).toBe(y0);
  });

  it('forgets the hovered id when that marker is removed', () => {
    const layer = new MarkersLayer(new Container(), ctx());
    layer.sync(projectTemporalMap(def, 90), false);
    layer.setHovered('later');
    layer.sync(projectTemporalMap(def, 20), true);
    expect(layer.hoveredId).toBeNull();
  });
});

describe('RegionsLayer', () => {
  it('draws regions and territories and tracks hover', () => {
    const container = new Container();
    const layer = new RegionsLayer(container, ctx());
    layer.sync(projectTemporalMap(def, 20));
    expect(layer.regionCount).toBe(1);
    expect(container.children.length).toBeGreaterThan(0);
    layer.setHovered('reg');
    layer.setHovered(null);
    layer.destroy();
    expect(container.children.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/markers-layer.test.ts`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Implement the regions layer**

Create `src/engine/map/layers/regions-layer.ts`:

```ts
/**
 * Region borders (hover-highlighted) and faction territory tints.
 */

import { Container, Graphics } from 'pixi.js';
import { MapRegion } from '../../../domain/map-types';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { LayerContext } from './layer-context';

export class RegionsLayer {
  private readonly territories = new Graphics();
  private readonly regions = new Map<string, { region: MapRegion; g: Graphics }>();
  private hoveredId: string | null = null;

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    this.container.addChild(this.territories);
  }

  public get regionCount(): number {
    return this.regions.size;
  }

  public sync(snapshot: ProjectedWorldMapSnapshot): void {
    const keep = new Set(snapshot.regions.map((r) => r.id));
    for (const [id, entry] of this.regions) {
      if (!keep.has(id)) {
        entry.g.destroy();
        this.regions.delete(id);
      }
    }
    for (const region of snapshot.regions) {
      let entry = this.regions.get(region.id);
      if (!entry) {
        entry = { region, g: new Graphics() };
        this.regions.set(region.id, entry);
        this.container.addChild(entry.g);
      }
      entry.region = region;
      this.drawRegion(entry.g, region, region.id === this.hoveredId);
    }
    if (this.hoveredId && !keep.has(this.hoveredId)) this.hoveredId = null;

    const t = this.territories;
    t.clear();
    const color = this.ctx.theme.palette.secondaryAccent ?? this.ctx.theme.palette.primaryAccent;
    for (const territory of snapshot.territories) {
      if (!territory.boundary || territory.boundary.length < 3) continue;
      const flat = territory.boundary.flat();
      const alpha = (territory.currentInfluencePct / 100) * (this.ctx.theme.palette.territoryAlpha ?? 0.22);
      t.poly(flat).fill({ color, alpha });
      t.poly(flat).stroke({ color, width: 1, alpha: Math.min(1, alpha * 2.5) });
    }
  }

  public setHovered(id: string | null): void {
    if (id === this.hoveredId) return;
    const previous = this.hoveredId;
    this.hoveredId = id;
    for (const target of [previous, id]) {
      if (!target) continue;
      const entry = this.regions.get(target);
      if (entry) this.drawRegion(entry.g, entry.region, target === id);
    }
  }

  public destroy(): void {
    for (const entry of this.regions.values()) entry.g.destroy();
    this.regions.clear();
    this.territories.destroy();
    this.container.removeChildren();
  }

  private drawRegion(g: Graphics, region: MapRegion, hovered: boolean): void {
    g.clear();
    const accent = this.ctx.theme.palette.primaryAccent;
    const polygons =
      region.geometry.type === 'Polygon'
        ? [region.geometry.coordinates as number[][][]]
        : (region.geometry.coordinates as number[][][][]);
    for (const polygon of polygons) {
      for (const ring of polygon) {
        const flat = ring.flat();
        if (flat.length < 6) continue;
        g.poly(flat).fill({ color: accent, alpha: hovered ? 0.1 : 0.025 });
        g.poly(flat).stroke({ color: accent, width: hovered ? 2.5 : 1.5, alpha: hovered ? 0.9 : 0.35 });
      }
    }
  }
}
```

- [ ] **Step 4: Implement the markers layer**

Create `src/engine/map/layers/markers-layer.ts`:

```ts
/**
 * Retained, id-keyed location markers, landmark glyphs and event flags.
 * Diff-friendly: sync() adds/updates/removes only what changed.
 */

import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { MapMode } from '../../../domain/map-types';
import { isDiscoveredStatus } from '../../../projections/map-snapshot-diff';
import {
  FogStatus,
  ProjectedLocation,
  ProjectedWorldMapSnapshot,
} from '../../../projections/temporal-map';
import { EVENT_FLAG_OFFSET } from '../input/picking';
import { DANGER_COLORS, shade } from '../scene/pixel-palette';
import { LayerContext } from './layer-context';

export const ICON_SCALE = 2;
export const CRITICAL_ICON_SCALE = 3;
export const LANDMARK_SCALE = 3;

export interface MarkerView {
  root: Container;
  glow: Sprite;
  icon: Sprite;
  clearing: Graphics;
  ring: Graphics;
  halo: Graphics;
  pylon: Sprite | null;
  status: FogStatus;
  critical: boolean;
  baseScale: number;
  hover: number;
  phase: number;
}

const ICON_Y = 2;

export class MarkersLayer {
  public readonly markers = new Map<string, MarkerView>();
  public readonly landmarks = new Map<string, Sprite>();
  public readonly eventFlags = new Map<string, Graphics>();

  private readonly landmarkLayer = new Container();
  private readonly markerLayer = new Container();
  private readonly flagLayer = new Container();
  private hovered: string | null = null;
  private zoom = 1;
  private time = 0;
  private flagScale = 1;

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    this.landmarkLayer.sortableChildren = true;
    this.markerLayer.sortableChildren = true;
    this.container.addChild(this.landmarkLayer, this.markerLayer, this.flagLayer);
  }

  public get hoveredId(): string | null {
    return this.hovered;
  }

  public sync(snapshot: ProjectedWorldMapSnapshot, animate: boolean): void {
    const fade = animate && !this.ctx.reducedMotion;
    const visible = snapshot.locations.filter((l) => l.fogStatus !== FogStatus.UNKNOWN);
    const keep = new Set(visible.map((l) => l.id));

    for (const [id, view] of this.markers) {
      if (keep.has(id)) continue;
      this.ctx.tweens.cancel(`marker:${id}:alpha`);
      this.ctx.tweens.cancel(`marker:${id}:hover`);
      view.root.destroy({ children: true });
      this.markers.delete(id);
      if (this.hovered === id) this.hovered = null;
    }

    for (const loc of visible) {
      let view = this.markers.get(loc.id);
      if (!view) {
        view = this.createMarker(loc);
        this.markers.set(loc.id, view);
        this.markerLayer.addChild(view.root);
        if (fade) {
          const target = view;
          target.root.alpha = 0;
          this.ctx.tweens.to(`marker:${loc.id}:alpha`, {
            from: 0,
            to: 1,
            durationMs: 350,
            onUpdate: (v) => {
              target.root.alpha = v;
            },
          });
        }
      }
      this.updateMarker(view, loc);
    }

    this.syncLandmarks(snapshot, fade);
    this.syncEventFlags(snapshot);
  }

  public setHovered(id: string | null): void {
    if (id === this.hovered) return;
    const previous = this.hovered;
    this.hovered = id && this.markers.has(id) ? id : null;
    if (previous) this.animateHover(previous, false);
    if (this.hovered) this.animateHover(this.hovered, true);
  }

  public setZoom(zoom: number): void {
    this.zoom = zoom;
    for (const view of this.markers.values()) view.ring.visible = zoom >= 1;
  }

  public setMode(mode: MapMode): void {
    this.flagScale = mode === 'lore' ? 1.5 : 1;
    for (const flag of this.eventFlags.values()) flag.scale.set(this.flagScale);
  }

  public update(dtMs: number): void {
    if (this.ctx.reducedMotion) return;
    this.time += dtMs;
    for (const view of this.markers.values()) {
      if (view.critical) {
        const bob = Math.round(Math.sin((this.time / 2400 + view.phase) * Math.PI * 2));
        view.icon.y = ICON_Y - bob;
        view.glow.y = view.icon.y;
      }
      if (view.halo.visible) {
        const p = (this.time / 1400 + view.phase) % 1;
        view.halo.scale.set(0.8 + 0.5 * p);
        view.halo.alpha = 1 - p;
      }
    }
  }

  public destroy(): void {
    this.markers.clear();
    this.landmarks.clear();
    this.eventFlags.clear();
    this.container.removeChildren();
    this.landmarkLayer.destroy({ children: true });
    this.markerLayer.destroy({ children: true });
    this.flagLayer.destroy({ children: true });
  }

  private createMarker(loc: ProjectedLocation): MarkerView {
    const theme = this.ctx.theme;
    const root = new Container();
    root.position.set(loc.x, loc.y);
    root.zIndex = loc.y;

    const clearing = new Graphics()
      .ellipse(0, 1, 13, 5)
      .fill({ color: shade(theme.palette.background, -0.3), alpha: 0.75 });
    const ring = new Graphics();
    const halo = new Graphics().circle(0, -10, 16).stroke({ color: theme.palette.primaryAccent, width: 2 });
    halo.visible = false;

    const glow = new Sprite(Texture.EMPTY);
    glow.anchor.set(0.5, 1);
    glow.position.set(0, ICON_Y);
    glow.blendMode = 'add';
    glow.tint = theme.palette.primaryAccent;
    glow.alpha = 0;

    const icon = new Sprite(Texture.EMPTY);
    icon.anchor.set(0.5, 1);
    icon.position.set(0, ICON_Y);

    let pylon: Sprite | null = null;
    if (loc.waypoint) {
      pylon = new Sprite(Texture.EMPTY);
      pylon.anchor.set(0.5, 1);
      pylon.position.set(15, ICON_Y);
      pylon.scale.set(1.5);
    }

    root.addChild(clearing, ring, halo, glow, icon);
    if (pylon) root.addChild(pylon);

    const critical = loc.importance === 'critical';
    return {
      root,
      glow,
      icon,
      clearing,
      ring,
      halo,
      pylon,
      status: loc.fogStatus,
      critical,
      baseScale: critical ? CRITICAL_ICON_SCALE : ICON_SCALE,
      hover: 0,
      phase: ((loc.x * 13 + loc.y * 7) % 1000) / 1000,
    };
  }

  private updateMarker(view: MarkerView, loc: ProjectedLocation): void {
    const known = loc.fogStatus === FogStatus.KNOWN;
    const texture = this.ctx.atlas.location(loc.type, known ? 'silhouette' : 'lit');
    view.icon.texture = texture;
    view.glow.texture = texture;
    view.status = loc.fogStatus;
    view.icon.alpha = known ? 0.7 : 1;
    view.halo.visible = loc.fogStatus === FogStatus.CURRENT || Boolean(loc.isCurrentPosition);
    view.root.position.set(loc.x, loc.y);
    view.root.zIndex = loc.y;

    view.ring.clear();
    if (loc.dangerLevel && !known) {
      view.ring.ellipse(0, 1, 15, 6).stroke({ color: DANGER_COLORS[loc.dangerLevel], width: 1.5, alpha: 0.9 });
    }
    view.ring.visible = this.zoom >= 1;

    if (view.pylon) {
      // A pylon on an undiscovered (KNOWN) place would leak that it is a fast-travel point
      view.pylon.visible = !known;
      view.pylon.texture = this.ctx.atlas.pylon(isDiscoveredStatus(loc.fogStatus));
    }
    this.applyHover(view);
  }

  private animateHover(id: string, on: boolean): void {
    const view = this.markers.get(id);
    if (!view) return;
    this.ctx.tweens.to(`marker:${id}:hover`, {
      from: view.hover,
      to: on ? 1 : 0,
      durationMs: this.ctx.reducedMotion ? 0 : 120,
      onUpdate: (v) => {
        view.hover = v;
        this.applyHover(view);
      },
    });
  }

  private applyHover(view: MarkerView): void {
    // Integer scale at rest and at full hover (base -> base + 1)
    const scale = view.hover >= 1 ? view.baseScale + 1 : view.baseScale + view.hover;
    view.icon.scale.set(scale);
    view.glow.scale.set(scale + 1);
    view.glow.alpha = 0.85 * view.hover;
  }

  private syncLandmarks(snapshot: ProjectedWorldMapSnapshot, fade: boolean): void {
    const keep = new Set(snapshot.landmarkGlyphs.map((g) => g.id));
    for (const [id, sprite] of this.landmarks) {
      if (keep.has(id)) continue;
      this.ctx.tweens.cancel(`landmark:${id}:alpha`);
      sprite.destroy();
      this.landmarks.delete(id);
    }
    for (const glyph of snapshot.landmarkGlyphs) {
      if (this.landmarks.has(glyph.id)) continue;
      const sprite = new Sprite(this.ctx.atlas.landmark(glyph.glyph));
      sprite.anchor.set(0.5, 1);
      sprite.position.set(glyph.x, glyph.y);
      sprite.scale.set(Math.max(1, Math.round(LANDMARK_SCALE * (glyph.scale ?? 1))));
      sprite.zIndex = glyph.y;
      this.landmarks.set(glyph.id, sprite);
      this.landmarkLayer.addChild(sprite);
      if (fade) {
        sprite.alpha = 0;
        this.ctx.tweens.to(`landmark:${glyph.id}:alpha`, {
          from: 0,
          to: 1,
          durationMs: 600,
          onUpdate: (v) => {
            sprite.alpha = v;
          },
        });
      }
    }
  }

  private syncEventFlags(snapshot: ProjectedWorldMapSnapshot): void {
    const locations = new Map(snapshot.locations.map((l) => [l.id, l]));
    const wanted = snapshot.events.filter((ev) => {
      const loc = ev.locationId ? locations.get(ev.locationId) : undefined;
      return Boolean(loc && loc.fogStatus !== FogStatus.UNKNOWN);
    });
    const keep = new Set(wanted.map((ev) => ev.id));
    for (const [id, flag] of this.eventFlags) {
      if (keep.has(id)) continue;
      flag.destroy();
      this.eventFlags.delete(id);
    }
    const color = this.ctx.theme.palette.secondaryAccent ?? '#dc2626';
    for (const ev of wanted) {
      if (this.eventFlags.has(ev.id)) continue;
      const loc = locations.get(ev.locationId!)!;
      const flag = new Graphics();
      flag.rect(-3, -5, 1, 11).fill('#0b0b10');
      flag.rect(-2, -5, 6, 5).fill(color);
      flag.rect(-2, -5, 6, 5).stroke({ color: '#0b0b10', width: 1 });
      flag.position.set(loc.x + EVENT_FLAG_OFFSET.x, loc.y + EVENT_FLAG_OFFSET.y);
      flag.scale.set(this.flagScale);
      this.eventFlags.set(ev.id, flag);
      this.flagLayer.addChild(flag);
    }
  }
}
```

- [ ] **Step 5: Run tests, typecheck, commit**

Run: `npx vitest run tests/markers-layer.test.ts && npx tsc --noEmit`
Expected: PASS (8 tests), clean.

```bash
git add src/engine/map/layers/regions-layer.ts src/engine/map/layers/markers-layer.ts tests/markers-layer.test.ts
git commit -m "feat(map): add retained regions and pixel marker layers with hover glow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Animated routes layer

**Files:**
- Create: `src/engine/map/layers/routes-layer.ts`
- Test: `tests/routes-layer.test.ts`

**Interfaces:**
- Consumes: `LayerContext`, `dashSegments`, `shade`, `ProjectedWorldMapSnapshot`, `MapRoute`, `MapTheme`.
- Produces:
  - `ROUTE_STYLES: Record<MapRoute['routeType'], { dash: number; gap: number; width: number; speed: number; alpha: number }>` (speed in world units per ms)
  - `routeColor(route: MapRoute, theme: MapTheme): string`
  - `class RoutesLayer { constructor(container: Container, ctx: LayerContext); sync(snapshot: ProjectedWorldMapSnapshot): void; update(dtMs: number): void; readonly routeCount: number; readonly dashPhaseMs: number; destroy(): void }`

- [ ] **Step 1: Write the failing test**

Create `tests/routes-layer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { RoutesLayer, ROUTE_STYLES, routeColor } from '../src/engine/map/layers/routes-layer';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition, MapRoute } from '../src/domain/map-types';

const theme = getMapTheme('one-piece');
const ctx = (reducedMotion = false) => ({ theme, atlas: new IconAtlas(null, theme), tweens: new TweenManager(), reducedMotion });

const def: WorldMapDefinition = {
  id: 'routes', universeId: 'one-piece', coordinateSystem: 'world', width: 500, height: 500,
  terrain: [], regions: [], locations: [], territories: [], events: [], characterPaths: [],
  routes: [
    { id: 'road', name: 'Road', points: [[0, 0], [100, 0]], routeType: 'road', visibleFromChapter: 1 },
    { id: 'sea', name: 'Sea', points: [[0, 50], [100, 50]], routeType: 'sea', visibleFromChapter: 1 },
    { id: 'late', name: 'Late', points: [[0, 90], [100, 90]], routeType: 'flight', visibleFromChapter: 50 },
  ],
};

describe('RoutesLayer', () => {
  it('defines a style for every route type', () => {
    for (const type of ['road', 'sea', 'flight', 'portal', 'secret'] as MapRoute['routeType'][]) {
      expect(ROUTE_STYLES[type].dash).toBeGreaterThan(0);
    }
  });

  it('colors secret routes with the secondary accent', () => {
    const secret: MapRoute = { id: 's', name: 's', points: [[0, 0], [1, 1]], routeType: 'secret', visibleFromChapter: 1 };
    expect(routeColor(secret, theme)).toBe(theme.palette.secondaryAccent);
  });

  it('syncs visible routes', () => {
    const layer = new RoutesLayer(new Container(), ctx());
    layer.sync(projectTemporalMap(def, 10));
    expect(layer.routeCount).toBe(2);
    layer.sync(projectTemporalMap(def, 60));
    expect(layer.routeCount).toBe(3);
  });

  it('marches dashes over time unless motion is reduced', () => {
    const moving = new RoutesLayer(new Container(), ctx());
    moving.sync(projectTemporalMap(def, 10));
    moving.update(100);
    expect(moving.dashPhaseMs).toBe(100);

    const still = new RoutesLayer(new Container(), ctx(true));
    still.sync(projectTemporalMap(def, 10));
    still.update(100);
    expect(still.dashPhaseMs).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/routes-layer.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement**

Create `src/engine/map/layers/routes-layer.ts`:

```ts
/**
 * Animated pixel-dash travel routes (roads, sea lanes, flight/portal arcs,
 * secret paths).
 */

import { Container, Graphics } from 'pixi.js';
import { MapTheme } from '../../../domain/map-themes';
import { MapRoute } from '../../../domain/map-types';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { dashSegments, Pt } from '../scene/geometry';
import { shade } from '../scene/pixel-palette';
import { LayerContext } from './layer-context';

export const ROUTE_STYLES: Record<
  MapRoute['routeType'],
  { dash: number; gap: number; width: number; speed: number; alpha: number }
> = {
  road: { dash: 6, gap: 4, width: 2, speed: 0.012, alpha: 0.9 },
  sea: { dash: 2, gap: 6, width: 2, speed: 0.006, alpha: 0.7 },
  flight: { dash: 8, gap: 6, width: 2, speed: 0.02, alpha: 0.8 },
  portal: { dash: 8, gap: 6, width: 2, speed: 0.02, alpha: 0.8 },
  secret: { dash: 3, gap: 5, width: 1.5, speed: 0.008, alpha: 0.85 },
};

export function routeColor(route: MapRoute, theme: MapTheme): string {
  const base = theme.palette.routeColor ?? theme.palette.primaryAccent;
  if (route.routeType === 'secret') return theme.palette.secondaryAccent ?? base;
  if (route.routeType === 'sea') return shade(base, 0.3);
  return base;
}

export class RoutesLayer {
  private readonly graphics = new Graphics();
  private routes: MapRoute[] = [];
  private phaseMs = 0;

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    this.container.addChild(this.graphics);
  }

  public get routeCount(): number {
    return this.routes.length;
  }

  public get dashPhaseMs(): number {
    return this.phaseMs;
  }

  public sync(snapshot: ProjectedWorldMapSnapshot): void {
    this.routes = snapshot.routes.filter((r) => r.points.length >= 2);
    this.redraw();
  }

  public update(dtMs: number): void {
    if (this.ctx.reducedMotion || this.routes.length === 0) return;
    this.phaseMs += dtMs;
    this.redraw();
  }

  public destroy(): void {
    this.routes = [];
    this.graphics.destroy();
    this.container.removeChildren();
  }

  private redraw(): void {
    const g = this.graphics;
    g.clear();
    for (const route of this.routes) {
      const style = ROUTE_STYLES[route.routeType];
      const points: Pt[] = route.points.map(([x, y]) => ({ x, y }));
      const color = routeColor(route, this.ctx.theme);

      // Soft dark underlay so dashes read on any biome
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
      g.stroke({ color: '#000000', width: style.width + 2, alpha: 0.3 });

      const shimmer =
        route.routeType === 'flight' || route.routeType === 'portal'
          ? 0.75 + 0.25 * Math.sin(this.phaseMs / 300)
          : 1;
      for (const [a, b] of dashSegments(points, style.dash, style.gap, this.phaseMs * style.speed)) {
        g.moveTo(Math.round(a.x), Math.round(a.y)).lineTo(Math.round(b.x), Math.round(b.y));
      }
      g.stroke({ color, width: style.width, alpha: style.alpha * shimmer, cap: 'butt' });
    }
  }
}
```

- [ ] **Step 4: Run tests, typecheck, commit**

Run: `npx vitest run tests/routes-layer.test.ts && npx tsc --noEmit`
Expected: PASS (4 tests), clean.

```bash
git add src/engine/map/layers/routes-layer.ts tests/routes-layer.test.ts
git commit -m "feat(map): add animated pixel-dash routes layer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Hero walker and hero layer

**Files:**
- Create: `src/engine/map/layers/hero-walker.ts`
- Create: `src/engine/map/layers/hero-layer.ts`
- Test: `tests/hero-layer.test.ts`

**Interfaces:**
- Consumes: `polylineLength`, `pointAlongPolyline`, `slicePolyline` (Task 5); `MapPoint`, `MapSnapshotDiff` (Task 4); `LayerContext`, `IconAtlas.softDisc()` (Task 11); `shade` (Task 7).
- Produces:
  - `heroTrailPoints(snapshot: ProjectedWorldMapSnapshot): MapPoint[]` — active character's waypoints on this plane.
  - `class HeroWalker { constructor(options?: { speed?: number; maxDurationMs?: number }); position: MapPoint | null; readonly isWalking: boolean; readonly traveledPath: MapPoint[]; teleport(point: MapPoint | null): void; walk(path: MapPoint[]): void; tick(dtMs: number): MapPoint | null }` — speed ≥ 220 world/s, total walk ≤ 1600 ms; `walk` starts from the current (possibly mid-walk) position and replaces `path[0]`; always ends exactly at `path[path.length - 1]`.
  - `HERO_JUMP_WAYPOINTS = 12` — longer hero paths fade/teleport instead of walking.
  - `class HeroLayer { constructor(container: Container, ctx: LayerContext); readonly walker: HeroWalker; readonly tokenVisible: boolean; readonly tokenPosition: MapPoint | null; setAvatar(url: string | undefined): Promise<void>; setMode(mode: MapMode): void; sync(snapshot: ProjectedWorldMapSnapshot, diff: MapSnapshotDiff): void; update(dtMs: number): void; destroy(): void }`

- [ ] **Step 1: Write the failing test**

Create `tests/hero-layer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { HeroWalker, heroTrailPoints, HERO_JUMP_WAYPOINTS } from '../src/engine/map/layers/hero-walker';
import { HeroLayer } from '../src/engine/map/layers/hero-layer';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { diffMapSnapshots } from '../src/projections/map-snapshot-diff';
import { WorldMapDefinition } from '../src/domain/map-types';

describe('HeroWalker', () => {
  it('walks at minimum speed and ends exactly at the target', () => {
    const w = new HeroWalker();
    w.teleport({ x: 0, y: 0 });
    w.walk([{ x: 0, y: 0 }, { x: 110, y: 0 }]);
    expect(w.isWalking).toBe(true);
    w.tick(250);
    expect(w.position!.x).toBeCloseTo(55);
    w.tick(1000);
    expect(w.position).toEqual({ x: 110, y: 0 });
    expect(w.isWalking).toBe(false);
  });

  it('caps long walks to the max duration', () => {
    const w = new HeroWalker();
    w.teleport({ x: 0, y: 0 });
    w.walk([{ x: 0, y: 0 }, { x: 5000, y: 0 }]);
    w.tick(1600);
    expect(w.position).toEqual({ x: 5000, y: 0 });
  });

  it('retargets from its current mid-walk position', () => {
    const w = new HeroWalker();
    w.teleport({ x: 0, y: 0 });
    w.walk([{ x: 0, y: 0 }, { x: 110, y: 0 }]);
    w.tick(250);
    w.walk([{ x: 110, y: 0 }, { x: 110, y: 100 }]);
    expect(w.isWalking).toBe(true);
    w.tick(2000);
    expect(w.position).toEqual({ x: 110, y: 100 });
  });

  it('teleports for single-point paths and reports the traveled prefix', () => {
    const w = new HeroWalker();
    w.walk([{ x: 5, y: 5 }]);
    expect(w.position).toEqual({ x: 5, y: 5 });
    expect(w.isWalking).toBe(false);
    w.walk([{ x: 5, y: 5 }, { x: 5, y: 105 }]);
    w.tick(250);
    const trail = w.traveledPath;
    expect(trail[0]).toEqual({ x: 5, y: 5 });
    expect(trail[trail.length - 1].y).toBeCloseTo(60);
  });
});

const def: WorldMapDefinition = {
  id: 'hero', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
  terrain: [], regions: [], routes: [], territories: [], events: [],
  locations: Array.from({ length: 16 }, (_, i) => ({
    id: `l${i}`, name: `L${i}`, x: 50 + i * 50, y: 100, type: 'village' as const, importance: 'minor' as const,
    firstAppearanceChapter: i * 10 + 1, revealedAtChapter: i * 10 + 1,
  })),
  characterPaths: [{
    characterId: 'hero', characterName: 'Hero',
    waypoints: Array.from({ length: 16 }, (_, i) => ({ chapter: i * 10 + 1, locationId: `l${i}`, x: 50 + i * 50, y: 100 })),
  }],
};

function layer(reducedMotion = false) {
  const theme = getMapTheme('reverend-insanity');
  return new HeroLayer(new Container(), { theme, atlas: new IconAtlas(null, theme), tweens: new TweenManager(), reducedMotion });
}

describe('HeroLayer', () => {
  it('extracts the trail points for the active character', () => {
    expect(heroTrailPoints(projectTemporalMap(def, 25))).toEqual([
      { x: 50, y: 100 }, { x: 100, y: 100 }, { x: 150, y: 100 },
    ]);
  });

  it('teleports on the first snapshot and walks on forward scrubs', () => {
    const hero = layer();
    const a = projectTemporalMap(def, 21);
    hero.sync(a, diffMapSnapshots(null, a));
    expect(hero.tokenVisible).toBe(true);
    expect(hero.walker.isWalking).toBe(false);
    expect(hero.walker.position).toEqual({ x: 150, y: 100 });

    const b = projectTemporalMap(def, 41);
    hero.sync(b, diffMapSnapshots(a, b));
    expect(hero.walker.isWalking).toBe(true);
    hero.update(2000);
    expect(hero.tokenPosition).toEqual({ x: 250, y: 100 });
  });

  it('teleports instead of walking for huge jumps', () => {
    const hero = layer();
    const a = projectTemporalMap(def, 1);
    hero.sync(a, diffMapSnapshots(null, a));
    const b = projectTemporalMap(def, 151);
    const diff = diffMapSnapshots(a, b);
    expect(diff.hero.path.length).toBeGreaterThan(HERO_JUMP_WAYPOINTS);
    hero.sync(b, diff);
    expect(hero.walker.isWalking).toBe(false);
    expect(hero.walker.position).toEqual({ x: 800, y: 100 });
  });

  it('teleports under reduced motion', () => {
    const hero = layer(true);
    const a = projectTemporalMap(def, 21);
    hero.sync(a, diffMapSnapshots(null, a));
    const b = projectTemporalMap(def, 41);
    hero.sync(b, diffMapSnapshots(a, b));
    expect(hero.walker.isWalking).toBe(false);
    expect(hero.walker.position).toEqual({ x: 250, y: 100 });
  });

  it('hides the token when the selected character has no path', () => {
    const hero = layer();
    const snap = projectTemporalMap(def, 50, { activeCharacterId: 'nobody' });
    hero.sync(snap, diffMapSnapshots(null, snap));
    expect(hero.tokenVisible).toBe(false);
    expect(hero.tokenPosition).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hero-layer.test.ts`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Implement the walker**

Create `src/engine/map/layers/hero-walker.ts`:

```ts
/**
 * Pure hero token walking math. Constant speed along a polyline, capped
 * duration, retargetable mid-walk. Never leaves the final target.
 */

import { MapPoint } from '../../../projections/map-snapshot-diff';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { pointAlongPolyline, polylineLength, slicePolyline } from '../scene/geometry';

export const HERO_JUMP_WAYPOINTS = 12;

export function heroTrailPoints(snapshot: ProjectedWorldMapSnapshot): MapPoint[] {
  const path = snapshot.characterPaths.find((p) => p.characterId === snapshot.activeCharacterId);
  return path ? path.waypoints.map((w) => ({ x: w.x, y: w.y })) : [];
}

export interface WalkerOptions {
  speed?: number;
  maxDurationMs?: number;
}

export class HeroWalker {
  public position: MapPoint | null = null;
  private path: MapPoint[] = [];
  private total = 0;
  private traveled = 0;
  private speed: number;

  constructor(private readonly options: WalkerOptions = {}) {
    this.speed = options.speed ?? 220;
  }

  public get isWalking(): boolean {
    return this.path.length > 1 && this.traveled < this.total;
  }

  public get traveledPath(): MapPoint[] {
    return this.isWalking ? slicePolyline(this.path, this.traveled) : [];
  }

  public teleport(point: MapPoint | null): void {
    this.position = point ? { x: point.x, y: point.y } : null;
    this.path = [];
    this.total = 0;
    this.traveled = 0;
  }

  public walk(path: MapPoint[]): void {
    if (path.length === 0) return;
    if (path.length === 1) {
      this.teleport(path[0]);
      return;
    }
    const start = this.position ?? path[0];
    const points = [{ x: start.x, y: start.y }, ...path.slice(1).map((p) => ({ x: p.x, y: p.y }))];
    const total = polylineLength(points);
    if (total === 0) {
      this.teleport(points[points.length - 1]);
      return;
    }
    this.path = points;
    this.total = total;
    this.traveled = 0;
    const maxSeconds = (this.options.maxDurationMs ?? 1600) / 1000;
    this.speed = Math.max(this.options.speed ?? 220, total / maxSeconds);
    this.position = { x: start.x, y: start.y };
  }

  public tick(dtMs: number): MapPoint | null {
    if (!this.isWalking) return this.position;
    this.traveled = Math.min(this.total, this.traveled + (this.speed * dtMs) / 1000);
    this.position = pointAlongPolyline(this.path, this.traveled);
    if (this.traveled >= this.total) {
      const end = this.path[this.path.length - 1];
      this.position = { x: end.x, y: end.y };
      this.path = [];
    }
    return this.position;
  }
}
```

- [ ] **Step 4: Implement the hero layer**

Create `src/engine/map/layers/hero-layer.ts`:

```ts
/**
 * Protagonist token: framed avatar with a flickering torch-light that walks
 * the journey path when the chapter changes, drawing a glowing trail.
 */

import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { MapMode } from '../../../domain/map-types';
import { MapPoint, MapSnapshotDiff } from '../../../projections/map-snapshot-diff';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { shade } from '../scene/pixel-palette';
import { HERO_JUMP_WAYPOINTS, HeroWalker, heroTrailPoints } from './hero-walker';
import { LayerContext } from './layer-context';

export class HeroLayer {
  public readonly walker = new HeroWalker();

  private readonly trail = new Graphics();
  private readonly token = new Container();
  private readonly frame = new Graphics();
  private readonly light: Sprite;
  private avatar: Sprite | null = null;
  private avatarMask: Graphics | null = null;
  private trailBase: MapPoint[] = [];
  private time = 0;
  private trailWidth = 3;

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    const { primaryAccent, secondaryAccent } = ctx.theme.palette;
    this.light = new Sprite(ctx.atlas.softDisc());
    this.light.anchor.set(0.5);
    this.light.blendMode = 'add';
    this.light.tint = '#ffb347';
    this.light.alpha = 0.35;
    this.light.scale.set(1.6);

    this.frame.circle(0, 0, 11).fill('#0b0b10').stroke({ color: primaryAccent, width: 2 });
    this.frame.circle(0, 0, 5).fill(secondaryAccent ?? primaryAccent);

    this.token.addChild(this.light, this.frame);
    this.token.visible = false;
    this.container.addChild(this.trail, this.token);
  }

  public get tokenVisible(): boolean {
    return this.token.visible;
  }

  public get tokenPosition(): MapPoint | null {
    return this.token.visible ? this.walker.position : null;
  }

  public async setAvatar(url: string | undefined): Promise<void> {
    if (!url || typeof window === 'undefined') return;
    try {
      const texture = await Assets.load<Texture>(url);
      texture.source.scaleMode = 'nearest';
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.width = 18;
      sprite.height = 18;
      const mask = new Graphics().circle(0, 0, 9).fill('#ffffff');
      sprite.mask = mask;
      this.avatar?.destroy();
      this.avatarMask?.destroy();
      this.token.addChild(mask, sprite);
      this.avatar = sprite;
      this.avatarMask = mask;
    } catch {
      // Keep the pixel core fallback when the avatar cannot load
    }
  }

  public setMode(mode: MapMode): void {
    this.trailWidth = mode === 'adventure' ? 4 : 3;
    this.redrawTrail();
  }

  public sync(snapshot: ProjectedWorldMapSnapshot, diff: MapSnapshotDiff): void {
    const all = heroTrailPoints(snapshot);
    const to = diff.hero.to;

    if (!to) {
      this.token.visible = false;
      this.walker.teleport(null);
      this.trailBase = all;
      this.redrawTrail();
      return;
    }

    this.token.visible = true;
    const jump = diff.hero.path.length > HERO_JUMP_WAYPOINTS;
    const instant =
      diff.hero.direction === 'none' || this.ctx.reducedMotion || jump || !this.walker.position;

    if (instant) {
      this.walker.teleport(to);
      this.trailBase = all;
      if (jump && !this.ctx.reducedMotion) {
        this.ctx.tweens.to('hero:alpha', {
          from: 0,
          to: 1,
          durationMs: 300,
          onUpdate: (v) => {
            this.token.alpha = v;
          },
        });
      } else {
        this.token.alpha = 1;
      }
    } else {
      const segment = diff.hero.path;
      this.trailBase =
        diff.hero.direction === 'forward'
          ? all.slice(0, Math.max(1, all.length - segment.length + 1))
          : all;
      this.walker.walk(segment);
    }
    this.placeToken();
    this.redrawTrail();
  }

  public update(dtMs: number): void {
    this.time += dtMs;
    const wasWalking = this.walker.isWalking;
    this.walker.tick(dtMs);
    this.placeToken();
    if (!this.ctx.reducedMotion) {
      this.light.alpha = 0.33 + 0.03 * Math.sin(this.time / 97) + 0.02 * Math.sin(this.time / 41);
    }
    if (wasWalking) this.redrawTrail();
  }

  public destroy(): void {
    this.ctx.tweens.cancel('hero:alpha');
    this.container.removeChildren();
    this.trail.destroy();
    this.token.destroy({ children: true });
    this.avatar = null;
    this.avatarMask = null;
  }

  private placeToken(): void {
    const p = this.walker.position;
    if (!p) return;
    const bob = this.ctx.reducedMotion ? 0 : Math.round(Math.sin(this.time / 300));
    this.token.position.set(Math.round(p.x), Math.round(p.y) - 14 - bob);
  }

  private redrawTrail(): void {
    const g = this.trail;
    g.clear();
    const points =
      this.walker.isWalking && this.walker.position
        ? [...this.trailBase, this.walker.position]
        : this.trailBase;
    if (points.length >= 2) {
      const secondary = this.ctx.theme.palette.secondaryAccent ?? this.ctx.theme.palette.primaryAccent;
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
      g.stroke({ color: shade(secondary, -0.6), width: this.trailWidth + 3, alpha: 0.55 });
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
      g.stroke({ color: secondary, width: this.trailWidth, alpha: 0.95 });
      for (const p of this.trailBase) g.circle(p.x, p.y, 2.5).fill(secondary);
    }
  }
}
```

Note: the token is lifted 14 units above the waypoint (`- 14`) so it stands on top of the location marker instead of covering it; `tokenPosition` reports the walker position (the map point), not the lifted sprite position.

- [ ] **Step 5: Run tests, typecheck, commit**

Run: `npx vitest run tests/hero-layer.test.ts && npx tsc --noEmit`
Expected: PASS (9 tests), clean. Check the jump test's arithmetic: at chapter 1 the path has 1 waypoint, at 151 it has 16, so `diff.hero.path` has 16 points (> 12) → teleport to `l15` at `(800, 100)`.

```bash
git add src/engine/map/layers/hero-walker.ts src/engine/map/layers/hero-layer.ts tests/hero-layer.test.ts
git commit -m "feat(map): add walking hero token with torch-light and journey trail

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Dithered fog of war (apertures, shader, layer)

**Files:**
- Create: `src/engine/map/layers/fog-apertures.ts`
- Create: `src/engine/map/layers/fog-material.ts`
- Create: `src/engine/map/layers/fog-layer.ts`
- Test: `tests/fog-apertures.test.ts`

**Interfaces:**
- Consumes: `isDiscoveredStatus` (Task 4), `hexToRgb01` (Task 7), `LayerContext`, `IconAtlas.softDisc()`/`SOFT_DISC_RADIUS` (Task 11).
- Produces:
  - `APERTURE_RADIUS = { critical: 70, other: 45, waypoint: 50 }`
  - `computeApertureTargets(snapshot: ProjectedWorldMapSnapshot): Map<string, { x: number; y: number; radius: number }>` — keys `loc:<id>` and `wp:<chapter>:<x>:<y>`.
  - `interface Aperture { id: string; x: number; y: number; radius: number; target: number }`
  - `class ApertureField { readonly apertures: Map<string, Aperture>; sync(targets, animate: boolean): { opened: string[]; closed: string[] }; tick(dtMs: number): boolean; list(): Aperture[]; readonly isAnimating: boolean }` — opening uses exponential approach with τ = 180 ms (≈ 900 ms to settle), closing τ = 90 ms; snaps within 0.5; closed apertures are deleted.
  - `createFogQuad(width: number, height: number): MeshGeometry` and `class DitherFogMaterial { constructor(options: { mask: Texture; color: string; opacity: number; worldWidth: number; worldHeight: number }); readonly shader: Shader; time: number; destroy(): void }` in `src/engine/map/layers/fog-material.ts` — a custom **Mesh** shader (GLSL, WebGL only). The mesh covers the plane in world space, so the 2-world-unit Bayer cells and drift noise are anchored to the map and never crawl while panning (a `Filter` would compute `gl_FragCoord` relative to its temporary screen-clipped target).
  - `FOG_MASK_SCALE = 4`
  - `class FogLayer { constructor(container: Container, ctx: LayerContext, renderer: Renderer | null); readonly field: ApertureField; resize(width: number, height: number): void; sync(snapshot: ProjectedWorldMapSnapshot, animate: boolean): string[]; update(dtMs: number): void; destroy(): void }`

- [ ] **Step 1: Write the failing test**

Create `tests/fog-apertures.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { ApertureField, computeApertureTargets, APERTURE_RADIUS } from '../src/engine/map/layers/fog-apertures';
import { FogLayer } from '../src/engine/map/layers/fog-layer';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

const def: WorldMapDefinition = {
  id: 'fog', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
  terrain: [], regions: [], routes: [], territories: [], events: [],
  locations: [
    { id: 'a', name: 'A', x: 100, y: 100, type: 'city', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1 },
    { id: 'b', name: 'B', x: 400, y: 400, type: 'village', importance: 'minor', firstAppearanceChapter: 50, revealedAtChapter: 20 },
  ],
  characterPaths: [{ characterId: 'hero', characterName: 'Hero', waypoints: [
    { chapter: 1, locationId: 'a', x: 100, y: 100 },
    { chapter: 60, x: 700, y: 700 },
  ] }],
};

describe('computeApertureTargets', () => {
  it('opens discovered locations and hero waypoints only', () => {
    const early = computeApertureTargets(projectTemporalMap(def, 30));
    expect([...early.keys()].sort()).toEqual(['loc:a', 'wp:1:100:100']);
    expect(early.get('loc:a')!.radius).toBe(APERTURE_RADIUS.critical);

    const late = computeApertureTargets(projectTemporalMap(def, 60));
    expect([...late.keys()].sort()).toEqual(['loc:a', 'loc:b', 'wp:1:100:100', 'wp:60:700:700']);
    expect(late.get('loc:b')!.radius).toBe(APERTURE_RADIUS.other);
    expect(late.get('wp:60:700:700')!.radius).toBe(APERTURE_RADIUS.waypoint);
  });
});

describe('ApertureField', () => {
  const t = (entries: Array<[string, number]>) =>
    new Map(entries.map(([id, r]) => [id, { x: 0, y: 0, radius: r }]));

  it('applies targets instantly when not animating', () => {
    const f = new ApertureField();
    const res = f.sync(t([['a', 70]]), false);
    expect(res.opened).toEqual([]);
    expect(f.apertures.get('a')!.radius).toBe(70);
    expect(f.isAnimating).toBe(false);
  });

  it('grows new apertures from zero over ~900ms', () => {
    const f = new ApertureField();
    const res = f.sync(t([['a', 70]]), true);
    expect(res.opened).toEqual(['a']);
    expect(f.apertures.get('a')!.radius).toBe(0);
    let changed = false;
    for (let i = 0; i < 6; i++) changed = f.tick(16) || changed;
    expect(changed).toBe(true);
    expect(f.apertures.get('a')!.radius).toBeGreaterThan(0);
    expect(f.apertures.get('a')!.radius).toBeLessThan(70);
    for (let i = 0; i < 60; i++) f.tick(16);
    expect(f.apertures.get('a')!.radius).toBe(70);
    expect(f.tick(16)).toBe(false);
  });

  it('closes removed apertures and deletes them', () => {
    const f = new ApertureField();
    f.sync(t([['a', 45]]), false);
    const res = f.sync(t([]), true);
    expect(res.closed).toEqual(['a']);
    for (let i = 0; i < 60; i++) f.tick(16);
    expect(f.apertures.has('a')).toBe(false);
  });

  it('reopens an aperture that is closing', () => {
    const f = new ApertureField();
    f.sync(t([['a', 45]]), false);
    f.sync(t([]), true);
    f.tick(16);
    f.sync(t([['a', 45]]), true);
    for (let i = 0; i < 80; i++) f.tick(16);
    expect(f.apertures.get('a')!.radius).toBe(45);
  });
});

describe('FogLayer without a renderer', () => {
  it('tracks apertures and returns newly opened ids', () => {
    const theme = getMapTheme('reverend-insanity');
    const fog = new FogLayer(new Container(), { theme, atlas: new IconAtlas(null, theme), tweens: new TweenManager(), reducedMotion: false }, null);
    fog.resize(1000, 1000);
    fog.sync(projectTemporalMap(def, 30), false);
    const opened = fog.sync(projectTemporalMap(def, 60), true);
    expect(opened.sort()).toEqual(['loc:b', 'wp:60:700:700']);
    fog.update(16);
    fog.destroy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/fog-apertures.test.ts`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Implement apertures**

Create `src/engine/map/layers/fog-apertures.ts`:

```ts
/**
 * Pure fog-of-war aperture model: which circles are open and how their
 * radii animate toward targets.
 */

import { isDiscoveredStatus } from '../../../projections/map-snapshot-diff';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';

export const APERTURE_RADIUS = { critical: 70, other: 45, waypoint: 50 } as const;

export interface ApertureTarget {
  x: number;
  y: number;
  radius: number;
}

export function computeApertureTargets(snapshot: ProjectedWorldMapSnapshot): Map<string, ApertureTarget> {
  const targets = new Map<string, ApertureTarget>();
  for (const loc of snapshot.locations) {
    if (!isDiscoveredStatus(loc.fogStatus)) continue;
    targets.set(`loc:${loc.id}`, {
      x: loc.x,
      y: loc.y,
      radius: loc.importance === 'critical' ? APERTURE_RADIUS.critical : APERTURE_RADIUS.other,
    });
  }
  const path = snapshot.characterPaths.find((p) => p.characterId === snapshot.activeCharacterId);
  for (const wp of path?.waypoints ?? []) {
    targets.set(`wp:${wp.chapter}:${wp.x}:${wp.y}`, { x: wp.x, y: wp.y, radius: APERTURE_RADIUS.waypoint });
  }
  return targets;
}

export interface Aperture {
  id: string;
  x: number;
  y: number;
  radius: number;
  target: number;
}

export class ApertureField {
  public readonly apertures = new Map<string, Aperture>();

  public get isAnimating(): boolean {
    for (const a of this.apertures.values()) if (a.radius !== a.target) return true;
    return false;
  }

  public sync(targets: Map<string, ApertureTarget>, animate: boolean): { opened: string[]; closed: string[] } {
    const opened: string[] = [];
    const closed: string[] = [];

    for (const [id, target] of targets) {
      const existing = this.apertures.get(id);
      if (existing) {
        existing.x = target.x;
        existing.y = target.y;
        existing.target = target.radius;
        if (!animate) existing.radius = target.radius;
      } else {
        this.apertures.set(id, {
          id,
          x: target.x,
          y: target.y,
          radius: animate ? 0 : target.radius,
          target: target.radius,
        });
        if (animate) opened.push(id);
      }
    }

    for (const [id, aperture] of this.apertures) {
      if (targets.has(id)) continue;
      if (!animate) {
        this.apertures.delete(id);
        continue;
      }
      if (aperture.target !== 0) {
        aperture.target = 0;
        closed.push(id);
      }
    }

    return { opened, closed };
  }

  public tick(dtMs: number): boolean {
    let changed = false;
    for (const [id, a] of this.apertures) {
      if (a.radius === a.target) {
        if (a.target === 0) this.apertures.delete(id);
        continue;
      }
      const tau = a.target > a.radius ? 180 : 90;
      const k = 1 - Math.exp(-dtMs / tau);
      a.radius += (a.target - a.radius) * k;
      if (Math.abs(a.target - a.radius) < 0.5) a.radius = a.target;
      if (a.target === 0 && a.radius === 0) this.apertures.delete(id);
      changed = true;
    }
    return changed;
  }

  public list(): Aperture[] {
    return Array.from(this.apertures.values());
  }
}
```

- [ ] **Step 4: Implement the world-anchored dither fog material**

Create `src/engine/map/layers/fog-material.ts`:

```ts
/**
 * Pixel-dithered fog of war as a custom Mesh shader.
 *
 * The mesh is a quad covering the plane in world space. Its UVs sample the
 * low-resolution reveal mask (alpha = revealed) and also give world
 * coordinates, so the 4x4 Bayer dither cells (2 world units each) and the
 * drifting noise are locked to the map: they scale with zoom like the rest
 * of the pixel art and never crawl while panning.
 *
 * WebGL only (the renderer is created with preference: 'webgl'). Pixi binds
 * uProjectionMatrix / uWorldTransformMatrix (global group) and
 * uTransformMatrix (local group) for custom mesh shaders.
 */

import { MeshGeometry, Shader, Texture, UniformGroup } from 'pixi.js';
import { hexToRgb01 } from '../scene/pixel-palette';

const vertex = `
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

void main() {
  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
  vUV = aUV;
}
`;

const fragment = `
in vec2 vUV;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec3 uFogColor;
uniform float uOpacity;
uniform float uTime;
uniform vec2 uWorldSize;

float bayer4(vec2 p) {
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int idx = x + y * 4;
  int m[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(m[idx]) + 0.5) / 16.0;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 world = vUV * uWorldSize;
  vec2 cell = floor(world / 2.0);
  float reveal = texture(uTexture, vUV).a;
  float drift = noise(world * 0.012 + vec2(uTime * 0.05, uTime * 0.02));
  float fog = clamp(1.0 - reveal, 0.0, 1.0);
  float density = fog * (0.82 + 0.18 * drift);
  float visible = step(bayer4(cell), density);
  float alpha = uOpacity * visible * (0.9 + 0.1 * drift);
  finalColor = vec4(uFogColor * alpha, alpha);
}
`;

export function createFogQuad(width: number, height: number): MeshGeometry {
  return new MeshGeometry({
    positions: new Float32Array([0, 0, width, 0, width, height, 0, height]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
}

export interface DitherFogOptions {
  mask: Texture;
  color: string;
  opacity: number;
  worldWidth: number;
  worldHeight: number;
}

export class DitherFogMaterial {
  public readonly shader: Shader;
  private readonly uniforms: UniformGroup;

  constructor(options: DitherFogOptions) {
    this.uniforms = new UniformGroup({
      uFogColor: { value: new Float32Array(hexToRgb01(options.color)), type: 'vec3<f32>' },
      uOpacity: { value: options.opacity, type: 'f32' },
      uTime: { value: 0, type: 'f32' },
      uWorldSize: { value: new Float32Array([options.worldWidth, options.worldHeight]), type: 'vec2<f32>' },
    });
    this.shader = Shader.from({
      gl: { vertex, fragment, name: 'omnilore-dither-fog' },
      resources: {
        uTexture: options.mask.source,
        uSampler: options.mask.source.style,
        fogUniforms: this.uniforms,
      },
    });
  }

  public get time(): number {
    return this.uniforms.uniforms.uTime as number;
  }

  public set time(seconds: number) {
    this.uniforms.uniforms.uTime = seconds;
  }

  public destroy(): void {
    this.shader.destroy();
  }
}
```

If TypeScript rejects `name` inside `gl: {...}`, drop the `name` property (it is only a debugging label).

- [ ] **Step 5: Implement the fog layer**

Create `src/engine/map/layers/fog-layer.ts`:

```ts
/**
 * Fog of war: a low-resolution reveal mask (soft discs per aperture)
 * rendered into a RenderTexture and shown through a world-anchored
 * Bayer-dither mesh shader.
 */

import { Container, Mesh, RenderTexture, Renderer, Sprite } from 'pixi.js';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { SOFT_DISC_RADIUS } from '../scene/icon-atlas';
import { ApertureField, computeApertureTargets } from './fog-apertures';
import { createFogQuad, DitherFogMaterial } from './fog-material';
import { LayerContext } from './layer-context';

export const FOG_MASK_SCALE = 4;
const SOFT_EDGE = 1.35;

export class FogLayer {
  public readonly field = new ApertureField();

  private readonly maskRoot = new Container();
  private readonly discs: Sprite[] = [];
  private renderTexture: RenderTexture | null = null;
  private mesh: Mesh | null = null;
  private material: DitherFogMaterial | null = null;
  private dirty = true;
  private time = 0;

  constructor(
    private readonly container: Container,
    private readonly ctx: LayerContext,
    private readonly renderer: Renderer | null
  ) {}

  public resize(width: number, height: number): void {
    if (!this.renderer) return;
    this.disposeGpu();
    this.renderTexture = RenderTexture.create({
      width: Math.ceil(width / FOG_MASK_SCALE),
      height: Math.ceil(height / FOG_MASK_SCALE),
    });
    this.material = new DitherFogMaterial({
      mask: this.renderTexture,
      color: this.ctx.theme.fogStyle.color ?? '#020705',
      opacity: this.ctx.theme.fogStyle.opacity ?? 0.85,
      worldWidth: width,
      worldHeight: height,
    });
    this.mesh = new Mesh({ geometry: createFogQuad(width, height), shader: this.material.shader });
    this.container.addChild(this.mesh);
    this.dirty = true;
  }

  /** Returns ids of apertures that just started opening. */
  public sync(snapshot: ProjectedWorldMapSnapshot, animate: boolean): string[] {
    const { opened } = this.field.sync(computeApertureTargets(snapshot), animate && !this.ctx.reducedMotion);
    this.dirty = true;
    return opened;
  }

  public update(dtMs: number): void {
    const changed = this.field.tick(dtMs);
    if (!this.ctx.reducedMotion) this.time += dtMs;
    if (this.material) this.material.time = this.time / 1000;
    if (changed || this.dirty) this.redrawMask();
  }

  public destroy(): void {
    this.disposeGpu();
    this.maskRoot.destroy({ children: true });
  }

  private disposeGpu(): void {
    this.container.removeChildren();
    this.mesh?.destroy();
    this.material?.destroy();
    this.renderTexture?.destroy(true);
    this.mesh = null;
    this.material = null;
    this.renderTexture = null;
  }

  private redrawMask(): void {
    this.dirty = false;
    if (!this.renderer || !this.renderTexture) return;
    const apertures = this.field.list();
    while (this.discs.length < apertures.length) {
      const disc = new Sprite(this.ctx.atlas.softDisc());
      disc.anchor.set(0.5);
      this.discs.push(disc);
      this.maskRoot.addChild(disc);
    }
    this.discs.forEach((disc, i) => {
      const aperture = apertures[i];
      disc.visible = Boolean(aperture) && aperture.radius > 0;
      if (!aperture) return;
      disc.position.set(aperture.x / FOG_MASK_SCALE, aperture.y / FOG_MASK_SCALE);
      disc.scale.set((aperture.radius * SOFT_EDGE) / FOG_MASK_SCALE / SOFT_DISC_RADIUS);
    });
    this.renderer.render({ container: this.maskRoot, target: this.renderTexture, clear: true });
  }
}
```

- [ ] **Step 6: Run tests, typecheck, commit**

Run: `npx vitest run tests/fog-apertures.test.ts && npx tsc --noEmit`
Expected: PASS (7 tests), clean. Check the "grows over ~900ms" test: after 6 × 16 ms, radius ≈ 70·(1 − e^(−96/180)) ≈ 29 (between 0 and 70); after 66 ticks (1056 ms) the gap is < 0.5 and snaps to 70.

```bash
git add src/engine/map/layers/fog-apertures.ts src/engine/map/layers/fog-material.ts src/engine/map/layers/fog-layer.ts tests/fog-apertures.test.ts
git commit -m "feat(map): add bayer-dithered animated fog of war

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: FX and atmosphere layers

**Files:**
- Create: `src/engine/map/layers/fx-layer.ts`
- Create: `src/engine/map/layers/atmosphere-layer.ts`
- Test: `tests/fx-atmosphere.test.ts`

**Interfaces:**
- Consumes: `LayerContext`, `IconAtlas.softDisc()`, `mulberry32`, `MapTheme`.
- Produces:
  - `class FxLayer { constructor(container: Container, ctx: LayerContext); burst(x: number, y: number, radius: number, color: string): void; warp(x: number, y: number, color: string): void; update(dtMs: number): void; readonly activeCount: number; clear(): void; destroy(): void }` — bursts: expanding ring (900 ms) + 24 ember sparks; warps: collapsing ring (350 ms) + 36 spiral sparks. No-ops under reduced motion.
  - `type ParticleMotion = 'rise' | 'fall' | 'drift' | 'swirl'`
  - `interface ParticleStyle { color: string; count: number; motion: ParticleMotion; minSize: number; maxSize: number; alpha: number; twinkle: boolean }`
  - `particleStyleFor(theme: MapTheme): ParticleStyle` (count capped at 120)
  - `class AtmosphereLayer { constructor(container: Container, ctx: LayerContext); readonly particles: Particle[]; readonly clouds: Cloud[]; reset(width: number, height: number, seed: number): void; update(dtMs: number): void; setCursor(point: { x: number; y: number } | null): void; destroy(): void }`

- [ ] **Step 1: Write the failing test**

Create `tests/fx-atmosphere.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { FxLayer } from '../src/engine/map/layers/fx-layer';
import { AtmosphereLayer, particleStyleFor } from '../src/engine/map/layers/atmosphere-layer';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme, UNIVERSE_MAP_THEMES } from '../src/domain/map-themes';

const ctx = (slug = 'coiling-dragon', reducedMotion = false) => {
  const theme = getMapTheme(slug);
  return { theme, atlas: new IconAtlas(null, theme), tweens: new TweenManager(), reducedMotion };
};

describe('FxLayer', () => {
  it('spawns and expires burst effects', () => {
    const fx = new FxLayer(new Container(), ctx());
    fx.burst(100, 100, 70, '#10b981');
    expect(fx.activeCount).toBe(25);
    fx.update(500);
    expect(fx.activeCount).toBeGreaterThan(0);
    fx.update(1200);
    expect(fx.activeCount).toBe(0);
  });

  it('spawns warp spirals that finish quickly', () => {
    const fx = new FxLayer(new Container(), ctx());
    fx.warp(0, 0, '#ffffff');
    expect(fx.activeCount).toBe(37);
    fx.update(400);
    expect(fx.activeCount).toBe(0);
  });

  it('does nothing under reduced motion', () => {
    const fx = new FxLayer(new Container(), ctx('coiling-dragon', true));
    fx.burst(0, 0, 50, '#fff');
    fx.warp(0, 0, '#fff');
    expect(fx.activeCount).toBe(0);
  });
});

describe('AtmosphereLayer', () => {
  it('derives a capped particle style for every theme', () => {
    for (const theme of Object.values(UNIVERSE_MAP_THEMES)) {
      const style = particleStyleFor(theme);
      expect(style.count).toBeGreaterThan(0);
      expect(style.count).toBeLessThanOrEqual(120);
      expect(style.minSize).toBeLessThanOrEqual(style.maxSize);
    }
    expect(particleStyleFor(getMapTheme('coiling-dragon')).motion).toBe('rise');
    expect(particleStyleFor(getMapTheme('demonic-emperor')).motion).toBe('fall');
  });

  it('keeps particles inside the world while updating', () => {
    const atm = new AtmosphereLayer(new Container(), ctx());
    atm.reset(400, 300, 42);
    expect(atm.particles.length).toBe(particleStyleFor(getMapTheme('coiling-dragon')).count);
    expect(atm.clouds.length).toBe(4);
    for (let i = 0; i < 200; i++) atm.update(50);
    for (const p of atm.particles) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(400);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(300);
    }
  });

  it('spawns nothing under reduced motion', () => {
    const atm = new AtmosphereLayer(new Container(), ctx('coiling-dragon', true));
    atm.reset(400, 300, 1);
    expect(atm.particles.length).toBe(0);
    expect(atm.clouds.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/fx-atmosphere.test.ts`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Implement the FX layer**

Create `src/engine/map/layers/fx-layer.ts`:

```ts
/**
 * Transient pixel effects: discovery bursts and waypoint warp spirals.
 * Visual-only randomness (Math.random is fine here; nothing is baked).
 */

import { Container, Graphics } from 'pixi.js';
import { LayerContext } from './layer-context';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Ring {
  x: number;
  y: number;
  fromRadius: number;
  toRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export class FxLayer {
  private readonly g = new Graphics();
  private sparks: Spark[] = [];
  private rings: Ring[] = [];

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    this.container.addChild(this.g);
  }

  public get activeCount(): number {
    return this.sparks.length + this.rings.length;
  }

  public burst(x: number, y: number, radius: number, color: string): void {
    if (this.ctx.reducedMotion) return;
    this.rings.push({ x, y, fromRadius: 0, toRadius: radius, life: 0, maxLife: 900, color });
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 0.05 + Math.random() * 0.08;
      this.sparks.push({
        x: x + Math.cos(angle) * radius * 0.6,
        y: y + Math.sin(angle) * radius * 0.6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.02,
        life: 0,
        maxLife: 600 + Math.random() * 500,
        color: i % 3 === 0 ? '#fff4d6' : color,
        size: 2,
      });
    }
  }

  public warp(x: number, y: number, color: string): void {
    if (this.ctx.reducedMotion) return;
    this.rings.push({ x, y, fromRadius: 90, toRadius: 0, life: 0, maxLife: 350, color: '#ffffff' });
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const r = 90;
      this.sparks.push({
        x: x + Math.cos(angle) * r,
        y: y + Math.sin(angle) * r,
        vx: -Math.sin(angle) * 0.25 - Math.cos(angle) * 0.25,
        vy: Math.cos(angle) * 0.25 - Math.sin(angle) * 0.25,
        life: 0,
        maxLife: 350,
        color,
        size: 2,
      });
    }
  }

  public update(dtMs: number): void {
    if (this.activeCount === 0) return;
    for (const s of this.sparks) {
      s.x += s.vx * dtMs;
      s.y += s.vy * dtMs;
      s.life += dtMs;
    }
    for (const r of this.rings) r.life += dtMs;
    this.sparks = this.sparks.filter((s) => s.life < s.maxLife);
    this.rings = this.rings.filter((r) => r.life < r.maxLife);
    this.redraw();
  }

  public clear(): void {
    this.sparks = [];
    this.rings = [];
    this.g.clear();
  }

  public destroy(): void {
    this.clear();
    this.g.destroy();
    this.container.removeChild(this.g);
  }

  private redraw(): void {
    const g = this.g;
    g.clear();
    for (const r of this.rings) {
      const t = r.life / r.maxLife;
      const radius = r.fromRadius + (r.toRadius - r.fromRadius) * t;
      if (radius > 0.5) g.circle(r.x, r.y, radius).stroke({ color: r.color, width: 2, alpha: 1 - t });
    }
    for (const s of this.sparks) {
      g.rect(Math.round(s.x), Math.round(s.y), s.size, s.size).fill({
        color: s.color,
        alpha: 1 - s.life / s.maxLife,
      });
    }
  }
}
```

- [ ] **Step 4: Implement the atmosphere layer**

Create `src/engine/map/layers/atmosphere-layer.ts`:

```ts
/**
 * Persistent ambient atmosphere: per-universe particles, drifting cloud
 * shadows, and a faint cursor torch-light.
 */

import { Container, Graphics, Sprite } from 'pixi.js';
import { MapTheme } from '../../../domain/map-themes';
import { mulberry32 } from '../scene/prng';
import { LayerContext } from './layer-context';

export type ParticleMotion = 'rise' | 'fall' | 'drift' | 'swirl';

export interface ParticleStyle {
  color: string;
  count: number;
  motion: ParticleMotion;
  minSize: number;
  maxSize: number;
  alpha: number;
  twinkle: boolean;
}

export interface Particle {
  x: number;
  y: number;
  size: number;
  phase: number;
}

export interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
}

export function particleStyleFor(theme: MapTheme): ParticleStyle {
  const type = theme.atmosphereParticles?.type ?? 'drift';
  const color = theme.atmosphereParticles?.color ?? theme.palette.primaryAccent;
  const count = Math.min(120, Math.max(1, (theme.atmosphereParticles?.count ?? 25) * 3));
  switch (type) {
    case 'elemental_spark':
      return { color, count, motion: 'rise', minSize: 1, maxSize: 2, alpha: 0.8, twinkle: true };
    case 'ink_mist':
      return { color, count, motion: 'drift', minSize: 3, maxSize: 5, alpha: 0.18, twinkle: false };
    case 'cosmic_star':
      return { color, count, motion: 'drift', minSize: 1, maxSize: 2, alpha: 0.9, twinkle: true };
    case 'sea_spray':
      return { color, count, motion: 'swirl', minSize: 1, maxSize: 2, alpha: 0.5, twinkle: false };
    case 'shadow_wisp':
      return { color, count, motion: 'rise', minSize: 2, maxSize: 3, alpha: 0.45, twinkle: true };
    case 'demonic_ember':
      return { color, count, motion: 'fall', minSize: 1, maxSize: 2, alpha: 0.75, twinkle: true };
    default:
      return { color, count, motion: 'drift', minSize: 1, maxSize: 2, alpha: 0.5, twinkle: false };
  }
}

export class AtmosphereLayer {
  public readonly particles: Particle[] = [];
  public readonly clouds: Cloud[] = [];

  private readonly particleGraphics = new Graphics();
  private readonly cloudGraphics = new Graphics();
  private readonly cursorLight: Sprite;
  private readonly style: ParticleStyle;
  private width = 0;
  private height = 0;
  private time = 0;

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    this.style = particleStyleFor(ctx.theme);
    this.cursorLight = new Sprite(ctx.atlas.softDisc());
    this.cursorLight.anchor.set(0.5);
    this.cursorLight.blendMode = 'add';
    this.cursorLight.tint = ctx.theme.palette.primaryAccent;
    this.cursorLight.alpha = 0;
    this.cursorLight.scale.set(1.2);
    this.container.addChild(this.cloudGraphics, this.particleGraphics, this.cursorLight);
  }

  public reset(width: number, height: number, seed: number): void {
    this.width = width;
    this.height = height;
    this.particles.length = 0;
    this.clouds.length = 0;
    if (this.ctx.reducedMotion) {
      this.redraw();
      return;
    }
    const rng = mulberry32(seed);
    for (let i = 0; i < this.style.count; i++) {
      this.particles.push({
        x: rng() * width,
        y: rng() * height,
        size: Math.round(this.style.minSize + rng() * (this.style.maxSize - this.style.minSize)),
        phase: rng(),
      });
    }
    for (let i = 0; i < 4; i++) {
      this.clouds.push({
        x: rng() * width,
        y: rng() * height,
        w: 180 + rng() * 220,
        h: 60 + rng() * 60,
        speed: 0.004 + rng() * 0.006,
      });
    }
    this.redraw();
  }

  public setCursor(point: { x: number; y: number } | null): void {
    if (!point || this.ctx.reducedMotion) {
      this.cursorLight.alpha = 0;
      return;
    }
    this.cursorLight.position.set(point.x, point.y);
    this.cursorLight.alpha = 0.12;
  }

  public update(dtMs: number): void {
    if (this.particles.length === 0 && this.clouds.length === 0) return;
    this.time += dtMs;
    const { motion } = this.style;
    for (const p of this.particles) {
      const sway = Math.sin(this.time / 900 + p.phase * 6.28);
      switch (motion) {
        case 'rise':
          p.y -= 0.012 * dtMs;
          p.x += sway * 0.01 * dtMs;
          break;
        case 'fall':
          p.y += 0.015 * dtMs;
          p.x += sway * 0.008 * dtMs;
          break;
        case 'swirl':
          p.x += 0.02 * dtMs;
          p.y += Math.sin(this.time / 400 + p.phase * 6.28) * 0.01 * dtMs;
          break;
        case 'drift':
        default:
          p.x += 0.006 * dtMs;
          p.y += sway * 0.004 * dtMs;
          break;
      }
      p.x = ((p.x % this.width) + this.width) % this.width;
      p.y = ((p.y % this.height) + this.height) % this.height;
    }
    for (const c of this.clouds) {
      c.x += c.speed * dtMs;
      if (c.x - c.w > this.width) c.x = -c.w;
    }
    this.redraw();
  }

  public destroy(): void {
    this.particles.length = 0;
    this.clouds.length = 0;
    this.container.removeChild(this.cloudGraphics, this.particleGraphics, this.cursorLight);
    this.cloudGraphics.destroy();
    this.particleGraphics.destroy();
    this.cursorLight.destroy();
  }

  private redraw(): void {
    const cg = this.cloudGraphics;
    cg.clear();
    for (const c of this.clouds) cg.ellipse(c.x, c.y, c.w / 2, c.h / 2).fill({ color: '#000000', alpha: 0.12 });

    const pg = this.particleGraphics;
    pg.clear();
    const { color, alpha, twinkle } = this.style;
    for (const p of this.particles) {
      const a = twinkle ? alpha * (0.6 + 0.4 * Math.sin(this.time / 250 + p.phase * 60)) : alpha;
      pg.rect(Math.round(p.x), Math.round(p.y), p.size, p.size).fill({ color, alpha: a });
    }
  }
}
```

- [ ] **Step 5: Run tests, typecheck, commit**

Run: `npx vitest run tests/fx-atmosphere.test.ts && npx tsc --noEmit`
Expected: PASS (6 tests), clean. Burst count = 1 ring + 24 sparks = 25; warp = 1 ring + 36 sparks = 37.

```bash
git add src/engine/map/layers/fx-layer.ts src/engine/map/layers/atmosphere-layer.ts tests/fx-atmosphere.test.ts
git commit -m "feat(map): add discovery bursts, warp spirals and per-universe atmosphere

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Pixel-font labels with level of detail

**Files:**
- Create: `src/engine/map/layers/labels-layer.ts`
- Test: `tests/labels-layer.test.ts`

**Interfaces:**
- Consumes: `LayerContext`, `polygonCentroid`, `shade`, `FogStatus`, `ProjectedWorldMapSnapshot`.
- Produces:
  - `type LabelKind = 'region' | 'critical' | 'major' | 'minor'`
  - `labelAlpha(kind: LabelKind, zoom: number): number` — region: 0.6 at zoom ≤ 1.0, linear to 0 at 1.4; critical/major/minor: 0 below threshold − 0.12, 1 at threshold (0.9 / 1.3 / 1.8).
  - `LABEL_SCREEN_SIZE: Record<LabelKind, number>` = region 18, critical 11, major 10, minor 9 (screen px)
  - `PIXEL_FONT_NAME = 'OmniPixel'`, `installPixelFont(): void` (idempotent), `uninstallPixelFont(): void`
  - `class LabelsLayer { constructor(container: Container, ctx: LayerContext, useBitmapFont: boolean); readonly labels: Map<string, { node: Text | BitmapText; kind: LabelKind }>; sync(snapshot: ProjectedWorldMapSnapshot): void; setZoom(zoom: number): void; destroy(): void }`

- [ ] **Step 1: Write the failing test**

Create `tests/labels-layer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { LabelsLayer, labelAlpha, LABEL_SCREEN_SIZE } from '../src/engine/map/layers/labels-layer';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

describe('labelAlpha', () => {
  it('fades region titles out as you zoom in', () => {
    expect(labelAlpha('region', 0.5)).toBeCloseTo(0.6);
    expect(labelAlpha('region', 1.2)).toBeCloseTo(0.3);
    expect(labelAlpha('region', 1.5)).toBe(0);
  });

  it('reveals landmark labels by importance', () => {
    expect(labelAlpha('critical', 0.7)).toBe(0);
    expect(labelAlpha('critical', 0.9)).toBe(1);
    expect(labelAlpha('major', 1.0)).toBe(0);
    expect(labelAlpha('major', 1.3)).toBe(1);
    expect(labelAlpha('minor', 1.3)).toBe(0);
    expect(labelAlpha('minor', 1.8)).toBe(1);
    expect(labelAlpha('minor', 1.74)).toBeCloseTo(0.5);
  });
});

describe('LabelsLayer (Text fallback)', () => {
  const def: WorldMapDefinition = {
    id: 'labels', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
    terrain: [], routes: [], territories: [], events: [], characterPaths: [],
    regions: [{ id: 'r', name: 'Southern Border', geometry: { type: 'Polygon', coordinates: [[[0, 0], [200, 0], [200, 200], [0, 200]]] } }],
    locations: [
      { id: 'big', name: 'Big City', x: 50, y: 50, type: 'city', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1 },
      { id: 'small', name: 'Hamlet', x: 90, y: 90, type: 'village', importance: 'minor', firstAppearanceChapter: 1, revealedAtChapter: 1 },
      { id: 'rumor', name: 'Rumor', x: 150, y: 150, type: 'ruin', importance: 'major', firstAppearanceChapter: 90, revealedAtChapter: 5 },
    ],
  };

  it('labels regions and discovered locations but never KNOWN ones', () => {
    const theme = getMapTheme('reverend-insanity');
    const layer = new LabelsLayer(new Container(), { theme, atlas: new IconAtlas(null, theme), tweens: new TweenManager(), reducedMotion: false }, false);
    layer.sync(projectTemporalMap(def, 10));
    expect([...layer.labels.keys()].sort()).toEqual(['loc:big', 'loc:small', 'region:r']);

    layer.setZoom(1.0);
    expect(layer.labels.get('loc:big')!.node.visible).toBe(true);
    expect(layer.labels.get('loc:small')!.node.visible).toBe(false);
    expect(layer.labels.get('region:r')!.node.alpha).toBeCloseTo(0.6);
    expect(layer.labels.get('loc:big')!.node.scale.x).toBeCloseTo(LABEL_SCREEN_SIZE.critical / 32 / 1.0);

    layer.sync(projectTemporalMap(def, 95));
    expect(layer.labels.has('loc:rumor')).toBe(true);
    layer.destroy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/labels-layer.test.ts`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement**

Create `src/engine/map/layers/labels-layer.ts`:

```ts
/**
 * Crisp Silkscreen labels (BitmapText in the browser, Text in tests) with
 * zoom-based level of detail and constant on-screen size.
 */

import { BitmapFont, BitmapText, Container, Text } from 'pixi.js';
import { MapRegion } from '../../../domain/map-types';
import { FogStatus, ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { polygonCentroid, Vec2 } from '../scene/geometry';
import { shade } from '../scene/pixel-palette';
import { LayerContext } from './layer-context';

export type LabelKind = 'region' | 'critical' | 'major' | 'minor';

const THRESHOLDS: Record<Exclude<LabelKind, 'region'>, number> = { critical: 0.9, major: 1.3, minor: 1.8 };
const FADE = 0.12;
const FONT_SIZE = 32;

export const LABEL_SCREEN_SIZE: Record<LabelKind, number> = { region: 18, critical: 11, major: 10, minor: 9 };
export const PIXEL_FONT_NAME = 'OmniPixel';

let fontInstalled = false;

export function installPixelFont(): void {
  if (fontInstalled) return;
  BitmapFont.install({
    name: PIXEL_FONT_NAME,
    style: {
      fontFamily: 'Silkscreen, monospace',
      fontSize: FONT_SIZE,
      fill: '#ffffff',
      stroke: { color: '#05060a', width: 4 },
    },
    chars: [['a', 'z'], ['A', 'Z'], ['0', '9'], " .,:;!?'\"-()/&+#"],
    resolution: 1,
  });
  fontInstalled = true;
}

export function uninstallPixelFont(): void {
  if (!fontInstalled) return;
  BitmapFont.uninstall(PIXEL_FONT_NAME);
  fontInstalled = false;
}

export function labelAlpha(kind: LabelKind, zoom: number): number {
  if (kind === 'region') {
    if (zoom <= 1.0) return 0.6;
    if (zoom >= 1.4) return 0;
    return (0.6 * (1.4 - zoom)) / 0.4;
  }
  const threshold = THRESHOLDS[kind];
  const start = threshold - FADE;
  if (zoom <= start) return 0;
  if (zoom >= threshold) return 1;
  return (zoom - start) / FADE;
}

interface LabelView {
  node: Text | BitmapText;
  kind: LabelKind;
}

function regionAnchor(region: MapRegion): { x: number; y: number } {
  const coords =
    region.geometry.type === 'Polygon'
      ? (region.geometry.coordinates as number[][][])[0]
      : (region.geometry.coordinates as number[][][][])[0][0];
  return polygonCentroid(coords as unknown as Vec2[]);
}

export class LabelsLayer {
  public readonly labels = new Map<string, LabelView>();
  private zoom = 1;

  constructor(
    private readonly container: Container,
    private readonly ctx: LayerContext,
    private readonly useBitmapFont: boolean
  ) {}

  public sync(snapshot: ProjectedWorldMapSnapshot): void {
    const desired = new Map<string, { text: string; kind: LabelKind; x: number; y: number }>();
    for (const region of snapshot.regions) {
      const p = regionAnchor(region);
      desired.set(`region:${region.id}`, { text: region.name.toUpperCase(), kind: 'region', x: p.x, y: p.y });
    }
    for (const loc of snapshot.locations) {
      if (loc.fogStatus === FogStatus.UNKNOWN || loc.fogStatus === FogStatus.KNOWN) continue;
      desired.set(`loc:${loc.id}`, { text: loc.name, kind: loc.importance, x: loc.x, y: loc.y + 6 });
    }

    for (const [key, view] of this.labels) {
      if (desired.has(key)) continue;
      view.node.destroy();
      this.labels.delete(key);
    }

    for (const [key, want] of desired) {
      let view = this.labels.get(key);
      if (!view || view.kind !== want.kind) {
        view?.node.destroy();
        view = { node: this.createNode(want.text, want.kind), kind: want.kind };
        this.labels.set(key, view);
        this.container.addChild(view.node);
      } else if (view.node.text !== want.text) {
        view.node.text = want.text;
      }
      view.node.position.set(Math.round(want.x), Math.round(want.y));
    }

    this.setZoom(this.zoom);
  }

  public setZoom(zoom: number): void {
    this.zoom = zoom;
    for (const view of this.labels.values()) {
      const alpha = labelAlpha(view.kind, zoom);
      view.node.alpha = alpha;
      view.node.visible = alpha > 0;
      view.node.scale.set(LABEL_SCREEN_SIZE[view.kind] / FONT_SIZE / zoom);
    }
  }

  public destroy(): void {
    for (const view of this.labels.values()) view.node.destroy();
    this.labels.clear();
    this.container.removeChildren();
  }

  private createNode(text: string, kind: LabelKind): Text | BitmapText {
    const color = this.ctx.theme.palette.textColor ?? '#ffffff';
    const letterSpacing = kind === 'region' ? 6 : 1;
    const tint = kind === 'region' ? shade(color, -0.2) : color;
    const node = this.useBitmapFont
      ? new BitmapText({ text, style: { fontFamily: PIXEL_FONT_NAME, fontSize: FONT_SIZE, letterSpacing } })
      : new Text({ text, style: { fontFamily: 'monospace', fontSize: FONT_SIZE, fill: tint, letterSpacing } });
    if (this.useBitmapFont) node.tint = tint;
    node.anchor.set(0.5, kind === 'region' ? 0.5 : 0);
    return node;
  }
}
```

- [ ] **Step 4: Run tests, typecheck, commit**

Run: `npx vitest run tests/labels-layer.test.ts && npx tsc --noEmit`
Expected: PASS (3 tests), clean. `labelAlpha('minor', 1.74)` = (1.74 − 1.68) / 0.12 = 0.5.

```bash
git add src/engine/map/layers/labels-layer.ts tests/labels-layer.test.ts
git commit -m "feat(map): add silkscreen bitmap labels with zoom level of detail

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Rewrite `PixiWorldRenderer` as a retained, coalescing facade

**Files:**
- Rewrite: `src/engine/map/pixi-world-renderer.ts`
- Modify: `tests/pixi-renderer.test.ts` (append a new `describe`)

**Interfaces:**
- Consumes: everything from Tasks 2–18.
- Produces (public API of `PixiWorldRenderer`):
  - Unchanged: the 9 containers, `camera`, `worldContainer`, `app`, `mode`, `onSelectLocation/Region/Event`, `setMode()`, `toggleLayer()`, `flyTo()`, `resize()`, `syncCameraTransform()`, `destroy()`, `renderSnapshot(snapshot, theme, options?)` (now forces a full sync).
  - New options: `reducedMotion?: boolean`, `heroAvatarUrl?: string`, `onHover?: (info: HoverInfo | null) => void`, `onCameraChange?: (view: CameraView) => void`, `onDiscover?: (locationIds: string[]) => void`.
  - New types: `interface HoverInfo { target: PickTarget; screenX: number; screenY: number }`, `interface CameraView { x: number; y: number; zoom: number; viewWidth: number; viewHeight: number; worldWidth: number; worldHeight: number }`.
  - New methods: `applySnapshot(snapshot, theme, options?): Promise<void>` (diff-driven; auto-upgrades to full on plane/map/theme change), `setHeroAvatar(url: string | undefined): void`, `warpTo(x: number, y: number, zoom?: number): void`, `hoverAt(screenX: number, screenY: number): void`, `clickAt(screenX: number, screenY: number): void`, `getCameraView(): CameraView`, `getMinimapImage(): Promise<string | null>`.
  - New read-only state: `ready: Promise<void>`, `currentSnapshot: ProjectedWorldMapSnapshot | null`, `commitCount: number`, `layerSet: RendererLayers | null`, `tweens: TweenManager`.
  - Coalescing contract: calls made before the queue drains are collapsed; only the newest snapshot is committed.

- [ ] **Step 1: Write the failing tests**

Append to `tests/pixi-renderer.test.ts` (add `import { projectTemporalMap } from '../src/projections/temporal-map';` and `import { WorldMapDefinition } from '../src/domain/map-types';` to the imports at the top):

```ts
describe('PixiWorldRenderer v3 (retained, diff-driven)', () => {
  const def: WorldMapDefinition = {
    id: 'facade-map',
    universeId: 'reverend-insanity',
    coordinateSystem: 'world',
    width: 1000,
    height: 1000,
    planes: [
      { id: 'a', name: 'Plane A', width: 1000, height: 1000, revealedAtChapter: 0, backdrop: 'sea', order: 0 },
      { id: 'b', name: 'Plane B', width: 500, height: 400, revealedAtChapter: 0, backdrop: 'sky', order: 1 },
    ],
    terrain: [
      { id: 'land', type: 'forest', name: 'Land', polygon: [[50, 50], [950, 50], [950, 950], [50, 950]], planeId: 'a', edgeStyle: 'coast' },
      { id: 'cloud', type: 'void', name: 'Cloud', polygon: [[20, 20], [480, 20], [480, 380], [20, 380]], planeId: 'b' },
    ],
    regions: [{ id: 'r', name: 'Realm', geometry: { type: 'Polygon', coordinates: [[[50, 50], [950, 50], [950, 950], [50, 950]]] }, planeId: 'a' }],
    locations: [
      { id: 'l1', name: 'Start', x: 100, y: 100, type: 'village', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'a', waypoint: true },
      { id: 'l2', name: 'Mid', x: 500, y: 500, type: 'city', importance: 'major', firstAppearanceChapter: 20, revealedAtChapter: 20, planeId: 'a' },
      { id: 'l3', name: 'End', x: 900, y: 900, type: 'castle', importance: 'major', firstAppearanceChapter: 40, revealedAtChapter: 40, planeId: 'a' },
      { id: 'sky', name: 'Sky', x: 250, y: 200, type: 'temple', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'b' },
    ],
    routes: [],
    territories: [],
    events: [],
    characterPaths: [{ characterId: 'hero', characterName: 'Hero', waypoints: [
      { chapter: 1, locationId: 'l1', x: 100, y: 100 },
      { chapter: 20, locationId: 'l2', x: 500, y: 500 },
      { chapter: 40, locationId: 'l3', x: 900, y: 900 },
    ] }],
  };
  const riTheme = getMapTheme('reverend-insanity');

  it('coalesces rapid snapshots and commits only the newest', async () => {
    const r = new PixiWorldRenderer(null, { width: 800, height: 600 });
    const pending = Array.from({ length: 40 }, (_, i) =>
      r.applySnapshot(projectTemporalMap(def, i + 1, { planeId: 'a' }), riTheme)
    );
    await Promise.all(pending);
    expect(r.currentSnapshot?.userChapter).toBe(40);
    expect(r.commitCount).toBe(1);
  });

  it('switches planes with a full re-sync and refits the camera', async () => {
    const r = new PixiWorldRenderer(null, { width: 800, height: 600 });
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'b' }), riTheme);
    expect(r.currentSnapshot?.planeId).toBe('b');
    expect(r.camera.worldWidth).toBe(500);
    expect(r.camera.x).toBe(250);
    expect(r.layerSet!.markers.markers.has('sky')).toBe(true);
    expect(r.layerSet!.markers.markers.has('l1')).toBe(false);
  });

  it('reports newly discovered locations on forward scrubs only', async () => {
    const onDiscover = vi.fn();
    const r = new PixiWorldRenderer(null, { width: 800, height: 600, onDiscover });
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    expect(onDiscover).not.toHaveBeenCalled();
    await r.applySnapshot(projectTemporalMap(def, 45, { planeId: 'a' }), riTheme);
    expect(onDiscover).toHaveBeenCalledWith(['l2', 'l3']);
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    expect(onDiscover).toHaveBeenCalledTimes(1);
  });

  it('rebuilds layers when the theme changes', async () => {
    const r = new PixiWorldRenderer(null, { width: 800, height: 600 });
    const snap = projectTemporalMap(def, 10, { planeId: 'a' });
    await r.applySnapshot(snap, riTheme);
    const first = r.layerSet;
    await r.applySnapshot(snap, getMapTheme('one-piece'));
    expect(r.layerSet).not.toBe(first);
    expect(r.commitCount).toBe(2);
  });

  it('hovers and clicks locations through deterministic picking', async () => {
    const onHover = vi.fn();
    const onSelectLocation = vi.fn();
    const r = new PixiWorldRenderer(null, { width: 800, height: 600, onHover, onSelectLocation });
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    const screen = r.camera.worldToScreen(100, 100);
    r.hoverAt(screen.x, screen.y);
    expect(onHover).toHaveBeenLastCalledWith({ target: { kind: 'location', id: 'l1' }, screenX: screen.x, screenY: screen.y });
    expect(r.layerSet!.markers.hoveredId).toBe('l1');
    r.clickAt(screen.x, screen.y);
    expect(onSelectLocation).toHaveBeenCalledWith('l1');
  });

  it('clears hover when the hovered marker disappears after a scrub', async () => {
    const onHover = vi.fn();
    const r = new PixiWorldRenderer(null, { width: 800, height: 600, onHover });
    await r.applySnapshot(projectTemporalMap(def, 45, { planeId: 'a' }), riTheme);
    const screen = r.camera.worldToScreen(900, 900);
    r.hoverAt(screen.x, screen.y);
    expect(r.layerSet!.markers.hoveredId).toBe('l3');
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    expect(r.layerSet!.markers.hoveredId).toBeNull();
    expect(onHover.mock.calls[onHover.mock.calls.length - 1][0]?.target?.id).not.toBe('l3');
  });

  it('exposes the camera view and tears down cleanly', async () => {
    const r = new PixiWorldRenderer(null, { width: 800, height: 600 });
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    expect(r.getCameraView()).toMatchObject({ viewWidth: 800, viewHeight: 600, worldWidth: 1000, worldHeight: 1000 });
    expect(await r.getMinimapImage()).toBeNull();
    r.destroy();
    expect(r.layerSet).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/pixi-renderer.test.ts`
Expected: FAIL — `r.applySnapshot is not a function`.

- [ ] **Step 3: Rewrite the facade**

Replace the entire contents of `src/engine/map/pixi-world-renderer.ts` with:

```ts
/**
 * OmniLore Map Engine v3 - PixiJS World Renderer (facade)
 *
 * Retained, diff-driven scene graph over 9 top-level containers:
 *  1. backgroundContainer    - void beyond the plane edges
 *  2. terrainContainer       - baked static plane (backdrop + terrain + glyphs)
 *  3. regionsContainer       - region borders & faction territories
 *  4. routesContainer        - animated travel routes
 *  5. characterPathContainer - hero trail + walking hero token
 *  6. markersContainer       - location markers, landmark glyphs, event flags
 *  7. fogContainer           - bayer-dithered fog of war
 *  8. atmosphereContainer    - particles, clouds, cursor light, FX
 *  9. labelsContainer        - Silkscreen labels with level of detail
 *
 * Snapshots go through a coalescing queue: only the newest pending snapshot
 * is committed, so rapid chapter scrubbing never builds up work.
 * Client-side safe: without a canvas (SSR/tests) everything runs headless.
 */

import { Application, Container, Graphics, Rectangle, Renderer, Sprite, Texture } from 'pixi.js';
import { CameraController } from './camera-controller';
import { ProjectedWorldMapSnapshot } from '../../projections/temporal-map';
import { diffMapSnapshots, MapSnapshotDiff } from '../../projections/map-snapshot-diff';
import { MapTheme } from '../../domain/map-themes';
import { MapMode, MapVisibleLayers } from '../../domain/map-types';
import { TweenManager } from './anim/tween';
import { GestureEvent, GestureTracker } from './input/gesture-tracker';
import { pickAt, PickTarget } from './input/picking';
import { createRendererBaker, IconAtlas } from './scene/icon-atlas';
import { buildStaticScene } from './scene/static-baker';
import { shade } from './scene/pixel-palette';
import { hashString } from './scene/prng';
import { LayerContext } from './layers/layer-context';
import { RegionsLayer } from './layers/regions-layer';
import { RoutesLayer } from './layers/routes-layer';
import { MarkersLayer } from './layers/markers-layer';
import { HeroLayer } from './layers/hero-layer';
import { FogLayer } from './layers/fog-layer';
import { FxLayer } from './layers/fx-layer';
import { AtmosphereLayer } from './layers/atmosphere-layer';
import { LabelsLayer, installPixelFont, uninstallPixelFont } from './layers/labels-layer';

export interface HoverInfo {
  target: PickTarget;
  screenX: number;
  screenY: number;
}

export interface CameraView {
  x: number;
  y: number;
  zoom: number;
  viewWidth: number;
  viewHeight: number;
  worldWidth: number;
  worldHeight: number;
}

export interface PixiWorldRendererOptions {
  width: number;
  height: number;
  mode?: MapMode | 'ATLAS' | 'ADVENTURE' | 'LORE' | string;
  reducedMotion?: boolean;
  heroAvatarUrl?: string;
  onSelectLocation?: (id: string) => void;
  onSelectRegion?: (id: string) => void;
  onSelectEvent?: (id: string) => void;
  onHover?: (info: HoverInfo | null) => void;
  onCameraChange?: (view: CameraView) => void;
  onDiscover?: (locationIds: string[]) => void;
}

export interface RenderSnapshotOptions {
  mode?: MapMode | 'ATLAS' | 'ADVENTURE' | 'LORE' | string;
  activeLayers?: Set<string> | MapVisibleLayers | Record<string, boolean>;
  includeUnknown?: boolean;
}

export interface RendererLayers {
  regions: RegionsLayer;
  routes: RoutesLayer;
  hero: HeroLayer;
  markers: MarkersLayer;
  fog: FogLayer;
  atmosphere: AtmosphereLayer;
  fx: FxLayer;
  labels: LabelsLayer;
}

const MAX_DISCOVERY_BURSTS = 6;

function normalizeMode(mode: string): MapMode {
  const m = mode.toLowerCase();
  return m === 'adventure' || m === 'lore' ? m : 'atlas';
}

export class PixiWorldRenderer {
  public readonly camera: CameraController;
  public readonly worldContainer = new Container();

  public readonly backgroundContainer = new Container();
  public readonly terrainContainer = new Container();
  public readonly regionsContainer = new Container();
  public readonly routesContainer = new Container();
  public readonly characterPathContainer = new Container();
  public readonly markersContainer = new Container();
  public readonly fogContainer = new Container();
  public readonly atmosphereContainer = new Container();
  public readonly labelsContainer = new Container();

  public app: Application | null = null;
  public mode: MapMode = 'atlas';
  public readonly tweens = new TweenManager();
  public readonly ready: Promise<void>;

  public onSelectLocation?: (id: string) => void;
  public onSelectRegion?: (id: string) => void;
  public onSelectEvent?: (id: string) => void;

  private readonly options: PixiWorldRendererOptions;
  private readonly gestures = new GestureTracker(4);
  private readonly staticCache = new Map<string, Texture>();
  private readonly reducedMotion: boolean;
  private heroAvatarUrl: string | undefined;
  private canvas: HTMLCanvasElement | null;
  private isDestroyed = false;

  private layers: RendererLayers | null = null;
  private atlas: IconAtlas | null = null;
  private layerTheme: MapTheme | null = null;
  private bakedKey: string | null = null;

  private latestSnapshot: ProjectedWorldMapSnapshot | null = null;
  private latestTheme: MapTheme | null = null;
  private lastDiff: MapSnapshotDiff | null = null;
  private commits = 0;
  private requestSeq = 0;
  private pendingFull = false;
  private chain: Promise<void> = Promise.resolve();

  private hovered: PickTarget | null = null;
  private hoverScreen: { x: number; y: number } | null = null;
  private lastZoom = -1;
  private lastCameraSignature = '';
  private animationFrameId: number | null = null;
  private lastTickTime = 0;
  private cleanupListeners: () => void = () => {};

  constructor(canvas: HTMLCanvasElement | null, options: PixiWorldRendererOptions) {
    this.canvas = canvas;
    this.options = options;
    this.onSelectLocation = options.onSelectLocation;
    this.onSelectRegion = options.onSelectRegion;
    this.onSelectEvent = options.onSelectEvent;
    this.reducedMotion = Boolean(options.reducedMotion);
    this.heroAvatarUrl = options.heroAvatarUrl;
    if (options.mode) this.mode = normalizeMode(options.mode);

    this.camera = new CameraController({
      worldWidth: options.width,
      worldHeight: options.height,
      viewWidth: options.width,
      viewHeight: options.height,
    });

    this.worldContainer.addChild(
      this.backgroundContainer,
      this.terrainContainer,
      this.regionsContainer,
      this.routesContainer,
      this.characterPathContainer,
      this.markersContainer,
      this.fogContainer,
      this.atmosphereContainer,
      this.labelsContainer
    );
    this.syncCameraTransform();

    if (typeof window !== 'undefined' && canvas) {
      this.ready = this.initPixiApp(canvas, options.width, options.height);
      this.attachCanvasListeners(canvas);
      this.startRenderLoop();
    } else {
      this.ready = Promise.resolve();
    }
  }

  // ---------------------------------------------------------------- state

  public get currentSnapshot(): ProjectedWorldMapSnapshot | null {
    return this.latestSnapshot;
  }

  public get commitCount(): number {
    return this.commits;
  }

  public get layerSet(): RendererLayers | null {
    return this.layers;
  }

  public get lastSnapshotDiff(): MapSnapshotDiff | null {
    return this.lastDiff;
  }

  private get renderer(): Renderer | null {
    return this.app?.renderer ?? null;
  }

  // ---------------------------------------------------------------- init

  private async initPixiApp(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    try {
      if (typeof document !== 'undefined' && document.fonts?.load) {
        await document.fonts.load('16px Silkscreen').catch(() => undefined);
      }
      const app = new Application();
      await app.init({
        canvas,
        width,
        height,
        preference: 'webgl',
        antialias: false,
        autoDensity: true,
        roundPixels: true,
        resolution: window.devicePixelRatio || 1,
        backgroundColor: 0x05070f,
      });
      if (this.isDestroyed) {
        app.destroy(false, { children: true });
        return;
      }
      this.app = app;
      installPixelFont();
      app.stage.addChild(this.worldContainer);
    } catch (e) {
      console.warn('[PixiWorldRenderer] WebGL initialization skipped:', e);
    }
  }

  // ---------------------------------------------------------------- snapshots

  /** Full re-sync (used on mount; kept for backwards compatibility). */
  public renderSnapshot(
    snapshot: ProjectedWorldMapSnapshot,
    theme: MapTheme,
    options?: RenderSnapshotOptions
  ): Promise<void> {
    return this.enqueue(snapshot, theme, options, true);
  }

  /** Diff-driven update; upgrades to a full sync on plane/map/theme change. */
  public applySnapshot(
    snapshot: ProjectedWorldMapSnapshot,
    theme: MapTheme,
    options?: RenderSnapshotOptions
  ): Promise<void> {
    return this.enqueue(snapshot, theme, options, false);
  }

  private enqueue(
    snapshot: ProjectedWorldMapSnapshot,
    theme: MapTheme,
    options: RenderSnapshotOptions | undefined,
    full: boolean
  ): Promise<void> {
    const seq = ++this.requestSeq;
    if (full) this.pendingFull = true;
    this.chain = this.chain
      .catch(() => undefined)
      .then(async () => {
        await this.ready;
        if (this.isDestroyed || seq !== this.requestSeq) return;
        try {
          this.commit(snapshot, theme, options ?? {});
        } catch (e) {
          console.error('[PixiWorldRenderer] commit failed:', e);
        }
      });
    return this.chain;
  }

  private commit(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme, options: RenderSnapshotOptions): void {
    if (options.mode) this.setMode(options.mode, false);
    if (options.activeLayers) this.applyActiveLayers(options.activeLayers);

    const prev = this.latestSnapshot;
    const planeChanged = !prev || prev.planeId !== snapshot.planeId || prev.mapId !== snapshot.mapId;
    const full = this.pendingFull || planeChanged || this.latestTheme !== theme;
    this.pendingFull = false;

    const layers = this.ensureLayers(theme);
    const diff = diffMapSnapshots(full ? null : prev, snapshot);

    if (full) {
      this.bakeStatic(snapshot, theme);
      this.drawVoid(snapshot, theme);
      this.camera.setWorldSize(snapshot.width, snapshot.height);
      if (planeChanged) this.camera.fitWorld();
      layers.fog.resize(snapshot.width, snapshot.height);
      layers.atmosphere.reset(snapshot.width, snapshot.height, hashString(`${snapshot.mapId}:${snapshot.planeId}`));
      layers.fx.clear();
      if (prev && planeChanged) layers.fx.warp(snapshot.width / 2, snapshot.height / 2, theme.palette.primaryAccent);
    }

    layers.regions.sync(snapshot);
    layers.routes.sync(snapshot);
    layers.markers.sync(snapshot, !full);
    layers.hero.sync(snapshot, diff);
    layers.fog.sync(snapshot, !full);
    layers.labels.sync(snapshot);
    layers.markers.setZoom(this.camera.zoom);
    layers.labels.setZoom(this.camera.zoom);

    if (!full && diff.newlyDiscoveredIds.length > 0) {
      const accent = theme.palette.primaryAccent;
      for (const id of diff.newlyDiscoveredIds.slice(-MAX_DISCOVERY_BURSTS)) {
        const loc = snapshot.locations.find((l) => l.id === id);
        if (loc) layers.fx.burst(loc.x, loc.y, loc.importance === 'critical' ? 70 : 45, accent);
      }
      this.options.onDiscover?.(diff.newlyDiscoveredIds);
    }

    this.latestSnapshot = snapshot;
    this.latestTheme = theme;
    this.lastDiff = diff;
    this.commits += 1;

    this.refreshHover();
    this.syncCameraTransform();
  }

  private ensureLayers(theme: MapTheme): RendererLayers {
    if (this.layers && this.layerTheme === theme) return this.layers;
    this.disposeLayers();

    const renderer = this.renderer;
    this.atlas = new IconAtlas(renderer ? createRendererBaker(renderer) : null, theme);
    const ctx: LayerContext = {
      theme,
      atlas: this.atlas,
      tweens: this.tweens,
      reducedMotion: this.reducedMotion,
    };

    const layers: RendererLayers = {
      regions: new RegionsLayer(this.regionsContainer, ctx),
      routes: new RoutesLayer(this.routesContainer, ctx),
      hero: new HeroLayer(this.characterPathContainer, ctx),
      markers: new MarkersLayer(this.markersContainer, ctx),
      fog: new FogLayer(this.fogContainer, ctx, renderer),
      atmosphere: new AtmosphereLayer(this.atmosphereContainer, ctx),
      fx: new FxLayer(this.atmosphereContainer, ctx),
      labels: new LabelsLayer(this.labelsContainer, ctx, renderer !== null),
    };
    layers.markers.setMode(this.mode);
    layers.hero.setMode(this.mode);
    void layers.hero.setAvatar(this.heroAvatarUrl);

    this.layers = layers;
    this.layerTheme = theme;
    this.bakedKey = null;
    return layers;
  }

  private disposeLayers(): void {
    if (this.layers) {
      for (const layer of Object.values(this.layers)) layer.destroy();
    }
    this.layers = null;
    this.layerTheme = null;
    this.tweens.clear();
    this.atlas?.destroy();
    this.atlas = null;
    for (const texture of this.staticCache.values()) texture.destroy(true);
    this.staticCache.clear();
    this.bakedKey = null;
    this.hovered = null;
    this.clearContainerAndDestroyChildren(this.terrainContainer);
    this.clearContainerAndDestroyChildren(this.backgroundContainer);
  }

  private bakeStatic(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    const key = `${snapshot.mapId}:${snapshot.planeId}:${theme.slug}`;
    if (this.bakedKey === key && this.terrainContainer.children.length > 0) return;
    this.clearContainerAndDestroyChildren(this.terrainContainer);

    const renderer = this.renderer;
    const atlas = this.atlas as IconAtlas;
    if (!renderer) {
      this.terrainContainer.addChild(buildStaticScene({ snapshot, theme, atlas }));
      this.bakedKey = key;
      return;
    }

    let texture = this.staticCache.get(key);
    if (!texture) {
      const scene = buildStaticScene({ snapshot, theme, atlas });
      texture = renderer.generateTexture({
        target: scene,
        frame: new Rectangle(0, 0, snapshot.width, snapshot.height),
        resolution: 0.5,
        antialias: false,
      });
      texture.source.scaleMode = 'nearest';
      scene.destroy({ children: true });
      this.staticCache.set(key, texture);
    }
    const sprite = new Sprite(texture);
    sprite.width = snapshot.width;
    sprite.height = snapshot.height;
    this.terrainContainer.addChild(sprite);
    this.bakedKey = key;
  }

  private drawVoid(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    this.clearContainerAndDestroyChildren(this.backgroundContainer);
    const pad = 4000;
    const g = new Graphics();
    g.rect(-pad, -pad, snapshot.width + pad * 2, snapshot.height + pad * 2).fill(
      shade(theme.palette.background, -0.55)
    );
    this.backgroundContainer.addChild(g);
  }

  // ---------------------------------------------------------------- controls

  public setMode(mode: MapMode | 'ATLAS' | 'ADVENTURE' | 'LORE' | string, _triggerRender: boolean = true): void {
    this.mode = normalizeMode(mode);
    this.layers?.markers.setMode(this.mode);
    this.layers?.hero.setMode(this.mode);
  }

  public toggleLayer(layerName: string, visible?: boolean): void {
    const setVis = (c: Container) => {
      c.visible = visible !== undefined ? visible : !c.visible;
    };
    switch (layerName.toLowerCase()) {
      case 'background':
        setVis(this.backgroundContainer);
        break;
      case 'terrain':
        setVis(this.terrainContainer);
        break;
      case 'regions':
      case 'territories':
        setVis(this.regionsContainer);
        break;
      case 'routes':
        setVis(this.routesContainer);
        break;
      case 'characterpaths':
      case 'characterpath':
      case 'paths':
        setVis(this.characterPathContainer);
        break;
      case 'markers':
      case 'locations':
      case 'events':
        setVis(this.markersContainer);
        break;
      case 'fog':
      case 'fogofwar':
        setVis(this.fogContainer);
        break;
      case 'atmosphere':
      case 'particles':
        setVis(this.atmosphereContainer);
        break;
      case 'labels':
        setVis(this.labelsContainer);
        break;
    }
  }

  private applyActiveLayers(activeLayers: Set<string> | MapVisibleLayers | Record<string, boolean>): void {
    const isVisible = (layer: string): boolean =>
      activeLayers instanceof Set
        ? activeLayers.has(layer)
        : ((activeLayers as Record<string, boolean>)[layer] ?? true);

    this.terrainContainer.visible = isVisible('terrain');
    this.regionsContainer.visible = isVisible('regions') || isVisible('territories');
    this.routesContainer.visible = isVisible('routes');
    this.characterPathContainer.visible = isVisible('characterPaths');
    this.markersContainer.visible = isVisible('markers') || isVisible('locations');
    this.fogContainer.visible = isVisible('fog') || isVisible('fogOfWar');
    this.atmosphereContainer.visible = isVisible('atmosphere') || isVisible('particles');
    this.labelsContainer.visible = isVisible('labels');
  }

  /** Swap the hero portrait without recreating the renderer. */
  public setHeroAvatar(url: string | undefined): void {
    if (url === this.heroAvatarUrl) return;
    this.heroAvatarUrl = url;
    void this.layers?.hero.setAvatar(url);
  }

  public flyTo(targetX: number, targetY: number, targetZoom?: number, durationMs: number = 500): void {
    this.camera.flyTo(targetX, targetY, targetZoom, this.reducedMotion ? 16 : durationMs);
  }

  /** Instant camera cut with a warp spiral at the destination. */
  public warpTo(x: number, y: number, zoom: number = 1.8): void {
    this.camera.stopAnimation();
    this.camera.setZoom(zoom);
    this.camera.setPosition(x, y);
    const accent = this.latestTheme?.palette.primaryAccent ?? '#ffffff';
    this.layers?.fx.warp(x, y, accent);
    this.syncCameraTransform();
  }

  public getCameraView(): CameraView {
    return {
      x: this.camera.x,
      y: this.camera.y,
      zoom: this.camera.zoom,
      viewWidth: this.camera.viewWidth,
      viewHeight: this.camera.viewHeight,
      worldWidth: this.camera.worldWidth,
      worldHeight: this.camera.worldHeight,
    };
  }

  public async getMinimapImage(): Promise<string | null> {
    await this.ready;
    const renderer = this.renderer;
    const texture = this.bakedKey ? this.staticCache.get(this.bakedKey) : undefined;
    if (!renderer || !texture) return null;
    try {
      return await renderer.extract.base64(texture);
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------- input

  public hoverAt(screenX: number, screenY: number): void {
    this.hoverScreen = { x: screenX, y: screenY };
    const target = this.pickScreen(screenX, screenY);
    const world = this.camera.screenToWorld(screenX, screenY);
    this.layers?.atmosphere.setCursor(world);
    this.setHover(target, screenX, screenY);
  }

  public clickAt(screenX: number, screenY: number): void {
    const target = this.pickScreen(screenX, screenY);
    if (!target) return;
    if (target.kind === 'location') this.onSelectLocation?.(target.id);
    else if (target.kind === 'region') this.onSelectRegion?.(target.id);
    else this.onSelectEvent?.(target.id);
  }

  private pickScreen(screenX: number, screenY: number): PickTarget | null {
    if (!this.latestSnapshot) return null;
    const world = this.camera.screenToWorld(screenX, screenY);
    return pickAt(this.latestSnapshot, world.x, world.y, this.camera.zoom);
  }

  private setHover(target: PickTarget | null, screenX: number, screenY: number): void {
    this.hovered = target;
    this.layers?.markers.setHovered(target?.kind === 'location' ? target.id : null);
    this.layers?.regions.setHovered(target?.kind === 'region' ? target.id : null);
    if (this.canvas) this.canvas.style.cursor = target && target.kind !== 'region' ? 'pointer' : 'grab';
    this.options.onHover?.(target ? { target, screenX, screenY } : null);
  }

  private clearHover(): void {
    this.hoverScreen = null;
    this.layers?.atmosphere.setCursor(null);
    if (this.hovered) this.setHover(null, 0, 0);
  }

  private refreshHover(): void {
    if (this.hoverScreen) this.hoverAt(this.hoverScreen.x, this.hoverScreen.y);
    else if (this.hovered) this.setHover(null, 0, 0);
  }

  private handleGesture(event: GestureEvent | null): void {
    if (!event) return;
    switch (event.type) {
      case 'pan':
        this.camera.stopAnimation();
        this.camera.panByScreen(event.dx, event.dy);
        this.clearHover();
        break;
      case 'pinch':
        this.camera.stopAnimation();
        this.camera.zoomAt(this.camera.zoom * event.scale, event.centerX, event.centerY);
        break;
      case 'hover':
        this.hoverAt(event.x, event.y);
        break;
      case 'click':
        this.clickAt(event.x, event.y);
        break;
    }
    this.syncCameraTransform();
  }

  private attachCanvasListeners(canvas: HTMLCanvasElement): void {
    const local = (e: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e);
      this.camera.stopAnimation();
      this.camera.zoomBy(e.deltaY < 0 ? 1.15 : 0.87, p.x, p.y);
      this.syncCameraTransform();
    };
    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture?.(e.pointerId);
      const p = local(e);
      this.gestures.down(e.pointerId, p.x, p.y);
    };
    const onPointerMove = (e: PointerEvent) => {
      const p = local(e);
      this.handleGesture(this.gestures.move(e.pointerId, p.x, p.y));
    };
    const onPointerUp = (e: PointerEvent) => {
      const p = local(e);
      this.handleGesture(this.gestures.up(e.pointerId, p.x, p.y));
    };
    const onPointerCancel = () => this.gestures.cancel();
    const onPointerLeave = () => {
      if (!this.gestures.isDragging) this.clearHover();
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('pointerleave', onPointerLeave);

    this.cleanupListeners = () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }

  // ---------------------------------------------------------------- frame loop

  public syncCameraTransform(): void {
    this.worldContainer.scale.set(this.camera.zoom);
    this.worldContainer.position.set(
      Math.round(this.camera.viewWidth / 2 - this.camera.x * this.camera.zoom),
      Math.round(this.camera.viewHeight / 2 - this.camera.y * this.camera.zoom)
    );
  }

  private emitCameraChange(): void {
    if (!this.options.onCameraChange) return;
    const c = this.camera;
    const signature = `${c.x.toFixed(1)}:${c.y.toFixed(1)}:${c.zoom.toFixed(3)}:${c.viewWidth}:${c.viewHeight}:${c.worldWidth}:${c.worldHeight}`;
    if (signature === this.lastCameraSignature) return;
    this.lastCameraSignature = signature;
    this.options.onCameraChange(this.getCameraView());
  }

  private startRenderLoop(): void {
    const tick = (now: number) => {
      if (this.isDestroyed) return;
      const dt = this.lastTickTime === 0 ? 16 : Math.min(64, now - this.lastTickTime);
      this.lastTickTime = now;

      if (this.camera.isAnimating) this.camera.tick(dt);
      this.tweens.tick(dt);

      const layers = this.layers;
      if (layers) {
        if (this.camera.zoom !== this.lastZoom) {
          this.lastZoom = this.camera.zoom;
          layers.markers.setZoom(this.camera.zoom);
          layers.labels.setZoom(this.camera.zoom);
        }
        layers.markers.update(dt);
        layers.routes.update(dt);
        layers.hero.update(dt);
        layers.fog.update(dt);
        layers.fx.update(dt);
        layers.atmosphere.update(dt);
      }

      this.syncCameraTransform();
      this.emitCameraChange();
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------- lifecycle

  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.camera.resize(width, height);
    this.app?.renderer?.resize(width, height);
    this.syncCameraTransform();
  }

  private clearContainerAndDestroyChildren(container: Container): void {
    for (const child of container.removeChildren()) {
      try {
        child.destroy({ children: true });
      } catch {
        // Mock environments
      }
    }
  }

  public destroy(removeView: boolean = true): void {
    this.isDestroyed = true;
    if (this.animationFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cleanupListeners();
    this.camera.stopAnimation();
    this.disposeLayers();
    this.latestSnapshot = null;

    if (this.app) {
      try {
        uninstallPixelFont();
        this.app.destroy(removeView, { children: true, texture: true, textureSource: true });
      } catch {
        // Safe destroy fallback
      }
      this.app = null;
    }
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/pixi-renderer.test.ts`
Expected: PASS — the 11 existing tests plus 7 new ones. Note on the existing `renders snapshot elements into layer containers` test: `markersContainer` always has 3 sub-containers, `terrainContainer` holds the headless static scene, `regionsContainer` holds the territory graphic plus one region, `labelsContainer` holds the `Qing Mao Mountain` label.

If the "clears hover" test fails because `refreshHover` re-picks the region under the cursor, that is correct behavior (the last hover target becomes region `r`); the assertion only requires it is no longer `l3`.

- [ ] **Step 5: Full suite, typecheck, commit**

Run: `npm test && npx tsc --noEmit`
Expected: all green, clean. `RpgWorldAtlas.tsx` still calls `renderSnapshot`, which remains valid; it is rewired in Task 21.

```bash
git add src/engine/map/pixi-world-renderer.ts tests/pixi-renderer.test.ts
git commit -m "feat(map): rewrite pixi renderer as retained, coalescing, diff-driven facade

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: DOM overlays — tooltip, discovery banner, waypoint panel, frame, minimap

**Files:**
- Create: `src/components/map/atlas-ui-state.ts`
- Create: `src/components/map/AtlasTooltip.tsx`
- Create: `src/components/map/DiscoveryBanner.tsx`
- Create: `src/components/map/WaypointPanel.tsx`
- Create: `src/components/map/AtlasFrame.tsx`
- Create: `src/components/map/AtlasMinimap.tsx`
- Test: `tests/atlas-ui.test.ts`

**Interfaces:**
- Consumes: `ProjectedWorldMapSnapshot`, `ProjectedWaypoint`, `ProjectedPlane`, `FogStatus` (Task 2); `PickTarget` (Task 10); `CameraView` (Task 19); `DANGER_COLORS` (Task 7); `WorldMapDefinition`, `DangerLevel`.
- Produces (`atlas-ui-state.ts`, all pure):
  - `interface Emitter<T> { emit(value: T): void; subscribe(listener: (value: T) => void): () => void; get(): T }`, `createEmitter<T>(initial: T): Emitter<T>`
  - `interface BannerState { latest: string; total: number; key: number }`, `BANNER_DURATION_MS = 2500`, `bannerReducer(state: BannerState | null, discoveredNames: string[]): BannerState | null`
  - `interface TooltipModel { kind: 'location' | 'region' | 'event'; title: string; typeLabel: string; masked: boolean; danger?: DangerLevel; factionName?: string; firstSeen?: number; eventCount: number; isWaypoint: boolean; portraitUrl?: string; hint: string }`
  - `buildTooltipModel(snapshot: ProjectedWorldMapSnapshot, target: PickTarget, universeSlug?: string): TooltipModel | null`
  - `placeTooltip(x: number, y: number, width: number, height: number, viewportWidth: number, viewportHeight: number, offset?: number): { left: number; top: number }`
  - `visibleRegionNames(def: WorldMapDefinition, userChapter: number): Record<string, string>`
  - `interface WaypointGroup { planeId: string; planeName: string; regions: Array<{ regionId: string | null; regionName: string; waypoints: ProjectedWaypoint[] }> }`, `groupWaypoints(waypoints: ProjectedWaypoint[], planes: ProjectedPlane[], regionNames: Record<string, string>): WaypointGroup[]`
  - `fogCirclesForMinimap(snapshot: ProjectedWorldMapSnapshot): Array<{ x: number; y: number; r: number }>`
- Produces (components): `AtlasTooltip`, `DiscoveryBanner`, `WaypointPanel`, `AtlasFrame`, `AtlasMinimap` with the props shown in the code below.

- [ ] **Step 1: Write the failing test**

Create `tests/atlas-ui.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createEmitter,
  bannerReducer,
  buildTooltipModel,
  placeTooltip,
  visibleRegionNames,
  groupWaypoints,
  fogCirclesForMinimap,
} from '../src/components/map/atlas-ui-state';
import { AtlasTooltip } from '../src/components/map/AtlasTooltip';
import { DiscoveryBanner } from '../src/components/map/DiscoveryBanner';
import { WaypointPanel } from '../src/components/map/WaypointPanel';
import { AtlasFrame } from '../src/components/map/AtlasFrame';
import { AtlasMinimap } from '../src/components/map/AtlasMinimap';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

const def: WorldMapDefinition = {
  id: 'ui', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
  planes: [
    { id: 'mortal', name: 'Mortal Realm', width: 1000, height: 1000, revealedAtChapter: 0, backdrop: 'sea', order: 0 },
    { id: 'heaven', name: 'Heaven', width: 600, height: 400, revealedAtChapter: 10, backdrop: 'sky', order: 1 },
  ],
  terrain: [],
  regions: [
    { id: 'south', name: 'Southern Border', geometry: { type: 'Polygon', coordinates: [[[0, 0], [500, 0], [500, 500]]] }, planeId: 'mortal' },
    { id: 'north', name: 'Northern Plains', geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1]]] }, planeId: 'mortal', visibleFromChapter: 400 },
  ],
  locations: [
    { id: 'loc-qing-mao-mountain', name: 'Qing Mao Mountain', x: 100, y: 100, type: 'mountain', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'mortal', regionId: 'south', waypoint: true, dangerLevel: 'B', controllingFactionId: 'gu-yue' },
    { id: 'rumor', name: 'Secret Vault', x: 300, y: 300, type: 'dungeon', importance: 'major', firstAppearanceChapter: 90, revealedAtChapter: 5, planeId: 'mortal' },
    { id: 'palace', name: 'Sky Palace', x: 200, y: 100, type: 'temple', importance: 'critical', firstAppearanceChapter: 12, revealedAtChapter: 12, planeId: 'heaven', waypoint: true },
  ],
  routes: [],
  territories: [{ factionId: 'gu-yue', name: 'Gu Yue Clan', boundary: [[0, 0], [200, 0], [200, 200]], controlPeriods: [{ fromChapter: 1, toChapter: null, influencePct: 90 }], planeId: 'mortal' }],
  events: [
    { id: 'ev1', name: 'Awakening', chapter: 3, locationId: 'loc-qing-mao-mountain', eventType: 'breakthrough', importance: 'major' },
    { id: 'ev2', name: 'Future War', chapter: 99, locationId: 'loc-qing-mao-mountain', eventType: 'war', importance: 'major' },
  ],
  characterPaths: [{ characterId: 'hero', characterName: 'Hero', waypoints: [{ chapter: 1, locationId: 'loc-qing-mao-mountain', x: 100, y: 100 }] }],
};

describe('createEmitter', () => {
  it('stores the latest value and notifies subscribers until unsubscribed', () => {
    const e = createEmitter(0);
    const fn = vi.fn();
    const off = e.subscribe(fn);
    e.emit(5);
    expect(e.get()).toBe(5);
    expect(fn).toHaveBeenCalledWith(5);
    off();
    e.emit(6);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('bannerReducer', () => {
  it('coalesces discoveries into latest name plus a running total', () => {
    let s = bannerReducer(null, []);
    expect(s).toBeNull();
    s = bannerReducer(s, ['A']);
    expect(s).toEqual({ latest: 'A', total: 1, key: 1 });
    s = bannerReducer(s, ['B', 'C']);
    expect(s).toEqual({ latest: 'C', total: 3, key: 2 });
  });
});

describe('buildTooltipModel', () => {
  const snap = projectTemporalMap(def, 20);

  it('describes a discovered location with chapter-bounded facts', () => {
    const m = buildTooltipModel(snap, { kind: 'location', id: 'loc-qing-mao-mountain' }, 'reverend-insanity')!;
    expect(m.title).toBe('Qing Mao Mountain');
    expect(m.masked).toBe(false);
    expect(m.danger).toBe('B');
    expect(m.factionName).toBe('Gu Yue Clan');
    expect(m.firstSeen).toBe(1);
    expect(m.eventCount).toBe(1);
    expect(m.isWaypoint).toBe(true);
    expect(m.portraitUrl).toBe('/assets/pixels/reverend-insanity/locations/qing-mao-mountain.svg');
  });

  it('masks KNOWN locations completely', () => {
    const m = buildTooltipModel(snap, { kind: 'location', id: 'rumor' })!;
    expect(m.masked).toBe(true);
    expect(m.title).toBe('??? UNCHARTED');
    expect(m.title).not.toContain('Secret');
    expect(m.danger).toBeUndefined();
    expect(m.firstSeen).toBeUndefined();
    expect(m.portraitUrl).toBeUndefined();
    expect(m.isWaypoint).toBe(false);
  });

  it('describes regions and events', () => {
    expect(buildTooltipModel(snap, { kind: 'region', id: 'south' })!.title).toBe('SOUTHERN BORDER');
    const ev = buildTooltipModel(snap, { kind: 'event', id: 'ev1' })!;
    expect(ev.title).toBe('Awakening');
    expect(ev.firstSeen).toBe(3);
  });

  it('returns null for targets that are not in the snapshot', () => {
    expect(buildTooltipModel(snap, { kind: 'event', id: 'ev2' })).toBeNull();
    expect(buildTooltipModel(snap, { kind: 'location', id: 'palace' })).toBeNull();
  });
});

describe('placeTooltip', () => {
  it('offsets from the cursor and flips at viewport edges', () => {
    expect(placeTooltip(100, 100, 200, 100, 800, 600)).toEqual({ left: 116, top: 116 });
    expect(placeTooltip(700, 550, 200, 100, 800, 600)).toEqual({ left: 484, top: 434 });
    expect(placeTooltip(5, 5, 900, 700, 800, 600)).toEqual({ left: 0, top: 0 });
  });
});

describe('waypoint grouping', () => {
  it('only names regions that are visible at the current chapter', () => {
    expect(visibleRegionNames(def, 20)).toEqual({ south: 'Southern Border' });
    expect(visibleRegionNames(def, 400)).toEqual({ south: 'Southern Border', north: 'Northern Plains' });
  });

  it('groups discovered waypoints by plane then region', () => {
    const snap = projectTemporalMap(def, 20);
    const groups = groupWaypoints(snap.waypoints, snap.planes, visibleRegionNames(def, 20));
    expect(groups.map((g) => g.planeId)).toEqual(['mortal', 'heaven']);
    expect(groups[0].regions[0]).toMatchObject({ regionId: 'south', regionName: 'Southern Border' });
    expect(groups[1].regions[0]).toMatchObject({ regionId: null, regionName: 'UNCHARTED LANDS' });
  });
});

describe('fogCirclesForMinimap', () => {
  it('returns one circle per discovered location', () => {
    const circles = fogCirclesForMinimap(projectTemporalMap(def, 20));
    expect(circles).toEqual([{ x: 100, y: 100, r: 70 }]);
  });
});

describe('overlay components', () => {
  const snap = projectTemporalMap(def, 20);

  it('renders the tooltip only with a model', () => {
    expect(renderToStaticMarkup(React.createElement(AtlasTooltip, { model: null, x: 0, y: 0, viewportWidth: 800, viewportHeight: 600, accentColor: '#10b981' }))).toBe('');
    const model = buildTooltipModel(snap, { kind: 'location', id: 'loc-qing-mao-mountain' }, 'reverend-insanity');
    const html = renderToStaticMarkup(React.createElement(AtlasTooltip, { model, x: 10, y: 10, viewportWidth: 800, viewportHeight: 600, accentColor: '#10b981' }));
    expect(html).toContain('data-testid="atlas-tooltip"');
    expect(html).toContain('Qing Mao Mountain');
    expect(html).toContain('WAYPOINT');
    expect(html).toContain('FIRST SEEN');
  });

  it('renders the discovery banner with the +N MORE suffix', () => {
    const html = renderToStaticMarkup(React.createElement(DiscoveryBanner, { state: { latest: 'Shang City', total: 4, key: 1 }, onDone: () => {}, accentColor: '#10b981' }));
    expect(html).toContain('NEW AREA DISCOVERED');
    expect(html).toContain('Shang City');
    expect(html).toContain('+3 MORE');
  });

  it('renders the waypoint panel with groups and an empty state', () => {
    const groups = groupWaypoints(snap.waypoints, snap.planes, visibleRegionNames(def, 20));
    const html = renderToStaticMarkup(React.createElement(WaypointPanel, { groups, activePlaneId: 'mortal', onTravel: () => {}, onClose: () => {}, accentColor: '#10b981' }));
    expect(html).toContain('WAYPOINTS');
    expect(html).toContain('Qing Mao Mountain');
    expect(html).toContain('Sky Palace');
    expect(html).toContain('CURRENT');
    const empty = renderToStaticMarkup(React.createElement(WaypointPanel, { groups: [], activePlaneId: 'mortal', onTravel: () => {}, onClose: () => {}, accentColor: '#10b981' }));
    expect(empty).toContain('NO WAYPOINTS DISCOVERED YET');
  });

  it('renders the frame and minimap', () => {
    expect(renderToStaticMarkup(React.createElement(AtlasFrame, { accentColor: '#10b981', rune: '🦗' }))).toContain('🦗');
    const html = renderToStaticMarkup(React.createElement(AtlasMinimap, {
      imageUrl: null, worldWidth: 1000, worldHeight: 1000, fogCircles: [{ x: 100, y: 100, r: 70 }],
      hero: { x: 100, y: 100 }, subscribe: () => () => {}, onPan: () => {}, accentColor: '#10b981', fogColor: '#020705',
    }));
    expect(html).toContain('data-testid="atlas-minimap"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/atlas-ui.test.ts`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Implement the pure UI state helpers**

Create `src/components/map/atlas-ui-state.ts`:

```ts
/**
 * Pure helpers for the atlas DOM overlays. Everything here is built only
 * from the current zero-spoiler snapshot (or chapter-gated definition data).
 */

import { DangerLevel, WorldMapDefinition } from '../../domain/map-types';
import { isDiscoveredStatus } from '../../projections/map-snapshot-diff';
import {
  FogStatus,
  ProjectedPlane,
  ProjectedWaypoint,
  ProjectedWorldMapSnapshot,
} from '../../projections/temporal-map';
import { PickTarget } from '../../engine/map/input/picking';

// ---------------------------------------------------------------- emitter

export interface Emitter<T> {
  emit(value: T): void;
  subscribe(listener: (value: T) => void): () => void;
  get(): T;
}

export function createEmitter<T>(initial: T): Emitter<T> {
  let value = initial;
  const listeners = new Set<(value: T) => void>();
  return {
    emit(next) {
      value = next;
      for (const listener of listeners) listener(next);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get() {
      return value;
    },
  };
}

// ---------------------------------------------------------------- banner

export interface BannerState {
  latest: string;
  total: number;
  key: number;
}

export const BANNER_DURATION_MS = 2500;

export function bannerReducer(state: BannerState | null, discoveredNames: string[]): BannerState | null {
  if (discoveredNames.length === 0) return state;
  return {
    latest: discoveredNames[discoveredNames.length - 1],
    total: (state?.total ?? 0) + discoveredNames.length,
    key: (state?.key ?? 0) + 1,
  };
}

// ---------------------------------------------------------------- tooltip

export interface TooltipModel {
  kind: 'location' | 'region' | 'event';
  title: string;
  typeLabel: string;
  masked: boolean;
  danger?: DangerLevel;
  factionName?: string;
  firstSeen?: number;
  eventCount: number;
  isWaypoint: boolean;
  portraitUrl?: string;
  hint: string;
}

export function buildTooltipModel(
  snapshot: ProjectedWorldMapSnapshot,
  target: PickTarget,
  universeSlug?: string
): TooltipModel | null {
  if (target.kind === 'location') {
    const loc = snapshot.locations.find((l) => l.id === target.id);
    if (!loc || loc.fogStatus === FogStatus.UNKNOWN) return null;
    const masked = loc.fogStatus === FogStatus.KNOWN;
    if (masked) {
      return {
        kind: 'location',
        title: '??? UNCHARTED',
        typeLabel: 'UNKNOWN LANDMARK',
        masked: true,
        eventCount: 0,
        isWaypoint: false,
        hint: 'DISCOVER TO REVEAL',
      };
    }
    const territory = loc.controllingFactionId
      ? snapshot.territories.find((t) => t.factionId === loc.controllingFactionId)
      : undefined;
    const portraitUrl =
      loc.icon ??
      (universeSlug ? `/assets/pixels/${universeSlug}/locations/${loc.id.replace(/^loc-/, '')}.svg` : undefined);
    return {
      kind: 'location',
      title: loc.name,
      typeLabel: loc.type.toUpperCase(),
      masked: false,
      danger: loc.dangerLevel,
      factionName: territory?.name,
      firstSeen: loc.firstAppearanceChapter,
      eventCount: snapshot.events.filter((e) => e.locationId === loc.id).length,
      isWaypoint: Boolean(loc.waypoint),
      portraitUrl,
      hint: 'CLICK — OPEN DOSSIER',
    };
  }

  if (target.kind === 'region') {
    const region = snapshot.regions.find((r) => r.id === target.id);
    if (!region) return null;
    return {
      kind: 'region',
      title: region.name.toUpperCase(),
      typeLabel: 'REGION',
      masked: false,
      eventCount: 0,
      isWaypoint: false,
      hint: 'CLICK — REGION CODEX',
    };
  }

  const ev = snapshot.events.find((e) => e.id === target.id);
  if (!ev) return null;
  return {
    kind: 'event',
    title: ev.name,
    typeLabel: ev.eventType.toUpperCase(),
    masked: false,
    firstSeen: ev.chapter,
    eventCount: 1,
    isWaypoint: false,
    hint: 'CLICK — VIEW EVENT',
  };
}

export function placeTooltip(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
  offset = 16
): { left: number; top: number } {
  let left = x + offset;
  let top = y + offset;
  if (left + width > viewportWidth) left = x - offset - width;
  if (top + height > viewportHeight) top = y - offset - height;
  return { left: Math.max(0, left), top: Math.max(0, top) };
}

// ---------------------------------------------------------------- waypoints

export function visibleRegionNames(def: WorldMapDefinition, userChapter: number): Record<string, string> {
  const names: Record<string, string> = {};
  for (const region of def.regions) {
    const visible =
      region.visibleFromChapter === undefined ||
      region.visibleFromChapter <= userChapter ||
      (region.revealedAtChapter !== undefined && region.revealedAtChapter <= userChapter);
    if (visible) names[region.id] = region.name;
  }
  return names;
}

export interface WaypointGroup {
  planeId: string;
  planeName: string;
  regions: Array<{ regionId: string | null; regionName: string; waypoints: ProjectedWaypoint[] }>;
}

export function groupWaypoints(
  waypoints: ProjectedWaypoint[],
  planes: ProjectedPlane[],
  regionNames: Record<string, string>
): WaypointGroup[] {
  const groups: WaypointGroup[] = [];
  for (const plane of planes) {
    const onPlane = waypoints.filter((w) => w.planeId === plane.id);
    if (onPlane.length === 0) continue;
    const byRegion = new Map<string | null, ProjectedWaypoint[]>();
    for (const wp of onPlane) {
      const key = wp.regionId && regionNames[wp.regionId] ? wp.regionId : null;
      byRegion.set(key, [...(byRegion.get(key) ?? []), wp]);
    }
    const regions = Array.from(byRegion.entries())
      .map(([regionId, list]) => ({
        regionId,
        regionName: regionId ? regionNames[regionId] : 'UNCHARTED LANDS',
        waypoints: list.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.regionName.localeCompare(b.regionName));
    groups.push({ planeId: plane.id, planeName: plane.name, regions });
  }
  return groups;
}

// ---------------------------------------------------------------- minimap

export function fogCirclesForMinimap(snapshot: ProjectedWorldMapSnapshot): Array<{ x: number; y: number; r: number }> {
  return snapshot.locations
    .filter((l) => isDiscoveredStatus(l.fogStatus))
    .map((l) => ({ x: l.x, y: l.y, r: l.importance === 'critical' ? 70 : 45 }));
}
```

- [ ] **Step 4: Implement `AtlasTooltip`**

Create `src/components/map/AtlasTooltip.tsx`:

```tsx
'use client';

import React, { useState } from 'react';
import { DANGER_COLORS } from '../../engine/map/scene/pixel-palette';
import { placeTooltip, TooltipModel } from './atlas-ui-state';

export interface AtlasTooltipProps {
  model: TooltipModel | null;
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
  accentColor: string;
}

const WIDTH = 240;
const HEIGHT = 170;

export function AtlasTooltip({ model, x, y, viewportWidth, viewportHeight, accentColor }: AtlasTooltipProps) {
  const [brokenPortrait, setBrokenPortrait] = useState<string | null>(null);
  if (!model) return null;
  const { left, top } = placeTooltip(x, y, WIDTH, HEIGHT, viewportWidth, viewportHeight);
  const showPortrait = model.portraitUrl && brokenPortrait !== model.portraitUrl;

  return (
    <div
      data-testid="atlas-tooltip"
      role="tooltip"
      className="pointer-events-none absolute z-40 w-60 border-2 bg-[#0b0a0d]/95 shadow-[0_0_0_2px_#000,0_8px_24px_rgba(0,0,0,0.7)] [image-rendering:pixelated]"
      style={{ left, top, borderColor: `${accentColor}aa` }}
    >
      <div
        className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b-2 border-black"
        style={{ background: `linear-gradient(180deg, ${accentColor}40, ${accentColor}10)` }}
      >
        <span className={`font-pixel text-[11px] leading-tight ${model.masked ? 'text-slate-400' : 'text-white'}`}>
          {model.title}
        </span>
        {model.isWaypoint && (
          <span className="font-pixel text-[8px] px-1 py-0.5 border border-cyan-400/60 text-cyan-300 bg-cyan-950/60">
            WAYPOINT
          </span>
        )}
      </div>

      <div className="flex gap-2 px-2.5 py-2">
        {showPortrait && (
          <img
            src={model.portraitUrl}
            alt=""
            width={44}
            height={44}
            className="w-11 h-11 border border-black bg-black/40 [image-rendering:pixelated]"
            onError={() => setBrokenPortrait(model.portraitUrl ?? null)}
          />
        )}
        <dl className="flex-1 space-y-1 font-mono text-[10px] text-slate-300">
          <div className="flex justify-between">
            <dt className="text-slate-500">TYPE</dt>
            <dd>{model.typeLabel}</dd>
          </div>
          {model.danger && (
            <div className="flex justify-between">
              <dt className="text-slate-500">DANGER</dt>
              <dd className="font-pixel text-[9px]" style={{ color: DANGER_COLORS[model.danger] }}>
                {model.danger}
              </dd>
            </div>
          )}
          {model.factionName && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">HELD BY</dt>
              <dd className="truncate text-right">{model.factionName}</dd>
            </div>
          )}
          {model.firstSeen !== undefined && (
            <div className="flex justify-between">
              <dt className="text-slate-500">FIRST SEEN</dt>
              <dd>CH {model.firstSeen}</dd>
            </div>
          )}
          {model.kind === 'location' && !model.masked && (
            <div className="flex justify-between">
              <dt className="text-slate-500">EVENTS</dt>
              <dd>{model.eventCount}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="px-2.5 py-1 border-t border-black/80 font-pixel text-[8px] tracking-wider" style={{ color: accentColor }}>
        {model.hint}
      </div>
    </div>
  );
}

export default AtlasTooltip;
```

- [ ] **Step 5: Implement `DiscoveryBanner`**

Create `src/components/map/DiscoveryBanner.tsx`:

```tsx
'use client';

import React, { useEffect } from 'react';
import { BANNER_DURATION_MS, BannerState } from './atlas-ui-state';

export interface DiscoveryBannerProps {
  state: BannerState | null;
  onDone: () => void;
  accentColor: string;
}

export function DiscoveryBanner({ state, onDone, accentColor }: DiscoveryBannerProps) {
  const key = state?.key;
  useEffect(() => {
    if (key === undefined) return;
    const timer = setTimeout(onDone, BANNER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [key, onDone]);

  if (!state) return null;
  const extra = state.total - 1;

  return (
    <div
      data-testid="discovery-banner"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2 text-center motion-safe:animate-[fadeIn_200ms_ease-out]"
    >
      <div
        className="border-y-2 px-10 py-2 bg-gradient-to-r from-transparent via-black/85 to-transparent"
        style={{ borderColor: `${accentColor}99` }}
      >
        <div className="font-pixel text-[10px] tracking-[0.3em]" style={{ color: accentColor }}>
          NEW AREA DISCOVERED
        </div>
        <div className="font-pixel text-base text-amber-100 drop-shadow-[0_2px_0_#000]">{state.latest}</div>
        {extra > 0 && <div className="font-mono text-[10px] text-slate-400">+{extra} MORE</div>}
      </div>
    </div>
  );
}

export default DiscoveryBanner;
```

- [ ] **Step 6: Implement `WaypointPanel`**

Create `src/components/map/WaypointPanel.tsx`:

```tsx
'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ProjectedWaypoint } from '../../projections/temporal-map';
import { WaypointGroup } from './atlas-ui-state';

export interface WaypointPanelProps {
  groups: WaypointGroup[];
  activePlaneId: string;
  onTravel: (waypoint: ProjectedWaypoint) => void;
  onClose: () => void;
  accentColor: string;
}

export function WaypointPanel({ groups, activePlaneId, onTravel, onClose, accentColor }: WaypointPanelProps) {
  return (
    <div
      data-testid="waypoint-panel"
      role="dialog"
      aria-label="Waypoints"
      className="pointer-events-auto absolute left-4 top-24 bottom-24 z-30 flex w-64 flex-col border-2 bg-[#0b0a0d]/95 shadow-[0_0_0_2px_#000]"
      style={{ borderColor: `${accentColor}aa` }}
    >
      <div className="flex items-center justify-between border-b-2 border-black px-3 py-2">
        <span className="font-pixel text-xs tracking-widest" style={{ color: accentColor }}>
          WAYPOINTS
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white"
          aria-label="Close waypoints"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {groups.length === 0 && (
          <p className="px-2 py-6 text-center font-pixel text-[10px] text-slate-500">NO WAYPOINTS DISCOVERED YET</p>
        )}
        {groups.map((group) => (
          <section key={group.planeId}>
            <h3 className="px-1 pb-1 font-pixel text-[10px] text-slate-300 border-b border-slate-800">
              {group.planeName}
              {group.planeId === activePlaneId && <span className="ml-2 text-slate-500">(HERE)</span>}
            </h3>
            {group.regions.map((region) => (
              <div key={region.regionId ?? 'none'} className="mt-1.5">
                <div className="px-1 font-mono text-[9px] uppercase text-slate-500">{region.regionName}</div>
                {region.waypoints.map((wp) => (
                  <button
                    key={wp.locationId}
                    type="button"
                    onClick={() => onTravel(wp)}
                    className="flex w-full items-center justify-between px-2 py-1 text-left font-mono text-[11px] text-slate-200 hover:bg-white/5"
                  >
                    <span className="truncate">{wp.name}</span>
                    {wp.isCurrent && <span className="font-pixel text-[8px] text-amber-300">CURRENT</span>}
                  </button>
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
      <div className="border-t border-black/80 px-3 py-1 font-mono text-[9px] text-slate-500">[M] toggle · [Esc] close</div>
    </div>
  );
}

export default WaypointPanel;
```

- [ ] **Step 7: Implement `AtlasFrame`**

Create `src/components/map/AtlasFrame.tsx`:

```tsx
'use client';

import React from 'react';

export interface AtlasFrameProps {
  accentColor: string;
  rune: string;
}

const CORNERS = [
  { key: 'tl', className: 'left-0 top-0', transform: '' },
  { key: 'tr', className: 'right-0 top-0', transform: 'scale(-1,1)' },
  { key: 'bl', className: 'left-0 bottom-0', transform: 'scale(1,-1)' },
  { key: 'br', className: 'right-0 bottom-0', transform: 'scale(-1,-1)' },
] as const;

/** Ornate iron-and-bone pixel frame with the universe rune in each corner. */
export function AtlasFrame({ accentColor, rune }: AtlasFrameProps) {
  return (
    <div data-testid="atlas-frame" className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
      <div
        className="absolute inset-0 border-[6px] border-[#16131a]"
        style={{ boxShadow: `inset 0 0 0 1px ${accentColor}66, inset 0 0 0 3px #000, inset 0 0 60px rgba(0,0,0,0.85)` }}
      />
      {CORNERS.map((corner) => (
        <div key={corner.key} className={`absolute ${corner.className} h-10 w-10`}>
          <svg viewBox="0 0 20 20" className="h-10 w-10" shapeRendering="crispEdges" style={{ transform: corner.transform }}>
            <rect x="0" y="0" width="20" height="4" fill="#16131a" />
            <rect x="0" y="0" width="4" height="20" fill="#16131a" />
            <rect x="4" y="4" width="8" height="2" fill={accentColor} opacity="0.7" />
            <rect x="4" y="4" width="2" height="8" fill={accentColor} opacity="0.7" />
            <rect x="8" y="8" width="3" height="3" fill="#d8d0bc" opacity="0.8" />
          </svg>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] opacity-80">{rune}</span>
        </div>
      ))}
    </div>
  );
}

export default AtlasFrame;
```

- [ ] **Step 8: Implement `AtlasMinimap`**

Create `src/components/map/AtlasMinimap.tsx`:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { CameraView } from '../../engine/map/pixi-world-renderer';

export interface AtlasMinimapProps {
  imageUrl: string | null;
  worldWidth: number;
  worldHeight: number;
  fogCircles: Array<{ x: number; y: number; r: number }>;
  hero: { x: number; y: number } | null;
  subscribe: (listener: (view: CameraView) => void) => () => void;
  onPan: (worldX: number, worldY: number) => void;
  accentColor: string;
  fogColor: string;
}

const WIDTH = 180;

export function AtlasMinimap({
  imageUrl,
  worldWidth,
  worldHeight,
  fogCircles,
  hero,
  subscribe,
  onPan,
  accentColor,
  fogColor,
}: AtlasMinimapProps) {
  const [view, setView] = useState<CameraView | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => subscribe(setView), [subscribe]);

  const height = Math.round((WIDTH * worldHeight) / worldWidth);
  const scale = WIDTH / worldWidth;
  const frustum = view
    ? {
        x: (view.x - view.viewWidth / 2 / view.zoom) * scale,
        y: (view.y - view.viewHeight / 2 / view.zoom) * scale,
        w: (view.viewWidth / view.zoom) * scale,
        h: (view.viewHeight / view.zoom) * scale,
      }
    : null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onPan((e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
  };

  return (
    <div
      data-testid="atlas-minimap"
      className="pointer-events-auto absolute bottom-28 right-4 z-20 border-2 bg-black shadow-[0_0_0_2px_#000]"
      style={{ borderColor: `${accentColor}88` }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="block w-full border-b border-black px-2 py-0.5 text-left font-pixel text-[8px] tracking-widest"
        style={{ color: accentColor }}
      >
        {collapsed ? '▸ RADAR' : '▾ RADAR'}
      </button>
      {!collapsed && (
        <div className="relative cursor-crosshair" style={{ width: WIDTH, height }} onClick={handleClick}>
          {imageUrl && (
            <img src={imageUrl} alt="" width={WIDTH} height={height} className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
          )}
          <svg className="absolute inset-0" width={WIDTH} height={height} viewBox={`0 0 ${worldWidth} ${worldHeight}`}>
            <defs>
              <mask id="minimap-fog-mask">
                <rect width={worldWidth} height={worldHeight} fill="white" />
                {fogCircles.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="black" />
                ))}
              </mask>
            </defs>
            <rect width={worldWidth} height={worldHeight} fill={fogColor} opacity="0.85" mask="url(#minimap-fog-mask)" />
            {hero && <rect x={hero.x - 12} y={hero.y - 12} width={24} height={24} fill="#ffb347" />}
          </svg>
          {frustum && (
            <div
              className="pointer-events-none absolute border"
              style={{ left: frustum.x, top: frustum.y, width: frustum.w, height: frustum.h, borderColor: accentColor }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default AtlasMinimap;
```

- [ ] **Step 9: Run tests, typecheck, commit**

Run: `npx vitest run tests/atlas-ui.test.ts && npx tsc --noEmit`
Expected: PASS (14 tests), clean. Tooltip placement arithmetic: `(700, 550)` with 200×100 in 800×600 → left flips to `700 − 16 − 200 = 484`, top flips to `550 − 16 − 100 = 434`.

```bash
git add src/components/map/atlas-ui-state.ts src/components/map/AtlasTooltip.tsx src/components/map/DiscoveryBanner.tsx src/components/map/WaypointPanel.tsx src/components/map/AtlasFrame.tsx src/components/map/AtlasMinimap.tsx tests/atlas-ui.test.ts
git commit -m "feat(map): add D4-style tooltip, discovery banner, waypoint panel, frame and minimap

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 21: Wire the atlas — HUD, `RpgWorldAtlas`, and `?plane=` deep links

**Files:**
- Modify: `src/components/map/atlas-ui-state.ts` (add two pure helpers)
- Modify: `src/components/map/MapHudControls.tsx`
- Rewrite: `src/components/map/RpgWorldAtlas.tsx`
- Modify: `src/app/[slug]/world-explorer.tsx`
- Test: `tests/atlas-wiring.test.ts`; keep `tests/rpg-atlas-component.test.ts` green

**Interfaces:**
- Consumes: everything from Tasks 1–20.
- Produces:
  - `planeSwitchForLocation(def: WorldMapDefinition, snapshot: ProjectedWorldMapSnapshot, locationId: string): string | null` — the location's plane id when it differs from `snapshot.planeId` **and** is revealed; otherwise `null`.
  - `type AtlasKeyAction = 'pan-up' | 'pan-down' | 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'toggle-waypoints' | 'escape'`, `keyToAtlasAction(key: string): AtlasKeyAction | null`.
  - `PlaneOption` gains `locked?: boolean`; `MapHudControlsProps` gains `onOpenWaypoints?: () => void; waypointCount?: number`.
  - `RpgWorldAtlasProps` gains `heroAvatarUrl?: string` and makes `activePlaneId` / `onSelectPlane` drive the real projection plane; the `planes` prop now only supplies descriptions.
  - `world-explorer.tsx` reads/writes `?plane=`.

- [ ] **Step 1: Write the failing test**

Create `tests/atlas-wiring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { planeSwitchForLocation, keyToAtlasAction } from '../src/components/map/atlas-ui-state';
import { MapHudControls } from '../src/components/map/MapHudControls';
import { RpgWorldAtlas } from '../src/components/map/RpgWorldAtlas';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition, MapVisibleLayers } from '../src/domain/map-types';

const def: WorldMapDefinition = {
  id: 'wiring', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
  planes: [
    { id: 'mortal', name: 'Mortal Five Regions', width: 1000, height: 1000, revealedAtChapter: 0, backdrop: 'sea', order: 0 },
    { id: 'river', name: 'River of Time', width: 800, height: 400, revealedAtChapter: 600, backdrop: 'abyss', order: 1 },
  ],
  terrain: [], regions: [], routes: [], territories: [], events: [],
  locations: [
    { id: 'village', name: 'Village', x: 100, y: 100, type: 'village', importance: 'major', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'mortal', waypoint: true },
    { id: 'lotus', name: 'Stone Lotus', x: 300, y: 200, type: 'island', importance: 'critical', firstAppearanceChapter: 600, revealedAtChapter: 600, planeId: 'river', waypoint: true },
  ],
  characterPaths: [{ characterId: 'fy', characterName: 'Fang Yuan', waypoints: [
    { chapter: 1, locationId: 'village', x: 100, y: 100 },
    { chapter: 650, locationId: 'lotus', x: 300, y: 200 },
  ] }],
};

const layers: MapVisibleLayers = {
  terrain: true, regions: true, routes: true, territories: true, markers: true,
  events: true, characterPaths: true, fogOfWar: true, labels: true,
};

describe('planeSwitchForLocation', () => {
  it('returns the revealed plane of a location on another plane', () => {
    const snap = projectTemporalMap(def, 700, { planeId: 'mortal' });
    expect(planeSwitchForLocation(def, snap, 'lotus')).toBe('river');
  });

  it('returns null for same-plane, sealed-plane or unknown locations', () => {
    expect(planeSwitchForLocation(def, projectTemporalMap(def, 700), 'village')).toBeNull();
    expect(planeSwitchForLocation(def, projectTemporalMap(def, 100), 'lotus')).toBeNull();
    expect(planeSwitchForLocation(def, projectTemporalMap(def, 700), 'nowhere')).toBeNull();
  });
});

describe('keyToAtlasAction', () => {
  it('maps WASD, arrows, zoom keys, M and Escape', () => {
    expect(keyToAtlasAction('w')).toBe('pan-up');
    expect(keyToAtlasAction('ArrowDown')).toBe('pan-down');
    expect(keyToAtlasAction('A')).toBe('pan-left');
    expect(keyToAtlasAction('ArrowRight')).toBe('pan-right');
    expect(keyToAtlasAction('+')).toBe('zoom-in');
    expect(keyToAtlasAction('=')).toBe('zoom-in');
    expect(keyToAtlasAction('-')).toBe('zoom-out');
    expect(keyToAtlasAction('m')).toBe('toggle-waypoints');
    expect(keyToAtlasAction('Escape')).toBe('escape');
    expect(keyToAtlasAction('q')).toBeNull();
  });
});

describe('MapHudControls planes and waypoints', () => {
  it('renders the waypoint button with a count', () => {
    const html = renderToStaticMarkup(React.createElement(MapHudControls, {
      mode: 'atlas', onModeChange: () => {}, visibleLayers: layers, onToggleLayer: () => {},
      onZoomIn: () => {}, onZoomOut: () => {}, onResetZoom: () => {}, onRecenter: () => {},
      onOpenWaypoints: () => {}, waypointCount: 3,
    }));
    expect(html).toContain('data-testid="waypoints-btn"');
    expect(html).toContain('WAYPOINTS');
    expect(html).toContain('3');
  });
});

describe('RpgWorldAtlas wiring', () => {
  it('renders frame, minimap and hero-elsewhere chip from the projection', () => {
    const html = renderToStaticMarkup(React.createElement(RpgWorldAtlas, {
      mapDefinition: def, userChapter: 700, totalChapters: 2334, universeSlug: 'reverend-insanity', activePlaneId: 'mortal',
    }));
    expect(html).toContain('data-testid="atlas-frame"');
    expect(html).toContain('data-testid="atlas-minimap"');
    expect(html).toContain('HERO IN RIVER OF TIME');
    expect(html).toContain('Fang Yuan');
  });

  it('never names a sealed plane', () => {
    const html = renderToStaticMarkup(React.createElement(RpgWorldAtlas, {
      mapDefinition: def, userChapter: 100, universeSlug: 'reverend-insanity',
    }));
    expect(html).not.toContain('River of Time');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/atlas-wiring.test.ts`
Expected: FAIL — `planeSwitchForLocation` is not exported.

- [ ] **Step 3: Add the pure helpers**

Append to `src/components/map/atlas-ui-state.ts` (and add `import { planeForLocation } from '../../domain/map-planes';` to its imports):

```ts
// ---------------------------------------------------------------- plane + keys

export function planeSwitchForLocation(
  def: WorldMapDefinition,
  snapshot: ProjectedWorldMapSnapshot,
  locationId: string
): string | null {
  const target = planeForLocation(def, locationId);
  if (!target || target === snapshot.planeId) return null;
  const plane = snapshot.planes.find((p) => p.id === target);
  return plane?.isRevealed ? target : null;
}

export type AtlasKeyAction =
  | 'pan-up'
  | 'pan-down'
  | 'pan-left'
  | 'pan-right'
  | 'zoom-in'
  | 'zoom-out'
  | 'toggle-waypoints'
  | 'escape';

const KEY_ACTIONS: Record<string, AtlasKeyAction> = {
  w: 'pan-up',
  arrowup: 'pan-up',
  s: 'pan-down',
  arrowdown: 'pan-down',
  a: 'pan-left',
  arrowleft: 'pan-left',
  d: 'pan-right',
  arrowright: 'pan-right',
  '+': 'zoom-in',
  '=': 'zoom-in',
  '-': 'zoom-out',
  _: 'zoom-out',
  m: 'toggle-waypoints',
  escape: 'escape',
};

export function keyToAtlasAction(key: string): AtlasKeyAction | null {
  return KEY_ACTIONS[key.toLowerCase()] ?? null;
}
```

- [ ] **Step 4: Extend `MapHudControls`**

In `src/components/map/MapHudControls.tsx`:

1. Add `MapPin` to the `lucide-react` import list.
2. Add `locked?: boolean;` to `PlaneOption`.
3. Add to `MapHudControlsProps`: `onOpenWaypoints?: () => void;` and `waypointCount?: number;`, and destructure both in the component signature.
4. Replace `handlePlaneSelect` with:

```tsx
  const handlePlaneSelect = (plane: PlaneOption) => {
    if (plane.locked) return;
    SoundEngine.playPlaneWarp();
    setShowPlaneDropdown(false);
    onPlaneChange?.(plane.id);
  };
```

5. In the plane dropdown `planes.map(...)` button, change `onClick={() => handlePlaneSelect(plane.id)}` to `onClick={() => handlePlaneSelect(plane)}`, add `disabled={plane.locked}` and `aria-disabled={plane.locked}`, and replace the inner `<span className="truncate">{plane.name}</span>` with:

```tsx
                    <span className={`truncate ${plane.locked ? 'text-slate-600' : ''}`}>
                      {plane.locked ? '??? SEALED REALM' : plane.name}
                    </span>
```

6. Directly after the closing `)}` of the plane selector block (still inside the "Center Controls" `<div className="flex items-center gap-2">`), add the waypoint button:

```tsx
        {onOpenWaypoints && (
          <button
            type="button"
            onClick={() => {
              SoundEngine.playMenuSelect();
              onOpenWaypoints();
            }}
            data-testid="waypoints-btn"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl text-slate-200 hover:text-white transition font-mono text-[11px]"
            title="Waypoints — fast travel (M)"
          >
            <MapPin className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span className="font-pixel text-[10px]">WAYPOINTS</span>
            <span className="font-mono text-[10px] text-slate-400">{waypointCount ?? 0}</span>
          </button>
        )}
```

7. Change the reset button's `title` to `"Fit plane to view"`.

- [ ] **Step 5: Rewrite `RpgWorldAtlas`**

Replace the entire contents of `src/components/map/RpgWorldAtlas.tsx` with:

```tsx
'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { WorldMapDefinition, MapMode, MapVisibleLayers } from '../../domain/map-types';
import { MapTheme, getMapTheme } from '../../domain/map-themes';
import { getUniverseTheme } from '../../domain/themes';
import {
  projectTemporalMap,
  ProjectedWaypoint,
  ProjectedWorldMapSnapshot,
} from '../../projections/temporal-map';
import { CameraView, HoverInfo, PixiWorldRenderer } from '../../engine/map/pixi-world-renderer';
import { SoundEngine } from '../../lib/sound-effects';
import { MapHudControls, PlaneOption } from './MapHudControls';
import { MapTimelineBar } from './MapTimelineBar';
import { MapLocationDrawer } from './MapLocationDrawer';
import { AtlasTooltip } from './AtlasTooltip';
import { DiscoveryBanner } from './DiscoveryBanner';
import { WaypointPanel } from './WaypointPanel';
import { AtlasFrame } from './AtlasFrame';
import { AtlasMinimap } from './AtlasMinimap';
import {
  BannerState,
  Emitter,
  bannerReducer,
  buildTooltipModel,
  createEmitter,
  fogCirclesForMinimap,
  groupWaypoints,
  keyToAtlasAction,
  planeSwitchForLocation,
  visibleRegionNames,
} from './atlas-ui-state';

export interface RpgWorldAtlasProps {
  mapDefinition: WorldMapDefinition;
  userChapter: number;
  totalChapters?: number;
  theme?: MapTheme;
  universeSlug?: string;
  onChapterChange?: (chapter: number) => void;
  onSelectLocation?: (locationId: string | null) => void;
  onSelectRegion?: (regionId: string | null) => void;
  onSelectEvent?: (eventId: string | null) => void;
  selectedLocationId?: string | null;
  activePlaneId?: string;
  /** Optional descriptions for planes; the plane list itself comes from the projection. */
  planes?: PlaneOption[];
  onSelectPlane?: (planeId: string) => void;
  initialMode?: MapMode;
  className?: string;
  activeCharacterId?: string;
  heroAvatarUrl?: string;
  onJumpToJourney?: (characterId: string) => void;
  onSelectForDuel?: (characterId: string) => void;
  onShowOnLadder?: (id?: string) => void;
  onShowInRoster?: (id?: string) => void;
}

const DEFAULT_VISIBLE_LAYERS: MapVisibleLayers = {
  terrain: true,
  regions: true,
  routes: true,
  territories: true,
  markers: true,
  events: true,
  characterPaths: true,
  fogOfWar: true,
  labels: true,
};

/**
 * Read once, synchronously: the atlas is client-only (dynamic import with
 * ssr:false), so the first render already knows the preference and the
 * renderer is never recreated because of it. Guarded for SSR tests.
 */
function readPrefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function TooltipHost({
  emitter,
  snapshotRef,
  universeSlug,
  viewport,
  accentColor,
}: {
  emitter: Emitter<HoverInfo | null>;
  snapshotRef: React.MutableRefObject<ProjectedWorldMapSnapshot>;
  universeSlug: string;
  viewport: { width: number; height: number };
  accentColor: string;
}) {
  const [info, setInfo] = useState<HoverInfo | null>(null);
  useEffect(() => emitter.subscribe(setInfo), [emitter]);
  if (!info) return null;
  const model = buildTooltipModel(snapshotRef.current, info.target, universeSlug);
  return (
    <AtlasTooltip
      model={model}
      x={info.screenX}
      y={info.screenY}
      viewportWidth={viewport.width}
      viewportHeight={viewport.height}
      accentColor={accentColor}
    />
  );
}

export function RpgWorldAtlas({
  mapDefinition,
  userChapter,
  totalChapters = 1000,
  theme: themeProp,
  universeSlug: universeSlugProp,
  onChapterChange,
  onSelectLocation: onSelectLocationProp,
  onSelectRegion: onSelectRegionProp,
  onSelectEvent: onSelectEventProp,
  selectedLocationId: selectedLocationIdProp,
  activePlaneId: activePlaneIdProp,
  planes: planeDescriptions = [],
  onSelectPlane,
  initialMode = 'atlas',
  className = '',
  activeCharacterId,
  heroAvatarUrl,
  onShowOnLadder,
  onShowInRoster,
}: RpgWorldAtlasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<PixiWorldRenderer | null>(null);
  const handledLocPropRef = useRef<string | null | undefined>(undefined);
  const pendingFlyRef = useRef<{ x: number; y: number } | null>(null);
  const minimapKeyRef = useRef<string | null>(null);

  const universeSlug = universeSlugProp || mapDefinition.universeId || 'reverend-insanity';
  const activeTheme = useMemo(() => themeProp || getMapTheme(universeSlug), [themeProp, universeSlug]);
  const rune = useMemo(() => getUniverseTheme(universeSlug).runeSymbol, [universeSlug]);
  const [reducedMotion] = useState(readPrefersReducedMotion);
  const heroAvatarRef = useRef(heroAvatarUrl);
  heroAvatarRef.current = heroAvatarUrl;

  const [mode, setMode] = useState<MapMode>(initialMode);
  const [visibleLayers, setVisibleLayers] = useState<MapVisibleLayers>(DEFAULT_VISIBLE_LAYERS);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(selectedLocationIdProp || null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [planeId, setPlaneId] = useState<string | undefined>(activePlaneIdProp);
  const [waypointsOpen, setWaypointsOpen] = useState(false);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [minimapUrl, setMinimapUrl] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 600 });

  const hoverEmitter = useMemo(() => createEmitter<HoverInfo | null>(null), []);
  const cameraEmitter = useMemo(() => createEmitter<CameraView | null>(null), []);
  const subscribeCamera = useCallback(
    (listener: (view: CameraView) => void) =>
      cameraEmitter.subscribe((view) => {
        if (view) listener(view);
      }),
    [cameraEmitter]
  );

  useEffect(() => {
    if (activePlaneIdProp !== undefined) setPlaneId(activePlaneIdProp);
  }, [activePlaneIdProp]);

  // Zero-spoiler, plane-aware snapshot bounded strictly by userChapter
  const snapshot: ProjectedWorldMapSnapshot = useMemo(
    () => projectTemporalMap(mapDefinition, userChapter, { activeCharacterId, planeId }),
    [mapDefinition, userChapter, activeCharacterId, planeId]
  );
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const themeRef = useRef(activeTheme);
  themeRef.current = activeTheme;
  const layersRef = useRef(visibleLayers);
  layersRef.current = visibleLayers;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const switchPlane = useCallback(
    (next: string) => {
      setPlaneId(next);
      onSelectPlane?.(next);
    },
    [onSelectPlane]
  );

  // A sealed/unknown requested plane falls back in the projection: report it so the URL is rewritten
  useEffect(() => {
    if (planeId !== undefined && snapshot.planeId !== planeId) switchPlane(snapshot.planeId);
  }, [planeId, snapshot.planeId, switchPlane]);

  // Selection handlers
  const handleSelectLocation = useCallback(
    (id: string | null, fly: boolean = true) => {
      // Our own selection echoes back through the prop: mark it handled
      handledLocPropRef.current = id;
      setSelectedLocationId(id);
      setSelectedRegionId(null);
      setSelectedEventId(null);
      onSelectLocationProp?.(id);
      if (id && fly && rendererRef.current) {
        const loc = snapshotRef.current.locations.find((l) => l.id === id);
        if (loc) rendererRef.current.flyTo(loc.x, loc.y, 1.8, 450);
      }
    },
    [onSelectLocationProp]
  );

  const handleSelectRegion = useCallback(
    (id: string | null) => {
      setSelectedRegionId(id);
      setSelectedLocationId(null);
      setSelectedEventId(null);
      onSelectRegionProp?.(id);
    },
    [onSelectRegionProp]
  );

  const handleSelectEvent = useCallback(
    (id: string | null) => {
      setSelectedEventId(id);
      setSelectedLocationId(null);
      setSelectedRegionId(null);
      onSelectEventProp?.(id);
    },
    [onSelectEventProp]
  );

  const handleCloseDrawer = useCallback(() => {
    setSelectedLocationId(null);
    setSelectedRegionId(null);
    setSelectedEventId(null);
    onSelectLocationProp?.(null);
    onSelectRegionProp?.(null);
    onSelectEventProp?.(null);
  }, [onSelectLocationProp, onSelectRegionProp, onSelectEventProp]);

  const handleDiscover = useCallback((ids: string[]) => {
    const names = ids
      .map((id) => snapshotRef.current.locations.find((l) => l.id === id)?.name)
      .filter((n): n is string => Boolean(n));
    setBanner((prev) => bannerReducer(prev, names));
  }, []);
  const clearBanner = useCallback(() => setBanner(null), []);

  const handlersRef = useRef({ handleSelectLocation, handleSelectRegion, handleSelectEvent, handleDiscover });
  handlersRef.current = { handleSelectLocation, handleSelectRegion, handleSelectEvent, handleDiscover };

  // Controlled selectedLocationId (e.g. ?loc= deep link, "SHOW ON MAP"):
  // switch plane if needed, then fly. Tracked with a ref that starts undefined,
  // so a deep link present on mount is handled too.
  useEffect(() => {
    if (selectedLocationIdProp === undefined || selectedLocationIdProp === handledLocPropRef.current) return;
    handledLocPropRef.current = selectedLocationIdProp;
    setSelectedLocationId(selectedLocationIdProp);
    if (!selectedLocationIdProp) return;
    const loc = mapDefinition.locations.find((l) => l.id === selectedLocationIdProp);
    if (!loc) return;
    const target = planeSwitchForLocation(mapDefinition, snapshotRef.current, selectedLocationIdProp);
    if (target) {
      pendingFlyRef.current = { x: loc.x, y: loc.y };
      switchPlane(target);
      return;
    }
    const renderer = rendererRef.current;
    const onPlane = snapshotRef.current.locations.find((l) => l.id === selectedLocationIdProp);
    if (!onPlane) return;
    if (renderer?.currentSnapshot) renderer.flyTo(onPlane.x, onPlane.y, 1.8, 450);
    else pendingFlyRef.current = { x: onPlane.x, y: onPlane.y }; // renderer not ready yet: fly after first commit
  }, [selectedLocationIdProp, mapDefinition, switchPlane]);

  // Renderer lifecycle. Pixi's destroy() calls WEBGL_lose_context, so a canvas
  // can never be reused: every renderer instance gets its own fresh canvas
  // (this also keeps React StrictMode's double mount working).
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || typeof window === 'undefined') return;
    const container = containerRef.current;
    const width = container?.clientWidth || 800;
    const height = container?.clientHeight || 600;
    setViewport({ width, height });

    const canvas = document.createElement('canvas');
    canvas.dataset.testid = 'rpg-atlas-canvas';
    canvas.className = 'w-full h-full block touch-none cursor-grab active:cursor-grabbing';
    host.appendChild(canvas);

    const renderer = new PixiWorldRenderer(canvas, {
      width,
      height,
      mode: modeRef.current,
      reducedMotion,
      heroAvatarUrl: heroAvatarRef.current,
      onSelectLocation: (id) => handlersRef.current.handleSelectLocation(id),
      onSelectRegion: (id) => handlersRef.current.handleSelectRegion(id),
      onSelectEvent: (id) => handlersRef.current.handleSelectEvent(id),
      onHover: (info) => hoverEmitter.emit(info),
      onCameraChange: (view) => cameraEmitter.emit(view),
      onDiscover: (ids) => handlersRef.current.handleDiscover(ids),
    });
    rendererRef.current = renderer;
    minimapKeyRef.current = null;
    void renderer.renderSnapshot(snapshotRef.current, themeRef.current, {
      mode: modeRef.current,
      activeLayers: layersRef.current,
    });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          if (w > 0 && h > 0) {
            renderer.resize(w, h);
            setViewport({ width: w, height: h });
          }
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver?.disconnect();
      renderer.destroy(true);
      canvas.remove();
      rendererRef.current = null;
    };
  }, [reducedMotion, hoverEmitter, cameraEmitter]);

  // Swap the hero portrait in place (no renderer recreation)
  useEffect(() => {
    rendererRef.current?.setHeroAvatar(heroAvatarUrl);
  }, [heroAvatarUrl]);

  // Diff-driven snapshot sync
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    void renderer.applySnapshot(snapshot, activeTheme, { mode, activeLayers: visibleLayers }).then(() => {
      if (renderer.currentSnapshot !== snapshot) return;
      const fly = pendingFlyRef.current;
      if (fly) {
        pendingFlyRef.current = null;
        renderer.warpTo(fly.x, fly.y, 1.8);
      }
      const key = `${snapshot.mapId}:${snapshot.planeId}:${activeTheme.slug}`;
      if (minimapKeyRef.current !== key) {
        minimapKeyRef.current = key;
        void renderer.getMinimapImage().then(setMinimapUrl);
      }
    });
  }, [snapshot, activeTheme, mode, visibleLayers]);

  // HUD handlers
  const handleModeChange = useCallback((newMode: MapMode) => {
    setMode(newMode);
    rendererRef.current?.setMode(newMode);
  }, []);

  const handleToggleLayer = useCallback((layerName: string) => {
    setVisibleLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  }, []);

  const withCamera = useCallback((fn: (r: PixiWorldRenderer) => void) => {
    const r = rendererRef.current;
    if (!r) return;
    r.camera.stopAnimation();
    fn(r);
    r.syncCameraTransform();
  }, []);

  const handleZoomIn = useCallback(() => withCamera((r) => r.camera.zoomBy(1.25)), [withCamera]);
  const handleZoomOut = useCallback(() => withCamera((r) => r.camera.zoomBy(0.8)), [withCamera]);
  const handleResetZoom = useCallback(() => withCamera((r) => r.camera.fitWorld()), [withCamera]);
  const handleRecenter = useCallback(() => {
    const pos = snapshotRef.current.currentPosition;
    if (pos) rendererRef.current?.flyTo(pos.x, pos.y, 1.5, 400);
    else rendererRef.current?.flyTo(snapshotRef.current.width / 2, snapshotRef.current.height / 2, undefined, 400);
  }, []);

  const handleTravel = useCallback(
    (wp: ProjectedWaypoint) => {
      SoundEngine.playPlaneWarp();
      setWaypointsOpen(false);
      if (wp.planeId !== snapshotRef.current.planeId) {
        pendingFlyRef.current = { x: wp.x, y: wp.y };
        switchPlane(wp.planeId);
      } else {
        rendererRef.current?.warpTo(wp.x, wp.y, 1.8);
      }
      handleSelectLocation(wp.locationId, false);
    },
    [switchPlane, handleSelectLocation]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const action = keyToAtlasAction(e.key);
      if (!action) return;
      e.preventDefault();
      if (action === 'toggle-waypoints') {
        setWaypointsOpen((open) => !open);
        return;
      }
      if (action === 'escape') {
        setWaypointsOpen(false);
        handleCloseDrawer();
        return;
      }
      withCamera((r) => {
        const step = 60 / r.camera.zoom;
        if (action === 'pan-up') r.camera.pan(0, -step);
        else if (action === 'pan-down') r.camera.pan(0, step);
        else if (action === 'pan-left') r.camera.pan(-step, 0);
        else if (action === 'pan-right') r.camera.pan(step, 0);
        else if (action === 'zoom-in') r.camera.zoomBy(1.25);
        else if (action === 'zoom-out') r.camera.zoomBy(0.8);
      });
    },
    [handleCloseDrawer, withCamera]
  );

  // Derived UI data (snapshot-only)
  const hudPlanes: PlaneOption[] = useMemo(
    () =>
      snapshot.planes.length > 1
        ? snapshot.planes.map((p) => ({
            id: p.id,
            name: p.isRevealed ? p.name : '??? SEALED REALM',
            locked: !p.isRevealed,
            description: p.isRevealed ? planeDescriptions.find((d) => d.id === p.id)?.description : undefined,
          }))
        : [],
    [snapshot.planes, planeDescriptions]
  );

  const waypointGroups = useMemo(
    () => groupWaypoints(snapshot.waypoints, snapshot.planes, visibleRegionNames(mapDefinition, userChapter)),
    [snapshot.waypoints, snapshot.planes, mapDefinition, userChapter]
  );

  const heroElsewhere = useMemo(() => {
    const hero = snapshot.heroPosition;
    if (!hero || hero.planeId === snapshot.planeId) return null;
    const plane = snapshot.planes.find((p) => p.id === hero.planeId && p.isRevealed);
    return plane ? { plane, hero } : null;
  }, [snapshot.heroPosition, snapshot.planeId, snapshot.planes]);

  const heroName =
    mapDefinition.characterPaths.find((p) => p.characterId === snapshot.activeCharacterId)?.characterName ??
    'Protagonist';

  const selectedLocation = useMemo(
    () => snapshot.locations.find((l) => l.id === selectedLocationId) || null,
    [snapshot.locations, selectedLocationId]
  );
  const selectedRegion = useMemo(
    () => snapshot.regions.find((r) => r.id === selectedRegionId) || null,
    [snapshot.regions, selectedRegionId]
  );
  const selectedEvent = useMemo(
    () => snapshot.events.find((e) => e.id === selectedEventId) || null,
    [snapshot.events, selectedEventId]
  );
  const selectedTerritory = useMemo(() => {
    if (!selectedLocation?.controllingFactionId) return null;
    return snapshot.territories.find((t) => t.factionId === selectedLocation.controllingFactionId) || null;
  }, [snapshot.territories, selectedLocation]);

  const isDrawerOpen = Boolean(selectedLocation || selectedRegion || selectedEvent);
  const accent = activeTheme.palette.primaryAccent;
  const heroPoint = snapshot.currentPosition ? { x: snapshot.currentPosition.x, y: snapshot.currentPosition.y } : null;

  return (
    <div
      ref={containerRef}
      data-testid="rpg-world-atlas-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${snapshot.planes.find((p) => p.id === snapshot.planeId)?.name ?? 'World'} atlas at chapter ${userChapter}`}
      className={`relative w-full h-[650px] lg:h-[750px] bg-[#040814] overflow-hidden rounded-2xl border-2 border-slate-800 shadow-2xl select-none outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${className}`}
      style={{ boxShadow: `0 0 35px ${accent}15` }}
    >
      {/* The renderer effect mounts a fresh <canvas data-testid="rpg-atlas-canvas"> in here */}
      <div ref={canvasHostRef} data-testid="rpg-atlas-canvas-host" className="absolute inset-0" />

      {/* CRT scanlines + gothic vignette */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-30 z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,4,10,0.85)_100%)] z-10"
        aria-hidden="true"
      />

      <AtlasFrame accentColor={accent} rune={rune} />

      <TooltipHost
        emitter={hoverEmitter}
        snapshotRef={snapshotRef}
        universeSlug={universeSlug}
        viewport={viewport}
        accentColor={accent}
      />

      <DiscoveryBanner state={banner} onDone={clearBanner} accentColor={accent} />

      <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start pointer-events-none">
        <MapHudControls
          mode={mode}
          onModeChange={handleModeChange}
          visibleLayers={visibleLayers}
          onToggleLayer={handleToggleLayer}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onRecenter={handleRecenter}
          planes={hudPlanes}
          activePlaneId={snapshot.planeId}
          onPlaneChange={switchPlane}
          onOpenWaypoints={() => setWaypointsOpen((open) => !open)}
          waypointCount={snapshot.waypoints.length}
          accentColor={accent}
          className="w-full max-w-4xl mx-auto shadow-2xl"
        />
      </div>

      {heroElsewhere && (
        <button
          type="button"
          onClick={() => {
            SoundEngine.playPlaneWarp();
            pendingFlyRef.current = { x: heroElsewhere.hero.x, y: heroElsewhere.hero.y };
            switchPlane(heroElsewhere.plane.id);
          }}
          className="absolute left-1/2 top-[88px] z-30 -translate-x-1/2 flex items-center gap-1.5 border px-3 py-1 bg-black/80 font-pixel text-[9px] tracking-wider text-amber-200 hover:bg-black"
          style={{ borderColor: `${accent}88` }}
        >
          <MapPin className="w-3 h-3" />
          HERO IN {heroElsewhere.plane.name.toUpperCase()}
        </button>
      )}

      {waypointsOpen && (
        <WaypointPanel
          groups={waypointGroups}
          activePlaneId={snapshot.planeId}
          onTravel={handleTravel}
          onClose={() => setWaypointsOpen(false)}
          accentColor={accent}
        />
      )}

      <AtlasMinimap
        imageUrl={minimapUrl}
        worldWidth={snapshot.width}
        worldHeight={snapshot.height}
        fogCircles={visibleLayers.fogOfWar ? fogCirclesForMinimap(snapshot) : []}
        hero={heroPoint}
        subscribe={subscribeCamera}
        onPan={(x, y) => rendererRef.current?.flyTo(x, y, undefined, 250)}
        accentColor={accent}
        fogColor={activeTheme.fogStyle.color ?? '#020705'}
      />

      {isDrawerOpen && (
        <div className="absolute top-4 right-4 bottom-24 z-40 flex">
          <MapLocationDrawer
            location={selectedLocation}
            region={selectedRegion}
            event={selectedEvent}
            territory={selectedTerritory}
            userChapter={userChapter}
            universeSlug={universeSlug}
            onClose={handleCloseDrawer}
            onShowOnLadder={onShowOnLadder}
            onShowInRoster={onShowInRoster}
            onFlyToLocation={(x, y) => rendererRef.current?.flyTo(x, y, 1.8, 400)}
            allEvents={snapshot.events}
            characterPaths={snapshot.characterPaths}
            accentColor={accent}
          />
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-none">
        <MapTimelineBar
          currentChapter={userChapter}
          totalChapters={totalChapters}
          onChapterChange={onChapterChange || (() => {})}
          events={snapshot.events}
          activeCharacterName={heroName}
          accentColor={accent}
          className="w-full max-w-4xl mx-auto shadow-2xl"
        />
      </div>
    </div>
  );
}

export default RpgWorldAtlas;
```

Notes for the implementer:
- `onJumpToJourney` / `onSelectForDuel` stay in the props interface (the explorer passes them) but are unused here, as before this change.
- `AtlasMinimap` receives an empty `fogCircles` list when the fog layer is toggled off, so the radar mirrors the map.

- [ ] **Step 6: Deep-link the plane in `world-explorer.tsx`**

In `src/app/[slug]/world-explorer.tsx`:

1. Next to `const [selectedLocationId, setSelectedLocationId] = ...`, add:

```tsx
  const [selectedPlaneId, setSelectedPlaneId] = useState<string | undefined>(undefined);
```

2. In the URL hydration effect, after `const locParam = params.get('loc');` add `const planeParam = params.get('plane');` and before `setHasInitializedUrl(true);` add:

```tsx
    if (planeParam) {
      setSelectedPlaneId(planeParam);
    }
```

(The projection validates it: a sealed or unknown plane falls back to the first plane and `RpgWorldAtlas` reports the fallback through `onSelectPlane`, which rewrites the URL.)

3. In the URL sync effect, after the `loc` block add:

```tsx
    if (selectedPlaneId) {
      params.set('plane', selectedPlaneId);
    }
```

and add `selectedPlaneId` to that effect's dependency array.

4. Add a hero avatar memo near `mapPlanes`:

```tsx
  const heroAvatarUrl = useMemo(() => {
    const entity = graph.entities[selectedCharacterId];
    return entity && entity.type === 'character' ? (entity as CharacterEntity).avatar_url : undefined;
  }, [graph.entities, selectedCharacterId]);
```

(`selectedCharacterId` is declared later in the component; place this memo **after** the `useState` that declares `selectedCharacterId`.)

5. On the `<RpgWorldAtlas ... />` element add:

```tsx
              activePlaneId={selectedPlaneId}
              onSelectPlane={setSelectedPlaneId}
              heroAvatarUrl={heroAvatarUrl}
```

- [ ] **Step 7: Update the existing atlas markup assertions**

The canvas is now created per renderer instance at runtime, so server markup contains the canvas host instead. In `tests/rpg-atlas-component.test.ts`:
- in `renders full atlas layout with canvas, HUD controls, scanlines and timeline bar`, replace
  `expect(html).toContain('<canvas');` and `expect(html).toContain('data-testid="rpg-atlas-canvas"');`
  with `expect(html).toContain('data-testid="rpg-atlas-canvas-host"');`
- in `accepts custom theme and initial mode`, replace `expect(html).toContain('<canvas');` with `expect(html).toContain('data-testid="rpg-atlas-canvas-host"');`

- [ ] **Step 8: Run tests**

Run: `npx vitest run tests/atlas-wiring.test.ts tests/rpg-atlas-component.test.ts && npm test`
Expected: PASS. In `rpg-atlas-component.test.ts`, the mock has no `planes`, so the HUD shows no plane selector (single implicit plane) — if the existing test `renders cosmological plane options when provided` renders `MapHudControls` directly with a `planes` prop it still passes because `MapHudControls` is unchanged for non-locked planes. The `'Fang Yuan'` timeline assertion passes via the `characterPaths` lookup.

- [ ] **Step 9: Typecheck and build**

Run: `npx tsc --noEmit && npm run build`
Expected: clean typecheck; Next build succeeds.

- [ ] **Step 10: Browser smoke check of every WebGL path (before any more data work)**

Headless tests never exercise the baked texture, the fog render target and shader, the bitmap font, avatar loading or the minimap image. Check them now:

1. Start `npm run dev` in the background.
2. With Claude in Chrome (load the tools in one ToolSearch call as the harness instructs; open a new tab), go to `http://localhost:3000/coiling-dragon?ch=150&tab=map`.
3. `read_console_messages` with pattern `error|Error|WebGL|shader|GLSL` — must be empty. A shader compile error names the GLSL line; fix it in `fog-material.ts`.
4. Screenshot: baked terrain with pixel glyphs is visible (not a black rectangle), fog is visibly dithered, Silkscreen labels render, the hero token shows the avatar (or the pixel core fallback), and the RADAR minimap shows the plane image.
5. Drag-pan slowly and zoom in and out: the fog dither pattern must move **with** the map (world-anchored), not shimmer in place on the screen.
6. Reload the page twice in dev mode (React StrictMode double-mounts effects): the map must appear on both loads, never blank.
7. Load `http://localhost:3000/reverend-insanity?ch=1400&tab=map&loc=loc-stone-lotus-island` (the Reverend Insanity data is still the pre-Task-22 single canvas; this checks that the `?loc=` fly-on-mount works): the camera flies to the location and its dossier opens.

Fix every defect with a failing test first where testable, re-run Steps 8–9, then continue.

- [ ] **Step 11: Commit**

```bash
git add src/components/map/atlas-ui-state.ts src/components/map/MapHudControls.tsx src/components/map/RpgWorldAtlas.tsx "src/app/[slug]/world-explorer.tsx" tests/atlas-wiring.test.ts tests/rpg-atlas-component.test.ts
git commit -m "feat(map): wire retained atlas with planes, waypoints, tooltip, banner and plane deep links

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 22: Re-author the Reverend Insanity map (3 organic planes)

**Files:**
- Create: `scripts/author-reverend-insanity-map.ts`
- Regenerate: `data/reverend-insanity/map.json`
- Modify: `tests/reverend-insanity.test.ts` (append tests)

**Interfaces:**
- Consumes: `chaikinSmooth`, `Vec2` (Task 5); `validateWorldMap` (Task 1); `projectTemporalMap` (Task 2).
- Produces: `data/reverend-insanity/map.json` with `planes` = `plane-mortal-five-regions` (1600×1100, sea), `plane-two-heavens` (1400×800, sky, revealed ch 400), `plane-river-of-time` (1400×700, abyss, revealed ch 600); every location has `planeId`, `dangerLevel`, `waypoint`; 6 landmark glyphs; regional walls as cliff-edged mountain ranges. Existing ids, names, descriptions, chapters, events, factions and notes are preserved. The script is idempotent (placements come from tables keyed by id, never from previous coordinates).

- [ ] **Step 1: Write the failing tests**

Append inside the top-level `describe` of `tests/reverend-insanity.test.ts` (add `import { projectTemporalMap } from '../src/projections/temporal-map';` at the top if not already imported):

```ts
  it('defines three organic planes with every location placed on a declared plane', () => {
    const mapData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8'));
    expect(mapData.planes.map((p: { id: string }) => p.id)).toEqual([
      'plane-mortal-five-regions',
      'plane-two-heavens',
      'plane-river-of-time',
    ]);
    const planeIds = new Set(mapData.planes.map((p: { id: string }) => p.id));
    for (const loc of mapData.locations) {
      expect(planeIds.has(loc.planeId), loc.id).toBe(true);
      expect(['EX', 'S', 'A', 'B', 'Safe']).toContain(loc.dangerLevel);
    }
    expect(mapData.locations.find((l: { id: string }) => l.id === 'loc-stone-lotus-island').planeId).toBe('plane-river-of-time');
    expect(mapData.locations.find((l: { id: string }) => l.id === 'loc-river-of-time').planeId).toBe('plane-river-of-time');

    for (const id of ['terrain-southern-border', 'terrain-central-continent', 'terrain-northern-plains', 'terrain-western-desert', 'terrain-eastern-sea']) {
      const terrain = mapData.terrain.find((t: { id: string }) => t.id === id);
      expect(terrain.polygon.length, id).toBeGreaterThanOrEqual(60);
    }
    expect(mapData.terrain.filter((t: { edgeStyle?: string }) => t.edgeStyle === 'cliff').length).toBeGreaterThanOrEqual(4);
    expect(mapData.locations.filter((l: { waypoint?: boolean }) => l.waypoint).length).toBeGreaterThanOrEqual(8);
    expect(mapData.landmarkGlyphs.length).toBeGreaterThanOrEqual(6);
    expect(() => validateWorldMap(mapData)).not.toThrow();
  });

  it('keeps the protagonist journey chapters and snaps waypoints to their locations', () => {
    const mapData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8'));
    const path0 = mapData.characterPaths[0];
    expect(path0.waypoints.map((w: { chapter: number }) => w.chapter)).toEqual([1, 210, 260, 350, 410, 540, 650, 1020, 1285, 1960, 2210]);
    for (const wp of path0.waypoints) {
      const loc = mapData.locations.find((l: { id: string }) => l.id === wp.locationId);
      expect([wp.x, wp.y, wp.planeId]).toEqual([loc.x, loc.y, loc.planeId]);
    }
  });

  it('reveals landmark glyphs only from their canonical chapter', () => {
    const mapData = validateWorldMap(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8')));
    const ids = (ch: number) => projectTemporalMap(mapData, ch).landmarkGlyphs.map((g) => g.id);
    expect(ids(949)).not.toContain('lg-yi-tian-spire');
    expect(ids(950)).toContain('lg-yi-tian-spire');
    expect(ids(1)).toEqual([]);
  });

  it('keeps the River of Time plane sealed until chapter 600', () => {
    const mapData = validateWorldMap(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8')));
    const early = projectTemporalMap(mapData, 599, { planeId: 'plane-river-of-time' });
    expect(early.planeId).toBe('plane-mortal-five-regions');
    const late = projectTemporalMap(mapData, 600, { planeId: 'plane-river-of-time' });
    expect(late.planeId).toBe('plane-river-of-time');
    expect(late.locations.map((l) => l.id)).toContain('loc-river-of-time');
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/reverend-insanity.test.ts`
Expected: FAIL — `Cannot read properties of undefined (reading 'map')` (no `planes` yet).

- [ ] **Step 3: Write the authoring script**

Create `scripts/author-reverend-insanity-map.ts`:

```ts
/**
 * Authoring script for the Reverend Insanity pixel-gothic atlas.
 *
 * Hand-placed control points are smoothed with Chaikin corner cutting into
 * organic polygons and written to data/reverend-insanity/map.json.
 * Placements are keyed by id, so the script is idempotent.
 *
 * Run: npx tsx scripts/author-reverend-insanity-map.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { chaikinSmooth, Vec2 } from '../src/engine/map/scene/geometry';
import { validateWorldMap } from '../src/domain/map-schema';
import {
  CharacterPath,
  DangerLevel,
  FactionTerritory,
  LandmarkGlyph,
  MapLocation,
  MapPlane,
  MapRegion,
  MapRoute,
  TerrainLayer,
  WorldMapDefinition,
} from '../src/domain/map-types';

const MAP_PATH = path.resolve(__dirname, '../data/reverend-insanity/map.json');
const MORTAL = 'plane-mortal-five-regions';
const HEAVENS = 'plane-two-heavens';
const RIVER = 'plane-river-of-time';

type Pt = [number, number];

const round = (v: number) => Math.round(v * 10) / 10;
const smooth = (points: Vec2[], iterations = 3): Pt[] =>
  chaikinSmooth(points, iterations).map(([x, y]) => [round(x), round(y)]);

/** Irregular closed blob around a center. `wobble` values scale each spoke. */
function blob(cx: number, cy: number, rx: number, ry: number, wobble: number[]): Vec2[] {
  return wobble.map((w, i) => {
    const a = (i / wobble.length) * Math.PI * 2;
    return [cx + Math.cos(a) * rx * (1 + w), cy + Math.sin(a) * ry * (1 + w)];
  });
}

/** Closed band polygon around an open centerline (for rivers). */
function ribbon(centerline: Vec2[], halfWidth: number): Vec2[] {
  const smoothLine = chaikinSmooth(centerline, 3, false);
  const upper: Vec2[] = [];
  const lower: Vec2[] = [];
  for (let i = 0; i < smoothLine.length; i++) {
    const [x, y] = smoothLine[i];
    const [px, py] = smoothLine[Math.max(0, i - 1)];
    const [nx, ny] = smoothLine[Math.min(smoothLine.length - 1, i + 1)];
    const dx = nx - px;
    const dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * halfWidth;
    const oy = (dx / len) * halfWidth;
    upper.push([x + ox, y + oy]);
    lower.push([x - ox, y - oy]);
  }
  return [...upper, ...lower.reverse()];
}

function octagon(cx: number, cy: number, r: number): Pt[] {
  return Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return [round(cx + Math.cos(a) * r), round(cy + Math.sin(a) * r)] as Pt;
  });
}

// ---------------------------------------------------------------- planes

const planes: MapPlane[] = [
  { id: MORTAL, name: 'Mortal Five Regions', width: 1600, height: 1100, revealedAtChapter: 0, backdrop: 'sea', order: 0 },
  { id: HEAVENS, name: 'Immemorial Two Heavens', width: 1400, height: 800, revealedAtChapter: 400, backdrop: 'sky', order: 1 },
  { id: RIVER, name: 'Cosmic River of Time', width: 1400, height: 700, revealedAtChapter: 600, backdrop: 'abyss', order: 2 },
];

// ---------------------------------------------------------------- mortal control points

const NORTHERN: Vec2[] = [[300, 90], [520, 60], [760, 80], [980, 70], [1180, 110], [1260, 200], [1240, 300], [1100, 330], [900, 345], [700, 340], [520, 350], [380, 330], [290, 260], [260, 170]];
const WESTERN: Vec2[] = [[90, 330], [230, 300], [380, 330], [430, 420], [440, 560], [420, 700], [360, 780], [220, 800], [110, 740], [70, 600], [60, 460]];
const CENTRAL: Vec2[] = [[440, 370], [700, 350], [900, 360], [1080, 350], [1130, 420], [1140, 560], [1110, 700], [980, 760], [760, 770], [560, 760], [450, 690], [440, 540]];
const SOUTHERN: Vec2[] = [[330, 800], [460, 770], [620, 790], [800, 790], [980, 780], [1100, 760], [1130, 860], [1080, 960], [920, 1030], [700, 1050], [480, 1030], [330, 970], [280, 880]];
const EASTERN_SEA: Vec2[] = [[1180, 90], [1540, 70], [1560, 1060], [1140, 1060], [1150, 900], [1190, 760], [1210, 560], [1190, 380], [1280, 300], [1300, 180]];

const NORTH_WALL: Vec2[] = [[420, 335], [700, 322], [1000, 328], [1130, 340], [1130, 374], [1000, 362], [700, 358], [420, 370]];
const WEST_WALL: Vec2[] = [[412, 385], [455, 385], [462, 560], [452, 745], [412, 745], [404, 560]];
const SOUTH_WALL: Vec2[] = [[455, 748], [760, 758], [1110, 742], [1110, 778], [760, 794], [455, 784]];
const EAST_WALL: Vec2[] = [[1105, 385], [1150, 385], [1168, 560], [1140, 745], [1098, 745], [1122, 560]];

const KARST_WEST: Vec2[] = [[360, 840], [520, 820], [560, 880], [480, 930], [380, 910]];
const KARST_EAST: Vec2[] = [[820, 850], [980, 830], [1040, 900], [900, 960], [800, 920]];

const ISLANDS: Array<{ id: string; name: string; points: Vec2[] }> = [
  { id: 'terrain-island-azure', name: 'Azure Archipelago', points: blob(1320, 400, 34, 24, [0.1, -0.2, 0.15, 0, -0.1, 0.2, -0.05, 0.1]) },
  { id: 'terrain-island-coral', name: 'Coral Sovereign Isle', points: blob(1430, 640, 44, 30, [0, 0.2, -0.1, 0.1, -0.2, 0.05, 0.15, -0.1]) },
  { id: 'terrain-island-mist', name: 'Mistveil Reef', points: blob(1350, 860, 30, 22, [0.15, -0.1, 0, 0.2, -0.15, 0.1, 0, -0.05]) },
];

// ---------------------------------------------------------------- heavens + river control points

const WHITE_HEAVEN = [
  blob(300, 300, 120, 70, [0.1, -0.15, 0.2, 0, -0.1, 0.15, -0.2, 0.05, 0.1, -0.05]),
  blob(480, 470, 90, 55, [0, 0.15, -0.1, 0.2, -0.15, 0.05, 0.1, -0.05]),
  blob(220, 560, 70, 40, [0.2, -0.1, 0.05, 0.1, -0.2, 0, 0.15, -0.1]),
];
const BLACK_HEAVEN = [
  blob(1000, 300, 120, 70, [-0.1, 0.2, 0, -0.15, 0.1, 0.05, -0.2, 0.15, 0, -0.05]),
  blob(1150, 500, 90, 55, [0.1, 0, -0.2, 0.15, -0.05, 0.2, -0.1, 0.05]),
  blob(900, 560, 70, 45, [-0.15, 0.1, 0.2, -0.05, 0, 0.15, -0.1, 0.05]),
];

const RIVER_BAND = ribbon([[60, 350], [250, 250], [450, 420], [650, 300], [850, 420], [1050, 280], [1340, 360]], 45);
const STONE_LOTUS = blob(980, 330, 40, 26, [0.1, -0.1, 0.2, 0, -0.15, 0.1, 0.05, -0.05]);

// ---------------------------------------------------------------- terrain

const terrain: TerrainLayer[] = [
  { id: 'terrain-eastern-sea', type: 'ocean', name: 'Eastern Sea Infinite Waters', polygon: smooth(EASTERN_SEA, 3), elevation: 0, edgeStyle: 'soft', planeId: MORTAL },
  { id: 'terrain-northern-plains', type: 'plains', name: 'Northern Plains Grassland Expanses', polygon: smooth(NORTHERN), elevation: 1, edgeStyle: 'coast', planeId: MORTAL },
  { id: 'terrain-western-desert', type: 'desert', name: 'Western Desert Endless Dunes', polygon: smooth(WESTERN, 3), elevation: 1, edgeStyle: 'coast', planeId: MORTAL },
  { id: 'terrain-central-continent', type: 'plains', name: 'Central Continent Vast Basin', polygon: smooth(CENTRAL, 3), elevation: 2, edgeStyle: 'coast', planeId: MORTAL },
  { id: 'terrain-southern-border', type: 'forest', name: 'Southern Border Karst Jungles', polygon: smooth(SOUTHERN, 3), elevation: 1, edgeStyle: 'coast', planeId: MORTAL },
  { id: 'terrain-karst-west', type: 'mountain', name: 'Qing Mao Karst Spires', polygon: smooth(KARST_WEST, 2), elevation: 2, edgeStyle: 'soft', planeId: MORTAL },
  { id: 'terrain-karst-east', type: 'mountain', name: 'Yi Tian Karst Spires', polygon: smooth(KARST_EAST, 2), elevation: 2, edgeStyle: 'soft', planeId: MORTAL },
  { id: 'terrain-wall-north', type: 'mountain', name: 'Northern Regional Wall', polygon: smooth(NORTH_WALL, 2), elevation: 3, edgeStyle: 'cliff', planeId: MORTAL },
  { id: 'terrain-wall-west', type: 'mountain', name: 'Western Regional Wall', polygon: smooth(WEST_WALL, 2), elevation: 3, edgeStyle: 'cliff', planeId: MORTAL },
  { id: 'terrain-wall-south', type: 'mountain', name: 'Southern Regional Wall', polygon: smooth(SOUTH_WALL, 2), elevation: 3, edgeStyle: 'cliff', planeId: MORTAL },
  { id: 'terrain-wall-east', type: 'mountain', name: 'Eastern Regional Wall', polygon: smooth(EAST_WALL, 2), elevation: 3, edgeStyle: 'cliff', planeId: MORTAL },
  ...ISLANDS.map((isle) => ({ id: isle.id, type: 'forest' as const, name: isle.name, polygon: smooth(isle.points, 2), elevation: 1, edgeStyle: 'coast' as const, planeId: MORTAL })),
  ...WHITE_HEAVEN.map((points, i) => ({ id: `terrain-white-heaven-${i + 1}`, type: 'ice' as const, name: 'White Heaven Isle', polygon: smooth(points, 2), elevation: 2, edgeStyle: 'cliff' as const, planeId: HEAVENS })),
  ...BLACK_HEAVEN.map((points, i) => ({ id: `terrain-black-heaven-${i + 1}`, type: 'void' as const, name: 'Black Heaven Isle', polygon: smooth(points, 2), elevation: 2, edgeStyle: 'cliff' as const, planeId: HEAVENS })),
  { id: 'terrain-river-of-time', type: 'river', name: 'Cosmic River of Time Temporal Flow', polygon: smooth(RIVER_BAND, 1), elevation: 0, edgeStyle: 'coast', planeId: RIVER },
  { id: 'terrain-stone-lotus', type: 'forest', name: 'Stone Lotus Islands', polygon: smooth(STONE_LOTUS, 2), elevation: 1, edgeStyle: 'coast', planeId: RIVER },
];

// ---------------------------------------------------------------- regions (keep metadata, replace geometry)

const REGION_SHAPES: Record<string, { planeId: string; geometry: MapRegion['geometry'] }> = {
  'region-eastern-sea': { planeId: MORTAL, geometry: { type: 'Polygon', coordinates: [smooth(EASTERN_SEA, 3)] } },
  'region-northern-plains': { planeId: MORTAL, geometry: { type: 'Polygon', coordinates: [smooth(NORTHERN)] } },
  'region-western-desert': { planeId: MORTAL, geometry: { type: 'Polygon', coordinates: [smooth(WESTERN, 3)] } },
  'region-central-continent': { planeId: MORTAL, geometry: { type: 'Polygon', coordinates: [smooth(CENTRAL, 3)] } },
  'region-southern-border': { planeId: MORTAL, geometry: { type: 'Polygon', coordinates: [smooth(SOUTHERN, 3)] } },
  'region-two-heavens': {
    planeId: HEAVENS,
    geometry: { type: 'MultiPolygon', coordinates: [[smooth(WHITE_HEAVEN[0], 2)], [smooth(BLACK_HEAVEN[0], 2)]] },
  },
  'region-river-of-time': { planeId: RIVER, geometry: { type: 'Polygon', coordinates: [smooth(RIVER_BAND, 1)] } },
};

// Order matters for picking: the sea first so land regions win overlaps
const REGION_ORDER = [
  'region-eastern-sea',
  'region-northern-plains',
  'region-western-desert',
  'region-central-continent',
  'region-southern-border',
  'region-two-heavens',
  'region-river-of-time',
];

// ---------------------------------------------------------------- locations

const PLACEMENTS: Record<string, { x: number; y: number; planeId: string; waypoint: boolean; dangerLevel: DangerLevel }> = {
  'loc-qing-mao-mountain': { x: 420, y: 870, planeId: MORTAL, waypoint: true, dangerLevel: 'B' },
  'loc-gu-yue-village': { x: 452, y: 902, planeId: MORTAL, waypoint: false, dangerLevel: 'Safe' },
  'loc-bai-gu-mountain': { x: 525, y: 905, planeId: MORTAL, waypoint: false, dangerLevel: 'B' },
  'loc-shang-city': { x: 640, y: 930, planeId: MORTAL, waypoint: true, dangerLevel: 'Safe' },
  'loc-san-cha-mountain': { x: 770, y: 885, planeId: MORTAL, waypoint: false, dangerLevel: 'A' },
  'loc-yi-tian-mountain': { x: 905, y: 905, planeId: MORTAL, waypoint: false, dangerLevel: 'S' },
  'loc-wu-mountain': { x: 1010, y: 970, planeId: MORTAL, waypoint: true, dangerLevel: 'A' },
  'loc-crescent-lake': { x: 560, y: 220, planeId: MORTAL, waypoint: false, dangerLevel: 'B' },
  'loc-eighty-eight-true-yang': { x: 760, y: 150, planeId: MORTAL, waypoint: false, dangerLevel: 'A' },
  'loc-imperial-court-blessed-land': { x: 805, y: 200, planeId: MORTAL, waypoint: true, dangerLevel: 'A' },
  'loc-lang-ya-blessed-land': { x: 960, y: 240, planeId: MORTAL, waypoint: true, dangerLevel: 'B' },
  'loc-crazed-demon-cave': { x: 680, y: 105, planeId: MORTAL, waypoint: false, dangerLevel: 'EX' },
  'loc-reverse-flow-river': { x: 430, y: 255, planeId: MORTAL, waypoint: false, dangerLevel: 'EX' },
  'loc-heavenly-court': { x: 790, y: 520, planeId: MORTAL, waypoint: true, dangerLevel: 'S' },
  'loc-hu-immortal-blessed-land': { x: 930, y: 640, planeId: MORTAL, waypoint: true, dangerLevel: 'B' },
  'loc-spirit-affinity-house': { x: 600, y: 620, planeId: MORTAL, waypoint: true, dangerLevel: 'B' },
  'loc-river-of-time': { x: 470, y: 400, planeId: RIVER, waypoint: true, dangerLevel: 'EX' },
  'loc-stone-lotus-island': { x: 980, y: 330, planeId: RIVER, waypoint: true, dangerLevel: 'A' },
};

// ---------------------------------------------------------------- landmark glyphs

const landmarkGlyphs: LandmarkGlyph[] = [
  { id: 'lg-crazed-demon-maw', glyph: 'skull-rock', x: 705, y: 95, planeId: MORTAL, revealedAtChapter: 1200, name: 'Crazed Demon Cave Maw' },
  { id: 'lg-yi-tian-spire', glyph: 'spire', x: 930, y: 885, planeId: MORTAL, revealedAtChapter: 950, name: 'Yi Tian Mountain Spire' },
  { id: 'lg-heavenly-court-citadel', glyph: 'citadel', x: 820, y: 500, planeId: MORTAL, revealedAtChapter: 700, name: 'Heavenly Court Citadel' },
  { id: 'lg-reverse-flow-arch', glyph: 'portal-arch', x: 405, y: 240, planeId: MORTAL, revealedAtChapter: 1280, name: 'Reverse Flow River Source' },
  { id: 'lg-eighty-eight-ruins', glyph: 'ruin', x: 735, y: 140, planeId: MORTAL, revealedAtChapter: 640, name: 'Ruins of Eighty-Eight True Yang' },
  { id: 'lg-san-cha-monolith', glyph: 'monolith', x: 795, y: 870, planeId: MORTAL, revealedAtChapter: 350, name: 'Three Kings Inheritance Monolith' },
];

// ---------------------------------------------------------------- territories

const TERRITORY_MEMBERS: Record<string, string[]> = {
  'faction-gu-yue': ['loc-qing-mao-mountain', 'loc-gu-yue-village'],
  'faction-shang': ['loc-shang-city'],
  'faction-wu': ['loc-wu-mountain'],
  'faction-heavenly-court': ['loc-heavenly-court'],
  'faction-longevity-heaven': ['loc-imperial-court-blessed-land', 'loc-eighty-eight-true-yang'],
};

// ---------------------------------------------------------------- build

function main(): void {
  const existing = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8')) as WorldMapDefinition;

  const locations: MapLocation[] = existing.locations.map((loc) => {
    const placement = PLACEMENTS[loc.id];
    if (!placement) throw new Error(`No placement for location ${loc.id}`);
    return { ...loc, ...placement };
  });
  const byId = new Map(locations.map((l) => [l.id, l]));
  const at = (id: string): Pt => {
    const loc = byId.get(id);
    if (!loc) throw new Error(`Unknown location ${id}`);
    return [loc.x, loc.y];
  };

  const regions: MapRegion[] = REGION_ORDER.map((id) => {
    const source = existing.regions.find((r) => r.id === id);
    if (!source) throw new Error(`Missing region ${id} in existing map.json`);
    const shape = REGION_SHAPES[id];
    return { ...source, geometry: shape.geometry, planeId: shape.planeId };
  });

  const routeShapes: Record<string, { points: Pt[]; planeId: string }> = {
    'route-southern-caravan': { planeId: MORTAL, points: [at('loc-qing-mao-mountain'), at('loc-bai-gu-mountain'), at('loc-shang-city')] },
    'route-three-kings-conquest': { planeId: MORTAL, points: [at('loc-shang-city'), [700, 915], at('loc-san-cha-mountain')] },
    'route-plains-conquest': { planeId: MORTAL, points: [at('loc-crescent-lake'), [660, 190], at('loc-eighty-eight-true-yang')] },
    'route-temporal-reversal': { planeId: RIVER, points: [at('loc-river-of-time'), [730, 370], at('loc-stone-lotus-island')] },
  };
  const routes: MapRoute[] = existing.routes.map((route) => {
    const shape = routeShapes[route.id];
    if (!shape) throw new Error(`No shape for route ${route.id}`);
    return { ...route, points: shape.points, planeId: shape.planeId };
  });

  const territories: FactionTerritory[] = existing.territories.map((territory) => {
    const members = TERRITORY_MEMBERS[territory.factionId];
    if (!members) throw new Error(`No members for territory ${territory.factionId}`);
    const pts = members.map(at);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const spread = Math.max(0, ...pts.map(([x, y]) => Math.hypot(x - cx, y - cy)));
    return { ...territory, boundary: octagon(cx, cy, spread + 45), planeId: MORTAL };
  });

  const characterPaths: CharacterPath[] = existing.characterPaths.map((cp) => ({
    ...cp,
    waypoints: cp.waypoints.map((wp) => {
      const loc = wp.locationId ? byId.get(wp.locationId) : undefined;
      if (!loc) throw new Error(`Waypoint at chapter ${wp.chapter} has no known location`);
      return { ...wp, x: loc.x, y: loc.y, planeId: loc.planeId };
    }),
  }));

  const def: WorldMapDefinition = {
    ...existing,
    width: 1600,
    height: 1100,
    planes,
    terrain,
    regions,
    locations,
    routes,
    territories,
    characterPaths,
    landmarkGlyphs,
  };

  validateWorldMap(def);
  fs.writeFileSync(MAP_PATH, `${JSON.stringify(def, null, 2)}\n`);
  console.log(
    `Wrote ${MAP_PATH}: ${planes.length} planes, ${terrain.length} terrain layers, ${locations.length} locations, ${landmarkGlyphs.length} landmark glyphs`
  );
}

main();
```

- [ ] **Step 4: Run the script**

Run: `npx tsx scripts/author-reverend-insanity-map.ts`
Expected: `Wrote …/map.json: 3 planes, 22 terrain layers, 18 locations, 6 landmark glyphs`. If it throws `No placement for location …` or `No shape for route …`, the existing file has an id not listed above — add a placement/shape for it using the same regional layout (north y < 330, central 370–750, south 780–1040, west x < 440, sea x > 1150) rather than deleting data.

- [ ] **Step 5: Run the script a second time to prove idempotency**

Run:

```bash
shasum data/reverend-insanity/map.json
npx tsx scripts/author-reverend-insanity-map.ts
shasum data/reverend-insanity/map.json
```

Expected: both `shasum` lines print the same hash.

- [ ] **Step 6: Run tests**

Run: `npx vitest run tests/reverend-insanity.test.ts tests/map-adapter.test.ts && npm test`
Expected: PASS. The five mortal region polygons have `14·8 = 112`, `11·8 = 88`, `12·8 = 96`, `13·8 = 104`, `10·8 = 80` vertices (≥ 60).

- [ ] **Step 7: Commit**

```bash
git add scripts/author-reverend-insanity-map.ts data/reverend-insanity/map.json tests/reverend-insanity.test.ts
git commit -m "feat(universe): re-author Reverend Insanity atlas with three organic planes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 23: Documentation, full verification and in-browser review

**Files:**
- Modify: `ARCHITECTURE.md` (§5), `DESIGN_SYSTEM.md` (new §6), `TODO.md`, `docs/superpowers/specs/2026-09-29-diablo-atlas-design.md`

**Interfaces:**
- Consumes: the finished feature.
- Produces: updated docs, a verified build, and screenshots/GIF of the atlas.

- [ ] **Step 1: Update the spec with the recorded deviations**

Append to `docs/superpowers/specs/2026-09-29-diablo-atlas-design.md`:

```markdown
---

## 12. Implementation Deviations (recorded 2026-09-29)

1. Hover glow uses an additive, accent-tinted back-sprite instead of a separate outline filter.
2. Glyph exclusion around markers was replaced by a dark clearing ellipse under each *visible* marker; baking gaps around all locations would reveal future locations when fog is toggled off.
3. `LocationEntity` has no danger field, so adapter-generated maps leave `dangerLevel` undefined.
4. Secret routes are chapter-filtered in the projection (require `revealedAtChapter <= userChapter`).
5. Fog is rendered by a custom world-space Mesh shader (not a Filter) so the Bayer dither stays locked to the map; WebGL/GLSL only (`preference: 'webgl'`).
6. Rivers are authored as ribbon polygons (the schema has no polyline terrain).
7. The animated coast foam ring is replaced by a static shallow-water halo; sea-lane dashes carry the water motion.
8. One Piece gulls are omitted; sea-spray particles only.
```

- [ ] **Step 2: Update ARCHITECTURE.md §5**

Replace the body of "## 🗺️ 5. Map Engine v2 & PixiJS Cartography Architecture" (keep the heading, renamed to "Map Engine v3 — Pixel-Gothic Retained Atlas") with a description matching the implemented system:
- The data flow `map.json | adaptGraphToWorldMap → projectTemporalMap(def, ch, { planeId }) → diffMapSnapshots(prev, next) → PixiWorldRenderer.applySnapshot()` as a mermaid flowchart.
- The 9 containers table from the spec §3.3.
- A module list with clickable `file:///Users/deepaknaik/Downloads/world-building/omni-lore/...` links for every file in `src/engine/map/**`, `src/projections/map-snapshot-diff.ts`, `src/domain/map-planes.ts`, and the new components in `src/components/map/`.
- The coalescing queue contract (only the newest snapshot commits).
- Multi-plane rules (first plane always revealed; sealed/unknown `?plane=` falls back and is rewritten).
- Zero-spoiler rules from spec §7.

Also update §9 test counts to the number printed by `npm test` in Step 5.

- [ ] **Step 3: Update DESIGN_SYSTEM.md**

Add "## 🗺️ 6. Pixel-Gothic Atlas" covering: biome ramps (4 tones, 15% parchment-shadow pull), 2-unit pixel grid and 0.5-resolution bake, sprite legend (`o d b l h s a w`), `DANGER_COLORS` table (EX `#dc2626`, S `#f97316`, A `#f59e0b`, B `#64748b`, Safe `#10b981`), Bayer-dithered fog, hover tooltip anatomy, discovery banner, waypoint panel, frame and minimap, and the reduced-motion rules. Replace the old `PixelMapCanvas` fog description in §4.4 with a pointer to §6.

- [ ] **Step 4: Update TODO.md**

- Add under P2 a completed item "Map Engine v3 — Pixel-Gothic Diablo Atlas" with sub-bullets (retained diff renderer, multi-plane, hero walk, dithered fog, waypoints, tooltips, minimap, Reverend Insanity 3-plane re-author).
- Mark "Mobile Touch Optimization" done (pinch zoom via `GestureTracker`).
- Add a new open item "Spec 2: Hand-author organic map.json for Coiling Dragon, Demonic Emperor, Lord of the Mysteries, One Piece, Solo Leveling".
- Update the verification-commands comment with the new test count.

- [ ] **Step 5: Full verification**

Run each and record the output:

```bash
npm test
npx tsc --noEmit
npm run build
npm run build:extension
```

Expected: all tests pass (count recorded in docs), typecheck clean, Next build succeeds, extension build succeeds (untouched).

- [ ] **Step 6: In-browser review (real WebGL)**

1. Run `npm run dev` in the background.
2. Using Claude in Chrome (load tools per the harness instructions), open a new tab to `http://localhost:3000/reverend-insanity?ch=1&tab=map` and capture a screenshot. Verify: organic continent on a sea backdrop, cliff walls between regions, scattered pixel peaks/pines/dunes, pixel icons, frame with 🦗 runes, dithered fog covering everything except Qing Mao, hero token with torch-light.
3. Record a GIF (`ri_chapter_scrub.gif`) while scrubbing the timeline from ch 1 → 700: the hero must walk, fog must dissolve open with bursts, and the "NEW AREA DISCOVERED" banner must coalesce with `+N MORE`.
4. Hover a landmark: tooltip with type, danger, faction, first-seen chapter; hover a KNOWN location: `??? UNCHARTED`.
5. Press `M`, choose "Stone Lotus Island" at ch ≥ 1350: plane warp to River of Time, drawer opens, URL contains `plane=plane-river-of-time&loc=loc-stone-lotus-island`.
6. Load `http://localhost:3000/reverend-insanity?ch=100&tab=map&plane=plane-river-of-time`: the map shows the Mortal plane and the URL is rewritten to `plane=plane-mortal-five-regions`.
7. Visit each other universe (`/coiling-dragon`, `/demonic-emperor`, `/lord-of-the-mysteries`, `/one-piece`, `/solo-leveling`) at `?tab=map`: no console errors (`read_console_messages` with pattern `error|Error`), icons/fog/hero/frame render on the rectangular adapter maps.
8. Emulate reduced motion (DevTools rendering panel or `matchMedia` override via `javascript_tool`) and confirm no walking/bursts/particles.
9. Resize the browser to 390 px wide: atlas stays usable; pinch/drag via touch emulation works.

Fix any defect found with a failing test first (TDD), then re-run Step 5.

- [ ] **Step 7: Commit**

```bash
git add ARCHITECTURE.md DESIGN_SYSTEM.md TODO.md docs/superpowers/specs/2026-09-29-diablo-atlas-design.md
git commit -m "docs(map): document pixel-gothic atlas engine v3 and record spec deviations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
