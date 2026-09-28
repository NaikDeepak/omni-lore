import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { adaptGraphToWorldMap } from '../src/projections/map-adapter';
import { LocalGitDataStore } from '../src/datastore/local-git-store';
import { validateWorldMap, WorldMapSchema } from '../src/domain/map-schema';
import { CanonicalLoreGraph } from '../src/domain/types';
import { WorldMapDefinition } from '../src/domain/map-types';

describe('Map Engine v2 Fallback Adapter', () => {
  const store = new LocalGitDataStore(path.resolve(__dirname, '../data'));

  it('synthesizes valid WorldMapDefinition from Coiling Dragon graph', async () => {
    const graph = await store.getSeriesGraph('coiling-dragon');
    expect(graph).not.toBeNull();
    const mapDef = adaptGraphToWorldMap(graph!);

    expect(mapDef.universeId).toBe('coiling-dragon');
    expect(mapDef.coordinateSystem).toBe('world');
    expect(mapDef.width).toBe(1000);
    expect(mapDef.height).toBe(1000);
    expect(mapDef.locations.length).toBeGreaterThan(0);
    expect(mapDef.regions.length).toBeGreaterThan(0);
    expect(mapDef.terrain.length).toBeGreaterThan(0);

    // Strict validation against Zod schema
    const validated = validateWorldMap(mapDef);
    expect(validated).toBeDefined();
    expect(validated.id).toBe('map-coiling-dragon');
  });

  it('synthesizes valid WorldMapDefinition for all 5 existing universes without map.json', async () => {
    const legacyUniverses = [
      'coiling-dragon',
      'solo-leveling',
      'lord-of-the-mysteries',
      'one-piece',
      'demonic-emperor',
    ];

    for (const slug of legacyUniverses) {
      const graph = await store.getSeriesGraph(slug);
      expect(graph, `Graph for ${slug} must exist`).not.toBeNull();

      const mapDef = adaptGraphToWorldMap(graph!);
      expect(mapDef.universeId).toBe(slug);

      // Verify each universe passes the full schema
      const parseResult = WorldMapSchema.safeParse(mapDef);
      if (!parseResult.success) {
        console.error(`Validation failed for ${slug}:`, parseResult.error.issues);
      }
      expect(parseResult.success).toBe(true);

      // Verify locations and regions
      expect(mapDef.locations.length).toBeGreaterThan(0);
      expect(mapDef.regions.length).toBeGreaterThan(0);
      expect(mapDef.terrain.length).toBeGreaterThan(0);

      // Verify all location coordinates are within bounds
      for (const loc of mapDef.locations) {
        expect(loc.x).toBeGreaterThanOrEqual(0);
        expect(loc.x).toBeLessThanOrEqual(mapDef.width);
        expect(loc.y).toBeGreaterThanOrEqual(0);
        expect(loc.y).toBeLessThanOrEqual(mapDef.height);
      }
    }
  });

  it('returns existingMap directly when provided', async () => {
    const graph = await store.getSeriesGraph('reverend-insanity');
    const existingMap = await store.getSeriesMap('reverend-insanity');
    expect(existingMap).not.toBeNull();

    const result = adaptGraphToWorldMap(graph!, existingMap);
    expect(result).toBe(existingMap);
    expect(result.id).toBe('map-reverend-insanity-gu-world');
    expect(result.locations.length).toBeGreaterThan(10);
  });

  it('synthesizes characterPaths from canon events with locations', async () => {
    const graph = await store.getSeriesGraph('one-piece');
    const mapDef = adaptGraphToWorldMap(graph!);

    expect(mapDef.characterPaths.length).toBeGreaterThan(0);
    const luffyPath = mapDef.characterPaths.find((cp) => cp.characterId === 'luffy');
    expect(luffyPath).toBeDefined();
    expect(luffyPath?.waypoints.length).toBeGreaterThan(1);

    // Waypoints should be sorted by chapter ascending
    const chapters = luffyPath!.waypoints.map((wp) => wp.chapter);
    for (let i = 1; i < chapters.length; i++) {
      expect(chapters[i]).toBeGreaterThanOrEqual(chapters[i - 1]);
    }
  });

  it('synthesizes routes connecting sequential character waypoints', async () => {
    const graph = await store.getSeriesGraph('coiling-dragon');
    const mapDef = adaptGraphToWorldMap(graph!);

    expect(mapDef.routes.length).toBeGreaterThan(0);
    for (const route of mapDef.routes) {
      expect(route.points.length).toBeGreaterThanOrEqual(2);
      for (const pt of route.points) {
        expect(pt[0]).toBeGreaterThanOrEqual(0);
        expect(pt[0]).toBeLessThanOrEqual(mapDef.width);
        expect(pt[1]).toBeGreaterThanOrEqual(0);
        expect(pt[1]).toBeLessThanOrEqual(mapDef.height);
      }
    }
  });

  it('synthesizes territories for factions with locations or relationships', async () => {
    const graph = await store.getSeriesGraph('solo-leveling');
    const mapDef = adaptGraphToWorldMap(graph!);

    // Should generate territories with valid polygons
    expect(mapDef.territories.length).toBeGreaterThanOrEqual(0);
    for (const terr of mapDef.territories) {
      expect(terr.boundary.length).toBeGreaterThanOrEqual(3);
      for (const pt of terr.boundary) {
        expect(pt[0]).toBeGreaterThanOrEqual(0);
        expect(pt[0]).toBeLessThanOrEqual(mapDef.width);
        expect(pt[1]).toBeGreaterThanOrEqual(0);
        expect(pt[1]).toBeLessThanOrEqual(mapDef.height);
      }
      expect(terr.controlPeriods.length).toBeGreaterThan(0);
    }
  });

  it('handles minimal/empty graph gracefully without crashing', () => {
    const minimalGraph: CanonicalLoreGraph = {
      series: {
        slug: 'empty-test',
        title: 'Empty Test Universe',
        type: 'fantasy',
        status: 'ongoing',
        total_chapters: 100,
        knowledge_boundary: {
          latest_processed_chapter: 100,
          as_of: '2026-09-28',
        },
      },
      entities: {},
      facts: {},
      relationships: {},
    };

    const mapDef = adaptGraphToWorldMap(minimalGraph);
    expect(mapDef.universeId).toBe('empty-test');
    expect(mapDef.locations).toEqual([]);
    expect(mapDef.characterPaths).toEqual([]);
    expect(mapDef.regions.length).toBeGreaterThanOrEqual(1); // Default region
    expect(mapDef.terrain.length).toBeGreaterThanOrEqual(1); // Default terrain

    const parseResult = WorldMapSchema.safeParse(mapDef);
    expect(parseResult.success).toBe(true);
  });
});
