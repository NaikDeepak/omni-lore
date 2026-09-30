/**
 * Seeded 2D value noise and fractal (fbm) sums for procedural decoration
 * (forest clumps, grass tone). Pure and deterministic.
 */

export type Noise2D = (x: number, y: number) => number;

export function valueNoise2D(seed: number, cell: number): Noise2D {
  const s = seed | 0;
  const hash = (ix: number, iy: number): number => {
    let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(s, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  return (x, y) => {
    const fx = x / cell;
    const fy = y / cell;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

export function fbm2D(seed: number, octaves: number, baseCell: number): Noise2D {
  const layers = Array.from({ length: octaves }, (_, i) => valueNoise2D(seed + i * 1013, baseCell / Math.pow(2, i)));
  const weights = layers.map((_, i) => Math.pow(0.5, i));
  const total = weights.reduce((sum, w) => sum + w, 0);
  return (x, y) => {
    let v = 0;
    for (let i = 0; i < layers.length; i++) v += layers[i](x, y) * weights[i];
    return v / total;
  };
}
