import { CanonicalLoreGraph, CharacterEntity } from '../domain/types';
import { TemporalEngine } from './temporal-engine';

export interface DuelPreset {
  id: string;
  title: string;
  chapter: number;
  fighterA: string;
  fighterB: string;
  synopsis: string;
}

export interface DuelFighter {
  id: string;
  name: string;
  avatarUrl?: string;
  stageName: string;
  stageRank: number;
  factionName?: string;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  hpLog: number[];
}

export interface DuelRound {
  roundNumber: number;
  attackerId: string;
  defenderId: string;
  techniqueName: string;
  damage: number;
  isCritical: boolean;
  narrative: string;
  attackerHpAfter: number;
  defenderHpAfter: number;
}

export interface DuelResult {
  fighterA: DuelFighter;
  fighterB: DuelFighter;
  fighterAAdvantage: number;
  fighterBAdvantage: number;
  winnerId: string;
  loserId: string;
  isDraw: boolean;
  decisiveTechnique: string;
  summary: string;
  rounds: DuelRound[];
}

// Preset showdowns per universe
export function getCanonPresets(seriesSlug: string): DuelPreset[] {
  if (seriesSlug === 'one-piece') {
    return [
      {
        id: 'op-luffy-arlong',
        title: 'Showdown at Arlong Park',
        chapter: 90,
        fighterA: 'luffy',
        fighterB: 'arlong',
        synopsis: 'Luffy storms Arlong Park to shatter Nami’s chains and crush the saw-shark tyrant.',
      },
      {
        id: 'op-zoro-mihawk',
        title: 'Baratie: The Distant Pinnacle',
        chapter: 50,
        fighterA: 'zoro',
        fighterB: 'mihawk',
        synopsis: 'Rookie Zoro challenges the World’s Greatest Swordsman to test the gap in their swordsmanship.',
      },
      {
        id: 'op-luffy-crocodile',
        title: 'Alubarna Tomb: Blood vs Sand',
        chapter: 200,
        fighterA: 'luffy',
        fighterB: 'crocodile',
        synopsis: 'Luffy uses blood to strike Crocodile and liberate the Arabasta Kingdom.',
      },
      {
        id: 'op-luffy-lucci',
        title: 'Tower of Law: Gear 2nd vs Rokuogan',
        chapter: 420,
        fighterA: 'luffy',
        fighterB: 'lucci',
        synopsis: 'Luffy pushes his life to the limit with Gear 2nd to liberate Nico Robin from CP9.',
      },
      {
        id: 'op-whitebeard-akainu',
        title: 'Marineford: The Strongest Man’s Fury',
        chapter: 570,
        fighterA: 'whitebeard',
        fighterB: 'akainu',
        synopsis: 'An enraged Whitebeard unleashes quakes that split Marineford in two against Admiral Akainu.',
      },
      {
        id: 'op-luffy-katakuri',
        title: 'Mirror World: Advanced Observation Clash',
        chapter: 880,
        fighterA: 'luffy',
        fighterB: 'katakuri',
        synopsis: 'Luffy tests Future Sight against the undefeated Sweet Commander Katakuri in the Mirro-World.',
      },
      {
        id: 'op-luffy-saturn',
        title: 'Egghead Incident: Sun God Nika vs Saint Saturn',
        chapter: 1108,
        fighterA: 'luffy',
        fighterB: 'gorosei-saturn',
        synopsis: 'Emperor Luffy in Gear 5 Sun God Nika form clashes with the monstrous Gyuki spider-demon elder Jaygarcia Saturn and Admiral Kizaru on Future Island.',
      },
      {
        id: 'op-zoro-nusjuro',
        title: 'Labophase Gate: Kitetsu Cursed Blade Clash',
        chapter: 1117,
        fighterA: 'zoro',
        fighterB: 'gorosei-nusjuro',
        synopsis: 'Zoro intercepts Saint Ethanbaron V. Nusjuro’s demonic Bakotsu skeletal centaur charge to halt the destruction of the Thousand Sunny.',
      },
    ];
  }

  if (seriesSlug === 'demonic-emperor') {
    return [
      {
        id: 'de-zhuo-hellvalley',
        title: 'Vengeance Against Hell Valley',
        chapter: 140,
        fighterA: 'zhuo-fan',
        fighterB: 'you-guiqi',
        synopsis: 'Zhuo Fan executes You Guiqi with brilliant schemes and blood infant mastery.',
      },
      {
        id: 'de-zhuo-huangpu',
        title: 'Esoteric Debate Peak Duel',
        chapter: 315,
        fighterA: 'zhuo-fan',
        fighterB: 'huangpu-qingtian',
        synopsis: 'Zhuo Fan unleashes all demonic trump cards to crush the monstrous Heaven-Shaking Dragon.',
      },
      {
        id: 'de-zhuo-yelin',
        title: 'Double Dragon Gathering Final',
        chapter: 680,
        fighterA: 'zhuo-fan',
        fighterB: 'ye-lin',
        synopsis: 'Sacred Beast inheritors clash: Qilin Transformation vs Golden Dragon Heavenly Fire.',
      },
    ];
  }

  if (seriesSlug === 'solo-leveling') {
    return [
      {
        id: 'sl-jinwoo-igris',
        title: 'Job Change Quest: The Red Knight',
        chapter: 45,
        fighterA: 'sung-jin-woo',
        fighterB: 'igris',
        synopsis: 'Jin-woo engages in life-or-death barehanded struggle against Blood-Red Commander Igris to complete the Necromancer class quest.',
      },
      {
        id: 'sl-jinwoo-beru',
        title: 'Jeju Island: King of the Ant Swarm',
        chapter: 102,
        fighterA: 'sung-jin-woo',
        fighterB: 'beru',
        synopsis: 'The Shadow Monarch descends via Shadow Exchange onto Jeju Island to avenge the S-Rank raid squad against the monstrous Ant King.',
      },
      {
        id: 'sl-jinwoo-thomas',
        title: 'Scavenger Clash: Goliath vs Monarch',
        chapter: 146,
        fighterA: 'sung-jin-woo',
        fighterB: 'thomas-andre',
        synopsis: 'National Level Hunter Thomas Andre confronts Jin-woo with the full might of the Scavenger Guild in an abandoned warehouse.',
      },
      {
        id: 'sl-jinwoo-antares',
        title: 'Apocalypse: Dragon King vs Shadow Monarch',
        chapter: 175,
        fighterA: 'sung-jin-woo',
        fighterB: 'antares',
        synopsis: 'The fate of Earth hangs in the balance as the Monarch of Destruction clashes with the True Shadow Monarch.',
      },
    ];
  }

  if (seriesSlug === 'lord-of-the-mysteries') {
    return [
      {
        id: 'lotm-klein-ince',
        title: 'Vengeance for Captain Dunn Smith',
        chapter: 940,
        fighterA: 'klein-moretti',
        fighterB: 'in-zangwill',
        synopsis: 'Gehrman Sparrow and Leonard Mitchell unleash divine retribution with Azik Eggers against the traitorous bearer of 0-08.',
      },
      {
        id: 'lotm-klein-amon',
        title: 'Fool’s Apotheosis: Battle of Wits and Time',
        chapter: 1380,
        fighterA: 'klein-moretti',
        fighterB: 'amon',
        synopsis: 'The ultimate battle for the Lord of the Mysteries position inside Sefirah Castle; grafting supernova destruction against destiny theft.',
      },
      {
        id: 'lotm-klein-zaratul',
        title: 'Miracle Invoker Historical Projection War',
        chapter: 1340,
        fighterA: 'klein-moretti',
        fighterB: 'roselle-gustav',
        synopsis: 'Miracle Invoker Klein summons historical projections of angels and demigods in foggy Backlund to break the Secret Order encirclement.',
      },
      {
        id: 'lotm-audrey-adam',
        title: 'Spectator Pathway: Mind Confrontation',
        chapter: 1320,
        fighterA: 'audrey-hall',
        fighterB: 'adam',
        synopsis: 'Miss Justice matches psychological manipulation and collective subconscious placation against the divine Author Adam.',
      },
    ];
  }

  return [
    {
      id: 'cd-linley-clayde',
      title: 'Vengeance for Father Hogg',
      chapter: 120,
      fighterA: 'linley-baruch',
      fighterB: 'clayde',
      synopsis: 'Linley undergoes Dragonblood transformation in Fenlai City to avenge his father.',
    },
    {
      id: 'cd-linley-olivier',
      title: 'Duel of Yulan Continental Geniuses',
      chapter: 180,
      fighterA: 'linley-baruch',
      fighterB: 'olivier',
      synopsis: 'Profound Truths of Earth vs Soul-Severing Sword of Light and Darkness at Channe City.',
    },
    {
      id: 'cd-linley-heidens',
      title: 'Fall of the Holy Union',
      chapter: 280,
      fighterA: 'linley-baruch',
      fighterB: 'heidens',
      synopsis: 'Deity Linley leads the Baruch army to shatter Holy Emperor Heidens and the Radiant Church.',
    },
    {
      id: 'cd-linley-augusta',
      title: 'Decisive Battle of the Sovereigns',
      chapter: 830,
      fighterA: 'linley-baruch',
      fighterB: 'augusta',
      synopsis: 'Four-way Soul Mutate Sovereign Linley battles Chief Sovereign of Light Augusta wielding Overgod artifacts across the planar skies.',
    },
  ];
}

// Map stage names or IDs to numeric power ranks (1 to 10)
function resolvePowerRank(stageId: string | undefined, seriesSlug: string): { rank: number; name: string } {
  if (!stageId) {
    return { rank: 1, name: seriesSlug === 'one-piece' ? 'East Blue Rookie' : 'Mortal / Novice' };
  }

  const s = stageId.toLowerCase();

  // One Piece tiers
  if (s.includes('rookie')) return { rank: 2, name: 'East Blue Rookie' };
  if (s.includes('supernova')) return { rank: 4, name: 'Worst Generation Supernova' };
  if (s.includes('commander')) return { rank: 6, name: 'Warlord / Commander' };
  if (s.includes('emperor') || s.includes('admiral')) return { rank: 8, name: 'Emperor / Marine Admiral' };
  if (s.includes('king') || s.includes('legend')) return { rank: 10, name: 'Pirate King Legend' };

  // Demonic Emperor realms
  if (s.includes('qi-gathering') || s.includes('foundation')) return { rank: 1, name: 'Foundation / Qi Gathering' };
  if (s.includes('qi-condensation')) return { rank: 2, name: 'Qi Condensation Realm' };
  if (s.includes('bone-tempering')) return { rank: 3, name: 'Bone Tempering Realm' };
  if (s.includes('tianxuan') || s.includes('heaven-profound')) return { rank: 4, name: 'Tianxuan Realm' };
  if (s.includes('radiant') || s.includes('shenzhao')) return { rank: 5, name: 'Radiant Stage (Shenzhao)' };
  if (s.includes('ethereal')) return { rank: 6, name: 'Ethereal Stage' };
  if (s.includes('soul-harmony')) return { rank: 7, name: 'Soul Harmony Stage' };
  if (s.includes('transforming-heaven')) return { rank: 8, name: 'Transforming Heaven Stage' };
  if (s.includes('genesis')) return { rank: 9, name: 'Genesis Stage' };
  if (s.includes('saint') || s.includes('emperor')) return { rank: 10, name: 'Demonic Sovereign / Emperor' };

  // Coiling Dragon stages
  if (s.includes('mortal')) return { rank: 2, name: 'Mortal Rank (1st-9th)' };
  if (s.includes('saint')) return { rank: 5, name: 'Saint Rank' };
  if (s.includes('highgod')) return { rank: 8, name: 'Highgod Asura' };
  if (s.includes('god')) return { rank: 7, name: 'Demigod / Full God' };
  if (s.includes('sovereign')) return { rank: 9, name: 'Sovereign of the Universe' };
  if (s.includes('grandmist') || s.includes('creator')) return { rank: 10, name: 'Grandmist Controller' };

  // Solo Leveling ranks
  if (s.includes('e-d-rank') || s.includes('e-rank') || s.includes('d-rank')) return { rank: 2, name: 'E / D-Rank Hunter' };
  if (s.includes('c-b-rank') || s.includes('c-rank') || s.includes('b-rank')) return { rank: 4, name: 'C / B-Rank Hunter' };
  if (s.includes('a-rank')) return { rank: 6, name: 'A-Rank Elite Hunter' };
  if (s.includes('s-rank')) return { rank: 8, name: 'S-Rank National Asset' };
  if (s.includes('national-level')) return { rank: 9, name: 'National Level Hunter' };
  if (s.includes('monarch') || s.includes('ruler')) return { rank: 10, name: 'Monarch / Ruler Sovereign' };

  // Lord of the Mysteries sequences
  if (s.includes('low-sequence')) return { rank: 2, name: 'Low-Sequence Beyonder (Seq 9-8)' };
  if (s.includes('mid-sequence')) return { rank: 4, name: 'Mid-Sequence Beyonder (Seq 7-6)' };
  if (s.includes('senior-sequence')) return { rank: 6, name: 'Senior Sequence (Seq 5)' };
  if (s.includes('demigod-saint')) return { rank: 8, name: 'Demigod Saint (Seq 4-3)' };
  if (s.includes('angel-archangel')) return { rank: 9, name: 'Angel / Ground Deity (Seq 2-1)' };
  if (s.includes('true-deity')) return { rank: 10, name: 'True Deity (Seq 0)' };
  if (s.includes('above-sequence') || s.includes('lord-of-mysteries')) return { rank: 10, name: 'Pillar / Great Old One' };

  return { rank: 3, name: stageId.replace(/[-_]/g, ' ') };
}

// Characteristic Signature Moves
function getCharacterTechniques(charId: string, seriesSlug: string): string[] {
  const c = charId.toLowerCase();

  if (c.includes('luffy')) {
    return ['Gomu Gomu no Pistol', 'Gomu Gomu no Gatling', 'Gear 2nd Jet Culverin', 'Gear 4th King Kong Gun', 'Sun God Nika Bajrang Gun'];
  }
  if (c.includes('zoro')) {
    return ['Oni Giri Demon Slash', 'Three-Sword Style: Tatsu Maki', 'Sanzen Sekai (Three Thousand Worlds)', 'Dead Man’s Game Ashura'];
  }
  if (c.includes('sanji')) {
    return ['Black Leg Mouton Shot', 'Concassé Heavy Heel', 'Diable Jambe Flambage Shot', 'Ifrit Jambe Bœuf Burst'];
  }
  if (c.includes('arlong')) {
    return ['Shark Dart Charge', 'Tooth Gum Barrage', 'Shark On Darts Penetration', 'Sawtooth Decapitation'];
  }
  if (c.includes('mihawk')) {
    return ['Kokuto Issen Silent Cleave', 'Black Blade Shockwave', 'World’s Pinnacle Slash'];
  }
  if (c.includes('crocodile')) {
    return ['Desert Spada Sand Blade', 'Barchan Moisture Drain', 'Ground Death Cataclysm', 'Sables Pesado Desert Tornado'];
  }
  if (c.includes('lucci')) {
    return ['Finger Pistol Shigan Blitz', 'Tempest Kick Rankyaku Guillotine', 'Iron Body Tekkai Counter', 'Ultimate Rokuogan Shockwave'];
  }
  if (c.includes('whitebeard')) {
    return ['Gekishin Seismic Fissure', 'Atmosphere Splitting Naginata', 'Island Shaking Tsunami Smash'];
  }
  if (c.includes('akainu')) {
    return ['Great Eruption Dai Funka', 'Meteor Volcano Ryusei Kazan', 'Hellhound Meigo Lava Punch'];
  }
  if (c.includes('katakuri')) {
    return ['Flowing Willow Mochi', 'Rain Drop Mochi Barrage', 'Power Mochi Annihilation', 'Buzz Cut Mochi Spiked Impact'];
  }
  if (c.includes('imu')) {
    return ['Mother Flame Descending Laser', 'Shadow Arrow Piercing Impale', 'Abyssal Dominance Gaze', 'Empty Throne Annihilation'];
  }
  if (c.includes('saturn')) {
    return ['Gyuki Demonic Venom Horns', 'Instant Flesh Regeneration', 'Telepathic Head-Popping Glare', 'Poisonous Spider-Leg Impale'];
  }
  if (c.includes('warcury')) {
    return ['Fengxi Roaring Tusk Quake', 'Adamantine Conqueror Tusk Shield', 'Monstrous Boar Charge', 'Sonic Shockwave Blast'];
  }
  if (c.includes('nusjuro')) {
    return ['Shodai Kitetsu Frost Cleave', 'Bakotsu Centaur Sprint', 'Glacial Sword Wave', 'Pacifista Bisection'];
  }
  if (c.includes('mars')) {
    return ['Itsumade Incandescent Ray', 'Avian Barrier Infiltration', 'Sky-Splitting Cry', 'Aerial Feather Barrage'];
  }
  if (c.includes('ju-peter') || c.includes('jupeter')) {
    return ['Subterranean Pit Ingestion', 'Sandworm Maw Vacuum', 'Earthy Tremor Surge', 'Colossal Annihilation Chomp'];
  }
  if (c.includes('garling')) {
    return ['Champion of God Valley Cleave', 'God\'s Knights Executive Execution', 'Celestial Judgment Slash'];
  }
  if (c.includes('zhuo')) {
    return ['Wraith Cloud Flight', 'Blood Infant Corpse Devour', 'Demonic Eye of the Heavenly Emperor', 'Sacred Qilin Dragon Horn Strike'];
  }
  if (c.includes('huangpu')) {
    return ['Nine Dragon Imperial Aura', 'Dragon Roar Mountain Crusher', 'Diamond Flesh Impervious Barrier'];
  }
  if (c.includes('linley')) {
    return ['Bloodviolet Sword Serpent Dance', 'Profound Truths of Earth (128 Waves)', 'Dragonblood Void Scales Defense', 'Microcosm Gravitational Spatial Tear'];
  }
  if (c.includes('olivier')) {
    return ['Soul-Severing Light Sword', 'Dark-Light Void Resonance', 'Dual Boundary Sword Spirit'];
  }
  if (c.includes('clayde')) {
    return ['Golden Lion King Charge', 'Saint Battle Qi Cleave', 'Imperial Aura Crush'];
  }
  if (c.includes('heidens')) {
    return ['Holy Radiant Judgment', 'Divine Angel Descent Ritual', 'Sacred Light Spear of Annihilation'];
  }
  if (c.includes('augusta')) {
    return ['Overgod Sword of Light', 'Sovereign Divine Domain', 'Sword of Judgement', 'Light of Annihilation'];
  }
  if (c.includes('hongmeng')) {
    return ['Primordial Grandmist Palm', 'Cosmic Creation Spark', 'Universal Law Erasure', 'Grandmist Wine Toast'];
  }

  // Solo Leveling characters
  if (c.includes('jin-woo') || c.includes('jinwoo')) {
    return ['Shadow Extraction: Arise', 'Dagger Rush: Violent Slash', 'Ruler\'s Authority (Psychokinesis)', 'Shadow Exchange Teleportation', 'Monarch\'s Domain Shadow Army Buff'];
  }
  if (c.includes('igris')) {
    return ['Blood-Red Greatsword Cleave', 'Lightning Infused Twin Blade Rush', 'Dominator Greatsword Overhead Slam'];
  }
  if (c.includes('beru')) {
    return ['Predator Gluttony Jaw Sting', 'Supersonic Venom Claw Flurry', 'Royal Ant King Screech', 'Healing Mana Transfer'];
  }
  if (c.includes('thomas')) {
    return ['Reinforcement: Titan Armor', 'Black Hole Gravitational Pull', 'Capture & Smash Impact', 'Ruler\'s Authority Fist'];
  }
  if (c.includes('antares')) {
    return ['Dragon\'s Breath of Total Extinction', 'Fear of the Dragon Roar', 'Spiritual Body Manifestation: Ancient Dragon King', 'Flame Claws of Decimation'];
  }
  if (c.includes('cha-hae') || c.includes('cha')) {
    return ['Sword Dance: Radiant Blade', 'Flash Step Thrust', 'Sword of Light Sever'];
  }
  if (c.includes('choi')) {
    return ['Flame Spear Incineration', 'Fire Dragon Burst', 'Inferno Vortex Pillar'];
  }
  if (c.includes('baek')) {
    return ['White Tiger Beast Transformation', 'Divine White Fang Shred', 'Fierce Roar Intimidation'];
  }

  // Lord of the Mysteries characters
  if (c.includes('klein')) {
    return ['Air Bullet & Flaming Jump Blitz', 'Historical Projection Summoning', 'Marionette Spirit Thread Control', 'Conceptual Grafting & Blind Stupidity', 'Miracle Invocation: Wish Realization', 'Sefirah Castle Divine Suppression'];
  }
  if (c.includes('amon')) {
    return ['Steal Thoughts & Intentions', 'Steal Fate & Identity', 'Avatar Swarm Parasitism', 'Time Loop Deceleration', 'Error Loophole Exploit'];
  }
  if (c.includes('adam')) {
    return ['Envisioning Reality into Existence', 'Author\'s Script Manipulation', 'Mental Plague & Dragon Roar', 'Virtual Persona Manifestation'];
  }
  if (c.includes('in-zangwill') || c.includes('zangwill')) {
    return ['0-08 Story Coincidence Inscription', 'Underworld Gate Undead Descent', 'Spirit Severing Night Blade'];
  }
  if (c.includes('azik')) {
    return ['Underworld Bone Dragon Descent', 'Death Eye Soul Freeze', 'Underworld River Grasp'];
  }
  if (c.includes('audrey')) {
    return ['Mind Deprivation & Hypnosis', 'Placate Frenzy & Soul Reading', 'Dream Traversal & Consciousness Weave'];
  }
  if (c.includes('alger')) {
    return ['Raging Lightning Spear', 'Tsunami Whirlpool Cataclysm', 'Ocean Siren Wind Storm'];
  }
  if (c.includes('derrick')) {
    return ['Pure White Light of Purification', 'Unshadowed Spear of the Sun', 'Divine Holy Oath Blessing'];
  }

  // Generics
  if (seriesSlug === 'one-piece') {
    return ['Heavy Armament Haki Smash', 'High-Speed Soru Flash Strike', 'Decisive Conqueror Aura Clash'];
  }
  if (seriesSlug === 'demonic-emperor') {
    return ['Ghostly Demonic Palm', 'Soul Severing Blade Qi', 'Heavenly Miasma Explosive Array'];
  }
  if (seriesSlug === 'solo-leveling') {
    return ['High-Velocity Mana Dagger Thrust', 'Ruler\'s Mana Pulse Shockwave', 'Shadow Domain Extraction Surge'];
  }
  if (seriesSlug === 'lord-of-the-mysteries') {
    return ['Mystical Spell Circle Burst', 'Spirit Vision Soul Gaze', 'Ritualistic Incantation Ward'];
  }
  return ['Elemental Domain Pressure', 'Profound Laws Sonic Burst', 'Divine Spark Cataclysmic Shock'];
}

export function simulateDuel(
  charAId: string,
  charBId: string,
  userChapter: number,
  graph: CanonicalLoreGraph
): DuelResult {
  const entityA = graph.entities[charAId] as CharacterEntity | undefined;
  const entityB = graph.entities[charBId] as CharacterEntity | undefined;

  const nameA = entityA?.name ?? charAId;
  const nameB = entityB?.name ?? charBId;

  // Resolve temporal power stages
  const factStageA = TemporalEngine.getActiveFact<string>(charAId, 'power_stage', Object.values(graph.facts), userChapter);
  const factStageB = TemporalEngine.getActiveFact<string>(charBId, 'power_stage', Object.values(graph.facts), userChapter);

  const stageA = resolvePowerRank(factStageA?.value, graph.series.slug);
  const stageB = resolvePowerRank(factStageB?.value, graph.series.slug);

  // Resolve faction names
  const factFactionA = TemporalEngine.getActiveFact<string>(charAId, 'faction', Object.values(graph.facts), userChapter);
  const factFactionB = TemporalEngine.getActiveFact<string>(charBId, 'faction', Object.values(graph.facts), userChapter);
  const factionNameA = factFactionA ? graph.entities[factFactionA.value]?.name : undefined;
  const factionNameB = factFactionB ? graph.entities[factFactionB.value]?.name : undefined;

  // Calculate Base Stats
  const baseHpA = 1000 + stageA.rank * 250;
  const baseHpB = 1000 + stageB.rank * 250;

  const attackA = 120 + stageA.rank * 45;
  const attackB = 120 + stageB.rank * 45;

  const defenseA = 80 + stageA.rank * 30;
  const defenseB = 80 + stageB.rank * 30;

  const speedA = 100 + stageA.rank * 20;
  const speedB = 100 + stageB.rank * 20;

  // Power advantage percentage
  const totalPower = stageA.rank + stageB.rank;
  const fighterAAdvantage = Math.round((stageA.rank / totalPower) * 100);
  const fighterBAdvantage = 100 - fighterAAdvantage;

  const fighterA: DuelFighter = {
    id: charAId,
    name: nameA,
    avatarUrl: entityA?.avatar_url,
    stageName: stageA.name,
    stageRank: stageA.rank,
    factionName: factionNameA,
    maxHp: baseHpA,
    attack: attackA,
    defense: defenseA,
    speed: speedA,
    hpLog: [baseHpA],
  };

  const fighterB: DuelFighter = {
    id: charBId,
    name: nameB,
    avatarUrl: entityB?.avatar_url,
    stageName: stageB.name,
    stageRank: stageB.rank,
    factionName: factionNameB,
    maxHp: baseHpB,
    attack: attackB,
    defense: defenseB,
    speed: speedB,
    hpLog: [baseHpB],
  };

  const movesA = getCharacterTechniques(charAId, graph.series.slug);
  const movesB = getCharacterTechniques(charBId, graph.series.slug);

  // Turn-based Combat Simulation (5 rounds with climax resolution)
  const rounds: DuelRound[] = [];
  let currentHpA = baseHpA;
  let currentHpB = baseHpB;
  const numRounds = 5;

  for (let r = 1; r <= numRounds; r++) {
    // Rounds 1-4: alternating exchanges
    // Round 5 (Climax): Dominant fighter (or Fighter A if tied) lands decisive clash
    let isRoundA: boolean;
    if (r === 5) {
      isRoundA = stageA.rank >= stageB.rank;
    } else {
      isRoundA = r % 2 === 1;
    }

    const attacker = isRoundA ? fighterA : fighterB;
    const defender = isRoundA ? fighterB : fighterA;
    const attackerMoves = isRoundA ? movesA : movesB;
    const tech = attackerMoves[(r - 1) % attackerMoves.length];

    const damageScale = (attacker.attack / (defender.defense * 0.75)) * 130;
    const isCritical = (r >= 3 && Math.abs(stageA.rank - stageB.rank) >= 2) || r === 5;
    const damage = Math.round(damageScale * (isCritical ? 1.7 : 1.0) + (isRoundA && stageA.rank >= stageB.rank ? 40 : 20));

    if (isRoundA) {
      currentHpB = Math.max(0, currentHpB - damage);
    } else {
      currentHpA = Math.max(0, currentHpA - damage);
    }

    fighterA.hpLog.push(currentHpA);
    fighterB.hpLog.push(currentHpB);

    const narrative = isRoundA
      ? `${attacker.name} charges with ${tech}, inflicting ${damage} crushing damage onto ${defender.name}!`
      : `${attacker.name} retaliates decisively with ${tech}, dealing ${damage} impact damage!`;

    rounds.push({
      roundNumber: r,
      attackerId: attacker.id,
      defenderId: defender.id,
      techniqueName: tech,
      damage,
      isCritical,
      narrative,
      attackerHpAfter: isRoundA ? currentHpA : currentHpB,
      defenderHpAfter: isRoundA ? currentHpB : currentHpA,
    });

    if (currentHpA <= 0 || currentHpB <= 0) break;
  }

  // Determine winner based on remaining HP or power rank
  let winnerId = charAId;
  let loserId = charBId;
  let isDraw = false;

  if (currentHpA > currentHpB) {
    winnerId = charAId;
    loserId = charBId;
  } else if (currentHpB > currentHpA) {
    winnerId = charBId;
    loserId = charAId;
  } else {
    // Tiebreaker by stage rank
    if (stageA.rank >= stageB.rank) {
      winnerId = charAId;
      loserId = charBId;
    } else {
      winnerId = charBId;
      loserId = charAId;
    }
  }

  const winningFighter = winnerId === charAId ? fighterA : fighterB;
  const losingFighter = winnerId === charAId ? fighterB : fighterA;
  const winnerMoves = winnerId === charAId ? movesA : movesB;
  const decisiveTechnique = winnerMoves[winnerMoves.length - 1];

  const summary = `${winningFighter.name} achieves decisive victory over ${losingFighter.name} utilizing ${decisiveTechnique} with a ${winnerId === charAId ? fighterAAdvantage : fighterBAdvantage}% combat advantage at Chapter ${userChapter}.`;

  return {
    fighterA,
    fighterB,
    fighterAAdvantage,
    fighterBAdvantage,
    winnerId,
    loserId,
    isDraw,
    decisiveTechnique,
    summary,
    rounds,
  };
}
