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

export const TerrainLayerSchema = z.object({
  id: z.string().min(1),
  type: TerrainTypeSchema,
  name: z.string().min(1),
  polygon: z.array(Point2DSchema).min(3),
  elevation: z.number().optional(),
  colorOverride: z.string().optional(),
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
});

export const MapRouteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  points: z.array(Point2DSchema).min(2),
  routeType: z.enum(['road', 'sea', 'flight', 'portal', 'secret']),
  visibleFromChapter: z.number().int().min(0),
  revealedAtChapter: z.number().int().min(0).optional(),
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
  })
  .superRefine((data, ctx) => {
    const isNormalized = data.coordinateSystem === 'normalized';
    const maxX = isNormalized ? 1.0 : data.width;
    const maxY = isNormalized ? 1.0 : data.height;

    // Check location coordinates
    data.locations.forEach((loc, idx) => {
      if (loc.x < 0 || loc.x > maxX || loc.y < 0 || loc.y > maxY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Location "${loc.name}" (${loc.id}) coordinate [${loc.x}, ${loc.y}] is out of bounds for ${data.coordinateSystem} coordinate system (expected 0..${maxX}, 0..${maxY})`,
          path: ['locations', idx],
        });
      }
    });

    // Check character path waypoints
    data.characterPaths.forEach((cp, cpIdx) => {
      cp.waypoints.forEach((wp, wpIdx) => {
        if (wp.x < 0 || wp.x > maxX || wp.y < 0 || wp.y > maxY) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Waypoint in character path "${cp.characterName}" at chapter ${wp.chapter} [${wp.x}, ${wp.y}] is out of bounds for ${data.coordinateSystem} coordinate system (expected 0..${maxX}, 0..${maxY})`,
            path: ['characterPaths', cpIdx, 'waypoints', wpIdx],
          });
        }
      });
    });

    // Check route points
    data.routes.forEach((route, rIdx) => {
      route.points.forEach((pt, pIdx) => {
        if (pt[0] < 0 || pt[0] > maxX || pt[1] < 0 || pt[1] > maxY) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Route point in "${route.name}" [${pt[0]}, ${pt[1]}] is out of bounds for ${data.coordinateSystem} coordinate system (expected 0..${maxX}, 0..${maxY})`,
            path: ['routes', rIdx, 'points', pIdx],
          });
        }
      });
    });

    // Check territory boundary points
    data.territories.forEach((terr, tIdx) => {
      terr.boundary.forEach((pt, pIdx) => {
        if (pt[0] < 0 || pt[0] > maxX || pt[1] < 0 || pt[1] > maxY) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Boundary point in territory "${terr.name}" [${pt[0]}, ${pt[1]}] is out of bounds for ${data.coordinateSystem} coordinate system (expected 0..${maxX}, 0..${maxY})`,
            path: ['territories', tIdx, 'boundary', pIdx],
          });
        }
      });
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
