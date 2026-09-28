import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { LocalGitDataStore } from '../src/datastore/local-git-store';
import { projectPowerLadder, projectTimeline } from '../src/projections';
import { getCanonPresets } from '../src/engine/duel-simulator';
import { validateWorldMap } from '../src/domain/map-schema';
import { UNIVERSE_THEMES } from '../src/domain/themes';

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

  it('simulates a canonical duel between Fang Yuan and Duke Long', async () => {
    const graph = await store.getSeriesGraph('reverend-insanity');
    const { simulateDuel } = await import('../src/engine/duel-simulator');
    const duel = simulateDuel('fang-yuan', 'duke-long', 1750, graph!);
    expect(duel).toBeDefined();
    expect(duel.fighterA.name).toBe('Fang Yuan');
    expect(duel.fighterB.name).toBe('Duke Long');
    expect(duel.rounds.length).toBeGreaterThan(0);
  });
});
