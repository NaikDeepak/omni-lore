'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WorldMapDefinition, MapMode, MapVisibleLayers } from '../../domain/map-types';
import { MapTheme, getMapTheme } from '../../domain/map-themes';
import { projectTemporalMap, ProjectedWorldMapSnapshot } from '../../projections/temporal-map';
import { PixiWorldRenderer } from '../../engine/map/pixi-world-renderer';
import { MapHudControls, PlaneOption } from './MapHudControls';
import { MapTimelineBar } from './MapTimelineBar';
import { MapLocationDrawer } from './MapLocationDrawer';

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
  activePlaneId?: string;
  planes?: PlaneOption[];
  onSelectPlane?: (planeId: string) => void;
  initialMode?: MapMode;
  className?: string;
  activeCharacterId?: string;
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
  activePlaneId: activePlaneIdProp,
  planes = [],
  onSelectPlane,
  initialMode = 'atlas',
  className = '',
  activeCharacterId,
  onJumpToJourney,
  onSelectForDuel,
  onShowOnLadder,
  onShowInRoster,
}: RpgWorldAtlasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<PixiWorldRenderer | null>(null);

  const universeSlug = universeSlugProp || mapDefinition.universeId || 'reverend-insanity';
  const activeTheme = useMemo(() => themeProp || getMapTheme(universeSlug), [themeProp, universeSlug]);

  const [mode, setMode] = useState<MapMode>(initialMode);
  const [visibleLayers, setVisibleLayers] = useState<MapVisibleLayers>(DEFAULT_VISIBLE_LAYERS);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activePlaneId, setActivePlaneId] = useState<string>(activePlaneIdProp || planes[0]?.id || 'main');

  // Compute Zero-Spoiler Projected Snapshot bounded strictly by userChapter
  const snapshot: ProjectedWorldMapSnapshot = useMemo(() => {
    return projectTemporalMap(mapDefinition, userChapter, { activeCharacterId });
  }, [mapDefinition, userChapter, activeCharacterId]);

  // Selection Handlers
  const handleSelectLocation = useCallback(
    (id: string | null) => {
      setSelectedLocationId(id);
      setSelectedRegionId(null);
      setSelectedEventId(null);
      onSelectLocationProp?.(id);

      if (id && rendererRef.current) {
        const loc = snapshot.locations.find((l) => l.id === id);
        if (loc) {
          rendererRef.current.flyTo(loc.x, loc.y, 1.8, 450);
        }
      }
    },
    [onSelectLocationProp, snapshot.locations]
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

  // Initialize PixiWorldRenderer and Lifecycle
  useEffect(() => {
    if (!canvasRef.current || typeof window === 'undefined') return;

    const container = containerRef.current;
    const width = container?.clientWidth || 800;
    const height = container?.clientHeight || 600;

    const renderer = new PixiWorldRenderer(canvasRef.current, {
      width,
      height,
      mode,
      onSelectLocation: (id) => handleSelectLocation(id),
      onSelectRegion: (id) => handleSelectRegion(id),
      onSelectEvent: (id) => handleSelectEvent(id),
    });

    rendererRef.current = renderer;

    // Synchronize initial snapshot rendering
    renderer.renderSnapshot(snapshot, activeTheme, {
      mode,
      activeLayers: visibleLayers,
    });

    // ResizeObserver for dynamic container adjustments
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && container) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          if (w > 0 && h > 0) {
            renderer.resize(w, h);
          }
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      renderer.destroy(true);
      rendererRef.current = null;
    };
  }, []); // Run once on mount

  // Sync snapshot or theme updates to existing renderer
  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.renderSnapshot(snapshot, activeTheme, {
      mode,
      activeLayers: visibleLayers,
    });
  }, [snapshot, activeTheme, mode, visibleLayers]);

  // Mode change handler
  const handleModeChange = useCallback(
    (newMode: MapMode) => {
      setMode(newMode);
      if (rendererRef.current) {
        rendererRef.current.setMode(newMode);
      }
    },
    []
  );

  // Layer toggle handler
  const handleToggleLayer = useCallback((layerName: string) => {
    setVisibleLayers((prev) => {
      const next = { ...prev, [layerName]: !prev[layerName] };
      return next;
    });

    if (rendererRef.current) {
      rendererRef.current.toggleLayer(layerName);
    }
  }, []);

  // Zoom Controls
  const handleZoomIn = useCallback(() => {
    if (!rendererRef.current) return;
    rendererRef.current.camera.zoomBy(1.25);
    rendererRef.current.syncCameraTransform();
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!rendererRef.current) return;
    rendererRef.current.camera.zoomBy(0.8);
    rendererRef.current.syncCameraTransform();
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!rendererRef.current) return;
    rendererRef.current.camera.reset(1.0);
    rendererRef.current.syncCameraTransform();
  }, []);

  const handleRecenter = useCallback(() => {
    if (!rendererRef.current) return;
    if (snapshot.currentPosition) {
      rendererRef.current.flyTo(snapshot.currentPosition.x, snapshot.currentPosition.y, 1.5, 400);
    } else {
      rendererRef.current.flyTo(snapshot.width / 2, snapshot.height / 2, 1.0, 400);
    }
  }, [snapshot.currentPosition, snapshot.width, snapshot.height]);

  const handlePlaneChange = useCallback(
    (planeId: string) => {
      setActivePlaneId(planeId);
      onSelectPlane?.(planeId);
    },
    [onSelectPlane]
  );

  // Selected entities for Drawer
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
    return (
      snapshot.territories.find((t) => t.factionId === selectedLocation.controllingFactionId) || null
    );
  }, [snapshot.territories, selectedLocation]);

  const isDrawerOpen = Boolean(selectedLocation || selectedRegion || selectedEvent);

  return (
    <div
      ref={containerRef}
      data-testid="rpg-world-atlas-container"
      className={`relative w-full h-[650px] lg:h-[750px] bg-[#040814] overflow-hidden rounded-2xl border-2 border-slate-800 shadow-2xl select-none ${className}`}
      style={{
        boxShadow: `0 0 35px ${activeTheme.palette.primaryAccent}15`,
      }}
    >
      {/* PixiJS WebGL Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="rpg-atlas-canvas"
        className="w-full h-full block touch-none cursor-grab active:cursor-grabbing"
      />

      {/* Retro CRT Scanlines & Radial Vignette Overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-40 z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(2,6,23,0.7)_100%)] z-10"
        aria-hidden="true"
      />

      {/* Top Floating HUD Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        <MapHudControls
          mode={mode}
          onModeChange={handleModeChange}
          visibleLayers={visibleLayers}
          onToggleLayer={handleToggleLayer}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onRecenter={handleRecenter}
          planes={planes}
          activePlaneId={activePlaneId}
          onPlaneChange={handlePlaneChange}
          accentColor={activeTheme.palette.primaryAccent}
          className="w-full max-w-4xl mx-auto shadow-2xl"
        />
      </div>

      {/* Right Slide-over Location/Region/Event Drawer */}
      {isDrawerOpen && (
        <div className="absolute top-4 right-4 bottom-24 z-30 flex">
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
            accentColor={activeTheme.palette.primaryAccent}
          />
        </div>
      )}

      {/* Bottom Floating Timeline Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
        <MapTimelineBar
          currentChapter={userChapter}
          totalChapters={totalChapters}
          onChapterChange={onChapterChange || (() => {})}
          events={snapshot.events}
          activeCharacterName={snapshot.characterPaths?.[0]?.characterName || 'Fang Yuan'}
          accentColor={activeTheme.palette.primaryAccent}
          className="w-full max-w-4xl mx-auto shadow-2xl"
        />
      </div>
    </div>
  );
}

export default RpgWorldAtlas;
