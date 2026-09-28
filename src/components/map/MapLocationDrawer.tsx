'use client';

import React from 'react';
import {
  X,
  MapPin,
  Shield,
  Swords,
  Users,
  Compass,
  Sparkles,
  ExternalLink,
  Crosshair,
  Award,
  AlertTriangle,
  Skull,
  Eye,
} from 'lucide-react';
import {
  MapLocation,
  MapRegion,
  MapEvent,
  FactionTerritory,
  CharacterPath,
} from '../../domain/map-types';
import {
  ProjectedLocation,
  ProjectedFactionTerritory,
  FogStatus,
} from '../../projections/temporal-map';
import { SoundEngine } from '../../lib/sound-effects';

export interface MapLocationDrawerProps {
  location?: ProjectedLocation | MapLocation | null;
  region?: MapRegion | null;
  event?: MapEvent | null;
  territory?: ProjectedFactionTerritory | FactionTerritory | null;
  userChapter: number;
  universeSlug?: string;
  onClose: () => void;
  onShowOnLadder?: (id?: string) => void;
  onShowInRoster?: (id?: string) => void;
  onFlyToLocation?: (x: number, y: number) => void;
  allEvents?: MapEvent[];
  characterPaths?: CharacterPath[];
  accentColor?: string;
  className?: string;
}

interface DangerRating {
  stars: number;
  label: string;
  badgeColor: string;
}

function getDangerRating(loc?: MapLocation | null): DangerRating {
  if (!loc) {
    return { stars: 1, label: 'D-RANK SAFE REGION', badgeColor: 'text-slate-400 border-slate-700 bg-slate-900/60' };
  }

  const text = `${loc.name} ${loc.description || ''}`.toLowerCase();

  if (
    text.includes('abyss') ||
    text.includes('forbidden') ||
    text.includes('grave') ||
    text.includes('danger') ||
    text.includes('apex') ||
    text.includes('chaos') ||
    text.includes('demon') ||
    text.includes('tribulation') ||
    loc.importance === 'critical'
  ) {
    return {
      stars: 5,
      label: 'EX-RANK FORBIDDEN APEX',
      badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
    };
  }

  if (
    text.includes('sect') ||
    text.includes('mountain') ||
    text.includes('cave') ||
    text.includes('ruin') ||
    text.includes('hazard') ||
    loc.importance === 'major'
  ) {
    return {
      stars: 4,
      label: 'S-RANK HIGH HAZARD',
      badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    };
  }

  return {
    stars: 2,
    label: 'C-RANK PEACEFUL DOMAIN',
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
  };
}

export function MapLocationDrawer({
  location,
  region,
  event,
  territory,
  userChapter,
  universeSlug,
  onClose,
  onShowOnLadder,
  onShowInRoster,
  onFlyToLocation,
  allEvents = [],
  characterPaths = [],
  accentColor = '#10b981',
  className = '',
}: MapLocationDrawerProps) {
  // If nothing is selected, do not render
  if (!location && !region && !event && !territory) {
    return null;
  }

  const handleClose = () => {
    SoundEngine.playMenuSelect();
    onClose();
  };

  // Determine Primary Title & Category
  const title = location?.name || region?.name || event?.name || territory?.name || 'Unknown Landmark';
  const categoryLabel = location
    ? `LOCATION: ${location.type.toUpperCase()}`
    : region
    ? 'GEOGRAPHIC REGION'
    : event
    ? `LORE EVENT: ${event.eventType.toUpperCase()}`
    : 'FACTION SPHERE';

  // Danger rating for locations
  const danger = getDangerRating(location);

  // Visited characters: which characters have waypoints at this location up to userChapter
  const visitedCharacters: { characterId: string; characterName: string; chapter: number }[] = [];
  if (location && characterPaths.length > 0) {
    for (const path of characterPaths) {
      const validWaypoints = (path.waypoints || [])
        .filter((wp) => wp.chapter <= userChapter)
        .filter((wp) => wp.locationId === location.id || (wp.x === location.x && wp.y === location.y));

      if (validWaypoints.length > 0) {
        const latestVisited = validWaypoints[validWaypoints.length - 1];
        visitedCharacters.push({
          characterId: path.characterId,
          characterName: path.characterName,
          chapter: latestVisited.chapter,
        });
      }
    }
  }

  // Canonical events that occurred at this location up to userChapter
  const locationEvents = allEvents.filter(
    (ev) => ev.chapter <= userChapter && (ev.locationId === location?.id || ev.id === event?.id)
  );

  // Fog status badge if location has fogStatus
  const fogStatus = (location as ProjectedLocation)?.fogStatus;

  return (
    <aside
      data-testid="map-location-drawer"
      className={`pointer-events-auto w-80 md:w-96 bg-slate-950/95 border-l border-slate-800 p-5 shadow-2xl backdrop-blur-md flex flex-col gap-4 font-mono text-xs overflow-y-auto animate-in slide-in-from-right duration-200 z-40 ${className}`}
    >
      {/* Header Row: Category Badge & Close Button */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-pixel px-2 py-0.5 rounded border uppercase tracking-wider"
            style={{
              borderColor: `${accentColor}50`,
              backgroundColor: `${accentColor}15`,
              color: accentColor,
            }}
          >
            {categoryLabel}
          </span>
          {fogStatus && (
            <span
              className={`text-[9px] font-pixel px-1.5 py-0.5 rounded border uppercase ${
                fogStatus === FogStatus.CURRENT
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                  : fogStatus === FogStatus.DISCOVERED
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
            >
              {fogStatus}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleClose}
          data-testid="drawer-close-btn"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Close Dossier"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Title & Coordinates */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-pixel font-bold text-white tracking-wide">{title}</h2>
          {location && onFlyToLocation && (
            <button
              type="button"
              onClick={() => {
                SoundEngine.playMenuSelect();
                onFlyToLocation(location.x, location.y);
              }}
              data-testid="focus-location-btn"
              className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 px-2 py-1 rounded-lg border border-cyan-500/40"
              title="Fly Camera to Landmark"
            >
              <Crosshair className="w-3 h-3" />
              <span>FOCUS</span>
            </button>
          )}
        </div>

        {location && (
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
            <MapPin className="w-3 h-3 text-emerald-400" />
            <span>
              COORDINATES: ({location.x}, {location.y})
            </span>
          </div>
        )}
      </div>

      {/* Danger Rating (for locations) */}
      {location && (
        <div className={`p-3 rounded-xl border flex items-center justify-between ${danger.badgeColor}`}>
          <div className="space-y-0.5">
            <div className="text-[9px] font-pixel uppercase tracking-widest text-slate-400">
              DANGER ASSESSMENT
            </div>
            <div className="font-pixel text-[11px] font-bold">{danger.label}</div>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-xs ${i < danger.stars ? 'text-amber-400' : 'text-slate-700'}`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description / Lore Excerpt */}
      {(location?.description || region?.notes || event?.description) && (
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed text-xs">
          {location?.description || region?.notes || event?.description}
        </div>
      )}

      {/* Controlling Faction Section */}
      {(location?.controllingFactionId || territory) && (
        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-pixel text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-amber-400" />
              CONTROLLING SPHERE
            </span>
            {territory && 'currentInfluencePct' in territory && (
              <span className="text-[10px] font-pixel text-amber-300">
                {(territory as ProjectedFactionTerritory).currentInfluencePct}% INFLUENCE
              </span>
            )}
          </div>
          <div className="text-white font-semibold text-xs">
            {territory?.name || location?.controllingFactionId}
          </div>
        </div>
      )}

      {/* Visited Protagonists / Characters */}
      {visitedCharacters.length > 0 && (
        <div className="space-y-2">
          <span className="font-pixel text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3 h-3 text-cyan-400" />
            CANONICAL TRAVELERS (UP TO CH.{userChapter})
          </span>
          <div className="space-y-1.5">
            {visitedCharacters.map((c) => (
              <div
                key={c.characterId}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs"
              >
                <span className="text-slate-200 font-medium">{c.characterName}</span>
                <span className="text-[10px] text-emerald-400 font-mono">CH. {c.chapter}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Canonical Historic Events at this Location */}
      {locationEvents.length > 0 && (
        <div className="space-y-2">
          <span className="font-pixel text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            HISTORIC CHRONICLES ({locationEvents.length})
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {locationEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-amber-300">{ev.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">CH. {ev.chapter}</span>
                </div>
                {ev.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2">{ev.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Navigation Buttons: SHOW ON LADDER & SHOW IN ROSTER */}
      <div className="mt-auto pt-3 border-t border-slate-800/80 flex flex-col gap-2">
        {onShowOnLadder && (
          <button
            type="button"
            onClick={() => {
              SoundEngine.playMenuSelect();
              onShowOnLadder(location?.controllingFactionId || territory?.factionId || location?.id);
            }}
            data-testid="show-on-ladder-btn"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 font-pixel text-[10px] transition"
          >
            <Award className="w-3.5 h-3.5" />
            <span>SHOW ON LADDER</span>
          </button>
        )}

        {onShowInRoster && (
          <button
            type="button"
            onClick={() => {
              SoundEngine.playMenuSelect();
              onShowInRoster(visitedCharacters[0]?.characterId || location?.id);
            }}
            data-testid="show-in-roster-btn"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-pixel text-[10px] transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span>SHOW IN ROSTER</span>
          </button>
        )}
      </div>
    </aside>
  );
}
