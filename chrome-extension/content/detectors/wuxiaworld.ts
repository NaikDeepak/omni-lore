import { ReaderDetector, ChapterContext } from '../../shared/types';
import { normalizeSeriesTitle } from '../../shared/constants';

export const wuxiaworldDetector: ReaderDetector = {
  name: 'WuxiaWorld Detector',
  canHandle(url: URL): boolean {
    return url.hostname.includes('wuxiaworld.com');
  },
  async detect(doc: Document, url: URL): Promise<ChapterContext | null> {
    const rawText = `${doc.title} ${url.pathname}`;
    const normalized = normalizeSeriesTitle(rawText);

    let chapterNum: number | undefined;
    const match = url.pathname.match(/chapter-(\d+)/i) || doc.title.match(/chapter\s*(\d+)/i);
    if (match) {
      chapterNum = parseInt(match[1], 10);
    }

    if (!normalized && !chapterNum) return null;

    const series = normalized ?? { slug: 'coiling-dragon', title: 'Coiling Dragon' };
    const ch = chapterNum ?? 1;

    return {
      seriesTitle: series.title,
      seriesSlug: series.slug,
      chapterNumber: ch,
      chapterLabel: `Chapter ${ch}`,
      source: 'WuxiaWorld',
      url: url.href,
      confidence: normalized && chapterNum ? 0.98 : 0.85
    };
  }
};
