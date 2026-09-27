import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { LocalGitDataStore } from '../src/datastore/local-git-store';
import { simulateDuel, getCanonPresets } from '../src/engine/duel-simulator';

describe('Duel Simulation Engine', () => {
  const store = new LocalGitDataStore(path.resolve(__dirname, '../data'));

  it('provides universe-specific canon showdown presets', () => {
    const opPresets = getCanonPresets('one-piece');
    expect(opPresets.length).toBeGreaterThanOrEqual(4);
    expect(opPresets.some(p => p.fighterA === 'luffy' && p.fighterB === 'arlong')).toBe(true);

    const dePresets = getCanonPresets('demonic-emperor');
    expect(dePresets.length).toBeGreaterThanOrEqual(3);

    const cdPresets = getCanonPresets('coiling-dragon');
    expect(cdPresets.length).toBeGreaterThanOrEqual(3);
    expect(cdPresets.some(p => p.fighterA === 'linley-baruch')).toBe(true);
  });

  it('accurately simulates early One Piece showdown (Luffy vs Arlong at Ch. 90)', async () => {
    const graph = await store.getSeriesGraph('one-piece');
    expect(graph).not.toBeNull();

    const result = simulateDuel('luffy', 'arlong', 90, graph!);
    expect(result).toBeDefined();
    expect(result.fighterA.name).toBe('Monkey D. Luffy');
    expect(result.fighterB.name).toBe('Arlong the Saw');
    expect(result.rounds.length).toBeGreaterThanOrEqual(3);
    expect(result.winnerId).toBe('luffy');
    expect(result.decisiveTechnique).toBeDefined();
  });

  it('respects temporal power stages (Zoro vs Mihawk at Ch. 50)', async () => {
    const graph = await store.getSeriesGraph('one-piece');
    expect(graph).not.toBeNull();

    const result = simulateDuel('zoro', 'mihawk', 50, graph!);
    expect(result).toBeDefined();
    // Mihawk at Ch. 50 is Emperor/Warlord tier while Zoro is Rookie tier
    expect(result.winnerId).toBe('mihawk');
    expect(result.fighterBAdvantage).toBeGreaterThan(result.fighterAAdvantage);
  });

  it('simulates Coiling Dragon duel (Linley vs Olivier at Ch. 200)', async () => {
    const graph = await store.getSeriesGraph('coiling-dragon');
    expect(graph).not.toBeNull();

    const result = simulateDuel('linley-baruch', 'olivier', 200, graph!);
    expect(result).toBeDefined();
    expect(result.rounds.length).toBeGreaterThanOrEqual(3);
    expect(result.fighterA.hpLog[result.fighterA.hpLog.length - 1]).toBeGreaterThanOrEqual(0);
    expect(result.fighterB.hpLog[result.fighterB.hpLog.length - 1]).toBeGreaterThanOrEqual(0);
  });
});
