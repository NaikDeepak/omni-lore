import React, { useState } from 'react';
import { MapPlaneItem, MapLocationItem } from '../../projections/world-map';
import { PixelGauge } from './PixelGauge';
import { Eye, MapPin, Compass, Shield } from 'lucide-react';

interface PixelMapCanvasProps {
  planes: MapPlaneItem[];
  userChapter: number;
  totalChapters: number;
  activePlaneId?: string;
}

export function PixelMapCanvas({
  planes,
  userChapter,
  totalChapters,
}: PixelMapCanvasProps) {
  const [selectedPlaneIndex, setSelectedPlaneIndex] = useState(0);
  const [activeLocation, setActiveLocation] = useState<MapLocationItem | null>(null);

  const currentPlane = planes[selectedPlaneIndex] ?? planes[0];

  // Calculate fog of war lift percentage based on userChapter
  const progressRatio = Math.min(Math.max(userChapter / totalChapters, 0.15), 1.0);
  const knownPercentage = Math.round(progressRatio * 100);
  const unknownPercentage = 100 - knownPercentage;

  // Grid coordinates for terrain blocks
  const gridWidth = 14;
  const gridHeight = 8;

  return (
    <div className="space-y-4 font-mono">
      {/* Plane Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-700">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="font-pixel text-xs text-amber-300">PLANE SELECTOR:</span>
          <div className="flex gap-1.5">
            {planes.map((plane, idx) => (
              <button
                key={plane.id}
                onClick={() => {
                  setSelectedPlaneIndex(idx);
                  setActiveLocation(null);
                }}
                className={`text-xs px-3 py-1 rounded transition font-pixel ${
                  selectedPlaneIndex === idx
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {plane.name.split(' ')[0]} (T{plane.tier_order})
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Fog of War Gauge */}
        <div className="w-56">
          <PixelGauge 
            label="MAP DISCOVERY / FOG LIFTED" 
            value={Math.round(progressRatio * 10)} 
            max={10} 
            colorClass="text-cyan-400" 
          />
        </div>
      </div>

      {/* The Pixel Map Board */}
      <div className="relative rounded-2xl border-2 border-slate-700 bg-[#060a14] p-6 shadow-2xl overflow-hidden min-h-[420px] flex flex-col items-center justify-center">
        {/* Pixel Scanline Background Grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Map Header Status */}
        <div className="absolute top-4 left-4 z-10 bg-slate-950/80 px-3 py-1.5 rounded border border-slate-700 text-xs">
          <span className="font-pixel text-cyan-400">{currentPlane?.name}</span>
          <span className="text-slate-500 ml-2">Tier {currentPlane?.tier_order} Cosmos</span>
        </div>

        {/* Interactive Pixel Landscape */}
        <div className="relative w-full max-w-2xl aspect-[16/9] bg-[#0c1527] rounded-xl border border-slate-800 overflow-hidden shadow-inner">
          {/* Pixel Ocean Water Pattern */}
          <div className="absolute inset-0 bg-[#070f1e] opacity-80" />

          {/* Continents Pixel Contour (SVG stylized terrain) */}
          <svg viewBox="0 0 400 225" className="absolute inset-0 w-full h-full">
            {/* Continent Landmass 1 */}
            <path
              d="M 50,40 L 160,40 L 200,90 L 180,160 L 90,180 L 40,120 Z"
              fill="#182a47"
              stroke="#254373"
              strokeWidth="2"
            />
            {/* Mountain Range Peaks */}
            <text x="80" y="80" fontSize="16" fill="#38bdf8" opacity="0.6">⛰</text>
            <text x="110" y="100" fontSize="18" fill="#38bdf8" opacity="0.7">⛰</text>
            <text x="130" y="70" fontSize="14" fill="#38bdf8" opacity="0.5">⛰</text>

            {/* Continent Landmass 2 */}
            <path
              d="M 230,60 L 340,50 L 370,120 L 330,190 L 240,170 L 220,110 Z"
              fill="#1a2d4c"
              stroke="#29487a"
              strokeWidth="2"
            />
            <text x="270" y="100" fontSize="16" fill="#38bdf8" opacity="0.6">⛰</text>
            <text x="300" y="130" fontSize="20" fill="#38bdf8" opacity="0.7">⛰</text>

            {/* Explored Location Pins */}
            {currentPlane?.locations.map((loc, idx) => {
              const x = loc.coordinates?.x ? (loc.coordinates.x % 300) + 50 : 100 + idx * 80;
              const y = loc.coordinates?.y ? (loc.coordinates.y % 150) + 40 : 80 + idx * 40;
              const isSelected = activeLocation?.id === loc.id;

              return (
                <g 
                  key={loc.id} 
                  className="cursor-pointer group"
                  onClick={() => setActiveLocation(loc)}
                >
                  {/* Glowing marker ripple */}
                  <circle cx={x} cy={y} r={isSelected ? "14" : "9"} fill="#f59e0b" opacity="0.2" className="animate-pulse" />
                  {/* Pixel Castle / Sect Icon */}
                  <text 
                    x={x - 8} 
                    y={y + 6} 
                    fontSize="16" 
                    className="select-none filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                  >
                    🏯
                  </text>
                  {/* Location Label Badge */}
                  <rect 
                    x={x - 30} 
                    y={y + 12} 
                    width="60" 
                    height="14" 
                    rx="3" 
                    fill="#030712" 
                    stroke="#f59e0b" 
                    strokeWidth="1" 
                    opacity="0.9"
                  />
                  <text 
                    x={x} 
                    y={y + 22} 
                    textAnchor="middle" 
                    fontSize="7" 
                    fill="#fef08a" 
                    fontFamily="Silkscreen"
                  >
                    {loc.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}

            {/* Dynamic Fog of War Layer */}
            {/* The fog lifts from left to right as chapter progresses */}
            <rect
              x={progressRatio * 400}
              y="0"
              width={400 - progressRatio * 400}
              height="225"
              fill="#030712"
              opacity="0.92"
            />
            {/* Fog Texture / Dithered Fringe */}
            {progressRatio < 0.95 && (
              <g opacity="0.8">
                <text x={progressRatio * 400 + 10} y="40" fontSize="12" fill="#475569">░░░░░░░░░░░░░</text>
                <text x={progressRatio * 400 + 10} y="80" fontSize="12" fill="#475569">░░ UNEXPLORED ░░</text>
                <text x={progressRatio * 400 + 10} y="120" fontSize="12" fill="#475569">░░░ REALM FOG ░░░</text>
                <text x={progressRatio * 400 + 10} y="160" fontSize="12" fill="#475569">░░░░░░░░░░░░░</text>
              </g>
            )}
          </svg>

          {/* Compass Rose */}
          <div className="absolute bottom-3 right-3 text-slate-600 font-pixel text-[9px] select-none bg-slate-950/70 p-1 rounded border border-slate-800">
            N ↑ E →
          </div>
        </div>

        {/* Selected Location Dialogue Box */}
        {activeLocation ? (
          <div className="mt-4 w-full max-w-2xl p-4 rounded-xl border border-amber-500/50 bg-slate-900/95 space-y-1.5 shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <span className="font-pixel text-xs text-amber-300 flex items-center gap-1.5">
                <span>🏯</span> {activeLocation.name}
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                Discovered in Chapter {activeLocation.first_appearance}
              </span>
            </div>
            <p className="text-xs text-slate-300">{activeLocation.description}</p>
          </div>
        ) : (
          <div className="mt-4 text-xs text-slate-500 font-pixel italic">
            Click any discovered landmark (🏯) to inspect realm lore and regional factions.
          </div>
        )}
      </div>
    </div>
  );
}
