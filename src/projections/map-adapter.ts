/**
 * OmniLore Map Engine v2 - Universal Graph Fallback Adapter
 *
 * Synthesizes a valid, schema-compliant WorldMapDefinition from any
 * CanonicalLoreGraph (planes, locations, events, factions, characters)
 * when a series lacks a dedicated, hand-crafted `data/<slug>/map.json`.
 *
 * Ensures 100% backward compatibility for all existing universes
 * (Coiling Dragon, Solo Leveling, Lord of the Mysteries, One Piece, Demonic Emperor).
 */

import {
  CanonicalLoreGraph,
  LocationEntity,
  PlaneEntity,
  EventEntity,
  FactionEntity,
  CharacterEntity,
} from '../domain/types';
import {
  WorldMapDefinition,
  MapLocation,
  MapRegion,
  TerrainLayer,
  MapEvent,
  CharacterPath,
  MapRoute,
  FactionTerritory,
  LocationType,
  TerrainType,
} from '../domain/map-types';

/**
 * Infers a valid Map Engine v2 LocationType based on location name and description.
 */
function inferLocationType(name: string, description: string = '', id: string = ''): LocationType {
  const text = `${name} ${description} ${id}`.toLowerCase();

  if (/\b(mountain|peak|ridge|summit|cliff|mount)\b/.test(text)) return 'mountain';
  if (/\b(city|capital|town|metropolis)\b/.test(text)) return 'city';
  if (/\b(village|township|hamlet)\b/.test(text)) return 'village';
  if (/\b(sect)\b/.test(text)) return 'sect';
  if (/\b(clan|manor|estate|house|compound)\b/.test(text)) return 'clan';
  if (/\b(castle|fortress|palace|citadel|stronghold)\b/.test(text)) return 'castle';
  if (/\b(dungeon|gate|tower|labyrinth)\b/.test(text)) return 'dungeon';
  if (/\b(ruin|tomb|crypt|grave|necropolis)\b/.test(text)) return 'ruin';
  if (/\b(cave|cavern|grotto|abyss)\b/.test(text)) return 'cave';
  if (/\b(battlefield|battle|arena|colosseum|coliseum)\b/.test(text)) return 'battlefield';
  if (/\b(temple|church|cathedral|shrine|monastery|sanctuary)\b/.test(text)) return 'temple';
  if (/\b(ocean|sea|bay|gulf|strait)\b/.test(text)) return 'ocean';
  if (/\b(island|archipelago|isle)\b/.test(text)) return 'island';
  if (/\b(lake|pond|river|stream|canal)\b/.test(text)) return 'lake';
  if (/\b(portal|rift|realm)\b/.test(text)) return 'portal';

  return 'landmark';
}

/**
 * Infers a valid TerrainType from plane name, notes, or series context.
 */
function inferTerrainType(name: string, seriesSlug: string): TerrainType {
  const text = name.toLowerCase();

  if (/\b(ocean|sea|water|bay|archipelago|marine|deep)\b/.test(text)) return 'ocean';
  if (/\b(river|stream|flow)\b/.test(text)) return 'river';
  if (/\b(mountain|peak|ridge|karst|cliff|highland)\b/.test(text)) return 'mountain';
  if (/\b(forest|jungle|wood|woods)\b/.test(text)) return 'forest';
  if (/\b(desert|dune|sand|arid|waste)\b/.test(text)) return 'desert';
  if (/\b(swamp|marsh|bog|mire|nether)\b/.test(text)) return 'swamp';
  if (/\b(ice|frozen|glacier|frost|snow)\b/.test(text)) return 'ice';
  if (/\b(volcanic|magma|lava|infernal|fire|flame)\b/.test(text)) return 'volcanic';
  if (/\b(void|chaos|astral|spirit|divine|dimension|space)\b/.test(text)) return 'void';
  if (/\b(plains|grassland|meadow|continent|basin|domain|field|earth)\b/.test(text)) return 'plains';

  if (seriesSlug === 'one-piece') return 'ocean';
  if (seriesSlug === 'coiling-dragon') return 'mountain';
  if (seriesSlug === 'demonic-emperor') return 'mountain';
  if (seriesSlug === 'lord-of-the-mysteries') return 'ocean';

  return 'plains';
}

/**
 * Base terrain type for universal canvas background.
 */
function inferBaseTerrain(seriesSlug: string): TerrainType {
  if (seriesSlug === 'one-piece') return 'ocean';
  if (seriesSlug === 'lord-of-the-mysteries') return 'ocean';
  if (seriesSlug === 'coiling-dragon') return 'mountain';
  if (seriesSlug === 'demonic-emperor') return 'mountain';
  return 'plains';
}

/**
 * Route travel type for universe.
 */
function inferRouteType(seriesSlug: string): 'road' | 'sea' | 'flight' | 'portal' | 'secret' {
  if (seriesSlug === 'one-piece') return 'sea';
  if (seriesSlug === 'coiling-dragon') return 'flight';
  if (seriesSlug === 'solo-leveling') return 'portal';
  if (seriesSlug === 'lord-of-the-mysteries') return 'portal';
  return 'road';
}

/**
 * Adapts a CanonicalLoreGraph into a WorldMapDefinition.
 *
 * If `existingMap` is already provided (e.g. Reverend Insanity with map.json),
 * it is returned directly.
 * Otherwise, synthesizes a complete, schema-compliant WorldMapDefinition.
 */
export function adaptGraphToWorldMap(
  graph: CanonicalLoreGraph,
  existingMap?: WorldMapDefinition | null
): WorldMapDefinition {
  if (existingMap) {
    return existingMap;
  }

  const width = 1000;
  const height = 1000;
  const slug = graph.series.slug;

  const rawLocations = Object.values(graph.entities).filter(
    (e): e is LocationEntity => e.type === 'location'
  );
  const rawPlanes = Object.values(graph.entities).filter(
    (e): e is PlaneEntity => e.type === 'plane'
  );
  const rawEvents = Object.values(graph.entities).filter(
    (e): e is EventEntity => e.type === 'event'
  );
  const rawFactions = Object.values(graph.entities).filter(
    (e): e is FactionEntity => e.type === 'faction'
  );
  const rawCharacters = Object.values(graph.entities).filter(
    (e): e is CharacterEntity => e.type === 'character'
  );

  // Helper map for fast faction lookup by name keyword
  const factionsList = rawFactions;

  // 1. Synthesize Locations
  const locations: MapLocation[] = [];
  const locationsById = new Map<string, MapLocation>();

  // Count unplaced locations for grid distribution
  const unplacedLocations = rawLocations.filter(
    (l) => l.coordinates?.x === undefined || l.coordinates?.y === undefined
  );
  const totalUnplaced = Math.max(1, unplacedLocations.length);
  const unplacedCols = Math.ceil(Math.sqrt(totalUnplaced));
  let unplacedIdx = 0;

  for (const loc of rawLocations) {
    let x: number;
    let y: number;

    if (loc.coordinates && typeof loc.coordinates.x === 'number' && typeof loc.coordinates.y === 'number') {
      x = Math.max(20, Math.min(width - 20, Math.round(loc.coordinates.x)));
      y = Math.max(20, Math.min(height - 20, Math.round(loc.coordinates.y)));
    } else {
      const col = unplacedIdx % unplacedCols;
      const row = Math.floor(unplacedIdx / unplacedCols);
      x = Math.round(100 + (col * (width - 200)) / Math.max(1, unplacedCols - 1));
      y = Math.round(100 + (row * (height - 200)) / Math.max(1, Math.ceil(totalUnplaced / unplacedCols) - 1));
      unplacedIdx++;
    }

    const locType = inferLocationType(loc.name, loc.description, loc.id);

    // Determine controlling faction
    let controllingFactionId: string | undefined = undefined;
    const lowerName = loc.name.toLowerCase();
    const lowerDesc = (loc.description || '').toLowerCase();
    for (const fac of factionsList) {
      const facName = fac.name.toLowerCase();
      if (lowerName.includes(facName) || lowerDesc.includes(facName)) {
        controllingFactionId = fac.id;
        break;
      }
    }

    // Determine importance
    const hasEvent = rawEvents.some((ev) => ev.location_id === loc.id);
    const importance =
      loc.first_appearance <= 10 || hasEvent
        ? 'critical'
        : loc.first_appearance <= 100
          ? 'major'
          : 'minor';

    const mapLoc: MapLocation = {
      id: loc.id,
      name: loc.name,
      x,
      y,
      type: locType,
      regionId: loc.plane_id || undefined,
      importance,
      firstAppearanceChapter: Math.max(0, loc.first_appearance ?? 1),
      revealedAtChapter: Math.max(0, loc.revealed_at ?? loc.first_appearance ?? 1),
      icon: loc.thumbnail_url || undefined,
      description: loc.description || undefined,
      aliases: loc.aliases && loc.aliases.length > 0 ? loc.aliases : undefined,
      controllingFactionId,
    };

    locations.push(mapLoc);
    locationsById.set(loc.id, mapLoc);
  }

  // 2. Synthesize Regions & Terrain from Planes
  const sortedPlanes = rawPlanes.slice().sort((a, b) => a.tier_order - b.tier_order);
  const totalPlanes = Math.max(1, sortedPlanes.length);
  const regions: MapRegion[] = [];
  const terrain: TerrainLayer[] = [];

  // Universal Base Terrain Layer
  terrain.push({
    id: 'terrain-base',
    type: inferBaseTerrain(slug),
    name: `${graph.series.title} Prime Domain`,
    polygon: [
      [20, 20],
      [width - 20, 20],
      [width - 20, height - 20],
      [20, height - 20],
    ],
    elevation: 1,
  });

  if (sortedPlanes.length === 0) {
    // Default fallback region if graph has no planes
    regions.push({
      id: 'region-prime',
      name: `${graph.series.title} Prime Realm`,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [20, 20],
            [width - 20, 20],
            [width - 20, height - 20],
            [20, height - 20],
          ],
        ],
      },
      visibleFromChapter: 1,
      revealedAtChapter: 1,
    });
  } else {
    sortedPlanes.forEach((plane, idx) => {
      const planeLocations = locations.filter((l) => l.regionId === plane.id);
      let polygonRing: [number, number][];

      if (planeLocations.length >= 2) {
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        planeLocations.forEach((l) => {
          minX = Math.min(minX, l.x);
          maxX = Math.max(maxX, l.x);
          minY = Math.min(minY, l.y);
          maxY = Math.max(maxY, l.y);
        });

        const x1 = Math.max(20, minX - 50);
        const y1 = Math.max(20, minY - 50);
        const x2 = Math.min(width - 20, maxX + 50);
        const y2 = Math.min(height - 20, maxY + 50);

        polygonRing = [
          [x1, y1],
          [x2, y1],
          [x2, y2],
          [x1, y2],
        ];
      } else {
        // Geometric band allocation for plane
        const bandHeight = Math.floor((height - 40) / totalPlanes);
        const y1 = 20 + idx * bandHeight;
        const y2 = Math.min(height - 20, y1 + bandHeight - 10);
        polygonRing = [
          [20, y1],
          [width - 20, y1],
          [width - 20, y2],
          [20, y2],
        ];
      }

      const planeTerrainType = inferTerrainType(plane.name, slug);

      regions.push({
        id: plane.id,
        name: plane.name,
        geometry: {
          type: 'Polygon',
          coordinates: [polygonRing],
        },
        terrainType: planeTerrainType,
        visibleFromChapter: Math.max(0, plane.first_appearance ?? 1),
        revealedAtChapter: Math.max(0, plane.revealed_at ?? plane.first_appearance ?? 1),
        notes: plane.description || undefined,
      });

      // Layered Terrain polygon corresponding to plane region
      terrain.push({
        id: `terrain-${plane.id}`,
        type: planeTerrainType,
        name: `${plane.name} Terrain`,
        polygon: polygonRing,
        elevation: plane.tier_order ?? idx + 1,
      });
    });
  }

  // 3. Synthesize Events
  const events: MapEvent[] = rawEvents.map((ev) => {
    let eventType: MapEvent['eventType'] = 'battle';
    if (ev.event_type === 'breakthrough') eventType = 'breakthrough';
    else if (ev.event_type === 'death') eventType = 'death';
    else if (ev.event_type === 'discovery') eventType = 'discovery';
    else if (ev.event_type === 'ascension') eventType = 'ascension';
    else if (ev.event_type === 'revelation') eventType = 'reveal';
    else if (ev.event_type === 'political') eventType = 'war';
    else if (ev.event_type === 'battle') eventType = 'battle';

    return {
      id: ev.id,
      name: ev.name,
      chapter: Math.max(0, ev.chapter),
      locationId: ev.location_id || undefined,
      eventType,
      importance: 'critical',
      involvedCharacterIds:
        ev.involved_character_ids && ev.involved_character_ids.length > 0
          ? ev.involved_character_ids
          : undefined,
      description: ev.description || undefined,
    };
  });

  // 4. Synthesize Character Paths
  const characterPaths: CharacterPath[] = [];

  for (const char of rawCharacters) {
    const charEvents = rawEvents
      .filter((ev) => ev.involved_character_ids?.includes(char.id) && ev.location_id)
      .sort((a, b) => a.chapter - b.chapter);

    if (charEvents.length > 0) {
      const waypoints = charEvents
        .map((ev) => {
          const loc = locationsById.get(ev.location_id!);
          if (!loc) return null;
          return {
            chapter: Math.max(0, ev.chapter),
            locationId: loc.id,
            x: loc.x,
            y: loc.y,
            note: ev.name,
          };
        })
        .filter((wp): wp is NonNullable<typeof wp> => wp !== null);

      if (waypoints.length > 0) {
        characterPaths.push({
          characterId: char.id,
          characterName: char.name,
          waypoints,
        });
      }
    }
  }

  // Sort characterPaths so character with most waypoints is primary
  characterPaths.sort((a, b) => b.waypoints.length - a.waypoints.length);

  // 5. Synthesize Routes
  const routes: MapRoute[] = [];
  if (characterPaths.length > 0 && characterPaths[0].waypoints.length >= 2) {
    const primary = characterPaths[0];
    const points: [number, number][] = primary.waypoints.map((wp) => [wp.x, wp.y]);

    routes.push({
      id: `route-${primary.characterId}-path`,
      name: `${primary.characterName}'s Journey`,
      points,
      routeType: inferRouteType(slug),
      visibleFromChapter: primary.waypoints[0].chapter,
      revealedAtChapter: primary.waypoints[primary.waypoints.length - 1].chapter,
    });
  }

  // 6. Synthesize Faction Territories
  const territories: FactionTerritory[] = [];
  for (const faction of rawFactions) {
    const factionLocs = locations.filter(
      (l) =>
        l.controllingFactionId === faction.id ||
        l.name.toLowerCase().includes(faction.name.toLowerCase())
    );

    if (factionLocs.length > 0) {
      let boundary: [number, number][];

      if (factionLocs.length === 1) {
        const { x, y } = factionLocs[0];
        const r = 35;
        boundary = [
          [Math.max(10, x - r), Math.max(10, y - r)],
          [Math.min(width - 10, x + r), Math.max(10, y - r)],
          [Math.min(width - 10, x + r), Math.min(height - 10, y + r)],
          [Math.max(10, x - r), Math.min(height - 10, y + r)],
        ];
      } else {
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        factionLocs.forEach((l) => {
          minX = Math.min(minX, l.x);
          maxX = Math.max(maxX, l.x);
          minY = Math.min(minY, l.y);
          maxY = Math.max(maxY, l.y);
        });
        const pad = 25;
        boundary = [
          [Math.max(10, minX - pad), Math.max(10, minY - pad)],
          [Math.min(width - 10, maxX + pad), Math.max(10, minY - pad)],
          [Math.min(width - 10, maxX + pad), Math.min(height - 10, maxY + pad)],
          [Math.max(10, minX - pad), Math.min(height - 10, maxY + pad)],
        ];
      }

      territories.push({
        factionId: faction.id,
        name: `${faction.name} Domain`,
        boundary,
        controlPeriods: [
          {
            fromChapter: Math.max(0, faction.first_appearance ?? 1),
            toChapter: null,
            influencePct: 85,
          },
        ],
      });
    }
  }

  return {
    id: `map-${slug}`,
    universeId: slug,
    coordinateSystem: 'world',
    width,
    height,
    terrain,
    regions,
    locations,
    routes,
    territories,
    events,
    characterPaths,
  };
}
