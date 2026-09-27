import { describe, expect, it } from 'vitest';
import { 
  projectCharacterJourney, 
  projectPowerLadder, 
  projectRelationshipWeb, 
  projectTimeline, 
  projectWorldMap 
} from '../src/projections';
import { coilingDragonFixture } from './fixtures/coiling-dragon.fixture';

describe('Projections Engine (Projections of Single Knowledge Graph)', () => {
  const graph = coilingDragonFixture;

  it('projects Power Ladder correctly filtered at Chapter 250', () => {
    const ladder = projectPowerLadder(graph, 250);

    expect(ladder.tiers.length).toBeGreaterThan(0);
    const saintTier = ladder.tiers.find(t => t.id === 'stage-saint');
    expect(saintTier).toBeDefined();

    // Linley is Saint at Chapter 250
    const linley = saintTier?.characters.find(c => c.id === 'linley-baruch');
    expect(linley).toBeDefined();

    // God tier must be empty at Ch 250
    const godTier = ladder.tiers.find(t => t.id === 'stage-god');
    expect(godTier?.characters.length).toBe(0);
  });

  it('projects Relationship Web with active edges at Chapter 50 vs Chapter 150', () => {
    // At Ch 50: Doehring mentorship is active
    const webAt50 = projectRelationshipWeb(graph, 50);
    const doehringRel50 = webAt50.edges.find(e => e.id === 'rel-doehring-master');
    expect(doehringRel50).toBeDefined();

    // At Ch 150: Doehring mentorship expired (Doehring sacrificed himself at Ch 120)
    const webAt150 = projectRelationshipWeb(graph, 150);
    const doehringRel150 = webAt150.edges.find(e => e.id === 'rel-doehring-master');
    expect(doehringRel150).toBeUndefined();
  });

  it('projects Timeline showing only events that occurred by userChapter', () => {
    // At Ch 50: Arc 1 is active, Breakthrough event at Ch 115 is hidden
    const timeline50 = projectTimeline(graph, 50);
    const allEvents50 = timeline50.arcs.flatMap(a => a.events);
    expect(allEvents50.find(e => e.id === 'event-breakthrough-saint')).toBeUndefined();

    // At Ch 150: Breakthrough event at Ch 115 is visible
    const timeline150 = projectTimeline(graph, 150);
    const allEvents150 = timeline150.arcs.flatMap(a => a.events);
    expect(allEvents150.find(e => e.id === 'event-breakthrough-saint')).toBeDefined();
  });

  it('projects World Map with discovered locations and planes', () => {
    const map50 = projectWorldMap(graph, 50);
    const yulan = map50.planes.find(p => p.id === 'plane-yulan');
    expect(yulan).toBeDefined();
    expect(yulan?.locations.some(l => l.id === 'loc-wushan')).toBe(true);

    // Infernal Realm plane not yet discovered at Ch 50
    const infernal50 = map50.planes.find(p => p.id === 'plane-infernal');
    expect(infernal50).toBeUndefined();
  });

  it('projects Character Journey combining milestones up to userChapter', () => {
    const journey = projectCharacterJourney('linley-baruch', graph, 250);
    expect(journey).not.toBeNull();
    expect(journey?.characterId).toBe('linley-baruch');

    // Milestones include: Mortal, Bebe companion, Breakthrough to Saint, Doehring mentor end
    const milestones = journey!.milestones;
    expect(milestones.some(m => m.type === 'power_breakthrough')).toBe(true);
    expect(milestones.some(m => m.type === 'relationship_formed')).toBe(true);

    // Should NOT include God breakthrough (which occurs at Ch 450)
    expect(milestones.some(m => m.title.includes('God'))).toBe(false);
  });
});
