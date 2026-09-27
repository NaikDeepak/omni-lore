import { describe, it, expect } from 'vitest';
import { PALETTES, hexToRgb, rgbToHex, PaletteName } from '../src/pixel/palette';
import { PixelConverter } from '../src/pixel/pixel-converter';

describe('Pixel Palette & Quantization', () => {
  it('correctly parses hex and RGB values', () => {
    const rgb = hexToRgb('#ff8000');
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(128);
    expect(rgb.b).toBe(0);
    expect(rgb.hex).toBe('#ff8000');

    expect(rgbToHex(255, 128, 0)).toBe('#ff8000');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('provides all 5 retro fantasy palettes with valid hex colors', () => {
    const paletteKeys: PaletteName[] = ['pico8', 'fantasy16', 'xianxia', 'anime32', 'gameboy'];
    paletteKeys.forEach(p => {
      const palette = PALETTES[p];
      expect(palette).toBeDefined();
      expect(palette.name).toBeTypeOf('string');
      expect(palette.colors.length).toBeGreaterThanOrEqual(4);
      palette.colors.forEach(c => {
        expect(c.hex).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(c.r).toBeGreaterThanOrEqual(0);
        expect(c.r).toBeLessThanOrEqual(255);
      });
    });
  });

  it('generates crisp run-length compressed SVG with crispEdges', () => {
    // 4x4 mock pixel grid (2D matrix)
    // row 0: all red (#ff0000) -> 1 span of width 4
    // row 1: all blue (#0000ff) -> 1 span of width 4
    // row 2: two green (#00ff00), two null -> 1 span of width 2
    // row 3: all null -> 0 spans
    const matrix: (string | null)[][] = [
      ['#ff0000', '#ff0000', '#ff0000', '#ff0000'],
      ['#0000ff', '#0000ff', '#0000ff', '#0000ff'],
      ['#00ff00', '#00ff00', null, null],
      [null, null, null, null],
    ];

    const svg = PixelConverter.generateOptimizedSvg(matrix, 4, 4);
    expect(svg).toContain('viewBox="0 0 4 4"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('width="4"');
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('fill="#0000ff"');
    expect(svg).toContain('fill="#00ff00"');
  });
});
