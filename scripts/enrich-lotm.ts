import * as fs from 'fs';
import * as path from 'path';

const filePath = path.resolve(process.cwd(), 'data/lord-of-the-mysteries/graph.json');
const lotm = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// 1. Configure Secret Identity Reveals
if (lotm.entities['klein-moretti']) {
  lotm.entities['klein-moretti'].name = 'The Fool / Klein Moretti';
  lotm.entities['klein-moretti'].reveals = [
    {
      revealed_at: 214,
      masked_name: 'Klein Moretti (Tingen Nighthawk)',
      true_identity: 'Sherlock Moriarty',
    },
    {
      revealed_at: 483,
      masked_name: 'Sherlock Moriarty (Backlund Detective)',
      true_identity: 'Gehrman Sparrow',
    },
    {
      revealed_at: 733,
      masked_name: 'Gehrman Sparrow (Crazy Adventurer)',
      true_identity: 'Dwayne Dantes',
    },
    {
      revealed_at: 1153,
      masked_name: 'Dwayne Dantes (Mayfair Tycoon)',
      true_identity: 'Merlin Hermes',
    },
    {
      revealed_at: 1380,
      masked_name: 'Merlin Hermes (Miracle Magician)',
      true_identity: 'The Fool / Lord of Mysteries',
    },
  ];
}

const otherReveals: Record<string, Array<{ revealed_at: number; masked_name: string; true_identity: string }>> = {
  'audrey-hall': [
    { revealed_at: 5, masked_name: 'Miss Audrey Hall (Loen Noble)', true_identity: 'Miss Justice (Tarot Club #1)' },
  ],
  'alger-wilson': [
    { revealed_at: 5, masked_name: 'Alger Wilson (Mandated Punisher)', true_identity: 'The Hanged Man (Tarot Club)' },
  ],
  'derrick-berg': [
    { revealed_at: 85, masked_name: 'Derrick Berg (City of Silver Youth)', true_identity: 'The Sun (Tarot Club)' },
  ],
  'fors-wall': [
    { revealed_at: 200, masked_name: 'Fors Wall (Backlund Author)', true_identity: 'The Magician (Tarot Club)' },
  ],
  'xio-derecha': [
    { revealed_at: 300, masked_name: 'Xio Derecha (Arbiter Bounty Hunter)', true_identity: 'Miss Judgment (Tarot Club)' },
  ],
  'emlyn-white': [
    { revealed_at: 350, masked_name: 'Emlyn White (Sanguine Pharmacist)', true_identity: 'The Moon (Tarot Club)' },
  ],
  'cattledya': [
    { revealed_at: 530, masked_name: 'Admiral of Stars Cattledya', true_identity: 'The Hermit (Tarot Club)' },
  ],
  'leonard-mitchell': [
    { revealed_at: 750, masked_name: 'Leonard Mitchell (Red Glove)', true_identity: 'The Star (Tarot Club)' },
  ],
  'in-zangwill': [
    { revealed_at: 210, masked_name: 'Archbishop Ince Zangwill (Archivist)', true_identity: 'The Traitor of 0-08 / Megose Mastermind' },
  ],
  'amon': [
    { revealed_at: 450, masked_name: 'Mysterious Monocle Scholar', true_identity: 'Amon (Blasphemer & Angel of Time)' },
  ],
  'adam': [
    { revealed_at: 480, masked_name: 'Priest in Simple Robes', true_identity: 'Adam (Angel of Imagination / The Author)' },
  ],
  'roselle-gustav': [
    { revealed_at: 100, masked_name: 'Emperor Roselle (Inventor of Steam)', true_identity: 'Corrupted Black Emperor / Ancient Reincarnator' },
  ],
};

for (const [charId, revs] of Object.entries(otherReveals)) {
  if (lotm.entities[charId]) {
    lotm.entities[charId].reveals = revs;
  }
}

// 2. Define the 22 Beyonder Pathways (type: 'ability')
const pathways: Array<{
  id: string;
  name: string;
  aliases: string[];
  description: string;
  first_appearance: number;
  revealed_at: number;
}> = [
  {
    id: 'pathway-fool',
    name: 'Fool Pathway (Seer)',
    aliases: ['Seer Pathway', 'Path of Mysteries', 'Door of Mysteries'],
    description: 'Governed by Sefirah Castle. Specializes in divination, marionette soul threads, historical void projections, miracle invocation, and grafting reality.',
    first_appearance: 1,
    revealed_at: 1,
  },
  {
    id: 'pathway-door',
    name: 'Door Pathway (Apprentice)',
    aliases: ['Apprentice Pathway', 'Path of Stars', 'Planeswalker'],
    description: 'Governed by Sefirah Castle. Specializes in spatial traversal, recording and casting external abilities, seal breaking, and cosmos exploration.',
    first_appearance: 180,
    revealed_at: 180,
  },
  {
    id: 'pathway-error',
    name: 'Error Pathway (Marauder)',
    aliases: ['Marauder Pathway', 'Path of Time', 'Trojan Horse'],
    description: 'Governed by Sefirah Castle. Specializes in stealing thoughts, abilities, fate, and time; creating parasitism avatars through Worms of Time.',
    first_appearance: 250,
    revealed_at: 250,
  },
  {
    id: 'pathway-visionary',
    name: 'Visionary Pathway (Spectator)',
    aliases: ['Spectator Pathway', 'Path of Mind', 'The Author'],
    description: 'Governed by Chaos Sea. Specializes in observing subconscious psychological trends, telepathic manipulation, placation, and authoring real history.',
    first_appearance: 2,
    revealed_at: 2,
  },
  {
    id: 'pathway-sun',
    name: 'Sun Pathway (Bard)',
    aliases: ['Bard Pathway', 'Path of Light', 'White Angel'],
    description: 'Governed by Chaos Sea. Specializes in absolute divine purification, banishing unholy spirits, notarizing contracts, and holy light shields.',
    first_appearance: 85,
    revealed_at: 85,
  },
  {
    id: 'pathway-tyrant',
    name: 'Tyrant Pathway (Sailor)',
    aliases: ['Sailor Pathway', 'Path of Storms', 'Sea King'],
    description: 'Governed by Chaos Sea. Specializes in aquatic dominance, acoustic sirens, catastrophic tempest summoning, and heavenly thunderbolts.',
    first_appearance: 2,
    revealed_at: 2,
  },
  {
    id: 'pathway-white-tower',
    name: 'White Tower Pathway (Reader)',
    aliases: ['Reader Pathway', 'Path of Wisdom', 'Cognizer'],
    description: 'Governed by Chaos Sea. Specializes in omniscience, rapid deciphering of mysticism secrets, analyzing weaknesses, and replicating spellcraft.',
    first_appearance: 200,
    revealed_at: 200,
  },
  {
    id: 'pathway-hanged-man',
    name: 'Hanged Man Pathway (Secrets Suppliant)',
    aliases: ['Secrets Suppliant Pathway', 'Path of Sacrifice', 'Shepherd'],
    description: 'Governed by Chaos Sea. Specializes in flesh and blood sacrifice, hearing cosmic ravings, shadow corruption, and grazing souls via Shepherd.',
    first_appearance: 10,
    revealed_at: 10,
  },
  {
    id: 'pathway-darkness',
    name: 'Darkness Pathway (Sleepless)',
    aliases: ['Sleepless Pathway', 'Path of Night', 'Concealment'],
    description: 'Governed by River of Eternal Darkness. Specializes in vigilance, nightmare induction, pacifying spirits, and conceptual concealment of truth.',
    first_appearance: 1,
    revealed_at: 1,
  },
  {
    id: 'pathway-death',
    name: 'Death Pathway (Corpse Collector)',
    aliases: ['Corpse Collector Pathway', 'Path of the Underworld', 'Undying'],
    description: 'Governed by River of Eternal Darkness. Specializes in spirit summoning, death manipulation, immunity to fatal wounds, and reincarnation through the River.',
    first_appearance: 5,
    revealed_at: 5,
  },
  {
    id: 'pathway-twilight-giant',
    name: 'Twilight Giant Pathway (Warrior)',
    aliases: ['Warrior Pathway', 'Path of Twilight', 'Silver Knight'],
    description: 'Governed by River of Eternal Darkness. Specializes in peerless martial weapon mastery, impenetrable twilight armor, and decay of divine constructs.',
    first_appearance: 85,
    revealed_at: 85,
  },
  {
    id: 'pathway-red-priest',
    name: 'Red Priest Pathway (Hunter)',
    aliases: ['Hunter Pathway', 'Path of War', 'Iron-blooded Knight'],
    description: 'Governed by City of Calamity. Specializes in provoker psychological agitation, pyromancy, army vanguard buffs, and continental-scale military warfare.',
    first_appearance: 380,
    revealed_at: 380,
  },
  {
    id: 'pathway-demoness',
    name: 'Demoness Pathway (Assassin)',
    aliases: ['Assassin Pathway', 'Path of Calamity', 'Witch'],
    description: 'Governed by City of Calamity. Specializes in stealth assassinations, seductive allure, black flame curses, disease spread, and cataclysmic disasters.',
    first_appearance: 150,
    revealed_at: 150,
  },
  {
    id: 'pathway-hermit',
    name: 'Hermit Pathway (Mystery Pryer)',
    aliases: ['Mystery Pryer Pathway', 'Path of Knowledge', 'Sage'],
    description: 'Governed by Knowledge Moor. Specializes in mysticism scroll infusion, astronomical divination, fairytales invocation, and comprehension of hidden symbols.',
    first_appearance: 530,
    revealed_at: 530,
  },
  {
    id: 'pathway-paragon',
    name: 'Paragon Pathway (Savant)',
    aliases: ['Savant Pathway', 'Path of Civilization', 'Artisan'],
    description: 'Governed by Knowledge Moor. Specializes in technological alchemy, steam machinery, discovering material essences, and constructing mystical artifacts.',
    first_appearance: 1,
    revealed_at: 1,
  },
  {
    id: 'pathway-wheel-of-fortune',
    name: 'Wheel of Fortune Pathway (Monster)',
    aliases: ['Monster Pathway', 'Path of Fate', 'Snake of Mercury'],
    description: 'Governed by Key of Light. Specializes in perceiving spiritual luck currents, manipulating probability, premonitions of danger, and fate reboots.',
    first_appearance: 230,
    revealed_at: 230,
  },
  {
    id: 'pathway-moon',
    name: 'Moon Pathway (Apothecary)',
    aliases: ['Apothecary Pathway', 'Path of the Sanguine', 'Beauty Goddess'],
    description: 'Governed by Brood Hive. Specializes in herbal potion concoctions, vampire blood transformations, beast taming, and crimson moon divine blessings.',
    first_appearance: 290,
    revealed_at: 290,
  },
  {
    id: 'pathway-mother',
    name: 'Mother Pathway (Planter)',
    aliases: ['Planter Pathway', 'Path of Life', 'Earth Mother'],
    description: 'Governed by Brood Hive. Specializes in botanical hybridization, healing wounds, biological flesh creation, and fostering planetary fertility.',
    first_appearance: 290,
    revealed_at: 290,
  },
  {
    id: 'pathway-chained',
    name: 'Chained Pathway (Prisoner)',
    aliases: ['Prisoner Pathway', 'Path of Restraint', 'Wraith'],
    description: 'Governed by Tenebrous World. Specializes in ascetic restraint, werewolf physical metamorphosis, ethereal wraith possession, and malevolent voodoo dolls.',
    first_appearance: 260,
    revealed_at: 260,
  },
  {
    id: 'pathway-abyss',
    name: 'Abyss Pathway (Criminal)',
    aliases: ['Criminal Pathway', 'Path of Corruption', 'Devil'],
    description: 'Governed by Tenebrous World. Specializes in malice premonition, sulfur flames, devil physical enhancements, blood contracts, and serial depravity.',
    first_appearance: 200,
    revealed_at: 200,
  },
  {
    id: 'pathway-black-emperor',
    name: 'Black Emperor Pathway (Lawyer)',
    aliases: ['Lawyer Pathway', 'Path of Disorder', 'Prince of Abolition'],
    description: 'Governed by Nation of Disorder. Specializes in exploiting systemic loopholes, bribery, psychological corruption, and distorting physical and legal rules.',
    first_appearance: 100,
    revealed_at: 100,
  },
  {
    id: 'pathway-justiciar',
    name: 'Justiciar Pathway (Arbiter)',
    aliases: ['Arbiter Pathway', 'Path of Order', 'Hand of Order'],
    description: 'Governed by Nation of Disorder. Specializes in natural authority intimidation, enforcing mandatory prohibitions, sentencing criminals, and sealing zones.',
    first_appearance: 180,
    revealed_at: 180,
  },
];

pathways.forEach(p => {
  lotm.entities[p.id] = {
    id: p.id,
    type: 'ability',
    name: p.name,
    aliases: p.aliases,
    description: p.description,
    provenance: {
      source: { series: 'lord-of-the-mysteries', chapter: p.first_appearance },
      extracted_by: 'deterministic',
      confidence: 1,
      created_at: '2026-09-28T00:00:00Z',
    },
    canon_status: 'canon',
    first_appearance: p.first_appearance,
    revealed_at: p.revealed_at,
  };
});

// 3. Add Pathway facts for all 28 characters
const charPathwayMap: Record<string, string> = {
  'klein-moretti': 'pathway-fool',
  'audrey-hall': 'pathway-visionary',
  'alger-wilson': 'pathway-tyrant',
  'derrick-berg': 'pathway-sun',
  'fors-wall': 'pathway-door',
  'xio-derecha': 'pathway-justiciar',
  'emlyn-white': 'pathway-moon',
  'cattledya': 'pathway-hermit',
  'leonard-mitchell': 'pathway-darkness',
  'amon': 'pathway-error',
  'adam': 'pathway-visionary',
  'dunn-smith': 'pathway-darkness',
  'daly-simone': 'pathway-death',
  'azik-eggers': 'pathway-death',
  'will-auceptin': 'pathway-wheel-of-fortune',
  'sharron': 'pathway-chained',
  'maric': 'pathway-chained',
  'in-zangwill': 'pathway-darkness',
  'medici': 'pathway-red-priest',
  'ouroboros': 'pathway-wheel-of-fortune',
  'pallez-zoroast': 'pathway-error',
  'reinette-tinekerr': 'pathway-chained',
  'bernadette-gustav': 'pathway-hermit',
  'roselle-gustav': 'pathway-black-emperor',
  'evernight-goddess': 'pathway-darkness',
  'lord-of-storms': 'pathway-tyrant',
  'god-of-steam': 'pathway-paragon',
  'true-creator': 'pathway-hanged-man',
};

for (const [charId, pathwayId] of Object.entries(charPathwayMap)) {
  const factId = `fact-pathway-${charId}`;
  lotm.facts[factId] = {
    id: factId,
    entity_id: charId,
    predicate: 'pathway',
    value: pathwayId,
    temporal: { valid_from: 1, valid_to: null, revealed_at: 1 },
    provenance: {
      source: { series: 'lord-of-the-mysteries', chapter: 1 },
      extracted_by: 'deterministic',
      confidence: 1,
      created_at: '2026-09-28T00:00:00Z',
    },
    canon_status: 'canon',
  };

  // Add POSSESSES relationship linking character to pathway ability
  const relId = `rel-pathway-${charId}`;
  lotm.relationships[relId] = {
    id: relId,
    source_id: charId,
    target_id: pathwayId,
    predicate: 'POSSESSES',
    label: 'Practicing Pathway',
    temporal: { valid_from: 1, valid_to: null, revealed_at: 1 },
    provenance: {
      source: { series: 'lord-of-the-mysteries', chapter: 1 },
      extracted_by: 'deterministic',
      confidence: 1,
      created_at: '2026-09-28T00:00:00Z',
    },
    canon_status: 'canon',
  };
}

fs.writeFileSync(filePath, JSON.stringify(lotm, null, 2), 'utf-8');
console.log('✓ Successfully enriched Lord of the Mysteries with 22 Pathways and 13 Secret Identity Reveals!');
