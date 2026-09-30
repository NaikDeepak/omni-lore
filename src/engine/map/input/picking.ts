/**
 * Deterministic world-space hit testing for markers, event flags and regions.
 * Used instead of Pixi's per-object event system so drags never trigger clicks.
 */

import { FogStatus, ProjectedWorldMapSnapshot } from '../../../projections/temporal-map';
import { pointInPolygon, Vec2 } from '../scene/geometry';

export type PickTarget =
  | { kind: 'location'; id: string }
  | { kind: 'event'; id: string }
  | { kind: 'region'; id: string };

/** Event flag position relative to its location (world units). */
export const EVENT_FLAG_OFFSET = { x: 10, y: -26 } as const;
/** Icons are bottom-anchored and drawn above the point: pick around the icon's visual center. */
export const PICK_CENTER_OFFSET_Y = 10;
const EVENT_FLAG_RADIUS = 7;

export function pickAt(
  snapshot: ProjectedWorldMapSnapshot,
  worldX: number,
  worldY: number,
  zoom: number
): PickTarget | null {
  const safeZoom = Math.max(zoom, 0.05);
  const byId = new Map(snapshot.locations.map((l) => [l.id, l]));

  // 1. Event flags (drawn above markers)
  for (const ev of snapshot.events) {
    const loc = ev.locationId ? byId.get(ev.locationId) : undefined;
    if (!loc || loc.fogStatus === FogStatus.UNKNOWN) continue;
    const fx = loc.x + EVENT_FLAG_OFFSET.x;
    const fy = loc.y + EVENT_FLAG_OFFSET.y;
    if (Math.hypot(worldX - fx, worldY - fy) <= EVENT_FLAG_RADIUS) return { kind: 'event', id: ev.id };
  }

  // 2. Nearest location within its pick radius
  let best: { id: string; distance: number } | null = null;
  for (const loc of snapshot.locations) {
    if (loc.fogStatus === FogStatus.UNKNOWN) continue;
    const radius =
      loc.importance === 'critical' ? Math.max(20, 14 / safeZoom) : Math.max(16, 12 / safeZoom);
    const distance = Math.hypot(worldX - loc.x, worldY - (loc.y - PICK_CENTER_OFFSET_Y));
    if (distance <= radius && (!best || distance < best.distance)) best = { id: loc.id, distance };
  }
  if (best) return { kind: 'location', id: best.id };

  // 3. Topmost (last drawn) region containing the point
  for (let i = snapshot.regions.length - 1; i >= 0; i--) {
    const region = snapshot.regions[i];
    const polygons =
      region.geometry.type === 'Polygon'
        ? [region.geometry.coordinates as number[][][]]
        : (region.geometry.coordinates as number[][][][]);
    for (const polygon of polygons) {
      const outer = polygon[0] as unknown as Vec2[];
      if (outer && outer.length >= 3 && pointInPolygon(worldX, worldY, outer)) {
        return { kind: 'region', id: region.id };
      }
    }
  }

  return null;
}

/**
 * Whether a picked target may be selected (opened in the drawer / written to `?loc=`).
 * KNOWN locations are hoverable silhouettes (`??? UNCHARTED`) but never selectable,
 * and neither are event flags standing on them: selecting would reveal the real name.
 */
export function isSelectableTarget(snapshot: ProjectedWorldMapSnapshot, target: PickTarget): boolean {
  const isOpen = (locationId: string | undefined): boolean => {
    const loc = locationId ? snapshot.locations.find((l) => l.id === locationId) : undefined;
    return Boolean(loc && loc.fogStatus !== FogStatus.UNKNOWN && loc.fogStatus !== FogStatus.KNOWN);
  };
  if (target.kind === 'location') return isOpen(target.id);
  if (target.kind === 'event') return isOpen(snapshot.events.find((e) => e.id === target.id)?.locationId);
  return true;
}
