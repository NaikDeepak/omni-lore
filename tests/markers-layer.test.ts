import { describe, it, expect } from 'vitest';
import { Container, Texture, TextureSource } from 'pixi.js';
import { MarkersLayer, PROP_SCALE, CRITICAL_ICON_SCALE, KNOWN_TINT } from '../src/engine/map/layers/markers-layer';
import { RegionsLayer } from '../src/engine/map/layers/regions-layer';
import { LayerContext } from '../src/engine/map/layers/layer-context';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TileAtlas, SheetLoader } from '../src/engine/map/scene/tile-atlas';
import { SHEETS } from '../src/engine/map/scene/sprite-catalog';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap, FogStatus } from '../src/projections/temporal-map';
import { journeyNumbers } from '../src/projections/journey-numbers';
import { WorldMapDefinition } from '../src/domain/map-types';

const def: WorldMapDefinition = {
  id: 'markers', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
  terrain: [],
  regions: [{ id: 'reg', name: 'Region', geometry: { type: 'Polygon', coordinates: [[[0, 0], [500, 0], [500, 500]]] } }],
  locations: [
    { id: 'home', name: 'Home', x: 100, y: 100, type: 'city', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1, waypoint: true, dangerLevel: 'Safe' },
    { id: 'rumor', name: 'Rumored Keep', x: 300, y: 300, type: 'castle', importance: 'major', firstAppearanceChapter: 50, revealedAtChapter: 10, waypoint: true },
    { id: 'later', name: 'Later', x: 600, y: 600, type: 'battlefield', importance: 'critical', firstAppearanceChapter: 80, revealedAtChapter: 80, dangerLevel: 'EX' },
  ],
  routes: [],
  territories: [{ factionId: 'f', name: 'F', boundary: [[0, 0], [100, 0], [100, 100]], controlPeriods: [{ fromChapter: 1, toChapter: null, influencePct: 50 }] }],
  events: [{ id: 'ev', name: 'Fight', chapter: 5, locationId: 'home', eventType: 'battle', importance: 'major' }],
  characterPaths: [{ characterId: 'hero', characterName: 'Hero', waypoints: [
    { chapter: 1, locationId: 'home', x: 100, y: 100 },
    { chapter: 85, locationId: 'later', x: 600, y: 600 },
    { chapter: 90, locationId: 'home', x: 100, y: 100 },
  ] }],
  landmarkGlyphs: [{ id: 'volcano', glyph: 'volcano', x: 800, y: 200, revealedAtChapter: 40 }],
};

const loader: SheetLoader = {
  load: async (url) => {
    const s = Object.values(SHEETS).find((x) => x.url === url)!;
    return new Texture({ source: new TextureSource({ width: s.width, height: s.height }) });
  },
};

async function ctx(reducedMotion = false, withTiles = true): Promise<LayerContext> {
  const theme = getMapTheme('reverend-insanity');
  const tiles = new TileAtlas(withTiles ? loader : null);
  await tiles.load();
  return { theme, atlas: new IconAtlas(null, theme), tiles, tweens: new TweenManager(), reducedMotion };
}

describe('journeyNumbers', () => {
  it('numbers discovered locations by first visit order', () => {
    expect([...journeyNumbers(projectTemporalMap(def, 95)).entries()]).toEqual([['home', 1], ['later', 2]]);
    expect([...journeyNumbers(projectTemporalMap(def, 20)).entries()]).toEqual([['home', 1]]);
  });
});

describe('MarkersLayer', () => {
  it('uses tileset props for mapped types and fallback icons otherwise', async () => {
    const layer = new MarkersLayer(new Container(), await ctx());
    layer.sync(projectTemporalMap(def, 90), false);
    expect(layer.markers.get('home')!.usesProp).toBe(true);
    expect(layer.markers.get('home')!.baseScale).toBe(PROP_SCALE);
    expect(layer.markers.get('later')!.usesProp).toBe(false);
    expect(layer.markers.get('later')!.baseScale).toBe(CRITICAL_ICON_SCALE);
  });

  it('falls back to icons when the tile atlas is not loaded', async () => {
    const layer = new MarkersLayer(new Container(), await ctx(false, false));
    layer.sync(projectTemporalMap(def, 20), false);
    expect(layer.markers.get('home')!.usesProp).toBe(false);
  });

  it('silhouettes KNOWN locations without pylon or badge', async () => {
    const layer = new MarkersLayer(new Container(), await ctx());
    layer.sync(projectTemporalMap(def, 20), false);
    const rumor = layer.markers.get('rumor')!;
    expect(rumor.status).toBe(FogStatus.KNOWN);
    expect(rumor.icon.tint).toBe(Number.parseInt(KNOWN_TINT.slice(1), 16));
    expect(rumor.icon.alpha).toBeCloseTo(0.7);
    expect(rumor.pylon!.visible).toBe(false);
    expect(rumor.badge).toBeNull();
    const home = layer.markers.get('home')!;
    expect(home.pylon!.visible).toBe(true);
    expect(home.badge).not.toBeNull();
  });

  it('adds and removes markers, landmarks, flags and badges across chapters', async () => {
    const layer = new MarkersLayer(new Container(), await ctx());
    layer.sync(projectTemporalMap(def, 95), false);
    expect(layer.markers.size).toBe(3);
    expect(layer.markers.get('later')!.badge).not.toBeNull();
    expect([...layer.landmarks.keys()]).toEqual(['volcano']);
    expect([...layer.eventFlags.keys()]).toEqual(['ev']);
    layer.sync(projectTemporalMap(def, 2), true);
    expect([...layer.markers.keys()]).toEqual(['home']);
    expect(layer.landmarks.size).toBe(0);
    expect(layer.eventFlags.size).toBe(0);
  });

  it('fades new markers in when animating', async () => {
    const c = await ctx();
    const layer = new MarkersLayer(new Container(), c);
    layer.sync(projectTemporalMap(def, 20), false);
    layer.sync(projectTemporalMap(def, 90), true);
    const later = layer.markers.get('later')!;
    expect(later.root.alpha).toBe(0);
    c.tweens.tick(400);
    expect(later.root.alpha).toBe(1);
  });

  it('scales the hovered marker by exactly +1 and back', async () => {
    const c = await ctx();
    const layer = new MarkersLayer(new Container(), c);
    layer.sync(projectTemporalMap(def, 20), false);
    layer.setHovered('home');
    c.tweens.tick(200);
    const home = layer.markers.get('home')!;
    expect(home.icon.scale.x).toBe(PROP_SCALE + 1);
    expect(home.glow.alpha).toBeGreaterThan(0.5);
    layer.setHovered(null);
    c.tweens.tick(200);
    expect(home.icon.scale.x).toBe(PROP_SCALE);
  });

  it('hides danger rings when zoomed out and freezes under reduced motion', async () => {
    const layer = new MarkersLayer(new Container(), await ctx(true));
    layer.sync(projectTemporalMap(def, 90), false);
    layer.setZoom(0.6);
    expect(layer.markers.get('later')!.ring.visible).toBe(false);
    layer.setZoom(1.2);
    expect(layer.markers.get('later')!.ring.visible).toBe(true);
    const y0 = layer.markers.get('home')!.icon.y;
    layer.update(600);
    expect(layer.markers.get('home')!.icon.y).toBe(y0);
  });

  it('forgets the hovered id when that marker is removed', async () => {
    const layer = new MarkersLayer(new Container(), await ctx());
    layer.sync(projectTemporalMap(def, 90), false);
    layer.setHovered('later');
    layer.sync(projectTemporalMap(def, 20), true);
    expect(layer.hoveredId).toBeNull();
  });
});

describe('RegionsLayer', () => {
  it('draws regions and territories and tracks hover', async () => {
    const container = new Container();
    const layer = new RegionsLayer(container, await ctx());
    layer.sync(projectTemporalMap(def, 20));
    expect(layer.regionCount).toBe(1);
    expect(container.children.length).toBeGreaterThan(0);
    layer.setHovered('reg');
    layer.setHovered(null);
    layer.destroy();
    expect(container.children.length).toBe(0);
  });
});
