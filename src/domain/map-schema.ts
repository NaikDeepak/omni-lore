import { z } from 'zod';
import type {
  WorldMapDefinition,
  TerrainLayer,
  MapRegion,
  MapLocation,
  MapRoute,
  FactionTerritory,
  FactionControlPeriod,
  MapEvent,
  CharacterWaypoint,
  CharacterPath,
} from './map-types';
import { getMapPlanes } from './map-planes';

export const CoordinateSystemSchema = z.enum(['normalized', 'world']);

export const TerrainTypeSchema = z.enum([
  'ocean',
  'river',
  'mountain',
  'forest',
  'desert',
  'plains',
  'swamp',
  'ice',
  'volcanic',
  'void',
  'custom',
]);

export const LocationTypeSchema = z.enum([
  'city',
  'village',
  'sect',
  'clan',
  'castle',
  'ruin',
  'dungeon',
  'mountain',
  'cave',
  'battlefield',
  'temple',
  'ocean',
  'island',
  'portal',
  'landmark',
  'lake',
]);

export const Point2DSchema = z.tuple([z.number(), z.number()]);

export const PlaneBackdropSchema = z.enum(['void', 'sky', 'sea', 'abyss', 'river']);

export const MapPlaneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  revealedAtChapter: z.number().int().min(0),
  backdrop: PlaneBackdropSchema,
  order: z.number().int().optional(),
});

export const LandmarkGlyphKindSchema = z.enum([
  'volcano',
  'spire',
  'ruin',
  'great-tree',
  'citadel',
  'crater',
  'monolith',
  'shipwreck',
  'portal-arch',
  'skull-rock',
]);

export const LandmarkGlyphSchema = z.object({
  id: z.string().min(1),
  glyph: LandmarkGlyphKindSchema,
  x: z.number(),
  y: z.number(),
  planeId: z.string().min(1).optional(),
  scale: z.number().positive().optional(),
  revealedAtChapter: z.number().int().min(0),
  name: z.string().optional(),
});

export const DangerLevelSchema = z.enum(['EX', 'S', 'A', 'B', 'Safe']);
export const TerrainEdgeStyleSchema = z.enum(['coast', 'cliff', 'soft']);

export const MapRiverSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.array(Point2DSchema).min(2),
  width: z.number().positive(),
  planeId: z.string().min(1).optional(),
  bridges: z.array(Point2DSchema).optional(),
});

export const TerrainLayerSchema = z.object({
  id: z.string().min(1),
  type: TerrainTypeSchema,
  name: z.string().min(1),
  polygon: z.array(Point2DSchema).min(3),
  elevation: z.number().optional(),
  colorOverride: z.string().optional(),
  planeId: z.string().min(1).optional(),
  edgeStyle: TerrainEdgeStyleSchema.optional(),
});

export const MapRegionGeometrySchema = z.object({
  type: z.enum(['Polygon', 'MultiPolygon']),
  coordinates: z.union([
    z.array(z.array(Point2DSchema)), // Polygon: rings of points
    z.array(z.array(z.array(Point2DSchema))), // MultiPolygon: polygons of rings of points
  ]),
});

export const MapRegionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  geometry: MapRegionGeometrySchema,
  parentRegionId: z.string().optional(),
  terrainType: TerrainTypeSchema.optional(),
  visibleFromChapter: z.number().int().min(0).optional(),
  revealedAtChapter: z.number().int().min(0).optional(),
  factionIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
  planeId: z.string().min(1).optional(),
});

export const MapLocationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  x: z.number(),
  y: z.number(),
  type: LocationTypeSchema,
  regionId: z.string().optional(),
  importance: z.enum(['minor', 'major', 'critical']),
  firstAppearanceChapter: z.number().int().min(0),
  revealedAtChapter: z.number().int().min(0),
  icon: z.string().optional(),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  controllingFactionId: z.string().optional(),
  planeId: z.string().min(1).optional(),
  waypoint: z.boolean().optional(),
  dangerLevel: DangerLevelSchema.optional(),
});

export const MapRouteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.array(Point2DSchema).min(2),
  routeType: z.enum(['road', 'sea', 'flight', 'portal', 'secret']),
  visibleFromChapter: z.number().int().min(0),
  revealedAtChapter: z.number().int().min(0).optional(),
  planeId: z.string().min(1).optional(),
});

export const FactionControlPeriodSchema = z.object({
  fromChapter: z.number().int().min(0),
  toChapter: z.number().int().min(0).nullable(),
  influencePct: z.number().min(0).max(100),
});

export const FactionTerritorySchema = z.object({
  factionId: z.string().min(1),
  name: z.string().min(1),
  boundary: z.array(Point2DSchema).min(3),
  controlPeriods: z.array(FactionControlPeriodSchema),
  planeId: z.string().min(1).optional(),
});

export const MapEventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  chapter: z.number().int().min(0),
  locationId: z.string().optional(),
  eventType: z.enum([
    'battle',
    'death',
    'breakthrough',
    'discovery',
    'war',
    'reveal',
    'migration',
    'ascension',
  ]),
  importance: z.enum(['minor', 'major', 'critical']),
  involvedCharacterIds: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const CharacterWaypointSchema = z.object({
  chapter: z.number().int().min(0),
  locationId: z.string().optional(),
  x: z.number(),
  y: z.number(),
  note: z.string().optional(),
  planeId: z.string().min(1).optional(),
});

export const CharacterPathSchema = z.object({
  characterId: z.string().min(1),
  characterName: z.string().min(1),
  waypoints: z.array(CharacterWaypointSchema),
});

export const WorldMapSchema = z
  .object({
    id: z.string().min(1),
    universeId: z.string().min(1),
    coordinateSystem: CoordinateSystemSchema,
    width: z.number().positive(),
    height: z.number().positive(),
    terrain: z.array(TerrainLayerSchema).default([]),
    regions: z.array(MapRegionSchema).default([]),
    locations: z.array(MapLocationSchema).default([]),
    routes: z.array(MapRouteSchema).default([]),
    territories: z.array(FactionTerritorySchema).default([]),
    events: z.array(MapEventSchema).default([]),
    characterPaths: z.array(CharacterPathSchema).default([]),
    planes: z.array(MapPlaneSchema).optional(),
    landmarkGlyphs: z.array(LandmarkGlyphSchema).optional(),
    rivers: z.array(MapRiverSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const isNormalized = data.coordinateSystem === 'normalized';
    const planes = getMapPlanes(data as WorldMapDefinition);
    const planeById = new Map(planes.map((p) => [p.id, p]));
    const locationPlane = new Map(
      data.locations.map((loc) => [loc.id, loc.planeId ?? planes[0].id])
    );

    if (data.planes) {
      const seen = new Set<string>();
      data.planes.forEach((plane, idx) => {
        if (seen.has(plane.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate plane id "${plane.id}"`,
            path: ['planes', idx, 'id'],
          });
        }
        seen.add(plane.id);
      });
    }

    type Bounds = { maxX: number; maxY: number };

    const boundsFor = (
      planeId: string | undefined,
      label: string,
      path: (string | number)[]
    ): Bounds | null => {
      if (planeId !== undefined && !planeById.has(planeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} references unknown plane "${planeId}"`,
          path,
        });
        return null;
      }
      if (isNormalized) return { maxX: 1.0, maxY: 1.0 };
      const plane = planeById.get(planeId ?? planes[0].id) ?? planes[0];
      return { maxX: plane.width, maxY: plane.height };
    };

    const checkPoint = (
      x: number,
      y: number,
      bounds: Bounds | null,
      label: string,
      path: (string | number)[]
    ) => {
      if (!bounds) return;
      if (x < 0 || x > bounds.maxX || y < 0 || y > bounds.maxY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} [${x}, ${y}] is out of bounds for ${data.coordinateSystem} coordinate system (expected 0..${bounds.maxX}, 0..${bounds.maxY})`,
          path,
        });
      }
    };

    data.terrain.forEach((terrain, idx) => {
      boundsFor(terrain.planeId, `Terrain "${terrain.name}"`, ['terrain', idx, 'planeId']);
    });

    data.regions.forEach((region, idx) => {
      boundsFor(region.planeId, `Region "${region.name}"`, ['regions', idx, 'planeId']);
    });

    data.locations.forEach((loc, idx) => {
      const bounds = boundsFor(loc.planeId, `Location "${loc.name}" (${loc.id})`, ['locations', idx, 'planeId']);
      checkPoint(loc.x, loc.y, bounds, `Location "${loc.name}" (${loc.id}) coordinate`, ['locations', idx]);
    });

    data.characterPaths.forEach((cp, cpIdx) => {
      cp.waypoints.forEach((wp, wpIdx) => {
        const planeId =
          wp.planeId ?? (wp.locationId ? locationPlane.get(wp.locationId) : undefined);
        const path = ['characterPaths', cpIdx, 'waypoints', wpIdx];
        const bounds = boundsFor(planeId, `Waypoint in character path "${cp.characterName}"`, path);
        checkPoint(wp.x, wp.y, bounds, `Waypoint in character path "${cp.characterName}" at chapter ${wp.chapter}`, path);
      });
    });

    data.routes.forEach((route, rIdx) => {
      const bounds = boundsFor(route.planeId, `Route "${route.name}"`, ['routes', rIdx, 'planeId']);
      route.points.forEach((pt, pIdx) => {
        checkPoint(pt[0], pt[1], bounds, `Route point in "${route.name}"`, ['routes', rIdx, 'points', pIdx]);
      });
    });

    data.territories.forEach((terr, tIdx) => {
      const bounds = boundsFor(terr.planeId, `Territory "${terr.name}"`, ['territories', tIdx, 'planeId']);
      terr.boundary.forEach((pt, pIdx) => {
        checkPoint(pt[0], pt[1], bounds, `Boundary point in territory "${terr.name}"`, ['territories', tIdx, 'boundary', pIdx]);
      });
    });

    (data.rivers ?? []).forEach((river, rIdx) => {
      const bounds = boundsFor(river.planeId, `River "${river.name}"`, ['rivers', rIdx, 'planeId']);
      river.points.forEach((pt, pIdx) => {
        checkPoint(pt[0], pt[1], bounds, `River point in "${river.name}"`, ['rivers', rIdx, 'points', pIdx]);
      });
      (river.bridges ?? []).forEach((pt, bIdx) => {
        checkPoint(pt[0], pt[1], bounds, `Bridge on "${river.name}"`, ['rivers', rIdx, 'bridges', bIdx]);
      });
    });

    (data.landmarkGlyphs ?? []).forEach((glyph, gIdx) => {
      const path = ['landmarkGlyphs', gIdx];
      const bounds = boundsFor(glyph.planeId, `Landmark glyph "${glyph.id}"`, path);
      checkPoint(glyph.x, glyph.y, bounds, `Landmark glyph "${glyph.id}"`, path);
    });
  });

/**
 * Validates unknown input against WorldMapSchema, returning a typed WorldMapDefinition
 * or throwing a ZodError if invalid.
 */
export function validateWorldMap(input: unknown): WorldMapDefinition {
  return WorldMapSchema.parse(input) as WorldMapDefinition;
}

/**
 * Safely validates unknown input against WorldMapSchema without throwing.
 */
export function safeValidateWorldMap(input: unknown):
  | { success: true; data: WorldMapDefinition }
  | { success: false; error: z.ZodError } {
  const result = WorldMapSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data as WorldMapDefinition };
  }
  return { success: false, error: result.error };
}
