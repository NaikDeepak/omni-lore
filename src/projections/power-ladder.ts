import { CanonicalLoreGraph, PowerStageEntity } from '../domain/types.js';
import { TemporalEngine } from '../engine/temporal-engine.js';

export interface PowerLadderTier {
  id: string;
  name: string;
  order: number;
  sub_level?: string;
  description: string;
  system_name: string;
  characters: Array<{
    id: string;
    displayName: string;
    avatar_url?: string;
    achieved_at_chapter: number;
  }>;
}

export interface PowerLadderProjection {
  seriesSlug: string;
  userChapter: number;
  system_name: string;
  tiers: PowerLadderTier[];
}

export function projectPowerLadder(
  graph: CanonicalLoreGraph, 
  userChapter: number
): PowerLadderProjection {
  const filtered = TemporalEngine.filterGraphAtChapter(graph, userChapter);

  // Extract all power stages defined in entities
  const powerStages = Object.values(filtered.entities)
    .filter((e): e is PowerStageEntity => e.type === 'power_stage')
    .sort((a, b) => a.order - b.order);

  const systemName = powerStages[0]?.system_name ?? 'Cultivation System';

  // Group characters into their active power stage fact at userChapter
  const tiers: PowerLadderTier[] = powerStages.map(stage => ({
    id: stage.id,
    name: stage.name,
    order: stage.order,
    sub_level: stage.sub_level,
    description: stage.description,
    system_name: stage.system_name,
    characters: [],
  }));

  const tierMap = new Map<string, PowerLadderTier>();
  tiers.forEach(t => tierMap.set(t.id, t));

  // Check each visible character's active power stage fact
  const characterEntities = Object.values(filtered.entities).filter(e => e.type === 'character');
  const allFacts = Object.values(graph.facts);

  for (const char of characterEntities) {
    const activeStageFact = TemporalEngine.getActiveFact<string>(
      char.id, 
      'power_stage', 
      allFacts, 
      userChapter
    );

    if (activeStageFact && tierMap.has(activeStageFact.value)) {
      const tier = tierMap.get(activeStageFact.value)!;
      tier.characters.push({
        id: char.id,
        displayName: filtered.displayNameMap[char.id] ?? char.name,
        avatar_url: (char as any).avatar_url,
        achieved_at_chapter: activeStageFact.temporal.valid_from,
      });
    }
  }

  return {
    seriesSlug: graph.series.slug,
    userChapter,
    system_name: systemName,
    tiers,
  };
}
