/**
 * Transient pixel effects: discovery bursts and waypoint warp spirals.
 * Visual-only randomness (Math.random is fine here; nothing is baked).
 */

import { Container, Graphics } from 'pixi.js';
import { LayerContext } from './layer-context';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Ring {
  x: number;
  y: number;
  fromRadius: number;
  toRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

export class FxLayer {
  private readonly g = new Graphics();
  private sparks: Spark[] = [];
  private rings: Ring[] = [];

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    this.container.addChild(this.g);
  }

  public get activeCount(): number {
    return this.sparks.length + this.rings.length;
  }

  public burst(x: number, y: number, radius: number, color: string): void {
    if (this.ctx.reducedMotion) return;
    this.rings.push({ x, y, fromRadius: 0, toRadius: radius, life: 0, maxLife: 900, color });
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 0.05 + Math.random() * 0.08;
      this.sparks.push({
        x: x + Math.cos(angle) * radius * 0.6,
        y: y + Math.sin(angle) * radius * 0.6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.02,
        life: 0,
        maxLife: 600 + Math.random() * 500,
        color: i % 3 === 0 ? '#fff4d6' : color,
        size: 2,
      });
    }
  }

  public warp(x: number, y: number, color: string): void {
    if (this.ctx.reducedMotion) return;
    this.rings.push({ x, y, fromRadius: 90, toRadius: 0, life: 0, maxLife: 350, color: '#ffffff' });
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const r = 90;
      this.sparks.push({
        x: x + Math.cos(angle) * r,
        y: y + Math.sin(angle) * r,
        vx: -Math.sin(angle) * 0.25 - Math.cos(angle) * 0.25,
        vy: Math.cos(angle) * 0.25 - Math.sin(angle) * 0.25,
        life: 0,
        maxLife: 350,
        color,
        size: 2,
      });
    }
  }

  public update(dtMs: number): void {
    if (this.activeCount === 0) return;
    for (const s of this.sparks) {
      s.x += s.vx * dtMs;
      s.y += s.vy * dtMs;
      s.life += dtMs;
    }
    for (const r of this.rings) r.life += dtMs;
    this.sparks = this.sparks.filter((s) => s.life < s.maxLife);
    this.rings = this.rings.filter((r) => r.life < r.maxLife);
    this.redraw();
  }

  public clear(): void {
    this.sparks = [];
    this.rings = [];
    this.g.clear();
  }

  public destroy(): void {
    this.clear();
    this.g.destroy();
    this.container.removeChild(this.g);
  }

  private redraw(): void {
    const g = this.g;
    g.clear();
    for (const r of this.rings) {
      const t = r.life / r.maxLife;
      const radius = r.fromRadius + (r.toRadius - r.fromRadius) * t;
      if (radius > 0.5) g.circle(r.x, r.y, radius).stroke({ color: r.color, width: 2, alpha: 1 - t });
    }
    for (const s of this.sparks) {
      g.rect(Math.round(s.x), Math.round(s.y), s.size, s.size).fill({
        color: s.color,
        alpha: 1 - s.life / s.maxLife,
      });
    }
  }
}
