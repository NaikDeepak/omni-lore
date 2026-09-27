import { CanonicalLoreGraph, Fact } from '../domain/types.js';

export interface ConflictReport {
  entity_id: string;
  predicate: string;
  conflicting_facts: Fact[];
  description: string;
}

export class ConflictEngine {
  /**
   * Detects temporal contradictions in facts for an entity.
   * e.g., two facts claiming different values for the same predicate
   * with overlapping valid_from and valid_to ranges.
   */
  public static detectFactConflicts(facts: Fact[]): ConflictReport[] {
    const reports: ConflictReport[] = [];
    const grouped: Record<string, Fact[]> = {};

    for (const fact of facts) {
      const key = `${fact.entity_id}:${fact.predicate}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(fact);
    }

    for (const [key, entityFacts] of Object.entries(grouped)) {
      if (entityFacts.length < 2) continue;

      for (let i = 0; i < entityFacts.length; i++) {
        for (let j = i + 1; j < entityFacts.length; j++) {
          const a = entityFacts[i];
          const b = entityFacts[j];

          // Check if values differ
          if (JSON.stringify(a.value) !== JSON.stringify(b.value)) {
            // Check if their temporal validity overlaps
            const aStart = a.temporal.valid_from;
            const aEnd = a.temporal.valid_to ?? Infinity;
            const bStart = b.temporal.valid_from;
            const bEnd = b.temporal.valid_to ?? Infinity;

            const overlaps = Math.max(aStart, bStart) <= Math.min(aEnd, bEnd);

            if (overlaps) {
              a.canon_status = 'conflicting';
              b.canon_status = 'conflicting';
              a.conflict_with = [...(a.conflict_with || []), b.id];
              b.conflict_with = [...(b.conflict_with || []), a.id];

              const [entityId, predicate] = key.split(':');
              reports.push({
                entity_id: entityId,
                predicate,
                conflicting_facts: [a, b],
                description: `Contradicting '${predicate}' values (${JSON.stringify(a.value)} vs ${JSON.stringify(b.value)}) with overlapping chapters [${aStart}-${aEnd}] and [${bStart}-${bEnd}].`,
              });
            }
          }
        }
      }
    }

    return reports;
  }

  /**
   * Validates graph referential integrity: ensures every source and target
   * referenced in relationships and events actually exists in the graph.
   */
  public static detectIntegrityIssues(graph: CanonicalLoreGraph): string[] {
    const issues: string[] = [];

    for (const rel of Object.values(graph.relationships)) {
      if (!graph.entities[rel.source_id]) {
        issues.push(`Relationship ${rel.id} references missing source entity '${rel.source_id}'.`);
      }
      if (!graph.entities[rel.target_id]) {
        issues.push(`Relationship ${rel.id} references missing target entity '${rel.target_id}'.`);
      }
    }

    for (const fact of Object.values(graph.facts)) {
      if (!graph.entities[fact.entity_id]) {
        issues.push(`Fact ${fact.id} references missing entity '${fact.entity_id}'.`);
      }
    }

    return issues;
  }
}
