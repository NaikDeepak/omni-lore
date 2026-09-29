import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Rectangle, Texture, TextureSource } from 'pixi.js';
import {
  SHEETS,
  SPRITES,
  GRASS_TILES,
  CONIFERS,
  ROUND_TREES,
  PALMS,
  ROCKS,
  PEAKS_GREY,
  PEAKS_SNOW,
  PEAKS_SMALL,
  LOCATION_PROP,
  ART_CREDITS,
  SpriteName,
} from '../src/engine/map/scene/sprite-catalog';
import { TileAtlas, SheetLoader } from '../src/engine/map/scene/tile-atlas';

function pngSize(file: string): { width: number; height: number } {
  const buf = fs.readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('sprite catalog', () => {
  it('ships every sheet at its declared size', () => {
    for (const sheet of Object.values(SHEETS)) {
      const size = pngSize(path.resolve(process.cwd(), 'public', sheet.url.replace(/^\//, '')));
      expect(size).toEqual({ width: sheet.width, height: sheet.height });
    }
  });

  it('keeps every sprite rectangle inside its sheet', () => {
    for (const [name, def] of Object.entries(SPRITES)) {
      const sheet = SHEETS[def.sheet];
      expect(def.x >= 0 && def.y >= 0, name).toBe(true);
      expect(def.x + def.w <= sheet.width, name).toBe(true);
      expect(def.y + def.h <= sheet.height, name).toBe(true);
    }
  });

  it('groups only reference defined sprites and peaks carry a silhouette', () => {
    const groups = [GRASS_TILES, CONIFERS, ROUND_TREES, PALMS, ROCKS, PEAKS_GREY, PEAKS_SNOW, PEAKS_SMALL];
    for (const group of groups) {
      expect(group.length).toBeGreaterThan(0);
      for (const name of group) expect(SPRITES[name as SpriteName]).toBeDefined();
    }
    for (const name of [...PEAKS_GREY, ...PEAKS_SNOW, ...PEAKS_SMALL]) expect(SPRITES[name].peak).toBeDefined();
  });

  it('maps location types to defined sprites', () => {
    expect(LOCATION_PROP.city).toBe('castle');
    for (const sprite of Object.values(LOCATION_PROP)) expect(SPRITES[sprite as SpriteName]).toBeDefined();
  });

  it('credits every CC-BY sheet', () => {
    const labels = ART_CREDITS.map((c) => c.label).join(' | ');
    for (const sheet of Object.values(SHEETS)) {
      if (sheet.license === 'CC-BY-3.0') expect(labels).toContain(sheet.credit);
      expect(sheet.sourceUrl).toMatch(/^https:\/\/opengameart\.org\//);
    }
  });
});

describe('TileAtlas', () => {
  const fakeLoader: SheetLoader = {
    load: async (url) => {
      const sheet = Object.values(SHEETS).find((s) => s.url === url)!;
      return new Texture({ source: new TextureSource({ width: sheet.width, height: sheet.height }) });
    },
  };

  it('returns Texture.EMPTY before loading or without a loader', async () => {
    const atlas = new TileAtlas(null);
    await atlas.load();
    expect(atlas.ready).toBe(false);
    expect(atlas.texture('castle')).toBe(Texture.EMPTY);
    expect(atlas.image('puny')).toBeNull();
  });

  it('serves cached sub-textures framed to the sprite rectangle', async () => {
    const atlas = new TileAtlas(fakeLoader);
    await atlas.load();
    expect(atlas.ready).toBe(true);
    const castle = atlas.texture('castle');
    expect(castle).toBe(atlas.texture('castle'));
    expect(castle.frame).toEqual(new Rectangle(SPRITES.castle.x, SPRITES.castle.y, 32, 32));
    atlas.destroy();
  });

  it('becomes empty after destroy (ready=false, texture=EMPTY, image=null)', async () => {
    const atlas = new TileAtlas(fakeLoader);
    await atlas.load();
    expect(atlas.ready).toBe(true);
    atlas.destroy();
    expect(atlas.ready).toBe(false);
    expect(atlas.texture('castle')).toBe(Texture.EMPTY);
    expect(atlas.image('puny')).toBeNull();
  });
});
