import { CanonicalLoreGraph, LocationEntity, PlaneEntity } from '../domain/types.js';
import { TemporalEngine } from '../engine/temporal-engine.js';

export interface MapLocationItem {
  id: string;
  name: string;
  description: string;
  coordinates?: { x: number; y: number };
  first_appearance: number;
}

export interface MapPlaneItem {
  id: string;
  name: string;
  tier_order: number;
  description: string;
  locations: MapLocationItem[];
}

export interface WorldMapProjection {
  seriesSlug: string;
  userChapter: number;
  planes: MapPlaneItem[];
}

export function projectWorldMap(
  graph: CanonicalLoreGraph, 
  userChapter: number
): WorldMapProjection {
  const filtered = TemporalEngine.filterGraphAtChapter(graph, userChapter);

  // Planes visible at userChapter
  const planes = Object.values(filtered.entities)
    .filter((e): e is PlaneEntity => e.type === 'plane')
    .sort((a, b) => a.tier_order - b.tier_order);

  const planeMap = new Map<string, MapPlaneItem>();
  planes.forEach(p => {
    planeMap.set(p.id, {
      id: p.id,
      name: p.name,
      tier_order: p.tier_order,
      description: p.description,
      locations: [],
    });
  });

  // Locations discovered at or before userChapter
  const locations = Object.values(filtered.entities)
    .filter((e): e is LocationEntity => e.type === 'location' && e.first_appearance <= userChapter);

  for (const loc of locations) {
    if (planeMap.has(loc.plane_id)) {
      planeMap.get(loc.plane_id)!.locations.push({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        coordinates: loc.coordinates,
        first_appearance: loc.first_appearance,
      });
    }
  }

  return {
    seriesSlug: graph.series.slug,
    userChapter,
    planes: Array.from(planeMap.values()),
  };
}
