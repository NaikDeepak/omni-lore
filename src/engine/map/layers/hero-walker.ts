/**
 * Pure hero token walking math. Constant speed along a polyline, capped
 * duration, retargetable mid-walk. Never leaves the final target.
 */

import { MapPoint } from '../../../projections/map-snapshot-diff';
import { ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { pointAlongPolyline, polylineLength, slicePolyline } from '../scene/geometry';

export const HERO_JUMP_WAYPOINTS = 12;

export function heroTrailPoints(snapshot: ProjectedWorldMapSnapshot): MapPoint[] {
  const path = snapshot.characterPaths.find((p) => p.characterId === snapshot.activeCharacterId);
  return path ? path.waypoints.map((w) => ({ x: w.x, y: w.y })) : [];
}

export interface WalkerOptions {
  speed?: number;
  maxDurationMs?: number;
}

export class HeroWalker {
  public position: MapPoint | null = null;
  private path: MapPoint[] = [];
  private total = 0;
  private traveled = 0;
  private speed: number;

  constructor(private readonly options: WalkerOptions = {}) {
    this.speed = options.speed ?? 220;
  }

  public get isWalking(): boolean {
    return this.path.length > 1 && this.traveled < this.total;
  }

  public get traveledPath(): MapPoint[] {
    return this.isWalking ? slicePolyline(this.path, this.traveled) : [];
  }

  public teleport(point: MapPoint | null): void {
    this.position = point ? { x: point.x, y: point.y } : null;
    this.path = [];
    this.total = 0;
    this.traveled = 0;
  }

  public walk(path: MapPoint[]): void {
    if (path.length === 0) return;
    if (path.length === 1) {
      this.teleport(path[0]);
      return;
    }
    const start = this.position ?? path[0];
    const points = [{ x: start.x, y: start.y }, ...path.slice(1).map((p) => ({ x: p.x, y: p.y }))];
    const total = polylineLength(points);
    if (total === 0) {
      this.teleport(points[points.length - 1]);
      return;
    }
    this.path = points;
    this.total = total;
    this.traveled = 0;
    const maxSeconds = (this.options.maxDurationMs ?? 1600) / 1000;
    this.speed = Math.max(this.options.speed ?? 220, total / maxSeconds);
    this.position = { x: start.x, y: start.y };
  }

  public tick(dtMs: number): MapPoint | null {
    if (!this.isWalking) return this.position;
    this.traveled = Math.min(this.total, this.traveled + (this.speed * dtMs) / 1000);
    this.position = pointAlongPolyline(this.path, this.traveled);
    if (this.traveled >= this.total) {
      const end = this.path[this.path.length - 1];
      this.position = { x: end.x, y: end.y };
      this.path = [];
    }
    return this.position;
  }
}
