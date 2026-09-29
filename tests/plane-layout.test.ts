import { describe, it, expect } from 'vitest';
import { buildPlaneLayout, PIXELS_PER_WORLD } from '../src/engine/map/scene/plane-layout';
import { pointInPolygon, distanceToPolyline } from '../src/engine/map/scene/geometry';
import { CONIFERS, ROUND_TREES, PEAKS_GREY, PEAKS_SNOW, PEAKS_SMALL, PALMS, ROCKS } from '../src/engine/map/scene/sprite-catalog';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

const TREES = new Set<string>([...CONIFERS, ...ROUND_TREES]);
const PEAKS = new Set<string>([...PEAKS_GREY, ...PEAKS_SNOW, ...PEAKS_SMALL]);

const def: WorldMapDefinition = {
  id: 'layout-map',
  universeId: 'reverend-insanity',
  coordinateSystem: 'world',
  width: 1200,
  height: 800,
  planes: [{ id: 'mortal', name: 'Mortal', width: 1200, height: 800, revealedAtChapter: 0, backdrop: 'sea', order: 0 }],
  terrain: [
    { id: 'plains', type: 'plains', name: 'Plains', polygon: [[100, 100], [700, 100], [700, 700], [100, 700]], planeId: 'mortal' },
    { id: 'woods', type: 'forest', name: 'Woods', polygon: [[150, 150], [450, 150], [450, 450], [150, 450]], planeId: 'mortal' },
    { id: 'range', type: 'mountain', name: 'Range', polygon: [[500, 150], [650, 150], [650, 650], [500, 650]], planeId: 'mortal' },
    { id: 'sands', type: 'desert', name: 'Sands', polygon: [[750, 100], [1100, 100], [1100, 700], [750, 700]], planeId: 'mortal' },
    { id: 'oasis', type: 'ocean', name: 'Oasis', polygon: [[880, 380], [960, 380], [960, 440], [880, 440]], planeId: 'mortal' },
    { id: 'lake', type: 'ocean', name: 'Lake', polygon: [[200, 520], [320, 520], [320, 620], [200, 620]], planeId: 'mortal' },
  ],
  rivers: [{ id: 'r', name: 'River', points: [[120, 480], [400, 470], [690, 500]], width: 20, planeId: 'mortal', bridges: [[400, 470]] }],
  regions: [], locations: [], routes: [], territories: [], events: [], characterPaths: [],
};

describe('buildPlaneLayout', () => {
  const snap = projectTemporalMap(def, 1);
  const layout = buildPlaneLayout(snap);

  it('scales the plane to pixel space and keeps the backdrop', () => {
    expect(layout.width).toBe(1200 * PIXELS_PER_WORLD);
    expect(layout.height).toBe(800 * PIXELS_PER_WORLD);
    expect(layout.backdrop).toBe('sea');
    expect(layout.rivers[0].width).toBe(20 * PIXELS_PER_WORLD);
    expect(layout.bridges).toEqual([[200, 235]]);
  });

  it('keeps fills in terrain order and marks water', () => {
    expect(layout.fills.map((f) => f.kind)).toEqual(['grass', 'grass', 'grass', 'sand', 'lake', 'lake']);
    expect(layout.fills.map((f) => f.id)).toEqual(['plains', 'woods', 'range', 'sands', 'oasis', 'lake']);
    expect(layout.land).toHaveLength(4);
  });

  it('roughens coastlines deterministically', () => {
    expect(layout.fills[0].ring.length).toBeGreaterThan(4 * 8);
    expect(buildPlaneLayout(snap)).toEqual(layout);
  });

  it('puts trees in the forest, peaks in the range and none in the desert', () => {
    const inWoods = layout.stamps.filter((s) => s.x > 90 && s.x < 210 && s.y > 90 && s.y < 210);
    expect(inWoods.filter((s) => TREES.has(s.sprite)).length).toBeGreaterThan(40);
    const inRange = layout.stamps.filter((s) => s.x > 262 && s.x < 318 && s.y > 90 && s.y < 310);
    expect(inRange.filter((s) => PEAKS.has(s.sprite)).length).toBeGreaterThan(30);
    const inSands = layout.stamps.filter((s) => s.x > 390 && s.y > 60 && s.y < 340);
    expect(inSands.some((s) => TREES.has(s.sprite) || PEAKS.has(s.sprite))).toBe(false);
    expect(inSands.some((s) => ROCKS.includes(s.sprite))).toBe(true);
  });

  it('rings desert water with palms', () => {
    const palms = layout.stamps.filter((s) => PALMS.includes(s.sprite));
    expect(palms.length).toBeGreaterThanOrEqual(6);
    for (const p of palms) expect(Math.hypot(p.x - 460, p.y - 205)).toBeLessThan(60);
  });

  it('never stamps on water or rivers', () => {
    const waters = layout.fills.filter((f) => f.kind === 'water' || f.kind === 'lake');
    for (const s of layout.stamps) {
      if (PALMS.includes(s.sprite)) continue;
      for (const w of waters) expect(pointInPolygon(s.x, s.y, w.ring)).toBe(false);
      expect(distanceToPolyline(s.x, s.y, layout.rivers[0].points)).toBeGreaterThanOrEqual(layout.rivers[0].width / 2 + 3);
    }
  });

  it('sorts stamps top-to-bottom and adds grass tone patches', () => {
    for (let i = 1; i < layout.stamps.length; i++) expect(layout.stamps[i].y).toBeGreaterThanOrEqual(layout.stamps[i - 1].y);
    expect(layout.patches.length).toBeGreaterThan(5);
  });

  it('treats ocean outside land as open water', () => {
    const withSea = {
      ...def,
      terrain: [{ id: 'sea', type: 'ocean' as const, name: 'Sea', polygon: [[0, 0], [1200, 0], [1200, 800], [0, 800]] as [number, number][], planeId: 'mortal' }, ...def.terrain],
    };
    const l = buildPlaneLayout(projectTemporalMap(withSea, 1));
    expect(l.fills[0].kind).toBe('water');
    expect(l.land).toHaveLength(4);
  });

  it('caps roughening on already-dense rings', () => {
    const dense = Array.from({ length: 200 }, (_, i) => {
      const a = (i / 200) * Math.PI * 2;
      return [600 + Math.cos(a) * 300, 400 + Math.sin(a) * 300] as [number, number];
    });
    const l = buildPlaneLayout(projectTemporalMap({ ...def, terrain: [{ id: 'd', type: 'plains', name: 'D', polygon: dense, planeId: 'mortal' }], rivers: [] }, 1));
    expect(l.fills[0].ring.length).toBe(200);
  });

  it('roughens rectangles from adapter maps too', () => {
    const rect = { ...def, terrain: [def.terrain[0]], rivers: [] };
    const l = buildPlaneLayout(projectTemporalMap(rect, 1));
    const xs = l.fills[0].ring.map((p) => p[0]);
    expect(new Set(xs.map((x) => Math.round(x))).size).toBeGreaterThan(10);
  });
});
