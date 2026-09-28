import { getUniverseGraph } from './embedded-data';
import { 
  TemporalSnapshot, 
  SnapshotCharacter, 
  SnapshotTier, 
  SnapshotRelationship, 
  SnapshotMilestone, 
  ShieldLevel,
  MiniDuelResult
} from '../shared/types';

export class ExtensionTemporalClient {
  static getSnapshot(seriesSlug: string, chapter: number, shieldLevel: ShieldLevel = 'SAFE'): TemporalSnapshot {
    const graph = getUniverseGraph(seriesSlug);
    if (!graph) {
      return {
        seriesSlug,
        seriesTitle: seriesSlug,
        chapter,
        totalChapters: 1000,
        shieldLevel,
        characters: [],
        powerTiers: [],
        relationships: [],
        milestones: [],
        unrevealedCount: 0
      };
    }

    const totalChapters = graph.series?.total_chapters ?? 1000;
    const effectiveChapter = shieldLevel === 'FULL' ? totalChapters : chapter;

    const allEntities = Object.values(graph.entities || {}) as any[];
    const allFacts = Object.values(graph.facts || {}) as any[];
    const allRelationships = Object.values(graph.relationships || {}) as any[];

    // 1. Resolve Power Stages
    const powerStages = allEntities
      .filter((e) => e.type === 'power_stage')
      .sort((a, b) => a.order - b.order);

    const stageMap = new Map<string, any>();
    powerStages.forEach((s) => stageMap.set(s.id, s));

    // 2. Resolve Characters
    const rawChars = allEntities.filter((e) => e.type === 'character');
    const knownChars = rawChars.filter((c) => {
      if (shieldLevel === 'FULL') return true;
      const debut = typeof c.first_appearance === 'number' ? c.first_appearance : (c.revealed_at ?? 1);
      return debut <= effectiveChapter;
    });
    const unrevealedCount = rawChars.length - knownChars.length;

    const characters: SnapshotCharacter[] = knownChars.map((c) => {
      // Find active power_stage fact
      const stageFacts = allFacts.filter((f) => {
        const from = f.temporal?.valid_from ?? f.valid_from ?? 1;
        const to = f.temporal?.valid_to ?? f.valid_to;
        const eId = f.entity_id ?? f.subject_id;
        return eId === c.id && (f.predicate === 'power_stage' || f.predicate === 'stage') &&
          from <= effectiveChapter && (to === null || to === undefined || to > effectiveChapter);
      });
      const activeStageFact = stageFacts.sort((a, b) => {
        const fromA = a.temporal?.valid_from ?? a.valid_from ?? 1;
        const fromB = b.temporal?.valid_from ?? b.valid_from ?? 1;
        return fromB - fromA;
      })[0];
      const stageEntity = activeStageFact ? stageMap.get(activeStageFact.value) : null;

      // Faction fact
      const factionFacts = allFacts.filter((f) => {
        const from = f.temporal?.valid_from ?? f.valid_from ?? 1;
        const to = f.temporal?.valid_to ?? f.valid_to;
        const eId = f.entity_id ?? f.subject_id;
        return eId === c.id && f.predicate === 'faction' &&
          from <= effectiveChapter && (to === null || to === undefined || to > effectiveChapter);
      });
      const activeFactionFact = factionFacts.sort((a, b) => {
        const fromA = a.temporal?.valid_from ?? a.valid_from ?? 1;
        const fromB = b.temporal?.valid_from ?? b.valid_from ?? 1;
        return fromB - fromA;
      })[0];
      const factionEntity = activeFactionFact ? graph.entities[activeFactionFact.value] : null;

      // Location fact
      const locFacts = allFacts.filter((f) => {
        const from = f.temporal?.valid_from ?? f.valid_from ?? 1;
        const to = f.temporal?.valid_to ?? f.valid_to;
        const eId = f.entity_id ?? f.subject_id;
        return eId === c.id && f.predicate === 'location' &&
          from <= effectiveChapter && (to === null || to === undefined || to > effectiveChapter);
      });
      const activeLocFact = locFacts.sort((a, b) => {
        const fromA = a.temporal?.valid_from ?? a.valid_from ?? 1;
        const fromB = b.temporal?.valid_from ?? b.valid_from ?? 1;
        return fromB - fromA;
      })[0];
      const locEntity = activeLocFact ? graph.entities[activeLocFact.value] : null;

      // Status fact
      const statusFacts = allFacts.filter((f) => {
        const from = f.temporal?.valid_from ?? f.valid_from ?? 1;
        const to = f.temporal?.valid_to ?? f.valid_to;
        const eId = f.entity_id ?? f.subject_id;
        return eId === c.id && f.predicate === 'status' &&
          from <= effectiveChapter && (to === null || to === undefined || to > effectiveChapter);
      });
      const activeStatusFact = statusFacts.sort((a, b) => {
        const fromA = a.temporal?.valid_from ?? a.valid_from ?? 1;
        const fromB = b.temporal?.valid_from ?? b.valid_from ?? 1;
        return fromB - fromA;
      })[0];

      // Identity Masking check
      let isMasked = false;
      let displayName = c.name;

      if (shieldLevel !== 'FULL' && c.reveals && Array.isArray(c.reveals)) {
        const sortedReveals = [...c.reveals].sort((a: any, b: any) => a.revealed_at - b.revealed_at);
        for (const rev of sortedReveals) {
          if (effectiveChapter < rev.revealed_at) {
            isMasked = true;
            displayName = rev.masked_name ?? (c.aliases?.[0] ?? '[UNKNOWN ENIGMA]');
            break;
          }
        }
      }

      const realmOrder = stageEntity?.order ?? 1;
      const powerScore = Math.min(100, Math.round(15 + realmOrder * 12 + (c.id === 'luffy' || c.id === 'linley-baruch' || c.id === 'sung-jin-woo' ? 10 : 0)));

      return {
        id: c.id,
        name: c.name,
        displayName,
        isMasked,
        realmName: stageEntity?.name ?? 'Mortal / Initial Realm',
        realmOrder,
        factionName: factionEntity?.name ?? 'Unaffiliated',
        locationName: locEntity?.name ?? 'Known Realm',
        status: activeStatusFact?.value ?? 'Alive',
        firstAppearance: c.first_appearance ?? 1,
        avatarUrl: c.avatar_url,
        aliases: c.aliases ?? [],
        powerScore
      };
    });

    // 3. Power Tiers
    const powerTiers: SnapshotTier[] = powerStages.map((s) => {
      const occupants = characters.filter((c) => c.realmOrder === s.order);
      return {
        id: s.id,
        order: s.order,
        name: s.name,
        description: s.description,
        characters: occupants
      };
    }).reverse(); // Highest tier first

    // 4. Relationships
    const activeRelRecords = allRelationships.filter((r) => {
      const from = r.temporal?.valid_from ?? r.valid_from ?? 1;
      const to = r.temporal?.valid_to ?? r.valid_to;
      return from <= effectiveChapter && (to === null || to === undefined || to > effectiveChapter);
    });

    const relationships: SnapshotRelationship[] = activeRelRecords.map((r) => {
      const source = characters.find((c) => c.id === (r.source_id ?? r.sourceId));
      const target = characters.find((c) => c.id === (r.target_id ?? r.targetId));
      return {
        id: r.id,
        sourceId: r.source_id ?? r.sourceId,
        targetId: r.target_id ?? r.targetId,
        sourceName: source?.displayName ?? r.source_id,
        targetName: target?.displayName ?? r.target_id,
        type: r.relation_type ?? r.type ?? 'ally',
        label: r.label ?? r.relation_type ?? r.type ?? 'Ally',
        category: categorizeRelation(r.relation_type ?? r.type ?? '') as any,
        description: r.description ?? `${r.source_id} has ties with ${r.target_id}`
      };
    });

    // 5. Milestones & Historical Events
    const eventEntities = allEntities.filter((e) => {
      if (e.type !== 'event') return false;
      const ch = e.chapter ?? e.revealed_at ?? 1;
      return shieldLevel === 'FULL' || ch <= effectiveChapter;
    });

    const milestones: SnapshotMilestone[] = eventEntities.map((ev) => ({
      id: ev.id,
      title: ev.title ?? ev.name,
      chapter: ev.chapter ?? ev.revealed_at ?? 1,
      description: ev.description ?? 'Canonical story milestone recorded.',
      eventType: ev.event_type ?? 'lore',
      category: ev.event_type ?? 'lore',
      involvedCharacters: ev.involved_characters ?? []
    })).sort((a, b) => b.chapter - a.chapter);

    return {
      seriesSlug,
      seriesTitle: graph.series?.title ?? seriesSlug,
      chapter,
      totalChapters,
      shieldLevel,
      characters,
      powerTiers,
      relationships,
      milestones,
      unrevealedCount
    };
  }

  static searchCharacter(seriesSlug: string, query: string, chapter: number, shieldLevel: ShieldLevel = 'SAFE'): SnapshotCharacter | null {
    const snapshot = this.getSnapshot(seriesSlug, chapter, shieldLevel);
    const q = query.toLowerCase().trim();
    if (!q) return null;

    return snapshot.characters.find((c) =>
      c.name.toLowerCase().includes(q) ||
      c.displayName.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.aliases.some((a) => a.toLowerCase().includes(q))
    ) ?? null;
  }

  static findCharacter(seriesSlug: string, query: string, chapter: number): SnapshotCharacter | null {
    return this.searchCharacter(seriesSlug, query, chapter, 'SAFE');
  }

  static runMiniDuel(seriesSlug: string, fighterAId: string, fighterBId: string, chapter: number): MiniDuelResult {
    const snapshot = this.getSnapshot(seriesSlug, chapter, 'SAFE');
    const fighterA = snapshot.characters.find(c => c.id === fighterAId) ?? snapshot.characters[0];
    const fighterB = snapshot.characters.find(c => c.id === fighterBId) ?? snapshot.characters[1] ?? snapshot.characters[0];

    const statA = fighterA.powerScore * (1 + (fighterA.realmOrder * 0.15));
    const statB = fighterB.powerScore * (1 + (fighterB.realmOrder * 0.15));

    const rounds = [
      {
        roundNumber: 1,
        attackerName: fighterA.displayName,
        actionDescription: `opens combat manifesting ${fighterA.realmName} domain pressure!`,
        damage: Math.round(statA * 0.4)
      },
      {
        roundNumber: 2,
        attackerName: fighterB.displayName,
        actionDescription: `counters with ${fighterB.factionName} battle art strike!`,
        damage: Math.round(statB * 0.4)
      },
      {
        roundNumber: 3,
        attackerName: statA >= statB ? fighterA.displayName : fighterB.displayName,
        actionDescription: `delivers a decisive canonical clash at Chapter ${chapter} power parity!`,
        damage: Math.round(Math.max(statA, statB) * 0.7)
      }
    ];

    const winner = statA >= statB ? fighterA : fighterB;
    const verdict = `${winner.displayName} triumphs at Chapter ${chapter} temporal parity (${winner.realmName}).`;

    return {
      fighterA,
      fighterB,
      winner,
      chapter,
      rounds,
      verdict,
      disclaimer: 'Simulation — not canon. Parity calculated based strictly on Chapter ' + chapter + ' achievements.'
    };
  }
}

function categorizeRelation(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('master') || t.includes('teacher')) return 'master';
  if (t.includes('disciple') || t.includes('student')) return 'disciple';
  if (t.includes('rival') || t.includes('enemy') || t.includes('nemesis')) return 'rival';
  if (t.includes('family') || t.includes('father') || t.includes('brother') || t.includes('sister')) return 'family';
  return 'ally';
}
