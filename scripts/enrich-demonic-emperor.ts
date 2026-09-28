import * as fs from 'fs';
import * as path from 'path';

const filePath = path.resolve(process.cwd(), 'data/demonic-emperor/graph.json');
const de = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// Power Stages for Demonic Emperor Characters:
const charStages: Record<string, Array<{ stage: string; from: number; to: number | null }>> = {
  'luo-yunchang': [
    { stage: 'stage-qi-condensation', from: 1, to: 84 },
    { stage: 'stage-bone-tempering', from: 85, to: 330 },
    { stage: 'stage-profound-heaven', from: 331, to: 650 },
    { stage: 'stage-radiant', from: 651, to: null },
  ],
  'luo-yunhai': [
    { stage: 'stage-foundation', from: 1, to: 84 },
    { stage: 'stage-bone-tempering', from: 85, to: 330 },
    { stage: 'stage-profound-heaven', from: 331, to: 650 },
    { stage: 'stage-radiant', from: 651, to: null },
  ],
  'li-jingtian': [
    { stage: 'stage-radiant', from: 1, to: 650 },
    { stage: 'stage-ethereal', from: 651, to: null },
  ],
  'xue-qingjian': [
    { stage: 'stage-radiant', from: 100, to: 700 },
    { stage: 'stage-ethereal', from: 701, to: null },
  ],
  'qiu-yanhai': [
    { stage: 'stage-radiant', from: 100, to: 700 },
    { stage: 'stage-ethereal', from: 701, to: null },
  ],
  'yan-song': [
    { stage: 'stage-profound-heaven', from: 80, to: 250 },
    { stage: 'stage-radiant', from: 251, to: null },
  ],
  'captain-pang': [
    { stage: 'stage-foundation', from: 1, to: 84 },
    { stage: 'stage-qi-condensation', from: 85, to: 350 },
    { stage: 'stage-bone-tempering', from: 351, to: null },
  ],
  'lei-yuting': [
    { stage: 'stage-qi-condensation', from: 1, to: 84 },
    { stage: 'stage-bone-tempering', from: 85, to: 350 },
    { stage: 'stage-profound-heaven', from: 351, to: null },
  ],
  'huangpu-qingtian': [
    { stage: 'stage-profound-heaven', from: 180, to: null },
  ],
  'huangpu-tianyuan': [
    { stage: 'stage-radiant', from: 1, to: 350 },
    { stage: 'stage-ethereal', from: 351, to: null },
  ],
  'leng-wuchang': [
    { stage: 'stage-profound-heaven', from: 1, to: null },
  ],
  'huangpu-qingyun': [
    { stage: 'stage-bone-tempering', from: 80, to: null },
  ],
  'chu-qingcheng': [
    { stage: 'stage-profound-heaven', from: 80, to: 330 },
    { stage: 'stage-radiant', from: 331, to: 750 },
    { stage: 'stage-ethereal', from: 751, to: null },
  ],
  'xiao-dandan': [
    { stage: 'stage-bone-tempering', from: 80, to: 330 },
    { stage: 'stage-profound-heaven', from: 331, to: null },
  ],
  'chu-bijun': [
    { stage: 'stage-radiant', from: 80, to: null },
  ],
  'long-jiu': [
    { stage: 'stage-bone-tempering', from: 1, to: 84 },
    { stage: 'stage-profound-heaven', from: 85, to: 490 },
    { stage: 'stage-radiant', from: 491, to: null },
  ],
  'long-yifei': [
    { stage: 'stage-radiant', from: 1, to: null },
  ],
  'long-kui': [
    { stage: 'stage-qi-condensation', from: 1, to: 84 },
    { stage: 'stage-bone-tempering', from: 85, to: null },
  ],
  'xie-tianshang': [
    { stage: 'stage-profound-heaven', from: 180, to: 330 },
    { stage: 'stage-radiant', from: 331, to: 650 },
    { stage: 'stage-ethereal', from: 651, to: null },
  ],
  'xie-tianyang': [
    { stage: 'stage-bone-tempering', from: 1, to: 180 },
    { stage: 'stage-profound-heaven', from: 181, to: null },
  ],
  'xie-xiaofeng': [
    { stage: 'stage-radiant', from: 1, to: null },
  ],
  'you-guiqi': [
    { stage: 'stage-profound-heaven', from: 1, to: null },
  ],
  'you-guishan': [
    { stage: 'stage-radiant', from: 1, to: null },
  ],
  'you-quan': [
    { stage: 'stage-bone-tempering', from: 1, to: null },
  ],
  'yan-bogong': [
    { stage: 'stage-radiant', from: 80, to: null },
  ],
  'yan-fu': [
    { stage: 'stage-bone-tempering', from: 80, to: 330 },
    { stage: 'stage-profound-heaven', from: 331, to: null },
  ],
  'lin-rufeng': [
    { stage: 'stage-radiant', from: 180, to: null },
  ],
  'yuwen-feng': [
    { stage: 'stage-bone-tempering', from: 180, to: null },
  ],
  'yuwen-cong': [
    { stage: 'stage-qi-condensation', from: 180, to: 330 },
    { stage: 'stage-bone-tempering', from: 331, to: null },
  ],
  'zhuge-changfeng': [
    { stage: 'stage-profound-heaven', from: 1, to: null },
  ],
  'dugu-zhantian': [
    { stage: 'stage-radiant', from: 180, to: null },
  ],
  'dugu-four-tigers': [
    { stage: 'stage-profound-heaven', from: 180, to: null },
  ],
  'xie-wuyue': [
    { stage: 'stage-ethereal', from: 491, to: null },
  ],
  'yuan-xinggang': [
    { stage: 'stage-soul-harmony', from: 491, to: null },
  ],
  'ye-lin': [
    { stage: 'stage-ethereal', from: 491, to: 750 },
    { stage: 'stage-soul-harmony', from: 751, to: null },
  ],
  'danqing-shen': [
    { stage: 'stage-soul-harmony', from: 491, to: 900 },
    { stage: 'stage-genesis', from: 901, to: null },
  ],
  'wu-qingqiu': [
    { stage: 'stage-ethereal', from: 491, to: null },
  ],
  'double-dragon-exalted': [
    { stage: 'stage-soul-harmony', from: 491, to: null },
  ],
  'baili-yutian': [
    { stage: 'stage-genesis', from: 751, to: null },
  ],
  'baili-jingwei': [
    { stage: 'stage-soul-harmony', from: 751, to: null },
  ],
  'baili-yuyu': [
    { stage: 'stage-soul-harmony', from: 751, to: null },
  ],
  'kunpeng': [
    { stage: 'stage-saint', from: 1, to: null },
  ],
  'nine-serenities-emperor': [
    { stage: 'stage-sovereign', from: 1, to: null },
  ],
  'zhao-chen': [
    { stage: 'stage-saint', from: 1, to: null },
  ],
};

// Add power stage facts
let stageFactCount = 0;
for (const [charId, stages] of Object.entries(charStages)) {
  stages.forEach((s, idx) => {
    const factId = `fact-power-${charId}-${idx + 1}`;
    de.facts[factId] = {
      id: factId,
      entity_id: charId,
      predicate: 'power_stage',
      value: s.stage,
      temporal: { valid_from: s.from, valid_to: s.to, revealed_at: s.from },
      provenance: {
        source: { series: 'demonic-emperor', chapter: s.from },
        extracted_by: 'deterministic',
        confidence: 1,
        created_at: '2026-09-28T00:00:00Z',
      },
      canon_status: 'canon',
    };
    stageFactCount++;
  });
}

// Faction mapping for 34 characters:
const charFactions: Record<string, { faction: string; chapter: number }> = {
  'xue-qingjian': { faction: 'faction-luo', chapter: 100 },
  'qiu-yanhai': { faction: 'faction-luo', chapter: 100 },
  'yan-song': { faction: 'faction-luo', chapter: 120 },
  'captain-pang': { faction: 'faction-luo', chapter: 1 },
  'lei-yuting': { faction: 'faction-luo', chapter: 1 },
  'huangpu-tianyuan': { faction: 'faction-regent', chapter: 1 },
  'leng-wuchang': { faction: 'faction-regent', chapter: 1 },
  'huangpu-qingyun': { faction: 'faction-regent', chapter: 80 },
  'xiao-dandan': { faction: 'faction-drifting-flowers', chapter: 80 },
  'chu-bijun': { faction: 'faction-drifting-flowers', chapter: 80 },
  'long-yifei': { faction: 'faction-veiled-dragon', chapter: 1 },
  'long-kui': { faction: 'faction-veiled-dragon', chapter: 1 },
  'xie-tianyang': { faction: 'faction-sword-marquise', chapter: 1 },
  'xie-xiaofeng': { faction: 'faction-sword-marquise', chapter: 1 },
  'you-guishan': { faction: 'faction-hell-valley', chapter: 1 },
  'you-quan': { faction: 'faction-hell-valley', chapter: 1 },
  'yan-bogong': { faction: 'faction-pill-king', chapter: 80 },
  'yan-fu': { faction: 'faction-luo', chapter: 180 },
  'lin-rufeng': { faction: 'faction-merry-woods', chapter: 180 },
  'yuwen-feng': { faction: 'faction-tianyu-imperial', chapter: 180 },
  'yuwen-cong': { faction: 'faction-tianyu-imperial', chapter: 180 },
  'zhuge-changfeng': { faction: 'faction-tianyu-imperial', chapter: 1 },
  'dugu-zhantian': { faction: 'faction-tianyu-imperial', chapter: 180 },
  'dugu-four-tigers': { faction: 'faction-tianyu-imperial', chapter: 180 },
  'yuan-xinggang': { faction: 'faction-demonic-scheme', chapter: 491 },
  'ye-lin': { faction: 'faction-double-dragon', chapter: 491 },
  'danqing-shen': { faction: 'faction-double-dragon', chapter: 491 },
  'wu-qingqiu': { faction: 'faction-double-dragon', chapter: 491 },
  'double-dragon-exalted': { faction: 'faction-double-dragon', chapter: 491 },
  'baili-jingwei': { faction: 'faction-sword-star', chapter: 751 },
  'baili-yuyu': { faction: 'faction-sword-star', chapter: 751 },
  'kunpeng': { faction: 'faction-demonic-scheme', chapter: 1 },
  'nine-serenities-emperor': { faction: 'faction-demonic-scheme', chapter: 1 },
  'zhao-chen': { faction: 'faction-demonic-scheme', chapter: 1 },
};

let factionFactCount = 0;
for (const [charId, f] of Object.entries(charFactions)) {
  const factId = `fact-faction-${charId}`;
  de.facts[factId] = {
    id: factId,
    entity_id: charId,
    predicate: 'faction',
    value: f.faction,
    temporal: { valid_from: f.chapter, valid_to: null, revealed_at: f.chapter },
    provenance: {
      source: { series: 'demonic-emperor', chapter: f.chapter },
      extracted_by: 'deterministic',
      confidence: 1,
      created_at: '2026-09-28T00:00:00Z',
    },
    canon_status: 'canon',
  };
  factionFactCount++;
}

fs.writeFileSync(filePath, JSON.stringify(de, null, 2), 'utf-8');
console.log(`✓ Successfully added ${stageFactCount} power stage facts and ${factionFactCount} faction facts to Demonic Emperor!`);
