import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { LabelsLayer, labelAlpha, LABEL_SCREEN_SIZE, installPixelFont, uninstallPixelFont } from '../src/engine/map/layers/labels-layer';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TileAtlas } from '../src/engine/map/scene/tile-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition } from '../src/domain/map-types';

describe('labelAlpha', () => {
  it('fades region titles out as you zoom in', () => {
    expect(labelAlpha('region', 0.5)).toBeCloseTo(0.6);
    expect(labelAlpha('region', 1.2)).toBeCloseTo(0.3);
    expect(labelAlpha('region', 1.5)).toBe(0);
  });

  it('reveals landmark labels by importance', () => {
    expect(labelAlpha('critical', 0.7)).toBe(0);
    expect(labelAlpha('critical', 0.9)).toBe(1);
    expect(labelAlpha('major', 1.0)).toBe(0);
    expect(labelAlpha('major', 1.3)).toBe(1);
    expect(labelAlpha('minor', 1.3)).toBe(0);
    expect(labelAlpha('minor', 1.8)).toBe(1);
    expect(labelAlpha('minor', 1.74)).toBeCloseTo(0.5);
  });
});

describe('LabelsLayer (Text fallback)', () => {
  const def: WorldMapDefinition = {
    id: 'labels', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
    terrain: [], routes: [], territories: [], events: [], characterPaths: [],
    regions: [{ id: 'r', name: 'Southern Border', geometry: { type: 'Polygon', coordinates: [[[0, 0], [200, 0], [200, 200], [0, 200]]] } }],
    locations: [
      { id: 'big', name: 'Big City', x: 50, y: 50, type: 'city', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1 },
      { id: 'small', name: 'Hamlet', x: 90, y: 90, type: 'village', importance: 'minor', firstAppearanceChapter: 1, revealedAtChapter: 1 },
      { id: 'rumor', name: 'Rumor', x: 150, y: 150, type: 'ruin', importance: 'major', firstAppearanceChapter: 90, revealedAtChapter: 5 },
    ],
  };

  it('labels regions and discovered locations but never KNOWN ones', () => {
    const theme = getMapTheme('reverend-insanity');
    const layer = new LabelsLayer(new Container(), { theme, atlas: new IconAtlas(null, theme), tiles: new TileAtlas(null), tweens: new TweenManager(), reducedMotion: false }, false);
    layer.sync(projectTemporalMap(def, 10));
    expect([...layer.labels.keys()].sort()).toEqual(['loc:big', 'loc:small', 'region:r']);

    layer.setZoom(1.0);
    expect(layer.labels.get('loc:big')!.node.visible).toBe(true);
    expect(layer.labels.get('loc:small')!.node.visible).toBe(false);
    expect(layer.labels.get('region:r')!.node.alpha).toBeCloseTo(0.6);
    expect(layer.labels.get('loc:big')!.node.scale.x).toBeCloseTo(LABEL_SCREEN_SIZE.critical / 32 / 1.0);

    layer.sync(projectTemporalMap(def, 95));
    expect(layer.labels.has('loc:rumor')).toBe(true);
    layer.destroy();
  });

  it('pixel font install/uninstall are browser-only and idempotent', () => {
    expect(() => installPixelFont()).not.toThrow();
    expect(() => installPixelFont()).not.toThrow();
    expect(() => uninstallPixelFont()).not.toThrow();
    expect(() => uninstallPixelFont()).not.toThrow();
  });

  it('backward scrub removes labels no longer visible', () => {
    const theme = getMapTheme('reverend-insanity');
    const layer = new LabelsLayer(new Container(), { theme, atlas: new IconAtlas(null, theme), tiles: new TileAtlas(null), tweens: new TweenManager(), reducedMotion: false }, false);
    layer.sync(projectTemporalMap(def, 95));
    expect(layer.labels.has('loc:rumor')).toBe(true);
    layer.sync(projectTemporalMap(def, 10));
    expect(layer.labels.has('loc:rumor')).toBe(false);
    layer.destroy();
  });
});
