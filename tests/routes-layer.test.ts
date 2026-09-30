import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { RoutesLayer, ROUTE_STYLES, routeColor, DIRT_TOP } from '../src/engine/map/layers/routes-layer';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TileAtlas } from '../src/engine/map/scene/tile-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition, MapRoute } from '../src/domain/map-types';

const theme = getMapTheme('one-piece');
const ctx = (reducedMotion = false) => ({ theme, atlas: new IconAtlas(null, theme), tiles: new TileAtlas(null), tweens: new TweenManager(), reducedMotion });

const def: WorldMapDefinition = {
  id: 'routes', universeId: 'one-piece', coordinateSystem: 'world', width: 500, height: 500,
  terrain: [], regions: [], locations: [], territories: [], events: [], characterPaths: [],
  routes: [
    { id: 'road', name: 'Road', points: [[0, 0], [100, 0]], routeType: 'road', visibleFromChapter: 1 },
    { id: 'sea', name: 'Sea', points: [[0, 50], [100, 50]], routeType: 'sea', visibleFromChapter: 1 },
    { id: 'late', name: 'Late', points: [[0, 90], [100, 90]], routeType: 'flight', visibleFromChapter: 50 },
  ],
};

describe('RoutesLayer', () => {
  it('defines a style for every route type', () => {
    for (const type of ['road', 'sea', 'flight', 'portal', 'secret'] as MapRoute['routeType'][]) {
      expect(ROUTE_STYLES[type].dash).toBeGreaterThan(0);
    }
  });

  it('colors roads as dirt paths and secret routes with the secondary accent', () => {
    const secret: MapRoute = { id: 's', name: 's', points: [[0, 0], [1, 1]], routeType: 'secret', visibleFromChapter: 1 };
    const road: MapRoute = { ...secret, routeType: 'road' };
    expect(routeColor(secret, theme)).toBe(theme.palette.secondaryAccent);
    expect(routeColor(road, theme)).toBe(DIRT_TOP);
  });

  it('syncs visible routes', () => {
    const layer = new RoutesLayer(new Container(), ctx());
    layer.sync(projectTemporalMap(def, 10));
    expect(layer.routeCount).toBe(2);
    layer.sync(projectTemporalMap(def, 60));
    expect(layer.routeCount).toBe(3);
  });

  it('marches dashes over time unless motion is reduced', () => {
    const moving = new RoutesLayer(new Container(), ctx());
    moving.sync(projectTemporalMap(def, 10));
    moving.update(100);
    expect(moving.dashPhaseMs).toBe(100);

    const still = new RoutesLayer(new Container(), ctx(true));
    still.sync(projectTemporalMap(def, 10));
    still.update(100);
    expect(still.dashPhaseMs).toBe(0);
  });
});
