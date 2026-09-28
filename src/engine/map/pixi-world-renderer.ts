/**
 * OmniLore Map Engine v2 - PixiJS World Renderer
 *
 * Implements a 9-layer isolated scene graph using PixiJS v8:
 *  1. backgroundContainer: Map boundary, coordinate grid, background fill
 *  2. terrainContainer: Filled vector polygons for mountains, plains, ocean, etc.
 *  3. regionsContainer: GeoJSON polygon boundaries and faction territory spheres
 *  4. routesContainer: Polyline roads, maritime sea lanes, flight paths
 *  5. characterPathContainer: Sliced zero-spoiler protagonist journey routes
 *  6. markersContainer: Multi-shape interactive landmark & event glyphs
 *  7. fogContainer: Fog of War overlay with discovered circular apertures
 *  8. atmosphereContainer: Animated atmospheric particle motes
 *  9. labelsContainer: Crisp typography labels with level-of-detail scaling
 *
 * Client-side safe: Supports SSR/test environments without WebGL context.
 */

import { Application, Container, Graphics, Text } from 'pixi.js';
import { CameraController } from './camera-controller';
import {
  ProjectedWorldMapSnapshot,
  ProjectedLocation,
  FogStatus,
} from '../../projections/temporal-map';
import { MapTheme } from '../../domain/map-themes';
import { MapMode, MapVisibleLayers } from '../../domain/map-types';

export interface PixiWorldRendererOptions {
  width: number;
  height: number;
  mode?: MapMode | 'ATLAS' | 'ADVENTURE' | 'LORE' | string;
  onSelectLocation?: (id: string) => void;
  onSelectRegion?: (id: string) => void;
  onSelectEvent?: (id: string) => void;
}

export interface RenderSnapshotOptions {
  mode?: MapMode | 'ATLAS' | 'ADVENTURE' | 'LORE' | string;
  activeLayers?: Set<string> | MapVisibleLayers | Record<string, boolean>;
  includeUnknown?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

export class PixiWorldRenderer {
  public readonly camera: CameraController;
  public readonly worldContainer: Container;

  // 9 isolated scene graph layer containers
  public readonly backgroundContainer: Container;
  public readonly terrainContainer: Container;
  public readonly regionsContainer: Container;
  public readonly routesContainer: Container;
  public readonly characterPathContainer: Container;
  public readonly markersContainer: Container;
  public readonly fogContainer: Container;
  public readonly atmosphereContainer: Container;
  public readonly labelsContainer: Container;

  public app: Application | null = null;
  public mode: MapMode = 'atlas';

  public onSelectLocation?: (id: string) => void;
  public onSelectRegion?: (id: string) => void;
  public onSelectEvent?: (id: string) => void;

  private canvas: HTMLCanvasElement | null = null;
  private isDestroyed = false;
  private isDragging = false;
  private lastDragX = 0;
  private lastDragY = 0;

  private latestSnapshot: ProjectedWorldMapSnapshot | null = null;
  private latestTheme: MapTheme | null = null;
  private latestOptions: RenderSnapshotOptions | null = null;

  private particles: Particle[] = [];
  private particleGraphics: Graphics | null = null;
  private animationFrameId: number | null = null;
  private lastTickTime = 0;

  constructor(canvas: HTMLCanvasElement | null, options: PixiWorldRendererOptions) {
    this.canvas = canvas;
    this.onSelectLocation = options.onSelectLocation;
    this.onSelectRegion = options.onSelectRegion;
    this.onSelectEvent = options.onSelectEvent;

    if (options.mode) {
      this.mode = options.mode.toLowerCase() as MapMode;
    }

    // Initialize Camera Controller
    this.camera = new CameraController({
      worldWidth: options.width,
      worldHeight: options.height,
      viewWidth: options.width,
      viewHeight: options.height,
    });

    // Root world container scaled & translated by camera
    this.worldContainer = new Container();

    // Instantiate 9 discrete layer containers
    this.backgroundContainer = new Container();
    this.terrainContainer = new Container();
    this.regionsContainer = new Container();
    this.routesContainer = new Container();
    this.characterPathContainer = new Container();
    this.markersContainer = new Container();
    this.fogContainer = new Container();
    this.atmosphereContainer = new Container();
    this.labelsContainer = new Container();

    // Assemble layer stack
    this.worldContainer.addChild(this.backgroundContainer);
    this.worldContainer.addChild(this.terrainContainer);
    this.worldContainer.addChild(this.regionsContainer);
    this.worldContainer.addChild(this.routesContainer);
    this.worldContainer.addChild(this.characterPathContainer);
    this.worldContainer.addChild(this.markersContainer);
    this.worldContainer.addChild(this.fogContainer);
    this.worldContainer.addChild(this.atmosphereContainer);
    this.worldContainer.addChild(this.labelsContainer);

    this.syncCameraTransform();

    // Initialize Pixi Application if running in browser with canvas
    if (typeof window !== 'undefined' && canvas) {
      this.initPixiApp(canvas, options.width, options.height);
      this.attachCanvasListeners(canvas);
      this.startRenderLoop();
    }
  }

  /**
   * Asynchronous PixiJS Application initialization
   */
  private async initPixiApp(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    try {
      this.app = new Application();
      await this.app.init({
        canvas,
        width,
        height,
        antialias: true,
        autoDensity: true,
        resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
        backgroundColor: 0x05070f,
      });

      if (!this.isDestroyed && this.app) {
        this.app.stage.addChild(this.worldContainer);
      }
    } catch (e) {
      // In SSR or unsupported test context, fallback gracefully
      console.warn('[PixiWorldRenderer] WebGL initialization skipped:', e);
    }
  }

  /**
   * Set display mode ('atlas' | 'adventure' | 'lore')
   */
  public setMode(mode: MapMode | 'ATLAS' | 'ADVENTURE' | 'LORE' | string, triggerRender: boolean = true): void {
    this.mode = mode.toLowerCase() as MapMode;
    if (triggerRender && this.latestSnapshot && this.latestTheme) {
      this.renderSnapshot(this.latestSnapshot, this.latestTheme, {
        ...this.latestOptions,
        mode: this.mode,
      });
    }
  }

  /**
   * Toggle visibility of a specific layer
   */
  public toggleLayer(layerName: string, visible?: boolean): void {
    const targetLayer = layerName.toLowerCase();
    const setVis = (c: Container) => {
      c.visible = visible !== undefined ? visible : !c.visible;
    };

    switch (targetLayer) {
      case 'background':
        setVis(this.backgroundContainer);
        break;
      case 'terrain':
        setVis(this.terrainContainer);
        break;
      case 'regions':
      case 'territories':
        setVis(this.regionsContainer);
        break;
      case 'routes':
        setVis(this.routesContainer);
        break;
      case 'characterpaths':
      case 'characterpath':
      case 'paths':
        setVis(this.characterPathContainer);
        break;
      case 'markers':
      case 'locations':
      case 'events':
        setVis(this.markersContainer);
        break;
      case 'fog':
      case 'fogofwar':
        setVis(this.fogContainer);
        break;
      case 'atmosphere':
      case 'particles':
        setVis(this.atmosphereContainer);
        break;
      case 'labels':
        setVis(this.labelsContainer);
        break;
    }
  }

  /**
   * Cinematic camera transition
   */
  public flyTo(
    targetX: number,
    targetY: number,
    targetZoom?: number,
    durationMs: number = 500
  ): void {
    this.camera.flyTo(targetX, targetY, targetZoom, durationMs);
  }

  /**
   * Render Projected Snapshot with Universe Theme
   */
  public async renderSnapshot(
    snapshot: ProjectedWorldMapSnapshot,
    theme: MapTheme,
    options?: RenderSnapshotOptions
  ): Promise<void> {
    this.latestSnapshot = snapshot;
    this.latestTheme = theme;
    this.latestOptions = options || {};

    if (options?.mode) {
      this.mode = options.mode.toLowerCase() as MapMode;
    }

    // Sync camera bounds
    this.camera.worldWidth = snapshot.width;
    this.camera.worldHeight = snapshot.height;

    // Apply active layer filter if specified
    if (options?.activeLayers) {
      this.applyActiveLayers(options.activeLayers);
    }

    // Clear all containers
    this.clearAllContainers();

    // 1. Background Container
    this.drawBackground(snapshot, theme);

    // 2. Terrain Container
    this.drawTerrain(snapshot, theme);

    // 3. Regions & Faction Territories
    this.drawRegionsAndTerritories(snapshot, theme);

    // 4. Routes Container
    this.drawRoutes(snapshot, theme);

    // 5. Character Paths
    this.drawCharacterPaths(snapshot, theme);

    // 6. Markers & Lore Events
    this.drawMarkersAndEvents(snapshot, theme);

    // 7. Fog of War
    this.drawFogOfWar(snapshot, theme);

    // 8. Atmospheric Particles
    this.initAtmosphere(snapshot, theme);

    // 9. Text Labels
    this.drawLabels(snapshot, theme);

    this.syncCameraTransform();
  }

  private clearContainerAndDestroyChildren(container: Container): void {
    const children = container.removeChildren();
    for (const child of children) {
      try {
        child.destroy({ children: true });
      } catch {
        // Fallback for mock environments
      }
    }
  }

  private clearAllContainers(): void {
    this.clearContainerAndDestroyChildren(this.backgroundContainer);
    this.clearContainerAndDestroyChildren(this.terrainContainer);
    this.clearContainerAndDestroyChildren(this.regionsContainer);
    this.clearContainerAndDestroyChildren(this.routesContainer);
    this.clearContainerAndDestroyChildren(this.characterPathContainer);
    this.clearContainerAndDestroyChildren(this.markersContainer);
    this.clearContainerAndDestroyChildren(this.fogContainer);
    this.clearContainerAndDestroyChildren(this.atmosphereContainer);
    this.clearContainerAndDestroyChildren(this.labelsContainer);
  }

  private applyActiveLayers(activeLayers: Set<string> | MapVisibleLayers | Record<string, boolean>): void {
    const isVisible = (layer: string): boolean => {
      if (activeLayers instanceof Set) {
        return activeLayers.has(layer);
      }
      return (activeLayers as Record<string, boolean>)[layer] ?? true;
    };

    this.terrainContainer.visible = isVisible('terrain');
    this.regionsContainer.visible = isVisible('regions') || isVisible('territories');
    this.routesContainer.visible = isVisible('routes');
    this.characterPathContainer.visible = isVisible('characterPaths');
    this.markersContainer.visible = isVisible('markers') || isVisible('locations');
    this.fogContainer.visible = isVisible('fog') || isVisible('fogOfWar');
    this.atmosphereContainer.visible = isVisible('atmosphere') || isVisible('particles');
    this.labelsContainer.visible = isVisible('labels');
  }

  /**
   * 1. Draw World Background & Grid
   */
  private drawBackground(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    const g = new Graphics();
    const bgCol = theme.palette.background || '#0a1024';

    // Canvas background
    g.rect(0, 0, snapshot.width, snapshot.height).fill(bgCol);

    // Subtle coordinate grid
    const gridCol = theme.palette.gridColor || 'rgba(255, 255, 255, 0.08)';
    const gridSize = 100;

    for (let x = 0; x <= snapshot.width; x += gridSize) {
      g.moveTo(x, 0).lineTo(x, snapshot.height).stroke({ color: gridCol, width: 1, alpha: 0.4 });
    }
    for (let y = 0; y <= snapshot.height; y += gridSize) {
      g.moveTo(0, y).lineTo(snapshot.width, y).stroke({ color: gridCol, width: 1, alpha: 0.4 });
    }

    // Outer Map Border
    const borderCol = theme.palette.primaryAccent || '#f59e0b';
    g.rect(0, 0, snapshot.width, snapshot.height).stroke({ color: borderCol, width: 2, alpha: 0.8 });

    this.backgroundContainer.addChild(g);
  }

  /**
   * 2. Draw Vector Terrain Polygons
   */
  private drawTerrain(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    if (!snapshot.terrain || snapshot.terrain.length === 0) return;

    for (const terrain of snapshot.terrain) {
      if (!terrain.polygon || terrain.polygon.length < 3) continue;

      const g = new Graphics();
      const flatPoints: number[] = [];
      for (const [px, py] of terrain.polygon) {
        flatPoints.push(px, py);
      }

      let fillColor = terrain.colorOverride;
      if (!fillColor) {
        switch (terrain.type) {
          case 'ocean':
            fillColor = (theme.palette.seaColor as string) || '#0a1024';
            break;
          case 'river':
            fillColor = theme.palette.routeColor || '#38bdf8';
            break;
          case 'mountain':
            fillColor = (theme.palette.mountainColor as string) || '#2a3b63';
            break;
          case 'forest':
            fillColor = '#0f3824';
            break;
          case 'desert':
            fillColor = '#664a1e';
            break;
          case 'swamp':
            fillColor = '#1e3328';
            break;
          case 'ice':
            fillColor = '#60a5fa';
            break;
          case 'volcanic':
            fillColor = '#7f1d1d';
            break;
          case 'void':
            fillColor = '#1e1b4b';
            break;
          case 'plains':
          default:
            fillColor = (theme.palette.landColor as string) || '#17233d';
            break;
        }
      }

      g.poly(flatPoints).fill({ color: fillColor, alpha: 0.85 });
      g.poly(flatPoints).stroke({ color: theme.palette.primaryAccent, width: 1, alpha: 0.3 });

      this.terrainContainer.addChild(g);
    }
  }

  /**
   * 3. Draw Regions and Faction Spheres of Influence
   */
  private drawRegionsAndTerritories(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    // Geographic Regions
    for (const region of snapshot.regions || []) {
      const g = new Graphics();
      const geom = region.geometry;

      const drawPolygonRings = (rings: number[][][]) => {
        for (const ring of rings) {
          const flat = ring.flat();
          if (flat.length >= 6) {
            g.poly(flat).fill({ color: theme.palette.primaryAccent, alpha: 0.08 });
            g.poly(flat).stroke({ color: theme.palette.primaryAccent, width: 1.5, alpha: 0.6 });
          }
        }
      };

      if (geom.type === 'Polygon') {
        drawPolygonRings(geom.coordinates as number[][][]);
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates as number[][][][]) {
          drawPolygonRings(poly);
        }
      }

      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onSelectRegion?.(region.id);
      });

      this.regionsContainer.addChild(g);
    }

    // Faction Spheres of Influence
    for (const territory of snapshot.territories || []) {
      if (!territory.boundary || territory.boundary.length < 3) continue;

      const g = new Graphics();
      const flat = territory.boundary.flat();
      const alpha = (territory.currentInfluencePct / 100) * (theme.palette.territoryAlpha ?? 0.22);
      const color = theme.palette.secondaryAccent || theme.palette.primaryAccent;

      g.poly(flat).fill({ color, alpha });
      g.poly(flat).stroke({ color, width: 1, alpha: Math.min(1, alpha * 2) });

      this.regionsContainer.addChild(g);
    }
  }

  /**
   * 4. Draw Travel Routes
   */
  private drawRoutes(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    for (const route of snapshot.routes || []) {
      if (!route.points || route.points.length < 2) continue;

      const g = new Graphics();
      const color = theme.palette.routeColor || theme.palette.primaryAccent;
      const strokeWidth = route.routeType === 'flight' || route.routeType === 'portal' ? 2 : 1.5;

      g.moveTo(route.points[0][0], route.points[0][1]);
      for (let i = 1; i < route.points.length; i++) {
        g.lineTo(route.points[i][0], route.points[i][1]);
      }
      g.stroke({ color, width: strokeWidth, alpha: 0.75 });

      this.routesContainer.addChild(g);
    }
  }

  /**
   * 5. Draw Protagonist Character Paths
   */
  private drawCharacterPaths(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    const isAdventure = this.mode === 'adventure';

    for (const path of snapshot.characterPaths || []) {
      if (!path.waypoints || path.waypoints.length === 0) continue;

      const g = new Graphics();
      const pathColor = theme.palette.secondaryAccent || theme.palette.primaryAccent;
      const lineWidth = isAdventure ? 3 : 2;

      if (path.waypoints.length > 1) {
        g.moveTo(path.waypoints[0].x, path.waypoints[0].y);
        for (let i = 1; i < path.waypoints.length; i++) {
          g.lineTo(path.waypoints[i].x, path.waypoints[i].y);
        }
        g.stroke({ color: pathColor, width: lineWidth, alpha: 0.9 });
      }

      // Draw waypoints
      for (let i = 0; i < path.waypoints.length; i++) {
        const wp = path.waypoints[i];
        const isLatest = i === path.waypoints.length - 1;

        if (isLatest) {
          // Beacon for current character position
          g.circle(wp.x, wp.y, 8).stroke({ color: '#ffffff', width: 2, alpha: 0.9 });
          g.circle(wp.x, wp.y, 4).fill('#ffffff');
        } else {
          g.circle(wp.x, wp.y, 2.5).fill(pathColor);
        }
      }

      this.characterPathContainer.addChild(g);
    }
  }

  /**
   * 6. Draw Landmark Markers and Historical Events
   */
  private drawMarkersAndEvents(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    const markerShape = theme.markerStyle.shape || 'diamond';
    const defaultSize = theme.markerStyle.defaultSize || 8;
    const criticalSize = theme.markerStyle.criticalSize || 14;

    // Draw Locations
    for (const loc of snapshot.locations || []) {
      if (loc.fogStatus === FogStatus.UNKNOWN) continue;

      const g = new Graphics();
      const isCritical = loc.importance === 'critical';
      const size = isCritical ? criticalSize : defaultSize;

      let color = theme.palette.primaryAccent;
      let alpha = 0.9;

      if (loc.isCurrentPosition || loc.fogStatus === FogStatus.CURRENT) {
        color = '#ffffff';
        alpha = 1.0;
      } else if (loc.fogStatus === FogStatus.KNOWN) {
        alpha = 0.4;
      }

      // Draw geometric shape
      if (markerShape === 'diamond') {
        const half = size / 2;
        g.poly([
          loc.x, loc.y - half,
          loc.x + half, loc.y,
          loc.x, loc.y + half,
          loc.x - half, loc.y,
        ]).fill({ color, alpha });
        g.poly([
          loc.x, loc.y - half,
          loc.x + half, loc.y,
          loc.x, loc.y + half,
          loc.x - half, loc.y,
        ]).stroke({ color: '#ffffff', width: 1, alpha: 0.8 });
      } else {
        // Circle default
        g.circle(loc.x, loc.y, size / 2).fill({ color, alpha });
        g.circle(loc.x, loc.y, size / 2).stroke({ color: '#ffffff', width: 1, alpha: 0.8 });
      }

      // Current station pulsating outer ring
      if (loc.isCurrentPosition) {
        g.circle(loc.x, loc.y, size + 2).stroke({
          color: theme.palette.primaryAccent,
          width: 2,
          alpha: 0.7,
        });
      }

      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onSelectLocation?.(loc.id);
      });

      this.markersContainer.addChild(g);
    }

    // Draw Lore Events
    for (const ev of snapshot.events || []) {
      let evX = 0;
      let evY = 0;

      if (ev.locationId) {
        const matchedLoc = snapshot.locations.find((l) => l.id === ev.locationId);
        if (matchedLoc) {
          evX = matchedLoc.x;
          evY = matchedLoc.y - 12;
        }
      }

      if (evX === 0 && evY === 0) continue;

      const g = new Graphics();
      const evColor = theme.palette.secondaryAccent || '#dc2626';

      // Event Star/Cross glyph
      g.rect(evX - 4, evY - 4, 8, 8).fill(evColor);
      g.rect(evX - 4, evY - 4, 8, 8).stroke({ color: '#ffffff', width: 1 });

      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.on('pointerdown', (e) => {
        e.stopPropagation();
        this.onSelectEvent?.(ev.id);
      });

      this.markersContainer.addChild(g);
    }
  }

  /**
   * 7. Draw Fog of War Mask with Circular Discovery Apertures
   */
  private drawFogOfWar(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    const fogCol = theme.fogStyle.color || '#020705';
    const fogAlpha = theme.fogStyle.opacity ?? 0.85;

    const g = new Graphics();

    // Fill world rectangle with fog
    g.rect(0, 0, snapshot.width, snapshot.height);

    // Punch out holes for discovered locations
    for (const loc of snapshot.locations || []) {
      if (
        loc.fogStatus === FogStatus.CURRENT ||
        loc.fogStatus === FogStatus.DISCOVERED ||
        loc.fogStatus === FogStatus.REVEALED
      ) {
        const radius = loc.importance === 'critical' ? 70 : 45;
        g.cut();
        g.circle(loc.x, loc.y, radius);
      }
    }

    // Also punch out apertures along character waypoints
    for (const path of snapshot.characterPaths || []) {
      for (const wp of path.waypoints || []) {
        g.cut();
        g.circle(wp.x, wp.y, 50);
      }
    }

    g.fill({ color: fogCol, alpha: fogAlpha });
    this.fogContainer.addChild(g);
  }

  /**
   * 8. Initialize Atmospheric Particles
   */
  private initAtmosphere(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    if (!theme.atmosphereParticles) return;

    const count = theme.atmosphereParticles.count || 25;
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * snapshot.width,
        y: Math.random() * snapshot.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    this.particleGraphics = new Graphics();
    this.atmosphereContainer.addChild(this.particleGraphics);
    this.updateParticles();
  }

  private updateParticles(): void {
    if (!this.particleGraphics || !this.latestTheme?.atmosphereParticles) return;

    this.particleGraphics.clear();
    const col = this.latestTheme.atmosphereParticles.color || '#10b981';

    for (const p of this.particles) {
      this.particleGraphics.circle(p.x, p.y, p.size).fill({ color: col, alpha: p.alpha });
    }
  }

  /**
   * 9. Draw Retro Typography Labels
   */
  private drawLabels(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    const textColor = theme.palette.textColor || '#ffffff';

    for (const loc of snapshot.locations || []) {
      if (loc.fogStatus === FogStatus.UNKNOWN || loc.fogStatus === FogStatus.KNOWN) continue;

      const isCritical = loc.importance === 'critical';
      const label = new Text({
        text: loc.name,
        style: {
          fontFamily: 'monospace',
          fontSize: isCritical ? 11 : 9,
          fill: textColor,
          align: 'center',
        },
      });

      label.anchor.set(0.5, 0);
      label.position.set(loc.x, loc.y + 8);

      this.labelsContainer.addChild(label);
    }
  }

  /**
   * Synchronize World Container matrix with Camera Controller
   */
  public syncCameraTransform(): void {
    this.worldContainer.scale.set(this.camera.zoom);
    this.worldContainer.position.set(
      this.camera.viewWidth / 2 - this.camera.x * this.camera.zoom,
      this.camera.viewHeight / 2 - this.camera.y * this.camera.zoom
    );
  }

  /**
   * Render and animation tick loop
   */
  private startRenderLoop(): void {
    const tick = (now: number) => {
      if (this.isDestroyed) return;

      const dt = this.lastTickTime === 0 ? 16 : Math.min(64, now - this.lastTickTime);
      this.lastTickTime = now;

      // Camera animation interpolation
      if (this.camera.isAnimating) {
        this.camera.tick(dt);
        this.syncCameraTransform();
      }

      // Particle simulation drift
      if (this.particles.length > 0 && this.latestSnapshot) {
        for (const p of this.particles) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = this.latestSnapshot.width;
          if (p.x > this.latestSnapshot.width) p.x = 0;
          if (p.y < 0) p.y = this.latestSnapshot.height;
          if (p.y > this.latestSnapshot.height) p.y = 0;
        }
        this.updateParticles();
      }

      this.animationFrameId = requestAnimationFrame(tick);
    };

    if (typeof window !== 'undefined') {
      this.animationFrameId = requestAnimationFrame(tick);
    }
  }

  /**
   * Interactive Pan/Zoom/Wheel Event Handlers
   */
  private attachCanvasListeners(canvas: HTMLCanvasElement): void {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      this.camera.zoomBy(factor, screenX, screenY);
      this.syncCameraTransform();
    };

    const onPointerDown = (e: PointerEvent) => {
      this.isDragging = true;
      this.lastDragX = e.clientX;
      this.lastDragY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastDragX;
      const dy = e.clientY - this.lastDragY;
      this.lastDragX = e.clientX;
      this.lastDragY = e.clientY;

      this.camera.panByScreen(dx, dy);
      this.syncCameraTransform();
    };

    const onPointerUp = () => {
      this.isDragging = false;
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    this.cleanupListeners = () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }

  private cleanupListeners: () => void = () => {};

  /**
   * Resize viewport dimensions
   */
  public resize(width: number, height: number): void {
    this.camera.resize(width, height);
    if (this.app?.renderer) {
      this.app.renderer.resize(width, height);
    }
    this.syncCameraTransform();
  }

  /**
   * Clean destruction of Pixi application, stage, and event listeners
   */
  public destroy(removeView: boolean = true): void {
    this.isDestroyed = true;
    if (this.animationFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.cleanupListeners();
    this.camera.stopAnimation();

    if (this.app) {
      try {
        this.app.destroy(removeView, { children: true });
      } catch (e) {
        // Safe destroy fallback
      }
      this.app = null;
    }

    this.clearAllContainers();
  }
}
