import { CanonicalLoreGraph, CharacterEntity, FactionEntity } from '../domain/types';
import { TemporalEngine } from '../engine/temporal-engine';

export interface GraphNode {
  id: string;
  label: string;
  type: 'character' | 'faction';
  avatar_url?: string;
  isMasked: boolean;
  faction_id?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  predicate: string;
  label?: string;
  valid_from: number;
}

export interface RelationshipWebProjection {
  seriesSlug: string;
  userChapter: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function projectRelationshipWeb(
  graph: CanonicalLoreGraph, 
  userChapter: number
): RelationshipWebProjection {
  const filtered = TemporalEngine.filterGraphAtChapter(graph, userChapter);

  const nodes: GraphNode[] = [];
  const nodeIds = new Set<string>();

  for (const entity of Object.values(filtered.entities)) {
    if (entity.type === 'character') {
      const char = entity as CharacterEntity;
      const isMasked = filtered.displayNameMap[char.id] !== char.name;
      nodes.push({
        id: char.id,
        label: filtered.displayNameMap[char.id] ?? char.name,
        type: 'character',
        avatar_url: char.avatar_url,
        isMasked,
      });
      nodeIds.add(char.id);
    } else if (entity.type === 'faction') {
      const faction = entity as FactionEntity;
      nodes.push({
        id: faction.id,
        label: faction.name,
        type: 'faction',
        isMasked: false,
      });
      nodeIds.add(faction.id);
    }
  }

  const edges: GraphEdge[] = [];
  for (const rel of Object.values(filtered.activeRelationships)) {
    if (nodeIds.has(rel.source_id) && nodeIds.has(rel.target_id)) {
      edges.push({
        id: rel.id,
        source: rel.source_id,
        target: rel.target_id,
        predicate: rel.predicate,
        label: rel.label ?? rel.predicate.replace(/_/g, ' ').toLowerCase(),
        valid_from: rel.temporal.valid_from,
      });
    }
  }

  return {
    seriesSlug: graph.series.slug,
    userChapter,
    nodes,
    edges,
  };
}
