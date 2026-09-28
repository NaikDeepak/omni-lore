import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { LocalGitDataStore } from '../src/datastore/local-git-store';

describe('LocalGitDataStore', () => {
  const store = new LocalGitDataStore(path.resolve(__dirname, '../data'));

  it('loads series registry successfully', async () => {
    const list = await store.listSeries();
    expect(list.length).toBeGreaterThanOrEqual(5);
    expect(list.some(s => s.slug === 'coiling-dragon')).toBe(true);
    expect(list.some(s => s.slug === 'demonic-emperor')).toBe(true);
    expect(list.some(s => s.slug === 'solo-leveling')).toBe(true);
  });

  it('loads Coiling Dragon graph and validates contents', async () => {
    const graph = await store.getSeriesGraph('coiling-dragon');
    expect(graph).not.toBeNull();
    expect(graph?.series.slug).toBe('coiling-dragon');
    expect(graph?.entities['linley-baruch']).toBeDefined();
    expect(graph?.relationships['rel-bebe-ally']).toBeDefined();
  });

  it('returns null for nonexistent series', async () => {
    const nonexistent = await store.getSeriesGraph('nonexistent-series');
    expect(nonexistent).toBeNull();
  });

  it('validates One Piece character roster expansion (>= 50 characters) and pixel avatars', async () => {
    const graph = await store.getSeriesGraph('one-piece');
    expect(graph).not.toBeNull();
    const characters = Object.values(graph!.entities).filter(e => e.type === 'character');
    expect(characters.length).toBeGreaterThanOrEqual(50);
    for (const char of characters) {
      expect(char.avatar_url).toBeDefined();
      expect(char.avatar_url).toMatch(/^\/assets\/pixels\/one-piece\/avatars\/[a-z0-9-]+\.svg$/);
    }
  });

  it('validates Coiling Dragon character roster and faction expansion', async () => {
    const graph = await store.getSeriesGraph('coiling-dragon');
    expect(graph).not.toBeNull();
    const characters = Object.values(graph!.entities).filter(e => e.type === 'character');
    expect(characters.length).toBeGreaterThanOrEqual(20);
    const factions = Object.values(graph!.entities).filter(e => e.type === 'faction');
    expect(factions.length).toBeGreaterThanOrEqual(5);
    for (const char of characters) {
      expect(char.avatar_url).toBeDefined();
    }
  });

  it('validates all 5 universes against CanonicalLoreGraphSchema', async () => {
    const { CanonicalLoreGraphSchema } = await import('../src/domain/schema');
    const seriesList = await store.listSeries();
    expect(seriesList.length).toBeGreaterThanOrEqual(5);

    for (const series of seriesList) {
      const graph = await store.getSeriesGraph(series.slug);
      expect(graph).not.toBeNull();
      const parseResult = CanonicalLoreGraphSchema.safeParse(graph);
      if (!parseResult.success) {
        console.error(`Schema errors in ${series.slug}:`, parseResult.error.issues);
      }
      expect(parseResult.success).toBe(true);
    }
  });

  it('validates all canon duel presets reference existing fighters', async () => {
    const { getCanonPresets } = await import('../src/engine/duel-simulator');
    const seriesList = await store.listSeries();

    for (const series of seriesList) {
      const graph = await store.getSeriesGraph(series.slug);
      expect(graph).not.toBeNull();
      const presets = getCanonPresets(series.slug);
      for (const preset of presets) {
        expect(graph!.entities[preset.fighterA]).toBeDefined();
        expect(graph!.entities[preset.fighterB]).toBeDefined();
      }
    }
  });
});
