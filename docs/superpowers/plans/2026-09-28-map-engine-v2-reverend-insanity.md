# Map Engine v2 & Reverend Insanity World Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Map Engine v2 — a generic, reusable PixiJS-powered interactive RPG World Atlas with atmospheric terrain, multi-state Fog of War, temporal chapter projections, cinematic camera, character journeys, and faction territories — with Reverend Insanity as the flagship benchmark universe, seamlessly integrated into OmniLore.

**Architecture:** A decoupled architecture where PixiJS renders the high-performance WebGL world layers (terrain, regions, routes, markers, fog of war, particles), React provides the HUD application controls (modes, layer toggles, timeline scrubber, slide-over dossier), and the OmniLore Temporal Engine strictly projects visible geographic and historical data bounded by `userChapter`. Every universe shares the identical renderer while supplying its own `WorldMapDefinition`, `MapTheme`, and vector assets.

**Tech Stack:** `pixi.js` (v8), `pixi-viewport`, Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS, Zod, Vitest.

**Spec:** [`docs/superpowers/specs/2026-09-28-reverend-insanity-universe-expansion-design.md`](file:///Users/deepaknaik/Downloads/world-building/omni-lore/docs/superpowers/specs/2026-09-28-reverend-insanity-universe-expansion-design.md)

## Global Constraints

- **Strict Temporal Integrity (Zero Spoilers):** No landmark, region, character path, or event may render if its canon debut occurs past `userChapter`.
- **Pure Projection Architecture:** Never mutate the canonical graph or raw map definition; all views are pure functional transforms of `(mapData, userChapter)`.
- **Renderer Independence:** The PixiJS renderer must be 100% generic across all universes — zero hardcoded universe `if (slug === '...')` checks inside core rendering loops.
- **Client-Side Canvas Safety:** PixiJS must only execute in client components with defensive SSR guards (`typeof window !== 'undefined'`) and clean lifecycle destruction (`app.destroy(true)`).
- **Test Invariant:** All existing 53 Vitest tests across 9 test suites must continue to pass, alongside newly authored Map Engine tests.

---

### Task 1: Map Engine v2 Data Models, Schemas & Validation

**Files:**
- Create: `src/domain/map-types.ts`
- Create: `src/domain/map-schema.ts`
- Test: `tests/map-schema.test.ts`

**Interfaces:**
- Consumes: `src/domain/types.ts` (`CanonicalLoreGraph`, `Provenance`)
- Produces: `WorldMapDefinition`, `TerrainLayer`, `MapRegion`, `MapLocation`, `MapRoute`, `FactionTerritory`, `MapEvent`, `CharacterPath`, `MapTheme`, `MapState` and Zod validator `WorldMapSchema`.

- [ ] **Step 1: Write the failing unit tests for Map Engine schemas**

```typescript
// tests/map-schema.test.ts
import { describe, it, expect } from 'vitest';
import { WorldMapSchema, validateWorldMap } from '../src/domain/map-schema';

describe('Map Engine v2 Schema Validation', () => {
  it('validates a well-formed WorldMapDefinition', () => {
    const validMap = {
      id: 'map-reverend-insanity-five-regions',
      universeId: 'reverend-insanity',
      coordinateSystem: 'world',
      width: 1000,
      height: 1000,
      terrain: [
        {
          id: 'terrain-southern-border',
          type: 'mountain',
          name: 'Southern Border Karst Spire Range',
          polygon: [[100, 700], [400, 700], [400, 950], [100, 950]],
          elevation: 2,
        }
      ],
      regions: [
        {
          id: 'region-southern-border',
          name: 'Southern Border',
          geometry: {
            type: 'Polygon',
            coordinates: [[[100, 680], [400, 680], [400, 950], [100, 950]]]
          },
          terrainType: 'mountain',
          visibleFromChapter: 1,
          revealedAtChapter: 1,
          factionIds: ['faction-gu-yue', 'faction-shang', 'faction-wu']
        }
      ],
      locations: [
        {
          id: 'loc-qing-mao-mountain',
          name: 'Qing Mao Mountain',
          x: 180,
          y: 720,
          type: 'mountain',
          importance: 'critical',
          firstAppearanceChapter: 1,
          revealedAtChapter: 1,
          description: 'Cradle of Gu Yue Village and Spring Autumn Cicada rebirth.'
        }
      ],
      routes: [
        {
          id: 'route-caravan-shang-clan',
          name: 'Shang Clan Caravan Trade Route',
          points: [[180, 720], [230, 740], [280, 760]],
          routeType: 'road',
          visibleFromChapter: 200
        }
      ],
      territories: [
        {
          factionId: 'faction-shang',
          name: 'Shang Clan Commerce Sphere',
          boundary: [[240, 720], [320, 720], [320, 800], [240, 800]],
          controlPeriods: [
            { fromChapter: 210, toChapter: null, influencePct: 90 }
          ]
        }
      ],
      events: [
        {
          id: 'event-clan-slaughter',
          name: 'Qing Mao Blood Slaughter',
          chapter: 195,
          locationId: 'loc-qing-mao-mountain',
          eventType: 'battle',
          importance: 'critical',
          involvedCharacterIds: ['char-fang-yuan', 'char-bai-ning-bing']
        }
      ],
      characterPaths: [
        {
          characterId: 'char-fang-yuan',
          characterName: 'Fang Yuan',
          waypoints: [
            { chapter: 1, locationId: 'loc-qing-mao-mountain', x: 180, y: 720, note: 'Rebirth via Spring Autumn Cicada' },
            { chapter: 260, locationId: 'loc-shang-clan-city', x: 280, y: 760, note: 'Arrives with caravan' }
          ]
        }
      ]
    };

    const parsed = validateWorldMap(validMap);
    expect(parsed.universeId).toBe('reverend-insanity');
    expect(parsed.locations.length).toBe(1);
  });

  it('rejects invalid coordinates exceeding boundary bounds', () => {
    const invalidMap = {
      id: 'bad-map',
      universeId: 'test',
      coordinateSystem: 'normalized',
      width: 1,
      height: 1,
      terrain: [],
      regions: [],
      locations: [
        {
          id: 'bad-loc',
          name: 'Out of bounds',
          x: 2.5, // Normalized must be <= 1.0
          y: 0.5,
          type: 'city',
          importance: 'minor',
          firstAppearanceChapter: 1,
          revealedAtChapter: 1
        }
      ],
      routes: [],
      territories: [],
      events: [],
      characterPaths: []
    };

    expect(() => validateWorldMap(invalidMap)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/map-schema.test.ts`
Expected: FAIL with module `src/domain/map-schema` not found.

- [ ] **Step 3: Implement domain types and Zod validation schema**

Create `src/domain/map-types.ts` defining all generic map structures:
```typescript
export type CoordinateSystem = 'normalized' | 'world';

export type TerrainType =
  | 'ocean'
  | 'river'
  | 'mountain'
  | 'forest'
  | 'desert'
  | 'plains'
  | 'swamp'
  | 'ice'
  | 'volcanic'
  | 'void'
  | 'custom';

export type LocationType =
  | 'city'
  | 'village'
  | 'sect'
  | 'clan'
  | 'castle'
  | 'ruin'
  | 'dungeon'
  | 'mountain'
  | 'cave'
  | 'battlefield'
  | 'temple'
  | 'ocean'
  | 'island'
  | 'portal'
  | 'landmark';

export interface TerrainLayer {
  id: string;
  type: TerrainType;
  name: string;
  polygon: [number, number][];
  elevation?: number;
  colorOverride?: string;
}

export interface MapRegion {
  id: string;
  name: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  parentRegionId?: string;
  terrainType?: TerrainType;
  visibleFromChapter?: number;
  revealedAtChapter?: number;
  factionIds?: string[];
  notes?: string;
}

export interface MapLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  type: LocationType;
  regionId?: string;
  importance: 'minor' | 'major' | 'critical';
  firstAppearanceChapter: number;
  revealedAtChapter: number;
  icon?: string;
  description?: string;
  aliases?: string[];
  controllingFactionId?: string;
}

export interface MapRoute {
  id: string;
  name: string;
  points: [number, number][];
  routeType: 'road' | 'sea' | 'flight' | 'portal' | 'secret';
  visibleFromChapter: number;
  revealedAtChapter?: number;
}

export interface FactionTerritory {
  factionId: string;
  name: string;
  boundary: [number, number][];
  controlPeriods: Array<{
    fromChapter: number;
    toChapter: number | null;
    influencePct: number;
  }>;
}

export interface MapEvent {
  id: string;
  name: string;
  chapter: number;
  locationId?: string;
  eventType: 'battle' | 'death' | 'breakthrough' | 'discovery' | 'war' | 'reveal' | 'migration' | 'ascension';
  importance: 'minor' | 'major' | 'critical';
  involvedCharacterIds?: string[];
  description?: string;
}

export interface CharacterWaypoint {
  chapter: number;
  locationId?: string;
  x: number;
  y: number;
  note?: string;
}

export interface CharacterPath {
  characterId: string;
  characterName: string;
  waypoints: CharacterWaypoint[];
}

export interface WorldMapDefinition {
  id: string;
  universeId: string;
  coordinateSystem: CoordinateSystem;
  width: number;
  height: number;
  terrain: TerrainLayer[];
  regions: MapRegion[];
  locations: MapLocation[];
  routes: MapRoute[];
  territories: FactionTerritory[];
  events: MapEvent[];
  characterPaths: CharacterPath[];
}
```

Create `src/domain/map-schema.ts` with Zod validation.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/map-schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/map-types.ts src/domain/map-schema.ts tests/map-schema.test.ts
git commit -m "feat(map-engine): add generic map data model and Zod validation schemas"
```

---

### Task 2: Temporal Map Projection Engine

**Files:**
- Create: `src/projections/temporal-map.ts`
- Test: `tests/temporal-map.test.ts`

**Interfaces:**
- Consumes: `WorldMapDefinition`, `CanonicalLoreGraph`, `userChapter: number`
- Produces: `ProjectedWorldMapSnapshot`, `FogStatus` enum (`'UNKNOWN' | 'KNOWN' | 'DISCOVERED' | 'REVEALED' | 'CURRENT'`).

- [ ] **Step 1: Write the failing test for Temporal Map Projection**

```typescript
// tests/temporal-map.test.ts
import { describe, it, expect } from 'vitest';
import { projectTemporalMap, FogStatus } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

describe('Temporal Map Projection Engine', () => {
  const sampleMap: WorldMapDefinition = {
    id: 'test-map',
    universeId: 'reverend-insanity',
    coordinateSystem: 'world',
    width: 1000,
    height: 1000,
    terrain: [],
    regions: [
      {
        id: 'reg-southern',
        name: 'Southern Border',
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [100, 0], [100, 100], [0, 100]]] },
        visibleFromChapter: 1,
        revealedAtChapter: 1
      },
      {
        id: 'reg-northern',
        name: 'Northern Plains',
        geometry: { type: 'Polygon', coordinates: [[[200, 0], [300, 0], [300, 100], [200, 100]]] },
        visibleFromChapter: 406,
        revealedAtChapter: 406
      }
    ],
    locations: [
      {
        id: 'loc-qing-mao',
        name: 'Qing Mao Mountain',
        x: 50,
        y: 50,
        type: 'mountain',
        importance: 'critical',
        firstAppearanceChapter: 1,
        revealedAtChapter: 1
      },
      {
        id: 'loc-crescent-lake',
        name: 'Crescent Lake',
        x: 250,
        y: 50,
        type: 'lake',
        importance: 'major',
        firstAppearanceChapter: 480,
        revealedAtChapter: 480
      }
    ],
    routes: [
      {
        id: 'route-escape',
        name: 'Escape Route',
        points: [[50, 50], [100, 100]],
        routeType: 'road',
        visibleFromChapter: 200
      }
    ],
    territories: [],
    events: [
      {
        id: 'ev-awakening',
        name: 'Hope Gu Awakening',
        chapter: 15,
        locationId: 'loc-qing-mao',
        eventType: 'breakthrough',
        importance: 'critical'
      },
      {
        id: 'ev-hero-assembly',
        name: 'Hero Assembly',
        chapter: 480,
        locationId: 'loc-crescent-lake',
        eventType: 'battle',
        importance: 'major'
      }
    ],
    characterPaths: [
      {
        characterId: 'char-fang-yuan',
        characterName: 'Fang Yuan',
        waypoints: [
          { chapter: 1, locationId: 'loc-qing-mao', x: 50, y: 50 },
          { chapter: 210, x: 120, y: 120 },
          { chapter: 480, locationId: 'loc-crescent-lake', x: 250, y: 50 }
        ]
      }
    ]
  };

  it('filters locations strictly prior to userChapter', () => {
    const snapCh50 = projectTemporalMap(sampleMap, 50);
    expect(snapCh50.locations.map(l => l.id)).toEqual(['loc-qing-mao']);
    expect(snapCh50.events.length).toBe(1);
    expect(snapCh50.events[0].id).toBe('ev-awakening');

    const snapCh500 = projectTemporalMap(sampleMap, 500);
    expect(snapCh500.locations.map(l => l.id)).toEqual(['loc-qing-mao', 'loc-crescent-lake']);
    expect(snapCh500.events.length).toBe(2);
  });

  it('slices character path waypoints up to userChapter', () => {
    const snapCh100 = projectTemporalMap(sampleMap, 100);
    const charPath = snapCh100.characterPaths.find(p => p.characterId === 'char-fang-yuan');
    expect(charPath?.waypoints.length).toBe(1);

    const snapCh300 = projectTemporalMap(sampleMap, 300);
    const charPath300 = snapCh300.characterPaths.find(p => p.characterId === 'char-fang-yuan');
    expect(charPath300?.waypoints.length).toBe(2);
  });

  it('assigns correct fog status to discovered landmarks', () => {
    const snap = projectTemporalMap(sampleMap, 50);
    const qingMao = snap.locations.find(l => l.id === 'loc-qing-mao');
    expect(qingMao?.fogStatus).toBe('CURRENT');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/temporal-map.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/projections/temporal-map.ts`**

Pure projection function implementing zero-spoiler filtering and fog status resolution.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/temporal-map.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/projections/temporal-map.ts tests/temporal-map.test.ts
git commit -m "feat(map-engine): add temporal map projection transform with zero-spoiler filtering"
```

---

### Task 3: Universe Map Theme Registry & Atmospheric Styling

**Files:**
- Create: `src/domain/map-themes.ts`
- Test: `tests/map-themes.test.ts`

**Interfaces:**
- Consumes: Universe slug
- Produces: `MapTheme` with palettes, marker icons, fog styling, atmosphere particles.

- [ ] **Step 1: Write test verifying theme registry configs**

```typescript
// tests/map-themes.test.ts
import { describe, it, expect } from 'vitest';
import { getMapTheme, UNIVERSE_MAP_THEMES } from '../src/domain/map-themes';

describe('Universe Map Theme Registry', () => {
  it('retrieves distinct theme configurations for all 6 universes', () => {
    const slugs = [
      'reverend-insanity',
      'coiling-dragon',
      'solo-leveling',
      'lord-of-the-mysteries',
      'one-piece',
      'demonic-emperor'
    ];

    slugs.forEach(slug => {
      const theme = getMapTheme(slug);
      expect(theme).toBeDefined();
      expect(theme.palette.background).toBeDefined();
      expect(theme.markerStyle).toBeDefined();
      expect(theme.fogStyle).toBeDefined();
    });
  });

  it('configures Reverend Insanity with ink-brush and jade palette', () => {
    const riTheme = getMapTheme('reverend-insanity');
    expect(riTheme.palette.primaryAccent).toBe('#10b981');
    expect(riTheme.fogStyle.style).toBe('ink_mist');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/map-themes.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `src/domain/map-themes.ts`**

Define `MapTheme` interface and full configurations for:
- `reverend-insanity` (Aged parchment, dark ink `#0a1712`, jade `#10b981`, blood seal `#dc2626`, ink mist fog)
- `coiling-dragon` (Celestial high fantasy, gold `#f59e0b`, deep navy `#0a1024`, planar runes)
- `solo-leveling` (Modern dark RPG, hunter cyan `#38bdf8`, dungeon portal violet `#a855f7`)
- `lord-of-the-mysteries` (Victorian occult, deep purple `#c084fc`, antique brass `#d97706`, cosmic haze)
- `one-piece` (Nautical chart, ocean blue `#0284c7`, parchment sand `#fbbf24`, sea wave lines)
- `demonic-emperor` (Nine Serenities crimson `#ef4444`, obsidian `#150a0f`, demonic flames)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/map-themes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/map-themes.ts tests/map-themes.test.ts
git commit -m "feat(map-engine): add multi-universe MapTheme registry and styling configurations"
```

---

### Task 4: PixiJS World Renderer Core & Camera Controller

**Files:**
- Create: `src/engine/map/camera-controller.ts`
- Create: `src/engine/map/pixi-world-renderer.ts`
- Test: `tests/pixi-renderer.test.ts`

**Interfaces:**
- Consumes: `<HTMLCanvasElement>`, `ProjectedWorldMapSnapshot`, `MapTheme`
- Produces: `PixiWorldRenderer` instance with methods `renderSnapshot()`, `setMode()`, `toggleLayer()`, `flyTo()`, `destroy()`.

- [ ] **Step 1: Write unit tests for camera controller math and bounds**

```typescript
// tests/pixi-renderer.test.ts
import { describe, it, expect } from 'vitest';
import { CameraController } from '../src/engine/map/camera-controller';

describe('Map Camera Controller', () => {
  it('initializes with default viewport center', () => {
    const cam = new CameraController({ worldWidth: 1000, worldHeight: 1000, viewWidth: 800, viewHeight: 600 });
    expect(cam.zoom).toBe(1);
    expect(cam.x).toBe(400);
    expect(cam.y).toBe(300);
  });

  it('clamps zoom between min and max bounds', () => {
    const cam = new CameraController({ worldWidth: 1000, worldHeight: 1000, viewWidth: 800, viewHeight: 600, minZoom: 0.5, maxZoom: 4 });
    cam.setZoom(10);
    expect(cam.zoom).toBe(4);
    cam.setZoom(0.1);
    expect(cam.zoom).toBe(0.5);
  });

  it('computes smooth interpolation coordinates during flyTo', () => {
    const cam = new CameraController({ worldWidth: 1000, worldHeight: 1000, viewWidth: 800, viewHeight: 600 });
    cam.flyTo(500, 500, 2);
    expect(cam.isAnimating).toBe(true);
    cam.tick(16); // 1 frame
    expect(cam.isAnimating).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/pixi-renderer.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `camera-controller.ts` and `pixi-world-renderer.ts`**

`CameraController`: Handles pan, zoom, pinch gestures, coordinate normalization, and spring interpolation.
`PixiWorldRenderer`:
- Initializes Pixi `Application` with anti-aliasing and WebGL context.
- Maintains 9 discrete container layers:
  1. `backgroundContainer`
  2. `terrainContainer`
  3. `regionsContainer`
  4. `routesContainer`
  5. `characterPathContainer`
  6. `markersContainer`
  7. `fogContainer`
  8. `atmosphereContainer`
  9. `labelsContainer`
- Draws vector polygons, terrain textures, animated travel dashes, glowing marker glyphs, and soft fog apertures.
- Exposes clean callbacks: `onSelectLocation(id)`, `onSelectRegion(id)`, `onSelectEvent(id)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/pixi-renderer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/map/camera-controller.ts src/engine/map/pixi-world-renderer.ts tests/pixi-renderer.test.ts
git commit -m "feat(map-engine): implement PixiWorldRenderer with 9-layer scene graph and CameraController"
```

---

### Task 5: Interactive React HUD, Timeline Bar & Map Controls

**Files:**
- Create: `src/components/map/MapHudControls.tsx`
- Create: `src/components/map/MapTimelineBar.tsx`
- Create: `src/components/map/MapLocationDrawer.tsx`
- Create: `src/components/map/RpgWorldAtlas.tsx`
- Test: `tests/rpg-atlas-component.test.ts`

**Interfaces:**
- Consumes: `WorldMapDefinition`, `MapTheme`, `userChapter`, `onChapterChange`
- Produces: `<RpgWorldAtlas />` React component.

- [ ] **Step 1: Write component smoke tests**

```typescript
// tests/rpg-atlas-component.test.ts
import { describe, it, expect } from 'vitest';
import { RpgWorldAtlas } from '../src/components/map/RpgWorldAtlas';

describe('RpgWorldAtlas Component', () => {
  it('exports valid React component', () => {
    expect(RpgWorldAtlas).toBeDefined();
    expect(typeof RpgWorldAtlas).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/rpg-atlas-component.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement React HUD components**
- `MapHudControls.tsx`: Mode selector (`[ 🧭 ATLAS ]`, `[ ⚔ ADVENTURE ]`, `[ 📜 LORE ]`), Layer pills, Zoom `[+]`/`[-]`/`[🎯 RESET]`.
- `MapTimelineBar.tsx`: Horizontal chapter rail with event icons, drag handle synced with global scrubber.
- `MapLocationDrawer.tsx`: Slide-over card displaying landmark lore, controlling faction, visited characters, and historical battles.
- `RpgWorldAtlas.tsx`: Host component managing canvas lifecycle, SSR hydration guard, resize observers, and synchronizing React state with `PixiWorldRenderer`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/rpg-atlas-component.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/map/ tests/rpg-atlas-component.test.ts
git commit -m "feat(map-engine): add React HUD controls, timeline bar, and RpgWorldAtlas container"
```

---

### Task 6: Flagship Universe Data & Assets: Reverend Insanity (`reverend-insanity`)

**Files:**
- Create: `data/reverend-insanity/graph.json`
- Create: `data/reverend-insanity/map.json`
- Modify: `data/series-registry.json`
- Modify: `src/domain/themes.ts`
- Modify: `src/engine/duel-simulator.ts`
- Create: `public/assets/pixels/reverend-insanity/` (avatars, factions, landmarks)
- Test: `tests/reverend-insanity.test.ts`

**Interfaces:**
- Consumes: `CanonicalLoreGraph`, `WorldMapDefinition`
- Produces: 6th canonical universe data graph, 3-plane map definition, and 6 RPG duel presets.

- [ ] **Step 1: Write integration tests for Reverend Insanity data**

```typescript
// tests/reverend-insanity.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { LocalGitDataStore } from '../src/datastore/local-git-store';
import { projectPowerLadder, projectTimeline } from '../src/projections';
import { getCanonPresets } from '../src/engine/duel-simulator';

describe('Reverend Insanity Universe Integration', () => {
  const store = new LocalGitDataStore();

  it('loads graph.json and validates series metadata', async () => {
    const graph = await store.getSeriesGraph('reverend-insanity');
    expect(graph).not.toBeNull();
    expect(graph?.series.slug).toBe('reverend-insanity');
    expect(graph?.series.total_chapters).toBe(2334);
  });

  it('projects 9-tier power ladder at Ch. 2250', async () => {
    const graph = await store.getSeriesGraph('reverend-insanity');
    const ladder = projectPowerLadder(graph!, 2250);
    expect(ladder.tiers.length).toBe(9);
    const topTier = ladder.tiers[ladder.tiers.length - 1];
    expect(topTier.name).toContain('Rank 9');
  });

  it('loads 6 canon duel simulator presets for reverend-insanity', () => {
    const presets = getCanonPresets('reverend-insanity');
    expect(presets.length).toBe(6);
    expect(presets.some(p => p.id === 'ri-fangyuan-dukelong')).toBe(true);
  });

  it('validates reverend-insanity map.json definition', () => {
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8');
    const mapData = JSON.parse(raw);
    expect(mapData.universeId).toBe('reverend-insanity');
    expect(mapData.locations.length).toBeGreaterThanOrEqual(15);
    expect(mapData.regions.length).toBeGreaterThanOrEqual(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/reverend-insanity.test.ts`
Expected: FAIL.

- [ ] **Step 3: Create Reverend Insanity graph.json, map.json, themes, duel presets, and pixel assets**
- Ingest `data/reverend-insanity/graph.json` with 25+ figures, 9-tier power ladder, 10 factions, 16 landmarks, 6 arcs, and 35+ temporal facts.
- Ingest `data/reverend-insanity/map.json` spanning the 5 Regions, Regional Walls, Two Heavens, and River of Time.
- Add series entry to `data/series-registry.json`.
- Add theme to `src/domain/themes.ts`.
- Add 6 duel presets in `src/engine/duel-simulator.ts`.
- Generate pixel SVG art in `public/assets/pixels/reverend-insanity/`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/reverend-insanity.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add data/reverend-insanity/ data/series-registry.json src/domain/themes.ts src/engine/duel-simulator.ts public/assets/pixels/reverend-insanity/ tests/reverend-insanity.test.ts
git commit -m "feat(universe): add Reverend Insanity canonical lore graph, 3-plane world map, and duel presets"
```

---

### Task 7: Map Engine v2 Adapter & Integration into `world-explorer.tsx`

**Files:**
- Create: `src/projections/map-adapter.ts`
- Modify: `src/app/[slug]/world-explorer.tsx`
- Test: `tests/map-adapter.test.ts`

**Interfaces:**
- Consumes: Existing `CanonicalLoreGraph`
- Produces: Auto-generated `WorldMapDefinition` if universe lacks standalone `map.json`, ensuring 100% backward compatibility for Coiling Dragon, Solo Leveling, Lord of the Mysteries, One Piece, and Demonic Emperor.

- [ ] **Step 1: Write unit tests for fallback map adapter**

```typescript
// tests/map-adapter.test.ts
import { describe, it, expect } from 'vitest';
import { adaptGraphToWorldMap } from '../src/projections/map-adapter';
import { LocalGitDataStore } from '../src/datastore/local-git-store';

describe('Map Engine v2 Fallback Adapter', () => {
  const store = new LocalGitDataStore();

  it('synthesizes valid WorldMapDefinition from Coiling Dragon graph', async () => {
    const graph = await store.getSeriesGraph('coiling-dragon');
    const mapDef = adaptGraphToWorldMap(graph!);
    expect(mapDef.universeId).toBe('coiling-dragon');
    expect(mapDef.locations.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/map-adapter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `map-adapter.ts` and update `world-explorer.tsx`**
- Implement `adaptGraphToWorldMap()` converting existing planes and locations into a `WorldMapDefinition`.
- Update `world-explorer.tsx` to mount `<RpgWorldAtlas />` when the MAP tab is active, supporting both standalone `map.json` and adapter fallback.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/map-adapter.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/projections/map-adapter.ts src/app/[slug]/world-explorer.tsx tests/map-adapter.test.ts
git commit -m "feat(map-engine): integrate RpgWorldAtlas into WorldExplorer with universal graph fallback adapter"
```

---

### Task 8: Full Verification, Vitest Suite & Turbopack Production Build

**Files:**
- Test: `tests/`
- Documentation: `TODO.md`, `UNIVERSES.md`, `ARCHITECTURE.md`

- [ ] **Step 1: Run complete Vitest suite**

Run: `npm test`
Expected: All tests pass (previous 53 + new suites = 65+ passing tests).

- [ ] **Step 2: Run Next.js Turbopack production build**

Run: `npm run build`
Expected: Clean compilation with 0 TypeScript or routing errors.

- [ ] **Step 3: Update documentation to reflect Map Engine v2 & Reverend Insanity**
Update `TODO.md`, `UNIVERSES.md`, and `ARCHITECTURE.md`.

- [ ] **Step 4: Commit**

```bash
git add TODO.md UNIVERSES.md ARCHITECTURE.md
git commit -m "docs: document Map Engine v2 architecture, PixiJS renderer, and Reverend Insanity universe"
```
