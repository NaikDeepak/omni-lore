import { describe, it, expect } from 'vitest';
import { projectTemporalMap, FogStatus, ProjectedWorldMapSnapshot, isRegionVisible } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

describe('isRegionVisible', () => {
  it('returns true when visibleFromChapter is undefined', () => {
    expect(isRegionVisible({ revealedAtChapter: undefined }, 10)).toBe(true);
  });

  it('returns true when visibleFromChapter <= userChapter', () => {
    expect(isRegionVisible({ visibleFromChapter: 5, revealedAtChapter: 5 }, 10)).toBe(true);
    expect(isRegionVisible({ visibleFromChapter: 10, revealedAtChapter: 10 }, 10)).toBe(true);
  });

  it('returns false when visibleFromChapter > userChapter', () => {
    expect(isRegionVisible({ visibleFromChapter: 15, revealedAtChapter: undefined }, 10)).toBe(false);
  });

  it('returns true when revealedAtChapter <= userChapter', () => {
    expect(isRegionVisible({ visibleFromChapter: 100, revealedAtChapter: 5 }, 10)).toBe(true);
  });
});

describe('Temporal Map Projection Engine', () => {
  const sampleMap: WorldMapDefinition = {
    id: 'test-map',
    universeId: 'reverend-insanity',
    coordinateSystem: 'world',
    width: 1000,
    height: 1000,
    terrain: [
      {
        id: 'terrain-southern-mountains',
        type: 'mountain',
        name: 'Southern Mountains',
        polygon: [[0, 0], [100, 0], [100, 100], [0, 100]]
      }
    ],
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
      },
      {
        id: 'loc-shang-clan',
        name: 'Shang Clan City',
        x: 150,
        y: 150,
        type: 'city',
        importance: 'major',
        firstAppearanceChapter: 210,
        revealedAtChapter: 100
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
    territories: [
      {
        factionId: 'faction-gu-yue',
        name: 'Gu Yue Clan Territory',
        boundary: [[30, 30], [70, 30], [70, 70], [30, 70]],
        controlPeriods: [
          { fromChapter: 1, toChapter: 199, influencePct: 95 },
          { fromChapter: 200, toChapter: null, influencePct: 0 }
        ]
      },
      {
        factionId: 'faction-shang',
        name: 'Shang Clan Commerce Sphere',
        boundary: [[120, 120], [180, 120], [180, 180], [120, 180]],
        controlPeriods: [
          { fromChapter: 210, toChapter: null, influencePct: 85 }
        ]
      }
    ],
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
          { chapter: 210, locationId: 'loc-shang-clan', x: 150, y: 150 },
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
    expect(snapCh500.locations.map(l => l.id)).toEqual(['loc-qing-mao', 'loc-crescent-lake', 'loc-shang-clan']);
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

  it('updates fog status as protagonist moves across chapters', () => {
    // At chapter 50: Fang Yuan is at Qing Mao (CURRENT)
    const snapCh50 = projectTemporalMap(sampleMap, 50);
    expect(snapCh50.locations.find(l => l.id === 'loc-qing-mao')?.fogStatus).toBe('CURRENT');

    // At chapter 150: Shang Clan City was revealed in lore at ch 100, but first appears at ch 210 -> KNOWN
    const snapCh150 = projectTemporalMap(sampleMap, 150);
    const shangCh150 = snapCh150.locations.find(l => l.id === 'loc-shang-clan');
    expect(shangCh150).toBeDefined();
    expect(shangCh150?.fogStatus).toBe('KNOWN');

    // At chapter 300: Fang Yuan arrived at Shang Clan City at ch 210 -> Shang Clan is CURRENT, Qing Mao is DISCOVERED
    const snapCh300 = projectTemporalMap(sampleMap, 300);
    expect(snapCh300.locations.find(l => l.id === 'loc-shang-clan')?.fogStatus).toBe('CURRENT');
    expect(snapCh300.locations.find(l => l.id === 'loc-qing-mao')?.fogStatus).toBe('DISCOVERED');
  });

  it('filters active routes bounded by visibleFromChapter', () => {
    const snapCh100 = projectTemporalMap(sampleMap, 100);
    expect(snapCh100.routes.length).toBe(0);

    const snapCh250 = projectTemporalMap(sampleMap, 250);
    expect(snapCh250.routes.length).toBe(1);
    expect(snapCh250.routes[0].id).toBe('route-escape');
  });

  it('calculates active faction territories and currentInfluencePct', () => {
    // At Ch 50: Gu Yue clan is active with 95% influence; Shang clan is not yet active
    const snapCh50 = projectTemporalMap(sampleMap, 50);
    expect(snapCh50.territories.length).toBe(1);
    expect(snapCh50.territories[0].factionId).toBe('faction-gu-yue');
    expect(snapCh50.territories[0].currentInfluencePct).toBe(95);

    // At Ch 250: Gu Yue clan control dropped to 0 (inactive), Shang clan active at 85%
    const snapCh250 = projectTemporalMap(sampleMap, 250);
    expect(snapCh250.territories.length).toBe(1);
    expect(snapCh250.territories[0].factionId).toBe('faction-shang');
    expect(snapCh250.territories[0].currentInfluencePct).toBe(85);
  });

  it('filters regions bounded by visibleFromChapter', () => {
    const snapCh50 = projectTemporalMap(sampleMap, 50);
    expect(snapCh50.regions.map(r => r.id)).toEqual(['reg-southern']);

    const snapCh450 = projectTemporalMap(sampleMap, 450);
    expect(snapCh450.regions.map(r => r.id)).toEqual(['reg-southern', 'reg-northern']);
  });

  it('does not mutate original map definition (pure functional projection)', () => {
    const cloned = JSON.parse(JSON.stringify(sampleMap));
    projectTemporalMap(sampleMap, 50);
    expect(sampleMap).toEqual(cloned);
  });
});
