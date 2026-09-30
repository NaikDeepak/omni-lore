/**
 * Fog of war: a low-resolution reveal mask (soft discs per aperture)
 * rendered into a RenderTexture and shown through a world-anchored
 * Bayer-dither mesh shader.
 */

import { Container, Mesh, RenderTexture, Renderer, Sprite } from 'pixi.js';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { SOFT_DISC_RADIUS } from '../scene/icon-atlas';
import { getUniverseLook } from '../scene/universe-look';
import { ApertureField, computeApertureTargets } from './fog-apertures';
import { createFogQuad, DitherFogMaterial } from './fog-material';
import { LayerContext } from './layer-context';

export const FOG_MASK_SCALE = 4;
const SOFT_EDGE = 1.35;

export class FogLayer {
  public readonly field = new ApertureField();

  private readonly maskRoot = new Container();
  private readonly discs: Sprite[] = [];
  private renderTexture: RenderTexture | null = null;
  private mesh: Mesh | null = null;
  private material: DitherFogMaterial | null = null;
  private dirty = true;
  private time = 0;

  constructor(
    private readonly container: Container,
    private readonly ctx: LayerContext,
    private readonly renderer: Renderer | null
  ) {}

  public resize(width: number, height: number): void {
    if (!this.renderer) return;
    this.disposeGpu();
    this.renderTexture = RenderTexture.create({
      width: Math.ceil(width / FOG_MASK_SCALE),
      height: Math.ceil(height / FOG_MASK_SCALE),
    });
    const look = getUniverseLook(this.ctx.theme.slug);
    this.material = new DitherFogMaterial({
      mask: this.renderTexture,
      color: look.fogColor,
      opacity: look.fogOpacity,
      worldWidth: width,
      worldHeight: height,
    });
    this.mesh = new Mesh({ geometry: createFogQuad(width, height), shader: this.material.shader as any });
    this.container.addChild(this.mesh!);
    this.dirty = true;
  }

  /** Returns ids of apertures that just started opening. */
  public sync(snapshot: ProjectedWorldMapSnapshot, animate: boolean): string[] {
    const { opened } = this.field.sync(computeApertureTargets(snapshot), animate && !this.ctx.reducedMotion);
    this.dirty = true;
    return opened;
  }

  public update(dtMs: number): void {
    const changed = this.field.tick(dtMs);
    if (!this.ctx.reducedMotion) this.time += dtMs;
    if (this.material) this.material.time = this.time / 1000;
    if (changed || this.dirty) this.redrawMask();
  }

  public destroy(): void {
    this.disposeGpu();
    this.maskRoot.destroy({ children: true });
  }

  private disposeGpu(): void {
    this.container.removeChildren();
    this.mesh?.destroy();
    this.material?.destroy();
    this.renderTexture?.destroy(true);
    this.mesh = null;
    this.material = null;
    this.renderTexture = null;
  }

  private redrawMask(): void {
    this.dirty = false;
    if (!this.renderer || !this.renderTexture) return;
    const apertures = this.field.list();
    while (this.discs.length < apertures.length) {
      const disc = new Sprite(this.ctx.atlas.softDisc());
      disc.anchor.set(0.5);
      this.discs.push(disc);
      this.maskRoot.addChild(disc);
    }
    this.discs.forEach((disc, i) => {
      const aperture = apertures[i];
      disc.visible = Boolean(aperture) && aperture.radius > 0;
      if (!aperture) return;
      disc.position.set(aperture.x / FOG_MASK_SCALE, aperture.y / FOG_MASK_SCALE);
      disc.scale.set((aperture.radius * SOFT_EDGE) / FOG_MASK_SCALE / SOFT_DISC_RADIUS);
    });
    this.renderer.render({ container: this.maskRoot, target: this.renderTexture, clear: true });
  }
}
