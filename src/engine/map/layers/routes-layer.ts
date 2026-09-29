/**
 * Animated pixel-dash travel routes (roads, sea lanes, flight/portal arcs,
 * secret paths).
 */

import { Container, Graphics } from 'pixi.js';
import { MapTheme } from '../../../domain/map-themes';
import { MapRoute } from '../../../domain/map-types';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { dashSegments, Pt } from '../scene/geometry';
import { shade } from '../scene/pixel-palette';
import { LayerContext } from './layer-context';

export const ROUTE_STYLES: Record<
  MapRoute['routeType'],
  { dash: number; gap: number; width: number; speed: number; alpha: number }
> = {
  road: { dash: 6, gap: 4, width: 2, speed: 0.012, alpha: 0.9 },
  sea: { dash: 2, gap: 6, width: 2, speed: 0.006, alpha: 0.7 },
  flight: { dash: 8, gap: 6, width: 2, speed: 0.02, alpha: 0.8 },
  portal: { dash: 8, gap: 6, width: 2, speed: 0.02, alpha: 0.8 },
  secret: { dash: 3, gap: 5, width: 1.5, speed: 0.008, alpha: 0.85 },
};

export const DIRT_EDGE = '#6e4824';
export const DIRT_TOP = '#d4a860';

export function routeColor(route: MapRoute, theme: MapTheme): string {
  const base = theme.palette.routeColor ?? theme.palette.primaryAccent;
  if (route.routeType === 'road') return DIRT_TOP;
  if (route.routeType === 'secret') return theme.palette.secondaryAccent ?? base;
  if (route.routeType === 'sea') return '#f4fbff';
  return shade(base, 0.2);
}

export class RoutesLayer {
  private readonly graphics = new Graphics();
  private routes: MapRoute[] = [];
  private phaseMs = 0;

  constructor(private readonly container: Container, private readonly ctx: LayerContext) {
    this.container.addChild(this.graphics);
  }

  public get routeCount(): number {
    return this.routes.length;
  }

  public get dashPhaseMs(): number {
    return this.phaseMs;
  }

  public sync(snapshot: ProjectedWorldMapSnapshot): void {
    this.routes = snapshot.routes.filter((r) => r.points.length >= 2);
    this.redraw();
  }

  public update(dtMs: number): void {
    if (this.ctx.reducedMotion || this.routes.length === 0) return;
    this.phaseMs += dtMs;
    this.redraw();
  }

  public destroy(): void {
    this.routes = [];
    this.graphics.destroy();
    this.container.removeChildren();
  }

  private redraw(): void {
    const g = this.graphics;
    g.clear();
    for (const route of this.routes) {
      const style = ROUTE_STYLES[route.routeType];
      const points: Pt[] = route.points.map(([x, y]) => ({ x, y }));
      const color = routeColor(route, this.ctx.theme);

      if (route.routeType === 'road') {
        // Level-select dirt path: dark edge, tan center, no animation
        for (const [width, stroke] of [[10, DIRT_EDGE], [6, DIRT_TOP]] as const) {
          g.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
          g.stroke({ color: stroke, width, cap: 'round', join: 'round' });
        }
        continue;
      }

      // Soft dark underlay so dashes read on any biome
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
      g.stroke({ color: '#000000', width: style.width + 2, alpha: 0.3 });

      const shimmer =
        route.routeType === 'flight' || route.routeType === 'portal'
          ? 0.75 + 0.25 * Math.sin(this.phaseMs / 300)
          : 1;
      for (const [a, b] of dashSegments(points, style.dash, style.gap, this.phaseMs * style.speed)) {
        g.moveTo(Math.round(a.x), Math.round(a.y)).lineTo(Math.round(b.x), Math.round(b.y));
      }
      g.stroke({ color, width: style.width, alpha: style.alpha * shimmer, cap: 'butt' });
    }
  }
}
