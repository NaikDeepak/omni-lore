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
