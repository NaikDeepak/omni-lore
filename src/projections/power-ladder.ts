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
    if (s.includes('sovereign')) {
      return {
        criteria: 'Refining a Sovereign Spark of an Elemental Law or Edict, obtaining Sovereign Will and endless Sovereign Divine Power.',
        risk: 'Fatal; target of Chief Sovereign plots in the 10-trillion-year Planar Wars.',
        phenomena: 'Sovereign Will crushing planar dimensions; tears across cosmic planar fabric.',
      };
    }
    if (s.includes('grandmist') || s.includes('creator')) {
      return {
        criteria: 'Surviving a 4-way Soul Mutation across Earth, Water, Fire, and Wind; breaking through the cosmic universe into Grandmist Space.',
        risk: 'Cosmic extinction; 99.9999% soul obliteration during 4-way law mutation.',
        phenomena: 'Grandmist cosmic energy infusion; creation of personal pocket universes with customized laws.',
      };
    }
  }

  if (seriesSlug === 'solo-leveling') {
    if (s.includes('e-d-rank') || s.includes('e-rank') || s.includes('d-rank')) {
      return {
        criteria: 'Initial awakening with modest mana density; assigned to clear low-threat E/D-Rank Gates.',
        risk: 'Fatal against beasts and dungeon bosses without careful strike squad coordination.',
        phenomena: 'Barely discernible faint mana pulse, minor physical attribute amplification.',
      };
    }
    if (s.includes('c-b-rank') || s.includes('c-rank') || s.includes('b-rank')) {
      return {
        criteria: 'Solid mana core awakening; serving as raid captains or assault vanguards in mid-tier guild raids.',
        risk: 'High; dungeon breaks, red gates, and mutated boss monsters pose lethal danger.',
        phenomena: 'Visible elemental weapon coating, mana shield barrier projections.',
      };
    }
    if (s.includes('a-rank')) {
      return {
        criteria: 'Elite awakeners possessing immense mana reserves; capable of leading high-difficulty Red Gate incursions.',
        risk: 'Critical; catastrophic dungeon breaks require multi-guild S-Rank emergency interventions.',
        phenomena: 'Luminous blue mana aura radiating into surrounding air, wide-area magical artillery fire.',
      };
    }
    if (s.includes('s-rank')) {
      return {
        criteria: 'Mana density exceeding standard measurement instruments (unmeasurable); treated as national defense pillars.',
        risk: 'Disaster level; solitary engagement against catastrophic gate bosses.',
        phenomena: 'Atmospheric pressure distortion, sonic shockwaves, blinding mana vortex flares.',
      };
    }
    if (s.includes('national-level')) {
      return {
        criteria: 'Vessels blessed with the divine authority of the Rulers; conquerors of S-Rank calamity gates.',
        risk: 'Planetary calamity; direct targets of Sovereign Monarch assassination plots.',
        phenomena: 'Psychokinesis (Ruler\'s Authority), towering astral spiritual armor manifestation.',
      };
    }
    if (s.includes('monarch') || s.includes('ruler')) {
      return {
        criteria: 'Primordial cosmic sovereigns born of absolute darkness or radiant light; masters of life, death, and annihilation.',
        risk: 'Extinction event; total dimension collapse and eradication of planetary civilizations.',
        phenomena: 'Monarch\'s Domain expanding into an abyss, Arise resurrection of hundreds of thousands of shadow soldiers.',
      };
    }
  }

  if (seriesSlug === 'lord-of-the-mysteries') {
    if (s.includes('low-sequence')) {
      return {
        criteria: 'Ingesting the initial Beyonder potion concoction and opening the Sea of Collective Subconscious / Spirit Vision.',
        risk: 'Acute mental instability, phantom murmurs from the cosmos, rapid loss of control into mutated abominations.',
        phenomena: 'Flickering Spirit Vision, subtle tarot card resonance, perception of ethereal spirit threads.',
      };
    }
    if (s.includes('mid-sequence')) {
      return {
        criteria: 'Mastering core pathway abilities and digesting the potion through strict, disciplined adherence to the Acting Method.',
        risk: 'High; psychological fragmentation and spiritual corruption if actions deviate from potion principles.',
        phenomena: 'Manifestation of visible spell circles, spirit pact summonings, elemental and physical metamorphism.',
      };
    }
    if (s.includes('senior-sequence')) {
      return {
        criteria: 'Ingesting Sequence 5 concoctions forged from rare mythical beast ingredients at the pinnacle of mortal sequences.',
        risk: 'Severe; requires rigorous occult rituals aligned with celestial bodies to prevent instantaneous soul collapse.',
        phenomena: 'Marionette soul thread manipulation, ethereal flight, localized spatial illusion shifts.',
      };
    }
    if (s.includes('demigod-saint')) {
      return {
        criteria: 'Qualitative divine metamorphosis; completing divine ascension rituals and bearing the incomplete Mythical Creature Form.',
        risk: 'Lethal; ordinary beings gaze upon the true form and immediately collapse into madness or horrific abominations.',
        phenomena: 'Historical void projections, spatial door traversal, conceptual law distortions spanning entire cities.',
      };
    }
    if (s.includes('angel-archangel')) {
      return {
        criteria: 'Absorbing Archangel characteristics, establishing anchor networks of faithful worshippers, holding King of Angels authority.',
        risk: 'Existential crisis; relentless mental struggle against the awakening consciousness of the Original Creator.',
        phenomena: 'Miracle invocation, temporal theft of thoughts and destiny, fate loops, dimensional spirit storms.',
      };
    }
    if (s.includes('true-deity')) {
      return {
        criteria: 'Assimilating the complete Uniqueness and all Sequence 1 characteristics through world-shaking apotheosis rituals.',
        risk: 'Cosmic madness; constant anchor reinforcement required to defend sanity against the Oldest One.',
        phenomena: 'Cosmic conceptual authority, Divine Kingdom descent, unilateral alteration of physical and metaphysical reality.',
      };
    }
    if (s.includes('above-sequence') || s.includes('lord-of-mysteries')) {
      return {
        criteria: 'Accommodating the corresponding Sefirah (e.g. Sefirah Castle) and neighboring pathway Uniquenesses to ascend as a Great Old One.',
        risk: 'Apocalyptic; eternal slumber to suppress the primordial Celestial Worthy of Heaven and Earth.',
        phenomena: 'Pillar of the Universe; absolute mastery over time, space, history, grafting, and the fog of mysteries.',
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
