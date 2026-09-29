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
    rivers: [
      { id: 'mortal-river', name: 'Mortal River', points: [[50, 600], [900, 700]], width: 30, planeId: 'mortal' },
      { id: 'sky-river', name: 'Sky River', points: [[10, 300], [700, 350]], width: 20, planeId: 'heaven' },
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

  it('includes the active plane rivers at every chapter', () => {
    expect(projectTemporalMap(map(), 1).rivers.map((r) => r.id)).toEqual(['mortal-river']);
    expect(projectTemporalMap(map(), 150, { planeId: 'heaven' }).rivers.map((r) => r.id)).toEqual(['sky-river']);
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
