/**
 * Region borders (hover-highlighted) and faction territory tints.
 */

import { Container, Graphics } from 'pixi.js';
import { MapRegion } from '../../../domain/map-types';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { LayerContext } from './layer-context';

export class RegionsLayer {
  private readonly territories = new Graphics();
  private readonly regions = new Map<string, { region: MapRegion; g: Graphics }>();
  private hoveredId: string | null = null;

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    this.container.addChild(this.territories);
  }

  public get regionCount(): number {
    return this.regions.size;
  }

  public sync(snapshot: ProjectedWorldMapSnapshot): void {
    const keep = new Set(snapshot.regions.map((r) => r.id));
    for (const [id, entry] of this.regions) {
      if (!keep.has(id)) {
        entry.g.destroy();
        this.regions.delete(id);
      }
    }
    for (const region of snapshot.regions) {
      let entry = this.regions.get(region.id);
      if (!entry) {
        entry = { region, g: new Graphics() };
        this.regions.set(region.id, entry);
        this.container.addChild(entry.g);
      }
      entry.region = region;
      this.drawRegion(entry.g, region, region.id === this.hoveredId);
    }
    if (this.hoveredId && !keep.has(this.hoveredId)) this.hoveredId = null;

    const t = this.territories;
    t.clear();
    const color = this.ctx.theme.palette.secondaryAccent ?? this.ctx.theme.palette.primaryAccent;
    for (const territory of snapshot.territories) {
      if (!territory.boundary || territory.boundary.length < 3) continue;
      const flat = territory.boundary.flat();
      const alpha = (territory.currentInfluencePct / 100) * 0.16;
      t.poly(flat).fill({ color, alpha });
      t.poly(flat).stroke({ color, width: 2, alpha: Math.min(1, alpha * 3) });
    }
  }

  public setHovered(id: string | null): void {
    if (id === this.hoveredId) return;
    const previous = this.hoveredId;
    this.hoveredId = id;
    for (const target of [previous, id]) {
      if (!target) continue;
      const entry = this.regions.get(target);
      if (entry) this.drawRegion(entry.g, entry.region, target === id);
    }
  }

  public destroy(): void {
    for (const entry of this.regions.values()) entry.g.destroy();
    this.regions.clear();
    this.territories.destroy();
    this.container.removeChildren();
  }

  private drawRegion(g: Graphics, region: MapRegion, hovered: boolean): void {
    g.clear();
    if (!hovered) return; // borders only on hover: keep the level-select art clean
    const accent = this.ctx.theme.palette.primaryAccent;
    const polygons =
      region.geometry.type === 'Polygon'
        ? [region.geometry.coordinates as number[][][]]
        : (region.geometry.coordinates as number[][][][]);
    for (const polygon of polygons) {
      for (const ring of polygon) {
        const flat = ring.flat();
        if (flat.length < 6) continue;
        g.poly(flat).fill({ color: '#ffffff', alpha: 0.08 });
        g.poly(flat).stroke({ color: accent, width: 3, alpha: 0.9 });
      }
    }
  }
}
