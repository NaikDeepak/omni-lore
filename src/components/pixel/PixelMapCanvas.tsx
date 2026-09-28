'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPlaneItem, MapLocationItem } from '../../projections/world-map';
import { PixelGauge } from './PixelGauge';
import { PixelAvatar } from './PixelAvatar';
import { SoundEngine } from '../../lib/sound-effects';
import { 
  Compass, 
  MapPin, 
  Sparkles, 
  History, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Navigation, 
  Shield, 
  Search, 
  Eye, 
  EyeOff, 
  Crosshair, 
  Layers, 
  Flag, 
  Flame, 
  Anchor, 
  Crown, 
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export interface PixelMapCanvasProps {
  seriesSlug?: string;
  seriesTitle?: string;
  planes: MapPlaneItem[];
  userChapter: number;
  totalChapters: number;
  activePlaneId?: string;
  onChapterChange?: (chapter: number) => void;
  graph?: any;
  selectedLocationId?: string | null;
}

// Landmark Category Classification
function getLandmarkCategory(loc: MapLocationItem): 'capital' | 'sect' | 'danger' | 'special' | 'other' {
  const text = `${loc.name} ${loc.description} ${loc.aliases?.join(' ') ?? ''}`.toLowerCase();
  if (text.includes('sky') || text.includes('cloud') || text.includes('weather') || text.includes('fish-man') || text.includes('undersea') || text.includes('deep') || text.includes('sacred domain')) {
    return 'special';
  }
  if (text.includes('abyss') || text.includes('prison') || text.includes('forbidden') || text.includes('grave') || text.includes('danger') || text.includes('necropolis') || text.includes('beast king') || text.includes('onigashima')) {
    return 'danger';
  }
  if (text.includes('capital') || text.includes('empire') || text.includes('city') || text.includes('metropolis') || text.includes('kingdom') || text.includes('palace')) {
    return 'capital';
  }
  if (text.includes('sect') || text.includes('pavilion') || text.includes('hall') || text.includes('edifice') || text.includes('abode') || text.includes('estate') || text.includes('institute') || text.includes('fortress')) {
    return 'sect';
  }
  return 'other';
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

function getDangerRating(loc: MapLocationItem): { stars: number; label: string; color: string } {
  const text = `${loc.name} ${loc.description}`.toLowerCase();
  if (text.includes('laugh tale') || text.includes('demonic emperor peak') || text.includes('seven sacred mountains') || text.includes('necropolis') || text.includes('chaos sea') || text.includes('marineford') || text.includes('onigashima') || text.includes('sword star')) {
    return { stars: 5, label: 'EX-RANK FORBIDDEN APEX', color: 'text-rose-400 border-rose-500/40 bg-rose-950/40' };
  }
  if (text.includes('wano') || text.includes('whole cake') || text.includes('enies lobby') || text.includes('impel down') || text.includes('hell valley') || text.includes('beast king') || text.includes('skyrite') || text.includes('thunder canyon') || text.includes('all dragon') || text.includes('ultimate clear') || text.includes('quanrong')) {
    return { stars: 4, label: 'S-RANK HIGH HAZARD', color: 'text-amber-400 border-amber-500/40 bg-amber-950/40' };
  }
  if (text.includes('alabasta') || text.includes('skypiea') || text.includes('water 7') || text.includes('dressrosa') || text.includes('egghead') || text.includes('regent estate') || text.includes('demonic scheme') || text.includes('forest of darkness') || text.includes('sea bright') || text.includes('shangguan') || text.includes('mysterious heaven')) {
    return { stars: 3, label: 'A-RANK MAJOR SECTOR', color: 'text-indigo-400 border-indigo-500/40 bg-indigo-950/40' };
  }
  if (text.includes('loguetown') || text.includes('little garden') || text.includes('drum island') || text.includes('drifting flowers') || text.includes('veiled dragon') || text.includes('fenlai') || text.includes('ernst') || text.includes('merry woods')) {
    return { stars: 2, label: 'B-RANK REGIONAL HUB', color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40' };
  }
  return { stars: 1, label: 'SAFE HAVEN / SETTLEMENT', color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40' };
}

// Faction mapping for locations based on series
function getLocationControllingFaction(locId: string, seriesSlug?: string): { id: string; name: string; emblem?: string; color: string } | null {
  if (seriesSlug === 'one-piece') {
    if (['loc-marineford', 'loc-enies-lobby', 'loc-impel-down', 'loc-shells-town'].includes(locId)) {
      return { id: 'faction-marines', name: 'Marines & World Government', emblem: '/assets/pixels/one-piece/factions/faction-marines.svg', color: '#38bdf8' };
    }
    if (['loc-wano', 'loc-whole-cake', 'loc-hachinosu'].includes(locId)) {
      return { id: 'faction-yonko', name: 'Four Emperors (Yonko)', emblem: '/assets/pixels/one-piece/factions/faction-yonko.svg', color: '#f43f5e' };
    }
    if (['loc-foosha', 'loc-orange-town', 'loc-syrup-village', 'loc-baratie', 'loc-alabasta', 'loc-water-7', 'loc-fishman-island', 'loc-dressrosa', 'loc-zou', 'loc-egghead', 'loc-laugh-tale'].includes(locId)) {
      return { id: 'faction-straw-hats', name: 'Straw Hat Alliance', emblem: '/assets/pixels/one-piece/factions/faction-straw-hats.svg', color: '#f59e0b' };
    }
  }

  if (seriesSlug === 'demonic-emperor') {
    if (locId === 'loc-windgale-city' || locId === 'loc-thunder-canyon') {
      return { id: 'faction-luo', name: 'Luo Clan Grand Alliance', emblem: '/assets/pixels/demonic-emperor/factions/faction-luo.svg', color: '#f59e0b' };
    }
    if (locId === 'loc-drifting-flowers-city') {
      return { id: 'faction-drifting-flowers', name: 'Drifting Flowers Edifice', emblem: '/assets/pixels/demonic-emperor/factions/faction-drifting-flowers.svg', color: '#f472b6' };
    }
    if (locId === 'loc-veiled-dragon-pavilion') {
      return { id: 'faction-veiled-dragon', name: 'Veiled Dragon Pavilion', emblem: '/assets/pixels/demonic-emperor/factions/faction-veiled-dragon.svg', color: '#38bdf8' };
    }
    if (locId === 'loc-sword-marquis-abode') {
      return { id: 'faction-sword-marquise', name: 'Sword Marquis Abode', emblem: '/assets/pixels/demonic-emperor/factions/faction-sword-marquise.svg', color: '#94a3b8' };
    }
    if (locId === 'loc-regent-estate') {
      return { id: 'faction-regent', name: 'Regent Estate', emblem: '/assets/pixels/demonic-emperor/factions/faction-regent.svg', color: '#a855f7' };
    }
    if (locId === 'loc-hell-valley') {
      return { id: 'faction-hell-valley', name: 'Hell Valley', emblem: '/assets/pixels/demonic-emperor/factions/faction-hell-valley.svg', color: '#7e22ce' };
    }
    if (locId === 'loc-pill-king-hall') {
      return { id: 'faction-pill-king', name: 'Pill King Hall', emblem: '/assets/pixels/demonic-emperor/factions/faction-pill-king.svg', color: '#10b981' };
    }
    if (locId === 'loc-merry-woods') {
      return { id: 'faction-merry-woods', name: 'Merry Woods (Seventh House)', emblem: '/assets/pixels/demonic-emperor/factions/faction-merry-woods.svg', color: '#22c55e' };
    }
    if (locId === 'loc-dragon-cloud-city' || locId === 'loc-dugu-encampment' || locId === 'loc-all-dragon-mountain') {
      return { id: 'faction-tianyu-imperial', name: 'Tianyu Imperial Court & Dugu Army', emblem: '/assets/pixels/demonic-emperor/factions/faction-tianyu-imperial.svg', color: '#e11d48' };
    }
    if (locId === 'loc-demon-scheming-sect') {
      return { id: 'faction-demonic-scheme', name: 'Demon Scheming Sect', emblem: '/assets/pixels/demonic-emperor/factions/faction-demonic-scheme.svg', color: '#ef4444' };
    }
    if (locId === 'loc-double-dragon-manor' || locId === 'loc-mysterious-heaven-sect' || locId === 'loc-ultimate-clear-sect') {
      return { id: 'faction-double-dragon', name: 'Western Lands Supreme Sects', emblem: '/assets/pixels/demonic-emperor/factions/faction-double-dragon.svg', color: '#10b981' };
    }
    if (locId === 'loc-sword-star-capital') {
      return { id: 'faction-sword-star', name: 'Sword Star Empire & Baili Clan', emblem: '/assets/pixels/demonic-emperor/factions/faction-sword-star.svg', color: '#94a3b8' };
    }
    if (locId === 'loc-demonic-emperor-peak' || locId === 'loc-seven-sacred-mountains') {
      return { id: 'faction-luo', name: 'Demonic Emperor Sacred Domain', emblem: '/assets/pixels/demonic-emperor/factions/faction-luo.svg', color: '#d946ef' };
    }
  }

  if (seriesSlug === 'coiling-dragon') {
    if (['loc-wushan', 'loc-black-dirt-wasteland'].includes(locId)) {
      return { id: 'faction-baruch', name: 'Baruch Dragonblood Clan', emblem: '/assets/pixels/coiling-dragon/factions/faction-baruch.svg', color: '#f59e0b' };
    }
    if (['loc-fenlai-city', 'loc-ernst-institute'].includes(locId)) {
      return { id: 'faction-holy-union', name: 'Holy Union & Radiant Church', emblem: '/assets/pixels/coiling-dragon/factions/faction-holy-union.svg', color: '#38bdf8' };
    }
    if (['loc-forest-of-darkness', 'loc-necropolis-of-gods', 'loc-indigo-prefecture'].includes(locId)) {
      return { id: 'faction-beirut', name: 'Lord Beirut Domain', emblem: '/assets/pixels/coiling-dragon/factions/faction-beirut.svg', color: '#a855f7' };
    }
    if (['loc-skyrite-mountains'].includes(locId)) {
      return { id: 'faction-four-beasts', name: 'Four Divine Beasts Clan', emblem: '/assets/pixels/coiling-dragon/factions/faction-four-beasts.svg', color: '#10b981' };
    }
  }

  return null;
}

export function PixelMapCanvas({
  seriesSlug = 'one-piece',
  seriesTitle = 'World Atlas',
  planes,
  userChapter,
  totalChapters,
  onChapterChange,
  graph,
  selectedLocationId,
}: PixelMapCanvasProps) {
  const [selectedPlaneIndex, setSelectedPlaneIndex] = useState(0);
  const [activeLocation, setActiveLocation] = useState<MapLocationItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'capital' | 'sect' | 'danger' | 'special'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive View Controls
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Layer Toggles
  const [showRoute, setShowRoute] = useState(true);
  const [showTerritories, setShowTerritories] = useState(true);
  const [showFogPreview, setShowFogPreview] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const allCombinedLocations = useMemo(() => {
    const locMap = new Map<string, MapLocationItem>();
    planes.forEach(p => {
      p.locations.forEach(l => {
        if (!locMap.has(l.id)) {
          locMap.set(l.id, l);
        }
      });
    });
    return Array.from(locMap.values());
  }, [planes]);

  useEffect(() => {
    if (selectedLocationId) {
      const loc = allCombinedLocations.find(l => l.id === selectedLocationId);
      if (loc) {
        const pIdx = planes.findIndex(p => p.locations.some(l => l.id === selectedLocationId));
        if (pIdx !== -1) {
          setSelectedPlaneIndex(pIdx);
        }
        setActiveLocation(loc);
      }
    }
  }, [selectedLocationId, allCombinedLocations, planes]);

  const currentPlane = selectedPlaneIndex === -1 ? null : (planes[selectedPlaneIndex] ?? planes[0]);
  const allLocations = selectedPlaneIndex === -1 ? allCombinedLocations : (currentPlane?.locations ?? []);

  // Locations filtered by category and search
  const visibleLocations = useMemo(() => {
    return allLocations.filter((loc) => {
      const matchesCategory = categoryFilter === 'all' || getLandmarkCategory(loc) === categoryFilter;
      const matchesSearch = searchQuery.trim() === '' || 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.aliases?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [allLocations, categoryFilter, searchQuery]);

  // Discovered locations based on userChapter
  const discoveredLocations = useMemo(() => {
    return allLocations.filter((loc) => loc.first_appearance <= userChapter);
  }, [allLocations, userChapter]);

  // Chronological Route Points
  const journeyPath = useMemo(() => {
    const route = [...discoveredLocations].sort((a, b) => a.first_appearance - b.first_appearance);
    if (route.length < 2) return null;
    return route
      .filter((loc) => loc.coordinates?.x !== undefined && loc.coordinates?.y !== undefined)
      .map((loc, i) => `${i === 0 ? 'M' : 'L'} ${loc.coordinates!.x},${loc.coordinates!.y}`)
      .join(' ');
  }, [discoveredLocations]);

  // Current Protagonist Position
  const currentProtagonistLocation = useMemo(() => {
    if (discoveredLocations.length === 0) return null;
    return [...discoveredLocations].sort((a, b) => b.first_appearance - a.first_appearance)[0];
  }, [discoveredLocations]);

  // Discovery progress percentage
  const progressRatio = allLocations.length > 0
    ? Math.min(Math.max(discoveredLocations.length / allLocations.length, 0.05), 1.0)
    : Math.min(Math.max(userChapter / totalChapters, 0.05), 1.0);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.75));
  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Center on a specific landmark
  const handleFocusLocation = (loc: MapLocationItem) => {
    setActiveLocation(loc);
    if (loc.coordinates) {
      // Smoothly pan so that landmark is at center (500, 290)
      const targetPanX = (500 - loc.coordinates.x) * zoom;
      const targetPanY = (290 - loc.coordinates.y) * zoom;
      setPan({ x: targetPanX, y: targetPanY });
    }
  };

  // Protagonist Vehicle Token Icon
  const getProtagonistToken = () => {
    if (seriesSlug === 'one-piece') return { icon: '🏴‍☠️', label: 'Thousand Sunny', color: '#f59e0b' };
    if (seriesSlug === 'demonic-emperor') return { icon: '🦅', label: 'Kunpeng Wings', color: '#ef4444' };
    if (seriesSlug === 'coiling-dragon') return { icon: '🐉', label: 'Baruch Dragon', color: '#10b981' };
    return { icon: '⚔', label: 'Protagonist Expedition', color: '#38bdf8' };
  };

  const protagonistToken = getProtagonistToken();

  return (
    <div className="space-y-4 font-mono select-none">
      {/* Top Header & Plane Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Compass className="w-4 h-4 animate-spin" />
            <span className="font-pixel text-xs text-amber-300">PLANE SELECTOR:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {planes.length > 1 && (
              <button
                onClick={() => {
                  setSelectedPlaneIndex(-1);
                  setActiveLocation(null);
                  handleResetView();
                  SoundEngine.playPlaneWarp();
                }}
                className={`text-xs px-3 py-1 rounded transition font-pixel flex items-center gap-1.5 ${
                  selectedPlaneIndex === -1
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>🌍 ALL REGIONS</span>
                <span className="text-[10px] opacity-75 font-mono">({allCombinedLocations.length})</span>
              </button>
            )}
            {planes.map((plane, idx) => (
              <button
                key={plane.id}
                onClick={() => {
                  setSelectedPlaneIndex(idx);
                  setActiveLocation(null);
                  handleResetView();
                  SoundEngine.playPlaneWarp();
                }}
                className={`text-xs px-3 py-1 rounded transition font-pixel flex items-center gap-1.5 ${
                  selectedPlaneIndex === idx
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{plane.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({plane.locations.length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Discovery Gauge */}
        <div className="w-64">
          <PixelGauge 
            label={`FOG OF WAR LIFTED (${discoveredLocations.length}/${allLocations.length} LANDMARKS)`} 
            value={discoveredLocations.length} 
            max={Math.max(allLocations.length, 1)} 
            colorClass="text-cyan-400" 
          />
        </div>
      </div>

      {/* Interactive Toolbar: Search, Filters, and Layer Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search landmarks or islands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono text-xs"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1 font-pixel text-[11px]">
          {(['all', 'capital', 'sect', 'danger', 'special'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded border transition ${
                categoryFilter === cat
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' && 'ALL REGIONS'}
              {cat === 'capital' && '👑 CAPITALS'}
              {cat === 'sect' && '🏛️ FORTS / SECTS'}
              {cat === 'danger' && '☠️ FORBIDDEN'}
              {cat === 'special' && '✨ SPECIAL'}
            </button>
          ))}
        </div>

        {/* Layer Toggles & Zoom Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setShowRoute(r => !r)}
            className={`p-1.5 rounded border transition flex items-center gap-1 font-pixel text-[10px] ${
              showRoute ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Toggle Protagonist Journey Route"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ROUTE</span>
          </button>

          <button
            onClick={() => setShowTerritories(t => !t)}
            className={`p-1.5 rounded border transition flex items-center gap-1 font-pixel text-[10px] ${
              showTerritories ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Toggle Faction Territory Borders"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">ZONES</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Zoom In / Out / Reset */}
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 transition"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* THE MAIN CARTOGRAPHY BOARD */}
      <div 
        ref={containerRef}
        className="relative rounded-2xl border-2 border-slate-700 bg-[#040814] shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Subtle Scanlines & Vignette */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] z-20" />

        {/* Current Expedition HUD Indicator */}
        <div className="absolute top-4 left-4 z-30 flex flex-wrap items-center gap-2 bg-slate-950/85 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 shadow-xl text-xs">
          <span className="text-amber-400 font-pixel font-bold flex items-center gap-1.5">
            <span>{protagonistToken.icon}</span>
            <span>CH. {userChapter} EXPEDITION:</span>
          </span>
          {currentProtagonistLocation ? (
            <span className="text-cyan-300 font-medium">
              Stationed at <span className="underline decoration-amber-500/50">{currentProtagonistLocation.name}</span>
            </span>
          ) : (
            <span className="text-slate-500">Uncharted Departure</span>
          )}
          <span className="text-[10px] text-slate-500 border-l border-slate-800 pl-2 font-mono">
            {discoveredLocations.length} / {allLocations.length} Discovered
          </span>
        </div>

        {/* Zoom & Viewport Status Pill */}
        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 text-[10px] text-slate-400 font-pixel">
          <Crosshair className="w-3 h-3 text-cyan-400" />
          <span>ZOOM: {Math.round(zoom * 100)}%</span>
          <span className="text-slate-600">|</span>
          <span>DRAG TO PAN</span>
        </div>

        {/* SVG CARTOGRAPHY ENGINE CANVAS */}
        <div className="relative w-full aspect-[16/9.2] overflow-hidden">
          <svg
            viewBox="0 0 1000 580"
            className="w-full h-full"
            style={{ imageRendering: 'pixelated' }}
          >
            {/* TRANSFORM MASTER GROUP FOR ZOOM & PAN */}
            <g
              transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
              style={{ transformOrigin: '500px 290px', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}
            >
              {/* ======================================================== */}
              {/* UNIVERSE 1: ONE PIECE — THE GRAND LINE NAUTICAL WORLD ATLAS */}
              {/* ======================================================== */}
              {seriesSlug === 'one-piece' && (
                <g id="one-piece-cartography">
                  {/* Ocean Base Gradient */}
                  <rect x="0" y="0" width="1000" height="580" fill="#040e1f" />

                  {/* Ocean Wave Texture Lines */}
                  <path
                    d="M 20,80 Q 70,70 120,80 T 220,80 T 320,80 T 420,80 M 550,80 Q 600,70 650,80 T 750,80 T 850,80 T 950,80
                       M 40,480 Q 90,470 140,480 T 240,480 T 340,480 M 570,480 Q 620,470 670,480 T 770,480 T 870,480 T 970,480"
                    fill="none"
                    stroke="#0b2447"
                    strokeWidth="1.5"
                    strokeDasharray="4,8"
                    opacity="0.5"
                  />

                  {/* ==================== THE RED LINE ==================== */}
                  {/* Majestic Vertical Continental Wall spanning from North to South */}
                  <g id="red-line" opacity="0.95">
                    {/* Shadow Behind Red Line */}
                    <rect x="475" y="0" width="40" height="580" fill="#4c0519" opacity="0.4" />
                    
                    {/* Main Red Line Rock Mass */}
                    <path
                      d="M 485,0 
                         L 488,60 L 483,120 L 487,180 L 482,240 L 486,290 L 482,350 L 487,410 L 483,470 L 488,530 L 485,580 
                         L 515,580 
                         L 512,530 L 517,470 L 513,410 L 518,350 L 514,290 L 518,240 L 513,180 L 517,120 L 512,60 L 515,0 Z"
                      fill="#881337"
                      stroke="#e11d48"
                      strokeWidth="2"
                    />

                    {/* Red Line Rock Strata Texture */}
                    <path
                      d="M 492,0 L 492,580 M 508,0 L 508,580 M 500,20 L 500,560"
                      stroke="#9f1239"
                      strokeWidth="1"
                      strokeDasharray="6,12"
                      opacity="0.6"
                    />

                    {/* Holy Land Mary Geoise Plateau Crest (Top of the Red Line) */}
                    <rect x="480" y="280" width="40" height="20" rx="3" fill="#be123c" stroke="#fecdd3" strokeWidth="1.5" />
                    <text x="500" y="293" fontSize="7" fill="#ffffff" fontWeight="bold" textAnchor="middle" fontFamily="Silkscreen">
                      MARY GEOISE
                    </text>

                    {/* Red Line Label Vertical */}
                    <text x="500" y="80" fontSize="10" fill="#fecdd3" opacity="0.8" textAnchor="middle" fontWeight="bold" fontFamily="Silkscreen" letterSpacing="4">
                      RED LINE
                    </text>
                    <text x="500" y="520" fontSize="10" fill="#fecdd3" opacity="0.8" textAnchor="middle" fontWeight="bold" fontFamily="Silkscreen" letterSpacing="4">
                      RED LINE
                    </text>
                  </g>

                  {/* ==================== THE CALM BELTS ==================== */}
                  {/* Northern Calm Belt Band */}
                  <rect x="0" y="165" width="1000" height="40" fill="#020617" opacity="0.75" />
                  <path d="M 0,165 L 1000,165 M 0,205 L 1000,205" stroke="#1e293b" strokeWidth="1" strokeDasharray="6,6" opacity="0.6" />
                  <text x="80" y="188" fontSize="8" fill="#475569" fontWeight="bold" fontFamily="Silkscreen" letterSpacing="3">
                    ⚓ CALM BELT (SEA KINGS DOMAIN)
                  </text>
                  <text x="600" y="188" fontSize="8" fill="#475569" fontWeight="bold" fontFamily="Silkscreen" letterSpacing="3">
                    ⚓ CALM BELT (NO CURRENTS / SEA KINGS)
                  </text>

                  {/* Southern Calm Belt Band */}
                  <rect x="0" y="375" width="1000" height="40" fill="#020617" opacity="0.75" />
                  <path d="M 0,375 L 1000,375 M 0,415 L 1000,415" stroke="#1e293b" strokeWidth="1" strokeDasharray="6,6" opacity="0.6" />
                  <text x="80" y="398" fontSize="8" fill="#475569" fontWeight="bold" fontFamily="Silkscreen" letterSpacing="3">
                    ⚓ CALM BELT (SEA KINGS DOMAIN)
                  </text>
                  <text x="600" y="398" fontSize="8" fill="#475569" fontWeight="bold" fontFamily="Silkscreen" letterSpacing="3">
                    ⚓ CALM BELT (NO CURRENTS / SEA KINGS)
                  </text>

                  {/* ==================== THE GRAND LINE SEA LANE ==================== */}
                  {/* Equatorial current flow */}
                  <rect x="0" y="205" width="1000" height="170" fill="#03152f" opacity="0.4" />
                  <path
                    d="M 120,290 L 470,290 M 530,290 L 980,290"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="8,6"
                    opacity="0.35"
                  />
                  <text x="280" y="225" fontSize="11" fill="#38bdf8" opacity="0.6" fontWeight="bold" fontFamily="Silkscreen" letterSpacing="4">
                    PARADISE (FIRST HALF)
                  </text>
                  <text x="730" y="225" fontSize="11" fill="#f43f5e" opacity="0.6" fontWeight="bold" fontFamily="Silkscreen" letterSpacing="4">
                    THE NEW WORLD (SHINSEKAI)
                  </text>

                  {/* ==================== THE FOUR BLUES ==================== */}
                  <g id="four-blues-labels" opacity="0.5" fontFamily="Silkscreen" fontSize="12" fontWeight="bold">
                    <text x="250" y="90" fill="#0284c7" textAnchor="middle" letterSpacing="3">NORTH BLUE</text>
                    <text x="750" y="90" fill="#0284c7" textAnchor="middle" letterSpacing="3">SOUTH BLUE</text>
                    <text x="250" y="520" fill="#f59e0b" textAnchor="middle" letterSpacing="3">EAST BLUE (PEACEFUL SEA)</text>
                    <text x="750" y="520" fill="#0284c7" textAnchor="middle" letterSpacing="3">WEST BLUE</text>
                  </g>

                  {/* Reverse Mountain Entry Funnel (Ascending Waterways) */}
                  <g id="reverse-mountain-funnel">
                    <circle cx="110" cy="285" r="22" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
                    <path d="M 90,270 L 110,285 L 90,300 M 110,265 L 110,305" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
                    <text x="110" y="260" fontSize="7" fill="#7dd3fc" textAnchor="middle" fontFamily="Silkscreen">
                      REVERSE MTN
                    </text>
                  </g>

                  {/* Skypiea Floating White Sea Clouds */}
                  <g id="sky-islands-cloud-deck" opacity="0.35">
                    <ellipse cx="380" cy="115" rx="80" ry="25" fill="#f8fafc" />
                    <ellipse cx="430" cy="105" rx="60" ry="20" fill="#f8fafc" />
                    <text x="400" y="80" fontSize="8" fill="#fef08a" fontFamily="Silkscreen" textAnchor="middle">
                      ☁ 10,000M SKY WHITE SEA
                    </text>
                  </g>

                  {/* Undersea Fish-Man Trench */}
                  <g id="undersea-trench" opacity="0.4">
                    <ellipse cx="500" cy="460" rx="35" ry="30" fill="#0c4a6e" stroke="#38bdf8" strokeDasharray="3,3" />
                    <text x="500" y="505" fontSize="7" fill="#38bdf8" fontFamily="Silkscreen" textAnchor="middle">
                      🫧 10,000M UNDERSEA TRENCH
                    </text>
                  </g>
                </g>
              )}

              {/* ======================================================== */}
              {/* UNIVERSE 2: DEMONIC EMPEROR — THE FIVE CONTINENTS ATLAS  */}
              {/* ======================================================== */}
              {seriesSlug === 'demonic-emperor' && (
                <g id="demonic-emperor-cartography">
                  {currentPlane?.id === 'plane-sacred-domain' ? (
                    <g id="sacred-domain-full-cartography">
                      {/* Astral Void Base */}
                      <rect x="0" y="0" width="1000" height="580" fill="#04020a" />

                      {/* Astral Starfield Dots & Nebulae */}
                      <circle cx="200" cy="100" r="1.5" fill="#f0abfc" opacity="0.6" />
                      <circle cx="350" cy="180" r="2" fill="#c084fc" opacity="0.5" />
                      <circle cx="150" cy="450" r="1" fill="#e879f9" opacity="0.7" />
                      <circle cx="700" cy="480" r="1.5" fill="#f0abfc" opacity="0.6" />
                      <circle cx="820" cy="350" r="2" fill="#a855f7" opacity="0.4" />

                      {/* Swirling Nine Serenities Cosmic Nebula */}
                      <ellipse cx="500" cy="290" rx="420" ry="230" fill="#1e0b36" opacity="0.4" />
                      <ellipse cx="500" cy="290" rx="280" ry="150" fill="#2e1065" opacity="0.5" stroke="#7e22ce" strokeWidth="1" strokeDasharray="8,8" />

                      {/* Eight Demonic Emperors Domains Constellation Circle */}
                      <circle cx="500" cy="290" r="180" fill="none" stroke="#d946ef" strokeWidth="1" strokeDasharray="4,6" opacity="0.3" />
                      <text x="500" y="100" fontSize="13" fill="#f0abfc" opacity="0.8" fontFamily="Silkscreen" fontWeight="bold" textAnchor="middle" letterSpacing="4">
                        SACRED DOMAIN (UPPER REALM OF EMPERORS & SAINTS)
                      </text>

                      {/* Seven Sacred Mountains Domain on Northeast */}
                      <g id="sacred-mountains-domain">
                        <polygon points="930,40 880,120 980,120" fill="#78350f" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />
                        <text x="930" y="135" fontSize="8" fill="#fde047" fontFamily="Silkscreen" fontWeight="bold" textAnchor="middle">
                          SEVEN SACRED MOUNTAINS (TYRANT RULE)
                        </text>
                      </g>

                      {/* Demonic Emperor Peak Ancestral Domain */}
                      <g id="demonic-emperor-peak-domain">
                        <polygon points="860,70 820,150 900,150" fill="#3b0764" stroke="#d946ef" strokeWidth="2" opacity="0.85" />
                        <text x="860" y="165" fontSize="8" fill="#e879f9" fontFamily="Silkscreen" fontWeight="bold" textAnchor="middle">
                          DEMONIC EMPEROR PEAK (NINE SERENITIES)
                        </text>
                      </g>
                    </g>
                  ) : (
                    <g id="mortal-domain-cartography">
                      {/* Dark Charcoal Parchment Base */}
                      <rect x="0" y="0" width="1000" height="580" fill="#0a0a14" />

                      {/* 0. Quanrong Nomadic Beast Garrison (Far West) */}
                      <path
                        d="M 15,220 L 70,200 L 75,410 L 15,380 Z"
                        fill="#1a121f"
                        stroke="#dc2626"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                      />
                      <text x="45" y="430" fontSize="7" fill="#ef4444" opacity="0.8" fontFamily="Silkscreen" textAnchor="middle">
                        QUANRONG NOMADIC EMPIRE
                      </text>

                      {/* 1. Western Lands (Tianyu Empire Domain) */}
                      <path
                        d="M 60,180 L 220,160 L 400,150 L 420,380 L 370,520 L 150,510 L 60,380 Z"
                        fill="#151b28"
                        stroke="#2e3b52"
                        strokeWidth="2"
                      />
                      <text x="210" y="180" fontSize="12" fill="#60a5fa" opacity="0.75" fontFamily="Silkscreen" fontWeight="bold">
                        WESTERN LANDS (TIANYU EMPIRE & SEVEN HOUSES)
                      </text>

                      {/* 2. Beast Mountain Range (Dense Dividing Forest) */}
                      <path
                        d="M 410,160 L 490,150 L 530,360 L 500,530 L 410,500 Z"
                        fill="#0f291e"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                        opacity="0.8"
                      />
                      <text x="460" y="460" fontSize="9" fill="#34d399" opacity="0.8" fontFamily="Silkscreen" transform="rotate(-75 460 460)">
                        BEAST MOUNTAIN RANGE (SACRED BEAST BARRIER)
                      </text>

                      {/* 3. Northern Lands (Glacial Freezing Lands & Sea Bright Sect) */}
                      <path
                        d="M 550,50 L 780,45 L 810,135 L 540,135 Z"
                        fill="#0c233c"
                        stroke="#38bdf8"
                        strokeWidth="1.8"
                      />
                      <text x="670" y="70" fontSize="9" fill="#7dd3fc" opacity="0.8" fontFamily="Silkscreen" fontWeight="bold" textAnchor="middle">
                        NORTHERN LANDS (SEA BRIGHT SECT & GLACIAL SEA)
                      </text>

                      {/* 4. Central Continent (Sword Star Empire & Baili Hegemon) */}
                      <path
                        d="M 540,150 L 820,140 L 860,340 L 780,470 L 560,465 L 530,320 Z"
                        fill="#1c1626"
                        stroke="#581c87"
                        strokeWidth="2"
                      />
                      <text x="690" y="170" fontSize="12" fill="#c084fc" opacity="0.8" fontFamily="Silkscreen" fontWeight="bold" textAnchor="middle">
                        CENTRAL CONTINENT (SWORD STAR EMPIRE)
                      </text>

                      {/* 5. Southern Lands (Shangguan Clan Bamboo Jungle) */}
                      <path
                        d="M 550,480 L 800,475 L 810,560 L 540,560 Z"
                        fill="#0b2419"
                        stroke="#059669"
                        strokeWidth="1.8"
                      />
                      <text x="680" y="550" fontSize="9" fill="#34d399" opacity="0.8" fontFamily="Silkscreen" fontWeight="bold" textAnchor="middle">
                        SOUTHERN LANDS (SHANGGUAN CLAN JUNGLE)
                      </text>

                      {/* Sacred Domain Void Rift (Upper Realm Tear) */}
                      <g id="sacred-domain-tear" opacity="0.85">
                        <ellipse cx="890" cy="95" rx="80" ry="35" fill="#2e1065" stroke="#d946ef" strokeWidth="2" strokeDasharray="4,2" />
                        <text x="890" y="55" fontSize="8" fill="#f0abfc" fontWeight="bold" fontFamily="Silkscreen" textAnchor="middle">
                          ⚡ SACRED DOMAIN UPPER REALM RIFT
                        </text>
                      </g>

                      {/* Golden Dragon Veins / Spirit Leylines */}
                      <path
                        d="M 140,260 Q 220,270 300,290 T 365,210 M 300,290 L 245,470 M 300,290 L 355,470 M 300,290 Q 420,240 470,230 T 505,325 T 690,325 M 300,290 L 290,335 M 140,260 L 115,195"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                        opacity="0.45"
                      />
                    </g>
                  )}
                </g>
              )}

              {/* ======================================================== */}
              {/* UNIVERSE 3: COILING DRAGON — YULAN & INFERNAL PLANAR ATLAS */}
              {/* ======================================================== */}
              {seriesSlug === 'coiling-dragon' && (
                <g id="coiling-dragon-cartography">
                  {currentPlane?.id === 'plane-infernal' ? (
                    <g id="infernal-realm-cartography">
                      {/* Deep Void Base */}
                      <rect x="0" y="0" width="1000" height="580" fill="#090514" />

                      {/* Chaotic lightning streaks in background */}
                      <path
                        d="M 50,50 L 150,120 L 100,200 M 800,80 L 880,180 L 820,280 M 350,450 L 420,530"
                        stroke="#6b21a8"
                        strokeWidth="1.5"
                        strokeDasharray="4,8"
                        opacity="0.3"
                      />

                      {/* Redbud Continent (West) */}
                      <path
                        d="M 60,180 L 250,130 L 290,360 L 220,490 L 70,440 Z"
                        fill="#1b122c"
                        stroke="#9333ea"
                        strokeWidth="2"
                      />
                      <text x="160" y="165" fontSize="11" fill="#c084fc" opacity="0.8" fontFamily="Silkscreen" fontWeight="bold" textAnchor="middle">
                        REDBUD CONTINENT (NIGHTSTAND)
                      </text>

                      {/* Central Chaos Sea */}
                      <rect x="310" y="150" width="350" height="290" rx="16" fill="#130924" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="6,6" opacity="0.7" />
                      <text x="485" y="195" fontSize="11" fill="#e9d5ff" opacity="0.7" fontFamily="Silkscreen" fontWeight="bold" textAnchor="middle" letterSpacing="3">
                        ⚡ THE CHAOS SEA (VIOLET LIGHTNING DEEP) ⚡
                      </text>

                      {/* Miluo Island In Chaos Sea */}
                      <circle cx="610" cy="270" r="28" fill="#3b0764" stroke="#e879f9" strokeWidth="1.5" />
                      <text x="610" y="248" fontSize="7" fill="#f0abfc" fontFamily="Silkscreen" textAnchor="middle">
                        MILUO ISLAND
                      </text>

                      {/* Indigo Prefecture & Skyrite Mountains (East) */}
                      <path
                        d="M 680,130 L 930,110 L 960,420 L 860,510 L 680,440 Z"
                        fill="#151b2e"
                        stroke="#38bdf8"
                        strokeWidth="2"
                      />
                      <text x="820" y="145" fontSize="11" fill="#7dd3fc" opacity="0.8" fontFamily="Silkscreen" fontWeight="bold" textAnchor="middle">
                        INDIGO PREFECTURE & BEIRUT PALACE
                      </text>

                      {/* Skyrite Mountains Crest */}
                      <polygon points="780,175 750,225 810,225" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                      <text x="780" y="165" fontSize="7" fill="#67e8f9" fontFamily="Silkscreen" textAnchor="middle">
                        SKYRITE MTNS (FOUR BEASTS)
                      </text>
                    </g>
                  ) : (
                    <g id="yulan-continent-cartography">
                      <rect x="0" y="0" width="1000" height="580" fill="#080d1a" />

                      {/* Yulan Continent Landmass */}
                      <path
                        d="M 80,180 L 280,110 L 600,90 L 840,160 L 860,420 L 710,500 L 480,520 L 160,480 L 80,330 Z"
                        fill="#0f1b2b"
                        stroke="#1e3a5f"
                        strokeWidth="2"
                      />

                      {/* Regional Sector Labels */}
                      <text x="210" y="140" fontSize="10" fill="#38bdf8" opacity="0.5" fontFamily="Silkscreen">
                        HOLY UNION & RADIANT CHURCH
                      </text>
                      <text x="650" y="140" fontSize="10" fill="#f59e0b" opacity="0.5" fontFamily="Silkscreen">
                        O’BRIEN EMPIRE & BARUCH DOMAIN
                      </text>

                      {/* Central Spine: Mountain Range of Magical Beasts */}
                      <path
                        d="M 420,120 L 480,110 L 490,440 L 410,460 Z"
                        fill="#1e293b"
                        stroke="#64748b"
                        strokeWidth="2"
                        opacity="0.8"
                      />
                      <text x="450" y="270" fontSize="10" fill="#94a3b8" fontFamily="Silkscreen" fontWeight="bold" transform="rotate(-90 450 270)" textAnchor="middle">
                        MOUNTAIN RANGE OF MAGICAL BEASTS
                      </text>

                      {/* Northern Forest of Darkness (Lord Beirut) */}
                      <ellipse cx="580" cy="130" rx="70" ry="35" fill="#2e1065" opacity="0.6" stroke="#a855f7" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="580" y="85" fontSize="8" fill="#c084fc" fontFamily="Silkscreen" textAnchor="middle">
                        FOREST OF DARKNESS (LORD BEIRUT)
                      </text>

                      {/* Southern Sea: Necropolis of the Gods Pyramid */}
                      <g id="necropolis-pyramid">
                        <polygon points="510,470 480,510 540,510" fill="#f59e0b" opacity="0.7" stroke="#fbbf24" strokeWidth="1.5" />
                        <text x="510" y="530" fontSize="8" fill="#fbbf24" fontFamily="Silkscreen" textAnchor="middle">
                          NECROPOLIS OF THE GODS
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              )}

              {/* ======================================================== */}
              {/* FACTION TERRITORY INFLUENCE OVERLAYS (WHEN TOGGLED)     */}
              {/* ======================================================== */}
              {showTerritories && (
                <g id="territory-overlays" opacity="0.2">
                  {visibleLocations.map((loc) => {
                    const faction = getLocationControllingFaction(loc.id, seriesSlug);
                    if (!faction || !loc.coordinates) return null;
                    return (
                      <circle
                        key={`territory-${loc.id}`}
                        cx={loc.coordinates.x}
                        cy={loc.coordinates.y}
                        r="55"
                        fill={faction.color}
                        stroke={faction.color}
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </g>
              )}

              {/* ======================================================== */}
              {/* CHRONOLOGICAL STORY JOURNEY / VOYAGE ROUTE PATH         */}
              {/* ======================================================== */}
              {showRoute && journeyPath && (
                <g id="story-route-layer">
                  {/* Glowing background halo */}
                  <path
                    d={journeyPath}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.3"
                  />
                  {/* Crisp animated dash polyline */}
                  <path
                    d={journeyPath}
                    fill="none"
                    stroke="#fde047"
                    strokeWidth="1.8"
                    strokeDasharray="6,5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.85"
                  />
                </g>
              )}

              {/* ======================================================== */}
              {/* LANDMARK PINS & BEACONS                                  */}
              {/* ======================================================== */}
              <g id="landmark-pins">
                {visibleLocations.map((loc) => {
                  if (!loc.coordinates) return null;
                  const { x, y } = loc.coordinates;
                  const isDiscovered = loc.first_appearance <= userChapter;
                  const isSelected = activeLocation?.id === loc.id;
                  const icon = getLocationIcon(loc.name, loc.description);
                  const danger = getDangerRating(loc);
                  const faction = getLocationControllingFaction(loc.id, seriesSlug);

                  // UNDISCOVERED / UNCHARTED PIN (SPOILER-FREE)
                  if (!isDiscovered) {
                    if (!showFogPreview) return null;
                    return (
                      <g
                        key={loc.id}
                        className="cursor-help opacity-40 hover:opacity-75 transition-opacity"
                        onClick={() => setActiveLocation(loc)}
                      >
                        <circle cx={x} cy={y} r="8" fill="#1e293b" stroke="#475569" strokeWidth="1" strokeDasharray="2,2" />
                        <text x={x} y={y + 3} fontSize="8" fill="#94a3b8" textAnchor="middle" fontFamily="Silkscreen">
                          ?
                        </text>
                        <rect x={x - 25} y={y + 10} width="50" height="11" rx="2" fill="#030712" stroke="#334155" strokeWidth="0.8" opacity="0.9" />
                        <text x={x} y={y + 18} textAnchor="middle" fontSize="6" fill="#64748b" fontFamily="Silkscreen">
                          ░ UNCHARTED ░
                        </text>
                      </g>
                    );
                  }

                  // FULLY DISCOVERED & EXPLORED PIN
                  return (
                    <g
                      key={loc.id}
                      className="cursor-pointer group"
                      onClick={() => handleFocusLocation(loc)}
                    >
                      {/* Pulsing Beacon Ripple */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? '22' : '14'}
                        fill={isSelected ? '#38bdf8' : faction ? faction.color : '#f59e0b'}
                        opacity={isSelected ? '0.35' : '0.15'}
                        className={isSelected ? 'animate-ping' : 'group-hover:opacity-30 transition-opacity'}
                      />

                      {/* Inner Pin Anchor */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? '12' : '9'}
                        fill="#030712"
                        stroke={isSelected ? '#38bdf8' : faction ? faction.color : '#f59e0b'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        className="filter drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]"
                      />

                      {/* Pixel Art Sprite or Thematic Icon */}
                      {loc.thumbnail_url ? (
                        <image
                          href={loc.thumbnail_url}
                          x={x - 8}
                          y={y - 8}
                          width="16"
                          height="16"
                          className="select-none [image-rendering:pixelated]"
                        />
                      ) : (
                        <text
                          x={x}
                          y={y + 3.5}
                          textAnchor="middle"
                          fontSize={isSelected ? '11' : '9'}
                          className="select-none"
                        >
                          {icon}
                        </text>
                      )}

                      {/* Name Label Badge */}
                      <g transform={`translate(${x}, ${y + 12})`}>
                        <rect
                          x="-35"
                          y="0"
                          width="70"
                          height="14"
                          rx="2.5"
                          fill="#030712"
                          stroke={isSelected ? '#38bdf8' : faction ? faction.color : '#f59e0b'}
                          strokeWidth={isSelected ? '1.5' : '0.8'}
                          opacity="0.95"
                          className="filter drop-shadow-md"
                        />
                        <text
                          x="0"
                          y="9.5"
                          textAnchor="middle"
                          fontSize="6.5"
                          fill={isSelected ? '#7dd3fc' : '#fef08a'}
                          fontWeight="bold"
                          fontFamily="Silkscreen"
                        >
                          {loc.name.length > 14 ? loc.name.slice(0, 13) + '…' : loc.name}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>

              {/* ======================================================== */}
              {/* CURRENT PROTAGONIST VEHICLE / EXPEDITION TOKEN           */}
              {/* ======================================================== */}
              {currentProtagonistLocation?.coordinates && (
                <g 
                  id="protagonist-token" 
                  transform={`translate(${currentProtagonistLocation.coordinates.x}, ${currentProtagonistLocation.coordinates.y - 18})`}
                  className="pointer-events-none"
                >
                  <circle cx="0" cy="0" r="16" fill={protagonistToken.color} opacity="0.3" className="animate-ping" />
                  <circle cx="0" cy="0" r="12" fill="#030712" stroke={protagonistToken.color} strokeWidth="2" />
                  <text x="0" y="4" textAnchor="middle" fontSize="12">
                    {protagonistToken.icon}
                  </text>
                  <rect x="-30" y="-18" width="60" height="11" rx="2" fill="#030712" stroke={protagonistToken.color} strokeWidth="1" />
                  <text x="0" y="-10" textAnchor="middle" fontSize="6" fill="#fef08a" fontWeight="bold" fontFamily="Silkscreen">
                    EXPEDITION SHIP
                  </text>
                </g>
              )}
            </g>
          </svg>

          {/* Compass Rose Overlay (Bottom Right) */}
          <div className="absolute bottom-4 right-4 text-slate-400 font-pixel text-[10px] select-none bg-slate-950/80 p-2 rounded-lg border border-slate-800 shadow-xl flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-white font-bold tracking-wider">{seriesTitle.toUpperCase()}</div>
              <div className="text-[9px] text-slate-500">N ↑ E → S ↓ W ←</div>
            </div>
          </div>
        </div>

        {/* Selected Landmark Dialogue / Lore Inspector Card */}
        {activeLocation ? (
          <div className="p-4 bg-slate-900 border-t border-amber-500/40 space-y-3 animate-in fade-in slide-in-from-bottom-3">
            {activeLocation.first_appearance > userChapter ? (
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-slate-700 bg-slate-950 flex items-center justify-center text-2xl text-slate-500">
                    🔒
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-pixel text-sm sm:text-base font-bold text-slate-400">
                        ░ UNCHARTED TERRITORY ░
                      </h3>
                      <span className="text-[10px] font-pixel px-2 py-0.5 rounded border border-slate-700 bg-slate-950 text-slate-400">
                        SHROUDED BY FOG OF WAR
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-3xl pt-1">
                      This territory remains uncharted as of Chapter {userChapter}. Advance your story progress to Chapter {activeLocation.first_appearance} or click the button to lift the fog of war and chart its secrets.
                    </p>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-end gap-2 flex-shrink-0">
                  {onChapterChange && (
                    <button
                      onClick={() => onChapterChange(activeLocation.first_appearance)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-xs font-bold transition shadow flex items-center gap-1.5"
                    >
                      <span>JUMP TO CH. {activeLocation.first_appearance} TO UNCHART</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    {activeLocation.thumbnail_url ? (
                      <div className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-amber-500/50 bg-slate-950 p-1 flex items-center justify-center overflow-hidden shadow-inner">
                        <img
                          src={activeLocation.thumbnail_url}
                          alt={activeLocation.name}
                          className="w-full h-full object-contain [image-rendering:pixelated]"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-slate-700 bg-slate-950 flex items-center justify-center text-2xl">
                        {getLocationIcon(activeLocation.name, activeLocation.description)}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-pixel text-sm sm:text-base font-bold text-amber-300">
                          {activeLocation.name}
                        </h3>
                        <span className={`text-[10px] font-pixel px-2 py-0.5 rounded border ${getDangerRating(activeLocation).color}`}>
                          {getDangerRating(activeLocation).label}
                        </span>
                      </div>

                      {activeLocation.aliases && activeLocation.aliases.length > 0 && (
                        <div className="text-xs text-slate-400 font-sans">
                          <span className="text-slate-500 font-pixel text-[10px]">KNOWN AS:</span> {activeLocation.aliases.join(' • ')}
                        </div>
                      )}

                      <p className="text-xs text-slate-300 leading-relaxed max-w-3xl pt-1">
                        {activeLocation.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Jump to Chapter & Faction Badge */}
                  <div className="flex flex-row sm:flex-col items-end gap-2 flex-shrink-0">
                    {onChapterChange && (
                      <button
                        onClick={() => onChapterChange(activeLocation.first_appearance)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-xs font-bold transition shadow flex items-center gap-1.5"
                      >
                        <span>JUMP TO CH. {activeLocation.first_appearance}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {getLocationControllingFaction(activeLocation.id, seriesSlug) && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 font-pixel">
                        {getLocationControllingFaction(activeLocation.id, seriesSlug)?.emblem && (
                          <img
                            src={getLocationControllingFaction(activeLocation.id, seriesSlug)!.emblem}
                            alt=""
                            className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]"
                          />
                        )}
                        <span>{getLocationControllingFaction(activeLocation.id, seriesSlug)!.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Historical Canon Events Recorded at this Landmark */}
                {activeLocation.events && activeLocation.events.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-pixel text-amber-400">
                      <History className="w-3.5 h-3.5" />
                      <span>CANON CHRONICLES & BATTLES HERE (UP TO CHAPTER {userChapter}):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeLocation.events.map((ev) => (
                        <div
                          key={ev.id}
                          className="text-xs bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-2 rounded-lg flex items-center gap-2 transition"
                        >
                          <span className="font-pixel text-amber-400 text-[10px]">CH. {ev.chapter}</span>
                          <span className="text-slate-200">{ev.name}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                            {ev.event_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-center text-xs text-slate-500 font-pixel">
            ✦ Click any landmark pin or search above to inspect territory details, danger tier, and historical chronicles.
          </div>
        )}
      </div>

      {/* Quick Landmark Jump Pills */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-pixel">
          <span>QUICK LANDMARK JUMP ({visibleLocations.length} AVAILABLE):</span>
          <span className="text-slate-500 font-mono text-[11px]">CLICK TO RECENTER MAP</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
          {visibleLocations.map((loc) => {
            const isSelected = activeLocation?.id === loc.id;
            const isDiscovered = loc.first_appearance <= userChapter;
            return (
              <button
                key={loc.id}
                onClick={() => handleFocusLocation(loc)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition font-pixel flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : isDiscovered
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    : 'bg-slate-950 border-slate-800/50 text-slate-500 opacity-60'
                }`}
              >
                {loc.thumbnail_url ? (
                  <img
                    src={loc.thumbnail_url}
                    alt=""
                    className="w-3.5 h-3.5 object-contain [image-rendering:pixelated]"
                  />
                ) : (
                  <span>{getLocationIcon(loc.name, loc.description)}</span>
                )}
                <span>{loc.name.split(' ')[0]}</span>
                {!isDiscovered && <span className="text-[9px] text-amber-500/70 font-mono">🔒</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

