import { 
  CanonicalLoreGraph, 
  CharacterEntity, 
  Entity, 
  Fact, 
  Relationship, 
  TemporalScope 
} from '../domain/types';

export interface FilteredLoreGraph {
  series: CanonicalLoreGraph['series'];
  userChapter: number;
  entities: Record<string, Entity>;
  activeFacts: Record<string, Fact>;
  activeRelationships: Record<string, Relationship>;
  displayNameMap: Record<string, string>;
}

export class TemporalEngine {
  public static isRevealedAt(temporal: TemporalScope, userChapter: number): boolean {
    return temporal.revealed_at <= userChapter;
  }

  public static isNarrativelyActiveAt(temporal: TemporalScope, userChapter: number): boolean {
    if (temporal.valid_from > userChapter) {
      return false;
    }
    if (temporal.valid_to !== null && temporal.valid_to < userChapter) {
      return false;
    }
    return true;
  }

  public static isVisibleAt(temporal: TemporalScope, userChapter: number): boolean {
    return this.isRevealedAt(temporal, userChapter) && this.isNarrativelyActiveAt(temporal, userChapter);
  }

  public static isEntityVisibleAt(entity: Entity, userChapter: number): boolean {
    return entity.revealed_at <= userChapter || entity.first_appearance <= userChapter;
  }

  public static resolveDisplayName(entity: Entity, userChapter: number): { name: string; isMasked: boolean } {
    if (entity.type !== 'character') {
      return { name: entity.name, isMasked: false };
    }

    const char = entity as CharacterEntity;
    if (!char.reveals || char.reveals.length === 0) {
      return { name: char.name, isMasked: false };
    }

    const sortedReveals = [...char.reveals].sort((a, b) => b.revealed_at - a.revealed_at);
    for (const rev of sortedReveals) {
      if (userChapter < rev.revealed_at) {
        return { name: rev.masked_name, isMasked: true };
      }
    }

    return { name: char.name, isMasked: false };
  }

  public static getActiveFact<T = unknown>(
    entityId: string, 
    predicate: string, 
    facts: Fact[], 
    userChapter: number
  ): Fact<T> | null {
    const candidates = facts.filter(f => 
      f.entity_id === entityId && 
      f.predicate === predicate &&
      this.isVisibleAt(f.temporal, userChapter)
    );

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.temporal.valid_from - a.temporal.valid_from);
    return candidates[0] as Fact<T>;
  }

  public static filterGraphAtChapter(
    graph: CanonicalLoreGraph, 
    userChapter: number
  ): FilteredLoreGraph {
    const visibleEntities: Record<string, Entity> = {};
    const displayNameMap: Record<string, string> = {};

    for (const [id, entity] of Object.entries(graph.entities)) {
      if (this.isEntityVisibleAt(entity, userChapter)) {
        visibleEntities[id] = entity;
        const resolved = this.resolveDisplayName(entity, userChapter);
        displayNameMap[id] = resolved.name;
      }
    }

    const activeFacts: Record<string, Fact> = {};
    for (const [id, fact] of Object.entries(graph.facts)) {
      if (this.isVisibleAt(fact.temporal, userChapter) && visibleEntities[fact.entity_id]) {
        activeFacts[id] = fact;
      }
    }

    const activeRelationships: Record<string, Relationship> = {};
    for (const [id, rel] of Object.entries(graph.relationships)) {
      if (
        this.isVisibleAt(rel.temporal, userChapter) &&
        visibleEntities[rel.source_id] &&
        visibleEntities[rel.target_id]
      ) {
        activeRelationships[id] = rel;
      }
    }

    return {
      series: graph.series,
      userChapter,
      entities: visibleEntities,
      activeFacts,
      activeRelationships,
      displayNameMap,
    };
  }
}
