import * as fs from 'fs';
import * as path from 'path';
import { CanonicalLoreGraphSchema } from '../src/domain/schema';

const filePath = path.resolve(process.cwd(), 'data/solo-leveling/graph.json');
const sl = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// 1. Cosmological Realignment
// Realign Jeju locations to plane-earth
if (sl.entities['loc-jeju-coastline']) {
  sl.entities['loc-jeju-coastline'].plane_id = 'plane-earth';
}
if (sl.entities['loc-ant-queen-nest']) {
  sl.entities['loc-ant-queen-nest'].plane_id = 'plane-earth';
}
if (sl.entities['loc-jeju-observatory']) {
  sl.entities['loc-jeju-observatory'].plane_id = 'plane-earth';
}

// Remove plane-jeju and add plane-chaos-void
delete sl.entities['plane-jeju'];

sl.entities['plane-chaos-void'] = {
  id: 'plane-chaos-void',
  type: 'plane',
  name: 'Realm of Chaos (Dimensional Void)',
  tier_order: 3,
  description: 'The boundless primordial void between dimensions where the Sovereign Monarchs marshal their catastrophic legions and wage eternal war against the Rulers of Light.',
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 160,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 160,
  revealed_at: 160,
  aliases: ['The Rift', "Monarchs' Domain of Chaos", 'Dimensional Void'],
};

sl.entities['loc-dimensional-rift'] = {
  id: 'loc-dimensional-rift',
  type: 'location',
  name: 'Colossal Interdimensional Rift',
  plane_id: 'plane-chaos-void',
  coordinates: {
    x: 200,
    y: 150,
  },
  description: "A terrifying spatial tear spanning hundreds of kilometers across the sky through which the Monarch of Destruction's dragon army descends upon Earth.",
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 165,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 165,
  revealed_at: 165,
  aliases: ['The Sky Rift', 'Dragon Invasion Gate'],
  thumbnail_url: '/assets/pixels/solo-leveling/locations/loc-dimensional-rift.svg',
};

sl.entities['loc-land-of-eternal-rest'] = {
  id: 'loc-land-of-eternal-rest',
  type: 'location',
  name: 'Land of Eternal Rest (Shadow Realm)',
  plane_id: 'plane-chaos-void',
  coordinates: {
    x: 120,
    y: 300,
  },
  description: "The infinite realm of death beneath the dimensional veil where Ashborn's true shadow legion rested for eons under an eclipsed black sun.",
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 162,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 162,
  revealed_at: 162,
  aliases: ['World of the Dead', 'Ashborn Realm'],
  thumbnail_url: '/assets/pixels/solo-leveling/locations/loc-land-of-eternal-rest.svg',
};

// 2. Factions: Add Shadow Army
sl.entities['faction-shadow-army'] = {
  id: 'faction-shadow-army',
  type: 'faction',
  name: 'The Shadow Army (Immortal Legion)',
  aliases: ['Shadow Soldiers', 'Legion of Death', 'Ashborn Host'],
  description: 'The immortal spectral army commanded by Sung Jin-woo, capable of instantaneous regeneration from mana and endless dimensional expansion.',
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 45,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 45,
  revealed_at: 45,
  emblem_url: '/assets/pixels/solo-leveling/factions/faction-shadow-army.svg',
};

// Reassign shadow soldiers to faction-shadow-army
const shadowSoldiers = ['igris', 'beru', 'bellion', 'tank', 'iron', 'tusk', 'kaisel'];
for (const sId of shadowSoldiers) {
  const factionFactId = `fact-${sId}-faction`;
  if (sl.facts[factionFactId]) {
    sl.facts[factionFactId].value = 'faction-shadow-army';
  }
}

// 3. Add Legendary Artifact Items
sl.entities['item-kamish-wrath'] = {
  id: 'item-kamish-wrath',
  type: 'item',
  name: "Kamish's Wrath (Dragon Shortswords)",
  aliases: ['Dragon Fang Daggers', "Kamish's Daggers"],
  description: 'Twin shortswords crafted by master blacksmiths from the sharpest rune tooth of ancient dragon Kamish; boasts an astronomical +1500 attack power and responds directly to mana infusion.',
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 147,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 147,
  revealed_at: 147,
  thumbnail_url: '/assets/pixels/solo-leveling/items/item-kamish-wrath.svg',
};

sl.entities['item-orb-of-avarice'] = {
  id: 'item-orb-of-avarice',
  type: 'item',
  name: 'Orb of Avarice (Magic Booster)',
  aliases: ['Red Jewel Orb', "Vulcan's Magic Sphere"],
  description: 'A blazing crimson magical bead dropped by Demon Noble Vulcan in the Demon Castle; doubles all magical damage output and flame potency when held, entrusted to High Shaman Tusk.',
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 68,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 68,
  revealed_at: 68,
  thumbnail_url: '/assets/pixels/solo-leveling/items/item-orb-of-avarice.svg',
};

sl.entities['item-demon-king-daggers'] = {
  id: 'item-demon-king-daggers',
  type: 'item',
  name: "Demon King's Daggers (Baran's Storm Blades)",
  aliases: ["Baran's Daggers", 'White Flame Daggers'],
  description: 'Twin lightning daggers wielded by Demon King Baran on the 100th floor of the Demon Castle; releases chained thunderous storms upon consecutive swings.',
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 89,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 89,
  revealed_at: 89,
  thumbnail_url: '/assets/pixels/solo-leveling/items/item-demon-king-daggers.svg',
};

sl.entities['item-cup-of-reincarnation'] = {
  id: 'item-cup-of-reincarnation',
  type: 'item',
  name: 'Cup of Reincarnation (Tool of God)',
  aliases: ["God's Chalice", 'Time-Reversing Relic'],
  description: "The divine celestial artifact bestowed upon the Rulers by the Absolute Being, capable of rewinding the entire universe's time by approximately 10 Earth years; cracked and shattered after Jin-woo's final rewind.",
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 177,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 177,
  revealed_at: 177,
  thumbnail_url: '/assets/pixels/solo-leveling/items/item-cup-of-reincarnation.svg',
};

// 4. Add Abilities
sl.entities['ability-shadow-extraction'] = {
  id: 'ability-shadow-extraction',
  type: 'ability',
  name: 'Shadow Extraction: Arise',
  aliases: ['Arise', 'Geurimja Chuchul'],
  description: 'The signature authority of the Shadow Monarch allowing Jin-woo to extract the mana-imbued soul of deceased warriors into permanent, obedient shadow soldiers.',
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 45,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 45,
  revealed_at: 45,
};

sl.entities['ability-rulers-authority'] = {
  id: 'ability-rulers-authority',
  type: 'ability',
  name: "Ruler's Authority (Psychokinesis)",
  aliases: ["Dominator's Touch", 'Invisible Hand'],
  description: 'The unyielding telekinetic power unique to the Rulers and the Shadow Monarch, allowing manipulation of physical objects and gravitational acceleration without consuming mana.',
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 40,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 40,
  revealed_at: 40,
};

sl.entities['ability-shadow-exchange'] = {
  id: 'ability-shadow-exchange',
  type: 'ability',
  name: 'Shadow Exchange',
  aliases: ['Shadow Teleportation'],
  description: 'Spatial movement ability allowing the Shadow Monarch to instantly swap physical positions with any designated shadow soldier across planetary distances.',
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 80,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 80,
  revealed_at: 80,
};

sl.entities['ability-monarchs-domain'] = {
  id: 'ability-monarchs-domain',
  type: 'ability',
  name: "Monarch's Domain",
  aliases: ['Shadow Realm Amplification'],
  description: 'A shadow territory manifestation that boosts the combat stats and regeneration speed of all summoned shadow soldiers within its perimeter by 50%.',
  provenance: {
    source: {
      series: 'solo-leveling',
      chapter: 65,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 65,
  revealed_at: 65,
};

// 5. Add Shadow Command Hierarchy Facts
const gradeFacts: Array<{
  id: string;
  charId: string;
  grade: string;
  validFrom: number;
  validTo: number | null;
}> = [
  { id: 'fact-grade-igris-1', charId: 'igris', grade: 'Knight Grade', validFrom: 45, validTo: 119 },
  { id: 'fact-grade-igris-2', charId: 'igris', grade: 'Elite Knight Grade', validFrom: 120, validTo: 164 },
  { id: 'fact-grade-igris-3', charId: 'igris', grade: 'Commander Grade', validFrom: 165, validTo: null },
  { id: 'fact-grade-beru-1', charId: 'beru', grade: 'Commander Grade', validFrom: 105, validTo: 164 },
  { id: 'fact-grade-beru-2', charId: 'beru', grade: 'Marshal Grade', validFrom: 165, validTo: null },
  { id: 'fact-grade-bellion', charId: 'bellion', grade: 'Grand Marshal Grade', validFrom: 165, validTo: null },
  { id: 'fact-grade-tank', charId: 'tank', grade: 'Elite Grade', validFrom: 55, validTo: null },
  { id: 'fact-grade-iron', charId: 'iron', grade: 'Elite Grade', validFrom: 55, validTo: null },
  { id: 'fact-grade-tusk-1', charId: 'tusk', grade: 'Knight Grade', validFrom: 75, validTo: 119 },
  { id: 'fact-grade-tusk-2', charId: 'tusk', grade: 'Elite Knight Grade', validFrom: 120, validTo: null },
];

for (const gf of gradeFacts) {
  sl.facts[gf.id] = {
    id: gf.id,
    entity_id: gf.charId,
    predicate: 'shadow_grade',
    value: gf.grade,
    temporal: {
      valid_from: gf.validFrom,
      valid_to: gf.validTo,
      revealed_at: gf.validFrom,
    },
    provenance: {
      source: {
        series: 'solo-leveling',
        chapter: gf.validFrom,
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
    id: 'rel-jinwoo-shadow-army',
    source_id: 'sung-jin-woo',
    target_id: 'faction-shadow-army',
    predicate: 'LEADER_OF',
    label: 'Supreme Commander of the Shadow Legion',
    chapter: 45,
  },
  {
    id: 'rel-jinwoo-extraction',
    source_id: 'sung-jin-woo',
    target_id: 'ability-shadow-extraction',
    predicate: 'POSSESSES',
    label: 'Shadow Monarch Necromancy Authority',
    chapter: 45,
  },
  {
    id: 'rel-jinwoo-rulers-authority',
    source_id: 'sung-jin-woo',
    target_id: 'ability-rulers-authority',
    predicate: 'POSSESSES',
    label: 'Gravitational Psychokinesis',
    chapter: 40,
  },
  {
    id: 'rel-jinwoo-shadow-exchange',
    source_id: 'sung-jin-woo',
    target_id: 'ability-shadow-exchange',
    predicate: 'POSSESSES',
    label: 'Instantaneous Shadow Teleportation',
    chapter: 80,
  },
  {
    id: 'rel-jinwoo-monarchs-domain',
    source_id: 'sung-jin-woo',
    target_id: 'ability-monarchs-domain',
    predicate: 'POSSESSES',
    label: 'Area Shadow Stat Amplification',
    chapter: 65,
  },
  {
    id: 'rel-jinwoo-kamish',
    source_id: 'sung-jin-woo',
    target_id: 'item-kamish-wrath',
    predicate: 'POSSESSES',
    label: 'Gift of the Dragon Shortswords',
    chapter: 147,
  },
  {
    id: 'rel-tusk-orb',
    source_id: 'tusk',
    target_id: 'item-orb-of-avarice',
    predicate: 'POSSESSES',
    label: 'Entrusted Fire Amplification Bead',
    chapter: 75,
  },
  {
    id: 'rel-jinwoo-demon-daggers',
    source_id: 'sung-jin-woo',
    target_id: 'item-demon-king-daggers',
    predicate: 'POSSESSES',
    label: 'Spoils of Demon King Baran',
    chapter: 89,
  },
  {
    id: 'rel-rulers-cup',
    source_id: 'faction-rulers',
    target_id: 'item-cup-of-reincarnation',
    predicate: 'POSSESSES',
    label: "Tool of God for Universal Time Reversal",
    chapter: 177,
  },
  {
    id: 'rel-igris-jinwoo',
    source_id: 'igris',
    target_id: 'sung-jin-woo',
    predicate: 'ALLY_OF',
    label: 'Loyal Blood-Red Knight',
    chapter: 45,
  },
  {
    id: 'rel-beru-jinwoo',
    source_id: 'beru',
    target_id: 'sung-jin-woo',
    predicate: 'ALLY_OF',
    label: 'Devoted Ant King Commander',
    chapter: 105,
  },
  {
    id: 'rel-bellion-jinwoo',
    source_id: 'bellion',
    target_id: 'sung-jin-woo',
    predicate: 'ALLY_OF',
    label: 'Grand Marshal of the Original Host',
    chapter: 165,
  },
  {
    id: 'rel-ashborn-jinwoo',
    source_id: 'ashborn',
    target_id: 'sung-jin-woo',
    predicate: 'MASTER_OF',
    label: 'Predecessor Shadow Monarch Successor',
    chapter: 162,
  },
  {
    id: 'rel-antares-jinwoo',
    source_id: 'antares',
    target_id: 'sung-jin-woo',
    predicate: 'ENEMY_OF',
    label: 'Dragon King Nemesis Clash',
    chapter: 175,
  },
];

for (const r of newRelationships) {
  sl.relationships[r.id] = {
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
        series: 'solo-leveling',
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
const parseResult = CanonicalLoreGraphSchema.safeParse(sl);
if (!parseResult.success) {
  console.error('Validation errors:', JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

fs.writeFileSync(filePath, JSON.stringify(sl, null, 2), 'utf-8');
console.log('Successfully enriched Solo Leveling lore graph!');
