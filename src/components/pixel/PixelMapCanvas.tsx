import React, { useState } from 'react';
import { MapPlaneItem, MapLocationItem } from '../../projections/world-map';
import { PixelGauge } from './PixelGauge';
import { Compass, MapPin, Sparkles, History } from 'lucide-react';

interface PixelMapCanvasProps {
  planes: MapPlaneItem[];
  userChapter: number;
  totalChapters: number;
  activePlaneId?: string;
}

function getLocationIcon(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();
  if (text.includes('sky') || text.includes('cloud') || text.includes('weather') || text.includes('skypiea')) return '☁';
  if (text.includes('ocean') || text.includes('undersea') || text.includes('trench') || text.includes('fish-man') || text.includes('prison')) return '🌊';
  if (text.includes('mountain') || text.includes('peak') || text.includes('valley') || text.includes('abyss') || text.includes('crag')) return '⛰';
  if (text.includes('sect') || text.includes('academy') || text.includes('institute') || text.includes('pavilion') || text.includes('hall') || text.includes('edifice')) return '🏛';
  if (text.includes('island') || text.includes('village') || text.includes('town') || text.includes('park') || text.includes('cape')) return '🏝';
  if (text.includes('empire') || text.includes('capital') || text.includes('city') || text.includes('castle') || text.includes('fortress') || text.includes('estate') || text.includes('manor')) return '🏯';
  return '📍';
}

function getClampedCoords(loc: MapLocationItem, idx: number, total: number) {
  let x = loc.coordinates?.x;
  let y = loc.coordinates?.y;
  if (x === undefined || y === undefined) {
    x = 40 + (idx * 310) / Math.max(total - 1, 1);
    y = 60 + ((idx % 3) * 45);
  }
  return {
    x: Math.min(Math.max(x, 25), 375),
    y: Math.min(Math.max(y, 25), 200),
  };
}

export function PixelMapCanvas({
  planes,
  userChapter,
  totalChapters,
}: PixelMapCanvasProps) {
  const [selectedPlaneIndex, setSelectedPlaneIndex] = useState(0);
  const [activeLocation, setActiveLocation] = useState<MapLocationItem | null>(null);

  const currentPlane = planes[selectedPlaneIndex] ?? planes[0];
  const locations = currentPlane?.locations ?? [];

  // Calculate fog of war lift percentage based on userChapter
  const progressRatio = Math.min(Math.max(userChapter / totalChapters, 0.15), 1.0);

  // Generate travel path line connecting discovered locations
  const travelPath = locations.length >= 2
    ? locations.map((loc, i) => {
        const pt = getClampedCoords(loc, i, locations.length);
        return `${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`;
      }).join(' ')
    : null;

  return (
    <div className="space-y-4 font-mono">
      {/* Plane Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-700">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="font-pixel text-xs text-amber-300">PLANE SELECTOR:</span>
          <div className="flex flex-wrap gap-1.5">
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
      <div className="relative rounded-2xl border-2 border-slate-700 bg-[#060a14] p-6 shadow-2xl overflow-hidden min-h-[440px] flex flex-col items-center justify-center">
        {/* Pixel Scanline Background Grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Map Header Status */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded border border-slate-700 text-xs">
          <div>
            <span className="font-pixel text-cyan-400">{currentPlane?.name}</span>
            <span className="text-slate-500 ml-2">Tier {currentPlane?.tier_order} Cosmos</span>
          </div>
          <span className="text-amber-400 font-pixel text-[11px] border-l border-slate-700 pl-3">
            {locations.length} Discovered
          </span>
        </div>

        {/* Interactive Pixel Landscape */}
        <div className="relative w-full max-w-2xl aspect-[16/9] bg-[#0c1527] rounded-xl border border-slate-800 overflow-hidden shadow-inner">
          {/* Pixel Ocean Water Pattern */}
          <div className="absolute inset-0 bg-[#070f1e] opacity-80" />

          {/* Continents Pixel Contour (SVG stylized terrain) */}
          <svg viewBox="0 0 400 225" className="absolute inset-0 w-full h-full">
            {/* Continent Landmass 1 */}
            <path
              d="M 30,40 L 160,35 L 200,85 L 180,165 L 90,185 L 25,130 Z"
              fill="#182a47"
              stroke="#254373"
              strokeWidth="1.5"
            />
            {/* Mountain Range Peaks */}
            <text x="60" y="80" fontSize="14" fill="#38bdf8" opacity="0.5">⛰</text>
            <text x="110" y="95" fontSize="16" fill="#38bdf8" opacity="0.6">⛰</text>
            <text x="140" y="65" fontSize="13" fill="#38bdf8" opacity="0.5">⛰</text>

            {/* Continent Landmass 2 */}
            <path
              d="M 220,55 L 350,45 L 380,120 L 340,195 L 235,175 L 210,105 Z"
              fill="#1a2d4c"
              stroke="#29487a"
              strokeWidth="1.5"
            />
            <text x="260" y="90" fontSize="14" fill="#38bdf8" opacity="0.5">⛰</text>
            <text x="310" y="125" fontSize="18" fill="#38bdf8" opacity="0.6">⛰</text>

            {/* Travel Path Polyline */}
            {travelPath && (
              <path
                d={travelPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.2"
                strokeDasharray="3,3"
                opacity="0.45"
              />
            )}

            {/* Explored Location Pins */}
            {locations.map((loc, idx) => {
              const { x, y } = getClampedCoords(loc, idx, locations.length);
              const isSelected = activeLocation?.id === loc.id;
              const icon = getLocationIcon(loc.name, loc.description);

              return (
                <g 
                  key={loc.id} 
                  className="cursor-pointer group"
                  onClick={() => setActiveLocation(loc)}
                >
                  {/* Glowing marker ripple */}
                  <circle 
                    cx={x} 
                    cy={y} 
                    r={isSelected ? "15" : "9"} 
                    fill={isSelected ? "#38bdf8" : "#f59e0b"} 
                    opacity={isSelected ? "0.35" : "0.2"} 
                    className={isSelected ? "animate-ping" : "animate-pulse"} 
                  />
                  {/* Pixel Landmark Icon or SVG Sprite */}
                  {loc.thumbnail_url ? (
                    <image 
                      href={loc.thumbnail_url} 
                      x={isSelected ? x - 10 : x - 8} 
                      y={isSelected ? y - 10 : y - 8} 
                      width={isSelected ? "20" : "16"} 
                      height={isSelected ? "20" : "16"} 
                      className="select-none filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)] [image-rendering:pixelated]" 
                    />
                  ) : (
                    <text 
                      x={x - 7} 
                      y={y + 5} 
                      fontSize={isSelected ? "16" : "13"} 
                      className="select-none filter drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
                    >
                      {icon}
                    </text>
                  )}
                  {/* Location Label Badge */}
                  <rect 
                    x={x - 30} 
                    y={y + 11} 
                    width="60" 
                    height="13" 
                    rx="2" 
                    fill="#030712" 
                    stroke={isSelected ? "#38bdf8" : "#f59e0b"} 
                    strokeWidth={isSelected ? "1.5" : "0.8"} 
                    opacity="0.92"
                  />
                  <text 
                    x={x} 
                    y={y + 20} 
                    textAnchor="middle" 
                    fontSize="6.5" 
                    fill={isSelected ? "#7dd3fc" : "#fef08a"} 
                    fontFamily="Silkscreen"
                  >
                    {loc.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}

            {/* Dynamic Fog of War Layer */}
            {/* Fog lifts from left to right as chapter progresses */}
            <rect
              x={progressRatio * 400}
              y="0"
              width={400 - progressRatio * 400}
              height="225"
              fill="#030712"
              opacity="0.92"
            />
            {/* Fog Texture / Dithered Fringe */}
            {progressRatio < 0.98 && (
              <g opacity="0.8">
                <text x={progressRatio * 400 + 8} y="40" fontSize="12" fill="#475569">░░░░░░░░░░░░░</text>
                <text x={progressRatio * 400 + 8} y="80" fontSize="12" fill="#475569">░░ UNEXPLORED ░░</text>
                <text x={progressRatio * 400 + 8} y="120" fontSize="12" fill="#475569">░░░ REALM FOG ░░░</text>
                <text x={progressRatio * 400 + 8} y="160" fontSize="12" fill="#475569">░░░░░░░░░░░░░</text>
              </g>
            )}
          </svg>

          {/* Compass Rose */}
          <div className="absolute bottom-3 right-3 text-slate-600 font-pixel text-[9px] select-none bg-slate-950/70 p-1 rounded border border-slate-800">
            N ↑ E →
          </div>
        </div>

        {/* Location Quick-Jump Pills */}
        {locations.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 max-w-2xl justify-center">
            {locations.map((loc) => {
              const isSelected = activeLocation?.id === loc.id;
              const icon = getLocationIcon(loc.name, loc.description);
              return (
                <button
                  key={loc.id}
                  onClick={() => setActiveLocation(loc)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition font-pixel flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {loc.thumbnail_url ? (
                    <img 
                      src={loc.thumbnail_url} 
                      alt="" 
                      className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]" 
                    />
                  ) : (
                    <span>{icon}</span>
                  )}
                  <span>{loc.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Location Dialogue Box */}
        {activeLocation ? (
          <div className="mt-3 w-full max-w-2xl p-4 rounded-xl border border-amber-500/50 bg-slate-900/95 space-y-3 shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-4">
              {activeLocation.thumbnail_url && (
                <div className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-amber-500/40 bg-slate-950 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                  <img
                    src={activeLocation.thumbnail_url}
                    alt={activeLocation.name}
                    className="w-full h-full object-contain [image-rendering:pixelated]"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <span className="font-pixel text-xs text-amber-300 flex items-center gap-1.5">
                    {!activeLocation.thumbnail_url && (
                      <span>{getLocationIcon(activeLocation.name, activeLocation.description)}</span>
                    )}
                    {activeLocation.name}
                    {activeLocation.coordinates && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        [{activeLocation.coordinates.x}, {activeLocation.coordinates.y}]
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                    First Appeared: Chapter {activeLocation.first_appearance}
                  </span>
                </div>

                {activeLocation.aliases && activeLocation.aliases.length > 0 && (
                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500 font-pixel">Known As:</span> {activeLocation.aliases.join(', ')}
                  </div>
                )}

                <p className="text-xs text-slate-300 leading-relaxed">{activeLocation.description}</p>
              </div>
            </div>

            {/* Historical Recorded Events at this location */}
            {activeLocation.events && activeLocation.events.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-pixel text-amber-400">
                  <History className="w-3 h-3" />
                  <span>RECORDED CANON EVENTS HERE (UP TO CH. {userChapter}):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeLocation.events.map((ev) => (
                    <span 
                      key={ev.id} 
                      className="text-[10px] font-mono bg-slate-950/80 border border-amber-500/30 px-2 py-0.5 rounded text-amber-200"
                    >
                      Ch. {ev.chapter} — {ev.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 text-xs text-slate-500 font-pixel italic">
            Click any discovered landmark pin to inspect realm lore, coordinates, and historical events.
          </div>
        )}
      </div>
    </div>
  );
}
