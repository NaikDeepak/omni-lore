/**
 * Persistent ambient atmosphere: per-universe particles, drifting cloud
 * shadows, and a faint cursor torch-light.
 */

import { Container, Graphics, Sprite } from 'pixi.js';
import { MapTheme } from '../../../domain/map-themes';
import { mulberry32 } from '../scene/prng';
import { LayerContext } from './layer-context';

export type ParticleMotion = 'rise' | 'fall' | 'drift' | 'swirl';

export interface ParticleStyle {
  color: string;
  count: number;
  motion: ParticleMotion;
  minSize: number;
  maxSize: number;
  alpha: number;
  twinkle: boolean;
}

export interface Particle {
  x: number;
  y: number;
  size: number;
  phase: number;
}

export interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
}

export function particleStyleFor(theme: MapTheme): ParticleStyle {
  const type = theme.atmosphereParticles?.type ?? 'drift';
  const color = theme.atmosphereParticles?.color ?? theme.palette.primaryAccent;
  const count = Math.min(120, Math.max(1, (theme.atmosphereParticles?.count ?? 25) * 3));
  switch (type) {
    case 'elemental_spark':
      return { color, count, motion: 'rise', minSize: 1, maxSize: 2, alpha: 0.8, twinkle: true };
    case 'ink_mist':
      return { color, count, motion: 'drift', minSize: 3, maxSize: 5, alpha: 0.18, twinkle: false };
    case 'cosmic_star':
      return { color, count, motion: 'drift', minSize: 1, maxSize: 2, alpha: 0.9, twinkle: true };
    case 'sea_spray':
      return { color, count, motion: 'swirl', minSize: 1, maxSize: 2, alpha: 0.5, twinkle: false };
    case 'shadow_wisp':
      return { color, count, motion: 'rise', minSize: 2, maxSize: 3, alpha: 0.45, twinkle: true };
    case 'demonic_ember':
      return { color, count, motion: 'fall', minSize: 1, maxSize: 2, alpha: 0.75, twinkle: true };
    default:
      return { color, count, motion: 'drift', minSize: 1, maxSize: 2, alpha: 0.5, twinkle: false };
  }
}

export class AtmosphereLayer {
  public readonly particles: Particle[] = [];
  public readonly clouds: Cloud[] = [];

  private readonly particleGraphics = new Graphics();
  private readonly cloudGraphics = new Graphics();
  private readonly cursorLight: Sprite;
  private readonly style: ParticleStyle;
  private width = 0;
  private height = 0;
  private time = 0;

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    this.style = particleStyleFor(ctx.theme);
    this.cursorLight = new Sprite(ctx.atlas.softDisc());
    this.cursorLight.anchor.set(0.5);
    this.cursorLight.blendMode = 'add';
    this.cursorLight.tint = ctx.theme.palette.primaryAccent;
    this.cursorLight.alpha = 0;
    this.cursorLight.scale.set(1.2);
    this.container.addChild(this.cloudGraphics, this.particleGraphics, this.cursorLight);
  }

  public reset(width: number, height: number, seed: number): void {
    this.width = width;
    this.height = height;
    this.particles.length = 0;
    this.clouds.length = 0;
    if (this.ctx.reducedMotion) {
      this.redraw();
      return;
    }
    const rng = mulberry32(seed);
    for (let i = 0; i < this.style.count; i++) {
      this.particles.push({
        x: rng() * width,
        y: rng() * height,
        size: Math.round(this.style.minSize + rng() * (this.style.maxSize - this.style.minSize)),
        phase: rng(),
      });
    }
    for (let i = 0; i < 4; i++) {
      this.clouds.push({
        x: rng() * width,
        y: rng() * height,
        w: 180 + rng() * 220,
        h: 60 + rng() * 60,
        speed: 0.004 + rng() * 0.006,
      });
    }
    this.redraw();
  }

  public setCursor(point: { x: number; y: number } | null): void {
    if (!point || this.ctx.reducedMotion) {
      this.cursorLight.alpha = 0;
      return;
    }
    this.cursorLight.position.set(point.x, point.y);
    this.cursorLight.alpha = 0.12;
  }

  public update(dtMs: number): void {
    if (this.particles.length === 0 && this.clouds.length === 0) return;
    this.time += dtMs;
    const { motion } = this.style;
    for (const p of this.particles) {
      const sway = Math.sin(this.time / 900 + p.phase * 6.28);
      switch (motion) {
        case 'rise':
          p.y -= 0.012 * dtMs;
          p.x += sway * 0.01 * dtMs;
          break;
        case 'fall':
          p.y += 0.015 * dtMs;
          p.x += sway * 0.008 * dtMs;
          break;
        case 'swirl':
          p.x += 0.02 * dtMs;
          p.y += Math.sin(this.time / 400 + p.phase * 6.28) * 0.01 * dtMs;
          break;
        case 'drift':
        default:
          p.x += 0.006 * dtMs;
          p.y += sway * 0.004 * dtMs;
          break;
      }
      p.x = ((p.x % this.width) + this.width) % this.width;
      p.y = ((p.y % this.height) + this.height) % this.height;
    }
    for (const c of this.clouds) {
      c.x += c.speed * dtMs;
      if (c.x - c.w > this.width) c.x = -c.w;
    }
    this.redraw();
  }

  public destroy(): void {
    this.particles.length = 0;
    this.clouds.length = 0;
    this.container.removeChild(this.cloudGraphics, this.particleGraphics, this.cursorLight);
    this.cloudGraphics.destroy();
    this.particleGraphics.destroy();
    this.cursorLight.destroy();
  }

  private redraw(): void {
    const cg = this.cloudGraphics;
    cg.clear();
    for (const c of this.clouds) cg.ellipse(c.x, c.y, c.w / 2, c.h / 2).fill({ color: '#000000', alpha: 0.12 });

    const pg = this.particleGraphics;
    pg.clear();
    const { color, alpha, twinkle } = this.style;
    for (const p of this.particles) {
      const a = twinkle ? alpha * (0.6 + 0.4 * Math.sin(this.time / 250 + p.phase * 60)) : alpha;
      pg.rect(Math.round(p.x), Math.round(p.y), p.size, p.size).fill({ color, alpha: a });
    }
  }
}
