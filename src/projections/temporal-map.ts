/**
 * OmniLore Map Engine v2 - Temporal Map Projection Engine
 *
 * Implements strict zero-spoiler functional projection of a WorldMapDefinition
 * bounded by userChapter.
 *
 * Pure Functional Transform:
 *   projectTemporalMap(mapDefinition, userChapter, options?) => ProjectedWorldMapSnapshot
 */

import {
  WorldMapDefinition,
  MapLocation,
  MapRegion,
  MapRoute,
  FactionTerritory,
  MapEvent,
  CharacterPath,
  CharacterWaypoint,
  TerrainLayer,
  CoordinateSystem,
} from '../domain/map-types';
import { CanonicalLoreGraph } from '../domain/types';

/**
 * Multi-state Fog of War visibility status for projected landmarks.
 */
export const FogStatus = {
  UNKNOWN: 'UNKNOWN',
  KNOWN: 'KNOWN',
  DISCOVERED: 'DISCOVERED',
  REVEALED: 'REVEALED',
  CURRENT: 'CURRENT',
} as const;

export type FogStatus = (typeof FogStatus)[keyof typeof FogStatus];

export interface ProjectedLocation extends MapLocation {
  fogStatus: FogStatus;
  isCurrentPosition?: boolean;
}

export interface ProjectedFactionTerritory extends FactionTerritory {
  currentInfluencePct: number;
}

export interface ProjectedWorldMapSnapshot {
  id: string;
  mapId: string;
  universeId: string;
  coordinateSystem: CoordinateSystem;
  width: number;
  height: number;
  userChapter: number;
  activeCharacterId?: string;
  currentPosition?: { x: number; y: number; locationId?: string } | null;
  terrain: TerrainLayer[];
  regions: MapRegion[];
  locations: ProjectedLocation[];
  routes: MapRoute[];
  territories: ProjectedFactionTerritory[];
  events: MapEvent[];
  characterPaths: CharacterPath[];
  discoveredCount: number;
  totalLocationsCount: number;
}

export interface TemporalMapOptions {
  activeCharacterId?: string;
  graph?: CanonicalLoreGraph;
  includeUnknown?: boolean;
}

/**
 * Calculates current influence percentage of a territory at a given chapter.
 * Returns 0 if territory is not active or has collapsed.
 */
export function getTerritoryInfluence(
  territory: FactionTerritory,
  userChapter: number
): number {
  if (!territory.controlPeriods || territory.controlPeriods.length === 0) {
    return 0;
  }

  // Find all periods that match userChapter
  const activePeriods = territory.controlPeriods
    .filter(
      p =>
        p.fromChapter <= userChapter &&
        (p.toChapter === null || p.toChapter >= userChapter)
    )
    .sort((a, b) => b.fromChapter - a.fromChapter);

  return activePeriods.length > 0 ? activePeriods[0].influencePct : 0;
}

/**
 * Computes FogStatus for a single location given the tracked character's waypoints.
 */
export function getLocationFogStatus(
  loc: MapLocation,
  userChapter: number,
  activePath?: CharacterPath | null
): FogStatus {
  // Check if character path provides current or past presence
  if (activePath && activePath.waypoints.length > 0) {
    const validWaypoints = activePath.waypoints
      .filter(w => w.chapter <= userChapter)
      .sort((a, b) => a.chapter - b.chapter);

    if (validWaypoints.length > 0) {
      const latestWaypoint = validWaypoints[validWaypoints.length - 1];

      // 1. Is this the current station of the character?
      const isCurrent =
        latestWaypoint.locationId === loc.id ||
        (latestWaypoint.x === loc.x && latestWaypoint.y === loc.y);

      if (isCurrent) {
        return FogStatus.CURRENT;
      }

      // 2. Was this location previously visited by the character?
      const wasVisited = validWaypoints.some(
        w => w.locationId === loc.id || (w.x === loc.x && w.y === loc.y)
      );

      if (wasVisited) {
        return FogStatus.DISCOVERED;
      }
    }
  }

  // 3. Narrative Debut (First Appearance)
  const firstAppearance = loc.firstAppearanceChapter ?? 1;
  const revealedAt = loc.revealedAtChapter ?? firstAppearance;

  if (firstAppearance <= userChapter) {
    // If no character path exists at all, the latest appearing landmark acts as discovered/revealed
    return FogStatus.REVEALED;
  }

  // 4. Mentioned or revealed in lore prior to debut
  if (revealedAt <= userChapter) {
    return FogStatus.KNOWN;
  }

  // 5. Sealed behind future chapters
  return FogStatus.UNKNOWN;
}

/**
 * Projects a WorldMapDefinition at a specific userChapter with zero spoilers.
 *
 * Invariant: Never mutates the input map definition.
 */
export function projectTemporalMap(
  map: WorldMapDefinition,
  userChapterOrGraph: number | CanonicalLoreGraph,
  optionsOrChapter?: TemporalMapOptions | CanonicalLoreGraph | string | number
): ProjectedWorldMapSnapshot {
  // Argument normalization to handle flexible caller signatures
  let userChapter: number;
  let options: TemporalMapOptions = {};

  if (typeof userChapterOrGraph === 'number') {
    userChapter = userChapterOrGraph;
    if (typeof optionsOrChapter === 'string') {
      options = { activeCharacterId: optionsOrChapter };
    } else if (
      optionsOrChapter &&
      typeof optionsOrChapter === 'object' &&
      'series' in optionsOrChapter
    ) {
      options = { graph: optionsOrChapter as CanonicalLoreGraph };
    } else if (optionsOrChapter && typeof optionsOrChapter === 'object') {
      options = optionsOrChapter as TemporalMapOptions;
    }
  } else {
    // Called as (map, graph, userChapter, options)
    const graph = userChapterOrGraph as CanonicalLoreGraph;
    userChapter = typeof optionsOrChapter === 'number' ? optionsOrChapter : 1;
    options = { graph };
  }

  // 1. Sliced Character Paths (Zero Spoilers: only waypoints up to userChapter)
  const projectedCharacterPaths: CharacterPath[] = (map.characterPaths || [])
    .map(path => ({
      characterId: path.characterId,
      characterName: path.characterName,
      waypoints: (path.waypoints || [])
        .filter(wp => wp.chapter <= userChapter)
        .sort((a, b) => a.chapter - b.chapter),
    }))
    .filter(path => path.waypoints.length > 0);

  // 2. Resolve Active Character Path for Fog of War calculation
  const activeCharId =
    options.activeCharacterId ||
    map.characterPaths?.[0]?.characterId ||
    projectedCharacterPaths[0]?.characterId;

  const activePath = map.characterPaths?.find(
    p => p.characterId === activeCharId
  ) ?? null;

  // 3. Resolve Current Protagonist Position
  let currentPosition: { x: number; y: number; locationId?: string } | null = null;
  if (activePath && activePath.waypoints.length > 0) {
    const validWaypoints = activePath.waypoints
      .filter(w => w.chapter <= userChapter)
      .sort((a, b) => a.chapter - b.chapter);

    if (validWaypoints.length > 0) {
      const latest = validWaypoints[validWaypoints.length - 1];
      currentPosition = {
        x: latest.x,
        y: latest.y,
        locationId: latest.locationId,
      };
    }
  }

  // 4. Project Locations with Fog Status & Filter by Canon Visibility
  const projectedLocations: ProjectedLocation[] = [];

  for (const loc of map.locations || []) {
    const fogStatus = getLocationFogStatus(loc, userChapter, activePath);
    const isVisible =
      (loc.firstAppearanceChapter <= userChapter ||
        loc.revealedAtChapter <= userChapter) ||
      Boolean(options.includeUnknown);

    if (isVisible) {
      projectedLocations.push({
        ...loc,
        fogStatus,
        isCurrentPosition:
          currentPosition?.locationId === loc.id ||
          (currentPosition?.x === loc.x && currentPosition?.y === loc.y),
      });
    }
  }

  // 5. Filter Events (strictly chapter <= userChapter)
  const projectedEvents: MapEvent[] = (map.events || [])
    .filter(ev => ev.chapter <= userChapter)
    .sort((a, b) => a.chapter - b.chapter);

  // 6. Filter Routes (visibleFromChapter <= userChapter)
  const projectedRoutes: MapRoute[] = (map.routes || []).filter(
    route =>
      route.visibleFromChapter <= userChapter ||
      (route.revealedAtChapter !== undefined &&
        route.revealedAtChapter <= userChapter)
  );

  // 7. Active Faction Territories (calculate current influence percentage)
  const projectedTerritories: ProjectedFactionTerritory[] = [];
  for (const territory of map.territories || []) {
    const influence = getTerritoryInfluence(territory, userChapter);
    if (influence > 0) {
      projectedTerritories.push({
        ...territory,
        currentInfluencePct: influence,
      });
    }
  }

  // 8. Filter Regions bounded by visibility
  const projectedRegions: MapRegion[] = (map.regions || []).filter(
    reg =>
      reg.visibleFromChapter === undefined ||
      reg.visibleFromChapter <= userChapter ||
      (reg.revealedAtChapter !== undefined &&
        reg.revealedAtChapter <= userChapter)
  );

  // 9. Calculate Discovered Counts
  const discoveredCount = projectedLocations.filter(
    l =>
      l.fogStatus === FogStatus.CURRENT ||
      l.fogStatus === FogStatus.DISCOVERED ||
      l.fogStatus === FogStatus.REVEALED
  ).length;

  return {
    id: map.id,
    mapId: map.id,
    universeId: map.universeId,
    coordinateSystem: map.coordinateSystem,
    width: map.width,
    height: map.height,
    userChapter,
    activeCharacterId: activeCharId,
    currentPosition,
    terrain: map.terrain || [],
    regions: projectedRegions,
    locations: projectedLocations,
    routes: projectedRoutes,
    territories: projectedTerritories,
    events: projectedEvents,
    characterPaths: projectedCharacterPaths,
    discoveredCount,
    totalLocationsCount: map.locations ? map.locations.length : 0,
  };
}
