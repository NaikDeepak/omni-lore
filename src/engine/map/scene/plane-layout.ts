/**
 * Pure, deterministic layout of one plane's static art: roughened coasts,
 * ground/water fills, grass tone patches, rivers, bridges and decoration
 * stamps (trees, peaks, rocks, palms). Pixel space (PIXELS_PER_WORLD).
 *
 * Uses only never-chapter-gated data (terrain, rivers, plane), so the
 * result can be baked once per plane without spoiling anything.
 */

import { PlaneBackdrop, TerrainType } from '../../../domain/map-types';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import {
  Bounds,
  distanceToPolygonEdge,
  distanceToPolyline,
  jagPolygon,
  pointInPolygon,
  polygonBounds,
  polygonCentroid,
  Vec2,
} from './geometry';
import { fbm2D } from './noise';
import { hashString, mulberry32 } from './prng';
import {
  CONIFERS,
  PALMS,
  PEAKS_GREY,
  PEAKS_SMALL,
  PEAKS_SNOW,
  ROCKS,
  ROUND_TREES,
  SpriteName,
} from './sprite-catalog';

export const PIXELS_PER_WORLD = 0.5;

export type GroundKind = 'grass' | 'sand' | 'snow' | 'ash' | 'bog' | 'voidstone';
export type FillKind = GroundKind | 'water' | 'lake';

export interface LayoutFill {
  id: string;
  kind: FillKind;
  terrainType: TerrainType;
  ring: Vec2[];
  bounds: Bounds;
}

export interface Stamp {
  sprite: SpriteName;
  x: number;
  y: number;
  flip: boolean;
}

export interface Patch {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface LayoutRiver {
  points: Vec2[];
  width: number;
}

export interface PlaneLayout {
  width: number;
  height: number;
  backdrop: PlaneBackdrop;
  land: Vec2[][];
  fills: LayoutFill[];
  patches: Patch[];
  rivers: LayoutRiver[];
  bridges: Vec2[];
  stamps: Stamp[];
}

const FILL_KIND: Record<TerrainType, FillKind> = {
  plains: 'grass',
  custom: 'grass',
  forest: 'grass',
  mountain: 'grass',
  desert: 'sand',
  ice: 'snow',
  volcanic: 'ash',
  swamp: 'bog',
  void: 'voidstone',
  ocean: 'water',
  river: 'water',
};

const GRID_X = 8;
const GRID_Y = 7;
const RIVER_CLEARANCE = 3;

export function buildPlaneLayout(snapshot: ProjectedWorldMapSnapshot): PlaneLayout {
  const s = PIXELS_PER_WORLD;
  const width = Math.round(snapshot.width * s);
  const height = Math.round(snapshot.height * s);
  const backdrop = snapshot.planes.find((p) => p.id === snapshot.planeId)?.backdrop ?? 'void';
  const amplitude = Math.max(6, Math.min(width, height) * 0.02);

  const fills: LayoutFill[] = snapshot.terrain
    .filter((t) => t.polygon.length >= 3)
    .map((t) => {
      // Cap roughening so dense (already smoothed) rings stay <= ~256 vertices
      const iterations = Math.max(0, Math.min(4, Math.floor(Math.log2(256 / t.polygon.length))));
      const ring = jagPolygon(
        t.polygon.map(([x, y]) => [x * s, y * s] as Vec2),
        hashString(`${snapshot.mapId}:${t.id}`),
        amplitude,
        iterations
      );
      return { id: t.id, kind: FILL_KIND[t.type], terrainType: t.type, ring, bounds: polygonBounds(ring) };
    });

  // Water enclosed by land is a lake (rimmed); other water is open sea (plain, under the coast).
  // A land fill only "encloses" water whose bounding box it fully contains -- centroid-in-polygon
  // alone is not enough: an open-sea polygon can have its centroid land inside a land polygon it
  // merely overlaps (e.g. a large plains ring whose center point sits under a surrounding sea),
  // even though the sea is not actually nested inside that land shape.
  const boundsContains = (outer: Bounds, inner: Bounds): boolean =>
    outer.minX <= inner.minX && outer.minY <= inner.minY && outer.maxX >= inner.maxX && outer.maxY >= inner.maxY;
  for (const fill of fills) {
    if (fill.kind !== 'water') continue;
    const c = polygonCentroid(fill.ring);
    const enclosed = fills.some(
      (other) =>
        other !== fill &&
        other.kind !== 'water' &&
        other.kind !== 'lake' &&
        boundsContains(other.bounds, fill.bounds) &&
        pointInPolygon(c.x, c.y, other.ring)
    );
    if (enclosed) fill.kind = 'lake';
  }

  const rivers: LayoutRiver[] = (snapshot.rivers ?? []).map((r) => ({
    points: r.points.map(([x, y]) => [x * s, y * s] as Vec2),
    width: r.width * s,
  }));
  const bridges: Vec2[] = (snapshot.rivers ?? []).flatMap((r) =>
    (r.bridges ?? []).map(([x, y]) => [x * s, y * s] as Vec2)
  );

  /** Top-most fill under a point (terrain order = paint order), or null for backdrop. */
  const surfaceAt = (x: number, y: number): LayoutFill | null => {
    for (let i = fills.length - 1; i >= 0; i--) {
      const b = fills[i].bounds;
      if (x < b.minX || x > b.maxX || y < b.minY || y > b.maxY) continue;
      if (pointInPolygon(x, y, fills[i].ring)) return fills[i];
    }
    return null;
  };
  const nearRiver = (x: number, y: number): boolean =>
    rivers.some((r) => distanceToPolyline(x, y, r.points) < r.width / 2 + RIVER_CLEARANCE);

  const seed = hashString(`${snapshot.mapId}:${snapshot.planeId}:layout`);
  const rng = mulberry32(seed);
  const forestNoise = fbm2D(seed ^ 0x5f3759df, 3, 48);
  const pick = <T>(list: T[]): T => list[Math.floor(rng() * list.length)];
  const tree = (): SpriteName => (rng() < 0.7 ? pick(CONIFERS) : pick(ROUND_TREES));

  const stamps: Stamp[] = [];
  const patches: Patch[] = [];

  for (let gy = 0; gy < height; gy += GRID_Y) {
    for (let gx = 0; gx < width; gx += GRID_X) {
      const x = Math.round(gx + (rng() - 0.5) * 6);
      const y = Math.round(gy + (rng() - 0.5) * 4);
      const flip = rng() < 0.5;
      const roll = rng();
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const surface = surfaceAt(x, y);
      if (!surface || surface.kind === 'water' || surface.kind === 'lake' || nearRiver(x, y)) continue;
      const n = forestNoise(x, y);

      switch (surface.terrainType) {
        case 'forest':
          if (n > 0.42) stamps.push({ sprite: tree(), x, y, flip });
          else if (roll < 0.03) stamps.push({ sprite: tree(), x, y, flip });
          break;
        case 'plains':
        case 'custom':
          if (n > 0.62) stamps.push({ sprite: tree(), x, y, flip });
          else if (roll < 0.02) stamps.push({ sprite: tree(), x, y, flip });
          else if (roll > 0.985) patches.push({ x, y, rx: 10 + rng() * 18, ry: 5 + rng() * 9 });
          break;
        case 'mountain': {
          if (roll > 0.85) break;
          const nearEdge = distanceToPolygonEdge(x, y, surface.ring) < 8;
          const sprite = nearEdge ? pick(PEAKS_SMALL) : rng() < 0.35 ? pick(PEAKS_SNOW) : pick(PEAKS_GREY);
          stamps.push({ sprite, x, y, flip: false });
          break;
        }
        case 'swamp':
          if (roll < 0.12) stamps.push({ sprite: pick(ROUND_TREES), x, y, flip });
          break;
        case 'desert':
        case 'ice':
        case 'volcanic':
        case 'void':
          if (roll < 0.03) stamps.push({ sprite: pick(ROCKS), x, y, flip });
          break;
        default:
          break;
      }
    }
  }

  // Palms ring any water that sits inside sand (oases)
  for (const fill of fills) {
    if (fill.kind !== 'lake') continue;
    const c = polygonCentroid(fill.ring);
    const around = fills.find((f) => f !== fill && f.kind === 'sand' && pointInPolygon(c.x, c.y, f.ring));
    if (!around) continue;
    const b = polygonBounds(fill.ring);
    const rx = (b.maxX - b.minX) / 2 + 7;
    const ry = (b.maxY - b.minY) / 2 + 5;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      stamps.push({
        sprite: PALMS[i % PALMS.length],
        x: Math.round(c.x + Math.cos(a) * rx),
        y: Math.round(c.y + Math.sin(a) * ry + 4),
        flip: i % 2 === 0,
      });
    }
  }

  stamps.sort((a, b) => a.y - b.y || a.x - b.x);

  return {
    width,
    height,
    backdrop,
    land: fills.filter((f) => f.kind !== 'water' && f.kind !== 'lake').map((f) => f.ring),
    fills,
    patches,
    rivers,
    bridges,
    stamps,
  };
}
