import { z } from 'zod';

export const CanonStatusSchema = z.enum(['canon', 'probable', 'uncertain', 'conflicting', 'fanon']);

export const ExtractorTypeSchema = z.enum(['deterministic', 'llm', 'manual']);

export const ProvenanceSchema = z.object({
  source: z.object({
    series: z.string(),
    page: z.string().optional(),
    chapter: z.number().optional(),
    url: z.string().optional(),
    revision_id: z.string().optional(),
  }),
  extracted_by: ExtractorTypeSchema,
  confidence: z.number().min(0).max(1),
  created_at: z.string(),
  notes: z.string().optional(),
});

export const TemporalScopeSchema = z.object({
  valid_from: z.number(),
  valid_to: z.number().nullable(),
  revealed_at: z.number(),
  story_time: z.string().optional(),
  first_appearance: z.number().optional(),
});

export const EntityTypeSchema = z.enum([
  'series',
  'character',
  'faction',
  'realm',
  'power_stage',
  'ability',
  'location',
  'plane',
  'event',
  'arc',
  'item',
]);

export const BaseEntitySchema = z.object({
  id: z.string(),
  type: EntityTypeSchema,
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  description: z.string().default(''),
  provenance: ProvenanceSchema,
  canon_status: CanonStatusSchema,
  first_appearance: z.number(),
  revealed_at: z.number(),
});

export const CharacterEntitySchema = BaseEntitySchema.extend({
  type: z.literal('character'),
  reveals: z.array(z.object({
    revealed_at: z.number(),
    masked_name: z.string(),
    true_identity: z.string(),
  })).optional(),
  avatar_url: z.string().optional(),
});

export const PowerStageEntitySchema = BaseEntitySchema.extend({
  type: z.literal('power_stage'),
  order: z.number(),
  sub_level: z.string().optional(),
  system_name: z.string(),
  realm_id: z.string().optional(),
});

export const LocationEntitySchema = BaseEntitySchema.extend({
  type: z.literal('location'),
  plane_id: z.string(),
  coordinates: z.object({ x: z.number(), y: z.number() }).optional(),
  parent_location_id: z.string().optional(),
});

export const PlaneEntitySchema = BaseEntitySchema.extend({
  type: z.literal('plane'),
  tier_order: z.number(),
});

export const EventEntitySchema = BaseEntitySchema.extend({
  type: z.literal('event'),
  arc_id: z.string(),
  chapter: z.number(),
  location_id: z.string().optional(),
  event_type: z.enum(['battle', 'breakthrough', 'death', 'discovery', 'ascension', 'revelation', 'political']),
  involved_character_ids: z.array(z.string()).default([]),
});

export const RelationshipPredicateSchema = z.enum([
  'MEMBER_OF',
  'LEADER_OF',
  'MASTER_OF',
  'DISCIPLE_OF',
  'RIVAL_OF',
  'ENEMY_OF',
  'ALLY_OF',
  'RELATED_TO',
  'LOCATED_IN',
  'ACHIEVED',
  'POSSESSES',
  'PARTICIPATED_IN',
  'PART_OF',
  'ASCENDED_TO',
  'KILLED_BY',
]);

export const RelationshipSchema = z.object({
  id: z.string(),
  source_id: z.string(),
  target_id: z.string(),
  predicate: RelationshipPredicateSchema,
  label: z.string().optional(),
  temporal: TemporalScopeSchema,
  provenance: ProvenanceSchema,
  canon_status: CanonStatusSchema,
});

export const FactSchema = z.object({
  id: z.string(),
  entity_id: z.string(),
  predicate: z.string(),
  value: z.unknown(),
  temporal: TemporalScopeSchema,
  provenance: ProvenanceSchema,
  canon_status: CanonStatusSchema,
  conflict_with: z.array(z.string()).optional(),
});

export const SeriesMetadataSchema = z.object({
  slug: z.string(),
  title: z.string(),
  type: z.enum(['cultivation', 'litrpg', 'fantasy', 'anime', 'light_novel']),
  status: z.enum(['completed', 'ongoing']),
  wiki_api_endpoint: z.string().optional(),
  total_chapters: z.number(),
  knowledge_boundary: z.object({
    latest_processed_chapter: z.number(),
    latest_source_revision: z.string().optional(),
    as_of: z.string(),
  }),
});
