import { describe, it, expect, vi } from 'vitest';
import { CameraController } from '../src/engine/map/camera-controller';
import { PixiWorldRenderer } from '../src/engine/map/pixi-world-renderer';
import { ProjectedWorldMapSnapshot } from '../src/projections/temporal-map';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { getMapTheme } from '../src/domain/map-themes';
import { WorldMapDefinition } from '../src/domain/map-types';

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
    planeId: 'main',
    planes: [{ id: 'main', name: 'World', width: 1000, height: 1000, backdrop: 'void', isRevealed: true }],
    landmarkGlyphs: [],
    waypoints: [],
    heroPosition: { x: 200, y: 200, locationId: 'loc-qing-mao', planeId: 'main', chapter: 1 },
    rivers: [],
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

describe('PixiWorldRenderer v3 (retained, diff-driven)', () => {
  const def: WorldMapDefinition = {
    id: 'facade-map',
    universeId: 'reverend-insanity',
    coordinateSystem: 'world',
    width: 1000,
    height: 1000,
    planes: [
      { id: 'a', name: 'Plane A', width: 1000, height: 1000, revealedAtChapter: 0, backdrop: 'sea', order: 0 },
      { id: 'b', name: 'Plane B', width: 500, height: 400, revealedAtChapter: 0, backdrop: 'sky', order: 1 },
    ],
    terrain: [
      { id: 'land', type: 'forest', name: 'Land', polygon: [[50, 50], [950, 50], [950, 950], [50, 950]], planeId: 'a', edgeStyle: 'coast' },
      { id: 'cloud', type: 'void', name: 'Cloud', polygon: [[20, 20], [480, 20], [480, 380], [20, 380]], planeId: 'b' },
    ],
    regions: [{ id: 'r', name: 'Realm', geometry: { type: 'Polygon', coordinates: [[[50, 50], [950, 50], [950, 950], [50, 950]]] }, planeId: 'a' }],
    locations: [
      { id: 'l1', name: 'Start', x: 100, y: 100, type: 'village', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'a', waypoint: true },
      { id: 'l2', name: 'Mid', x: 500, y: 500, type: 'city', importance: 'major', firstAppearanceChapter: 20, revealedAtChapter: 20, planeId: 'a' },
      { id: 'l3', name: 'End', x: 900, y: 900, type: 'castle', importance: 'major', firstAppearanceChapter: 40, revealedAtChapter: 40, planeId: 'a' },
      { id: 'sky', name: 'Sky', x: 250, y: 200, type: 'temple', importance: 'critical', firstAppearanceChapter: 1, revealedAtChapter: 1, planeId: 'b' },
    ],
    routes: [],
    territories: [],
    events: [],
    characterPaths: [{ characterId: 'hero', characterName: 'Hero', waypoints: [
      { chapter: 1, locationId: 'l1', x: 100, y: 100 },
      { chapter: 20, locationId: 'l2', x: 500, y: 500 },
      { chapter: 40, locationId: 'l3', x: 900, y: 900 },
    ] }],
  };
  const riTheme = getMapTheme('reverend-insanity');

  it('coalesces rapid snapshots and commits only the newest', async () => {
    const r = new PixiWorldRenderer(null, { width: 800, height: 600 });
    const pending = Array.from({ length: 40 }, (_, i) =>
      r.applySnapshot(projectTemporalMap(def, i + 1, { planeId: 'a' }), riTheme)
    );
    await Promise.all(pending);
    expect(r.currentSnapshot?.userChapter).toBe(40);
    expect(r.commitCount).toBe(1);
  });

  it('switches planes with a full re-sync and refits the camera', async () => {
    const r = new PixiWorldRenderer(null, { width: 800, height: 600 });
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'b' }), riTheme);
    expect(r.currentSnapshot?.planeId).toBe('b');
    expect(r.camera.worldWidth).toBe(500);
    expect(r.camera.x).toBe(250);
    expect(r.layerSet!.markers.markers.has('sky')).toBe(true);
    expect(r.layerSet!.markers.markers.has('l1')).toBe(false);
  });

  it('reports newly discovered locations on forward scrubs only', async () => {
    const onDiscover = vi.fn();
    const r = new PixiWorldRenderer(null, { width: 800, height: 600, onDiscover });
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    expect(onDiscover).not.toHaveBeenCalled();
    await r.applySnapshot(projectTemporalMap(def, 45, { planeId: 'a' }), riTheme);
    expect(onDiscover).toHaveBeenCalledWith(['l2', 'l3']);
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    expect(onDiscover).toHaveBeenCalledTimes(1);
  });

  it('rebuilds layers when the theme changes', async () => {
    const r = new PixiWorldRenderer(null, { width: 800, height: 600 });
    const snap = projectTemporalMap(def, 10, { planeId: 'a' });
    await r.applySnapshot(snap, riTheme);
    const first = r.layerSet;
    await r.applySnapshot(snap, getMapTheme('one-piece'));
    expect(r.layerSet).not.toBe(first);
    expect(r.commitCount).toBe(2);
  });

  it('hovers and clicks locations through deterministic picking', async () => {
    const onHover = vi.fn();
    const onSelectLocation = vi.fn();
    const r = new PixiWorldRenderer(null, { width: 800, height: 600, onHover, onSelectLocation });
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    const screen = r.camera.worldToScreen(100, 100);
    r.hoverAt(screen.x, screen.y);
    expect(onHover).toHaveBeenLastCalledWith({ target: { kind: 'location', id: 'l1' }, screenX: screen.x, screenY: screen.y });
    expect(r.layerSet!.markers.hoveredId).toBe('l1');
    r.clickAt(screen.x, screen.y);
    expect(onSelectLocation).toHaveBeenCalledWith('l1');
  });

  it('hovers but never selects a KNOWN (uncharted) marker', async () => {
    const onHover = vi.fn();
    const onSelectLocation = vi.fn();
    const onSelectRegion = vi.fn();
    const withRumor: WorldMapDefinition = {
      ...def,
      locations: [
        ...def.locations,
        { id: 'rumor', name: 'Secret Name', x: 300, y: 300, type: 'city', importance: 'major', firstAppearanceChapter: 99, revealedAtChapter: 1, planeId: 'a' },
      ],
    };
    const r = new PixiWorldRenderer(null, { width: 800, height: 600, onHover, onSelectLocation, onSelectRegion });
    await r.applySnapshot(projectTemporalMap(withRumor, 10, { planeId: 'a' }), riTheme);
    const screen = r.camera.worldToScreen(300, 295);
    r.hoverAt(screen.x, screen.y);
    expect(onHover).toHaveBeenLastCalledWith({ target: { kind: 'location', id: 'rumor' }, screenX: screen.x, screenY: screen.y });
    r.clickAt(screen.x, screen.y);
    expect(onSelectLocation).not.toHaveBeenCalled();
    expect(onSelectRegion).not.toHaveBeenCalled();
  });

  it('clears hover when the hovered marker disappears after a scrub', async () => {
    const onHover = vi.fn();
    const r = new PixiWorldRenderer(null, { width: 800, height: 600, onHover });
    await r.applySnapshot(projectTemporalMap(def, 45, { planeId: 'a' }), riTheme);
    const screen = r.camera.worldToScreen(900, 900);
    r.hoverAt(screen.x, screen.y);
    expect(r.layerSet!.markers.hoveredId).toBe('l3');
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    expect(r.layerSet!.markers.hoveredId).toBeNull();
    expect(onHover.mock.calls[onHover.mock.calls.length - 1][0]?.target?.id).not.toBe('l3');
  });

  it('exposes the camera view and tears down cleanly', async () => {
    const r = new PixiWorldRenderer(null, { width: 800, height: 600 });
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    expect(r.getCameraView()).toMatchObject({ viewWidth: 800, viewHeight: 600, worldWidth: 1000, worldHeight: 1000 });
    expect(await r.getMinimapImage()).toBeNull();
    r.destroy();
    expect(r.layerSet).toBeNull();
  });

  it('recovers from a commit that throws without wedging the queue', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const r = new PixiWorldRenderer(null, { width: 800, height: 600 });
    const bakeSpy = vi.spyOn(r as any, 'bakeStatic');

    // 1. A healthy first commit
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    expect(r.commitCount).toBe(1);
    expect(bakeSpy).toHaveBeenCalledTimes(1);

    // 2. A same-plane (incremental) commit throws midway through the layer syncs
    const routesSync = vi.spyOn(r.layerSet!.routes, 'sync').mockImplementationOnce(() => {
      throw new Error('boom');
    });
    await r.applySnapshot(projectTemporalMap(def, 30, { planeId: 'a' }), riTheme);
    expect(consoleErrorSpy).toHaveBeenCalledWith('[PixiWorldRenderer] commit failed:', expect.any(Error));
    expect(r.commitCount).toBe(1);
    expect(r.currentSnapshot?.userChapter).toBe(10);
    expect(bakeSpy).toHaveBeenCalledTimes(1);
    expect((r as any).pendingFull).toBe(true);

    // 3. The next same-plane commit is upgraded to a full resync (re-bake) and succeeds
    await r.applySnapshot(projectTemporalMap(def, 30, { planeId: 'a' }), riTheme);
    expect(r.commitCount).toBe(2);
    expect(r.currentSnapshot?.userChapter).toBe(30);
    expect(bakeSpy).toHaveBeenCalledTimes(2);
    expect((r as any).pendingFull).toBe(false);

    routesSync.mockRestore();
    bakeSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('does not commit after destroy', async () => {
    const r = new PixiWorldRenderer(null, { width: 800, height: 600 });
    r.destroy();
    await r.applySnapshot(projectTemporalMap(def, 10, { planeId: 'a' }), riTheme);
    expect(r.commitCount).toBe(0);
  });
});
