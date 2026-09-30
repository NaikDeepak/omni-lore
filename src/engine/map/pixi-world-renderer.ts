/**
 * OmniLore Map Engine v3 - PixiJS World Renderer (facade)
 *
 * Retained, diff-driven scene graph over 9 top-level containers:
 *  1. backgroundContainer    - void beyond the plane edges
 *  2. terrainContainer       - baked static plane (backdrop + terrain + glyphs)
 *  3. regionsContainer       - region borders & faction territories
 *  4. routesContainer        - animated travel routes
 *  5. characterPathContainer - hero trail + walking hero token
 *  6. markersContainer       - location markers, landmark glyphs, event flags
 *  7. fogContainer           - bayer-dithered fog of war
 *  8. atmosphereContainer    - particles, clouds, cursor light, FX
 *  9. labelsContainer        - Silkscreen labels with level of detail
 *
 * Snapshots go through a coalescing queue: only the newest pending snapshot
 * is committed, so rapid chapter scrubbing never builds up work.
 * Client-side safe: without a canvas (SSR/tests) everything runs headless.
 */

import { Application, Container, Graphics, Renderer, Sprite, Texture } from 'pixi.js';
import { CameraController } from './camera-controller';
import { ProjectedWorldMapSnapshot } from '../../projections/temporal-map';
import { diffMapSnapshots, MapSnapshotDiff } from '../../projections/map-snapshot-diff';
import { MapTheme } from '../../domain/map-themes';
import { MapMode, MapVisibleLayers } from '../../domain/map-types';
import { TweenManager } from './anim/tween';
import { GestureEvent, GestureTracker } from './input/gesture-tracker';
import { pickAt, PickTarget } from './input/picking';
import { createRendererBaker, IconAtlas } from './scene/icon-atlas';
import { buildPlaneLayout, PIXELS_PER_WORLD } from './scene/plane-layout';
import { paintPlane } from './scene/plane-painter';
import { TileAtlas, assetsLoader } from './scene/tile-atlas';
import { getUniverseLook } from './scene/universe-look';
import { shade } from './scene/pixel-palette';
import { hashString } from './scene/prng';
import { LayerContext } from './layers/layer-context';
import { RegionsLayer } from './layers/regions-layer';
import { RoutesLayer } from './layers/routes-layer';
import { MarkersLayer } from './layers/markers-layer';
import { HeroLayer } from './layers/hero-layer';
import { FogLayer } from './layers/fog-layer';
import { FxLayer } from './layers/fx-layer';
import { AtmosphereLayer } from './layers/atmosphere-layer';
import { LabelsLayer, installPixelFont, uninstallPixelFont } from './layers/labels-layer';

export interface HoverInfo {
  target: PickTarget;
  screenX: number;
  screenY: number;
}

export interface CameraView {
  x: number;
  y: number;
  zoom: number;
  viewWidth: number;
  viewHeight: number;
  worldWidth: number;
  worldHeight: number;
}

export interface PixiWorldRendererOptions {
  width: number;
  height: number;
  mode?: MapMode | 'ATLAS' | 'ADVENTURE' | 'LORE' | string;
  reducedMotion?: boolean;
  heroAvatarUrl?: string;
  onSelectLocation?: (id: string) => void;
  onSelectRegion?: (id: string) => void;
  onSelectEvent?: (id: string) => void;
  onHover?: (info: HoverInfo | null) => void;
  onCameraChange?: (view: CameraView) => void;
  onDiscover?: (locationIds: string[]) => void;
}

export interface RenderSnapshotOptions {
  mode?: MapMode | 'ATLAS' | 'ADVENTURE' | 'LORE' | string;
  activeLayers?: Set<string> | MapVisibleLayers | Record<string, boolean>;
  includeUnknown?: boolean;
}

export interface RendererLayers {
  regions: RegionsLayer;
  routes: RoutesLayer;
  hero: HeroLayer;
  markers: MarkersLayer;
  fog: FogLayer;
  atmosphere: AtmosphereLayer;
  fx: FxLayer;
  labels: LabelsLayer;
}

const MAX_DISCOVERY_BURSTS = 6;

function normalizeMode(mode: string): MapMode {
  const m = mode.toLowerCase();
  return m === 'adventure' || m === 'lore' ? m : 'atlas';
}

export class PixiWorldRenderer {
  public readonly camera: CameraController;
  public readonly worldContainer = new Container();

  public readonly backgroundContainer = new Container();
  public readonly terrainContainer = new Container();
  public readonly regionsContainer = new Container();
  public readonly routesContainer = new Container();
  public readonly characterPathContainer = new Container();
  public readonly markersContainer = new Container();
  public readonly fogContainer = new Container();
  public readonly atmosphereContainer = new Container();
  public readonly labelsContainer = new Container();

  public app: Application | null = null;
  public mode: MapMode = 'atlas';
  public readonly tweens = new TweenManager();
  public readonly ready: Promise<void>;

  public onSelectLocation?: (id: string) => void;
  public onSelectRegion?: (id: string) => void;
  public onSelectEvent?: (id: string) => void;

  private readonly options: PixiWorldRendererOptions;
  private readonly gestures = new GestureTracker(4);
  private readonly staticCache = new Map<string, { texture: Texture; canvas: HTMLCanvasElement }>();
  public readonly tiles: TileAtlas;
  private readonly reducedMotion: boolean;
  private heroAvatarUrl: string | undefined;
  private canvas: HTMLCanvasElement | null;
  private isDestroyed = false;

  private layers: RendererLayers | null = null;
  private atlas: IconAtlas | null = null;
  private layerTheme: MapTheme | null = null;
  private bakedKey: string | null = null;

  private latestSnapshot: ProjectedWorldMapSnapshot | null = null;
  private latestTheme: MapTheme | null = null;
  private lastDiff: MapSnapshotDiff | null = null;
  private commits = 0;
  private requestSeq = 0;
  private pendingFull = false;
  private chain: Promise<void> = Promise.resolve();

  private hovered: PickTarget | null = null;
  private hoverScreen: { x: number; y: number } | null = null;
  private lastZoom = -1;
  private lastCameraSignature = '';
  private animationFrameId: number | null = null;
  private lastTickTime = 0;
  private cleanupListeners: () => void = () => {};

  constructor(canvas: HTMLCanvasElement | null, options: PixiWorldRendererOptions) {
    this.canvas = canvas;
    this.options = options;
    this.onSelectLocation = options.onSelectLocation;
    this.onSelectRegion = options.onSelectRegion;
    this.onSelectEvent = options.onSelectEvent;
    this.reducedMotion = Boolean(options.reducedMotion);
    this.heroAvatarUrl = options.heroAvatarUrl;
    if (options.mode) this.mode = normalizeMode(options.mode);

    this.camera = new CameraController({
      worldWidth: options.width,
      worldHeight: options.height,
      viewWidth: options.width,
      viewHeight: options.height,
    });

    this.worldContainer.addChild(
      this.backgroundContainer,
      this.terrainContainer,
      this.regionsContainer,
      this.routesContainer,
      this.characterPathContainer,
      this.markersContainer,
      this.fogContainer,
      this.atmosphereContainer,
      this.labelsContainer
    );
    this.syncCameraTransform();

    const browser = typeof window !== 'undefined' && Boolean(canvas);
    this.tiles = new TileAtlas(browser ? assetsLoader : null);

    if (browser && canvas) {
      this.ready = this.initPixiApp(canvas, options.width, options.height).then(() =>
        this.tiles.load().catch((e) => console.warn('[PixiWorldRenderer] tileset load failed:', e))
      );
      this.attachCanvasListeners(canvas);
      this.startRenderLoop();
    } else {
      this.ready = Promise.resolve();
    }
  }

  // ---------------------------------------------------------------- state

  public get currentSnapshot(): ProjectedWorldMapSnapshot | null {
    return this.latestSnapshot;
  }

  public get commitCount(): number {
    return this.commits;
  }

  public get layerSet(): RendererLayers | null {
    return this.layers;
  }

  public get lastSnapshotDiff(): MapSnapshotDiff | null {
    return this.lastDiff;
  }

  private get renderer(): Renderer | null {
    return this.app?.renderer ?? null;
  }

  // ---------------------------------------------------------------- init

  private async initPixiApp(canvas: HTMLCanvasElement, width: number, height: number): Promise<void> {
    try {
      if (typeof document !== 'undefined' && document.fonts?.load) {
        await document.fonts.load('16px Silkscreen').catch(() => undefined);
      }
      const app = new Application();
      await app.init({
        canvas,
        width,
        height,
        preference: 'webgl',
        antialias: false,
        autoDensity: true,
        roundPixels: true,
        resolution: window.devicePixelRatio || 1,
        backgroundColor: 0x05070f,
      });
      if (this.isDestroyed) {
        app.destroy(false, { children: true });
        return;
      }
      this.app = app;
      installPixelFont();
      app.stage.addChild(this.worldContainer);
    } catch (e) {
      console.warn('[PixiWorldRenderer] WebGL initialization skipped:', e);
    }
  }

  // ---------------------------------------------------------------- snapshots

  /** Full re-sync (used on mount; kept for backwards compatibility). */
  public renderSnapshot(
    snapshot: ProjectedWorldMapSnapshot,
    theme: MapTheme,
    options?: RenderSnapshotOptions
  ): Promise<void> {
    return this.enqueue(snapshot, theme, options, true);
  }

  /** Diff-driven update; upgrades to a full sync on plane/map/theme change. */
  public applySnapshot(
    snapshot: ProjectedWorldMapSnapshot,
    theme: MapTheme,
    options?: RenderSnapshotOptions
  ): Promise<void> {
    return this.enqueue(snapshot, theme, options, false);
  }

  private enqueue(
    snapshot: ProjectedWorldMapSnapshot,
    theme: MapTheme,
    options: RenderSnapshotOptions | undefined,
    full: boolean
  ): Promise<void> {
    const seq = ++this.requestSeq;
    if (full) this.pendingFull = true;
    this.chain = this.chain
      .catch(() => undefined)
      .then(async () => {
        await this.ready;
        if (this.isDestroyed || seq !== this.requestSeq) return;
        try {
          this.commit(snapshot, theme, options ?? {});
        } catch (e) {
          console.error('[PixiWorldRenderer] commit failed:', e);
        }
      });
    return this.chain;
  }

  private commit(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme, options: RenderSnapshotOptions): void {
    if (options.mode) this.setMode(options.mode, false);
    if (options.activeLayers) this.applyActiveLayers(options.activeLayers);

    const prev = this.latestSnapshot;
    const planeChanged = !prev || prev.planeId !== snapshot.planeId || prev.mapId !== snapshot.mapId;
    const full = this.pendingFull || planeChanged || this.latestTheme !== theme;
    this.pendingFull = false;

    const layers = this.ensureLayers(theme);
    const diff = diffMapSnapshots(full ? null : prev, snapshot);

    if (full) {
      this.bakeStatic(snapshot, theme);
      this.drawVoid(snapshot, theme);
      this.camera.setWorldSize(snapshot.width, snapshot.height);
      if (planeChanged) this.camera.fitWorld();
      layers.fog.resize(snapshot.width, snapshot.height);
      layers.atmosphere.reset(snapshot.width, snapshot.height, hashString(`${snapshot.mapId}:${snapshot.planeId}`));
      layers.fx.clear();
      if (prev && planeChanged) layers.fx.warp(snapshot.width / 2, snapshot.height / 2, theme.palette.primaryAccent);
    }

    layers.regions.sync(snapshot);
    layers.routes.sync(snapshot);
    layers.markers.sync(snapshot, !full);
    layers.hero.sync(snapshot, diff);
    layers.fog.sync(snapshot, !full);
    layers.labels.sync(snapshot);
    layers.markers.setZoom(this.camera.zoom);
    layers.labels.setZoom(this.camera.zoom);

    if (!full && diff.newlyDiscoveredIds.length > 0) {
      const accent = theme.palette.primaryAccent;
      for (const id of diff.newlyDiscoveredIds.slice(-MAX_DISCOVERY_BURSTS)) {
        const loc = snapshot.locations.find((l) => l.id === id);
        if (loc) layers.fx.burst(loc.x, loc.y, loc.importance === 'critical' ? 70 : 45, accent);
      }
      this.options.onDiscover?.(diff.newlyDiscoveredIds);
    }

    this.latestSnapshot = snapshot;
    this.latestTheme = theme;
    this.lastDiff = diff;
    this.commits += 1;

    this.refreshHover();
    this.syncCameraTransform();
  }

  private ensureLayers(theme: MapTheme): RendererLayers {
    if (this.layers && this.layerTheme === theme) return this.layers;
    this.disposeLayers();

    const renderer = this.renderer;
    this.atlas = new IconAtlas(renderer ? createRendererBaker(renderer) : null, theme);
    const ctx: LayerContext = {
      theme,
      atlas: this.atlas,
      tiles: this.tiles,
      tweens: this.tweens,
      reducedMotion: this.reducedMotion,
    };

    const layers: RendererLayers = {
      regions: new RegionsLayer(this.regionsContainer, ctx),
      routes: new RoutesLayer(this.routesContainer, ctx),
      hero: new HeroLayer(this.characterPathContainer, ctx),
      markers: new MarkersLayer(this.markersContainer, ctx),
      fog: new FogLayer(this.fogContainer, ctx, renderer),
      atmosphere: new AtmosphereLayer(this.atmosphereContainer, ctx),
      fx: new FxLayer(this.atmosphereContainer, ctx),
      labels: new LabelsLayer(this.labelsContainer, ctx, renderer !== null),
    };
    layers.markers.setMode(this.mode);
    layers.hero.setMode(this.mode);
    void layers.hero.setAvatar(this.heroAvatarUrl);

    this.layers = layers;
    this.layerTheme = theme;
    this.bakedKey = null;
    return layers;
  }

  private disposeLayers(): void {
    if (this.layers) {
      for (const layer of Object.values(this.layers)) layer.destroy();
    }
    this.layers = null;
    this.layerTheme = null;
    this.tweens.clear();
    this.atlas?.destroy();
    this.atlas = null;
    for (const entry of this.staticCache.values()) entry.texture.destroy(true);
    this.staticCache.clear();
    this.bakedKey = null;
    this.hovered = null;
    this.clearContainerAndDestroyChildren(this.terrainContainer);
    this.clearContainerAndDestroyChildren(this.backgroundContainer);
  }

  private bakeStatic(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    const key = `${snapshot.mapId}:${snapshot.planeId}:${theme.slug}`;
    if (this.bakedKey === key && this.terrainContainer.children.length > 0) return;
    this.clearContainerAndDestroyChildren(this.terrainContainer);

    if (!this.renderer || typeof document === 'undefined') {
      // Headless (SSR/tests): plain placeholder so the layer is never empty
      const placeholder = new Graphics().rect(0, 0, snapshot.width, snapshot.height).fill('#2076aa');
      this.terrainContainer.addChild(placeholder);
      this.bakedKey = key;
      return;
    }

    let entry = this.staticCache.get(key);
    if (!entry) {
      const layout = buildPlaneLayout(snapshot);
      const canvas = document.createElement('canvas');
      canvas.width = layout.width;
      canvas.height = layout.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        paintPlane(
          ctx,
          layout,
          this.tiles,
          getUniverseLook(theme.slug),
          (w, h) => {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            return c;
          },
          hashString(key)
        );
      }
      const texture = Texture.from(canvas);
      texture.source.scaleMode = 'nearest';
      entry = { texture, canvas };
      this.staticCache.set(key, entry);
    }
    const sprite = new Sprite(entry.texture);
    sprite.scale.set(1 / PIXELS_PER_WORLD);
    this.terrainContainer.addChild(sprite);
    this.bakedKey = key;
  }

  private drawVoid(snapshot: ProjectedWorldMapSnapshot, theme: MapTheme): void {
    this.clearContainerAndDestroyChildren(this.backgroundContainer);
    const pad = 4000;
    const g = new Graphics();
    g.rect(-pad, -pad, snapshot.width + pad * 2, snapshot.height + pad * 2).fill(
      shade(theme.palette.background, -0.55)
    );
    this.backgroundContainer.addChild(g);
  }

  // ---------------------------------------------------------------- controls

  public setMode(mode: MapMode | 'ATLAS' | 'ADVENTURE' | 'LORE' | string, _triggerRender: boolean = true): void {
    this.mode = normalizeMode(mode);
    this.layers?.markers.setMode(this.mode);
    this.layers?.hero.setMode(this.mode);
  }

  public toggleLayer(layerName: string, visible?: boolean): void {
    const setVis = (c: Container) => {
      c.visible = visible !== undefined ? visible : !c.visible;
    };
    switch (layerName.toLowerCase()) {
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

  private applyActiveLayers(activeLayers: Set<string> | MapVisibleLayers | Record<string, boolean>): void {
    const isVisible = (layer: string): boolean =>
      activeLayers instanceof Set
        ? activeLayers.has(layer)
        : ((activeLayers as Record<string, boolean>)[layer] ?? true);

    this.terrainContainer.visible = isVisible('terrain');
    this.regionsContainer.visible = isVisible('regions') || isVisible('territories');
    this.routesContainer.visible = isVisible('routes');
    this.characterPathContainer.visible = isVisible('characterPaths');
    this.markersContainer.visible = isVisible('markers') || isVisible('locations');
    this.fogContainer.visible = isVisible('fog') || isVisible('fogOfWar');
    this.atmosphereContainer.visible = isVisible('atmosphere') || isVisible('particles');
    this.labelsContainer.visible = isVisible('labels');
  }

  /** Swap the hero portrait without recreating the renderer. */
  public setHeroAvatar(url: string | undefined): void {
    if (url === this.heroAvatarUrl) return;
    this.heroAvatarUrl = url;
    void this.layers?.hero.setAvatar(url);
  }

  public flyTo(targetX: number, targetY: number, targetZoom?: number, durationMs: number = 500): void {
    this.camera.flyTo(targetX, targetY, targetZoom, this.reducedMotion ? 16 : durationMs);
  }

  /** Instant camera cut with a warp spiral at the destination. */
  public warpTo(x: number, y: number, zoom: number = 1.8): void {
    this.camera.stopAnimation();
    this.camera.setZoom(zoom);
    this.camera.setPosition(x, y);
    const accent = this.latestTheme?.palette.primaryAccent ?? '#ffffff';
    this.layers?.fx.warp(x, y, accent);
    this.syncCameraTransform();
  }

  public getCameraView(): CameraView {
    return {
      x: this.camera.x,
      y: this.camera.y,
      zoom: this.camera.zoom,
      viewWidth: this.camera.viewWidth,
      viewHeight: this.camera.viewHeight,
      worldWidth: this.camera.worldWidth,
      worldHeight: this.camera.worldHeight,
    };
  }

  public async getMinimapImage(): Promise<string | null> {
    await this.ready;
    const entry = this.bakedKey ? this.staticCache.get(this.bakedKey) : undefined;
    if (!entry) return null;
    try {
      return entry.canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------- input

  public hoverAt(screenX: number, screenY: number): void {
    this.hoverScreen = { x: screenX, y: screenY };
    const target = this.pickScreen(screenX, screenY);
    const world = this.camera.screenToWorld(screenX, screenY);
    this.layers?.atmosphere.setCursor(world);
    this.setHover(target, screenX, screenY);
  }

  public clickAt(screenX: number, screenY: number): void {
    const target = this.pickScreen(screenX, screenY);
    if (!target) return;
    if (target.kind === 'location') this.onSelectLocation?.(target.id);
    else if (target.kind === 'region') this.onSelectRegion?.(target.id);
    else this.onSelectEvent?.(target.id);
  }

  private pickScreen(screenX: number, screenY: number): PickTarget | null {
    if (!this.latestSnapshot) return null;
    const world = this.camera.screenToWorld(screenX, screenY);
    return pickAt(this.latestSnapshot, world.x, world.y, this.camera.zoom);
  }

  private setHover(target: PickTarget | null, screenX: number, screenY: number): void {
    this.hovered = target;
    this.layers?.markers.setHovered(target?.kind === 'location' ? target.id : null);
    this.layers?.regions.setHovered(target?.kind === 'region' ? target.id : null);
    if (this.canvas) this.canvas.style.cursor = target && target.kind !== 'region' ? 'pointer' : 'grab';
    this.options.onHover?.(target ? { target, screenX, screenY } : null);
  }

  private clearHover(): void {
    this.hoverScreen = null;
    this.layers?.atmosphere.setCursor(null);
    if (this.hovered) this.setHover(null, 0, 0);
  }

  private refreshHover(): void {
    if (this.hoverScreen) this.hoverAt(this.hoverScreen.x, this.hoverScreen.y);
    else if (this.hovered) this.setHover(null, 0, 0);
  }

  private handleGesture(event: GestureEvent | null): void {
    if (!event) return;
    switch (event.type) {
      case 'pan':
        this.camera.stopAnimation();
        this.camera.panByScreen(event.dx, event.dy);
        this.clearHover();
        break;
      case 'pinch':
        this.camera.stopAnimation();
        this.camera.zoomAt(this.camera.zoom * event.scale, event.centerX, event.centerY);
        break;
      case 'hover':
        this.hoverAt(event.x, event.y);
        break;
      case 'click':
        this.clickAt(event.x, event.y);
        break;
    }
    this.syncCameraTransform();
  }

  private attachCanvasListeners(canvas: HTMLCanvasElement): void {
    const local = (e: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(e);
      this.camera.stopAnimation();
      this.camera.zoomBy(e.deltaY < 0 ? 1.15 : 0.87, p.x, p.y);
      this.syncCameraTransform();
    };
    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture?.(e.pointerId);
      const p = local(e);
      this.gestures.down(e.pointerId, p.x, p.y);
    };
    const onPointerMove = (e: PointerEvent) => {
      const p = local(e);
      this.handleGesture(this.gestures.move(e.pointerId, p.x, p.y));
    };
    const onPointerUp = (e: PointerEvent) => {
      const p = local(e);
      this.handleGesture(this.gestures.up(e.pointerId, p.x, p.y));
    };
    const onPointerCancel = () => this.gestures.cancel();
    const onPointerLeave = () => {
      if (!this.gestures.isDragging) this.clearHover();
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('pointerleave', onPointerLeave);

    this.cleanupListeners = () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }

  // ---------------------------------------------------------------- frame loop

  public syncCameraTransform(): void {
    this.worldContainer.scale.set(this.camera.zoom);
    this.worldContainer.position.set(
      Math.round(this.camera.viewWidth / 2 - this.camera.x * this.camera.zoom),
      Math.round(this.camera.viewHeight / 2 - this.camera.y * this.camera.zoom)
    );
  }

  private emitCameraChange(): void {
    if (!this.options.onCameraChange) return;
    const c = this.camera;
    const signature = `${c.x.toFixed(1)}:${c.y.toFixed(1)}:${c.zoom.toFixed(3)}:${c.viewWidth}:${c.viewHeight}:${c.worldWidth}:${c.worldHeight}`;
    if (signature === this.lastCameraSignature) return;
    this.lastCameraSignature = signature;
    this.options.onCameraChange(this.getCameraView());
  }

  private startRenderLoop(): void {
    const tick = (now: number) => {
      if (this.isDestroyed) return;
      const dt = this.lastTickTime === 0 ? 16 : Math.min(64, now - this.lastTickTime);
      this.lastTickTime = now;

      if (this.camera.isAnimating) this.camera.tick(dt);
      this.tweens.tick(dt);

      const layers = this.layers;
      if (layers) {
        if (this.camera.zoom !== this.lastZoom) {
          this.lastZoom = this.camera.zoom;
          layers.markers.setZoom(this.camera.zoom);
          layers.labels.setZoom(this.camera.zoom);
        }
        layers.markers.update(dt);
        layers.routes.update(dt);
        layers.hero.update(dt);
        layers.fog.update(dt);
        layers.fx.update(dt);
        layers.atmosphere.update(dt);
      }

      this.syncCameraTransform();
      this.emitCameraChange();
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  // ---------------------------------------------------------------- lifecycle

  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.camera.resize(width, height);
    this.app?.renderer?.resize(width, height);
    this.syncCameraTransform();
  }

  private clearContainerAndDestroyChildren(container: Container): void {
    for (const child of container.removeChildren()) {
      try {
        child.destroy({ children: true });
      } catch {
        // Mock environments
      }
    }
  }

  public destroy(removeView: boolean = true): void {
    this.isDestroyed = true;
    if (this.animationFrameId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cleanupListeners();
    this.camera.stopAnimation();
    this.disposeLayers();
    this.tiles.destroy();
    this.latestSnapshot = null;

    if (this.app) {
      try {
        uninstallPixelFont();
        this.app.destroy(removeView, { children: true, texture: true, textureSource: true });
      } catch {
        // Safe destroy fallback
      }
      this.app = null;
    }
  }
}
