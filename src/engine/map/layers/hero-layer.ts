/**
 * Protagonist token: framed avatar with a flickering torch-light that walks
 * the journey path when the chapter changes, drawing a glowing trail.
 */

import { Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { MapMode } from '../../../domain/map-types';
import { MapPoint, MapSnapshotDiff } from '../../../projections/map-snapshot-diff';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { HERO_JUMP_WAYPOINTS, HeroWalker, heroTrailPoints } from './hero-walker';
import { LayerContext } from './layer-context';

export class HeroLayer {
  public readonly walker = new HeroWalker();

  private readonly trail = new Graphics();
  private readonly token = new Container();
  private readonly frame = new Graphics();
  private readonly light: Sprite;
  private avatar: Sprite | null = null;
  private avatarMask: Graphics | null = null;
  private avatarLoadToken = 0;
  private trailBase: MapPoint[] = [];
  private trailFull: MapPoint[] = [];
  private time = 0;
  private trailWidth = 6;

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    const { primaryAccent, secondaryAccent } = ctx.theme.palette;
    this.light = new Sprite(ctx.atlas.softDisc());
    this.light.anchor.set(0.5);
    this.light.blendMode = 'add';
    this.light.tint = '#ffb347';
    this.light.alpha = 0.35;
    this.light.scale.set(1.6);

    this.frame.circle(0, 0, 11).fill('#0b0b10').stroke({ color: primaryAccent, width: 2 });
    this.frame.circle(0, 0, 5).fill(secondaryAccent ?? primaryAccent);

    this.token.addChild(this.light, this.frame);
    this.token.visible = false;
    this.container.addChild(this.trail, this.token);
  }

  public get tokenVisible(): boolean {
    return this.token.visible;
  }

  public get tokenPosition(): MapPoint | null {
    return this.token.visible ? this.walker.position : null;
  }

  public get trailPoints(): MapPoint[] {
    return this.walker.isWalking && this.walker.position
      ? [...this.trailBase, this.walker.position]
      : this.trailBase;
  }

  public get avatarTexture(): Texture | null {
    return this.avatar?.texture ?? null;
  }

  public async setAvatar(url: string | undefined): Promise<void> {
    // Every call (and destroy) bumps the token, so a slower earlier load can never win
    const token = ++this.avatarLoadToken;
    if (!url || typeof window === 'undefined') return;
    try {
      const texture = await Assets.load<Texture>(url);
      if (token !== this.avatarLoadToken) return;
      texture.source.scaleMode = 'nearest';
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      sprite.width = 18;
      sprite.height = 18;
      const mask = new Graphics().circle(0, 0, 9).fill('#ffffff');
      sprite.mask = mask;
      this.avatar?.destroy();
      this.avatarMask?.destroy();
      this.token.addChild(mask, sprite);
      this.avatar = sprite;
      this.avatarMask = mask;
    } catch {
      // Keep the pixel core fallback when the avatar cannot load
    }
  }

  public setMode(mode: MapMode): void {
    this.trailWidth = mode === 'adventure' ? 8 : 6;
    this.redrawTrail();
  }

  public sync(snapshot: ProjectedWorldMapSnapshot, diff: MapSnapshotDiff): void {
    const all = heroTrailPoints(snapshot);
    const to = diff.hero.to;

    if (!to) {
      this.token.visible = false;
      this.walker.teleport(null);
      this.trailBase = all;
      this.trailFull = all;
      this.redrawTrail();
      return;
    }

    this.token.visible = true;
    const jump = diff.hero.path.length > HERO_JUMP_WAYPOINTS;
    const instant =
      diff.hero.direction === 'none' || this.ctx.reducedMotion || jump || !this.walker.position;

    if (instant) {
      this.walker.teleport(to);
      this.trailBase = all;
      this.trailFull = all;
      if (jump && !this.ctx.reducedMotion) {
        this.ctx.tweens.to('hero:alpha', {
          from: 0,
          to: 1,
          durationMs: 300,
          onUpdate: (v) => {
            this.token.alpha = v;
          },
        });
      } else {
        this.token.alpha = 1;
      }
    } else {
      const segment = diff.hero.path;
      this.trailBase =
        diff.hero.direction === 'forward'
          ? all.slice(0, Math.max(1, all.length - segment.length + 1))
          : all;
      this.trailFull = all;
      this.walker.walk(segment);
    }
    this.placeToken();
    this.redrawTrail();
  }

  public update(dtMs: number): void {
    this.time += dtMs;
    const wasWalking = this.walker.isWalking;
    this.walker.tick(dtMs);
    this.placeToken();
    if (!this.ctx.reducedMotion) {
      this.light.alpha = 0.33 + 0.03 * Math.sin(this.time / 97) + 0.02 * Math.sin(this.time / 41);
    }
    if (wasWalking && !this.walker.isWalking) {
      this.trailBase = this.trailFull;
    }
    if (wasWalking) this.redrawTrail();
  }

  public destroy(): void {
    this.avatarLoadToken += 1;
    this.ctx.tweens.cancel('hero:alpha');
    this.container.removeChildren();
    this.trail.destroy();
    this.token.destroy({ children: true });
    this.avatar = null;
    this.avatarMask = null;
  }

  private placeToken(): void {
    const p = this.walker.position;
    if (!p) return;
    const bob = this.ctx.reducedMotion ? 0 : Math.round(Math.sin(this.time / 300));
    this.token.position.set(Math.round(p.x), Math.round(p.y) - 14 - bob);
  }

  private redrawTrail(): void {
    const g = this.trail;
    g.clear();
    const points = this.trailPoints;
    if (points.length >= 2) {
      // Level-select journey path: dark dirt edge, tan center (stage badges come from the markers layer)
      for (const [extra, color] of [[4, '#6e4824'], [0, '#e0b86a']] as const) {
        g.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
        g.stroke({ color, width: this.trailWidth + extra, cap: 'round', join: 'round' });
      }
    }
  }
}
