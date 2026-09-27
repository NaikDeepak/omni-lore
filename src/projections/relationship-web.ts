import { CanonicalLoreGraph, CharacterEntity, FactionEntity } from '../domain/types';
import { TemporalEngine } from '../engine/temporal-engine';

export interface GraphNode {
  id: string;
  label: string;
  type: 'character' | 'faction';
  avatar_url?: string;
  isMasked: boolean;
  faction_id?: string;
  description?: string;
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
      const factionFact = TemporalEngine.getActiveFact<string>(
        char.id,
        'faction',
        Object.values(graph.facts),
        userChapter
      );

      nodes.push({
        id: char.id,
        label: filtered.displayNameMap[char.id] ?? char.name,
        type: 'character',
        avatar_url: char.avatar_url,
        isMasked,
        faction_id: factionFact?.value,
        description: char.description,
      });
      nodeIds.add(char.id);
    } else if (entity.type === 'faction') {
      const faction = entity as FactionEntity;
      nodes.push({
        id: faction.id,
        label: faction.name,
        type: 'faction',
        avatar_url: (faction as any).emblem_url,
        isMasked: false,
        description: faction.description,
      });
      nodeIds.add(faction.id);
    }
  }

  const edges: GraphEdge[] = [];
  const existingEdgeKeys = new Set<string>();

  for (const rel of Object.values(filtered.activeRelationships)) {
    if (nodeIds.has(rel.source_id) && nodeIds.has(rel.target_id)) {
      const key = `${rel.source_id}->${rel.target_id}:${rel.predicate}`;
      existingEdgeKeys.add(key);
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

  // Add faction membership edges
  for (const node of nodes) {
    if (node.type === 'character' && node.faction_id && nodeIds.has(node.faction_id)) {
      const key = `${node.id}->${node.faction_id}:member_of`;
      if (!existingEdgeKeys.has(key)) {
        edges.push({
          id: `rel-${node.id}-${node.faction_id}`,
          source: node.id,
          target: node.faction_id,
          predicate: 'member_of',
          label: 'Affiliated Member',
          valid_from: 1,
        });
        existingEdgeKeys.add(key);
      }
    }
  }

  return {
    seriesSlug: graph.series.slug,
    userChapter,
    nodes,
    edges,
  };
}
