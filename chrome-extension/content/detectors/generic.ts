import { ReaderDetector, ChapterContext } from '../../shared/types';
import { normalizeSeriesTitle, SUPPORTED_SERIES } from '../../shared/constants';

export const genericDetector: ReaderDetector = {
  name: 'Generic Reader Detector',
  canHandle(_url: URL): boolean {
    return true; // Fallback for any website
  },
  async detect(doc: Document, url: URL): Promise<ChapterContext | null> {
    const headingText = Array.from(doc.querySelectorAll('h1, h2, .chapter-title, .entry-title, .reader-header'))
      .map(el => el.textContent ?? '')
      .join(' ');

    const combinedText = `${doc.title} ${url.pathname} ${url.search} ${headingText}`;
    const normalized = normalizeSeriesTitle(combinedText);

    // Regex checks for chapter markers
    let chapterNum: number | undefined;
    const patterns = [
      /chapter[-_\s/]+(\d+)/i,
      /ch[-_\s/]+(\d+)/i,
      /\/c(\d+)(?:[^\d]|$)/i,
      /episode[-_\s/]+(\d+)/i,
      /ep[-_\s/]+(\d+)/i,
      /(\d+)(?:st|nd|rd|th)?[-_\s]+chapter/i
    ];

    for (const pat of patterns) {
      const match = combinedText.match(pat);
      if (match && match[1]) {
        chapterNum = parseInt(match[1], 10);
        break;
      }
    }

    if (!normalized && !chapterNum) return null;

    const series = normalized ?? {
      slug: SUPPORTED_SERIES[0].slug,
      title: SUPPORTED_SERIES[0].title
    };
    const ch = chapterNum ?? 1;

    let confidence = 0.50;
    if (normalized && chapterNum) {
      confidence = 0.85;
    } else if (normalized) {
      confidence = 0.72;
    } else if (chapterNum) {
      confidence = 0.60;
    }

    // Hostname without www
    const host = url.hostname.replace(/^www\./, '');

    return {
      seriesTitle: series.title,
      seriesSlug: series.slug,
      chapterNumber: ch,
      chapterLabel: `Chapter ${ch}`,
      source: host,
      url: url.href,
      confidence
    };
  }
};
