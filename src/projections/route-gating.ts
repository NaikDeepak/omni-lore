/**
 * Route spoiler gating: a route must not become visible before every
 * location it passes through has debuted, or its line would point at a
 * landmark the reader has not reached yet.
 *
 * "Passes through" = a route point lies within ROUTE_STOP_RADIUS world
 * units of a location on the same plane. Routes in this repo are authored
 * (and synthesized) with their stops exactly on location coordinates, so a
 * 1-unit radius matches every stop while never catching free control points.
 *
 * Pure: no Pixi/DOM imports, never mutates inputs.
 */

import { MapLocation, MapPlane, MapRoute } from '../domain/map-types';
import { planeIdOf } from '../domain/map-planes';

export const ROUTE_STOP_RADIUS = 1;

export function locationsOnRoute(
  route: Pick<MapRoute, 'points' | 'planeId'>,
  locations: readonly MapLocation[],
  planes: readonly MapPlane[],
  radius: number = ROUTE_STOP_RADIUS
): MapLocation[] {
  const routePlane = planeIdOf(route, planes as MapPlane[]);
  return locations.filter(
    (loc) =>
      planeIdOf(loc, planes as MapPlane[]) === routePlane &&
      route.points.some(([x, y]) => Math.hypot(loc.x - x, loc.y - y) <= radius)
  );
}

/** The earliest chapter a route may show: its base chapter or the latest debut it passes through. */
export function routeGateChapter(
  route: Pick<MapRoute, 'points' | 'planeId'>,
  locations: readonly MapLocation[],
  planes: readonly MapPlane[],
  baseChapter: number
): number {
  return locationsOnRoute(route, locations, planes).reduce(
    (gate, loc) => Math.max(gate, loc.firstAppearanceChapter),
    baseChapter
  );
}
