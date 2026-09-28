import { ReaderDetector, ChapterContext } from '../../shared/types';
import { normalizeSeriesTitle } from '../../shared/constants';

export const webnovelDetector: ReaderDetector = {
  name: 'Webnovel Detector',
  canHandle(url: URL): boolean {
    return url.hostname.includes('webnovel.com');
  },
  async detect(doc: Document, url: URL): Promise<ChapterContext | null> {
    const titleEl = doc.querySelector('.book-name, .cha-hd-mn h1, .crumbs a[href*="/book/"]');
    const chapterEl = doc.querySelector('.cha-hd-mn h3, .cha-tit h3, .chapter-title');

    const combinedText = `${doc.title} ${titleEl?.textContent ?? ''} ${url.pathname}`;
    const normalized = normalizeSeriesTitle(combinedText);

    let chapterNum: number | undefined;
    const chText = (chapterEl?.textContent ?? '') + ' ' + doc.title;
    const chMatch = chText.match(/chapter\s*(\d+)/i) || url.pathname.match(/_(\d+)$/);

    if (chMatch) {
      chapterNum = parseInt(chMatch[1], 10);
    }

    if (!normalized && !chapterNum) return null;

    const series = normalized ?? { slug: 'lord-of-the-mysteries', title: 'Lord of the Mysteries' };
    const ch = chapterNum ?? 1;

    return {
      seriesTitle: series.title,
      seriesSlug: series.slug,
      chapterNumber: ch,
      chapterLabel: `Chapter ${ch}`,
      source: 'Webnovel',
      url: url.href,
      confidence: normalized && chapterNum ? 0.98 : 0.82
    };
  }
};
