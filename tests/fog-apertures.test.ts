import { describe, it, expect, vi } from 'vitest';
import { Container, MeshGeometry, Renderer } from 'pixi.js';
import { ApertureField, computeApertureTargets, APERTURE_RADIUS } from '../src/engine/map/layers/fog-apertures';
import { FogLayer } from '../src/engine/map/layers/fog-layer';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TileAtlas } from '../src/engine/map/scene/tile-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

// The dither shader needs a real GL context to compile; the disposal test only needs the quad.
vi.mock('../src/engine/map/layers/fog-material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/engine/map/layers/fog-material')>();
  class FakeDitherFogMaterial {
    public shader = null;
    public time = 0;
    public destroy(): void {}
  }
  return { ...actual, DitherFogMaterial: FakeDitherFogMaterial };
});

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
    const fog = new FogLayer(new Container(), { theme, atlas: new IconAtlas(null, theme), tiles: new TileAtlas(null), tweens: new TweenManager(), reducedMotion: false }, null);
    fog.resize(1000, 1000);
    fog.sync(projectTemporalMap(def, 30), false);
    const opened = fog.sync(projectTemporalMap(def, 60), true);
    expect(opened.sort()).toEqual(['loc:b', 'wp:60:700:700']);
    fog.update(16);
    fog.destroy();
  });
});

describe('FogLayer GPU disposal', () => {
  it('destroys the fog quad geometry on resize and destroy', () => {
    const theme = getMapTheme('reverend-insanity');
    const destroySpy = vi.spyOn(MeshGeometry.prototype, 'destroy');
    // A stub renderer is enough: resize only allocates, it never draws
    const fog = new FogLayer(
      new Container(),
      { theme, atlas: new IconAtlas(null, theme), tiles: new TileAtlas(null), tweens: new TweenManager(), reducedMotion: false },
      {} as Renderer
    );
    fog.resize(1000, 1000);
    const first = destroySpy.mock.instances.length;
    fog.resize(800, 800);
    expect(destroySpy.mock.instances.length).toBe(first + 1);
    fog.destroy();
    expect(destroySpy.mock.instances.length).toBe(first + 2);
    destroySpy.mockRestore();
  });
});
