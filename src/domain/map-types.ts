/**
 * OmniLore Map Engine v2 - Generic Domain Models
 *
 * Provides universe-agnostic interfaces for interactive RPG World Atlas:
 * terrain layers, geographic regions, locations, travel routes,
 * faction spheres of influence, lore events, character paths, themes, and UI state.
 */

export type CoordinateSystem = 'normalized' | 'world';

export type TerrainType =
  | 'ocean'
  | 'river'
  | 'mountain'
  | 'forest'
  | 'desert'
  | 'plains'
  | 'swamp'
  | 'ice'
  | 'volcanic'
  | 'void'
  | 'custom';

export type LocationType =
  | 'city'
  | 'village'
  | 'sect'
  | 'clan'
  | 'castle'
  | 'ruin'
  | 'dungeon'
  | 'mountain'
  | 'cave'
  | 'battlefield'
  | 'temple'
  | 'ocean'
  | 'island'
  | 'portal'
  | 'landmark'
  | 'lake';

export type PlaneBackdrop = 'void' | 'sky' | 'sea' | 'abyss' | 'river';

export interface MapPlane {
  id: string;
  name: string;
  width: number;
  height: number;
  revealedAtChapter: number;
  backdrop: PlaneBackdrop;
  order?: number;
}

export type LandmarkGlyphKind =
  | 'volcano'
  | 'spire'
  | 'ruin'
  | 'great-tree'
  | 'citadel'
  | 'crater'
  | 'monolith'
  | 'shipwreck'
  | 'portal-arch'
  | 'skull-rock';

export interface LandmarkGlyph {
  id: string;
  glyph: LandmarkGlyphKind;
  x: number;
  y: number;
  planeId?: string;
  scale?: number;
  revealedAtChapter: number;
  name?: string;
}

export type DangerLevel = 'EX' | 'S' | 'A' | 'B' | 'Safe';

export type TerrainEdgeStyle = 'coast' | 'cliff' | 'soft';

export interface MapRiver {
  id: string;
  name: string;
  points: [number, number][];
  width: number;
  planeId?: string;
  bridges?: [number, number][];
}

export interface TerrainLayer {
  id: string;
  type: TerrainType;
  name: string;
  polygon: [number, number][];
  elevation?: number;
  colorOverride?: string;
  planeId?: string;
  edgeStyle?: TerrainEdgeStyle;
}

export interface MapRegion {
  id: string;
  name: string;
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  parentRegionId?: string;
  terrainType?: TerrainType;
  visibleFromChapter?: number;
  revealedAtChapter?: number;
  factionIds?: string[];
  notes?: string;
  planeId?: string;
}

export interface MapLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  type: LocationType;
  regionId?: string;
  importance: 'minor' | 'major' | 'critical';
  firstAppearanceChapter: number;
  revealedAtChapter: number;
  icon?: string;
  description?: string;
  aliases?: string[];
  controllingFactionId?: string;
  planeId?: string;
  waypoint?: boolean;
  dangerLevel?: DangerLevel;
}

export interface MapRoute {
  id: string;
  name: string;
  points: [number, number][];
  routeType: 'road' | 'sea' | 'flight' | 'portal' | 'secret';
  visibleFromChapter: number;
  revealedAtChapter?: number;
  planeId?: string;
}

export interface FactionControlPeriod {
  fromChapter: number;
  toChapter: number | null;
  influencePct: number;
}

export interface FactionTerritory {
  factionId: string;
  name: string;
  boundary: [number, number][];
  controlPeriods: FactionControlPeriod[];
  planeId?: string;
}

export type MapEventType =
  | 'battle'
  | 'death'
  | 'breakthrough'
  | 'discovery'
  | 'war'
  | 'reveal'
  | 'migration'
  | 'ascension';

export interface MapEvent {
  id: string;
  name: string;
  chapter: number;
  locationId?: string;
  eventType: MapEventType;
  importance: 'minor' | 'major' | 'critical';
  involvedCharacterIds?: string[];
  description?: string;
}

export interface CharacterWaypoint {
  chapter: number;
  locationId?: string;
  x: number;
  y: number;
  note?: string;
  planeId?: string;
}

export interface CharacterPath {
  characterId: string;
  characterName: string;
  waypoints: CharacterWaypoint[];
}

export interface WorldMapDefinition {
  id: string;
  universeId: string;
  coordinateSystem: CoordinateSystem;
  width: number;
  height: number;
  terrain: TerrainLayer[];
  regions: MapRegion[];
  locations: MapLocation[];
  routes: MapRoute[];
  territories: FactionTerritory[];
  events: MapEvent[];
  characterPaths: CharacterPath[];
  planes?: MapPlane[];
  landmarkGlyphs?: LandmarkGlyph[];
  rivers?: MapRiver[];
}

/**
 * Multi-state Fog of War visibility status for projected landmarks.
 */
export type FogStatus = 'UNKNOWN' | 'KNOWN' | 'DISCOVERED' | 'REVEALED' | 'CURRENT';

/**
 * Universe Map Theme styling tokens
 */
export interface MapThemePalette {
  background: string;
  primaryAccent: string;
  secondaryAccent?: string;
  territoryAlpha?: number;
  routeColor?: string;
  textColor?: string;
  gridColor?: string;
  [key: string]: unknown;
}

export interface MapThemeMarkerStyle {
  shape?: 'diamond' | 'circle' | 'pin' | 'square';
  glowColor?: string;
  defaultSize?: number;
  criticalSize?: number;
  [key: string]: unknown;
}

export interface MapThemeFogStyle {
  style: 'ink_mist' | 'celestial_shimmer' | 'dungeon_shadow' | 'cosmic_haze' | 'sea_fog' | 'demonic_miasma' | string;
  color?: string;
  opacity?: number;
  blur?: number;
  [key: string]: unknown;
}

export interface MapAtmosphereParticles {
  type: string;
  count: number;
  color: string;
}

export interface MapTheme {
  slug: string;
  name?: string;
  palette: MapThemePalette;
  markerStyle: MapThemeMarkerStyle;
  fogStyle: MapThemeFogStyle;
  atmosphereParticles?: MapAtmosphereParticles;
  [key: string]: unknown;
}

/**
 * Interactive React HUD state
 */
export type MapMode = 'atlas' | 'adventure' | 'lore';

export interface MapVisibleLayers {
  terrain: boolean;
  regions: boolean;
  routes: boolean;
  territories: boolean;
  markers: boolean;
  events: boolean;
  characterPaths: boolean;
  fogOfWar: boolean;
  labels: boolean;
  [layerName: string]: boolean;
}

export interface MapState {
  currentChapter: number;
  selectedLocationId?: string | null;
  selectedRegionId?: string | null;
  selectedEventId?: string | null;
  selectedCharacterId?: string | null;
  mode: MapMode;
  visibleLayers: MapVisibleLayers;
}
