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
});
