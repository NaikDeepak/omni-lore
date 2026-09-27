import { ArcEntity, CanonicalLoreGraph, EventEntity } from '../domain/types.js';
import { TemporalEngine } from '../engine/temporal-engine.js';

export interface TimelineEventItem {
  id: string;
  title: string;
  chapter: number;
  description: string;
  event_type: string;
  location_id?: string;
  location_name?: string;
  involved_characters: Array<{ id: string; name: string }>;
}

export interface TimelineArcItem {
  id: string;
  name: string;
  order: number;
  chapter_start: number;
  chapter_end: number;
  events: TimelineEventItem[];
}

export interface TimelineProjection {
  seriesSlug: string;
  userChapter: number;
  arcs: TimelineArcItem[];
}

export function projectTimeline(
  graph: CanonicalLoreGraph, 
  userChapter: number
): TimelineProjection {
  const filtered = TemporalEngine.filterGraphAtChapter(graph, userChapter);

  // Arcs that have begun by userChapter
  const visibleArcs = Object.values(filtered.entities)
    .filter((e): e is ArcEntity => e.type === 'arc' && e.chapter_start <= userChapter)
    .sort((a, b) => a.order - b.order);

  // Events that have occurred by userChapter
  const visibleEvents = Object.values(filtered.entities)
    .filter((e): e is EventEntity => e.type === 'event' && e.chapter <= userChapter)
    .sort((a, b) => a.chapter - b.chapter);

  const arcMap = new Map<string, TimelineArcItem>();
  visibleArcs.forEach(arc => {
    arcMap.set(arc.id, {
      id: arc.id,
      name: arc.name,
      order: arc.order,
      chapter_start: arc.chapter_start,
      chapter_end: Math.min(arc.chapter_end, userChapter),
      events: [],
    });
  });

  // Attach events to their respective arcs
  for (const event of visibleEvents) {
    if (arcMap.has(event.arc_id)) {
      const arc = arcMap.get(event.arc_id)!;
      const location = event.location_id ? filtered.entities[event.location_id] : undefined;

      arc.events.push({
        id: event.id,
        title: event.name,
        chapter: event.chapter,
        description: event.description,
        event_type: event.event_type,
        location_id: event.location_id,
        location_name: location?.name,
        involved_characters: event.involved_character_ids.map(id => ({
          id,
          name: filtered.displayNameMap[id] ?? graph.entities[id]?.name ?? id,
        })),
      });
    }
  }

  return {
    seriesSlug: graph.series.slug,
    userChapter,
    arcs: Array.from(arcMap.values()),
  };
}
