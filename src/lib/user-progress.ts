import { 
  UserProgressStore, 
  UniverseReadingProgress, 
  PinnedCharacter, 
  SavedDuelMatch, 
  PROGRESS_STORAGE_KEY, 
  INITIAL_USER_PROGRESS 
} from '../domain/user-progress';

export class UserProgressService {
  private static getStorage(): Storage | null {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  }

  public static loadStore(): UserProgressStore {
    const storage = this.getStorage();
    if (!storage) {
      return JSON.parse(JSON.stringify(INITIAL_USER_PROGRESS));
    }

    try {
      const raw = storage.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) {
        storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(INITIAL_USER_PROGRESS));
        return JSON.parse(JSON.stringify(INITIAL_USER_PROGRESS));
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.universes) {
        return JSON.parse(JSON.stringify(INITIAL_USER_PROGRESS));
      }
      return parsed as UserProgressStore;
    } catch (err) {
      console.error('[UserProgressService] Failed to read localStorage', err);
      return JSON.parse(JSON.stringify(INITIAL_USER_PROGRESS));
    }
  }

  public static getProgress(): UserProgressStore;
  public static getProgress(slug: string): UniverseReadingProgress | undefined;
  public static getProgress(slug?: string): UserProgressStore | UniverseReadingProgress | undefined {
    const store = this.loadStore();
    if (slug) {
      return store.universes[slug];
    }
    return store;
  }

  public static saveProgress(store: UserProgressStore): void {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('omnilore-progress-updated', { detail: store }));
      }
    } catch (err) {
      console.error('[UserProgressService] Failed to save localStorage', err);
    }
  }

  public static saveChapter(
    slug: string, 
    chapter: number, 
    totalChaptersOrTab?: number | string, 
    activeTab?: string
  ): void {
    const store = this.loadStore();
    const existing = store.universes[slug];

    let totalChapters = 1000;
    let tab = existing?.activeTab ?? 'map';

    if (typeof totalChaptersOrTab === 'number') {
      totalChapters = totalChaptersOrTab;
      if (activeTab) tab = activeTab;
    } else if (typeof totalChaptersOrTab === 'string') {
      tab = totalChaptersOrTab;
      totalChapters = existing?.totalChapters ?? 1000;
    } else if (existing?.totalChapters) {
      totalChapters = existing.totalChapters;
    }

    const updatedUniverse: UniverseReadingProgress = {
      slug,
      currentChapter: Math.max(1, Math.min(totalChapters, chapter)),
      totalChapters,
      lastUpdated: new Date().toISOString(),
      activeTab: tab,
      pinnedCharacters: existing?.pinnedCharacters ?? []
    };

    store.universes[slug] = updatedUniverse;
    store.lastActiveUniverse = slug;
    this.saveProgress(store);
  }

  public static togglePinCharacter(
    slugOrPin: string | { id?: string; characterId?: string; name: string; universeSlug: string }, 
    maybeCharId?: string, 
    maybeCharName?: string
  ): boolean {
    const store = this.loadStore();
    let slug = '';
    let characterId = '';
    let characterName = '';

    if (typeof slugOrPin === 'object') {
      slug = slugOrPin.universeSlug;
      characterId = slugOrPin.id || slugOrPin.characterId || '';
      characterName = slugOrPin.name;
    } else {
      slug = slugOrPin;
      characterId = maybeCharId || '';
      characterName = maybeCharName || characterId;
    }

    const existingIndex = store.pinnedCharacters.findIndex(
      p => p.universeSlug === slug && p.id === characterId
    );

    let isNowPinned = false;
    if (existingIndex >= 0) {
      // Unpin
      store.pinnedCharacters.splice(existingIndex, 1);
      if (store.universes[slug]) {
        store.universes[slug].pinnedCharacters = store.universes[slug].pinnedCharacters.filter(id => id !== characterId);
      }
      isNowPinned = false;
    } else {
      // Pin
      const newPin: PinnedCharacter = {
        id: characterId,
        name: characterName,
        universeSlug: slug,
        pinnedAt: new Date().toISOString()
      };
      store.pinnedCharacters.push(newPin);
      if (store.universes[slug]) {
        if (!store.universes[slug].pinnedCharacters.includes(characterId)) {
          store.universes[slug].pinnedCharacters.push(characterId);
        }
      }
      isNowPinned = true;
    }

    this.saveProgress(store);
    return isNowPinned;
  }

  public static isCharacterPinned(slugOrId: string, maybeCharId?: string): boolean {
    const store = this.loadStore();
    if (maybeCharId) {
      return store.pinnedCharacters.some(p => p.universeSlug === slugOrId && p.id === maybeCharId);
    }
    return store.pinnedCharacters.some(p => p.id === slugOrId);
  }

  public static saveDuel(
    slugOrDuel: string | SavedDuelMatch, 
    fighterAId?: string, 
    fighterBId?: string, 
    fighterAName?: string, 
    fighterBName?: string, 
    chapter?: number, 
    verdict?: string
  ): SavedDuelMatch {
    const store = this.loadStore();
    let duel: SavedDuelMatch;

    if (typeof slugOrDuel === 'object') {
      duel = {
        ...slugOrDuel,
        savedAt: slugOrDuel.savedAt || new Date().toISOString()
      };
    } else {
      const matchId = `duel-${slugOrDuel}-${fighterAId}-${fighterBId}-ch${chapter}`;
      duel = {
        id: matchId,
        universeSlug: slugOrDuel,
        fighterAId: fighterAId || '',
        fighterBId: fighterBId || '',
        fighterAName: fighterAName || '',
        fighterBName: fighterBName || '',
        chapter: chapter || 1,
        verdict,
        savedAt: new Date().toISOString()
      };
    }
    
    // Remove if already exists to update
    store.savedDuels = store.savedDuels.filter(d => d.id !== duel.id);
    store.savedDuels.unshift(duel);
    this.saveProgress(store);
    return duel;
  }

  public static removeDuel(id: string): void {
    const store = this.loadStore();
    store.savedDuels = store.savedDuels.filter(d => d.id !== id);
    this.saveProgress(store);
  }

  public static deleteDuel(id: string): void {
    this.removeDuel(id);
  }

  public static exportJson(): string {
    const store = this.loadStore();
    return JSON.stringify(store, null, 2);
  }

  public static importJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object' || !parsed.universes) {
        return false;
      }
      this.saveProgress(parsed as UserProgressStore);
      return true;
    } catch (err) {
      console.error('[UserProgressService] Import failed', err);
      return false;
    }
  }

  public static clearAll(): void {
    const storage = this.getStorage();
    if (!storage) return;
    storage.removeItem(PROGRESS_STORAGE_KEY);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('omnilore-progress-updated', { detail: INITIAL_USER_PROGRESS }));
    }
  }
}
