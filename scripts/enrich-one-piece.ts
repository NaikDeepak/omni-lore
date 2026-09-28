import * as fs from 'fs';
import * as path from 'path';
import { CanonicalLoreGraphSchema } from '../src/domain/schema';

const filePath = path.resolve(process.cwd(), 'data/one-piece/graph.json');
const op = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// 1. Add Factions
op.entities['faction-world-government'] = {
  id: 'faction-world-government',
  type: 'faction',
  name: 'World Government',
  aliases: ['Sekai Seifu', 'Twenty Kingdoms Alliance', 'Celestial Nobles Regime'],
  description: 'The colossal totalitarian regime spanning 170+ allied nations, founded 800 years ago after the Void Century, secretly ruled from Pangaea Castle by Imu and the Five Elders.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 1,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 1,
  revealed_at: 1,
  emblem_url: '/assets/pixels/one-piece/factions/faction-world-government.svg',
};

op.entities['faction-gods-knights'] = {
  id: 'faction-gods-knights',
  type: 'faction',
  name: "God's Knights (Holy Knights)",
  aliases: ['Holy Knights', 'Shinpan no Kishi'],
  description: 'The elite martial enforcers of Mary Geoise commanded by Saint Figarland Garling, authorized to adjudicate conflicts even among the World Nobles.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 1054,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 1054,
  revealed_at: 1054,
  emblem_url: '/assets/pixels/one-piece/factions/faction-gods-knights.svg',
};

op.entities['faction-baroque-works'] = {
  id: 'faction-baroque-works',
  type: 'faction',
  name: 'Baroque Works',
  aliases: ['Mr. 0 Syndicate'],
  description: 'Criminal corporate syndicate founded by Crocodile to overthrow Alabasta and acquire the Ancient Weapon Pluton.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 103,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 103,
  revealed_at: 103,
  emblem_url: '/assets/pixels/one-piece/factions/faction-baroque-works.svg',
};

op.entities['faction-impel-down'] = {
  id: 'faction-impel-down',
  type: 'faction',
  name: 'Impel Down Prison',
  aliases: ['The Great Underwater Gaol', 'Underwater Prison'],
  description: "The World Government's maximum security underwater fortress with Six Levels of Hell, commanded by Chief Warden Magellan.",
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 526,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 526,
  revealed_at: 526,
  emblem_url: '/assets/pixels/one-piece/factions/faction-impel-down.svg',
};

op.entities['faction-kozuki-clan'] = {
  id: 'faction-kozuki-clan',
  type: 'faction',
  name: 'Kozuki Clan (Wano Country)',
  aliases: ['Kozuki Family', 'Wano Samurai Retainers'],
  description: 'The ancestral stonemason dynasty of Wano Country that carved the indestructible Poneglyphs, restored by Kozuki Momonosuke.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 817,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 817,
  revealed_at: 817,
  emblem_url: '/assets/pixels/one-piece/factions/faction-kozuki-clan.svg',
};

op.entities['faction-arlong-pirates'] = {
  id: 'faction-arlong-pirates',
  type: 'faction',
  name: 'Arlong Pirates',
  aliases: ['Sun Pirates Splinter', 'Arlong Park Crew'],
  description: 'Fish-man supremacist pirate crew terrorizing the Conomi Islands from Arlong Park, led by Saw-Tooth Arlong.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 69,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 69,
  revealed_at: 69,
  emblem_url: '/assets/pixels/one-piece/factions/faction-arlong-pirates.svg',
};

op.entities['faction-egghead-science'] = {
  id: 'faction-egghead-science',
  type: 'faction',
  name: 'Egghead Special Science Group (SSG)',
  aliases: ['Future Island Research Division', 'Vegapunk Satellites'],
  description: 'The pinnacle scientific research institution on Egghead Island led by Dr. Vegapunk and his six satellite minds.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 1061,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 1061,
  revealed_at: 1061,
  emblem_url: '/assets/pixels/one-piece/factions/faction-egghead-science.svg',
};

op.entities['faction-black-cat-pirates'] = {
  id: 'faction-black-cat-pirates',
  type: 'faction',
  name: 'Black Cat Pirates',
  aliases: ['Kuro Pirates'],
  description: 'East Blue pirate crew previously commanded by Captain Kuro of a Hundred Plans.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 23,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 23,
  revealed_at: 23,
  emblem_url: '/assets/pixels/one-piece/factions/faction-black-cat-pirates.svg',
};

op.entities['faction-krieg-armada'] = {
  id: 'faction-krieg-armada',
  type: 'faction',
  name: 'Krieg Pirate Armada',
  aliases: ['Don Krieg Pirate Fleet'],
  description: 'Fifty-ship East Blue galleon fleet commanded by Don Krieg.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 45,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 45,
  revealed_at: 45,
  emblem_url: '/assets/pixels/one-piece/factions/faction-krieg-armada.svg',
};

op.entities['faction-bonney-pirates'] = {
  id: 'faction-bonney-pirates',
  type: 'faction',
  name: 'Bonney Pirates',
  aliases: ['Jewelry Bonney Crew'],
  description: 'South Blue pirate crew commanded by Big Eater Jewelry Bonney.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 498,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 498,
  revealed_at: 498,
  emblem_url: '/assets/pixels/one-piece/factions/faction-bonney-pirates.svg',
};

// 2. Add World Government Characters
op.entities['imu'] = {
  id: 'imu',
  type: 'character',
  name: 'Imu (Sovereign of the World)',
  aliases: ['Master of the Empty Throne', 'Saint Imu', 'Nerona Imu'],
  description: 'The clandestine supreme sovereign of the World Government who sits upon the Empty Throne; commander of the Five Elders with absolute power over the Mother Flame and global purges.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 906,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 906,
  revealed_at: 906,
  avatar_url: '/assets/pixels/one-piece/avatars/imu.svg',
};

op.entities['gorosei-saturn'] = {
  id: 'gorosei-saturn',
  type: 'character',
  name: 'Saint Jaygarcia Saturn (Warrior God of Science & Defense)',
  aliases: ['Elder Saturn', 'Warrior God of Science'],
  description: 'Elder of the Five Elders who invaded Egghead Island with Admiral Kizaru, assuming a monstrous Gyuki spider-demon form with instant regenerative immortality and demonic eye-blasts.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 233,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 233,
  revealed_at: 233,
  avatar_url: '/assets/pixels/one-piece/avatars/gorosei-saturn.svg',
};

op.entities['gorosei-warcury'] = {
  id: 'gorosei-warcury',
  type: 'character',
  name: 'Saint Topman Warcury (Warrior God of Justice)',
  aliases: ['Elder Warcury', 'Warrior God of Justice'],
  description: "Elder of the Gorosei manifesting the colossal mythological Fengxi boar form with impregnable Conqueror's Haki armor that broke Gear 5 Luffy's fists.",
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 233,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 233,
  revealed_at: 233,
  avatar_url: '/assets/pixels/one-piece/avatars/gorosei-warcury.svg',
};

op.entities['gorosei-nusjuro'] = {
  id: 'gorosei-nusjuro',
  type: 'character',
  name: 'Saint Ethanbaron V. Nusjuro (Warrior God of Finance)',
  aliases: ['Elder Nusjuro', 'Warrior God of Finance'],
  description: 'Elder of the Gorosei wielding the Shodai Kitetsu cursed blade, transforming into a skeletal Bakotsu demon stallion with blistering freezing sword strikes.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 233,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 233,
  revealed_at: 233,
  avatar_url: '/assets/pixels/one-piece/avatars/gorosei-nusjuro.svg',
};

op.entities['gorosei-mars'] = {
  id: 'gorosei-mars',
  type: 'character',
  name: 'Saint Marcus Mars (Warrior God of Environment)',
  aliases: ['Elder Mars', 'Warrior God of Environment'],
  description: 'Elder of the Gorosei taking flight as the gigantic monstrous Itsumade bird demon, breaching the Labophase frontier dome with incandescent energy blasts.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 233,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 233,
  revealed_at: 233,
  avatar_url: '/assets/pixels/one-piece/avatars/gorosei-mars.svg',
};

op.entities['gorosei-ju-peter'] = {
  id: 'gorosei-ju-peter',
  type: 'character',
  name: 'Saint Shepherd Ju Peter (Warrior God of Agriculture)',
  aliases: ['Elder Ju Peter', 'Warrior God of Agriculture'],
  description: 'Youngest of the Gorosei transforming into a monstrous subterranean Sandworm demon that devours battlefield targets from beneath the earth.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 233,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 233,
  revealed_at: 233,
  avatar_url: '/assets/pixels/one-piece/avatars/gorosei-ju-peter.svg',
};

op.entities['garling-figarland'] = {
  id: 'garling-figarland',
  type: 'character',
  name: "Saint Figarland Garling (Supreme Commander of God's Knights)",
  aliases: ['Champion of God Valley', 'Saint Garling'],
  description: "The ruthless ruler of God Valley and Supreme Commander of God's Knights who executes World Nobles for misconduct; later elevated to the Gorosei as Warrior God of Science.",
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 1086,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 1086,
  revealed_at: 1086,
  avatar_url: '/assets/pixels/one-piece/avatars/garling-figarland.svg',
};

// 3. Add Ancient Weapons
op.entities['item-pluton'] = {
  id: 'item-pluton',
  type: 'item',
  name: 'Ancient Weapon Pluton',
  aliases: ['Battleship Pluton', 'Underworld Warship'],
  description: 'An apocalyptic ancient battleship capable of vaporizing entire islands in a single shot, sleeping submerged beneath the submerged ancient country of Wano until the borders are dismantled.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 193,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 193,
  revealed_at: 193,
  thumbnail_url: '/assets/pixels/one-piece/items/item-pluton.svg',
};

op.entities['ability-poseidon'] = {
  id: 'ability-poseidon',
  type: 'ability',
  name: 'Ancient Weapon Poseidon (Sea King Telepathy)',
  aliases: ['Voice of the Sea Kings', "Princess Shirahoshi's Power"],
  description: 'The hereditary telepathic power possessed by Mermaid Princess Shirahoshi to communicate with and command the colossal Sea Kings capable of sinking the entire world.',
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 626,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 626,
  revealed_at: 626,
};

op.entities['item-uranus'] = {
  id: 'item-uranus',
  type: 'item',
  name: 'Ancient Weapon Uranus (Mother Flame Annihilator)',
  aliases: ['Sky Weapon Uranus', 'Lulusia Obliterator'],
  description: "The mythical sky weapon commanded by Imu and energized by Dr. Vegapunk's synthetic Mother Flame, unleashing sixteen descending lasers of light that erased Lulusia Kingdom from existence in seconds.",
  provenance: {
    source: {
      series: 'one-piece',
      chapter: 1060,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 1060,
  revealed_at: 1060,
  thumbnail_url: '/assets/pixels/one-piece/items/item-uranus.svg',
};

// 4. Add Missing Faction Facts for Existing 8 Characters
const missingFactionMappings: Array<{ charId: string; factionId: string; chapter: number }> = [
  { charId: 'arlong', factionId: 'faction-arlong-pirates', chapter: 69 },
  { charId: 'kuro', factionId: 'faction-black-cat-pirates', chapter: 23 },
  { charId: 'krieg', factionId: 'faction-krieg-armada', chapter: 45 },
  { charId: 'bon-clay', factionId: 'faction-baroque-works', chapter: 129 },
  { charId: 'magellan', factionId: 'faction-impel-down', chapter: 526 },
  { charId: 'vegapunk', factionId: 'faction-egghead-science', chapter: 1061 },
  { charId: 'bonney', factionId: 'faction-bonney-pirates', chapter: 498 },
  { charId: 'momonosuke', factionId: 'faction-kozuki-clan', chapter: 684 },
];

for (const m of missingFactionMappings) {
  const factId = `fact-faction-${m.charId}`;
  op.facts[factId] = {
    id: factId,
    entity_id: m.charId,
    predicate: 'faction',
    value: m.factionId,
    temporal: {
      valid_from: m.chapter,
      valid_to: null,
      revealed_at: m.chapter,
    },
    provenance: {
      source: {
        series: 'one-piece',
        chapter: m.chapter,
      },
      extracted_by: 'deterministic',
      confidence: 1,
      created_at: '2026-09-27T00:00:00Z',
    },
    canon_status: 'canon',
  };
}

// 5. Add Power Stage & Faction Facts for New Characters
const newCharData: Array<{ charId: string; powerStage: string; factionId: string; chapter: number }> = [
  { charId: 'imu', powerStage: 'tier-pirate-king', factionId: 'faction-world-government', chapter: 906 },
  { charId: 'gorosei-saturn', powerStage: 'tier-emperor-admiral', factionId: 'faction-world-government', chapter: 233 },
  { charId: 'gorosei-warcury', powerStage: 'tier-emperor-admiral', factionId: 'faction-world-government', chapter: 233 },
  { charId: 'gorosei-nusjuro', powerStage: 'tier-emperor-admiral', factionId: 'faction-world-government', chapter: 233 },
  { charId: 'gorosei-mars', powerStage: 'tier-emperor-admiral', factionId: 'faction-world-government', chapter: 233 },
  { charId: 'gorosei-ju-peter', powerStage: 'tier-emperor-admiral', factionId: 'faction-world-government', chapter: 233 },
  { charId: 'garling-figarland', powerStage: 'tier-emperor-admiral', factionId: 'faction-gods-knights', chapter: 1086 },
];

for (const nc of newCharData) {
  const powerFactId = `fact-power-${nc.charId}`;
  op.facts[powerFactId] = {
    id: powerFactId,
    entity_id: nc.charId,
    predicate: 'power_stage',
    value: nc.powerStage,
    temporal: {
      valid_from: nc.chapter,
      valid_to: null,
      revealed_at: nc.chapter,
    },
    provenance: {
      source: {
        series: 'one-piece',
        chapter: nc.chapter,
      },
      extracted_by: 'deterministic',
      confidence: 1,
      created_at: '2026-09-27T00:00:00Z',
    },
    canon_status: 'canon',
  };

  const factionFactId = `fact-faction-${nc.charId}`;
  op.facts[factionFactId] = {
    id: factionFactId,
    entity_id: nc.charId,
    predicate: 'faction',
    value: nc.factionId,
    temporal: {
      valid_from: nc.chapter,
      valid_to: null,
      revealed_at: nc.chapter,
    },
    provenance: {
      source: {
        series: 'one-piece',
        chapter: nc.chapter,
      },
      extracted_by: 'deterministic',
      confidence: 1,
      created_at: '2026-09-27T00:00:00Z',
    },
    canon_status: 'canon',
  };
}

// 6. Add Relationships
const newRelationships: Array<{
  id: string;
  source_id: string;
  target_id: string;
  predicate: any;
  label: string;
  chapter: number;
}> = [
  {
    id: 'rel-saturn-imu',
    source_id: 'gorosei-saturn',
    target_id: 'imu',
    predicate: 'ALLY_OF',
    label: 'Elder Servant of the Empty Throne',
    chapter: 906,
  },
  {
    id: 'rel-warcury-imu',
    source_id: 'gorosei-warcury',
    target_id: 'imu',
    predicate: 'ALLY_OF',
    label: 'Elder Servant of the Empty Throne',
    chapter: 906,
  },
  {
    id: 'rel-nusjuro-imu',
    source_id: 'gorosei-nusjuro',
    target_id: 'imu',
    predicate: 'ALLY_OF',
    label: 'Elder Servant of the Empty Throne',
    chapter: 906,
  },
  {
    id: 'rel-mars-imu',
    source_id: 'gorosei-mars',
    target_id: 'imu',
    predicate: 'ALLY_OF',
    label: 'Elder Servant of the Empty Throne',
    chapter: 906,
  },
  {
    id: 'rel-ju-peter-imu',
    source_id: 'gorosei-ju-peter',
    target_id: 'imu',
    predicate: 'ALLY_OF',
    label: 'Elder Servant of the Empty Throne',
    chapter: 906,
  },
  {
    id: 'rel-garling-imu',
    source_id: 'garling-figarland',
    target_id: 'imu',
    predicate: 'ALLY_OF',
    label: 'Supreme Knight Servant to the Throne',
    chapter: 1086,
  },
  {
    id: 'rel-imu-uranus',
    source_id: 'imu',
    target_id: 'item-uranus',
    predicate: 'POSSESSES',
    label: 'Command of the Mother Flame Annihilator',
    chapter: 1060,
  },
  {
    id: 'rel-luffy-saturn',
    source_id: 'luffy',
    target_id: 'gorosei-saturn',
    predicate: 'ENEMY_OF',
    label: 'Sun God Nika vs Gyuki of Science',
    chapter: 1094,
  },
  {
    id: 'rel-zoro-nusjuro',
    source_id: 'zoro',
    target_id: 'gorosei-nusjuro',
    predicate: 'ENEMY_OF',
    label: 'Kitetsu Cursed Blade Clash',
    chapter: 1117,
  },
  {
    id: 'rel-crocodile-baroque',
    source_id: 'crocodile',
    target_id: 'faction-baroque-works',
    predicate: 'LEADER_OF',
    label: 'Mr. 0 Syndicate Founder',
    chapter: 113,
  },
  {
    id: 'rel-magellan-impel',
    source_id: 'magellan',
    target_id: 'faction-impel-down',
    predicate: 'LEADER_OF',
    label: 'Chief Warden of Impel Down',
    chapter: 526,
  },
  {
    id: 'rel-momonosuke-kozuki',
    source_id: 'momonosuke',
    target_id: 'faction-kozuki-clan',
    predicate: 'LEADER_OF',
    label: 'Shogun of Wano Country',
    chapter: 1051,
  },
  {
    id: 'rel-vegapunk-egghead',
    source_id: 'vegapunk',
    target_id: 'faction-egghead-science',
    predicate: 'LEADER_OF',
    label: 'Director of Egghead SSG',
    chapter: 1061,
  },
];

for (const r of newRelationships) {
  op.relationships[r.id] = {
    id: r.id,
    source_id: r.source_id,
    target_id: r.target_id,
    predicate: r.predicate,
    label: r.label,
    temporal: {
      valid_from: r.chapter,
      valid_to: null,
      revealed_at: r.chapter,
    },
    provenance: {
      source: {
        series: 'one-piece',
        chapter: r.chapter,
      },
      extracted_by: 'deterministic',
      confidence: 1,
      created_at: '2026-09-27T00:00:00Z',
    },
    canon_status: 'canon',
  };
}

// Validate against CanonicalLoreGraphSchema
const parseResult = CanonicalLoreGraphSchema.safeParse(op);
if (!parseResult.success) {
  console.error('Validation errors:', JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

fs.writeFileSync(filePath, JSON.stringify(op, null, 2), 'utf-8');
console.log('Successfully enriched One Piece lore graph!');
