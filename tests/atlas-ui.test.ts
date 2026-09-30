import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createEmitter,
  bannerReducer,
  buildTooltipModel,
  placeTooltip,
  visibleRegionNames,
  groupWaypoints,
  fogCirclesForMinimap,
} from '../src/components/map/atlas-ui-state';
import { AtlasTooltip } from '../src/components/map/AtlasTooltip';
import { DiscoveryBanner } from '../src/components/map/DiscoveryBanner';
import { WaypointPanel } from '../src/components/map/WaypointPanel';
import { AtlasFrame } from '../src/components/map/AtlasFrame';
import { AtlasMinimap } from '../src/components/map/AtlasMinimap';
import { MapHudControls } from '../src/components/map/MapHudControls';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition, MapVisibleLayers } from '../src/domain/map-types';

const def: WorldMapDefinition = {
  id: 'ui', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
  planes: [
    { id: 'mortal', name: 'Mortal Realm', width: 1000, height: 1000, revealedAtChapter: 0, backdrop: 'sea', order: 0 },
    { id: 'heaven', name: 'Heaven', width: 600, height: 400, revealedAtChapter: 10, backdrop: 'sky', order: 1 },
  ],
  terrain: [],
  regions: [
    { id: 'south', name: 'Southern Border', geometry: { type: 'Polygon', coordinates: [[[0, 0], [500, 0], [500, 500]]] }, planeId: 'mortal' },
    { id: 'north', name: 'Northern Plains', geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1]]] }, planeId: 'mortal', visibleFromChapter: 400 },
  ],
  locations: [
    { id: 'loc-qing-mao-mountain', name: 'Qing Mao Mountain', x: 100, y: 100, type: 'mountain', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'mortal', regionId: 'south', waypoint: true, dangerLevel: 'B', controllingFactionId: 'gu-yue' },
    { id: 'rumor', name: 'Secret Vault', x: 300, y: 300, type: 'dungeon', importance: 'major', firstAppearanceChapter: 90, revealedAtChapter: 5, planeId: 'mortal' },
    { id: 'palace', name: 'Sky Palace', x: 200, y: 100, type: 'temple', importance: 'critical', firstAppearanceChapter: 12, revealedAtChapter: 12, planeId: 'heaven', waypoint: true },
  ],
  routes: [],
  territories: [{ factionId: 'gu-yue', name: 'Gu Yue Clan', boundary: [[0, 0], [200, 0], [200, 200]], controlPeriods: [{ fromChapter: 1, toChapter: null, influencePct: 90 }], planeId: 'mortal' }],
  events: [
    { id: 'ev1', name: 'Awakening', chapter: 3, locationId: 'loc-qing-mao-mountain', eventType: 'breakthrough', importance: 'major' },
    { id: 'ev2', name: 'Future War', chapter: 99, locationId: 'loc-qing-mao-mountain', eventType: 'war', importance: 'major' },
  ],
  characterPaths: [{ characterId: 'hero', characterName: 'Hero', waypoints: [{ chapter: 1, locationId: 'loc-qing-mao-mountain', x: 100, y: 100 }] }],
};

const layers: MapVisibleLayers = {
  terrain: true, regions: true, routes: true, territories: true, markers: true,
  events: true, characterPaths: true, fogOfWar: true, labels: true,
};

describe('createEmitter', () => {
  it('stores the latest value and notifies subscribers until unsubscribed', () => {
    const e = createEmitter(0);
    const fn = vi.fn();
    const off = e.subscribe(fn);
    e.emit(5);
    expect(e.get()).toBe(5);
    expect(fn).toHaveBeenCalledWith(5);
    off();
    e.emit(6);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('bannerReducer', () => {
  it('coalesces discoveries into latest name plus a running total', () => {
    let s = bannerReducer(null, []);
    expect(s).toBeNull();
    s = bannerReducer(s, ['A']);
    expect(s).toEqual({ latest: 'A', total: 1, key: 1 });
    s = bannerReducer(s, ['B', 'C']);
    expect(s).toEqual({ latest: 'C', total: 3, key: 2 });
  });
});

describe('buildTooltipModel', () => {
  const snap = projectTemporalMap(def, 20);

  it('describes a discovered location with chapter-bounded facts', () => {
    const m = buildTooltipModel(snap, { kind: 'location', id: 'loc-qing-mao-mountain' }, 'reverend-insanity')!;
    expect(m.title).toBe('Qing Mao Mountain');
    expect(m.masked).toBe(false);
    expect(m.danger).toBe('B');
    expect(m.factionName).toBe('Gu Yue Clan');
    expect(m.firstSeen).toBe(1);
    expect(m.eventCount).toBe(1);
    expect(m.isWaypoint).toBe(true);
    expect(m.portraitUrl).toBe('/assets/pixels/reverend-insanity/locations/qing-mao-mountain.svg');
  });

  it('masks KNOWN locations completely', () => {
    const m = buildTooltipModel(snap, { kind: 'location', id: 'rumor' })!;
    expect(m.masked).toBe(true);
    expect(m.title).toBe('??? UNCHARTED');
    expect(m.title).not.toContain('Secret');
    expect(m.danger).toBeUndefined();
    expect(m.firstSeen).toBeUndefined();
    expect(m.portraitUrl).toBeUndefined();
    expect(m.isWaypoint).toBe(false);
  });

  it('describes regions and events', () => {
    expect(buildTooltipModel(snap, { kind: 'region', id: 'south' })!.title).toBe('SOUTHERN BORDER');
    const ev = buildTooltipModel(snap, { kind: 'event', id: 'ev1' })!;
    expect(ev.title).toBe('Awakening');
    expect(ev.firstSeen).toBe(3);
  });

  it('returns null for targets that are not in the snapshot', () => {
    expect(buildTooltipModel(snap, { kind: 'event', id: 'ev2' })).toBeNull();
    expect(buildTooltipModel(snap, { kind: 'location', id: 'palace' })).toBeNull();
  });
});

describe('placeTooltip', () => {
  it('offsets from the cursor and flips at viewport edges', () => {
    expect(placeTooltip(100, 100, 200, 100, 800, 600)).toEqual({ left: 116, top: 116 });
    expect(placeTooltip(700, 550, 200, 100, 800, 600)).toEqual({ left: 484, top: 434 });
    expect(placeTooltip(5, 5, 900, 700, 800, 600)).toEqual({ left: 0, top: 0 });
  });
});

describe('waypoint grouping', () => {
  it('only names regions that are visible at the current chapter', () => {
    expect(visibleRegionNames(def, 20)).toEqual({ south: 'Southern Border' });
    expect(visibleRegionNames(def, 400)).toEqual({ south: 'Southern Border', north: 'Northern Plains' });
  });

  it('groups discovered waypoints by plane then region', () => {
    const snap = projectTemporalMap(def, 20);
    const groups = groupWaypoints(snap.waypoints, snap.planes, visibleRegionNames(def, 20));
    expect(groups.map((g) => g.planeId)).toEqual(['mortal', 'heaven']);
    expect(groups[0].regions[0]).toMatchObject({ regionId: 'south', regionName: 'Southern Border' });
    expect(groups[1].regions[0]).toMatchObject({ regionId: null, regionName: 'UNCHARTED LANDS' });
  });
});

describe('fogCirclesForMinimap', () => {
  it('returns one circle per discovered location', () => {
    const circles = fogCirclesForMinimap(projectTemporalMap(def, 20));
    expect(circles).toEqual([{ x: 100, y: 100, r: 70 }]);
  });
});

describe('overlay components', () => {
  const snap = projectTemporalMap(def, 20);

  it('renders the tooltip only with a model', () => {
    expect(renderToStaticMarkup(React.createElement(AtlasTooltip, { model: null, x: 0, y: 0, viewportWidth: 800, viewportHeight: 600, accentColor: '#10b981' }))).toBe('');
    const model = buildTooltipModel(snap, { kind: 'location', id: 'loc-qing-mao-mountain' }, 'reverend-insanity');
    const html = renderToStaticMarkup(React.createElement(AtlasTooltip, { model, x: 10, y: 10, viewportWidth: 800, viewportHeight: 600, accentColor: '#10b981' }));
    expect(html).toContain('data-testid="atlas-tooltip"');
    expect(html).toContain('Qing Mao Mountain');
    expect(html).toContain('WAYPOINT');
    expect(html).toContain('FIRST SEEN');
  });

  it('renders the discovery banner with the +N MORE suffix', () => {
    const html = renderToStaticMarkup(React.createElement(DiscoveryBanner, { state: { latest: 'Shang City', total: 4, key: 1 }, onDone: () => {}, accentColor: '#10b981' }));
    expect(html).toContain('NEW AREA DISCOVERED');
    expect(html).toContain('Shang City');
    expect(html).toContain('+3 MORE');
  });

  it('renders the waypoint panel with groups and an empty state', () => {
    const groups = groupWaypoints(snap.waypoints, snap.planes, visibleRegionNames(def, 20));
    const html = renderToStaticMarkup(React.createElement(WaypointPanel, { groups, activePlaneId: 'mortal', onTravel: () => {}, onClose: () => {}, accentColor: '#10b981' }));
    expect(html).toContain('WAYPOINTS');
    expect(html).toContain('Qing Mao Mountain');
    expect(html).toContain('Sky Palace');
    expect(html).toContain('CURRENT');
    const empty = renderToStaticMarkup(React.createElement(WaypointPanel, { groups: [], activePlaneId: 'mortal', onTravel: () => {}, onClose: () => {}, accentColor: '#10b981' }));
    expect(empty).toContain('NO WAYPOINTS DISCOVERED YET');
  });

  it('renders the frame and minimap', () => {
    expect(renderToStaticMarkup(React.createElement(AtlasFrame, { accentColor: '#10b981', rune: '🦗' }))).toContain('🦗');
    const credited = renderToStaticMarkup(
      React.createElement(AtlasFrame, { accentColor: '#10b981', rune: '🦗', credits: [{ label: 'Puny World tileset by Shade (CC0)', url: 'https://opengameart.org/x' }] })
    );
    expect(credited).toContain('Art:');
    expect(credited).toContain('href="https://opengameart.org/x"');
    // Credits block is not inside aria-hidden element (should appear after it closes)
    const ariaHiddenIndex = credited.indexOf('aria-hidden');
    const ariaHiddenCloseIndex = credited.indexOf('</div>', ariaHiddenIndex) + '</div>'.length;
    const artIndex = credited.indexOf('>Art:</');
    expect(artIndex > ariaHiddenCloseIndex).toBe(true);
    const html = renderToStaticMarkup(React.createElement(AtlasMinimap, {
      imageUrl: null, worldWidth: 1000, worldHeight: 1000, fogCircles: [{ x: 100, y: 100, r: 70 }],
      hero: { x: 100, y: 100 }, subscribe: () => () => {}, onPan: () => {}, accentColor: '#10b981', fogColor: '#020705',
    }));
    expect(html).toContain('data-testid="atlas-minimap"');
  });

  it('starts collapsed on narrow screens via defaultCollapsed, with no map image drawn', () => {
    const html = renderToStaticMarkup(React.createElement(AtlasMinimap, {
      imageUrl: 'data:image/png;base64,AAAA', worldWidth: 1000, worldHeight: 1000, fogCircles: [{ x: 100, y: 100, r: 70 }],
      hero: { x: 100, y: 100 }, subscribe: () => () => {}, onPan: () => {}, accentColor: '#10b981', fogColor: '#020705',
      defaultCollapsed: true,
    }));
    expect(html).toContain('▸ RADAR');
    expect(html).not.toContain('▾ RADAR');
    expect(html).not.toContain('<img');
  });

  it('wraps the right-hand HUD cluster so every button stays reachable at phone widths', () => {
    const html = renderToStaticMarkup(React.createElement(MapHudControls, {
      mode: 'atlas', onModeChange: () => {}, visibleLayers: layers, onToggleLayer: () => {},
      onZoomIn: () => {}, onZoomOut: () => {}, onResetZoom: () => {}, onRecenter: () => {},
      planes: [{ id: 'mortal', name: 'Mortal Realm' }], activePlaneId: 'mortal', onPlaneChange: () => {},
      onOpenWaypoints: () => {}, waypointCount: 2,
    }));
    const clusterMatch = html.match(/<div class="([^"]*)" data-testid="hud-right-cluster"/);
    expect(clusterMatch).not.toBeNull();
    expect(clusterMatch?.[1]).toContain('flex-wrap');
  });
});
