/**
 * Pure 2D geometry helpers for the map engine (no Pixi imports).
 */

import { mulberry32 } from './prng';

export type Vec2 = [number, number];

export interface Pt {
  x: number;
  y: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function polygonBounds(poly: Vec2[]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

export function pointInPolygon(x: number, y: number, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function polygonCentroid(poly: Vec2[]): Pt {
  let sx = 0;
  let sy = 0;
  for (const [x, y] of poly) {
    sx += x;
    sy += y;
  }
  return { x: sx / poly.length, y: sy / poly.length };
}

export function scalePolygon(poly: Vec2[], factor: number): Vec2[] {
  const c = polygonCentroid(poly);
  return poly.map(([x, y]) => [c.x + (x - c.x) * factor, c.y + (y - c.y) * factor]);
}

export function flattenPoly(poly: Vec2[]): number[] {
  const out: number[] = [];
  for (const [x, y] of poly) out.push(x, y);
  return out;
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function distanceToPolygonEdge(x: number, y: number, poly: Vec2[]): number {
  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const d = distanceToSegment(x, y, poly[j][0], poly[j][1], poly[i][0], poly[i][1]);
    if (d < best) best = d;
  }
  return best;
}

export function polylineLength(points: Pt[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

export function pointAlongPolyline(points: Pt[], distance: number): Pt {
  if (points.length === 0) return { x: 0, y: 0 };
  if (distance <= 0 || points.length === 1) return { x: points[0].x, y: points[0].y };
  let remaining = distance;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= len) {
      const t = len === 0 ? 0 : remaining / len;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= len;
  }
  const last = points[points.length - 1];
  return { x: last.x, y: last.y };
}

export function slicePolyline(points: Pt[], distance: number): Pt[] {
  if (points.length === 0) return [];
  const out: Pt[] = [{ x: points[0].x, y: points[0].y }];
  if (distance <= 0) return out;
  let remaining = distance;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining < len) {
      const t = len === 0 ? 0 : remaining / len;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      return out;
    }
    out.push({ x: b.x, y: b.y });
    remaining -= len;
  }
  return out;
}

/**
 * Splits a polyline into dash segments. `offset` shifts the pattern forward
 * along the line (animate it to make dashes "march").
 */
export function dashSegments(points: Pt[], dash: number, gap: number, offset: number): Array<[Pt, Pt]> {
  const total = polylineLength(points);
  const period = dash + gap;
  if (total === 0 || period <= 0) return [];
  const segments: Array<[Pt, Pt]> = [];
  const phase = ((offset % period) + period) % period;
  let start = phase - period;
  while (start < total) {
    const a = Math.max(0, start);
    const b = Math.min(total, start + dash);
    if (b > a) segments.push([pointAlongPolyline(points, a), pointAlongPolyline(points, b)]);
    start += period;
  }
  return segments;
}

export function distanceToPolyline(x: number, y: number, points: Vec2[]): number {
  if (points.length === 1) return Math.hypot(x - points[0][0], y - points[0][1]);
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const d = distanceToSegment(x, y, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Seeded fractal midpoint displacement of a closed ring: each edge gets a
 * midpoint pushed along its normal; the push shrinks every iteration.
 * Turns hand-authored or rectangular outlines into natural coastlines.
 */
export function jagPolygon(poly: Vec2[], seed: number, amplitude: number, iterations = 4): Vec2[] {
  const rand = mulberry32(seed);
  let pts = poly.map(([x, y]) => [x, y] as Vec2);
  for (let k = 0; k < iterations; k++) {
    const out: Vec2[] = [];
    const scale = amplitude / Math.pow(1.7, k);
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      const dx = x1 - x0;
      const dy = y1 - y0;
      const len = Math.hypot(dx, dy) || 1;
      const off = (rand() * 2 - 1) * scale * Math.min(1, len / 40);
      out.push([x0, y0], [(x0 + x1) / 2 - (dy / len) * off, (y0 + y1) / 2 + (dx / len) * off]);
    }
    pts = out;
  }
  return pts;
}

/** Chaikin corner-cutting. Each iteration doubles the vertex count of a closed ring. */
export function chaikinSmooth(poly: Vec2[], iterations: number, closed = true): Vec2[] {
  let current = poly.map(([x, y]) => [x, y] as Vec2);
  for (let iter = 0; iter < iterations; iter++) {
    const next: Vec2[] = [];
    const count = current.length;
    const edges = closed ? count : count - 1;
    if (!closed) next.push(current[0]);
    for (let i = 0; i < edges; i++) {
      const [x0, y0] = current[i];
      const [x1, y1] = current[(i + 1) % count];
      next.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25]);
      next.push([x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
    }
    if (!closed) next.push(current[count - 1]);
    current = next;
  }
  return current;
}
