import { ReaderDetector, ChapterContext } from '../../shared/types';
import { normalizeSeriesTitle } from '../../shared/constants';

export const tapasDetector: ReaderDetector = {
  name: 'Tapas Detector',
  canHandle(url: URL): boolean {
    return url.hostname.includes('tapas.io');
  },
  async detect(doc: Document, url: URL): Promise<ChapterContext | null> {
    const rawText = `${doc.title} ${url.pathname}`;
    const normalized = normalizeSeriesTitle(rawText);

    let chapterNum: number | undefined;
    const match = doc.title.match(/episode\s*(\d+)|chapter\s*(\d+)/i) || url.pathname.match(/\/episode\/(\d+)/i);
    if (match) {
      chapterNum = parseInt(match[1] || match[2], 10);
    }

    if (!normalized && !chapterNum) return null;

    const series = normalized ?? { slug: 'solo-leveling', title: 'Solo Leveling' };
    const ch = chapterNum ?? 1;

    return {
      seriesTitle: series.title,
      seriesSlug: series.slug,
      chapterNumber: ch,
      chapterLabel: `Episode ${ch}`,
      source: 'Tapas',
      url: url.href,
      confidence: normalized && chapterNum ? 0.95 : 0.78
    };
  }
};
