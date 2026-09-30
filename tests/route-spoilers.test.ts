import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { LocalGitDataStore } from '../src/datastore/local-git-store';
import { adaptGraphToWorldMap } from '../src/projections/map-adapter';
import { FogStatus, projectTemporalMap } from '../src/projections/temporal-map';
import { locationsOnRoute, routeGateChapter, ROUTE_STOP_RADIUS } from '../src/projections/route-gating';
import { getMapPlanes, planeIdOf } from '../src/domain/map-planes';
import { CanonicalLoreGraph } from '../src/domain/types';
import { MapLocation, WorldMapDefinition } from '../src/domain/map-types';

const UNIVERSES = [
  'coiling-dragon',
  'demonic-emperor',
  'lord-of-the-mysteries',
  'one-piece',
  'solo-leveling',
  'reverend-insanity',
];

const store = new LocalGitDataStore(path.resolve(__dirname, '../data'));

/** Loads a universe the way the app does: map.json when present, else the graph adapter. */
async function loadMap(slug: string): Promise<{ graph: CanonicalLoreGraph; def: WorldMapDefinition }> {
  const graph = (await store.getSeriesGraph(slug))!;
  const def = adaptGraphToWorldMap(graph, await store.getSeriesMap(slug));
  return { graph, def };
}

/**
 * Chapters to probe: the 1/25/50/75/100% sample plus every boundary where a
 * route or location changes visibility (a route's gate, a location's debut − 1).
 */
function probeChapters(def: WorldMapDefinition, total: number): number[] {
  const set = new Set<number>([1, Math.round(total * 0.25), Math.round(total * 0.5), Math.round(total * 0.75), total]);
  for (const r of def.routes) {
    set.add(r.visibleFromChapter);
    if (r.revealedAtChapter !== undefined) set.add(r.revealedAtChapter);
  }
  for (const l of def.locations) {
    set.add(l.firstAppearanceChapter - 1);
    set.add(l.firstAppearanceChapter);
  }
  return Array.from(set)
    .filter((ch) => ch >= 1 && ch <= total)
    .sort((a, b) => a - b);
}

/** Every visible route point that sits on a location not visible in the same snapshot. */
function leakingRoutePoints(def: WorldMapDefinition, chapter: number): string[] {
  const planes = getMapPlanes(def);
  const leaks: string[] = [];
  const base = projectTemporalMap(def, chapter);
  for (const plane of base.planes.filter((p) => p.isRevealed)) {
    const snap = projectTemporalMap(def, chapter, { planeId: plane.id });
    const visible = new Set(
      snap.locations
        .filter((l) => l.fogStatus !== FogStatus.KNOWN && l.fogStatus !== FogStatus.UNKNOWN)
        .map((l) => l.id)
    );
    const hidden = def.locations.filter((l) => planeIdOf(l, planes) === snap.planeId && !visible.has(l.id));
    for (const route of snap.routes) {
      for (const [x, y] of route.points) {
        const hit = hidden.find((l) => Math.hypot(l.x - x, l.y - y) <= ROUTE_STOP_RADIUS);
        if (hit) leaks.push(`ch${chapter} ${route.id} -> ${hit.id} (debut ${hit.firstAppearanceChapter})`);
      }
    }
  }
  return leaks;
}

describe('route spoilers across all universes', () => {
  for (const slug of UNIVERSES) {
    it(`${slug}: no visible route point sits on a location that is not yet visible`, async () => {
      const { graph, def } = await loadMap(slug);
      const leaks = probeChapters(def, graph.series.total_chapters).flatMap((ch) => leakingRoutePoints(def, ch));
      expect(leaks).toEqual([]);
    });
  }
});

describe('adapter journey routes', () => {
  it('emits one same-plane segment per consecutive waypoint pair, gated on the later stop', async () => {
    for (const slug of UNIVERSES.filter((s) => s !== 'reverend-insanity')) {
      const { def } = await loadMap(slug);
      const primary = def.characterPaths[0];
      if (!primary) continue;
      const byId = new Map(def.locations.map((l) => [l.id, l]));
      for (const route of def.routes) {
        expect(route.points, `${slug} ${route.id}`).toHaveLength(2);
        const ends = route.points.map(([x, y]) =>
          def.locations.find((l) => l.x === x && l.y === y && l.planeId === route.planeId)
        );
        expect(ends.every(Boolean), `${slug} ${route.id} endpoints on its plane`).toBe(true);
        expect(route.revealedAtChapter).toBe(route.visibleFromChapter);
        for (const end of ends) {
          expect(route.visibleFromChapter).toBeGreaterThanOrEqual(byId.get(end!.id)!.firstAppearanceChapter);
        }
      }
      expect(new Set(def.routes.map((r) => r.id)).size).toBe(def.routes.length);
    }
  });

  it('only shows journey legs whose both ends have been reached (Coiling Dragon, ch 4 vs ch 50)', async () => {
    const { def } = await loadMap('coiling-dragon');
    const at4 = projectTemporalMap(def, 4, { planeId: 'plane-yulan' });
    expect(at4.routes).toEqual([]);
    const at50 = projectTemporalMap(def, 50, { planeId: 'plane-yulan' });
    // Wushan -> Ernst Institute (ch 21) and Ernst -> Magical Beast Mountain (ch 50)
    expect(at50.routes.map((r) => r.points)).toEqual([
      [[120, 340], [290, 205]],
      [[290, 205], [450, 290]],
    ]);
  });

  it('is deterministic', async () => {
    const graph = (await store.getSeriesGraph('one-piece'))!;
    expect(adaptGraphToWorldMap(graph).routes).toEqual(adaptGraphToWorldMap(graph).routes);
  });
});

describe('route gating helpers', () => {
  const loc = (id: string, x: number, y: number, debut: number, planeId?: string): MapLocation => ({
    id, name: id, x, y, type: 'city', importance: 'major', firstAppearanceChapter: debut, revealedAtChapter: debut, planeId,
  });
  const locations = [loc('a', 0, 0, 1), loc('b', 100, 0, 50), loc('c', 200, 0.5, 90), loc('d', 100, 0, 300, 'other')];
  const planes = [{ id: 'main', name: 'Main', width: 1000, height: 1000, revealedAtChapter: 0, backdrop: 'void' as const }];

  it('matches locations within the stop radius on the route plane only', () => {
    const route = { points: [[0, 0], [100, 0.9], [150, 50], [200, 0]] as [number, number][] };
    expect(locationsOnRoute(route, locations, planes).map((l) => l.id)).toEqual(['a', 'b', 'c']);
    expect(locationsOnRoute({ ...route, planeId: 'other' }, locations, planes).map((l) => l.id)).toEqual(['d']);
  });

  it('gates a route to the latest debut of the locations it passes through', () => {
    const route = { points: [[0, 0], [100, 0]] as [number, number][] };
    expect(routeGateChapter(route, locations, planes, 10)).toBe(50);
    expect(routeGateChapter(route, locations, planes, 70)).toBe(70);
    expect(routeGateChapter({ points: [[500, 500], [600, 600]] }, locations, planes, 5)).toBe(5);
  });
});
