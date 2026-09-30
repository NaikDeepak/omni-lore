import { describe, it, expect } from 'vitest';
import { hashString, mulberry32 } from '../src/engine/map/scene/prng';
import {
  polygonBounds,
  pointInPolygon,
  polygonCentroid,
  scalePolygon,
  flattenPoly,
  distanceToPolygonEdge,
  polylineLength,
  pointAlongPolyline,
  slicePolyline,
  dashSegments,
  chaikinSmooth,
  distanceToPolyline,
  jagPolygon,
  Vec2,
} from '../src/engine/map/scene/geometry';
import { valueNoise2D, fbm2D } from '../src/engine/map/scene/noise';

const square: Vec2[] = [[0, 0], [100, 0], [100, 100], [0, 100]];

describe('prng', () => {
  it('hashes strings deterministically to uint32', () => {
    expect(hashString('map:terrain')).toBe(hashString('map:terrain'));
    expect(hashString('a')).not.toBe(hashString('b'));
    expect(hashString('anything')).toBeGreaterThanOrEqual(0);
    expect(hashString('anything')).toBeLessThan(2 ** 32);
  });

  it('produces a repeatable sequence in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 50 }, () => a());
    const seqB = Array.from({ length: 50 }, () => b());
    expect(seqA).toEqual(seqB);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    const c = mulberry32(43);
    expect(c()).not.toBe(seqA[0]);
  });
});

describe('polygon geometry', () => {
  it('computes bounds, centroid and flattening', () => {
    expect(polygonBounds(square)).toEqual({ minX: 0, minY: 0, maxX: 100, maxY: 100 });
    expect(polygonCentroid(square)).toEqual({ x: 50, y: 50 });
    expect(flattenPoly([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
  });

  it('tests point containment', () => {
    expect(pointInPolygon(50, 50, square)).toBe(true);
    expect(pointInPolygon(150, 50, square)).toBe(false);
    const concave: Vec2[] = [[0, 0], [100, 0], [100, 100], [50, 40], [0, 100]];
    expect(pointInPolygon(50, 80, concave)).toBe(false);
    expect(pointInPolygon(50, 20, concave)).toBe(true);
  });

  it('scales polygons toward the centroid', () => {
    expect(scalePolygon(square, 0.5)).toEqual([[25, 25], [75, 25], [75, 75], [25, 75]]);
  });

  it('measures distance to the nearest edge', () => {
    expect(distanceToPolygonEdge(50, 10, square)).toBeCloseTo(10);
    expect(distanceToPolygonEdge(50, 50, square)).toBeCloseTo(50);
  });

  it('smooths closed polygons with Chaikin corner cutting', () => {
    const once = chaikinSmooth(square, 1);
    expect(once).toHaveLength(8);
    expect(once[0]).toEqual([25, 0]);
    expect(once[1]).toEqual([75, 0]);
    expect(chaikinSmooth(square, 3)).toHaveLength(32);
    expect(chaikinSmooth(square, 0)).toEqual(square);
  });

  it('keeps open polyline endpoints when smoothing open paths', () => {
    const line: Vec2[] = [[0, 0], [100, 0], [100, 100]];
    const smoothed = chaikinSmooth(line, 1, false);
    expect(smoothed[0]).toEqual([0, 0]);
    expect(smoothed[smoothed.length - 1]).toEqual([100, 100]);
  });
});

describe('coast roughening and polyline distance', () => {
  it('jags a ring deterministically within the amplitude envelope', () => {
    const a = jagPolygon(square, 7, 10);
    expect(a).toHaveLength(4 * 16);
    expect(jagPolygon(square, 7, 10)).toEqual(a);
    expect(jagPolygon(square, 8, 10)).not.toEqual(a);
    const b = polygonBounds(a);
    expect(b.minX).toBeGreaterThan(-25);
    expect(b.maxX).toBeLessThan(125);
    expect(jagPolygon(square, 7, 10, 0)).toEqual(square);
  });

  it('measures distance to an open polyline', () => {
    const line: Vec2[] = [[0, 0], [100, 0], [100, 100]];
    expect(distanceToPolyline(50, 10, line)).toBeCloseTo(10);
    expect(distanceToPolyline(110, 50, line)).toBeCloseTo(10);
    expect(distanceToPolyline(-5, 0, line)).toBeCloseTo(5);
  });
});

describe('noise', () => {
  it('is deterministic, bounded, smooth and roughly centered', () => {
    const n = valueNoise2D(3, 16);
    expect(n(10.5, 20.25)).toBe(valueNoise2D(3, 16)(10.5, 20.25));
    expect(valueNoise2D(4, 16)(10.5, 20.25)).not.toBe(n(10.5, 20.25));
    const f = fbm2D(9, 3, 48);
    let sum = 0;
    let count = 0;
    for (let y = 0; y < 400; y += 7) {
      for (let x = 0; x < 400; x += 7) {
        const v = f(x, y);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
        expect(Math.abs(f(x + 0.5, y) - v)).toBeLessThan(0.1);
        sum += v;
        count += 1;
      }
    }
    expect(sum / count).toBeGreaterThan(0.35);
    expect(sum / count).toBeLessThan(0.65);
  });
});

describe('polyline geometry', () => {
  const path = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }];

  it('measures length and interpolates along the path', () => {
    expect(polylineLength(path)).toBe(150);
    expect(pointAlongPolyline(path, 50)).toEqual({ x: 50, y: 0 });
    expect(pointAlongPolyline(path, 125)).toEqual({ x: 100, y: 25 });
    expect(pointAlongPolyline(path, 999)).toEqual({ x: 100, y: 50 });
    expect(pointAlongPolyline(path, -5)).toEqual({ x: 0, y: 0 });
    expect(pointAlongPolyline([{ x: 3, y: 4 }], 10)).toEqual({ x: 3, y: 4 });
  });

  it('slices a polyline prefix', () => {
    expect(slicePolyline(path, 125)).toEqual([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 25 }]);
    expect(slicePolyline(path, 0)).toEqual([{ x: 0, y: 0 }]);
  });

  it('splits a polyline into dash segments with an animated offset', () => {
    const line = [{ x: 0, y: 0 }, { x: 20, y: 0 }];
    expect(dashSegments(line, 4, 6, 0)).toEqual([
      [{ x: 0, y: 0 }, { x: 4, y: 0 }],
      [{ x: 10, y: 0 }, { x: 14, y: 0 }],
    ]);
    const shifted = dashSegments(line, 4, 6, 2);
    expect(shifted[0]).toEqual([{ x: 2, y: 0 }, { x: 6, y: 0 }]);
    expect(shifted[1]).toEqual([{ x: 12, y: 0 }, { x: 16, y: 0 }]);
    const wrapped = dashSegments(line, 4, 6, 8);
    expect(wrapped[0]).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0 }]);
    expect(wrapped[1]).toEqual([{ x: 8, y: 0 }, { x: 12, y: 0 }]);
    expect(wrapped[2]).toEqual([{ x: 18, y: 0 }, { x: 20, y: 0 }]);
  });
});
