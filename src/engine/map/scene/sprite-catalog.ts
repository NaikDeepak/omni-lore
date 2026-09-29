/**
 * Sprite catalog for the level-select atlas: which sheet, which rectangle.
 *
 * Sheets (see CREDITS.md):
 *  - Puny World overworld tileset by Shade — CC0
 *  - Worldmap mountains by MrBeast, commissioned by OpenGameArt.org — CC-BY 3.0
 * Coordinates are in sheet pixels; Puny World uses a 16 px grid.
 */

import { LocationType } from '../../../domain/map-types';

export type SheetId = 'puny' | 'mountains';

export interface SheetDef {
  url: string;
  width: number;
  height: number;
  license: 'CC0' | 'CC-BY-3.0';
  credit: string;
  sourceUrl: string;
}

export const SHEETS: Record<SheetId, SheetDef> = {
  puny: {
    url: '/assets/tilesets/punyworld/punyworld-overworld-tileset.png',
    width: 432,
    height: 1040,
    license: 'CC0',
    credit: 'Puny World tileset by Shade (CC0)',
    sourceUrl: 'https://opengameart.org/content/16x16-puny-world-tileset',
  },
  mountains: {
    url: '/assets/tilesets/oga-worldmap/mountains.png',
    width: 192,
    height: 160,
    license: 'CC-BY-3.0',
    credit: 'Worldmap mountains by MrBeast, commissioned by OpenGameArt.org (CC-BY 3.0)',
    sourceUrl: 'https://opengameart.org/content/worldmapoverworld-tileset',
  },
};

export type SpriteName =
  | 'grass-0'
  | 'grass-1'
  | 'grass-2'
  | 'grass-3'
  | 'conifer-0'
  | 'conifer-1'
  | 'tree-round-0'
  | 'tree-round-1'
  | 'tree-round-2'
  | 'palm-0'
  | 'palm-1'
  | 'rock'
  | 'stones'
  | 'castle'
  | 'castle-red'
  | 'hall-teal'
  | 'house'
  | 'cave'
  | 'peak-grey-0'
  | 'peak-grey-1'
  | 'peak-snow-0'
  | 'peak-snow-1'
  | 'peak-grey-small'
  | 'peak-snow-small';

export interface SpriteDef {
  sheet: SheetId;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Mountain sprites are clipped to a triangle silhouette whose apex leans by `lean` px. */
  peak?: { lean: number };
}

const P = 16;
const puny = (tx: number, ty: number, tw = 1, th = 1): SpriteDef => ({
  sheet: 'puny',
  x: tx * P,
  y: ty * P,
  w: tw * P,
  h: th * P,
});

export const SPRITES: Record<SpriteName, SpriteDef> = {
  'grass-0': puny(0, 0),
  'grass-1': puny(1, 0),
  'grass-2': puny(0, 1),
  'grass-3': puny(1, 1),
  'conifer-0': puny(17, 7),
  'conifer-1': puny(17, 9),
  'tree-round-0': puny(3, 26),
  'tree-round-1': puny(0, 27),
  'tree-round-2': puny(0, 29),
  'palm-0': puny(3, 28),
  'palm-1': puny(0, 31),
  rock: puny(0, 26),
  stones: puny(1, 26),
  castle: puny(10, 26, 2, 2),
  'castle-red': puny(22, 32, 2, 2),
  'hall-teal': puny(12, 32, 2, 2),
  house: puny(8, 28),
  cave: puny(19, 4),
  'peak-grey-0': { sheet: 'mountains', x: 20, y: 20, w: 40, h: 40, peak: { lean: 0 } },
  'peak-grey-1': { sheet: 'mountains', x: 40, y: 30, w: 40, h: 40, peak: { lean: -4 } },
  'peak-snow-0': { sheet: 'mountains', x: 116, y: 20, w: 40, h: 40, peak: { lean: 0 } },
  'peak-snow-1': { sheet: 'mountains', x: 136, y: 30, w: 40, h: 40, peak: { lean: 4 } },
  'peak-grey-small': { sheet: 'mountains', x: 24, y: 100, w: 32, h: 32, peak: { lean: 0 } },
  'peak-snow-small': { sheet: 'mountains', x: 120, y: 100, w: 32, h: 32, peak: { lean: 0 } },
};

export const GRASS_TILES: SpriteName[] = ['grass-0', 'grass-1', 'grass-2', 'grass-3'];
export const CONIFERS: SpriteName[] = ['conifer-0', 'conifer-1'];
export const ROUND_TREES: SpriteName[] = ['tree-round-0', 'tree-round-1', 'tree-round-2'];
export const PALMS: SpriteName[] = ['palm-0', 'palm-1'];
export const ROCKS: SpriteName[] = ['rock', 'stones'];
export const PEAKS_GREY: SpriteName[] = ['peak-grey-0', 'peak-grey-1'];
export const PEAKS_SNOW: SpriteName[] = ['peak-snow-0', 'peak-snow-1'];
export const PEAKS_SMALL: SpriteName[] = ['peak-grey-small', 'peak-snow-small'];

/** Location types drawn with a tileset prop; the rest use code-drawn fallback icons. */
export const LOCATION_PROP: Partial<Record<LocationType, SpriteName>> = {
  city: 'castle',
  castle: 'castle-red',
  sect: 'hall-teal',
  temple: 'hall-teal',
  clan: 'house',
  village: 'house',
  dungeon: 'cave',
  cave: 'cave',
  mountain: 'cave',
};

export const ART_CREDITS: Array<{ label: string; url: string }> = Object.values(SHEETS).map((sheet) => ({
  label: sheet.credit,
  url: sheet.sourceUrl,
}));
