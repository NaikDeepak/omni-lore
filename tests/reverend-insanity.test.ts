import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { LocalGitDataStore } from '../src/datastore/local-git-store';
import { projectPowerLadder, projectTimeline } from '../src/projections';
import { getCanonPresets, simulateDuel } from '../src/engine/duel-simulator';
import { validateWorldMap } from '../src/domain/map-schema';
import { UNIVERSE_THEMES } from '../src/domain/themes';
import { TemporalEngine } from '../src/engine/temporal-engine';

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
});
