/**
 * Executes a PlaneLayout on a Canvas 2D context using the tileset sheets,
 * then applies the universe color grade. Browser-only at runtime; tested
 * with a recording fake context.
 */

import { PlaneBackdrop } from '../../../domain/map-types';
import { Vec2 } from './geometry';
import { GroundKind, PlaneLayout } from './plane-layout';
import { mulberry32 } from './prng';
import { GRASS_TILES, SheetId, SpriteDef, SpriteName, SPRITES } from './sprite-catalog';
import { gradePixels, UniverseLook } from './universe-look';
import { shade } from './pixel-palette';

export interface SheetImages {
  image(sheet: SheetId): CanvasImageSource | null;
}

export type CanvasFactory = (width: number, height: number) => HTMLCanvasElement;

const GROUND_COLORS: Record<Exclude<GroundKind, 'grass' | 'sand'>, string> = {
  snow: '#e8eef2',
  ash: '#4a3a36',
  bog: '#4a6a3a',
  voidstone: '#3a2f55',
};

function tracePath(ctx: CanvasRenderingContext2D, ring: Vec2[]): void {
  ctx.beginPath();
  ctx.moveTo(ring[0][0], ring[0][1]);
  for (let i = 1; i < ring.length; i++) ctx.lineTo(ring[i][0], ring[i][1]);
  ctx.closePath();
}

function tracePolyline(ctx: CanvasRenderingContext2D, points: Vec2[]): void {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
}

function backdropColor(backdrop: PlaneBackdrop, look: UniverseLook): string {
  switch (backdrop) {
    case 'sea':
    case 'river':
      return look.sea;
    case 'sky':
      return '#9cc8e8';
    case 'abyss':
      return '#141626';
    case 'void':
    default:
      return '#1c1830';
  }
}

/** 64x64 mosaic of random grass tiles, used as a repeating pattern. */
function grassPattern(
  ctx: CanvasRenderingContext2D,
  sheets: SheetImages,
  createCanvas: CanvasFactory,
  rng: () => number
): CanvasPattern | string {
  const sheet = sheets.image('puny');
  if (!sheet) return '#6a9c3c';
  const canvas = createCanvas(64, 64);
  const g = canvas.getContext('2d');
  if (!g) return '#6a9c3c';
  g.imageSmoothingEnabled = false;
  for (let y = 0; y < 64; y += 16) {
    for (let x = 0; x < 64; x += 16) {
      const def = SPRITES[GRASS_TILES[Math.floor(rng() * GRASS_TILES.length)]];
      g.drawImage(sheet, def.x, def.y, def.w, def.h, x, y, def.w, def.h);
    }
  }
  return ctx.createPattern(canvas, 'repeat') ?? '#6a9c3c';
}

/** Mountain sprite clipped to a triangle silhouette with a 1 px dark outline. */
function preparePeak(def: SpriteDef, sheet: CanvasImageSource, createCanvas: CanvasFactory): HTMLCanvasElement | null {
  const w = def.w + 2;
  const h = def.h + 2;
  const masked = createCanvas(w, h);
  const m = masked.getContext('2d');
  if (!m) return null;
  m.imageSmoothingEnabled = false;
  const lean = def.peak?.lean ?? 0;
  m.beginPath();
  m.moveTo(w / 2 + lean, 2);
  m.lineTo(w - 1, h - 1);
  m.lineTo(1, h - 1);
  m.closePath();
  m.save();
  m.clip();
  m.drawImage(sheet, def.x, def.y, def.w, def.h, 1, 1, def.w, def.h);
  m.restore();

  const out = createCanvas(w, h);
  const o = out.getContext('2d');
  if (!o) return masked;
  o.imageSmoothingEnabled = false;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) o.drawImage(masked, dx, dy);
  o.globalCompositeOperation = 'source-in';
  o.fillStyle = '#261e22';
  o.fillRect(0, 0, w, h);
  o.globalCompositeOperation = 'source-over';
  o.drawImage(masked, 0, 0);
  return out;
}

export function paintPlane(
  ctx: CanvasRenderingContext2D,
  layout: PlaneLayout,
  sheets: SheetImages,
  look: UniverseLook,
  createCanvas: CanvasFactory,
  seed: number
): void {
  const { width, height } = layout;
  const rng = mulberry32(seed);
  ctx.imageSmoothingEnabled = false;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 1. Backdrop
  ctx.fillStyle = backdropColor(layout.backdrop, look);
  ctx.fillRect(0, 0, width, height);
  const watery = layout.backdrop === 'sea' || layout.backdrop === 'river';
  if (watery) {
    ctx.fillStyle = look.seaDeep;
    for (let i = 0; i < (width * height) / 9000; i++) {
      ctx.beginPath();
      ctx.ellipse(rng() * width, rng() * height, 12 + rng() * 40, 6 + rng() * 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = shade(look.shallows, 0.35);
    ctx.lineWidth = 1;
    for (let i = 0; i < (width * height) / 1700; i++) {
      const x = Math.round(rng() * width);
      const y = Math.round(rng() * height);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - 1);
      ctx.lineTo(x + 4, y);
      ctx.stroke();
    }
  } else if (layout.backdrop === 'sky') {
    ctx.fillStyle = '#c4e0f4';
    for (let i = 0; i < (width * height) / 12000; i++) {
      ctx.beginPath();
      ctx.ellipse(rng() * width, rng() * height, 30 + rng() * 60, 10 + rng() * 20, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 1b. Open water (sea polygons) before the coast so shores stay intact
  ctx.fillStyle = look.sea;
  for (const fill of layout.fills) {
    if (fill.kind !== 'water') continue;
    tracePath(ctx, fill.ring);
    ctx.fill();
  }

  // 2. Coast treatment around land
  for (const ring of layout.land) {
    tracePath(ctx, ring);
    if (watery) {
      ctx.strokeStyle = look.shelf;
      ctx.lineWidth = 28;
      ctx.stroke();
      ctx.strokeStyle = look.shallows;
      ctx.lineWidth = 14;
      ctx.stroke();
      ctx.strokeStyle = look.foam;
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.strokeStyle = look.sand;
      ctx.lineWidth = 6;
      ctx.stroke();
    } else if (layout.backdrop === 'sky') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 16;
      ctx.stroke();
    } else {
      ctx.save();
      ctx.translate(3, 5);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      tracePath(ctx, ring);
      ctx.fill();
      ctx.restore();
    }
  }

  // 3. Fills in terrain order
  const grass = grassPattern(ctx, sheets, createCanvas, rng);
  for (const fill of layout.fills) {
    if (fill.kind === 'water') continue; // painted in step 1b
    tracePath(ctx, fill.ring);
    if (fill.kind === 'lake') {
      ctx.strokeStyle = look.sand;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = look.shallows;
      ctx.fill();
      continue;
    }
    ctx.fillStyle =
      fill.kind === 'grass' ? grass : fill.kind === 'sand' ? look.sand : GROUND_COLORS[fill.kind];
    ctx.fill();
    if (fill.kind === 'sand') {
      ctx.save();
      ctx.clip();
      ctx.fillStyle = shade(look.sand, -0.15);
      for (let i = 0; i < 400; i++) ctx.fillRect(Math.round(rng() * width), Math.round(rng() * height), 1, 1);
      ctx.restore();
    }
  }

  // 4. Grass tone patches
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (const p of layout.patches) {
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Rivers
  for (const river of layout.rivers) {
    if (river.points.length < 2) continue;
    tracePolyline(ctx, river.points);
    ctx.strokeStyle = look.sand;
    ctx.lineWidth = river.width + 4;
    ctx.stroke();
    ctx.strokeStyle = look.shelf;
    ctx.lineWidth = river.width;
    ctx.stroke();
    ctx.strokeStyle = look.shallows;
    ctx.lineWidth = Math.max(1, river.width / 3);
    ctx.stroke();
  }

  // 6. Bridges
  for (const [bx, by] of layout.bridges) {
    ctx.fillStyle = '#7e562c';
    ctx.fillRect(Math.round(bx - 7), Math.round(by - 5), 14, 10);
    ctx.fillStyle = '#5a3c1e';
    for (let i = -6; i <= 6; i += 3) ctx.fillRect(Math.round(bx + i), Math.round(by - 5), 1, 10);
  }

  // 7. Stamps (already y-sorted)
  const peakCache = new Map<SpriteName, HTMLCanvasElement | null>();
  for (const stamp of layout.stamps) {
    const def = SPRITES[stamp.sprite];
    const sheet = sheets.image(def.sheet);
    if (!sheet) continue;
    if (def.peak) {
      if (!peakCache.has(stamp.sprite)) peakCache.set(stamp.sprite, preparePeak(def, sheet, createCanvas));
      const peak = peakCache.get(stamp.sprite);
      if (peak) ctx.drawImage(peak, Math.round(stamp.x - peak.width / 2), Math.round(stamp.y - peak.height + 4));
      continue;
    }
    const dx = Math.round(stamp.x - def.w / 2);
    const dy = Math.round(stamp.y - def.h + 4);
    if (stamp.flip) {
      ctx.save();
      ctx.translate(dx + def.w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, def.x, def.y, def.w, def.h, 0, 0, def.w, def.h);
      ctx.restore();
    } else {
      ctx.drawImage(sheet, def.x, def.y, def.w, def.h, dx, dy, def.w, def.h);
    }
  }

  // 8. Per-universe color grade
  const image = ctx.getImageData(0, 0, width, height);
  gradePixels(image.data, look);
  ctx.putImageData(image, 0, 0);
}
