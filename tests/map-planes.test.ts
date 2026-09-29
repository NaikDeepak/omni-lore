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
    rivers: [{ id: 'r1', name: 'Jade River', points: [[100, 500], [800, 520], [1500, 480]], width: 24, planeId: 'mortal', bridges: [[800, 520]] }],
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

  it('bounds-checks river points and bridges against their plane', () => {
    const def = multiPlaneMap();
    def.rivers = [{ id: 'r2', name: 'Sky River', points: [[10, 10], [790, 590]], width: 10, planeId: 'heaven', bridges: [[900, 100]] }];
    expect(safeValidateWorldMap(def).success).toBe(false);
    def.rivers = [{ id: 'r3', name: 'Short', points: [[10, 10]], width: 10, planeId: 'heaven' }];
    expect(safeValidateWorldMap(def).success).toBe(false);
  });

  it('rejects duplicate plane ids', () => {
    const def = multiPlaneMap();
    def.planes = [...def.planes!, { ...def.planes![0] }];
    expect(safeValidateWorldMap(def).success).toBe(false);
  });
});
