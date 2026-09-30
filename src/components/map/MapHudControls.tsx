'use client';

import React, { useState } from 'react';
import {
  Compass,
  Swords,
  Scroll,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Layers,
  Globe,
  ChevronDown,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react';
import { MapMode, MapVisibleLayers } from '../../domain/map-types';
import { SoundEngine } from '../../lib/sound-effects';

export interface PlaneOption {
  id: string;
  name: string;
  description?: string;
  locked?: boolean;
}

export interface MapHudControlsProps {
  mode: MapMode | string;
  onModeChange: (mode: MapMode) => void;
  visibleLayers: MapVisibleLayers;
  onToggleLayer: (layerName: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onRecenter: () => void;
  planes?: PlaneOption[];
  activePlaneId?: string;
  onPlaneChange?: (planeId: string) => void;
  onOpenWaypoints?: () => void;
  waypointCount?: number;
  accentColor?: string;
  className?: string;
}

const LAYER_CONFIGS: { key: string; label: string; icon?: string }[] = [
  { key: 'terrain', label: 'Terrain' },
  { key: 'regions', label: 'Regions' },
  { key: 'markers', label: 'Locations' },
  { key: 'territories', label: 'Factions' },
  { key: 'characterPaths', label: 'Characters' },
  { key: 'events', label: 'Events' },
  { key: 'routes', label: 'Routes' },
  { key: 'fogOfWar', label: 'Fog' },
  { key: 'labels', label: 'Labels' },
];

export function MapHudControls({
  mode,
  onModeChange,
  visibleLayers,
  onToggleLayer,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onRecenter,
  planes = [],
  activePlaneId,
  onPlaneChange,
  onOpenWaypoints,
  waypointCount,
  accentColor = '#10b981',
  className = '',
}: MapHudControlsProps) {
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);
  const [showPlaneDropdown, setShowPlaneDropdown] = useState(false);

  const normalizedMode = (mode?.toLowerCase() as MapMode) || 'atlas';

  const handleModeSelect = (newMode: MapMode) => {
    SoundEngine.playMenuSelect();
    onModeChange(newMode);
  };

  const handleLayerClick = (layerKey: string) => {
    SoundEngine.playMenuSelect();
    onToggleLayer(layerKey);
  };

  const handlePlaneSelect = (plane: PlaneOption) => {
    if (plane.locked) return;
    SoundEngine.playPlaneWarp();
    setShowPlaneDropdown(false);
    onPlaneChange?.(plane.id);
  };

  const currentPlane = planes.find((p) => p.id === activePlaneId) || planes[0];

  return (
    <div
      className={`pointer-events-auto flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/90 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-2xl font-mono text-xs ${className}`}
    >
      {/* 1. Mode Selector Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => handleModeSelect('atlas')}
          data-testid="mode-atlas"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-pixel text-[10px] tracking-wider transition-all uppercase ${
            normalizedMode === 'atlas'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
          style={
            normalizedMode === 'atlas'
              ? { borderColor: `${accentColor}80`, backgroundColor: `${accentColor}25` }
              : {}
          }
          title="Atlas Mode: Clean geography and landmarks"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>ATLAS</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSelect('adventure')}
          data-testid="mode-adventure"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-pixel text-[10px] tracking-wider transition-all uppercase ${
            normalizedMode === 'adventure'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
          title="Adventure Mode: Fog of war, quest markers & protagonist journey"
        >
          <Swords className="w-3.5 h-3.5" />
          <span>ADVENTURE</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSelect('lore')}
          data-testid="mode-lore"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-pixel text-[10px] tracking-wider transition-all uppercase ${
            normalizedMode === 'lore'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
          }`}
          title="Lore Mode: Factions, geopolitical spheres & chronicles"
        >
          <Scroll className="w-3.5 h-3.5" />
          <span>LORE</span>
        </button>
      </div>

      {/* Center Controls: Layer Toggles & Plane Selector */}
      <div className="flex flex-wrap items-center justify-end gap-2" data-testid="hud-right-cluster">
        {/* Plane Selector Dropdown (if multiple planes available) */}
        {planes.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPlaneDropdown(!showPlaneDropdown)}
              data-testid="plane-selector-btn"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl text-slate-200 hover:text-white transition font-mono text-[11px]"
              title="Switch cosmological plane or domain"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-pixel text-[10px] truncate max-w-[70px] sm:max-w-[120px]">
                {currentPlane?.name || 'PLANES'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showPlaneDropdown && (
              <div
                data-testid="plane-dropdown-menu"
                className="absolute left-0 mt-1.5 w-48 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2 py-1 text-[9px] font-pixel text-slate-400 uppercase tracking-widest border-b border-slate-800">
                  COSMIC PLANES
                </div>
                {planes.map((plane) => (
                  <button
                    key={plane.id}
                    type="button"
                    onClick={() => handlePlaneSelect(plane)}
                    disabled={plane.locked}
                    aria-disabled={plane.locked}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center justify-between ${
                      plane.id === activePlaneId
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <span className={`truncate ${plane.locked ? 'text-slate-600' : ''}`}>
                      {plane.locked ? '??? SEALED REALM' : plane.name}
                    </span>
                    {plane.id === activePlaneId && (
                      <span className="text-[10px] text-cyan-400 font-pixel">ACTIVE</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {onOpenWaypoints && (
          <button
            type="button"
            onClick={() => {
              SoundEngine.playMenuSelect();
              onOpenWaypoints();
            }}
            data-testid="waypoints-btn"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl text-slate-200 hover:text-white transition font-mono text-[11px]"
            title="Waypoints — fast travel (M)"
          >
            <MapPin className="w-3.5 h-3.5" style={{ color: accentColor }} />
            <span className="font-pixel text-[10px]">WAYPOINTS</span>
            <span className="font-mono text-[10px] text-slate-400">{waypointCount ?? 0}</span>
          </button>
        )}

        {/* Layer Toggles Popover/Pills */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayersDropdown(!showLayersDropdown)}
            data-testid="layers-toggle-btn"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 hover:border-slate-500 rounded-xl text-slate-200 hover:text-white transition font-mono text-[11px]"
            title="Toggle map visual layers"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-pixel text-[10px]">LAYERS</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLayersDropdown && (
            <div
              data-testid="layers-dropdown-menu"
              className="absolute left-0 mt-1.5 w-52 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-2 py-1 text-[9px] font-pixel text-slate-400 uppercase tracking-widest border-b border-slate-800">
                ACTIVE MAP LAYERS
              </div>
              <div className="grid grid-cols-1 gap-1 pt-1">
                {LAYER_CONFIGS.map(({ key, label }) => {
                  const isVisible = visibleLayers[key] ?? true;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleLayerClick(key)}
                      data-testid={`layer-btn-${key}`}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition border ${
                        isVisible
                          ? 'bg-slate-900 text-white border-slate-700'
                          : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-900/50'
                      }`}
                    >
                      <span>{label}</span>
                      {isVisible ? (
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Zoom & Recenter */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => {
            SoundEngine.playMenuSelect();
            onZoomIn();
          }}
          data-testid="zoom-in-btn"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            SoundEngine.playMenuSelect();
            onZoomOut();
          }}
          data-testid="zoom-out-btn"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            SoundEngine.playMenuSelect();
            onResetZoom();
          }}
          data-testid="zoom-reset-btn"
          className="flex items-center gap-1 px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition font-pixel text-[9px]"
          title="Fit plane to view"
        >
          <RotateCcw className="w-3 h-3" />
          <span>1.0x</span>
        </button>

        <button
          type="button"
          onClick={() => {
            SoundEngine.playMenuSelect();
            onRecenter();
          }}
          data-testid="recenter-btn"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Recenter Camera on Map"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
