import { ChapterContext, ShieldLevel, TemporalSnapshot } from './types';

export type ExtensionMessage =
  | { type: 'CHAPTER_DETECTED'; payload: ChapterContext; tabId?: number }
  | { type: 'GET_CURRENT_STATE'; tabId?: number }
  | { type: 'STATE_UPDATED'; payload: ExtensionState }
  | { type: 'OVERRIDE_CHAPTER'; payload: { seriesSlug: string; chapterNumber: number }; tabId?: number }
  | { type: 'SET_SHIELD_LEVEL'; payload: { level: ShieldLevel }; tabId?: number }
  | { type: 'WHO_IS_THIS'; payload: { query: string }; tabId?: number }
  | { type: 'RUN_DUEL'; payload: { fighterAId: string; fighterBId: string; chapter: number } };

export interface ExtensionState {
  detectedContext: ChapterContext | null;
  activeSeriesSlug: string;
  activeChapterNumber: number;
  shieldLevel: ShieldLevel;
  selectedCharacterLookup?: string | null;
  snapshot: TemporalSnapshot | null;
  sourceUrl?: string;
}
