import { describe, it, expect } from 'vitest';
import { WorldMapSchema, validateWorldMap, safeValidateWorldMap } from '../src/domain/map-schema';
import type { WorldMapDefinition } from '../src/domain/map-types';

describe('Map Engine v2 Schema Validation', () => {
  const validMap: WorldMapDefinition = {
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

  it('validates a well-formed WorldMapDefinition', () => {
    const parsed = validateWorldMap(validMap);
    expect(parsed.universeId).toBe('reverend-insanity');
    expect(parsed.locations.length).toBe(1);
    expect(parsed.locations[0].name).toBe('Qing Mao Mountain');
    expect(parsed.regions.length).toBe(1);
    expect(parsed.terrain.length).toBe(1);
    expect(parsed.routes.length).toBe(1);
    expect(parsed.territories.length).toBe(1);
    expect(parsed.events.length).toBe(1);
    expect(parsed.characterPaths.length).toBe(1);
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

  it('rejects negative coordinates for locations and waypoints', () => {
    const negativeCoordMap = {
      ...validMap,
      locations: [
        {
          ...validMap.locations[0],
          x: -10,
          y: 100
        }
      ]
    };
    expect(() => validateWorldMap(negativeCoordMap)).toThrow();
  });

  it('rejects world coordinates exceeding width and height', () => {
    const outOfBoundsWorldMap = {
      ...validMap,
      width: 500,
      height: 500,
      locations: [
        {
          ...validMap.locations[0],
          x: 800, // Exceeds width 500
          y: 200
        }
      ]
    };
    expect(() => validateWorldMap(outOfBoundsWorldMap)).toThrow();
  });

  it('rejects invalid territory influencePct greater than 100 or less than 0', () => {
    const invalidTerritoryMap = {
      ...validMap,
      territories: [
        {
          factionId: 'faction-shang',
          name: 'Invalid Influence',
          boundary: [[100, 100], [200, 100], [200, 200], [100, 200]],
          controlPeriods: [
            { fromChapter: 1, toChapter: null, influencePct: 150 }
          ]
        }
      ]
    };
    expect(() => validateWorldMap(invalidTerritoryMap)).toThrow();
  });

  it('provides safeValidateWorldMap returning success or error object', () => {
    const resultSuccess = safeValidateWorldMap(validMap);
    expect(resultSuccess.success).toBe(true);
    if (resultSuccess.success) {
      expect(resultSuccess.data.id).toBe('map-reverend-insanity-five-regions');
    }

    const resultFail = safeValidateWorldMap({ id: 'incomplete-map' });
    expect(resultFail.success).toBe(false);
    if (!resultFail.success) {
      expect(resultFail.error).toBeDefined();
    }
  });

  it('supports lake as valid location type', () => {
    const mapWithLake = {
      ...validMap,
      locations: [
        {
          id: 'loc-crescent-lake',
          name: 'Crescent Lake',
          x: 480,
          y: 220,
          type: 'lake',
          importance: 'major',
          firstAppearanceChapter: 480,
          revealedAtChapter: 480
        }
      ]
    };
    const parsed = validateWorldMap(mapWithLake);
    expect(parsed.locations[0].type).toBe('lake');
  });

  it('validates MultiPolygon geometry in MapRegion', () => {
    const mapWithMultiPoly = {
      ...validMap,
      regions: [
        {
          id: 'region-multi',
          name: 'Archipelago Region',
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [[[10, 10], [20, 10], [20, 20], [10, 20]]],
              [[[30, 30], [40, 30], [40, 40], [30, 40]]]
            ]
          },
          visibleFromChapter: 1,
          revealedAtChapter: 1
        }
      ]
    };
    const parsed = validateWorldMap(mapWithMultiPoly);
    expect(parsed.regions[0].geometry.type).toBe('MultiPolygon');
  });
});
