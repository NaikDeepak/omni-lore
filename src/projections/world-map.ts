import { CanonicalLoreGraph, LocationEntity, PlaneEntity } from '../domain/types';
import { TemporalEngine } from '../engine/temporal-engine';

export interface MapLocationEvent {
  id: string;
  name: string;
  chapter: number;
  event_type: string;
}

export interface MapLocationItem {
  id: string;
  name: string;
  description: string;
  coordinates?: { x: number; y: number };
  first_appearance: number;
  aliases?: string[];
  events?: MapLocationEvent[];
  thumbnail_url?: string;
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

  const locations = Object.values(graph.entities)
    .filter((e): e is LocationEntity => e.type === 'location')
    .sort((a, b) => a.first_appearance - b.first_appearance);

  const events = Object.values(filtered.entities)
    .filter((e): e is import('../domain/types').EventEntity => e.type === 'event' && e.chapter <= userChapter);

  for (const loc of locations) {
    if (planeMap.has(loc.plane_id)) {
      const locEvents = events
        .filter(ev => ev.location_id === loc.id)
        .map(ev => ({
          id: ev.id,
          name: ev.name,
          chapter: ev.chapter,
          event_type: ev.event_type,
        }))
        .sort((a, b) => a.chapter - b.chapter);

      planeMap.get(loc.plane_id)!.locations.push({
        id: loc.id,
        name: loc.name,
        description: loc.description,
        coordinates: loc.coordinates,
        first_appearance: loc.first_appearance,
        aliases: loc.aliases,
        events: locEvents,
        thumbnail_url: loc.thumbnail_url,
      });
    }
  }

  return {
    seriesSlug: graph.series.slug,
    userChapter,
    planes: Array.from(planeMap.values()),
  };
}
