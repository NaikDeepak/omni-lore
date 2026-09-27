import { 
  CanonicalLoreGraph, 
  CharacterEntity, 
  Entity, 
  Fact, 
  Relationship, 
  TemporalScope 
} from '../domain/types.js';

export interface FilteredLoreGraph {
  series: CanonicalLoreGraph['series'];
  userChapter: number;
  entities: Record<string, Entity>;
  activeFacts: Record<string, Fact>;
  activeRelationships: Record<string, Relationship>;
  displayNameMap: Record<string, string>;
}

export class TemporalEngine {
  /**
   * Evaluates if a temporal record is revealed to the reader at userChapter.
   */
  public static isRevealedAt(temporal: TemporalScope, userChapter: number): boolean {
    return temporal.revealed_at <= userChapter;
  }

  /**
   * Evaluates if a temporal record is active in the story narrative at userChapter.
   */
  public static isNarrativelyActiveAt(temporal: TemporalScope, userChapter: number): boolean {
    if (temporal.valid_from > userChapter) {
      return false;
    }
    if (temporal.valid_to !== null && temporal.valid_to < userChapter) {
      return false;
    }
    return true;
  }

  /**
   * Core visibility rule: Must be both narratively active AND revealed to reader.
   */
  public static isVisibleAt(temporal: TemporalScope, userChapter: number): boolean {
    return this.isRevealedAt(temporal, userChapter) && this.isNarrativelyActiveAt(temporal, userChapter);
  }

  /**
   * Checks if an entity is known to the reader by userChapter.
   */
  public static isEntityVisibleAt(entity: Entity, userChapter: number): boolean {
    return entity.revealed_at <= userChapter || entity.first_appearance <= userChapter;
  }

  /**
   * Resolves the reader-safe display name for a character at userChapter,
   * properly masking secret identities if userChapter is before the reveal.
   */
  public static resolveDisplayName(entity: Entity, userChapter: number): { name: string; isMasked: boolean } {
    if (entity.type !== 'character') {
      return { name: entity.name, isMasked: false };
    }

    const char = entity as CharacterEntity;
    if (!char.reveals || char.reveals.length === 0) {
      return { name: char.name, isMasked: false };
    }

    // Check reveals sorted by latest reveal threshold
    const sortedReveals = [...char.reveals].sort((a, b) => b.revealed_at - a.revealed_at);
    for (const rev of sortedReveals) {
      if (userChapter < rev.revealed_at) {
        // True identity not yet revealed to reader!
        return { name: rev.masked_name, isMasked: true };
      }
    }

    return { name: char.name, isMasked: false };
  }

  /**
   * Resolves the active fact for an entity and predicate at userChapter.
   * e.g., Linley's power_stage at Chapter 250 -> Saint
   */
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

    // Sort by most recent valid_from
    candidates.sort((a, b) => b.temporal.valid_from - a.temporal.valid_from);
    return candidates[0] as Fact<T>;
  }

  /**
   * Centralized filter that projects the entire canonical lore graph
   * down to a specific user chapter state.
   */
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
      // Both the fact itself and its target entity must be visible
      if (this.isVisibleAt(fact.temporal, userChapter) && visibleEntities[fact.entity_id]) {
        activeFacts[id] = fact;
      }
    }

    const activeRelationships: Record<string, Relationship> = {};
    for (const [id, rel] of Object.entries(graph.relationships)) {
      // Source, target, and relationship itself must be visible
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
