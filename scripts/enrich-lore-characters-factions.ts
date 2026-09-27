import * as fs from 'fs';
import * as path from 'path';

const dataDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../data');

// 1. Enrich One Piece
const opPath = path.join(dataDir, 'one-piece', 'graph.json');
const op = JSON.parse(fs.readFileSync(opPath, 'utf-8'));

// Define new characters
const newCharacters: any[] = [
  {
    id: 'franky',
    type: 'character',
    name: 'Franky',
    aliases: ['Cutty Flam', 'Cyborg Franky', 'Iron Man'],
    description: 'Straw Hat Pirates master shipwright and cyborg builder of the Thousand Sunny, dream to sail around the world aboard his dream ship.',
    provenance: { source: { series: 'one-piece', chapter: 329 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 329,
    revealed_at: 329,
  },
  {
    id: 'brook',
    type: 'character',
    name: 'Brook',
    aliases: ['Soul King', 'Humming Brook', 'Dead Bones'],
    description: 'Straw Hat Pirates musician and undead swordsman revived by the Revive-Revive Fruit, sworn to return to Laboon at Reverse Mountain.',
    provenance: { source: { series: 'one-piece', chapter: 442 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 442,
    revealed_at: 442,
  },
  {
    id: 'jinbe',
    type: 'character',
    name: 'Jinbe',
    aliases: ['Knight of the Sea', 'First Son of the Sea', 'Boss Jinbe'],
    description: 'Straw Hat Pirates helmsman and master of Fish-Man Karate, former Warlord and Sun Pirates captain dedicated to racial harmony.',
    provenance: { source: { series: 'one-piece', chapter: 528 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 528,
    revealed_at: 528,
  },
  {
    id: 'ace',
    type: 'character',
    name: 'Portgas D. Ace',
    aliases: ['Fire Fist Ace', 'Gol D. Ace'],
    description: 'Son of Pirate King Roger and Whitebeard 2nd Division Commander, sworn brother to Luffy and Sabo whose execution triggered the Summit War.',
    provenance: { source: { series: 'one-piece', chapter: 154 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 154,
    revealed_at: 154,
  },
  {
    id: 'sabo',
    type: 'character',
    name: 'Sabo',
    aliases: ['Flame Emperor', 'Lucy', 'Chief of Staff Sabo'],
    description: 'Revolutionary Army second-in-command and sworn brother to Luffy and Ace; inherited Ace’s Flame-Flame Fruit in Dressrosa.',
    provenance: { source: { series: 'one-piece', chapter: 583 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 583,
    revealed_at: 583,
  },
  {
    id: 'law',
    type: 'character',
    name: 'Trafalgar D. Water Law',
    aliases: ['Surgeon of Death', 'Trafalgar Law', 'Tra-guy'],
    description: 'Heart Pirates Captain, possessor of the Op-Op Fruit and bearer of the Will of D., partnered with Luffy to topple Doflamingo and Yonko Big Mom.',
    provenance: { source: { series: 'one-piece', chapter: 498 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 498,
    revealed_at: 498,
  },
  {
    id: 'kid',
    type: 'character',
    name: 'Eustass Kid',
    aliases: ['Captain Kid', 'Eustass Captain Kid'],
    description: 'Ferocious captain of the Kid Pirates wielding electromagnetic powers with the Magnet-Magnet Fruit; awakened to defeat Big Mom with Law.',
    provenance: { source: { series: 'one-piece', chapter: 498 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 498,
    revealed_at: 498,
  },
  {
    id: 'mihawk',
    type: 'character',
    name: 'Dracule Mihawk',
    aliases: ['Hawkeye Mihawk', 'World’s Greatest Swordsman'],
    description: 'The peerless swordsman wielding the Black Blade Yoru, former rival to Shanks and founding military force of Cross Guild.',
    provenance: { source: { series: 'one-piece', chapter: 49 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 49,
    revealed_at: 49,
  },
  {
    id: 'crocodile',
    type: 'character',
    name: 'Crocodile',
    aliases: ['Sir Crocodile', 'Mr. 0', 'Desert King'],
    description: 'Former Warlord and mastermind of Baroque Works; sand logia user who formed Cross Guild with Mihawk and Buggy.',
    provenance: { source: { series: 'one-piece', chapter: 126 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 126,
    revealed_at: 126,
  },
  {
    id: 'doflamingo',
    type: 'character',
    name: 'Donquixote Doflamingo',
    aliases: ['Heavenly Yaksha', 'Joker', 'Charisma of Evil'],
    description: 'Former Celestial Dragon and Warlord who ruled Dressrosa through the String-String Fruit and supplied Kaido with artificial SMILE fruits.',
    provenance: { source: { series: 'one-piece', chapter: 233 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 233,
    revealed_at: 233,
  },
  {
    id: 'big-mom',
    type: 'character',
    name: 'Charlotte Linlin',
    aliases: ['Big Mom', 'Linlin', 'Soul Queen'],
    description: 'Former Yonko matriarch of the Charlotte Family ruling Totto Land with the Soul-Soul Fruit and formidable natural invulnerability.',
    provenance: { source: { series: 'one-piece', chapter: 651 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 651,
    revealed_at: 651,
  },
  {
    id: 'garp',
    type: 'character',
    name: 'Monkey D. Garp',
    aliases: ['Hero of the Marines', 'Garp the Fist', 'Demon Fist'],
    description: 'Legendary Marine Vice Admiral who cornered Gol D. Roger, grandfather to Luffy and father of Revolutionary Dragon.',
    provenance: { source: { series: 'one-piece', chapter: 92 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 92,
    revealed_at: 92,
  },
  {
    id: 'aokiji',
    type: 'character',
    name: 'Kuzan',
    aliases: ['Aokiji', 'Blue Pheasant'],
    description: 'Former Marine Admiral wielding Ice-Ice powers who clashed with Akainu on Punk Hazard, now allied with the Blackbeard Pirates.',
    provenance: { source: { series: 'one-piece', chapter: 303 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 303,
    revealed_at: 303,
  },
  {
    id: 'kizaru',
    type: 'character',
    name: 'Borsalino',
    aliases: ['Kizaru', 'Yellow Monkey'],
    description: 'Marine Admiral with Glint-Glint light powers who devastated the Supernovas at Sabaody and spearheaded the Marine siege on Egghead.',
    provenance: { source: { series: 'one-piece', chapter: 504 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 504,
    revealed_at: 504,
  },
  {
    id: 'fujitora',
    type: 'character',
    name: 'Issho',
    aliases: ['Fujitora', 'Purple Tiger'],
    description: 'Blind Marine Admiral wielding gravitational manipulation through the Press-Press Fruit; abolished the Seven Warlords system.',
    provenance: { source: { series: 'one-piece', chapter: 701 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 701,
    revealed_at: 701,
  },
  {
    id: 'rayleigh',
    type: 'character',
    name: 'Silvers Rayleigh',
    aliases: ['Dark King', 'Right Hand of the Pirate King'],
    description: 'First Mate of the Roger Pirates and master of all three forms of Haki who mentored Luffy through the two-year timeskip.',
    provenance: { source: { series: 'one-piece', chapter: 500 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 500,
    revealed_at: 500,
  },
  {
    id: 'buggy',
    type: 'character',
    name: 'Buggy',
    aliases: ['Buggy the Star Clown', 'Genius Jester Buggy', 'Yonko Buggy'],
    description: 'Former Roger apprentice and Chop-Chop Fruit user whose absurd fortune elevated him to Warlord, Cross Guild figurehead, and Yonko.',
    provenance: { source: { series: 'one-piece', chapter: 9 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 9,
    revealed_at: 9,
  },
  {
    id: 'hancock',
    type: 'character',
    name: 'Boa Hancock',
    aliases: ['Pirate Empress', 'Snake Princess'],
    description: 'Ruler of Amazon Lily and Kuja Pirates captain wielding the Love-Love Fruit; deeply infatuated with and protective of Luffy.',
    provenance: { source: { series: 'one-piece', chapter: 516 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 516,
    revealed_at: 516,
  },
  {
    id: 'yamato',
    type: 'character',
    name: 'Yamato',
    aliases: ['Demon Princess', 'Son of Kaido', 'Kozuki Oden'],
    description: 'Kaido’s child inspired by Oden’s journal; wields the Mythical Zoan Okuchi no Makami and fought beside Luffy to liberate Wano.',
    provenance: { source: { series: 'one-piece', chapter: 971 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 971,
    revealed_at: 971,
  },
  {
    id: 'oden',
    type: 'character',
    name: 'Kozuki Oden',
    aliases: ['Lord Oden', 'Daimyo of Kuri'],
    description: 'Beloved samurai daimyo of Kuri who sailed with Whitebeard and Roger, deciphered the Poneglyphs, and sacrificed himself in boiling oil.',
    provenance: { source: { series: 'one-piece', chapter: 920 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 920,
    revealed_at: 920,
  },
  {
    id: 'smoker',
    type: 'character',
    name: 'Smoker',
    aliases: ['White Hunter Smoker', 'Smoke Man'],
    description: 'Unyielding Marine Vice Admiral wielding the Plume-Plume Fruit who pursued the Straw Hats from Loguetown through the New World.',
    provenance: { source: { series: 'one-piece', chapter: 97 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 97,
    revealed_at: 97,
  },
  {
    id: 'lucci',
    type: 'character',
    name: 'Rob Lucci',
    aliases: ['Killing Machine', 'CP0 Lucci'],
    description: 'Ruthless leader of CP0 wielding the Cat-Cat Fruit Leopard model; fought Luffy in Enies Lobby and Egghead under Absolute Justice.',
    provenance: { source: { series: 'one-piece', chapter: 323 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 323,
    revealed_at: 323,
  },
  {
    id: 'kuma',
    type: 'character',
    name: 'Bartholomew Kuma',
    aliases: ['Kuma the Tyrant', 'Pacifista PX-0'],
    description: 'Former King of Sorbet Kingdom, Revolutionary founder, and Paw-Paw Fruit user who saved the Straw Hats by scattering them across the world.',
    provenance: { source: { series: 'one-piece', chapter: 233 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 233,
    revealed_at: 233,
  },
  {
    id: 'enel',
    type: 'character',
    name: 'Enel',
    aliases: ['God Enel', 'Kami Enel'],
    description: 'Self-proclaimed God of Skypiea wielding the Rumble-Rumble Fruit lightning powers who constructed the Ark Maxim to travel to the Fairy Vearth.',
    provenance: { source: { series: 'one-piece', chapter: 254 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 254,
    revealed_at: 254,
  },
];

newCharacters.forEach(c => {
  op.entities[c.id] = c;
});

// Define One Piece Factions
const opFactions: any[] = [
  {
    id: 'faction-straw-hats',
    type: 'faction',
    name: 'Straw Hat Pirates',
    aliases: ['Mugiwara Pirates', 'Straw Hat Grand Fleet'],
    description: 'Pirate crew formed in East Blue led by Monkey D. Luffy, aiming for Laugh Tale with a global bounty exceeding 8.8 billion berries.',
    provenance: { source: { series: 'one-piece', chapter: 1 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 1,
    revealed_at: 1,
  },
  {
    id: 'faction-marines',
    type: 'faction',
    name: 'Marines',
    aliases: ['Navy', 'World Government Naval Force'],
    description: 'The military sea-power enforcement branch of the World Government maintaining global order under the banner of Absolute Justice.',
    provenance: { source: { series: 'one-piece', chapter: 3 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 3,
    revealed_at: 3,
  },
  {
    id: 'faction-revolutionaries',
    type: 'faction',
    name: 'Revolutionary Army',
    aliases: ['Freedom Fighters', 'Rebel Army'],
    description: 'Global clandestine movement commanded by Monkey D. Dragon dedicated to overthrowing the tyrannical Celestial Dragons.',
    provenance: { source: { series: 'one-piece', chapter: 100 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 100,
    revealed_at: 100,
  },
  {
    id: 'faction-whitebeard',
    type: 'faction',
    name: 'Whitebeard Pirates',
    aliases: ['Edward Newgate Fleet'],
    description: 'Legendary Yonko armada treating all crew members as sons of ‘Pops’ Edward Newgate; ruled the New World for decades.',
    provenance: { source: { series: 'one-piece', chapter: 234 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 234,
    revealed_at: 234,
  },
  {
    id: 'faction-blackbeard',
    type: 'faction',
    name: 'Blackbeard Pirates',
    aliases: ['Teach Pirates', 'Ten Titanic Captains'],
    description: 'Ruthless rising Yonko fleet led by Marshall D. Teach, hunting powerful Devil Fruits across the seas from Hachinosu Island.',
    provenance: { source: { series: 'one-piece', chapter: 223 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 223,
    revealed_at: 223,
  },
  {
    id: 'faction-red-hair',
    type: 'faction',
    name: 'Red Hair Pirates',
    aliases: ['Shanks Pirates'],
    description: 'Elite balanced Yonko crew led by Red-Haired Shanks known for impenetrable Haki mastery and peaceful diplomacy.',
    provenance: { source: { series: 'one-piece', chapter: 1 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 1,
    revealed_at: 1,
  },
  {
    id: 'faction-beast',
    type: 'faction',
    name: 'Beasts Pirates',
    aliases: ['Kaido Pirates', 'Animal Kingdom Pirates'],
    description: 'Brutal militaristic empire occupying Wano Country led by Governor-General Kaido and Three All-Stars.',
    provenance: { source: { series: 'one-piece', chapter: 795 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 795,
    revealed_at: 795,
  },
  {
    id: 'faction-big-mom',
    type: 'faction',
    name: 'Big Mom Pirates',
    aliases: ['Charlotte Family'],
    description: 'Formidable candy-themed family pirate empire ruling 35 islands of Totto Land under Charlotte Linlin.',
    provenance: { source: { series: 'one-piece', chapter: 651 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 651,
    revealed_at: 651,
  },
  {
    id: 'faction-cross-guild',
    type: 'faction',
    name: 'Cross Guild',
    aliases: ['Marine Hunters Guild'],
    description: 'Startling organization formed by Crocodile and Mihawk with Buggy as figurehead, placing reverse bounties on Marine officers.',
    provenance: { source: { series: 'one-piece', chapter: 1056 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 1056,
    revealed_at: 1056,
  },
  {
    id: 'faction-heart',
    type: 'faction',
    name: 'Heart Pirates',
    aliases: ['Trafalgar Law Pirates'],
    description: 'Submarine crew led by Surgeon of Death Trafalgar Law, operating the Polar Tang and sworn to avenge Donquixote Rosinante.',
    provenance: { source: { series: 'one-piece', chapter: 498 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 498,
    revealed_at: 498,
  },
];

opFactions.forEach(f => {
  op.entities[f.id] = f;
});

// Add Power Stages & Faction Affiliation facts
const charFactions: Record<string, { faction: string; stage: string; chapter: number }> = {
  franky: { faction: 'faction-straw-hats', stage: 'stage-grandline', chapter: 329 },
  brook: { faction: 'faction-straw-hats', stage: 'stage-grandline', chapter: 442 },
  jinbe: { faction: 'faction-straw-hats', stage: 'stage-newworld', chapter: 528 },
  ace: { faction: 'faction-whitebeard', stage: 'stage-newworld', chapter: 154 },
  sabo: { faction: 'faction-revolutionaries', stage: 'stage-newworld', chapter: 583 },
  law: { faction: 'faction-heart', stage: 'stage-newworld', chapter: 498 },
  kid: { faction: 'faction-heart', stage: 'stage-newworld', chapter: 498 },
  mihawk: { faction: 'faction-cross-guild', stage: 'stage-yonko', chapter: 49 },
  crocodile: { faction: 'faction-cross-guild', stage: 'stage-newworld', chapter: 126 },
  doflamingo: { faction: 'faction-beast', stage: 'stage-newworld', chapter: 233 },
  'big-mom': { faction: 'faction-big-mom', stage: 'stage-yonko', chapter: 651 },
  garp: { faction: 'faction-marines', stage: 'stage-yonko', chapter: 92 },
  aokiji: { faction: 'faction-marines', stage: 'stage-yonko', chapter: 303 },
  kizaru: { faction: 'faction-marines', stage: 'stage-yonko', chapter: 504 },
  fujitora: { faction: 'faction-marines', stage: 'stage-yonko', chapter: 701 },
  rayleigh: { faction: 'faction-red-hair', stage: 'stage-yonko', chapter: 500 },
  buggy: { faction: 'faction-cross-guild', stage: 'stage-yonko', chapter: 9 },
  hancock: { faction: 'faction-straw-hats', stage: 'stage-newworld', chapter: 516 },
  yamato: { faction: 'faction-straw-hats', stage: 'stage-newworld', chapter: 971 },
  oden: { faction: 'faction-whitebeard', stage: 'stage-yonko', chapter: 920 },
  smoker: { faction: 'faction-marines', stage: 'stage-grandline', chapter: 97 },
  lucci: { faction: 'faction-marines', stage: 'stage-newworld', chapter: 323 },
  kuma: { faction: 'faction-revolutionaries', stage: 'stage-newworld', chapter: 233 },
  enel: { faction: 'faction-beast', stage: 'stage-grandline', chapter: 254 },
  // Existing Straw Hats faction links
  luffy: { faction: 'faction-straw-hats', stage: 'stage-yonko', chapter: 1044 },
  zoro: { faction: 'faction-straw-hats', stage: 'stage-newworld', chapter: 3 },
  nami: { faction: 'faction-straw-hats', stage: 'stage-grandline', chapter: 8 },
  usopp: { faction: 'faction-straw-hats', stage: 'stage-grandline', chapter: 23 },
  sanji: { faction: 'faction-straw-hats', stage: 'stage-newworld', chapter: 43 },
  chopper: { faction: 'faction-straw-hats', stage: 'stage-grandline', chapter: 134 },
  robin: { faction: 'faction-straw-hats', stage: 'stage-grandline', chapter: 114 },
  shanks: { faction: 'faction-red-hair', stage: 'stage-yonko', chapter: 1 },
  whitebeard: { faction: 'faction-whitebeard', stage: 'stage-yonko', chapter: 234 },
  blackbeard: { faction: 'faction-blackbeard', stage: 'stage-yonko', chapter: 223 },
  kaido: { faction: 'faction-beast', stage: 'stage-yonko', chapter: 795 },
  akainu: { faction: 'faction-marines', stage: 'stage-yonko', chapter: 397 },
  dragon: { faction: 'faction-revolutionaries', stage: 'stage-yonko', chapter: 100 },
  roger: { faction: 'faction-straw-hats', stage: 'stage-pirateking', chapter: 1 },
};

Object.entries(charFactions).forEach(([charId, data]) => {
  // Faction fact
  op.facts[`fact-faction-${charId}`] = {
    id: `fact-faction-${charId}`,
    entity_id: charId,
    predicate: 'faction',
    value: data.faction,
    temporal: { valid_from: data.chapter, valid_to: null, revealed_at: data.chapter },
    provenance: { source: { series: 'one-piece', chapter: data.chapter }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
  };

  // Power stage fact
  if (!op.facts[`fact-power-${charId}`]) {
    op.facts[`fact-power-${charId}`] = {
      id: `fact-power-${charId}`,
      entity_id: charId,
      predicate: 'power_stage',
      value: data.stage,
      temporal: { valid_from: data.chapter, valid_to: null, revealed_at: data.chapter },
      provenance: { source: { series: 'one-piece', chapter: data.chapter }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
      canon_status: 'canon',
    };
  }
});

// Relationships
const newRelationships: any[] = [
  { id: 'rel-luffy-ace', source: 'luffy', target: 'ace', predicate: 'sworn_brother', label: 'Sworn Brother', valid_from: 154 },
  { id: 'rel-luffy-sabo', source: 'luffy', target: 'sabo', predicate: 'sworn_brother', label: 'Sworn Brother', valid_from: 583 },
  { id: 'rel-ace-sabo', source: 'ace', target: 'sabo', predicate: 'sworn_brother', label: 'Sworn Brother', valid_from: 583 },
  { id: 'rel-garp-luffy', source: 'garp', target: 'luffy', predicate: 'grandfather_of', label: 'Grandfather', valid_from: 92 },
  { id: 'rel-garp-dragon', source: 'garp', target: 'dragon', predicate: 'father_of', label: 'Father', valid_from: 432 },
  { id: 'rel-dragon-luffy', source: 'dragon', target: 'luffy', predicate: 'father_of', label: 'Father', valid_from: 100 },
  { id: 'rel-shanks-luffy', source: 'shanks', target: 'luffy', predicate: 'role_model_for', label: 'Inspiration & Hat Giver', valid_from: 1 },
  { id: 'rel-mihawk-zoro', source: 'mihawk', target: 'zoro', predicate: 'rival_and_master', label: 'Swordsmanship Master & Goal', valid_from: 49 },
  { id: 'rel-whitebeard-ace', source: 'whitebeard', target: 'ace', predicate: 'adoptive_father_of', label: 'Captain & Father', valid_from: 154 },
  { id: 'rel-roger-rayleigh', source: 'roger', target: 'rayleigh', predicate: 'right_hand_of', label: 'First Mate & Partner', valid_from: 500 },
  { id: 'rel-roger-shanks', source: 'roger', target: 'shanks', predicate: 'apprentice_of', label: 'Cabin Boy & Mentee', valid_from: 19 },
  { id: 'rel-roger-buggy', source: 'roger', target: 'buggy', predicate: 'apprentice_of', label: 'Cabin Boy & Mentee', valid_from: 19 },
  { id: 'rel-law-luffy', source: 'law', target: 'luffy', predicate: 'pirate_alliance', label: 'Yonko-Toppling Alliance', valid_from: 668 },
  { id: 'rel-hancock-luffy', source: 'hancock', target: 'luffy', predicate: 'infatuated_with', label: 'Protector & Devotee', valid_from: 516 },
  { id: 'rel-kaido-yamato', source: 'kaido', target: 'yamato', predicate: 'father_of', label: 'Father & Adversary', valid_from: 971 },
  { id: 'rel-oden-roger', source: 'oden', target: 'roger', predicate: 'allied_crewmate', label: 'Poneglyph Reader & Crew', valid_from: 966 },
  { id: 'rel-kuma-dragon', source: 'kuma', target: 'dragon', predicate: 'founding_revolutionary', label: 'Revolutionary Comrade', valid_from: 233 },
  { id: 'rel-buggy-croc', source: 'buggy', target: 'crocodile', predicate: 'cross_guild_partner', label: 'Cross Guild Partner', valid_from: 1056 },
  { id: 'rel-buggy-mihawk', source: 'buggy', target: 'mihawk', predicate: 'cross_guild_partner', label: 'Cross Guild Partner', valid_from: 1056 },
  { id: 'rel-akainu-aokiji', source: 'akainu', target: 'aokiji', predicate: 'duel_adversary', label: 'Punk Hazard Duelist', valid_from: 650 },
  // Straw Hat crew bonds
  { id: 'rel-luffy-franky', source: 'luffy', target: 'franky', predicate: 'crew_mate', label: 'Shipwright', valid_from: 329 },
  { id: 'rel-luffy-brook', source: 'luffy', target: 'brook', predicate: 'crew_mate', label: 'Musician', valid_from: 442 },
  { id: 'rel-luffy-jinbe', source: 'luffy', target: 'jinbe', predicate: 'crew_mate', label: 'Helmsman', valid_from: 528 },
];

newRelationships.forEach(r => {
  op.relationships[r.id] = {
    id: r.id,
    source_id: r.source,
    target_id: r.target,
    predicate: r.predicate,
    label: r.label,
    temporal: { valid_from: r.valid_from, valid_to: null, revealed_at: r.valid_from },
    provenance: { source: { series: 'one-piece', chapter: r.valid_from }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
  };
});

fs.writeFileSync(opPath, JSON.stringify(op, null, 2), 'utf-8');
console.log('✓ One Piece enriched with 24 new characters, 10 factions, and 23 new relationships!');

// 2. Enrich Demonic Emperor Factions
const dePath = path.join(dataDir, 'demonic-emperor', 'graph.json');
const de = JSON.parse(fs.readFileSync(dePath, 'utf-8'));
const deFactions = [
  { id: 'faction-luo', name: 'Luo Clan', desc: 'Rising Third-Rate Clan of Windfall City led by Zhuo Fan to conquer Tianyu Empire.' },
  { id: 'faction-regent', name: 'Regent Estate', desc: 'Supreme Noble House commanding the 7 Houses of Tianyu with iron ambition.' },
  { id: 'faction-drifting-flowers', name: 'Drifting Flowers Edifice', desc: 'All-female noble house masters of ice and flower arts led by Chu Qingcheng.' },
  { id: 'faction-sword-marquise', name: 'Sword Marquise Abode', desc: 'Noble House of peerless sword dao fanatics led by Xie Tianshang.' },
  { id: 'faction-veiled-dragon', name: 'Veiled Dragon Pavilion', desc: 'Commercial superpower house and steadfast early ally to the Luo Clan.' },
  { id: 'faction-hell-valley', name: 'Hell Valley', desc: 'Sinister House masters of poison, shadows, and ruthless subterranean warfare.' },
];

deFactions.forEach(f => {
  de.entities[f.id] = {
    id: f.id,
    type: 'faction',
    name: f.name,
    aliases: [f.name],
    description: f.desc,
    provenance: { source: { series: 'demonic-emperor', chapter: 1 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 1,
    revealed_at: 1,
  };
});

// Demonic Emperor character-faction affiliations
const deCharFactions: Record<string, string> = {
  'zhuo-fan': 'faction-luo',
  'luo-yunchang': 'faction-luo',
  'luo-yunhai': 'faction-luo',
  'chu-qingcheng': 'faction-drifting-flowers',
  'long-jiu': 'faction-veiled-dragon',
  'you-guiqi': 'faction-hell-valley',
  'huangpu-qingtian': 'faction-regent',
  'zhuge-changfeng': 'faction-regent',
  'xie-tianshang': 'faction-sword-marquise',
};

Object.entries(deCharFactions).forEach(([charId, factionId]) => {
  de.facts[`fact-faction-${charId}`] = {
    id: `fact-faction-${charId}`,
    entity_id: charId,
    predicate: 'faction',
    value: factionId,
    temporal: { valid_from: 1, valid_to: null, revealed_at: 1 },
    provenance: { source: { series: 'demonic-emperor', chapter: 1 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
  };
});

fs.writeFileSync(dePath, JSON.stringify(de, null, 2), 'utf-8');
console.log('✓ Demonic Emperor enriched with 6 factions and affiliations!');

// 3. Enrich Coiling Dragon Factions
const cdPath = path.join(dataDir, 'coiling-dragon', 'graph.json');
const cd = JSON.parse(fs.readFileSync(cdPath, 'utf-8'));
const cdFactions = [
  { id: 'faction-baruch', name: 'Baruch Dragonblood Clan', desc: 'Ancient lineage of Supreme Supreme Dragonblood Warriors.' },
  { id: 'faction-beirut', name: 'Beirut Domain', desc: 'Beirut’s forest realm and divine beasts sovereign lineage.' },
  { id: 'faction-four-beasts', name: 'Four Divine Beasts Clan', desc: 'Infernal Realm mega-clan descended from Azure Dragon, White Tiger, Black Tortoise, and Vermilion Bird.' },
  { id: 'faction-radiant-church', name: 'Holy Union (Radiant Church)', desc: 'Dominant theocratic superpower of the Yulan Material Plane.' },
];

cdFactions.forEach(f => {
  cd.entities[f.id] = {
    id: f.id,
    type: 'faction',
    name: f.name,
    aliases: [f.name],
    description: f.desc,
    provenance: { source: { series: 'coiling-dragon', chapter: 1 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
    first_appearance: 1,
    revealed_at: 1,
  };
});

const cdCharFactions: Record<string, string> = {
  'linley-baruch': 'faction-baruch',
  'bebe': 'faction-beirut',
  'beirut': 'faction-beirut',
  'delia': 'faction-baruch',
};

Object.entries(cdCharFactions).forEach(([charId, factionId]) => {
  cd.facts[`fact-faction-${charId}`] = {
    id: `fact-faction-${charId}`,
    entity_id: charId,
    predicate: 'faction',
    value: factionId,
    temporal: { valid_from: 1, valid_to: null, revealed_at: 1 },
    provenance: { source: { series: 'coiling-dragon', chapter: 1 }, extracted_by: 'deterministic', confidence: 1, created_at: '2026-09-27T00:00:00Z' },
    canon_status: 'canon',
  };
});

fs.writeFileSync(cdPath, JSON.stringify(cd, null, 2), 'utf-8');
console.log('✓ Coiling Dragon enriched with 4 factions and affiliations!');
