/**
 * OmniLore Map Engine v3 - Pure Snapshot Diff
 *
 * Compares two consecutive projected snapshots so the renderer can animate
 * changes (hero walks, fog reveals, marker fades) instead of redrawing.
 */

import { FogStatus, ProjectedWorldMapSnapshot } from './temporal-map';

export interface MapPoint {
  x: number;
  y: number;
}

export type HeroDirection = 'forward' | 'backward' | 'none';

export interface HeroMove {
  from: MapPoint | null;
  to: MapPoint | null;
  path: MapPoint[];
  direction: HeroDirection;
}

export interface MapSnapshotDiff {
  planeChanged: boolean;
  addedLocationIds: string[];
  removedLocationIds: string[];
  newlyDiscoveredIds: string[];
  concealedIds: string[];
  statusChanges: { id: string; from: FogStatus; to: FogStatus }[];
  addedRouteIds: string[];
  removedRouteIds: string[];
  addedGlyphIds: string[];
  removedGlyphIds: string[];
  hero: HeroMove;
}

const DISCOVERED_STATUSES = new Set<FogStatus>([
  FogStatus.DISCOVERED,
  FogStatus.REVEALED,
  FogStatus.CURRENT,
]);

export function isDiscoveredStatus(status: FogStatus): boolean {
  return DISCOVERED_STATUSES.has(status);
}

function idDelta(prev: string[], next: string[]): { added: string[]; removed: string[] } {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  return {
    added: next.filter((id) => !prevSet.has(id)),
    removed: prev.filter((id) => !nextSet.has(id)),
  };
}

function heroPathPoints(snapshot: ProjectedWorldMapSnapshot): MapPoint[] {
  const path = snapshot.characterPaths.find((p) => p.characterId === snapshot.activeCharacterId);
  return path ? path.waypoints.map((w) => ({ x: w.x, y: w.y })) : [];
}

function toPoint(position: { x: number; y: number } | null | undefined): MapPoint | null {
  return position ? { x: position.x, y: position.y } : null;
}

function computeHeroMove(
  prev: ProjectedWorldMapSnapshot | null,
  next: ProjectedWorldMapSnapshot,
  planeChanged: boolean
): HeroMove {
  const to = toPoint(next.currentPosition);
  const still = (from: MapPoint | null): HeroMove => ({
    from,
    to,
    path: to ? [to] : [],
    direction: 'none',
  });

  if (!prev || planeChanged || prev.activeCharacterId !== next.activeCharacterId) {
    return still(null);
  }

  const from = toPoint(prev.currentPosition);
  if (!from || !to) return still(from);

  const prevPoints = heroPathPoints(prev);
  const nextPoints = heroPathPoints(next);
  if (prevPoints.length === nextPoints.length) return still(from);

  const forward = nextPoints.length > prevPoints.length;
  const longer = forward ? nextPoints : prevPoints;
  const lo = Math.min(prevPoints.length, nextPoints.length) - 1;
  const hi = Math.max(prevPoints.length, nextPoints.length) - 1;
  const segment = longer.slice(Math.max(0, lo), hi + 1);

  return {
    from,
    to,
    path: forward ? segment : segment.slice().reverse(),
    direction: forward ? 'forward' : 'backward',
  };
}

export function diffMapSnapshots(
  prev: ProjectedWorldMapSnapshot | null,
  next: ProjectedWorldMapSnapshot
): MapSnapshotDiff {
  const planeChanged = prev !== null && prev.planeId !== next.planeId;
  const comparable = prev && !planeChanged ? prev : null;

  const locationDelta = idDelta(
    (prev?.locations ?? []).map((l) => l.id),
    next.locations.map((l) => l.id)
  );
  const routeDelta = idDelta(
    (prev?.routes ?? []).map((r) => r.id),
    next.routes.map((r) => r.id)
  );
  const glyphDelta = idDelta(
    (prev?.landmarkGlyphs ?? []).map((g) => g.id),
    next.landmarkGlyphs.map((g) => g.id)
  );

  const newlyDiscoveredIds: string[] = [];
  const concealedIds: string[] = [];
  const statusChanges: MapSnapshotDiff['statusChanges'] = [];

  if (comparable) {
    const prevById = new Map(comparable.locations.map((l) => [l.id, l]));
    const nextById = new Map(next.locations.map((l) => [l.id, l]));

    for (const loc of next.locations) {
      const before = prevById.get(loc.id)?.fogStatus ?? FogStatus.UNKNOWN;
      if (before !== loc.fogStatus) {
        statusChanges.push({ id: loc.id, from: before, to: loc.fogStatus });
      }
      if (!isDiscoveredStatus(before) && isDiscoveredStatus(loc.fogStatus)) {
        newlyDiscoveredIds.push(loc.id);
      }
    }

    for (const loc of comparable.locations) {
      const after = nextById.get(loc.id);
      const afterStatus = after?.fogStatus ?? FogStatus.UNKNOWN;
      if (!after) {
        statusChanges.push({ id: loc.id, from: loc.fogStatus, to: FogStatus.UNKNOWN });
      }
      if (isDiscoveredStatus(loc.fogStatus) && !isDiscoveredStatus(afterStatus)) {
        concealedIds.push(loc.id);
      }
    }
  }

  return {
    planeChanged,
    addedLocationIds: locationDelta.added,
    removedLocationIds: locationDelta.removed,
    newlyDiscoveredIds,
    concealedIds,
    statusChanges,
    addedRouteIds: routeDelta.added,
    removedRouteIds: routeDelta.removed,
    addedGlyphIds: glyphDelta.added,
    removedGlyphIds: glyphDelta.removed,
    hero: computeHeroMove(prev, next, planeChanged),
  };
}
