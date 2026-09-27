import { CanonicalLoreGraph, EventEntity } from '../domain/types';
import { TemporalEngine } from '../engine/temporal-engine';

export interface JourneyMilestone {
  chapter: number;
  type: 'power_breakthrough' | 'event' | 'relationship_formed' | 'relationship_ended' | 'faction_change';
  title: string;
  description: string;
  details?: Record<string, unknown>;
}

export interface CharacterJourneyProjection {
  characterId: string;
  displayName: string;
  seriesSlug: string;
  userChapter: number;
  milestones: JourneyMilestone[];
}

export function projectCharacterJourney(
  characterId: string,
  graph: CanonicalLoreGraph,
  userChapter: number
): CharacterJourneyProjection | null {
  const filtered = TemporalEngine.filterGraphAtChapter(graph, userChapter);
  const character = filtered.entities[characterId];

  if (!character || character.type !== 'character') {
    return null;
  }

  const milestones: JourneyMilestone[] = [];

  const facts = Object.values(graph.facts).filter(f => 
    f.entity_id === characterId && 
    f.predicate === 'power_stage' && 
    TemporalEngine.isVisibleAt(f.temporal, userChapter)
  );

  for (const fact of facts) {
    const stageEntity = graph.entities[fact.value as string];
    milestones.push({
      chapter: fact.temporal.valid_from,
      type: 'power_breakthrough',
      title: `Achieved ${stageEntity?.name ?? fact.value}`,
      description: `Broke through to ${stageEntity?.name ?? fact.value} stage.`,
      details: { stageId: fact.value },
    });
  }

  const events = Object.values(filtered.entities).filter((e): e is EventEntity => 
    e.type === 'event' && 
    e.chapter <= userChapter && 
    e.involved_character_ids.includes(characterId)
  );

  for (const ev of events) {
    milestones.push({
      chapter: ev.chapter,
      type: 'event',
      title: ev.name,
      description: ev.description,
      details: { eventType: ev.event_type, locationId: ev.location_id },
    });
  }

  const relationships = Object.values(graph.relationships).filter(r => 
    (r.source_id === characterId || r.target_id === characterId) &&
    TemporalEngine.isRevealedAt(r.temporal, userChapter) &&
    r.temporal.valid_from <= userChapter
  );

  for (const rel of relationships) {
    const otherId = rel.source_id === characterId ? rel.target_id : rel.source_id;
    const otherName = filtered.displayNameMap[otherId] ?? graph.entities[otherId]?.name ?? otherId;

    milestones.push({
      chapter: rel.temporal.valid_from,
      type: 'relationship_formed',
      title: `${rel.label ?? rel.predicate} with ${otherName}`,
      description: `Established ${rel.predicate} relationship with ${otherName}.`,
      details: { relationshipId: rel.id, predicate: rel.predicate, targetId: otherId },
    });

    if (rel.temporal.valid_to !== null && rel.temporal.valid_to <= userChapter) {
      milestones.push({
        chapter: rel.temporal.valid_to,
        type: 'relationship_ended',
        title: `Ended ${rel.label ?? rel.predicate} with ${otherName}`,
        description: `Concluded ${rel.predicate} relationship with ${otherName}.`,
        details: { relationshipId: rel.id },
      });
    }
  }

  milestones.sort((a, b) => a.chapter - b.chapter);

  return {
    characterId,
    displayName: filtered.displayNameMap[characterId] ?? character.name,
    seriesSlug: graph.series.slug,
    userChapter,
    milestones,
  };
}
