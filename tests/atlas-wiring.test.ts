import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { planeSwitchForLocation, keyToAtlasAction } from '../src/components/map/atlas-ui-state';
import { MapHudControls } from '../src/components/map/MapHudControls';
import { RpgWorldAtlas } from '../src/components/map/RpgWorldAtlas';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { WorldMapDefinition, MapVisibleLayers } from '../src/domain/map-types';

const def: WorldMapDefinition = {
  id: 'wiring', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
  planes: [
    { id: 'mortal', name: 'Mortal Five Regions', width: 1000, height: 1000, revealedAtChapter: 0, backdrop: 'sea', order: 0 },
    { id: 'river', name: 'River of Time', width: 800, height: 400, revealedAtChapter: 600, backdrop: 'abyss', order: 1 },
  ],
  terrain: [], regions: [], routes: [], territories: [], events: [],
  locations: [
    { id: 'village', name: 'Village', x: 100, y: 100, type: 'village', importance: 'major', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'mortal', waypoint: true },
    { id: 'lotus', name: 'Stone Lotus', x: 300, y: 200, type: 'island', importance: 'critical', firstAppearanceChapter: 600, revealedAtChapter: 600, planeId: 'river', waypoint: true },
  ],
  characterPaths: [{ characterId: 'fy', characterName: 'Fang Yuan', waypoints: [
    { chapter: 1, locationId: 'village', x: 100, y: 100 },
    { chapter: 650, locationId: 'lotus', x: 300, y: 200 },
  ] }],
};

const layers: MapVisibleLayers = {
  terrain: true, regions: true, routes: true, territories: true, markers: true,
  events: true, characterPaths: true, fogOfWar: true, labels: true,
};

describe('planeSwitchForLocation', () => {
  it('returns the revealed plane of a location on another plane', () => {
    const snap = projectTemporalMap(def, 700, { planeId: 'mortal' });
    expect(planeSwitchForLocation(def, snap, 'lotus')).toBe('river');
  });

  it('returns null for same-plane, sealed-plane or unknown locations', () => {
    expect(planeSwitchForLocation(def, projectTemporalMap(def, 700), 'village')).toBeNull();
    expect(planeSwitchForLocation(def, projectTemporalMap(def, 100), 'lotus')).toBeNull();
    expect(planeSwitchForLocation(def, projectTemporalMap(def, 700), 'nowhere')).toBeNull();
  });
});

describe('keyToAtlasAction', () => {
  it('maps WASD, arrows, zoom keys, M and Escape', () => {
    expect(keyToAtlasAction('w')).toBe('pan-up');
    expect(keyToAtlasAction('ArrowDown')).toBe('pan-down');
    expect(keyToAtlasAction('A')).toBe('pan-left');
    expect(keyToAtlasAction('ArrowRight')).toBe('pan-right');
    expect(keyToAtlasAction('+')).toBe('zoom-in');
    expect(keyToAtlasAction('=')).toBe('zoom-in');
    expect(keyToAtlasAction('-')).toBe('zoom-out');
    expect(keyToAtlasAction('m')).toBe('toggle-waypoints');
    expect(keyToAtlasAction('Escape')).toBe('escape');
    expect(keyToAtlasAction('q')).toBeNull();
  });
});

describe('MapHudControls planes and waypoints', () => {
  it('renders the waypoint button with a count', () => {
    const html = renderToStaticMarkup(React.createElement(MapHudControls, {
      mode: 'atlas', onModeChange: () => {}, visibleLayers: layers, onToggleLayer: () => {},
      onZoomIn: () => {}, onZoomOut: () => {}, onResetZoom: () => {}, onRecenter: () => {},
      onOpenWaypoints: () => {}, waypointCount: 3,
    }));
    expect(html).toContain('data-testid="waypoints-btn"');
    expect(html).toContain('WAYPOINTS');
    expect(html).toContain('3');
  });
});

describe('RpgWorldAtlas wiring', () => {
  it('renders frame, minimap and hero-elsewhere chip from the projection', () => {
    const html = renderToStaticMarkup(React.createElement(RpgWorldAtlas, {
      mapDefinition: def, userChapter: 700, totalChapters: 2334, universeSlug: 'reverend-insanity', activePlaneId: 'mortal',
    }));
    expect(html).toContain('data-testid="atlas-frame"');
    expect(html).toContain('data-testid="atlas-minimap"');
    expect(html).toContain('HERO IN RIVER OF TIME');
    expect(html).toContain('Fang Yuan');
  });

  it('never names a sealed plane', () => {
    const html = renderToStaticMarkup(React.createElement(RpgWorldAtlas, {
      mapDefinition: def, userChapter: 100, universeSlug: 'reverend-insanity',
    }));
    expect(html).not.toContain('River of Time');
  });
});
