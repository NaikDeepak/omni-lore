import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { LocalGitDataStore } from '../src/datastore/local-git-store';
import { projectPowerLadder, projectTimeline } from '../src/projections';
import { getCanonPresets, simulateDuel } from '../src/engine/duel-simulator';
import { validateWorldMap } from '../src/domain/map-schema';
import { UNIVERSE_THEMES } from '../src/domain/themes';
import { TemporalEngine } from '../src/engine/temporal-engine';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { buildPlaneLayout } from '../src/engine/map/scene/plane-layout';
import { pointInPolygon } from '../src/engine/map/scene/geometry';

describe('Reverend Insanity Universe Integration', () => {
  const store = new LocalGitDataStore();

  it('loads graph.json and validates series metadata', async () => {
    const graph = await store.getSeriesGraph('reverend-insanity');
    expect(graph).not.toBeNull();
    expect(graph?.series.slug).toBe('reverend-insanity');
    expect(graph?.series.total_chapters).toBe(2334);
  });

  it('projects 9-tier power ladder at Ch. 2250', async () => {
    const graph = await store.getSeriesGraph('reverend-insanity');
    const ladder = projectPowerLadder(graph!, 2250);
    expect(ladder.tiers.length).toBe(9);
    const topTier = ladder.tiers[ladder.tiers.length - 1];
    expect(topTier.name).toContain('Rank 9');
  });

  it('loads 6 canon duel simulator presets for reverend-insanity', () => {
    const presets = getCanonPresets('reverend-insanity');
    expect(presets.length).toBe(6);
    expect(presets.some(p => p.id === 'ri-fangyuan-dukelong')).toBe(true);
  });

  it('validates reverend-insanity map.json definition', () => {
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8');
    const mapData = JSON.parse(raw);
    expect(mapData.universeId).toBe('reverend-insanity');
    expect(mapData.locations.length).toBeGreaterThanOrEqual(15);
    expect(mapData.regions.length).toBeGreaterThanOrEqual(5);

    // Validate with full WorldMapSchema
    const validated = validateWorldMap(mapData);
    expect(validated).toBeDefined();
    expect(validated.universeId).toBe('reverend-insanity');
  });

  it('aligns loc-river-of-time firstAppearanceChapter between map.json and graph.json', async () => {
    const graph = await store.getSeriesGraph('reverend-insanity');
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8');
    const mapData = JSON.parse(raw);

    const graphRot = graph?.entities['loc-river-of-time'];
    const mapRot = mapData.locations.find((l: any) => l.id === 'loc-river-of-time');

    expect(graphRot?.first_appearance).toBe(600);
    expect(mapRot?.firstAppearanceChapter).toBe(600);
  });

  it('verifies theme is defined in UNIVERSE_THEMES', () => {
    const theme = UNIVERSE_THEMES['reverend-insanity'];
    expect(theme).toBeDefined();
    expect(theme.id).toBe('reverend-insanity');
  });

  it('verifies series is present in series-registry.json', async () => {
    const seriesList = await store.listSeries();
    const ri = seriesList.find(s => s.slug === 'reverend-insanity');
    expect(ri).toBeDefined();
    expect(ri?.total_chapters).toBe(2334);
  });

  it('projects timeline with 6 canonical arcs', async () => {
    const graph = await store.getSeriesGraph('reverend-insanity');
    const timeline = projectTimeline(graph!, 2334);
    expect(timeline.arcs.length).toBe(6);
    expect(timeline.arcs[0].name).toContain('Qing Mao');
  });

  it('correctly resolves Fang Yuan temporal persona reveals across all key chapter boundaries', async () => {
    const graph = await store.getSeriesGraph('reverend-insanity');
    const fangYuan = graph!.entities['fang-yuan'];
    expect(fangYuan).toBeDefined();

    // Ch. 100 -> "Gu Yue Fang Yuan" (Early Qing Mao Mountain)
    expect(TemporalEngine.resolveDisplayName(fangYuan, 100)).toEqual({
      name: 'Gu Yue Fang Yuan',
      isMasked: true,
    });

    // Ch. 300 -> "Gu Yue Yi Shan" (Caravan & Shang Clan City)
    expect(TemporalEngine.resolveDisplayName(fangYuan, 300)).toEqual({
      name: 'Gu Yue Yi Shan',
      isMasked: true,
    });

    // Ch. 500 -> "Wolf King Chang Shan Yin" (Northern Plains Heroes Assembly)
    expect(TemporalEngine.resolveDisplayName(fangYuan, 500)).toEqual({
      name: 'Wolf King Chang Shan Yin',
      isMasked: true,
    });

    // Ch. 800 -> "Immortal Zombie Fang Yuan" (Immortal Zombie Era)
    expect(TemporalEngine.resolveDisplayName(fangYuan, 800)).toEqual({
      name: 'Immortal Zombie Fang Yuan',
      isMasked: true,
    });

    // Ch. 1100 -> "Chu Ying" (Eastern Sea Disguise)
    expect(TemporalEngine.resolveDisplayName(fangYuan, 1100)).toEqual({
      name: 'Chu Ying',
      isMasked: true,
    });

    // Ch. 1500 -> "Liu Guan Yi" (Reverse Flow River Lord & Northern Plains Disguise)
    expect(TemporalEngine.resolveDisplayName(fangYuan, 1500)).toEqual({
      name: 'Liu Guan Yi',
      isMasked: true,
    });

    // Ch. 2250 -> "Great Love Demon Venerable" (Venerable Era)
    expect(TemporalEngine.resolveDisplayName(fangYuan, 2250)).toEqual({
      name: 'Great Love Demon Venerable',
      isMasked: false,
    });
  });

  it('simulates a canonical duel between Fang Yuan and Duke Long', async () => {
    const graph = await store.getSeriesGraph('reverend-insanity');
    const duel = simulateDuel('fang-yuan', 'duke-long', 1750, graph!);
    expect(duel).toBeDefined();
    expect(duel.fighterA.name).toBe('Great Love Demon Venerable');
    expect(duel.fighterB.name).toBe('Duke Long');
    expect(duel.rounds.length).toBeGreaterThan(0);
  });

  it('defines three organic planes with every location placed on a declared plane', () => {
    const mapData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8'));
    expect(mapData.planes.map((p: { id: string }) => p.id)).toEqual([
      'plane-mortal-five-regions',
      'plane-two-heavens',
      'plane-river-of-time',
    ]);
    const planeIds = new Set(mapData.planes.map((p: { id: string }) => p.id));
    for (const loc of mapData.locations) {
      expect(planeIds.has(loc.planeId), loc.id).toBe(true);
      expect(['EX', 'S', 'A', 'B', 'Safe']).toContain(loc.dangerLevel);
    }
    expect(mapData.locations.find((l: { id: string }) => l.id === 'loc-stone-lotus-island').planeId).toBe('plane-river-of-time');
    expect(mapData.locations.find((l: { id: string }) => l.id === 'loc-river-of-time').planeId).toBe('plane-river-of-time');

    for (const id of ['terrain-southern-border', 'terrain-central-continent', 'terrain-northern-plains', 'terrain-western-desert', 'terrain-eastern-sea']) {
      const terrain = mapData.terrain.find((t: { id: string }) => t.id === id);
      expect(terrain.polygon.length, id).toBeGreaterThanOrEqual(60);
    }
    expect(mapData.terrain.filter((t: { type: string; planeId: string }) => t.type === 'mountain' && t.planeId === 'plane-mortal-five-regions').length).toBeGreaterThanOrEqual(8);
    expect(mapData.terrain.some((t: { id: string }) => t.id === 'terrain-crescent-lake')).toBe(true);
    expect(mapData.rivers.map((r: { id: string }) => r.id)).toEqual(['river-reverse-flow', 'river-southern-karst']);
    for (const river of mapData.rivers) expect(river.bridges.length).toBeGreaterThanOrEqual(1);
    expect(mapData.locations.filter((l: { waypoint?: boolean }) => l.waypoint).length).toBeGreaterThanOrEqual(8);
    expect(mapData.landmarkGlyphs.length).toBeGreaterThanOrEqual(6);
    expect(() => validateWorldMap(mapData)).not.toThrow();
  });

  it('keeps the protagonist journey chapters and snaps waypoints to their locations', () => {
    const mapData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8'));
    const path0 = mapData.characterPaths[0];
    expect(path0.waypoints.map((w: { chapter: number }) => w.chapter)).toEqual([1, 210, 260, 350, 410, 540, 650, 1020, 1285, 1960, 2210]);
    for (const wp of path0.waypoints) {
      const loc = mapData.locations.find((l: { id: string }) => l.id === wp.locationId);
      expect([wp.x, wp.y, wp.planeId]).toEqual([loc.x, loc.y, loc.planeId]);
    }
  });

  it('reveals landmark glyphs only from their canonical chapter', () => {
    const mapData = validateWorldMap(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8')));
    const ids = (ch: number) => projectTemporalMap(mapData, ch).landmarkGlyphs.map((g) => g.id);
    expect(ids(949)).not.toContain('lg-yi-tian-spire');
    expect(ids(950)).toContain('lg-yi-tian-spire');
    expect(ids(1)).toEqual([]);
  });

  it('lays out the real mortal plane within budget with sensible decoration', () => {
    const mapData = validateWorldMap(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8')));
    const snap = projectTemporalMap(mapData, 1);
    const t0 = performance.now();
    const layout = buildPlaneLayout(snap);
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(250);
    const trees = layout.stamps.filter((st) => st.sprite.startsWith('conifer') || st.sprite.startsWith('tree'));
    const peaks = layout.stamps.filter((st) => st.sprite.startsWith('peak'));
    expect(trees.length).toBeGreaterThan(300);
    expect(peaks.length).toBeGreaterThan(150);
    expect(layout.fills.find((f) => f.id === 'terrain-eastern-sea')!.kind).toBe('water');
    const lake = layout.fills.find((f) => f.id === 'terrain-crescent-lake')!;
    expect(lake.kind).toBe('lake');
    expect(layout.stamps.some((st) => pointInPolygon(st.x, st.y, lake.ring))).toBe(false);
    for (const fill of layout.fills) expect(fill.ring.length).toBeLessThanOrEqual(260);
  });

  it('keeps the River of Time plane sealed until chapter 600', () => {
    const mapData = validateWorldMap(JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/reverend-insanity/map.json'), 'utf-8')));
    const early = projectTemporalMap(mapData, 599, { planeId: 'plane-river-of-time' });
    expect(early.planeId).toBe('plane-mortal-five-regions');
    const late = projectTemporalMap(mapData, 600, { planeId: 'plane-river-of-time' });
    expect(late.planeId).toBe('plane-river-of-time');
    expect(late.locations.map((l) => l.id)).toContain('loc-river-of-time');
  });
});
