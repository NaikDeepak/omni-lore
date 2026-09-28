import { describe, expect, it } from 'vitest';
import { TemporalEngine } from '../src/engine/temporal-engine';
import { coilingDragonFixture } from './fixtures/coiling-dragon.fixture';

describe('TemporalEngine & Spoiler Scrubber', () => {
  const graph = coilingDragonFixture;

  describe('Scenario 1: Hidden future relationship', () => {
    it('hides relationship before its valid chapter', () => {
      const bebeRel = graph.relationships['rel-bebe-ally'];
      
      // Bebe meets Linley at chapter 8
      expect(TemporalEngine.isVisibleAt(bebeRel.temporal, 5)).toBe(false);
      expect(TemporalEngine.isVisibleAt(bebeRel.temporal, 8)).toBe(true);
      expect(TemporalEngine.isVisibleAt(bebeRel.temporal, 50)).toBe(true);
    });
  });

  describe('Scenario 2: Expired relationship', () => {
    it('marks mentorship as active between Ch 1-120 and expired after Ch 120', () => {
      const doehringRel = graph.relationships['rel-doehring-master'];

      // Active during discipleship
      expect(TemporalEngine.isNarrativelyActiveAt(doehringRel.temporal, 50)).toBe(true);
      expect(TemporalEngine.isVisibleAt(doehringRel.temporal, 50)).toBe(true);

      // Expired after Doehring sacrifices himself at chapter 120
      expect(TemporalEngine.isNarrativelyActiveAt(doehringRel.temporal, 150)).toBe(false);
      expect(TemporalEngine.isVisibleAt(doehringRel.temporal, 150)).toBe(false);
    });
  });

  describe('Scenario 3: Future reveal and secret identity masking', () => {
    it('masks true identity when user chapter is before reveal chapter', () => {
      const linley = graph.entities['linley-baruch'];

      // Before reveal at Ch 500: Name is masked
      const beforeReveal = TemporalEngine.resolveDisplayName(linley, 300);
      expect(beforeReveal.isMasked).toBe(true);
      expect(beforeReveal.name).toBe('Mysterious Sovereign Envoy');

      // At or after reveal at Ch 500: True identity shown
      const afterReveal = TemporalEngine.resolveDisplayName(linley, 500);
      expect(afterReveal.isMasked).toBe(false);
      expect(afterReveal.name).toBe('Linley Baruch');
    });

    it('progresses through sequential multi-stage reveals chronologically', () => {
      const multiRevealChar: any = {
        id: 'klein-moretti',
        type: 'character',
        name: 'The Fool / Klein Moretti',
        first_appearance: 1,
        revealed_at: 1,
        reveals: [
          { revealed_at: 214, masked_name: 'Klein Moretti (Tingen Nighthawk)', true_identity: 'Sherlock Moriarty' },
          { revealed_at: 483, masked_name: 'Sherlock Moriarty (Backlund Detective)', true_identity: 'Gehrman Sparrow' },
          { revealed_at: 733, masked_name: 'Gehrman Sparrow (Crazy Adventurer)', true_identity: 'Dwayne Dantes' },
          { revealed_at: 1153, masked_name: 'Dwayne Dantes (Mayfair Tycoon)', true_identity: 'Merlin Hermes' },
          { revealed_at: 1380, masked_name: 'Merlin Hermes (Miracle Magician)', true_identity: 'The Fool / Lord of Mysteries' },
        ],
      };

      expect(TemporalEngine.resolveDisplayName(multiRevealChar, 100).name).toBe('Klein Moretti (Tingen Nighthawk)');
      expect(TemporalEngine.resolveDisplayName(multiRevealChar, 300).name).toBe('Sherlock Moriarty (Backlund Detective)');
      expect(TemporalEngine.resolveDisplayName(multiRevealChar, 600).name).toBe('Gehrman Sparrow (Crazy Adventurer)');
      expect(TemporalEngine.resolveDisplayName(multiRevealChar, 900).name).toBe('Dwayne Dantes (Mayfair Tycoon)');
      expect(TemporalEngine.resolveDisplayName(multiRevealChar, 1200).name).toBe('Merlin Hermes (Miracle Magician)');
      expect(TemporalEngine.resolveDisplayName(multiRevealChar, 1400).name).toBe('The Fool / Klein Moretti');
      expect(TemporalEngine.resolveDisplayName(multiRevealChar, 1400).isMasked).toBe(false);
    });
  });

  describe('Scenario 4: Character power progression across chapters', () => {
    const facts = Object.values(graph.facts);

    it('resolves correct realm for Linley at different chapter milestones', () => {
      // Chapter 50: Mortal
      const at50 = TemporalEngine.getActiveFact<string>('linley-baruch', 'power_stage', facts, 50);
      expect(at50?.value).toBe('stage-mortal');

      // Chapter 250: Saint
      const at250 = TemporalEngine.getActiveFact<string>('linley-baruch', 'power_stage', facts, 250);
      expect(at250?.value).toBe('stage-saint');

      // Chapter 500: God
      const at500 = TemporalEngine.getActiveFact<string>('linley-baruch', 'power_stage', facts, 500);
      expect(at500?.value).toBe('stage-god');
    });
  });

  describe('Scenario 5: Future entities and planes hidden', () => {
    it('hides Infernal Realm before chapter 200', () => {
      const infernal = graph.entities['plane-infernal'];
      expect(TemporalEngine.isEntityVisibleAt(infernal, 50)).toBe(false);
      expect(TemporalEngine.isEntityVisibleAt(infernal, 200)).toBe(true);
    });
  });
});
