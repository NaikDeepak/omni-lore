/**
 * Authoring script for the Reverend Insanity level-select atlas.
 *
 * Hand-placed control points are smoothed with Chaikin corner cutting into
 * organic polygons and written to data/reverend-insanity/map.json.
 * Placements are keyed by id, so the script is idempotent.
 *
 * Run: npx tsx scripts/author-reverend-insanity-map.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { chaikinSmooth, Vec2 } from '../src/engine/map/scene/geometry';
import { validateWorldMap } from '../src/domain/map-schema';
import { routeGateChapter } from '../src/projections/route-gating';
import {
  CharacterPath,
  DangerLevel,
  FactionTerritory,
  LandmarkGlyph,
  MapLocation,
  MapPlane,
  MapRegion,
  MapRiver,
  MapRoute,
  TerrainLayer,
  WorldMapDefinition,
} from '../src/domain/map-types';

const MAP_PATH = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../data/reverend-insanity/map.json');
const MORTAL = 'plane-mortal-five-regions';
const HEAVENS = 'plane-two-heavens';
const RIVER = 'plane-river-of-time';

type Pt = [number, number];

const round = (v: number) => Math.round(v * 10) / 10;
const smooth = (points: Vec2[], iterations = 3): Pt[] =>
  chaikinSmooth(points, iterations).map(([x, y]) => [round(x), round(y)]);

/** Irregular closed blob around a center. `wobble` values scale each spoke. */
function blob(cx: number, cy: number, rx: number, ry: number, wobble: number[]): Vec2[] {
  return wobble.map((w, i) => {
    const a = (i / wobble.length) * Math.PI * 2;
    return [cx + Math.cos(a) * rx * (1 + w), cy + Math.sin(a) * ry * (1 + w)];
  });
}

/** Closed band polygon around an open centerline (for rivers). */
function ribbon(centerline: Vec2[], halfWidth: number): Vec2[] {
  const smoothLine = chaikinSmooth(centerline, 3, false);
  const upper: Vec2[] = [];
  const lower: Vec2[] = [];
  for (let i = 0; i < smoothLine.length; i++) {
    const [x, y] = smoothLine[i];
    const [px, py] = smoothLine[Math.max(0, i - 1)];
    const [nx, ny] = smoothLine[Math.min(smoothLine.length - 1, i + 1)];
    const dx = nx - px;
    const dy = ny - py;
    const len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * halfWidth;
    const oy = (dx / len) * halfWidth;
    upper.push([x + ox, y + oy]);
    lower.push([x - ox, y - oy]);
  }
  return [...upper, ...lower.reverse()];
}

function octagon(cx: number, cy: number, r: number): Pt[] {
  return Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return [round(cx + Math.cos(a) * r), round(cy + Math.sin(a) * r)] as Pt;
  });
}

// ---------------------------------------------------------------- planes

const planes: MapPlane[] = [
  { id: MORTAL, name: 'Mortal Five Regions', width: 1600, height: 1100, revealedAtChapter: 0, backdrop: 'sea', order: 0 },
  { id: HEAVENS, name: 'Immemorial Two Heavens', width: 1400, height: 800, revealedAtChapter: 400, backdrop: 'sky', order: 1 },
  { id: RIVER, name: 'Cosmic River of Time', width: 1400, height: 700, revealedAtChapter: 600, backdrop: 'abyss', order: 2 },
];

// ---------------------------------------------------------------- mortal control points

const NORTHERN: Vec2[] = [[300, 90], [520, 60], [760, 80], [980, 70], [1180, 110], [1260, 200], [1240, 300], [1100, 330], [900, 345], [700, 340], [520, 350], [380, 330], [290, 260], [260, 170]];
const WESTERN: Vec2[] = [[90, 330], [230, 300], [380, 330], [430, 420], [440, 560], [420, 700], [360, 780], [220, 800], [110, 740], [70, 600], [60, 460]];
const CENTRAL: Vec2[] = [[440, 370], [700, 350], [900, 360], [1080, 350], [1130, 420], [1140, 560], [1110, 700], [980, 760], [760, 770], [560, 760], [450, 690], [440, 540]];
const SOUTHERN: Vec2[] = [[330, 800], [460, 770], [620, 790], [800, 790], [980, 780], [1100, 760], [1130, 860], [1080, 960], [920, 1030], [700, 1050], [480, 1030], [330, 970], [280, 880]];
const EASTERN_SEA: Vec2[] = [[1180, 90], [1540, 70], [1560, 1060], [1140, 1060], [1150, 900], [1190, 760], [1210, 560], [1190, 380], [1280, 300], [1300, 180]];

// Regional walls: winding mountain ribbons around spine lines, broken by passes
// (gaps) where the canon journey crosses between regions — never a square ring.
const WALL_SPINES: Array<{ id: string; name: string; spine: Vec2[]; half: number }> = [
  { id: 'terrain-wall-north-west', name: 'Northern Regional Wall (West)', spine: [[420, 352], [500, 338], [560, 350]], half: 16 },
  { id: 'terrain-wall-north-east', name: 'Northern Regional Wall (East)', spine: [[620, 356], [700, 362], [860, 340], [1000, 366], [1130, 346]], half: 18 },
  { id: 'terrain-wall-west', name: 'Western Regional Wall', spine: [[432, 392], [450, 520], [424, 640], [446, 742]], half: 15 },
  { id: 'terrain-wall-south-west', name: 'Southern Regional Wall (West)', spine: [[462, 770], [560, 758], [620, 764]], half: 15 },
  { id: 'terrain-wall-south-east', name: 'Southern Regional Wall (East)', spine: [[690, 772], [780, 780], [940, 758], [1100, 774]], half: 17 },
  { id: 'terrain-wall-east', name: 'Eastern Regional Wall', spine: [[1126, 392], [1146, 520], [1116, 640], [1134, 744]], half: 16 },
];

const KARST_WEST: Vec2[] = [[360, 840], [520, 820], [560, 880], [480, 930], [380, 910]];
const KARST_EAST: Vec2[] = [[820, 850], [980, 830], [1040, 900], [900, 960], [800, 920]];

const ISLANDS: Array<{ id: string; name: string; points: Vec2[] }> = [
  { id: 'terrain-island-azure', name: 'Azure Archipelago', points: blob(1320, 400, 34, 24, [0.1, -0.2, 0.15, 0, -0.1, 0.2, -0.05, 0.1]) },
  { id: 'terrain-island-coral', name: 'Coral Sovereign Isle', points: blob(1430, 640, 44, 30, [0, 0.2, -0.1, 0.1, -0.2, 0.05, 0.15, -0.1]) },
  { id: 'terrain-island-mist', name: 'Mistveil Reef', points: blob(1350, 860, 30, 22, [0.15, -0.1, 0, 0.2, -0.15, 0.1, 0, -0.05]) },
];

// ---------------------------------------------------------------- heavens + river control points

const WHITE_HEAVEN = [
  blob(300, 300, 120, 70, [0.1, -0.15, 0.2, 0, -0.1, 0.15, -0.2, 0.05, 0.1, -0.05]),
  blob(480, 470, 90, 55, [0, 0.15, -0.1, 0.2, -0.15, 0.05, 0.1, -0.05]),
  blob(220, 560, 70, 40, [0.2, -0.1, 0.05, 0.1, -0.2, 0, 0.15, -0.1]),
];
const BLACK_HEAVEN = [
  blob(1000, 300, 120, 70, [-0.1, 0.2, 0, -0.15, 0.1, 0.05, -0.2, 0.15, 0, -0.05]),
  blob(1150, 500, 90, 55, [0.1, 0, -0.2, 0.15, -0.05, 0.2, -0.1, 0.05]),
  blob(900, 560, 70, 45, [-0.15, 0.1, 0.2, -0.05, 0, 0.15, -0.1, 0.05]),
];

const RIVER_BAND = ribbon([[60, 350], [250, 250], [450, 420], [650, 300], [850, 420], [1050, 280], [1340, 360]], 45);
const STONE_LOTUS = blob(980, 330, 40, 26, [0.1, -0.1, 0.2, 0, -0.15, 0.1, 0.05, -0.05]);

// Lakes (ocean-typed polygons painted after the land they sit in)
const CRESCENT_LAKE = blob(556, 204, 30, 13, [0.1, 0.2, 0, -0.3, -0.4, -0.2, 0.1, 0.2]);
const DESERT_OASIS = blob(220, 560, 24, 15, [0.1, -0.1, 0.15, 0, -0.1, 0.1, 0.05, -0.05]);

// Rivers (world units) with bridges where the journey path crosses
const RIVERS: MapRiver[] = [
  {
    id: 'river-reverse-flow',
    name: 'Reverse Flow River',
    points: [[1060, 330], [990, 290], [900, 262], [780, 270], [660, 252], [566, 260], [430, 262], [330, 236], [262, 200]],
    width: 14,
    planeId: MORTAL,
    bridges: [[566, 260]],
  },
  {
    id: 'river-southern-karst',
    name: 'Southern Karst River',
    points: [[700, 800], [716, 870], [704, 912], [694, 950], [712, 1046]],
    width: 12,
    planeId: MORTAL,
    bridges: [[704, 912]],
  },
];

// ---------------------------------------------------------------- terrain

const terrain: TerrainLayer[] = [
  { id: 'terrain-eastern-sea', type: 'ocean', name: 'Eastern Sea Infinite Waters', polygon: smooth(EASTERN_SEA, 3), planeId: MORTAL },
  { id: 'terrain-northern-plains', type: 'plains', name: 'Northern Plains Grassland Expanses', polygon: smooth(NORTHERN), planeId: MORTAL },
  { id: 'terrain-western-desert', type: 'desert', name: 'Western Desert Endless Dunes', polygon: smooth(WESTERN, 3), planeId: MORTAL },
  { id: 'terrain-central-continent', type: 'plains', name: 'Central Continent Vast Basin', polygon: smooth(CENTRAL, 3), planeId: MORTAL },
  { id: 'terrain-southern-border', type: 'forest', name: 'Southern Border Karst Jungles', polygon: smooth(SOUTHERN, 3), planeId: MORTAL },
  ...ISLANDS.map((isle) => ({ id: isle.id, type: 'forest' as const, name: isle.name, polygon: smooth(isle.points, 2), planeId: MORTAL })),
  { id: 'terrain-crescent-lake', type: 'ocean', name: 'Crescent Lake', polygon: smooth(CRESCENT_LAKE, 2), planeId: MORTAL },
  { id: 'terrain-desert-oasis', type: 'ocean', name: 'Western Desert Oasis', polygon: smooth(DESERT_OASIS, 2), planeId: MORTAL },
  { id: 'terrain-karst-west', type: 'mountain', name: 'Qing Mao Karst Spires', polygon: smooth(KARST_WEST, 2), planeId: MORTAL },
  { id: 'terrain-karst-east', type: 'mountain', name: 'Yi Tian Karst Spires', polygon: smooth(KARST_EAST, 2), planeId: MORTAL },
  ...WALL_SPINES.map((wall) => ({ id: wall.id, type: 'mountain' as const, name: wall.name, polygon: smooth(ribbon(wall.spine, wall.half), 1), planeId: MORTAL })),
  ...WHITE_HEAVEN.map((points, i) => ({ id: `terrain-white-heaven-${i + 1}`, type: 'ice' as const, name: 'White Heaven Isle', polygon: smooth(points, 2), planeId: HEAVENS })),
  ...BLACK_HEAVEN.map((points, i) => ({ id: `terrain-black-heaven-${i + 1}`, type: 'void' as const, name: 'Black Heaven Isle', polygon: smooth(points, 2), planeId: HEAVENS })),
  { id: 'terrain-river-of-time', type: 'river', name: 'Cosmic River of Time Temporal Flow', polygon: smooth(RIVER_BAND, 1), planeId: RIVER },
  { id: 'terrain-stone-lotus', type: 'forest', name: 'Stone Lotus Islands', polygon: smooth(STONE_LOTUS, 2), planeId: RIVER },
];

// ---------------------------------------------------------------- regions (keep metadata, replace geometry)

const REGION_SHAPES: Record<string, { planeId: string; geometry: MapRegion['geometry'] }> = {
  'region-eastern-sea': { planeId: MORTAL, geometry: { type: 'Polygon', coordinates: [smooth(EASTERN_SEA, 3)] } },
  'region-northern-plains': { planeId: MORTAL, geometry: { type: 'Polygon', coordinates: [smooth(NORTHERN)] } },
  'region-western-desert': { planeId: MORTAL, geometry: { type: 'Polygon', coordinates: [smooth(WESTERN, 3)] } },
  'region-central-continent': { planeId: MORTAL, geometry: { type: 'Polygon', coordinates: [smooth(CENTRAL, 3)] } },
  'region-southern-border': { planeId: MORTAL, geometry: { type: 'Polygon', coordinates: [smooth(SOUTHERN, 3)] } },
  'region-two-heavens': {
    planeId: HEAVENS,
    geometry: { type: 'MultiPolygon', coordinates: [[smooth(WHITE_HEAVEN[0], 2)], [smooth(BLACK_HEAVEN[0], 2)]] },
  },
  'region-river-of-time': { planeId: RIVER, geometry: { type: 'Polygon', coordinates: [smooth(RIVER_BAND, 1)] } },
};

// Order matters for picking: the sea first so land regions win overlaps
const REGION_ORDER = [
  'region-eastern-sea',
  'region-northern-plains',
  'region-western-desert',
  'region-central-continent',
  'region-southern-border',
  'region-two-heavens',
  'region-river-of-time',
];

// ---------------------------------------------------------------- locations

const PLACEMENTS: Record<string, { x: number; y: number; planeId: string; waypoint: boolean; dangerLevel: DangerLevel }> = {
  'loc-qing-mao-mountain': { x: 420, y: 870, planeId: MORTAL, waypoint: true, dangerLevel: 'B' },
  'loc-gu-yue-village': { x: 452, y: 902, planeId: MORTAL, waypoint: false, dangerLevel: 'Safe' },
  'loc-bai-gu-mountain': { x: 525, y: 905, planeId: MORTAL, waypoint: false, dangerLevel: 'B' },
  'loc-shang-city': { x: 640, y: 930, planeId: MORTAL, waypoint: true, dangerLevel: 'Safe' },
  'loc-san-cha-mountain': { x: 770, y: 885, planeId: MORTAL, waypoint: false, dangerLevel: 'A' },
  'loc-yi-tian-mountain': { x: 905, y: 905, planeId: MORTAL, waypoint: false, dangerLevel: 'S' },
  'loc-wu-mountain': { x: 1010, y: 970, planeId: MORTAL, waypoint: true, dangerLevel: 'A' },
  'loc-crescent-lake': { x: 560, y: 220, planeId: MORTAL, waypoint: false, dangerLevel: 'B' },
  'loc-eighty-eight-true-yang': { x: 760, y: 150, planeId: MORTAL, waypoint: false, dangerLevel: 'A' },
  'loc-imperial-court-blessed-land': { x: 805, y: 200, planeId: MORTAL, waypoint: true, dangerLevel: 'A' },
  'loc-lang-ya-blessed-land': { x: 960, y: 240, planeId: MORTAL, waypoint: true, dangerLevel: 'B' },
  'loc-crazed-demon-cave': { x: 680, y: 105, planeId: MORTAL, waypoint: false, dangerLevel: 'EX' },
  'loc-reverse-flow-river': { x: 430, y: 255, planeId: MORTAL, waypoint: false, dangerLevel: 'EX' },
  'loc-heavenly-court': { x: 790, y: 520, planeId: MORTAL, waypoint: true, dangerLevel: 'S' },
  'loc-hu-immortal-blessed-land': { x: 930, y: 640, planeId: MORTAL, waypoint: true, dangerLevel: 'B' },
  'loc-spirit-affinity-house': { x: 600, y: 620, planeId: MORTAL, waypoint: true, dangerLevel: 'B' },
  'loc-river-of-time': { x: 470, y: 400, planeId: RIVER, waypoint: true, dangerLevel: 'EX' },
  'loc-stone-lotus-island': { x: 980, y: 330, planeId: RIVER, waypoint: true, dangerLevel: 'A' },
};

// ---------------------------------------------------------------- landmark glyphs

const landmarkGlyphs: LandmarkGlyph[] = [
  { id: 'lg-crazed-demon-maw', glyph: 'skull-rock', x: 705, y: 95, planeId: MORTAL, revealedAtChapter: 1200, name: 'Crazed Demon Cave Maw' },
  { id: 'lg-yi-tian-spire', glyph: 'spire', x: 930, y: 885, planeId: MORTAL, revealedAtChapter: 950, name: 'Yi Tian Mountain Spire' },
  { id: 'lg-heavenly-court-citadel', glyph: 'citadel', x: 820, y: 500, planeId: MORTAL, revealedAtChapter: 700, name: 'Heavenly Court Citadel' },
  { id: 'lg-reverse-flow-arch', glyph: 'portal-arch', x: 405, y: 240, planeId: MORTAL, revealedAtChapter: 1280, name: 'Reverse Flow River Source' },
  { id: 'lg-eighty-eight-ruins', glyph: 'ruin', x: 735, y: 140, planeId: MORTAL, revealedAtChapter: 640, name: 'Ruins of Eighty-Eight True Yang' },
  { id: 'lg-san-cha-monolith', glyph: 'monolith', x: 795, y: 870, planeId: MORTAL, revealedAtChapter: 350, name: 'Three Kings Inheritance Monolith' },
];

// ---------------------------------------------------------------- territories

const TERRITORY_MEMBERS: Record<string, string[]> = {
  'faction-gu-yue': ['loc-qing-mao-mountain', 'loc-gu-yue-village'],
  'faction-shang': ['loc-shang-city'],
  'faction-wu': ['loc-wu-mountain'],
  'faction-heavenly-court': ['loc-heavenly-court'],
  'faction-longevity-heaven': ['loc-imperial-court-blessed-land', 'loc-eighty-eight-true-yang'],
};

// ---------------------------------------------------------------- build

function main(): void {
  const existing = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8')) as WorldMapDefinition;

  const locations: MapLocation[] = existing.locations.map((loc) => {
    const placement = PLACEMENTS[loc.id];
    if (!placement) throw new Error(`No placement for location ${loc.id}`);
    return { ...loc, ...placement };
  });
  const byId = new Map(locations.map((l) => [l.id, l]));
  const at = (id: string): Pt => {
    const loc = byId.get(id);
    if (!loc) throw new Error(`Unknown location ${id}`);
    return [loc.x, loc.y];
  };

  const regions: MapRegion[] = REGION_ORDER.map((id) => {
    const source = existing.regions.find((r) => r.id === id);
    if (!source) throw new Error(`Missing region ${id} in existing map.json`);
    const shape = REGION_SHAPES[id];
    return { ...source, geometry: shape.geometry, planeId: shape.planeId };
  });

  // `baseChapter` is the story chapter a route opens; the written gate is raised to the latest
  // debut of any location the route passes through (route-gating.ts), so a route never
  // draws a line to a landmark the reader has not reached yet.
  const routeShapes: Record<string, { points: Pt[]; planeId: string; baseChapter: number }> = {
    'route-southern-caravan': { planeId: MORTAL, baseChapter: 200, points: [at('loc-qing-mao-mountain'), at('loc-bai-gu-mountain'), at('loc-shang-city')] },
    'route-three-kings-conquest': { planeId: MORTAL, baseChapter: 350, points: [at('loc-shang-city'), [700, 915], at('loc-san-cha-mountain')] },
    'route-plains-conquest': { planeId: MORTAL, baseChapter: 420, points: [at('loc-crescent-lake'), [660, 190], at('loc-eighty-eight-true-yang')] },
    'route-temporal-reversal': { planeId: RIVER, baseChapter: 600, points: [at('loc-river-of-time'), [730, 370], at('loc-stone-lotus-island')] },
  };
  const routes: MapRoute[] = existing.routes.map((route) => {
    const shape = routeShapes[route.id];
    if (!shape) throw new Error(`No shape for route ${route.id}`);
    const gate = routeGateChapter(shape, locations, planes, shape.baseChapter);
    // Secret routes open only on their explicit reveal; `visibleFromChapter` is ignored for them.
    const chapters =
      route.routeType === 'secret'
        ? { revealedAtChapter: gate }
        : { visibleFromChapter: gate, revealedAtChapter: gate };
    return { ...route, points: shape.points, planeId: shape.planeId, ...chapters };
  });

  const territories: FactionTerritory[] = existing.territories.map((territory) => {
    const members = TERRITORY_MEMBERS[territory.factionId];
    if (!members) throw new Error(`No members for territory ${territory.factionId}`);
    const pts = members.map(at);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const spread = Math.max(0, ...pts.map(([x, y]) => Math.hypot(x - cx, y - cy)));
    return { ...territory, boundary: octagon(cx, cy, spread + 45), planeId: MORTAL };
  });

  const characterPaths: CharacterPath[] = existing.characterPaths.map((cp) => ({
    ...cp,
    waypoints: cp.waypoints.map((wp) => {
      const loc = wp.locationId ? byId.get(wp.locationId) : undefined;
      if (!loc) throw new Error(`Waypoint at chapter ${wp.chapter} has no known location`);
      return { ...wp, x: loc.x, y: loc.y, planeId: loc.planeId };
    }),
  }));

  const def: WorldMapDefinition = {
    ...existing,
    width: 1600,
    height: 1100,
    planes,
    terrain,
    regions,
    locations,
    routes,
    territories,
    characterPaths,
    landmarkGlyphs,
    rivers: RIVERS,
  };

  validateWorldMap(def);
  fs.writeFileSync(MAP_PATH, `${JSON.stringify(def, null, 2)}\n`);
  console.log(
    `Wrote ${MAP_PATH}: ${planes.length} planes, ${terrain.length} terrain layers, ${RIVERS.length} rivers, ${locations.length} locations, ${landmarkGlyphs.length} landmark glyphs`
  );
}

main();
