import { CanonicalLoreGraph, PowerStageEntity } from '../domain/types';
import { TemporalEngine } from '../engine/temporal-engine';

export interface PowerLadderTier {
  id: string;
  name: string;
  order: number;
  sub_level?: string;
  description: string;
  system_name: string;
  breakthrough_criteria?: string;
  mortality_risk?: string;
  canonical_phenomena?: string;
  characters: Array<{
    id: string;
    displayName: string;
    avatar_url?: string;
    achieved_at_chapter: number;
    isRecentBreakthrough?: boolean;
  }>;
}

export interface PowerLadderProjection {
  seriesSlug: string;
  userChapter: number;
  system_name: string;
  tiers: PowerLadderTier[];
}

function getTierLoreManual(stageId: string, seriesSlug: string) {
  const s = stageId.toLowerCase();

  if (seriesSlug === 'one-piece') {
    if (s.includes('rookie')) {
      return {
        criteria: 'Bounties under 50,000,000 Berries; fundamental mastery of a Devil Fruit or standard swordsmanship in the Blues.',
        risk: 'Low to moderate; mortality risk from Grand Line storms and Sea Kings.',
        phenomena: 'Basic Armament hardening and Devil Fruit power manifestation.',
      };
    }
    if (s.includes('supernova')) {
      return {
        criteria: 'Bounties exceeding 100,000,000 Berries arriving at Sabaody Archipelago; survival of Paradise half of the Grand Line.',
        risk: 'High; direct confrontation with Pacifistas, Admirals, and World Nobles.',
        phenomena: 'Awakening of Gear transformations, Advanced Armament emission precursors.',
      };
    }
    if (s.includes('commander')) {
      return {
        criteria: 'Official appointment as Seven Warlord of the Sea or Top Division Commander of an Emperor crew.',
        risk: 'Very High; high-level New World territorial warfare and Buster Calls.',
        phenomena: 'Advanced Observation Future Sight, complete Awakened Devil Fruit mastery.',
      };
    }
    if (s.includes('emperor') || s.includes('admiral')) {
      return {
        criteria: 'Absolute sea hegemony with vast territorial fleets or supreme command of Marine Headquarters.',
        risk: 'Extreme; catastrophic casualties capable of shattering global balance.',
        phenomena: 'Conqueror’s Haki Infusion (Haoshoku Coating) splitting the heavens and skies in two.',
      };
    }
    if (s.includes('king') || s.includes('legend')) {
      return {
        criteria: 'Conquering the Grand Line, reaching Laugh Tale, learning Void Century history and claiming the One Piece.',
        risk: 'Fatal / All-out war against the World Government Supreme Elders.',
        phenomena: 'Joy Boy / Sun God Nika liberation drumbeats, Voice of All Things mastery.',
      };
    }
  }

  if (seriesSlug === 'demonic-emperor') {
    if (s.includes('bone-tempering')) {
      return {
        criteria: 'Shattering and reforming bone marrow with condensed Yuan Qi; forging copper skin and iron bones.',
        risk: 'Moderate; unbearable agony during marrow restructuring.',
        phenomena: 'Golden-copper skin hue, bone marrow resonance under impact.',
      };
    }
    if (s.includes('tianxuan') || s.includes('heaven-profound')) {
      return {
        criteria: 'Condensing Yuan Qi into physical flight wings; opening the Heavenly Celestial meridian.',
        risk: 'High; falling from great altitudes upon Qi exhaustion.',
        phenomena: 'Profound Wings unfolding with supersonic aerial combat maneuvers.',
      };
    }
    if (s.includes('radiant') || s.includes('shenzhao')) {
      return {
        criteria: 'Awakening the Divine Consciousness (Divine Sense) within the sea of consciousness.',
        risk: 'Severe; soul collapse if attacked by mental illusions during seclusion.',
        phenomena: 'Omniscient mental perception across 100 miles, invisible soul blades.',
      };
    }
    if (s.includes('ethereal')) {
      return {
        criteria: 'Detaching the spiritual soul from the physical shell; refining an incorporeal soul avatar.',
        risk: 'Near-fatal; physical vessel vulnerability during soul projection.',
        phenomena: 'Intangible soul apparition walking through solid obstacles.',
      };
    }
    if (s.includes('soul-harmony') || s.includes('transforming-heaven')) {
      return {
        criteria: 'Merging heaven and earth dragon veins into the soul avatar.',
        risk: 'Extreme; spiritual incineration by heavenly dragon fire.',
        phenomena: 'Dragon roars resounding across continental mountain ranges.',
      };
    }
    if (s.includes('genesis') || s.includes('saint') || s.includes('emperor')) {
      return {
        criteria: 'Assimilating the complete Sovereign Dao and Nine Nether Secret Scriptures.',
        risk: 'Cosmic tribulation; obliteration by heavenly dao lightning.',
        phenomena: 'Infinite black void domains, swallowing all light and matter.',
      };
    }
  }

  if (seriesSlug === 'coiling-dragon') {
    if (s.includes('mortal')) {
      return {
        criteria: 'Cultivating internal Battle Qi or meditating on magical element resonances up to the 9th rank.',
        risk: 'Low; lifespan capped at normal human limits (approx 100-500 years).',
        phenomena: 'Elemental Battle Qi blade aura, grand magus incantations.',
      };
    }
    if (s.includes('saint')) {
      return {
        criteria: 'Comprehending fundamental boundaries of Elemental Laws; lifespan cap removed permanently.',
        risk: 'High; life-and-death epiphany; soul crystallizes.',
        phenomena: 'Saint Domain spatial lockdown, effortless supersonic flight without wings.',
      };
    }
    if (s.includes('god') && !s.includes('highgod')) {
      return {
        criteria: 'Complete fusion and mastery of at least one Profound Mystery; triggering Laws of Heaven and Earth.',
        risk: 'Soul extinction; choosing between divine body clone or soul godhead fusion.',
        phenomena: 'Descent of Laws of Heaven and Earth, condensation of Divine Spark.',
      };
    }
    if (s.includes('highgod')) {
      return {
        criteria: 'Complete mastery of every profound mystery of an Elemental Law (e.g. all 6 Earth or Fire mysteries).',
        risk: 'Extreme; requires millions of years of soul meditation or slaughter in the Infernal Realm.',
        phenomena: 'Highgod Domain suppression, Asura-grade dimensional spatial tears.',
      };
    }
  }

  return {
    criteria: 'Rigorous canonical training, epiphanies, and trial by combat.',
    risk: 'Moderate to high mortality under intense conflict.',
    phenomena: 'Intense aura flares and power resonance.',
  };
}

export function projectPowerLadder(
  graph: CanonicalLoreGraph, 
  userChapter: number
): PowerLadderProjection {
  const filtered = TemporalEngine.filterGraphAtChapter(graph, userChapter);

  const powerStages = Object.values(filtered.entities)
    .filter((e): e is PowerStageEntity => e.type === 'power_stage')
    .sort((a, b) => a.order - b.order);

  const systemName = powerStages[0]?.system_name ?? 'Cultivation System';

  const tiers: PowerLadderTier[] = powerStages.map(stage => {
    const manual = getTierLoreManual(stage.id, graph.series.slug);
    return {
      id: stage.id,
      name: stage.name,
      order: stage.order,
      sub_level: stage.sub_level,
      description: stage.description,
      system_name: stage.system_name,
      breakthrough_criteria: manual.criteria,
      mortality_risk: manual.risk,
      canonical_phenomena: manual.phenomena,
      characters: [],
    };
  });

  const tierMap = new Map<string, PowerLadderTier>();
  tiers.forEach(t => tierMap.set(t.id, t));

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
      const isRecentBreakthrough = Math.abs(userChapter - activeStageFact.temporal.valid_from) <= 30;
      tier.characters.push({
        id: char.id,
        displayName: filtered.displayNameMap[char.id] ?? char.name,
        avatar_url: (char as any).avatar_url,
        achieved_at_chapter: activeStageFact.temporal.valid_from,
        isRecentBreakthrough,
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
