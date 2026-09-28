import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RpgWorldAtlas } from '../src/components/map/RpgWorldAtlas';
import { MapHudControls, PlaneOption } from '../src/components/map/MapHudControls';
import { MapTimelineBar } from '../src/components/map/MapTimelineBar';
import { MapLocationDrawer } from '../src/components/map/MapLocationDrawer';
import { WorldMapDefinition, MapVisibleLayers, MapLocation, MapRegion, MapEvent } from '../src/domain/map-types';
import { getMapTheme } from '../src/domain/map-themes';

const mockMapDefinition: WorldMapDefinition = {
  id: 'reverend-insanity-five-regions',
  universeId: 'reverend-insanity',
  coordinateSystem: 'world',
  width: 1200,
  height: 900,
  terrain: [
    {
      id: 'ter-southern',
      name: 'Southern Mountain Range',
      type: 'mountain',
      polygon: [
        [100, 100],
        [400, 100],
        [400, 400],
        [100, 400],
      ],
    },
  ],
  regions: [
    {
      id: 'reg-southern-border',
      name: 'Southern Border',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [100, 100],
            [400, 100],
            [400, 400],
            [100, 400],
          ],
        ],
      },
    },
  ],
  locations: [
    {
      id: 'loc-qing-mao',
      name: 'Qing Mao Mountain',
      x: 250,
      y: 250,
      type: 'mountain',
      importance: 'critical',
      firstAppearanceChapter: 1,
      revealedAtChapter: 1,
      description: 'Home of Gu Yue Clan, Bai Clan, and Xiong Clan.',
      controllingFactionId: 'fac-gu-yue',
    },
    {
      id: 'loc-shang-clan-city',
      name: 'Shang Clan City',
      x: 500,
      y: 500,
      type: 'city',
      importance: 'major',
      firstAppearanceChapter: 150,
      revealedAtChapter: 50,
      description: 'Commerce capital of Southern Border.',
      controllingFactionId: 'fac-shang-clan',
    },
  ],
  routes: [
    {
      id: 'route-southern-trade',
      name: 'Southern Merchant Trail',
      points: [
        [250, 250],
        [500, 500],
      ],
      routeType: 'road',
      visibleFromChapter: 1,
    },
  ],
  territories: [
    {
      factionId: 'fac-gu-yue',
      name: 'Gu Yue Clan Sphere',
      boundary: [
        [200, 200],
        [300, 200],
        [300, 300],
        [200, 300],
      ],
      controlPeriods: [
        {
          fromChapter: 1,
          toChapter: 200,
          influencePct: 90,
        },
      ],
    },
  ],
  events: [
    {
      id: 'ev-awakening',
      name: 'Gu Awakening Ceremony',
      chapter: 15,
      locationId: 'loc-qing-mao',
      eventType: 'breakthrough',
      importance: 'critical',
      description: 'Fang Yuan awakens Grade C aptitude and starts cultivation.',
    },
    {
      id: 'ev-spring-autumn-rebirth',
      name: 'Spring Autumn Cicada Rebirth',
      chapter: 1,
      locationId: 'loc-qing-mao',
      eventType: 'breakthrough',
      importance: 'critical',
      description: '500-year old demonic venerable reborn into youth.',
    },
  ],
  characterPaths: [
    {
      characterId: 'char-fang-yuan',
      characterName: 'Fang Yuan',
      waypoints: [
        { chapter: 1, locationId: 'loc-qing-mao', x: 250, y: 250, note: 'Rebirth' },
        { chapter: 150, locationId: 'loc-shang-clan-city', x: 500, y: 500, note: 'Shang Clan' },
      ],
    },
  ],
};

const defaultLayers: MapVisibleLayers = {
  terrain: true,
  regions: true,
  routes: true,
  territories: true,
  markers: true,
  events: true,
  characterPaths: true,
  fogOfWar: true,
  labels: true,
};

describe('MapHudControls Component', () => {
  it('exports valid component and renders all 3 modes', () => {
    expect(MapHudControls).toBeDefined();

    const onModeChange = vi.fn();
    const onToggleLayer = vi.fn();
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onResetZoom = vi.fn();
    const onRecenter = vi.fn();

    const html = renderToStaticMarkup(
      React.createElement(MapHudControls, {
        mode: 'atlas',
        onModeChange,
        visibleLayers: defaultLayers,
        onToggleLayer,
        onZoomIn,
        onZoomOut,
        onResetZoom,
        onRecenter,
      })
    );

    expect(html).toContain('ATLAS');
    expect(html).toContain('ADVENTURE');
    expect(html).toContain('LORE');
    expect(html).toContain('LAYERS');
    expect(html).toContain('1.0x');
  });

  it('renders cosmological plane options when provided', () => {
    const planes: PlaneOption[] = [
      { id: 'five-regions', name: 'Five Regions' },
      { id: 'blessed-lands', name: 'Blessed Lands' },
      { id: 'river-of-time', name: 'River of Time' },
    ];

    const html = renderToStaticMarkup(
      React.createElement(MapHudControls, {
        mode: 'adventure',
        onModeChange: vi.fn(),
        visibleLayers: defaultLayers,
        onToggleLayer: vi.fn(),
        onZoomIn: vi.fn(),
        onZoomOut: vi.fn(),
        onResetZoom: vi.fn(),
        onRecenter: vi.fn(),
        planes,
        activePlaneId: 'five-regions',
      })
    );

    expect(html).toContain('Five Regions');
  });
});

describe('MapTimelineBar Component', () => {
  it('exports valid component and renders chapter rail with event markers', () => {
    expect(MapTimelineBar).toBeDefined();

    const onChapterChange = vi.fn();

    const html = renderToStaticMarkup(
      React.createElement(MapTimelineBar, {
        currentChapter: 50,
        totalChapters: 2334,
        onChapterChange,
        events: mockMapDefinition.events,
        activeCharacterName: 'Fang Yuan',
      })
    );

    expect(html).toContain('Fang Yuan');
    expect(html).toContain('CHAPTER');
    expect(html).toContain('50');
    expect(html).toContain('2334');
    expect(html).toContain('1x');
    expect(html).toContain('2x');
    expect(html).toContain('5x');
  });
});

describe('MapLocationDrawer Component', () => {
  it('does not render when no entity is selected', () => {
    const html = renderToStaticMarkup(
      React.createElement(MapLocationDrawer, {
        location: null,
        userChapter: 100,
        onClose: vi.fn(),
      })
    );

    expect(html).toBe('');
  });

  it('renders detailed landmark dossier when location is selected', () => {
    const location = mockMapDefinition.locations[0];
    const onClose = vi.fn();
    const onShowOnLadder = vi.fn();
    const onShowInRoster = vi.fn();

    const html = renderToStaticMarkup(
      React.createElement(MapLocationDrawer, {
        location: {
          ...location,
          fogStatus: 'CURRENT',
        },
        userChapter: 100,
        onClose,
        onShowOnLadder,
        onShowInRoster,
        allEvents: mockMapDefinition.events,
        characterPaths: mockMapDefinition.characterPaths,
      })
    );

    expect(html).toContain('Qing Mao Mountain');
    expect(html).toContain('LOCATION: MOUNTAIN');
    expect(html).toContain('COORDINATES: (250, 250)');
    expect(html).toContain('EX-RANK FORBIDDEN APEX');
    expect(html).toContain('Gu Yue Clan');
    expect(html).toContain('CANONICAL TRAVELERS');
    expect(html).toContain('Fang Yuan');
    expect(html).toContain('HISTORIC CHRONICLES');
    expect(html).toContain('Spring Autumn Cicada Rebirth');
    expect(html).toContain('SHOW ON LADDER');
    expect(html).toContain('SHOW IN ROSTER');
  });

  it('renders regional drawer when region is selected', () => {
    const region = mockMapDefinition.regions[0];

    const html = renderToStaticMarkup(
      React.createElement(MapLocationDrawer, {
        region,
        userChapter: 100,
        onClose: vi.fn(),
      })
    );

    expect(html).toContain('Southern Border');
    expect(html).toContain('GEOGRAPHIC REGION');
  });
});

describe('RpgWorldAtlas Component', () => {
  it('exports valid React component', () => {
    expect(RpgWorldAtlas).toBeDefined();
    expect(typeof RpgWorldAtlas).toBe('function');
  });

  it('renders full atlas layout with canvas, HUD controls, scanlines and timeline bar', () => {
    const html = renderToStaticMarkup(
      React.createElement(RpgWorldAtlas, {
        mapDefinition: mockMapDefinition,
        userChapter: 100,
        totalChapters: 2334,
        universeSlug: 'reverend-insanity',
      })
    );

    // Canvas element
    expect(html).toContain('<canvas');
    expect(html).toContain('data-testid="rpg-atlas-canvas"');

    // Scanlines & Vignette overlay
    expect(html).toContain('pointer-events-none');

    // HUD Mode controls
    expect(html).toContain('ATLAS');
    expect(html).toContain('ADVENTURE');
    expect(html).toContain('LORE');

    // Timeline bar
    expect(html).toContain('CHAPTER');
    expect(html).toContain('100');
    expect(html).toContain('2334');
    expect(html).toContain('Fang Yuan');
  });

  it('accepts custom theme and initial mode', () => {
    const customTheme = getMapTheme('solo-leveling');
    const html = renderToStaticMarkup(
      React.createElement(RpgWorldAtlas, {
        mapDefinition: mockMapDefinition,
        userChapter: 50,
        theme: customTheme,
        initialMode: 'adventure',
      })
    );

    expect(html).toContain('ADVENTURE');
    expect(html).toContain('<canvas');
  });
});
