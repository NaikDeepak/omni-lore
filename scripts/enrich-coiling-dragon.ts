import * as fs from 'fs';
import * as path from 'path';
import { CanonicalLoreGraphSchema } from '../src/domain/schema';

const filePath = path.resolve(process.cwd(), 'data/coiling-dragon/graph.json');
const cd = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// 1. Add Power Stages
cd.entities['stage-sovereign'] = {
  id: 'stage-sovereign',
  type: 'power_stage',
  name: 'Sovereign (Lesser / Medium / Chief)',
  order: 13,
  system_name: 'Laws and Sovereign System',
  description: "Fused with a Sovereign Spark, wielder of Sovereign's Might, commander of infinite planar faith and cosmic authority.",
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 700,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 700,
  revealed_at: 700,
  aliases: ['Sovereign of the Universe', 'Chief Sovereign'],
};

cd.entities['stage-grandmist'] = {
  id: 'stage-grandmist',
  type: 'power_stage',
  name: 'Grandmist Creator (Grandmist Controller)',
  order: 14,
  system_name: 'Laws and Sovereign System',
  description: 'Transmuted beyond the four elemental realms into the primordial Grandmist Space, inscriber of the Grandmist Canon and universe creator.',
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 840,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 840,
  revealed_at: 840,
  aliases: ['Grandmist Controller', 'Master of the Universe'],
};

// 2. Add Planes
cd.entities['plane-netherworld'] = {
  id: 'plane-netherworld',
  type: 'plane',
  name: 'Netherworld Realm',
  tier_order: 2,
  description: 'Higher Plane of death and souls, home of the Netherworld Sovereign and the Netherworld Mountain.',
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 600,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 600,
  revealed_at: 600,
  aliases: ['Higher Plane of Death', 'Netherworld'],
};

cd.entities['plane-battlefield'] = {
  id: 'plane-battlefield',
  type: 'plane',
  name: 'Planar Battlefield',
  tier_order: 3,
  description: 'A pocket dimension where the Seven Higher Planes and Four Divine Planes clash in the decennial Planar Wars.',
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 750,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 750,
  revealed_at: 750,
  aliases: ['Planar War Dimension'],
};

cd.entities['plane-grandmist'] = {
  id: 'plane-grandmist',
  type: 'plane',
  name: 'Grandmist Space',
  tier_order: 4,
  description: 'The primordial boundless chaotic void encompassing all cosmoses, realms, and divine planes, ruled by Hongmeng.',
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 841,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 841,
  revealed_at: 841,
  aliases: ['Primordial Void', 'Hongmeng Space'],
};

// 3. Add Locations
cd.entities['loc-netherworld-mountain'] = {
  id: 'loc-netherworld-mountain',
  type: 'location',
  name: 'Netherworld Mountain',
  plane_id: 'plane-netherworld',
  coordinates: {
    x: 200,
    y: 180,
  },
  description: 'Shrouded in dense gray mist where souls gather, home of the Red-Robed Messenger and Sovereign of Death.',
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 620,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 620,
  revealed_at: 620,
  aliases: ['Ghost Mountain'],
  thumbnail_url: '/assets/pixels/coiling-dragon/locations/loc-netherworld-mountain.svg',
};

cd.entities['loc-styx-river'] = {
  id: 'loc-styx-river',
  type: 'location',
  name: 'Styx River',
  plane_id: 'plane-netherworld',
  coordinates: {
    x: 280,
    y: 320,
  },
  description: 'Endless soul river crossing the Netherworld, navigated by skeletal ferries under the gaze of Death Gods.',
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 615,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 615,
  revealed_at: 615,
  aliases: ['River of Souls'],
  thumbnail_url: '/assets/pixels/coiling-dragon/locations/loc-styx-river.svg',
};

cd.entities['loc-stellar-corridor'] = {
  id: 'loc-stellar-corridor',
  type: 'location',
  name: 'Stellar Corridor',
  plane_id: 'plane-battlefield',
  coordinates: {
    x: 150,
    y: 250,
  },
  description: 'Narrow spatial passage connecting opposing planar camps in the Planar Battlefield where Commander-level battles erupt.',
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 760,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 760,
  revealed_at: 760,
  aliases: ['War Corridor'],
  thumbnail_url: '/assets/pixels/coiling-dragon/locations/loc-stellar-corridor.svg',
};

cd.entities['loc-nine-colored-channel'] = {
  id: 'loc-nine-colored-channel',
  type: 'location',
  name: 'Nine-Colored Channel',
  plane_id: 'plane-battlefield',
  coordinates: {
    x: 350,
    y: 250,
  },
  description: 'Vast spatial rift channel between the Light and Darkness divine armies during the final clash of the Planar Wars.',
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 780,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 780,
  revealed_at: 780,
  aliases: ['Nine Colors Rift'],
  thumbnail_url: '/assets/pixels/coiling-dragon/locations/loc-nine-colored-channel.svg',
};

cd.entities['loc-hongmeng-hut'] = {
  id: 'loc-hongmeng-hut',
  type: 'location',
  name: 'Hongmeng Thatched Hut',
  plane_id: 'plane-grandmist',
  coordinates: {
    x: 250,
    y: 200,
  },
  description: 'A modest rustic hut floating serenely in the boundless Grandmist Space where Elder Brother Hongmeng drinks wine and watches the cosmoses.',
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 841,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 841,
  revealed_at: 841,
  aliases: ['Thatched Cottage'],
  thumbnail_url: '/assets/pixels/coiling-dragon/locations/loc-hongmeng-hut.svg',
};

// 4. Add Characters
cd.entities['augusta'] = {
  id: 'augusta',
  type: 'character',
  name: 'Chief Sovereign Augusta',
  aliases: ['Chief Sovereign of Light', 'Augusta'],
  description: 'The tyrannical Chief Sovereign of Light, master of the Radiant Church and possessor of Overgod artifacts, secretly the light clone of Chief Sovereign of Fate Orloff.',
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 720,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 720,
  revealed_at: 720,
  avatar_url: '/assets/pixels/coiling-dragon/avatars/augusta.svg',
};

cd.entities['hongmeng'] = {
  id: 'hongmeng',
  type: 'character',
  name: 'Hongmeng (Grandmist Controller)',
  aliases: ['Elder Brother Hongmeng', 'First Grandmist Controller'],
  description: "The first entity born of the primordial Grandmist Space and creator of the cosmos. Linley's sworn elder brother who wrote Linley's name into the Grandmist Canon.",
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 841,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
  first_appearance: 841,
  revealed_at: 841,
  avatar_url: '/assets/pixels/coiling-dragon/avatars/hongmeng.svg',
};

// 5. Update/Add Facts
if (cd.facts['fact-linley-highgod']) {
  cd.facts['fact-linley-highgod'].temporal.valid_to = 799;
}

cd.facts['fact-linley-sovereign'] = {
  id: 'fact-linley-sovereign',
  entity_id: 'linley-baruch',
  predicate: 'power_stage',
  value: 'stage-sovereign',
  temporal: {
    valid_from: 800,
    valid_to: 840,
    revealed_at: 800,
  },
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 800,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
};

cd.facts['fact-linley-grandmist'] = {
  id: 'fact-linley-grandmist',
  entity_id: 'linley-baruch',
  predicate: 'power_stage',
  value: 'stage-grandmist',
  temporal: {
    valid_from: 841,
    valid_to: null,
    revealed_at: 841,
  },
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 841,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
};

if (cd.facts['fact-power-beirut']) {
  cd.facts['fact-power-beirut'].temporal.valid_to = 749;
}

cd.facts['fact-power-beirut-sovereign'] = {
  id: 'fact-power-beirut-sovereign',
  entity_id: 'beirut',
  predicate: 'power_stage',
  value: 'stage-sovereign',
  temporal: {
    valid_from: 750,
    valid_to: null,
    revealed_at: 750,
  },
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 750,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
};

cd.facts['fact-power-augusta'] = {
  id: 'fact-power-augusta',
  entity_id: 'augusta',
  predicate: 'power_stage',
  value: 'stage-sovereign',
  temporal: {
    valid_from: 720,
    valid_to: null,
    revealed_at: 720,
  },
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 720,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
};

cd.facts['fact-power-hongmeng'] = {
  id: 'fact-power-hongmeng',
  entity_id: 'hongmeng',
  predicate: 'power_stage',
  value: 'stage-grandmist',
  temporal: {
    valid_from: 1,
    valid_to: null,
    revealed_at: 841,
  },
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 841,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
};

// 6. Add Relationships
cd.relationships['rel-linley-augusta'] = {
  id: 'rel-linley-augusta',
  source_id: 'linley-baruch',
  target_id: 'augusta',
  predicate: 'ENEMY_OF',
  label: 'Sovereign Nemesis',
  temporal: {
    valid_from: 750,
    valid_to: null,
    revealed_at: 750,
  },
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 750,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
};

cd.relationships['rel-beirut-augusta'] = {
  id: 'rel-beirut-augusta',
  source_id: 'beirut',
  target_id: 'augusta',
  predicate: 'ENEMY_OF',
  label: 'Ancient Sovereign Vendetta',
  temporal: {
    valid_from: 700,
    valid_to: null,
    revealed_at: 700,
  },
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 700,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
};

cd.relationships['rel-linley-hongmeng'] = {
  id: 'rel-linley-hongmeng',
  source_id: 'linley-baruch',
  target_id: 'hongmeng',
  predicate: 'ALLY_OF',
  label: 'Sworn Grandmist Brother',
  temporal: {
    valid_from: 841,
    valid_to: null,
    revealed_at: 841,
  },
  provenance: {
    source: {
      series: 'coiling-dragon',
      chapter: 841,
    },
    extracted_by: 'deterministic',
    confidence: 1,
    created_at: '2026-09-27T00:00:00Z',
  },
  canon_status: 'canon',
};

// Validate against CanonicalLoreGraphSchema
const parseResult = CanonicalLoreGraphSchema.safeParse(cd);
if (!parseResult.success) {
  console.error('Validation errors:', JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

fs.writeFileSync(filePath, JSON.stringify(cd, null, 2), 'utf-8');
console.log('Successfully enriched Coiling Dragon lore graph!');
