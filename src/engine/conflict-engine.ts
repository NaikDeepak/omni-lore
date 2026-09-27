import { CanonicalLoreGraph, Fact } from '../domain/types';

export interface ConflictReport {
  entity_id: string;
  predicate: string;
  conflicting_facts: Fact[];
  description: string;
}

export class ConflictEngine {
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

          if (JSON.stringify(a.value) !== JSON.stringify(b.value)) {
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

  public static detectIntegrityIssues(graph: CanonicalLoreGraph): string[] {
    const issues: string[] = [];

    // 1. Referential integrity on relationships
    for (const rel of Object.values(graph.relationships)) {
      if (!graph.entities[rel.source_id]) {
        issues.push(`Relationship ${rel.id} references missing source entity '${rel.source_id}'.`);
      }
      if (!graph.entities[rel.target_id]) {
        issues.push(`Relationship ${rel.id} references missing target entity '${rel.target_id}'.`);
      }
    }

    // 2. Fact entity references and temporal consistency
    for (const fact of Object.values(graph.facts)) {
      if (!graph.entities[fact.entity_id]) {
        issues.push(`Fact ${fact.id} references missing entity '${fact.entity_id}'.`);
      }
      if (fact.temporal.valid_to != null && fact.temporal.valid_from > fact.temporal.valid_to) {
        issues.push(`Fact ${fact.id} has inverted temporal bounds: valid_from (${fact.temporal.valid_from}) > valid_to (${fact.temporal.valid_to}).`);
      }
    }

    // 3. Entity structural references and bounds
    for (const ent of Object.values(graph.entities)) {
      if (ent.type === 'location' && (ent as any).plane_id) {
        const planeId = (ent as any).plane_id;
        if (!graph.entities[planeId]) {
          issues.push(`Location '${ent.id}' references missing plane entity '${planeId}'.`);
        }
      }

      if (ent.type === 'event') {
        const eventEnt = ent as any;
        if (eventEnt.arc_id && !graph.entities[eventEnt.arc_id]) {
          issues.push(`Event '${ent.id}' references missing arc entity '${eventEnt.arc_id}'.`);
        }
        if (eventEnt.location_id && !graph.entities[eventEnt.location_id]) {
          issues.push(`Event '${ent.id}' references missing location entity '${eventEnt.location_id}'.`);
        }
        if (Array.isArray(eventEnt.involved_character_ids)) {
          for (const charId of eventEnt.involved_character_ids) {
            if (!graph.entities[charId]) {
              issues.push(`Event '${ent.id}' references missing character '${charId}'.`);
            }
          }
        }
      }

      if (ent.type === 'arc') {
        const arcEnt = ent as any;
        if (arcEnt.chapter_start > arcEnt.chapter_end) {
          issues.push(`Arc '${ent.id}' has inverted chapter bounds: start (${arcEnt.chapter_start}) > end (${arcEnt.chapter_end}).`);
        }
      }
    }

    return issues;
  }
}
