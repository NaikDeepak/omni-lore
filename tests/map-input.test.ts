import { describe, it, expect } from 'vitest';
import { CameraController } from '../src/engine/map/camera-controller';
import { GestureTracker } from '../src/engine/map/input/gesture-tracker';
import { pickAt, EVENT_FLAG_OFFSET, isSelectableTarget } from '../src/engine/map/input/picking';
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

describe('isSelectableTarget', () => {
  const def: WorldMapDefinition = {
    id: 'select', universeId: 'test', coordinateSystem: 'world', width: 1000, height: 1000,
    terrain: [],
    regions: [{ id: 'big', name: 'Big', geometry: { type: 'Polygon', coordinates: [[[0, 0], [1000, 0], [1000, 1000], [0, 1000]]] } }],
    locations: [
      { id: 'open', name: 'Open', x: 100, y: 100, type: 'city', importance: 'major', firstAppearanceChapter: 1, revealedAtChapter: 1 },
      // Rumored before it debuts: a KNOWN silhouette at chapter 10
      { id: 'rumor', name: 'Secret Name', x: 500, y: 500, type: 'city', importance: 'major', firstAppearanceChapter: 50, revealedAtChapter: 5 },
    ],
    routes: [], territories: [],
    events: [
      { id: 'ev-open', name: 'Fair', chapter: 1, locationId: 'open', eventType: 'battle', importance: 'minor' },
      { id: 'ev-rumor', name: 'Whisper', chapter: 2, locationId: 'rumor', eventType: 'battle', importance: 'minor' },
    ],
    characterPaths: [],
  };
  const snap = projectTemporalMap(def, 10);

  it('still hovers KNOWN silhouettes (tooltip shows ??? UNCHARTED)', () => {
    expect(pickAt(snap, 500, 490, 1)).toEqual({ kind: 'location', id: 'rumor' });
  });

  it('never lets a KNOWN location or its event flag be selected', () => {
    expect(isSelectableTarget(snap, { kind: 'location', id: 'rumor' })).toBe(false);
    expect(isSelectableTarget(snap, { kind: 'event', id: 'ev-rumor' })).toBe(false);
    expect(isSelectableTarget(snap, { kind: 'location', id: 'missing' })).toBe(false);
  });

  it('selects discovered locations, their events and regions', () => {
    expect(isSelectableTarget(snap, { kind: 'location', id: 'open' })).toBe(true);
    expect(isSelectableTarget(snap, { kind: 'event', id: 'ev-open' })).toBe(true);
    expect(isSelectableTarget(snap, { kind: 'region', id: 'big' })).toBe(true);
  });
});
