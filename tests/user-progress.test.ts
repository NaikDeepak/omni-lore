import { describe, expect, it, beforeEach } from 'vitest';
import { UserProgressService } from '../src/lib/user-progress';
import { PinnedCharacter, SavedDuelMatch } from '../src/domain/user-progress';

// Mock localStorage for node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('UserProgressService (Local Reading Tracker & Bookmarks)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default store structure when storage is empty', () => {
    const store = UserProgressService.loadStore();
    expect(store.version).toBe(1);
    expect(store.universes['one-piece']).toBeDefined();
    expect(store.universes['coiling-dragon']).toBeDefined();
    expect(store.pinnedCharacters.length).toBeGreaterThan(0);
    expect(store.savedDuels).toEqual([]);
  });

  it('saves reading chapter and updates timestamp and last tab', () => {
    UserProgressService.saveChapter('one-piece', 450, 1110, 'ladder');
    const progress = UserProgressService.getProgress('one-piece');

    expect(progress).toBeDefined();
    expect(progress?.currentChapter).toBe(450);
    expect(progress?.activeTab).toBe('ladder');
    expect(new Date(progress?.lastUpdated ?? '').getTime()).toBeGreaterThan(0);
  });

  it('pins and unpins characters (toggle)', () => {
    // Character not in initial seed
    const newCharId = 'sung-jin-woo';
    expect(UserProgressService.isCharacterPinned('solo-leveling', newCharId)).toBe(false);

    // Pin character
    const isNowPinned = UserProgressService.togglePinCharacter('solo-leveling', newCharId, 'Sung Jin-Woo');
    expect(isNowPinned).toBe(true);
    expect(UserProgressService.isCharacterPinned('solo-leveling', newCharId)).toBe(true);

    const storeAfterPin = UserProgressService.loadStore();
    const found = storeAfterPin.pinnedCharacters.find(p => p.id === newCharId);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Sung Jin-Woo');

    // Toggle unpins
    const isUnpinned = UserProgressService.togglePinCharacter('solo-leveling', newCharId, 'Sung Jin-Woo');
    expect(isUnpinned).toBe(false);
    expect(UserProgressService.isCharacterPinned('solo-leveling', newCharId)).toBe(false);

    const storeAfterUnpin = UserProgressService.loadStore();
    expect(storeAfterUnpin.pinnedCharacters.some(p => p.id === newCharId)).toBe(false);
  });

  it('saves and deletes duel match records', () => {
    const duel: SavedDuelMatch = {
      id: 'duel-test-1',
      universeSlug: 'one-piece',
      fighterAId: 'luffy',
      fighterBId: 'zoro',
      fighterAName: 'Monkey D. Luffy',
      fighterBName: 'Roronoa Zoro',
      chapter: 450,
      verdict: 'Luffy wins with Gear 2',
      savedAt: new Date().toISOString(),
    };

    UserProgressService.saveDuel(duel);
    let store = UserProgressService.loadStore();
    expect(store.savedDuels.length).toBe(1);
    expect(store.savedDuels[0].id).toBe('duel-test-1');

    UserProgressService.deleteDuel('duel-test-1');
    store = UserProgressService.loadStore();
    expect(store.savedDuels.length).toBe(0);
  });

  it('exports and imports valid JSON backup state', () => {
    UserProgressService.saveChapter('coiling-dragon', 500, 842, 'web');
    const exportedJson = UserProgressService.exportJson();

    expect(exportedJson).toContain('"coiling-dragon"');
    expect(exportedJson).toContain('"currentChapter": 500');

    // Clear storage
    localStorage.clear();
    expect(UserProgressService.getProgress('coiling-dragon')?.currentChapter).toBe(115);

    // Import exported JSON
    const success = UserProgressService.importJson(exportedJson);
    expect(success).toBe(true);

    const restoredProgress = UserProgressService.getProgress('coiling-dragon');
    expect(restoredProgress?.currentChapter).toBe(500);
    expect(restoredProgress?.activeTab).toBe('web');
  });

  it('rejects invalid JSON backup cleanly without crashing', () => {
    const corruptedJson = '{ "version": "invalid", "bad_data": true }';
    const success = UserProgressService.importJson(corruptedJson);
    expect(success).toBe(false);
  });
});
