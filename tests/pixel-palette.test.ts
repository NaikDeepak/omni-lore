import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  mix,
  shade,
  luminance,
  hexToRgb01,
  DANGER_COLORS,
  spritePalette,
  silhouettePalette,
} from '../src/engine/map/scene/pixel-palette';
import { UNIVERSE_LOOKS, DEFAULT_LOOK, getUniverseLook, gradePixels } from '../src/engine/map/scene/universe-look';
import { UNIVERSE_MAP_THEMES } from '../src/domain/map-themes';

const HEX = /^#[0-9a-f]{6}$/;

describe('color math', () => {
  it('parses and formats colors', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb('#f80')).toEqual({ r: 255, g: 136, b: 0 });
    expect(hexToRgb('rgba(16, 185, 129, 0.12)')).toEqual({ r: 16, g: 185, b: 129 });
    expect(rgbToHex(255, 128, 0)).toBe('#ff8000');
    expect(hexToRgb01('#ff0000')).toEqual([1, 0, 0]);
  });

  it('mixes and shades', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(shade('#808080', -1)).toBe('#000000');
    expect(shade('#808080', 1)).toBe('#ffffff');
    expect(shade('#808080', 0)).toBe('#808080');
    expect(luminance('#000000')).toBe(0);
    expect(luminance('#ffffff')).toBeCloseTo(1);
  });

  it('covers every danger level and builds complete sprite palettes', () => {
    expect(Object.keys(DANGER_COLORS).sort()).toEqual(['A', 'B', 'EX', 'S', 'Safe']);
    for (const palette of [spritePalette(UNIVERSE_MAP_THEMES['coiling-dragon']), silhouettePalette('#111111')]) {
      expect(Object.keys(palette).sort()).toEqual(['a', 'b', 'd', 'h', 'l', 'o', 's', 'w']);
      for (const c of Object.values(palette)) expect(c).toMatch(HEX);
    }
  });
});

describe('universe looks', () => {
  it('defines a valid look for every themed universe', () => {
    for (const slug of Object.keys(UNIVERSE_MAP_THEMES)) {
      const look = getUniverseLook(slug);
      expect(UNIVERSE_LOOKS[slug], slug).toBeDefined();
      for (const key of ['tint', 'sea', 'seaDeep', 'shelf', 'shallows', 'sand', 'foam', 'grass', 'fogColor'] as const) {
        expect(look[key], `${slug}.${key}`).toMatch(HEX);
      }
      expect(look.amount).toBeGreaterThanOrEqual(0);
      expect(look.amount).toBeLessThanOrEqual(0.3);
      expect(look.fogOpacity, `${slug}.fogOpacity`).toBeLessThanOrEqual(0.7);
      expect(look.fogOpacity, `${slug}.fogOpacity`).toBeGreaterThanOrEqual(0.4);
    }
    expect(getUniverseLook('unknown-universe')).toBe(DEFAULT_LOOK);
  });

  it('grades pixels: identity, full desaturation, full tint, alpha kept', () => {
    const px = () => new Uint8ClampedArray([200, 100, 50, 77]);

    const same = px();
    gradePixels(same, { tint: '#000000', amount: 0, saturation: 1 });
    expect(Array.from(same)).toEqual([200, 100, 50, 77]);

    const gray = px();
    gradePixels(gray, { tint: '#000000', amount: 0, saturation: 0 });
    expect(gray[0]).toBe(gray[1]);
    expect(gray[1]).toBe(gray[2]);
    expect(gray[3]).toBe(77);

    const tinted = px();
    gradePixels(tinted, { tint: '#10a0f0', amount: 1, saturation: 1 });
    expect(Array.from(tinted)).toEqual([16, 160, 240, 77]);
  });
});
