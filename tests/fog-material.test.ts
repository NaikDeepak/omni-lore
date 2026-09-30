import { describe, it, expect } from 'vitest';
import { FOG_FRAGMENT_SRC, FOG_VERTEX_SRC } from '../src/engine/map/layers/fog-material';

// Pixi compiles sources without `#version 300 es` as GLSL ES 1.00 (WebGL1 path),
// which has no array constructors, no non-constant indexing, no uint and no bitwise ops.
const GLSL3_ONLY = [/\[/, /\buint\b/, /\buvec\d\b/, /<<|>>/, /[^|]\|[^|]/, /[^&]&[^&]/, /\^/, /#version/];

describe('fog shader sources', () => {
  it('lightens dither density so terrain reads through the fog', () => {
    expect(FOG_FRAGMENT_SRC).toContain('float density = fog * (0.5 + 0.2 * drift);');
  });

  it('only use GLSL ES 1.00 compatible constructs', () => {
    for (const src of [FOG_VERTEX_SRC, FOG_FRAGMENT_SRC]) {
      for (const pattern of GLSL3_ONLY) expect(src).not.toMatch(pattern);
    }
    expect(FOG_FRAGMENT_SRC).not.toContain('int[');
  });

  it('bayer4 as written in GLSL yields each 4x4 threshold (k+0.5)/16 exactly once, in Bayer order', () => {
    // Mirror of the GLSL, line for line
    const fract = (v: number) => v - Math.floor(v);
    const mod = (a: number, b: number) => a - b * Math.floor(a / b);
    const bayer2 = (ax: number, ay: number) => fract(ax * 0.5 + ay * ay * 0.75);
    const bayer4 = (px: number, py: number) => {
      const cx = Math.floor(px);
      const cy = Math.floor(py);
      return (
        bayer2(mod(cx, 2), mod(cy, 2)) +
        bayer2(mod(Math.floor(cx * 0.5), 2), mod(Math.floor(cy * 0.5), 2)) * 0.25 +
        1 / 32
      );
    };
    expect(FOG_FRAGMENT_SRC).toContain('return bayer2(mod(c, 2.0)) + bayer2(mod(floor(c * 0.5), 2.0)) * 0.25 + 1.0 / 32.0;');
    expect(FOG_FRAGMENT_SRC).toContain('return fract(a.x * 0.5 + a.y * a.y * 0.75);');

    const classic = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const ks: number[] = [];
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        // tiling: the next block repeats the same thresholds
        expect(bayer4(x + 4, y + 8)).toBeCloseTo(bayer4(x, y), 10);
        const k = bayer4(x, y) * 16 - 0.5;
        expect(k).toBeCloseTo(Math.round(k), 10);
        ks.push(Math.round(k));
      }
    }
    expect(ks).toEqual(classic);
    expect([...ks].sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, k) => k));
  });
});
