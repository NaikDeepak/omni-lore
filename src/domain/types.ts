/**
 * OmniLore Domain Model: Canonical Temporal Knowledge Graph
 * 
 * Foundational principle:
 * A fictional universe is represented as a temporal knowledge graph,
 * and every visualization (ladder, web, map, timeline, journey)
 * is a different projection of that single graph.
 */

export type CanonStatus = 'canon' | 'probable' | 'uncertain' | 'conflicting' | 'fanon';

export type ExtractorType = 'deterministic' | 'llm' | 'manual';

export interface SourceProvenance {
  series: string;
  page?: string;
  chapter?: number;
  url?: string;
  revision_id?: string;
}

export interface Provenance {
  source: SourceProvenance;
  extracted_by: ExtractorType;
  confidence: number; // 0.0 to 1.0
  created_at: string; // ISO 8601
  notes?: string;
}

/**
 * Temporal Scope distinguishes:
 * 1. Story Time: When the event happened in universe (e.g. Year 9999 of Divine Calendar).
 * 2. Publication Position: When the chapter/volume was published / encountered.
 * 3. Reveal Position: When the reader learned the fact (crucial for spoiler control).
 * 4. Validity: When this fact is active/true in narrative.
 */
export interface TemporalScope {
  valid_from: number;              // Chapter/milestone where state begins
  valid_to: number | null;         // Chapter/milestone where state ends (null = perpetual / current)
  revealed_at: number;             // Chapter where the reader learns this information
  story_time?: string;             // Optional in-universe calendar timestamp (e.g. "Year 10005")
  first_appearance?: number;       // Chapter where the entity physically first appeared
}

export type EntityType = 
  | 'series'
  | 'character'
  | 'faction'
  | 'realm'
  | 'power_stage'
  | 'ability'
  | 'location'
  | 'plane'
  | 'event'
  | 'arc'
  | 'item';

export interface BaseEntity {
  id: string;
  type: EntityType;
  name: string;
  aliases: string[];
  description: string;
  provenance: Provenance;
  canon_status: CanonStatus;
  first_appearance: number; // chapter
  revealed_at: number;       // chapter
}

export interface CharacterEntity extends BaseEntity {
  type: 'character';
  /**
   * Secret or true identity that is only revealed at a later chapter.
   * e.g., Klein Moretti -> The Fool (revealed at Ch 1, but Secret Identity "The World" at Ch 300)
   */
  reveals?: Array<{
    revealed_at: number;
    masked_name: string;      // What they are known as before reveal
    true_identity: string;    // What is revealed
  }>;
  avatar_url?: string;
}

export interface FactionEntity extends BaseEntity {
  type: 'faction';
  emblem_url?: string;
  parent_faction_id?: string;
}

export interface PowerStageEntity extends BaseEntity {
  type: 'power_stage';
  order: number;              // Absolute numerical ladder position (e.g. 1 = Mortal, 10 = Saint)
  sub_level?: string;         // e.g. "Early", "Middle", "Peak"
  system_name: string;        // e.g. "Elemental Law Fusion", "Beyonder Pathway"
  realm_id?: string;
}

export interface LocationEntity extends BaseEntity {
  type: 'location';
  plane_id: string;           // Belongs to which cosmological plane
  coordinates?: { x: number; y: number };
  parent_location_id?: string;
  thumbnail_url?: string;
}

export interface PlaneEntity extends BaseEntity {
  type: 'plane';
  tier_order: number;         // e.g. 1 = Material Plane, 2 = Higher Plane, 3 = Supreme Realm
}

export interface EventEntity extends BaseEntity {
  type: 'event';
  arc_id: string;
  chapter: number;
  location_id?: string;
  event_type: 'battle' | 'breakthrough' | 'death' | 'discovery' | 'ascension' | 'revelation' | 'political';
  involved_character_ids: string[];
}

export interface ArcEntity extends BaseEntity {
  type: 'arc';
  chapter_start: number;
  chapter_end: number;
  order: number;
}

export interface ItemEntity extends BaseEntity {
  type: 'item';
  item_type: 'artifact' | 'pill' | 'weapon' | 'ring' | 'scroll';
  grade?: string;
}

export type Entity = 
  | CharacterEntity
  | FactionEntity
  | PowerStageEntity
  | LocationEntity
  | PlaneEntity
  | EventEntity
  | ArcEntity
  | ItemEntity;

/**
 * First-class Fact representation.
 * Allows multiple competing/historical attributes without overwriting.
 */
export interface Fact<T = unknown> {
  id: string;
  entity_id: string;
  predicate: string; // e.g., 'power_stage', 'location', 'faction', 'status'
  value: T;
  temporal: TemporalScope;
  provenance: Provenance;
  canon_status: CanonStatus;
  conflict_with?: string[]; // IDs of conflicting facts if any
}

export type RelationshipPredicate =
  | 'MEMBER_OF'
  | 'LEADER_OF'
  | 'MASTER_OF'
  | 'DISCIPLE_OF'
  | 'RIVAL_OF'
  | 'ENEMY_OF'
  | 'ALLY_OF'
  | 'RELATED_TO'
  | 'LOCATED_IN'
  | 'ACHIEVED'
  | 'POSSESSES'
  | 'PARTICIPATED_IN'
  | 'PART_OF'
  | 'ASCENDED_TO'
  | 'KILLED_BY';

export interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  predicate: RelationshipPredicate;
  label?: string;
  temporal: TemporalScope;
  provenance: Provenance;
  canon_status: CanonStatus;
}

export interface SeriesMetadata {
  slug: string;
  title: string;
  type: 'cultivation' | 'litrpg' | 'fantasy' | 'anime' | 'light_novel';
  status: 'completed' | 'ongoing';
  wiki_api_endpoint?: string;
  total_chapters: number;
  knowledge_boundary: {
    latest_processed_chapter: number;
    latest_source_revision?: string;
    as_of: string;
  };
}

export interface CanonicalLoreGraph {
  series: SeriesMetadata;
  entities: Record<string, Entity>;
  facts: Record<string, Fact>;
  relationships: Record<string, Relationship>;
}
