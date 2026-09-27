import { describe, expect, it } from 'vitest';
import { Fact } from '../src/domain/types.js';
import { ConflictEngine } from '../src/engine/conflict-engine.js';
import { coilingDragonFixture } from './fixtures/coiling-dragon.fixture.js';

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

  it('validates graph referential integrity', () => {
    const issues = ConflictEngine.detectIntegrityIssues(coilingDragonFixture);
    expect(issues.length).toBe(0);
  });
});
