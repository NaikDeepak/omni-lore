/**
 * Level-select stage numbers: the order in which the active character first
 * visited each discovered location on the active plane. Uses only the
 * zero-spoiler snapshot (paths are already chapter- and plane-filtered).
 */

import { isDiscoveredStatus } from './map-snapshot-diff';
import { ProjectedWorldMapSnapshot } from './temporal-map';

export function journeyNumbers(snapshot: ProjectedWorldMapSnapshot): Map<string, number> {
  const numbers = new Map<string, number>();
  const path = snapshot.characterPaths.find((p) => p.characterId === snapshot.activeCharacterId);
  const locations = new Map(snapshot.locations.map((l) => [l.id, l]));
  for (const wp of path?.waypoints ?? []) {
    if (!wp.locationId || numbers.has(wp.locationId)) continue;
    const loc = locations.get(wp.locationId);
    if (!loc || !isDiscoveredStatus(loc.fogStatus)) continue;
    numbers.set(wp.locationId, numbers.size + 1);
  }
  return numbers;
}
