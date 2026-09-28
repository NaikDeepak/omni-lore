import { describe, it, expect, vi } from 'vitest';
import { CameraController } from '../src/engine/map/camera-controller';
import { PixiWorldRenderer } from '../src/engine/map/pixi-world-renderer';
import { ProjectedWorldMapSnapshot } from '../src/projections/temporal-map';
import { getMapTheme } from '../src/domain/map-themes';

describe('Map Camera Controller', () => {
  it('initializes with default viewport center', () => {
    const cam = new CameraController({
      worldWidth: 1000,
      worldHeight: 1000,
      viewWidth: 800,
      viewHeight: 600,
    });
    expect(cam.zoom).toBe(1);
    expect(cam.x).toBe(400);
    expect(cam.y).toBe(300);
  });

  it('clamps zoom between min and max bounds', () => {
    const cam = new CameraController({
      worldWidth: 1000,
      worldHeight: 1000,
      viewWidth: 800,
      viewHeight: 600,
      minZoom: 0.5,
      maxZoom: 4,
    });
    cam.setZoom(10);
    expect(cam.zoom).toBe(4);
    cam.setZoom(0.1);
    expect(cam.zoom).toBe(0.5);
  });

  it('computes smooth interpolation coordinates during flyTo', () => {
    const cam = new CameraController({
      worldWidth: 1000,
      worldHeight: 1000,
      viewWidth: 800,
      viewHeight: 600,
    });
    cam.flyTo(500, 500, 2);
    expect(cam.isAnimating).toBe(true);
    cam.tick(16); // 1 frame
    expect(cam.isAnimating).toBe(true);

    // After ticking past total duration, animation finishes and reaches target
    cam.tick(1000);
    expect(cam.isAnimating).toBe(false);
    expect(cam.x).toBeCloseTo(500, 1);
    expect(cam.y).toBeCloseTo(500, 1);
    expect(cam.zoom).toBeCloseTo(2, 1);
  });

  it('supports pan and clamps within world boundaries', () => {
    const cam = new CameraController({
      worldWidth: 1000,
      worldHeight: 1000,
      viewWidth: 800,
      viewHeight: 600,
    });

    cam.pan(50, -50);
    expect(cam.x).toBe(450);
    expect(cam.y).toBe(250);

    // Pan beyond bounds
    cam.pan(2000, 2000);
    expect(cam.x).toBeLessThanOrEqual(1000);
    expect(cam.y).toBeLessThanOrEqual(1000);
  });

  it('converts between screen and world coordinates', () => {
    const cam = new CameraController({
      worldWidth: 1000,
      worldHeight: 1000,
      viewWidth: 800,
      viewHeight: 600,
    });

    // When centered at (400, 300) with zoom 1, screen center (400, 300) maps to world (400, 300)
    const worldCenter = cam.screenToWorld(400, 300);
    expect(worldCenter.x).toBeCloseTo(400);
    expect(worldCenter.y).toBeCloseTo(300);

    const screenPos = cam.worldToScreen(400, 300);
    expect(screenPos.x).toBeCloseTo(400);
    expect(screenPos.y).toBeCloseTo(300);
  });

  it('zooms relative to screen anchor point', () => {
    const cam = new CameraController({
      worldWidth: 1000,
      worldHeight: 1000,
      viewWidth: 800,
      viewHeight: 600,
    });

    // Zoom around screen point (200, 150)
    const beforeWorld = cam.screenToWorld(200, 150);
    cam.zoomAt(2, 200, 150);
    const afterWorld = cam.screenToWorld(200, 150);

    expect(afterWorld.x).toBeCloseTo(beforeWorld.x, 1);
    expect(afterWorld.y).toBeCloseTo(beforeWorld.y, 1);
  });
});

describe('PixiWorldRenderer', () => {
  const sampleSnapshot: ProjectedWorldMapSnapshot = {
    id: 'test-map',
    mapId: 'test-map',
    universeId: 'reverend-insanity',
    coordinateSystem: 'world',
    width: 1000,
    height: 1000,
    userChapter: 100,
    terrain: [
      {
        id: 'ter-1',
        name: 'Southern Plains',
        type: 'plains',
        polygon: [
          [0, 0],
          [500, 0],
          [500, 500],
          [0, 500],
        ],
      },
    ],
    regions: [
      {
        id: 'reg-southern',
        name: 'Southern Border',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [500, 0],
              [500, 500],
              [0, 500],
            ],
          ],
        },
      },
    ],
    locations: [
      {
        id: 'loc-qing-mao',
        name: 'Qing Mao Mountain',
        x: 200,
        y: 200,
        type: 'mountain',
        importance: 'critical',
        firstAppearanceChapter: 1,
        revealedAtChapter: 1,
        fogStatus: 'CURRENT',
        isCurrentPosition: true,
      },
    ],
    routes: [
      {
        id: 'route-caravan',
        name: 'Caravan Route',
        points: [
          [200, 200],
          [350, 350],
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
          [150, 150],
          [250, 150],
          [250, 250],
          [150, 250],
        ],
        controlPeriods: [{ fromChapter: 1, toChapter: 200, influencePct: 85 }],
        currentInfluencePct: 85,
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
      },
    ],
    characterPaths: [
      {
        characterId: 'char-fang-yuan',
        characterName: 'Fang Yuan',
        waypoints: [{ chapter: 1, locationId: 'loc-qing-mao', x: 200, y: 200 }],
      },
    ],
    discoveredCount: 1,
    totalLocationsCount: 1,
  };

  const theme = getMapTheme('reverend-insanity');

  it('instantiates cleanly with 9 discrete scene graph containers', () => {
    const renderer = new PixiWorldRenderer(null, {
      width: 800,
      height: 600,
    });

    expect(renderer.backgroundContainer).toBeDefined();
    expect(renderer.terrainContainer).toBeDefined();
    expect(renderer.regionsContainer).toBeDefined();
    expect(renderer.routesContainer).toBeDefined();
    expect(renderer.characterPathContainer).toBeDefined();
    expect(renderer.markersContainer).toBeDefined();
    expect(renderer.fogContainer).toBeDefined();
    expect(renderer.atmosphereContainer).toBeDefined();
    expect(renderer.labelsContainer).toBeDefined();
  });

  it('renders snapshot elements into layer containers', async () => {
    const onSelectLoc = vi.fn();
    const renderer = new PixiWorldRenderer(null, {
      width: 800,
      height: 600,
      onSelectLocation: onSelectLoc,
    });

    await renderer.renderSnapshot(sampleSnapshot, theme, { mode: 'ATLAS' });

    // Terrain container should have graphics
    expect(renderer.terrainContainer.children.length).toBeGreaterThan(0);

    // Markers container should have children
    expect(renderer.markersContainer.children.length).toBeGreaterThan(0);

    // Regions container should have children
    expect(renderer.regionsContainer.children.length).toBeGreaterThan(0);

    // Labels container should have text
    expect(renderer.labelsContainer.children.length).toBeGreaterThan(0);
  });

  it('toggles visibility of layers', () => {
    const renderer = new PixiWorldRenderer(null, {
      width: 800,
      height: 600,
    });

    renderer.toggleLayer('fogOfWar', false);
    expect(renderer.fogContainer.visible).toBe(false);

    renderer.toggleLayer('fogOfWar', true);
    expect(renderer.fogContainer.visible).toBe(true);

    renderer.toggleLayer('fogOfWar');
    expect(renderer.fogContainer.visible).toBe(false);
  });

  it('updates mode and delegates flyTo to camera controller', () => {
    const renderer = new PixiWorldRenderer(null, {
      width: 800,
      height: 600,
    });

    renderer.setMode('ADVENTURE');
    expect(renderer.mode).toBe('adventure');

    renderer.flyTo(200, 200, 1.5, 300);
    expect(renderer.camera.isAnimating).toBe(true);
  });

  it('destroys safely without throwing', () => {
    const renderer = new PixiWorldRenderer(null, {
      width: 800,
      height: 600,
    });

    expect(() => renderer.destroy(true)).not.toThrow();
  });
});
