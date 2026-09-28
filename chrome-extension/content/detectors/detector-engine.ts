import { ReaderDetector, ChapterContext } from '../../shared/types';
import { SUPPORTED_SERIES } from '../../shared/constants';
import { mangaplusDetector } from './mangaplus';
import { webnovelDetector } from './webnovel';
import { wuxiaworldDetector } from './wuxiaworld';
import { tapasDetector } from './tapas';
import { genericDetector } from './generic';

const DETECTORS: ReaderDetector[] = [
  mangaplusDetector,
  webnovelDetector,
  wuxiaworldDetector,
  tapasDetector,
  genericDetector
];

export async function detectActiveChapter(doc: Document, rawUrl: string): Promise<ChapterContext | null> {
  try {
    const url = new URL(rawUrl);

    for (const detector of DETECTORS) {
      if (detector.canHandle(url)) {
        const result = await detector.detect(doc, url);
        if (result && result.chapterNumber && result.chapterNumber > 0) {
          // Global Sanity Guard: chapters must be realistic canon numbers, not 7-digit internal IDs
          const seriesMeta = SUPPORTED_SERIES.find(s => s.slug === result.seriesSlug);
          const maxAllowed = seriesMeta ? seriesMeta.totalChapters + 50 : 3000;
          if (result.chapterNumber > maxAllowed) {
            console.warn(`[OmniLore Reader] ${detector.name} returned invalid chapter number (${result.chapterNumber} > ${maxAllowed}). Ignoring.`);
            continue;
          }
          return result;
        }
      }
    }

    return null;
  } catch (err) {
    console.error('[OmniLore Reader] Detection failed', err);
    return null;
  }
}
