'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { WorldMapDefinition, MapMode, MapVisibleLayers } from '../../domain/map-types';
import { MapTheme, getMapTheme } from '../../domain/map-themes';
import { getUniverseTheme } from '../../domain/themes';
import {
  projectTemporalMap,
  ProjectedWaypoint,
  ProjectedWorldMapSnapshot,
} from '../../projections/temporal-map';
import { CameraView, HoverInfo, PixiWorldRenderer } from '../../engine/map/pixi-world-renderer';
import { SoundEngine } from '../../lib/sound-effects';
import { ART_CREDITS } from '../../engine/map/scene/sprite-catalog';
import { getUniverseLook } from '../../engine/map/scene/universe-look';
import { MapHudControls, PlaneOption } from './MapHudControls';
import { MapTimelineBar } from './MapTimelineBar';
import { MapLocationDrawer } from './MapLocationDrawer';
import { AtlasTooltip } from './AtlasTooltip';
import { DiscoveryBanner } from './DiscoveryBanner';
import { WaypointPanel } from './WaypointPanel';
import { AtlasFrame } from './AtlasFrame';
import { AtlasMinimap } from './AtlasMinimap';
import {
  BannerState,
  Emitter,
  bannerReducer,
  buildTooltipModel,
  createEmitter,
  fogCirclesForMinimap,
  groupWaypoints,
  isTypingTarget,
  keyToAtlasAction,
  planeSwitchForLocation,
  visibleRegionNames,
} from './atlas-ui-state';

export interface RpgWorldAtlasProps {
  mapDefinition: WorldMapDefinition;
  userChapter: number;
  totalChapters?: number;
  theme?: MapTheme;
  universeSlug?: string;
  onChapterChange?: (chapter: number) => void;
  onSelectLocation?: (locationId: string | null) => void;
  onSelectRegion?: (regionId: string | null) => void;
  onSelectEvent?: (eventId: string | null) => void;
  selectedLocationId?: string | null;
  activePlaneId?: string;
  /** Optional descriptions for planes; the plane list itself comes from the projection. */
  planes?: PlaneOption[];
  onSelectPlane?: (planeId: string) => void;
  initialMode?: MapMode;
  className?: string;
  activeCharacterId?: string;
  heroAvatarUrl?: string;
  onJumpToJourney?: (characterId: string) => void;
  onSelectForDuel?: (characterId: string) => void;
  onShowOnLadder?: (id?: string) => void;
  onShowInRoster?: (id?: string) => void;
}

const DEFAULT_VISIBLE_LAYERS: MapVisibleLayers = {
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

/**
 * Read once, synchronously: the atlas is client-only (dynamic import with
 * ssr:false), so the first render already knows the preference and the
 * renderer is never recreated because of it. Guarded for SSR tests.
 */
function readPrefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function TooltipHost({
  emitter,
  snapshotRef,
  universeSlug,
  viewport,
  accentColor,
}: {
  emitter: Emitter<HoverInfo | null>;
  snapshotRef: React.MutableRefObject<ProjectedWorldMapSnapshot>;
  universeSlug: string;
  viewport: { width: number; height: number };
  accentColor: string;
}) {
  const [info, setInfo] = useState<HoverInfo | null>(null);
  useEffect(() => emitter.subscribe(setInfo), [emitter]);
  if (!info) return null;
  const model = buildTooltipModel(snapshotRef.current, info.target, universeSlug);
  return (
    <AtlasTooltip
      model={model}
      x={info.screenX}
      y={info.screenY}
      viewportWidth={viewport.width}
      viewportHeight={viewport.height}
      accentColor={accentColor}
    />
  );
}

export function RpgWorldAtlas({
  mapDefinition,
  userChapter,
  totalChapters = 1000,
  theme: themeProp,
  universeSlug: universeSlugProp,
  onChapterChange,
  onSelectLocation: onSelectLocationProp,
  onSelectRegion: onSelectRegionProp,
  onSelectEvent: onSelectEventProp,
  selectedLocationId: selectedLocationIdProp,
  activePlaneId: activePlaneIdProp,
  planes: planeDescriptions = [],
  onSelectPlane,
  initialMode = 'atlas',
  className = '',
  activeCharacterId,
  heroAvatarUrl,
  onShowOnLadder,
  onShowInRoster,
}: RpgWorldAtlasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<PixiWorldRenderer | null>(null);
  const handledLocPropRef = useRef<string | null | undefined>(undefined);
  // A fly queued for after a commit; only consumed by a snapshot of its own plane
  const pendingFlyRef = useRef<{ x: number; y: number; planeId: string } | null>(null);
  const minimapKeyRef = useRef<string | null>(null);

  const universeSlug = universeSlugProp || mapDefinition.universeId || 'reverend-insanity';
  const activeTheme = useMemo(() => themeProp || getMapTheme(universeSlug), [themeProp, universeSlug]);
  const rune = useMemo(() => getUniverseTheme(universeSlug).runeSymbol, [universeSlug]);
  const [reducedMotion] = useState(readPrefersReducedMotion);
  const heroAvatarRef = useRef(heroAvatarUrl);
  heroAvatarRef.current = heroAvatarUrl;

  const [mode, setMode] = useState<MapMode>(initialMode);
  const [visibleLayers, setVisibleLayers] = useState<MapVisibleLayers>(DEFAULT_VISIBLE_LAYERS);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(selectedLocationIdProp || null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [planeId, setPlaneId] = useState<string | undefined>(activePlaneIdProp);
  const [waypointsOpen, setWaypointsOpen] = useState(false);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [minimapUrl, setMinimapUrl] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 600 });

  const hoverEmitter = useMemo(() => createEmitter<HoverInfo | null>(null), []);
  const cameraEmitter = useMemo(() => createEmitter<CameraView | null>(null), []);
  const subscribeCamera = useCallback(
    (listener: (view: CameraView) => void) =>
      cameraEmitter.subscribe((view) => {
        if (view) listener(view);
      }),
    [cameraEmitter]
  );

  useEffect(() => {
    if (activePlaneIdProp !== undefined) setPlaneId(activePlaneIdProp);
  }, [activePlaneIdProp]);

  // Zero-spoiler, plane-aware snapshot bounded strictly by userChapter
  const snapshot: ProjectedWorldMapSnapshot = useMemo(
    () => projectTemporalMap(mapDefinition, userChapter, { activeCharacterId, planeId }),
    [mapDefinition, userChapter, activeCharacterId, planeId]
  );
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const themeRef = useRef(activeTheme);
  themeRef.current = activeTheme;
  const layersRef = useRef(visibleLayers);
  layersRef.current = visibleLayers;
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const switchPlane = useCallback(
    (next: string) => {
      setPlaneId(next);
      onSelectPlane?.(next);
    },
    [onSelectPlane]
  );

  // A sealed/unknown requested plane falls back in the projection: report it so the URL is rewritten
  useEffect(() => {
    if (planeId !== undefined && snapshot.planeId !== planeId) switchPlane(snapshot.planeId);
  }, [planeId, snapshot.planeId, switchPlane]);

  // Selection handlers
  const handleSelectLocation = useCallback(
    (id: string | null, fly: boolean = true) => {
      // Our own selection echoes back through the prop: mark it handled
      handledLocPropRef.current = id;
      setSelectedLocationId(id);
      setSelectedRegionId(null);
      setSelectedEventId(null);
      onSelectLocationProp?.(id);
      if (id && fly && rendererRef.current) {
        const loc = snapshotRef.current.locations.find((l) => l.id === id);
        if (loc) rendererRef.current.flyTo(loc.x, loc.y, 1.8, 450);
      }
    },
    [onSelectLocationProp]
  );

  const handleSelectRegion = useCallback(
    (id: string | null) => {
      setSelectedRegionId(id);
      setSelectedLocationId(null);
      setSelectedEventId(null);
      onSelectRegionProp?.(id);
    },
    [onSelectRegionProp]
  );

  const handleSelectEvent = useCallback(
    (id: string | null) => {
      setSelectedEventId(id);
      setSelectedLocationId(null);
      setSelectedRegionId(null);
      onSelectEventProp?.(id);
    },
    [onSelectEventProp]
  );

  const handleCloseDrawer = useCallback(() => {
    setSelectedLocationId(null);
    setSelectedRegionId(null);
    setSelectedEventId(null);
    onSelectLocationProp?.(null);
    onSelectRegionProp?.(null);
    onSelectEventProp?.(null);
  }, [onSelectLocationProp, onSelectRegionProp, onSelectEventProp]);

  const handleDiscover = useCallback((ids: string[]) => {
    const names = ids
      .map((id) => snapshotRef.current.locations.find((l) => l.id === id)?.name)
      .filter((n): n is string => Boolean(n));
    setBanner((prev) => bannerReducer(prev, names));
  }, []);
  const clearBanner = useCallback(() => setBanner(null), []);

  const handlersRef = useRef({ handleSelectLocation, handleSelectRegion, handleSelectEvent, handleDiscover });
  handlersRef.current = { handleSelectLocation, handleSelectRegion, handleSelectEvent, handleDiscover };

  // Controlled selectedLocationId (e.g. ?loc= deep link, "SHOW ON MAP"):
  // switch plane if needed, then fly. Tracked with a ref that starts undefined,
  // so a deep link present on mount is handled too.
  useEffect(() => {
    if (selectedLocationIdProp === undefined || selectedLocationIdProp === handledLocPropRef.current) return;
    handledLocPropRef.current = selectedLocationIdProp;
    setSelectedLocationId(selectedLocationIdProp);
    if (!selectedLocationIdProp) return;
    const loc = mapDefinition.locations.find((l) => l.id === selectedLocationIdProp);
    if (!loc) return;
    const target = planeSwitchForLocation(mapDefinition, snapshotRef.current, selectedLocationIdProp);
    if (target) {
      pendingFlyRef.current = { x: loc.x, y: loc.y, planeId: target };
      switchPlane(target);
      return;
    }
    const renderer = rendererRef.current;
    const onPlane = snapshotRef.current.locations.find((l) => l.id === selectedLocationIdProp);
    if (!onPlane) return;
    if (renderer?.currentSnapshot) renderer.flyTo(onPlane.x, onPlane.y, 1.8, 450);
    // renderer not ready yet: fly after first commit
    else pendingFlyRef.current = { x: onPlane.x, y: onPlane.y, planeId: snapshotRef.current.planeId };
  }, [selectedLocationIdProp, mapDefinition, switchPlane]);

  // Renderer lifecycle. Pixi's destroy() calls WEBGL_lose_context, so a canvas
  // can never be reused: every renderer instance gets its own fresh canvas
  // (this also keeps React StrictMode's double mount working).
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || typeof window === 'undefined') return;
    const container = containerRef.current;
    const width = container?.clientWidth || 800;
    const height = container?.clientHeight || 600;
    setViewport({ width, height });

    const canvas = document.createElement('canvas');
    canvas.dataset.testid = 'rpg-atlas-canvas';
    canvas.className = 'w-full h-full block touch-none cursor-grab active:cursor-grabbing';
    host.appendChild(canvas);

    const renderer = new PixiWorldRenderer(canvas, {
      width,
      height,
      mode: modeRef.current,
      reducedMotion,
      heroAvatarUrl: heroAvatarRef.current,
      onSelectLocation: (id) => handlersRef.current.handleSelectLocation(id),
      onSelectRegion: (id) => handlersRef.current.handleSelectRegion(id),
      onSelectEvent: (id) => handlersRef.current.handleSelectEvent(id),
      onHover: (info) => hoverEmitter.emit(info),
      onCameraChange: (view) => cameraEmitter.emit(view),
      onDiscover: (ids) => handlersRef.current.handleDiscover(ids),
    });
    rendererRef.current = renderer;
    minimapKeyRef.current = null;
    void renderer.renderSnapshot(snapshotRef.current, themeRef.current, {
      mode: modeRef.current,
      activeLayers: layersRef.current,
    });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          if (w > 0 && h > 0) {
            renderer.resize(w, h);
            setViewport({ width: w, height: h });
          }
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver?.disconnect();
      renderer.destroy(true);
      canvas.remove();
      rendererRef.current = null;
    };
  }, [reducedMotion, hoverEmitter, cameraEmitter]);

  // Swap the hero portrait in place (no renderer recreation)
  useEffect(() => {
    rendererRef.current?.setHeroAvatar(heroAvatarUrl);
  }, [heroAvatarUrl]);

  // Diff-driven snapshot sync
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    // rendererRef is cleared (or replaced) when this renderer is destroyed
    const isLive = () => rendererRef.current === renderer;
    void renderer.applySnapshot(snapshot, activeTheme, { mode, activeLayers: visibleLayers }).then(() => {
      if (!isLive() || renderer.currentSnapshot !== snapshot) return;
      const fly = pendingFlyRef.current;
      if (fly && fly.planeId === snapshot.planeId) {
        pendingFlyRef.current = null;
        renderer.warpTo(fly.x, fly.y, 1.8);
      }
      const key = `${snapshot.mapId}:${snapshot.planeId}:${activeTheme.slug}`;
      if (minimapKeyRef.current !== key) {
        minimapKeyRef.current = key;
        void renderer.getMinimapImage().then((url) => {
          if (isLive()) setMinimapUrl(url);
        });
      }
    });
  }, [snapshot, activeTheme, mode, visibleLayers]);

  // HUD handlers
  const handleModeChange = useCallback((newMode: MapMode) => {
    setMode(newMode);
    rendererRef.current?.setMode(newMode);
  }, []);

  const handleToggleLayer = useCallback((layerName: string) => {
    setVisibleLayers((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  }, []);

  const withCamera = useCallback((fn: (r: PixiWorldRenderer) => void) => {
    const r = rendererRef.current;
    if (!r) return;
    r.camera.stopAnimation();
    fn(r);
    r.syncCameraTransform();
  }, []);

  const handleZoomIn = useCallback(() => withCamera((r) => r.camera.zoomBy(1.25)), [withCamera]);
  const handleZoomOut = useCallback(() => withCamera((r) => r.camera.zoomBy(0.8)), [withCamera]);
  const handleResetZoom = useCallback(() => withCamera((r) => r.camera.fitWorld()), [withCamera]);
  const handleRecenter = useCallback(() => {
    const pos = snapshotRef.current.currentPosition;
    if (pos) rendererRef.current?.flyTo(pos.x, pos.y, 1.5, 400);
    else rendererRef.current?.flyTo(snapshotRef.current.width / 2, snapshotRef.current.height / 2, undefined, 400);
  }, []);

  const handleTravel = useCallback(
    (wp: ProjectedWaypoint) => {
      SoundEngine.playPlaneWarp();
      setWaypointsOpen(false);
      if (wp.planeId !== snapshotRef.current.planeId) {
        pendingFlyRef.current = { x: wp.x, y: wp.y, planeId: wp.planeId };
        switchPlane(wp.planeId);
      } else {
        rendererRef.current?.warpTo(wp.x, wp.y, 1.8);
      }
      handleSelectLocation(wp.locationId, false);
    },
    [switchPlane, handleSelectLocation]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Focused controls (timeline range slider, search field) keep their own keys
      if (isTypingTarget(e.target as HTMLElement)) return;
      const action = keyToAtlasAction(e.key);
      if (!action) return;
      e.preventDefault();
      if (action === 'toggle-waypoints') {
        setWaypointsOpen((open) => !open);
        return;
      }
      if (action === 'escape') {
        setWaypointsOpen(false);
        handleCloseDrawer();
        return;
      }
      withCamera((r) => {
        const step = 60 / r.camera.zoom;
        if (action === 'pan-up') r.camera.pan(0, -step);
        else if (action === 'pan-down') r.camera.pan(0, step);
        else if (action === 'pan-left') r.camera.pan(-step, 0);
        else if (action === 'pan-right') r.camera.pan(step, 0);
        else if (action === 'zoom-in') r.camera.zoomBy(1.25);
        else if (action === 'zoom-out') r.camera.zoomBy(0.8);
      });
    },
    [handleCloseDrawer, withCamera]
  );

  // Derived UI data (snapshot-only)
  const hudPlanes: PlaneOption[] = useMemo(
    () =>
      snapshot.planes.length > 1
        ? snapshot.planes.map((p) => ({
            id: p.id,
            name: p.isRevealed ? p.name : '??? SEALED REALM',
            locked: !p.isRevealed,
            description: p.isRevealed ? planeDescriptions.find((d) => d.id === p.id)?.description : undefined,
          }))
        : [],
    [snapshot.planes, planeDescriptions]
  );

  const waypointGroups = useMemo(
    () => groupWaypoints(snapshot.waypoints, snapshot.planes, visibleRegionNames(mapDefinition, userChapter)),
    [snapshot.waypoints, snapshot.planes, mapDefinition, userChapter]
  );

  const heroElsewhere = useMemo(() => {
    const hero = snapshot.heroPosition;
    if (!hero || hero.planeId === snapshot.planeId) return null;
    const plane = snapshot.planes.find((p) => p.id === hero.planeId && p.isRevealed);
    return plane ? { plane, hero } : null;
  }, [snapshot.heroPosition, snapshot.planeId, snapshot.planes]);

  const heroName =
    mapDefinition.characterPaths.find((p) => p.characterId === snapshot.activeCharacterId)?.characterName ??
    'Protagonist';

  const selectedLocation = useMemo(
    () => snapshot.locations.find((l) => l.id === selectedLocationId) || null,
    [snapshot.locations, selectedLocationId]
  );
  const selectedRegion = useMemo(
    () => snapshot.regions.find((r) => r.id === selectedRegionId) || null,
    [snapshot.regions, selectedRegionId]
  );
  const selectedEvent = useMemo(
    () => snapshot.events.find((e) => e.id === selectedEventId) || null,
    [snapshot.events, selectedEventId]
  );
  const selectedTerritory = useMemo(() => {
    if (!selectedLocation?.controllingFactionId) return null;
    return snapshot.territories.find((t) => t.factionId === selectedLocation.controllingFactionId) || null;
  }, [snapshot.territories, selectedLocation]);

  const isDrawerOpen = Boolean(selectedLocation || selectedRegion || selectedEvent);
  const accent = activeTheme.palette.primaryAccent;
  const heroPoint = snapshot.currentPosition ? { x: snapshot.currentPosition.x, y: snapshot.currentPosition.y } : null;

  return (
    <div
      ref={containerRef}
      data-testid="rpg-world-atlas-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${snapshot.planes.find((p) => p.id === snapshot.planeId)?.name ?? 'World'} atlas at chapter ${userChapter}`}
      className={`relative w-full h-[650px] lg:h-[750px] bg-[#040814] overflow-hidden rounded-2xl border-2 border-slate-800 shadow-2xl select-none outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${className}`}
      style={{ boxShadow: `0 0 35px ${accent}15` }}
    >
      {/* The renderer effect mounts a fresh <canvas data-testid="rpg-atlas-canvas"> in here */}
      <div ref={canvasHostRef} data-testid="rpg-atlas-canvas-host" className="absolute inset-0" />

      {/* Soft CRT scanlines + light vignette (kept subtle so the bright tile art reads) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-10 z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_65%,rgba(2,4,10,0.45)_100%)] z-10"
        aria-hidden="true"
      />

      <AtlasFrame accentColor={accent} rune={rune} credits={ART_CREDITS} />

      <TooltipHost
        emitter={hoverEmitter}
        snapshotRef={snapshotRef}
        universeSlug={universeSlug}
        viewport={viewport}
        accentColor={accent}
      />

      <DiscoveryBanner state={banner} onDone={clearBanner} accentColor={accent} />

      <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start pointer-events-none">
        <MapHudControls
          mode={mode}
          onModeChange={handleModeChange}
          visibleLayers={visibleLayers}
          onToggleLayer={handleToggleLayer}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onRecenter={handleRecenter}
          planes={hudPlanes}
          activePlaneId={snapshot.planeId}
          onPlaneChange={switchPlane}
          onOpenWaypoints={() => setWaypointsOpen((open) => !open)}
          waypointCount={snapshot.waypoints.length}
          accentColor={accent}
          className="w-full max-w-4xl mx-auto shadow-2xl"
        />
      </div>

      {heroElsewhere && (
        <button
          type="button"
          onClick={() => {
            SoundEngine.playPlaneWarp();
            pendingFlyRef.current = {
              x: heroElsewhere.hero.x,
              y: heroElsewhere.hero.y,
              planeId: heroElsewhere.plane.id,
            };
            switchPlane(heroElsewhere.plane.id);
          }}
          className="absolute left-1/2 top-[88px] z-30 -translate-x-1/2 flex items-center gap-1.5 border px-3 py-1 bg-black/80 font-pixel text-[9px] tracking-wider text-amber-200 hover:bg-black"
          style={{ borderColor: `${accent}88` }}
        >
          <MapPin className="w-3 h-3" />
          HERO IN {heroElsewhere.plane.name.toUpperCase()}
        </button>
      )}

      {waypointsOpen && (
        <WaypointPanel
          groups={waypointGroups}
          activePlaneId={snapshot.planeId}
          onTravel={handleTravel}
          onClose={() => setWaypointsOpen(false)}
          accentColor={accent}
        />
      )}

      <AtlasMinimap
        imageUrl={minimapUrl}
        worldWidth={snapshot.width}
        worldHeight={snapshot.height}
        fogCircles={visibleLayers.fogOfWar ? fogCirclesForMinimap(snapshot) : []}
        hero={heroPoint}
        subscribe={subscribeCamera}
        onPan={(x, y) => rendererRef.current?.flyTo(x, y, undefined, 250)}
        accentColor={accent}
        fogColor={getUniverseLook(universeSlug).fogColor}
      />

      {isDrawerOpen && (
        <div className="absolute top-4 right-4 bottom-24 z-40 flex">
          <MapLocationDrawer
            location={selectedLocation}
            region={selectedRegion}
            event={selectedEvent}
            territory={selectedTerritory}
            userChapter={userChapter}
            universeSlug={universeSlug}
            onClose={handleCloseDrawer}
            onShowOnLadder={onShowOnLadder}
            onShowInRoster={onShowInRoster}
            onFlyToLocation={(x, y) => rendererRef.current?.flyTo(x, y, 1.8, 400)}
            allEvents={snapshot.events}
            characterPaths={snapshot.characterPaths}
            accentColor={accent}
          />
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-none">
        <MapTimelineBar
          currentChapter={userChapter}
          totalChapters={totalChapters}
          onChapterChange={onChapterChange || (() => {})}
          events={snapshot.events}
          activeCharacterName={heroName}
          accentColor={accent}
          className="w-full max-w-4xl mx-auto shadow-2xl"
        />
      </div>
    </div>
  );
}

export default RpgWorldAtlas;
