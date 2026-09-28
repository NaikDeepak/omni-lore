import { ReaderDetector, ChapterContext } from '../../shared/types';
import { normalizeSeriesTitle } from '../../shared/constants';

export const mangaplusDetector: ReaderDetector = {
  name: 'MangaPlus Detector',
  canHandle(url: URL): boolean {
    return url.hostname.includes('mangaplus.shueisha.co.jp');
  },
  async detect(doc: Document, url: URL): Promise<ChapterContext | null> {
    const pageText = (doc.title + ' ' + (doc.querySelector('h1')?.textContent ?? '')).trim();
    const normalized = normalizeSeriesTitle(pageText);

    // Extract canonical chapter number strictly from title or viewer DOM
    // NOTE: url.pathname (/viewer/1000488) contains MangaPlus's internal 7-digit viewer ID, NOT the chapter number!
    let chapterNum: number | undefined;

    // 1. Check document.title (MangaPlus format: "#003 Morgan versus Luffy - ONE PIECE | MANGA Plus by SHUEISHA")
    const titleMatch = doc.title.match(/#(\d{1,4})\b/i) || doc.title.match(/chapter\s*(\d{1,4})\b/i);
    if (titleMatch) {
      chapterNum = parseInt(titleMatch[1], 10);
    }

    // 2. Check viewer DOM heading elements
    if (!chapterNum) {
      const viewerEls = Array.from(doc.querySelectorAll('h1, h2, h3, [class*="chapter"], [class*="title"], [class*="header"]'));
      for (const el of viewerEls) {
        const text = el.textContent ?? '';
        const m = text.match(/#(\d{1,4})\b/i) || text.match(/chapter\s*(\d{1,4})\b/i);
        if (m) {
          chapterNum = parseInt(m[1], 10);
          break;
        }
      }
    }

    // 3. Fallback: Search body text strictly for 1-4 digit chapter patterns
    if (!chapterNum && doc.body) {
      const bodyMatch = doc.body.innerText.match(/#(\d{1,4})\b/i) || doc.body.innerText.match(/chapter\s*(\d{1,4})\b/i);
      if (bodyMatch) {
        chapterNum = parseInt(bodyMatch[1], 10);
      }
    }

    // Validate: Manga chapters are strictly positive integers <= 2500
    if (chapterNum !== undefined && (chapterNum < 1 || chapterNum > 2500)) {
      chapterNum = undefined;
    }

    if (!normalized && !chapterNum) return null;

    const series = normalized ?? { slug: 'one-piece', title: 'One Piece' };
    const ch = chapterNum ?? 1;

    return {
      seriesTitle: series.title,
      seriesSlug: series.slug,
      chapterNumber: ch,
      chapterLabel: `Ch. ${ch}`,
      source: 'MangaPlus',
      url: url.href,
      confidence: normalized && chapterNum ? 0.99 : 0.75
    };
  }
};
