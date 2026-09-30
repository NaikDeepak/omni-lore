/**
 * Plane resolution helpers for multi-plane world maps.
 *
 * A WorldMapDefinition without `planes` has one implicit plane ('main')
 * sized to the map. Entities without `planeId` belong to the first plane.
 */

import { MapPlane, WorldMapDefinition } from './map-types';

export const DEFAULT_PLANE_ID = 'main';

export function getMapPlanes(
  def: Pick<WorldMapDefinition, 'planes' | 'width' | 'height'>
): MapPlane[] {
  if (def.planes && def.planes.length > 0) {
    return def.planes
      .map((plane, index) => ({ ...plane, order: plane.order ?? index }))
      .sort((a, b) => (a.order as number) - (b.order as number));
  }
  return [
    {
      id: DEFAULT_PLANE_ID,
      name: 'World',
      width: def.width,
      height: def.height,
      revealedAtChapter: 0,
      backdrop: 'void',
      order: 0,
    },
  ];
}

export function planeIdOf(entity: { planeId?: string }, planes: MapPlane[]): string {
  return entity.planeId ?? planes[0].id;
}

export function planeForLocation(def: WorldMapDefinition, locationId: string): string | null {
  const location = def.locations.find((l) => l.id === locationId);
  if (!location) return null;
  return planeIdOf(location, getMapPlanes(def));
}
