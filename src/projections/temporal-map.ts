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
  LandmarkGlyph,
  LocationType,
  MapRiver,
  PlaneBackdrop,
} from '../domain/map-types';
import { getMapPlanes, planeIdOf } from '../domain/map-planes';
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

export interface ProjectedPlane {
  id: string;
  name: string;
  width: number;
  height: number;
  backdrop: PlaneBackdrop;
  isRevealed: boolean;
}

export interface ProjectedWaypoint {
  locationId: string;
  name: string;
  planeId: string;
  regionId?: string;
  x: number;
  y: number;
  type: LocationType;
  isCurrent: boolean;
}

export interface HeroPosition {
  x: number;
  y: number;
  locationId?: string;
  planeId: string;
  chapter: number;
}

export interface ProjectedWorldMapSnapshot {
  id: string;
  mapId: string;
  universeId: string;
  coordinateSystem: CoordinateSystem;
  width: number;
  height: number;
  userChapter: number;
  planeId: string;
  planes: ProjectedPlane[];
  landmarkGlyphs: LandmarkGlyph[];
  waypoints: ProjectedWaypoint[];
  heroPosition: HeroPosition | null;
  rivers: MapRiver[];
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
  planeId?: string;
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
 * Determines whether a map region is visible at the given chapter based on
 * visibleFromChapter and revealedAtChapter gates.
 */
export function isRegionVisible(
  region: Pick<MapRegion, 'visibleFromChapter' | 'revealedAtChapter'>,
  userChapter: number
): boolean {
  return (
    region.visibleFromChapter === undefined ||
    region.visibleFromChapter <= userChapter ||
    (region.revealedAtChapter !== undefined && region.revealedAtChapter <= userChapter)
  );
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

  // 1. Resolve planes (first plane is always revealed)
  const allPlanes = getMapPlanes(map);
  const firstPlaneId = allPlanes[0].id;
  const projectedPlanes: ProjectedPlane[] = allPlanes.map((plane) => ({
    id: plane.id,
    name: plane.name,
    width: plane.width,
    height: plane.height,
    backdrop: plane.backdrop,
    isRevealed: plane.id === firstPlaneId || plane.revealedAtChapter <= userChapter,
  }));
  const activePlane =
    projectedPlanes.find((p) => p.id === options.planeId && p.isRevealed) ?? projectedPlanes[0];

  const locationPlane = new Map(
    (map.locations || []).map((loc) => [loc.id, planeIdOf(loc, allPlanes)])
  );
  const waypointPlaneId = (wp: CharacterWaypoint): string =>
    wp.planeId ?? (wp.locationId ? locationPlane.get(wp.locationId) : undefined) ?? firstPlaneId;
  const onActivePlane = (entity: { planeId?: string }): boolean =>
    planeIdOf(entity, allPlanes) === activePlane.id;

  // 2. Sliced Character Paths (Zero Spoilers: only waypoints up to userChapter, on this plane)
  const projectedCharacterPaths: CharacterPath[] = (map.characterPaths || [])
    .map((path) => ({
      characterId: path.characterId,
      characterName: path.characterName,
      waypoints: (path.waypoints || [])
        .filter((wp) => wp.chapter <= userChapter && waypointPlaneId(wp) === activePlane.id)
        .sort((a, b) => a.chapter - b.chapter),
    }))
    .filter((path) => path.waypoints.length > 0);

  // 3. Resolve Active Character Path for Fog of War calculation
  const activeCharId =
    options.activeCharacterId ||
    map.characterPaths?.[0]?.characterId ||
    projectedCharacterPaths[0]?.characterId;

  const activePath = map.characterPaths?.find((p) => p.characterId === activeCharId) ?? null;

  // 4. Resolve hero position (any plane) and current position (this plane only)
  let heroPosition: HeroPosition | null = null;
  if (activePath && activePath.waypoints.length > 0) {
    const validWaypoints = activePath.waypoints
      .filter((w) => w.chapter <= userChapter)
      .sort((a, b) => a.chapter - b.chapter);
    const latest = validWaypoints[validWaypoints.length - 1];
    if (latest) {
      heroPosition = {
        x: latest.x,
        y: latest.y,
        locationId: latest.locationId,
        planeId: waypointPlaneId(latest),
        chapter: latest.chapter,
      };
    }
  }

  const currentPosition: { x: number; y: number; locationId?: string } | null =
    heroPosition && heroPosition.planeId === activePlane.id
      ? { x: heroPosition.x, y: heroPosition.y, locationId: heroPosition.locationId }
      : null;

  // 5. Project Locations with Fog Status & Filter by Canon Visibility
  const projectedLocations: ProjectedLocation[] = [];

  for (const loc of map.locations || []) {
    if (!onActivePlane(loc)) continue;
    const fogStatus = getLocationFogStatus(loc, userChapter, activePath);
    const isVisible =
      loc.firstAppearanceChapter <= userChapter ||
      loc.revealedAtChapter <= userChapter ||
      Boolean(options.includeUnknown);

    if (isVisible) {
      projectedLocations.push({
        ...loc,
        fogStatus,
        isCurrentPosition:
          currentPosition !== null &&
          (currentPosition.locationId === loc.id ||
            (currentPosition.x === loc.x && currentPosition.y === loc.y)),
      });
    }
  }

  // 6. Fast-travel waypoints: discovered waypoint locations on every revealed plane
  const revealedPlaneIds = new Set(projectedPlanes.filter((p) => p.isRevealed).map((p) => p.id));
  const waypoints: ProjectedWaypoint[] = [];
  for (const loc of map.locations || []) {
    if (!loc.waypoint) continue;
    const planeId = planeIdOf(loc, allPlanes);
    if (!revealedPlaneIds.has(planeId)) continue;
    const status = getLocationFogStatus(loc, userChapter, activePath);
    if (
      status !== FogStatus.CURRENT &&
      status !== FogStatus.DISCOVERED &&
      status !== FogStatus.REVEALED
    ) {
      continue;
    }
    waypoints.push({
      locationId: loc.id,
      name: loc.name,
      planeId,
      regionId: loc.regionId,
      x: loc.x,
      y: loc.y,
      type: loc.type,
      isCurrent: heroPosition?.locationId === loc.id,
    });
  }

  // 7. Filter Events (strictly chapter <= userChapter; plane-agnostic for the timeline)
  const projectedEvents: MapEvent[] = (map.events || [])
    .filter((ev) => ev.chapter <= userChapter)
    .sort((a, b) => a.chapter - b.chapter);

  // 8. Filter Routes (secret routes need an explicit reveal)
  const projectedRoutes: MapRoute[] = (map.routes || []).filter((route) => {
    if (!onActivePlane(route)) return false;
    if (route.routeType === 'secret') {
      return route.revealedAtChapter !== undefined && route.revealedAtChapter <= userChapter;
    }
    return (
      route.visibleFromChapter <= userChapter ||
      (route.revealedAtChapter !== undefined && route.revealedAtChapter <= userChapter)
    );
  });

  // 9. Active Faction Territories (calculate current influence percentage)
  const projectedTerritories: ProjectedFactionTerritory[] = [];
  for (const territory of map.territories || []) {
    if (!onActivePlane(territory)) continue;
    const influence = getTerritoryInfluence(territory, userChapter);
    if (influence > 0) {
      projectedTerritories.push({
        ...territory,
        currentInfluencePct: influence,
      });
    }
  }

  // 10. Filter Regions bounded by visibility
  const projectedRegions: MapRegion[] = (map.regions || []).filter(
    (reg) =>
      onActivePlane(reg) &&
      isRegionVisible(reg, userChapter)
  );

  // 11. Landmark glyphs (chapter-gated decorations)
  const landmarkGlyphs: LandmarkGlyph[] = (map.landmarkGlyphs || []).filter(
    (glyph) => glyph.revealedAtChapter <= userChapter && onActivePlane(glyph)
  );

  // 12. Calculate Discovered Counts (active plane)
  const discoveredCount = projectedLocations.filter(
    (l) =>
      l.fogStatus === FogStatus.CURRENT ||
      l.fogStatus === FogStatus.DISCOVERED ||
      l.fogStatus === FogStatus.REVEALED
  ).length;

  const terrain: TerrainLayer[] = (map.terrain || []).filter(onActivePlane);
  const rivers: MapRiver[] = (map.rivers || []).filter(onActivePlane);

  return {
    id: map.id,
    mapId: map.id,
    universeId: map.universeId,
    coordinateSystem: map.coordinateSystem,
    width: activePlane.width,
    height: activePlane.height,
    userChapter,
    planeId: activePlane.id,
    planes: projectedPlanes,
    landmarkGlyphs,
    waypoints,
    heroPosition,
    rivers,
    activeCharacterId: activeCharId,
    currentPosition,
    terrain,
    regions: projectedRegions,
    locations: projectedLocations,
    routes: projectedRoutes,
    territories: projectedTerritories,
    events: projectedEvents,
    characterPaths: projectedCharacterPaths,
    discoveredCount,
    totalLocationsCount: (map.locations || []).filter(onActivePlane).length,
  };
}
