export interface WikiImageResult {
  title: string;
  sourceUrl: string;
  originalWidth?: number;
  originalHeight?: number;
  source: string;
}

export class WikiImageFetcher {
  private static FANDOM_SUBDOMAINS: Record<string, string> = {
    'one-piece': 'onepiece',
    'coiling-dragon': 'coiling-dragon',
    'demonic-emperor': 'magic-emperor',
    'solo-leveling': 'solo-leveling',
    'naruto': 'naruto',
    'bleach': 'bleach',
    'lord-of-the-mysteries': 'lordofthemysteries',
  };

  /**
   * Fetches the primary image URL for an entity from Fandom or Wikipedia.
   */
  public static async fetchImageForEntity(
    seriesSlug: string,
    entityName: string,
    targetSize: number = 300,
    aliases: string[] = []
  ): Promise<WikiImageResult | null> {
    const candidates: string[] = [entityName];

    // Remove parentheses: "Sakazuki (Akainu)" -> "Sakazuki"
    const cleaned = entityName.replace(/\s*\([^)]*\)/g, '').trim();
    if (cleaned && !candidates.includes(cleaned)) candidates.push(cleaned);

    // Extract inside parentheses: "Sakazuki (Akainu)" -> "Akainu"
    const insideParens = entityName.match(/\(([^)]+)\)/)?.[1]?.trim();
    if (insideParens && !candidates.includes(insideParens)) candidates.push(insideParens);

    // Add aliases
    for (const a of aliases) {
      if (a && !candidates.includes(a)) candidates.push(a);
    }

    // Try each candidate across Fandom and Wikipedia
    const fandomSubdomain = this.FANDOM_SUBDOMAINS[seriesSlug];
    for (const candidate of candidates) {
      if (fandomSubdomain) {
        const fandomResult = await this.queryMediaWiki(
          `https://${fandomSubdomain}.fandom.com/api.php`,
          candidate,
          targetSize
        );
        if (fandomResult) return { ...fandomResult, source: `${fandomSubdomain}.fandom.com` };
      }

      const wikiResult = await this.queryMediaWiki(
        'https://en.wikipedia.org/w/api.php',
        candidate,
        targetSize
      );
      if (wikiResult) return { ...wikiResult, source: 'wikipedia.org' };
    }

    return null;
  }

  private static async queryMediaWiki(
    endpoint: string,
    title: string,
    size: number
  ): Promise<WikiImageResult | null> {
    try {
      const url = new URL(endpoint);
      url.searchParams.set('action', 'query');
      url.searchParams.set('titles', title);
      url.searchParams.set('redirects', '1');
      url.searchParams.set('prop', 'pageimages');
      url.searchParams.set('pithumbsize', String(size));
      url.searchParams.set('format', 'json');
      url.searchParams.set('origin', '*');

      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'OmniLore-PixelEngine/1.0 (https://github.com/omnilore)',
        },
      });

      if (!res.ok) return null;

      const data = await res.json() as any;
      const pages = data?.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId && pageId !== '-1') {
          const page = pages[pageId];
          if (page.thumbnail?.source) {
            return {
              title: page.title,
              sourceUrl: page.thumbnail.source,
              originalWidth: page.thumbnail.width,
              originalHeight: page.thumbnail.height,
              source: endpoint,
            };
          }
        }
      }

      // Secondary fallback: generator=search for closest matching article thumbnail
      const searchUrl = new URL(endpoint);
      searchUrl.searchParams.set('action', 'query');
      searchUrl.searchParams.set('generator', 'search');
      searchUrl.searchParams.set('gsrsearch', title);
      searchUrl.searchParams.set('gsrlimit', '1');
      searchUrl.searchParams.set('prop', 'pageimages');
      searchUrl.searchParams.set('pithumbsize', String(size));
      searchUrl.searchParams.set('format', 'json');
      searchUrl.searchParams.set('origin', '*');

      const sRes = await fetch(searchUrl.toString(), {
        headers: {
          'User-Agent': 'OmniLore-PixelEngine/1.0 (https://github.com/omnilore)',
        },
      });

      if (sRes.ok) {
        const sData = await sRes.json() as any;
        const sPages = sData?.query?.pages;
        if (sPages) {
          const firstId = Object.keys(sPages)[0];
          const sPage = sPages[firstId];
          if (sPage?.thumbnail?.source) {
            return {
              title: sPage.title,
              sourceUrl: sPage.thumbnail.source,
              originalWidth: sPage.thumbnail.width,
              originalHeight: sPage.thumbnail.height,
              source: endpoint,
            };
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Downloads an image URL as an ArrayBuffer.
   */
  public static async downloadImageBuffer(imageUrl: string): Promise<Buffer> {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'OmniLore-PixelEngine/1.0 (https://github.com/omnilore)',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}: HTTP ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
