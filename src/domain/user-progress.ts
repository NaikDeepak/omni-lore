export interface PinnedCharacter {
  id: string;
  name: string;
  universeSlug: string;
  pinnedAt: string; // ISO string
}

export interface SavedDuelMatch {
  id: string;
  universeSlug: string;
  fighterAId: string;
  fighterBId: string;
  fighterAName: string;
  fighterBName: string;
  chapter: number;
  verdict?: string;
  savedAt: string;
}

export interface UniverseReadingProgress {
  slug: string;
  currentChapter: number;
  totalChapters: number;
  lastUpdated: string; // ISO string
  activeTab?: string;
  pinnedCharacters: string[]; // character IDs
}

export interface UserProgressStore {
  version: number;
  universes: Record<string, UniverseReadingProgress>;
  pinnedCharacters: PinnedCharacter[];
  savedDuels: SavedDuelMatch[];
  lastActiveUniverse?: string;
}

export const PROGRESS_STORAGE_KEY = 'omnilore_user_progress_v1';

export const INITIAL_USER_PROGRESS: UserProgressStore = {
  version: 1,
  universes: {
    'coiling-dragon': {
      slug: 'coiling-dragon',
      currentChapter: 115,
      totalChapters: 842,
      lastUpdated: new Date().toISOString(),
      activeTab: 'map',
      pinnedCharacters: ['linley-baruch', 'bebe']
    },
    'one-piece': {
      slug: 'one-piece',
      currentChapter: 100,
      totalChapters: 1110,
      lastUpdated: new Date().toISOString(),
      activeTab: 'ladder',
      pinnedCharacters: ['luffy', 'zoro']
    }
  },
  pinnedCharacters: [
    {
      id: 'linley-baruch',
      name: 'Linley Baruch',
      universeSlug: 'coiling-dragon',
      pinnedAt: new Date().toISOString()
    },
    {
      id: 'luffy',
      name: 'Monkey D. Luffy',
      universeSlug: 'one-piece',
      pinnedAt: new Date().toISOString()
    }
  ],
  savedDuels: [],
  lastActiveUniverse: 'coiling-dragon'
};
