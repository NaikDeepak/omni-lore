/**
 * Pure fog-of-war aperture model: which circles are open and how their
 * radii animate toward targets.
 */

import { isDiscoveredStatus } from '../../../projections/map-snapshot-diff';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';

export const APERTURE_RADIUS = { critical: 70, other: 45, waypoint: 50 } as const;

export interface ApertureTarget {
  x: number;
  y: number;
  radius: number;
}

export function computeApertureTargets(snapshot: ProjectedWorldMapSnapshot): Map<string, ApertureTarget> {
  const targets = new Map<string, ApertureTarget>();
  for (const loc of snapshot.locations) {
    if (!isDiscoveredStatus(loc.fogStatus)) continue;
    targets.set(`loc:${loc.id}`, {
      x: loc.x,
      y: loc.y,
      radius: loc.importance === 'critical' ? APERTURE_RADIUS.critical : APERTURE_RADIUS.other,
    });
  }
  const path = snapshot.characterPaths.find((p) => p.characterId === snapshot.activeCharacterId);
  for (const wp of path?.waypoints ?? []) {
    targets.set(`wp:${wp.chapter}:${wp.x}:${wp.y}`, { x: wp.x, y: wp.y, radius: APERTURE_RADIUS.waypoint });
  }
  return targets;
}

export interface Aperture {
  id: string;
  x: number;
  y: number;
  radius: number;
  target: number;
}

export class ApertureField {
  public readonly apertures = new Map<string, Aperture>();

  public get isAnimating(): boolean {
    for (const a of this.apertures.values()) if (a.radius !== a.target) return true;
    return false;
  }

  public sync(targets: Map<string, ApertureTarget>, animate: boolean): { opened: string[]; closed: string[] } {
    const opened: string[] = [];
    const closed: string[] = [];

    for (const [id, target] of targets) {
      const existing = this.apertures.get(id);
      if (existing) {
        existing.x = target.x;
        existing.y = target.y;
        existing.target = target.radius;
        if (!animate) existing.radius = target.radius;
      } else {
        this.apertures.set(id, {
          id,
          x: target.x,
          y: target.y,
          radius: animate ? 0 : target.radius,
          target: target.radius,
        });
        if (animate) opened.push(id);
      }
    }

    for (const [id, aperture] of this.apertures) {
      if (targets.has(id)) continue;
      if (!animate) {
        this.apertures.delete(id);
        continue;
      }
      if (aperture.target !== 0) {
        aperture.target = 0;
        closed.push(id);
      }
    }

    return { opened, closed };
  }

  public tick(dtMs: number): boolean {
    let changed = false;
    for (const [id, a] of this.apertures) {
      if (a.radius === a.target) {
        if (a.target === 0) this.apertures.delete(id);
        continue;
      }
      const tau = a.target > a.radius ? 180 : 90;
      const k = 1 - Math.exp(-dtMs / tau);
      a.radius += (a.target - a.radius) * k;
      if (Math.abs(a.target - a.radius) < 0.5) a.radius = a.target;
      if (a.target === 0 && a.radius === 0) this.apertures.delete(id);
      changed = true;
    }
    return changed;
  }

  public list(): Aperture[] {
    return Array.from(this.apertures.values());
  }
}
