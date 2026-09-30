/**
 * Pure helpers for the atlas DOM overlays. Everything here is built only
 * from the current zero-spoiler snapshot (or chapter-gated definition data).
 */

import { DangerLevel, WorldMapDefinition } from '../../domain/map-types';
import { isDiscoveredStatus } from '../../projections/map-snapshot-diff';
import {
  FogStatus,
  ProjectedPlane,
  ProjectedWaypoint,
  ProjectedWorldMapSnapshot,
} from '../../projections/temporal-map';
import { PickTarget } from '../../engine/map/input/picking';

// ---------------------------------------------------------------- emitter

export interface Emitter<T> {
  emit(value: T): void;
  subscribe(listener: (value: T) => void): () => void;
  get(): T;
}

export function createEmitter<T>(initial: T): Emitter<T> {
  let value = initial;
  const listeners = new Set<(value: T) => void>();
  return {
    emit(next) {
      value = next;
      for (const listener of listeners) listener(next);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    get() {
      return value;
    },
  };
}

// ---------------------------------------------------------------- banner

export interface BannerState {
  latest: string;
  total: number;
  key: number;
}

export const BANNER_DURATION_MS = 2500;

export function bannerReducer(state: BannerState | null, discoveredNames: string[]): BannerState | null {
  if (discoveredNames.length === 0) return state;
  return {
    latest: discoveredNames[discoveredNames.length - 1],
    total: (state?.total ?? 0) + discoveredNames.length,
    key: (state?.key ?? 0) + 1,
  };
}

// ---------------------------------------------------------------- tooltip

export interface TooltipModel {
  kind: 'location' | 'region' | 'event';
  title: string;
  typeLabel: string;
  masked: boolean;
  danger?: DangerLevel;
  factionName?: string;
  firstSeen?: number;
  eventCount: number;
  isWaypoint: boolean;
  portraitUrl?: string;
  hint: string;
}

export function buildTooltipModel(
  snapshot: ProjectedWorldMapSnapshot,
  target: PickTarget,
  universeSlug?: string
): TooltipModel | null {
  if (target.kind === 'location') {
    const loc = snapshot.locations.find((l) => l.id === target.id);
    if (!loc || loc.fogStatus === FogStatus.UNKNOWN) return null;
    const masked = loc.fogStatus === FogStatus.KNOWN;
    if (masked) {
      return {
        kind: 'location',
        title: '??? UNCHARTED',
        typeLabel: 'UNKNOWN LANDMARK',
        masked: true,
        eventCount: 0,
        isWaypoint: false,
        hint: 'DISCOVER TO REVEAL',
      };
    }
    const territory = loc.controllingFactionId
      ? snapshot.territories.find((t) => t.factionId === loc.controllingFactionId)
      : undefined;
    const portraitUrl =
      loc.icon ??
      (universeSlug ? `/assets/pixels/${universeSlug}/locations/${loc.id.replace(/^loc-/, '')}.svg` : undefined);
    return {
      kind: 'location',
      title: loc.name,
      typeLabel: loc.type.toUpperCase(),
      masked: false,
      danger: loc.dangerLevel,
      factionName: territory?.name,
      firstSeen: loc.firstAppearanceChapter,
      eventCount: snapshot.events.filter((e) => e.locationId === loc.id).length,
      isWaypoint: Boolean(loc.waypoint),
      portraitUrl,
      hint: 'CLICK — OPEN DOSSIER',
    };
  }

  if (target.kind === 'region') {
    const region = snapshot.regions.find((r) => r.id === target.id);
    if (!region) return null;
    return {
      kind: 'region',
      title: region.name.toUpperCase(),
      typeLabel: 'REGION',
      masked: false,
      eventCount: 0,
      isWaypoint: false,
      hint: 'CLICK — REGION CODEX',
    };
  }

  const ev = snapshot.events.find((e) => e.id === target.id);
  if (!ev) return null;
  return {
    kind: 'event',
    title: ev.name,
    typeLabel: ev.eventType.toUpperCase(),
    masked: false,
    firstSeen: ev.chapter,
    eventCount: 1,
    isWaypoint: false,
    hint: 'CLICK — VIEW EVENT',
  };
}

export function placeTooltip(
  x: number,
  y: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
  offset = 16
): { left: number; top: number } {
  let left = x + offset;
  let top = y + offset;
  if (left + width > viewportWidth) left = x - offset - width;
  if (top + height > viewportHeight) top = y - offset - height;
  return { left: Math.max(0, left), top: Math.max(0, top) };
}

// ---------------------------------------------------------------- waypoints

export function visibleRegionNames(def: WorldMapDefinition, userChapter: number): Record<string, string> {
  const names: Record<string, string> = {};
  for (const region of def.regions) {
    const visible =
      region.visibleFromChapter === undefined ||
      region.visibleFromChapter <= userChapter ||
      (region.revealedAtChapter !== undefined && region.revealedAtChapter <= userChapter);
    if (visible) names[region.id] = region.name;
  }
  return names;
}

export interface WaypointGroup {
  planeId: string;
  planeName: string;
  regions: Array<{ regionId: string | null; regionName: string; waypoints: ProjectedWaypoint[] }>;
}

export function groupWaypoints(
  waypoints: ProjectedWaypoint[],
  planes: ProjectedPlane[],
  regionNames: Record<string, string>
): WaypointGroup[] {
  const groups: WaypointGroup[] = [];
  for (const plane of planes) {
    const onPlane = waypoints.filter((w) => w.planeId === plane.id);
    if (onPlane.length === 0) continue;
    const byRegion = new Map<string | null, ProjectedWaypoint[]>();
    for (const wp of onPlane) {
      const key = wp.regionId && regionNames[wp.regionId] ? wp.regionId : null;
      byRegion.set(key, [...(byRegion.get(key) ?? []), wp]);
    }
    const regions = Array.from(byRegion.entries())
      .map(([regionId, list]) => ({
        regionId,
        regionName: regionId ? regionNames[regionId] : 'UNCHARTED LANDS',
        waypoints: list.slice().sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.regionName.localeCompare(b.regionName));
    groups.push({ planeId: plane.id, planeName: plane.name, regions });
  }
  return groups;
}

// ---------------------------------------------------------------- minimap

export function fogCirclesForMinimap(snapshot: ProjectedWorldMapSnapshot): Array<{ x: number; y: number; r: number }> {
  return snapshot.locations
    .filter((l) => isDiscoveredStatus(l.fogStatus))
    .map((l) => ({ x: l.x, y: l.y, r: l.importance === 'critical' ? 70 : 45 }));
}
