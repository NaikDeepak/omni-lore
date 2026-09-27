import { describe, expect, it } from 'vitest';
import { Fact } from '../src/domain/types';
import { ConflictEngine } from '../src/engine/conflict-engine';
import { coilingDragonFixture } from './fixtures/coiling-dragon.fixture';

describe('ConflictEngine & Canon Confidence', () => {
  it('detects overlapping contradictory facts without silent overwriting', () => {
    const conflictingFacts: Fact[] = [
      {
        id: 'fact-source-a',
        entity_id: 'linley-baruch',
        predicate: 'power_stage',
        value: 'stage-saint',
        temporal: { valid_from: 115, valid_to: 450, revealed_at: 115 },
        provenance: {
          source: { series: 'coiling-dragon', page: 'Linley', chapter: 115 },
          extracted_by: 'llm',
          confidence: 0.95,
          created_at: '2026-09-27T00:00:00Z',
        },
        canon_status: 'canon',
      },
      {
        id: 'fact-source-b',
        entity_id: 'linley-baruch',
        predicate: 'power_stage',
        value: 'stage-god', // Contradiction!
        temporal: { valid_from: 115, valid_to: 200, revealed_at: 115 },
        provenance: {
          source: { series: 'coiling-dragon', page: 'Discussion Page', chapter: 115 },
          extracted_by: 'llm',
          confidence: 0.60,
          created_at: '2026-09-27T00:00:00Z',
        },
        canon_status: 'canon',
      },
    ];

    const reports = ConflictEngine.detectFactConflicts(conflictingFacts);
    expect(reports.length).toBe(1);
    expect(reports[0].entity_id).toBe('linley-baruch');
    expect(reports[0].predicate).toBe('power_stage');
    expect(conflictingFacts[0].canon_status).toBe('conflicting');
    expect(conflictingFacts[1].canon_status).toBe('conflicting');
  });

  it('validates graph referential integrity on valid fixture', () => {
    const issues = ConflictEngine.detectIntegrityIssues(coilingDragonFixture);
    expect(issues.length).toBe(0);
  });

  it('detects orphaned locations and missing event references', () => {
    const brokenGraph = JSON.parse(JSON.stringify(coilingDragonFixture));
    // Introduce broken location pointing to nonexistent plane
    brokenGraph.entities['broken-loc'] = {
      id: 'broken-loc',
      type: 'location',
      name: 'Broken Landmark',
      plane_id: 'nonexistent-plane',
      description: 'Lost in the void',
    };
    // Introduce event with missing arc and missing character
    brokenGraph.entities['broken-event'] = {
      id: 'broken-event',
      type: 'event',
      name: 'Broken Event',
      chapter: 50,
      arc_id: 'nonexistent-arc',
      description: 'Event without arc',
      event_type: 'battle',
      involved_character_ids: ['phantom-warrior'],
    };

    const issues = ConflictEngine.detectIntegrityIssues(brokenGraph);
    expect(issues.some(i => i.includes('missing plane entity \'nonexistent-plane\''))).toBe(true);
    expect(issues.some(i => i.includes('missing arc entity \'nonexistent-arc\''))).toBe(true);
    expect(issues.some(i => i.includes('missing character \'phantom-warrior\''))).toBe(true);
  });

  it('detects temporal inversions in facts and arc bounds', () => {
    const brokenGraph = JSON.parse(JSON.stringify(coilingDragonFixture));
    brokenGraph.facts['broken-temporal-fact'] = {
      id: 'broken-temporal-fact',
      entity_id: 'linley-baruch',
      predicate: 'title',
      value: 'Dragonblood Warrior',
      temporal: { valid_from: 200, valid_to: 100, revealed_at: 200 }, // Inverted!
      provenance: {
        source: { series: 'coiling-dragon', page: 'Linley', chapter: 200 },
        extracted_by: 'manual',
        confidence: 1.0,
        created_at: '2026-09-27T00:00:00Z',
      },
      canon_status: 'canon',
    };

    const issues = ConflictEngine.detectIntegrityIssues(brokenGraph);
    expect(issues.some(i => i.includes('inverted temporal bounds'))).toBe(true);
  });
});
