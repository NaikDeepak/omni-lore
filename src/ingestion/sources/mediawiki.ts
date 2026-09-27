export interface RawSourcePage {
  pageid: number;
  title: string;
  extract?: string;
  categories?: string[];
  revisions?: Array<{ revid: number; timestamp: string }>;
}

export class MediaWikiSource {
  private apiEndpoint: string;
  private userAgent: string;

  constructor(
    apiEndpoint: string,
    userAgent: string = 'OmniLore-Ingest/1.0 (https://github.com/omnilore)'
  ) {
    this.apiEndpoint = apiEndpoint;
    this.userAgent = userAgent;
  }

  /**
   * Fetches pages under a specific Category.
   */
  public async fetchCategoryMembers(category: string, limit: number = 50): Promise<string[]> {
    const url = new URL(this.apiEndpoint);
    url.searchParams.set('action', 'query');
    url.searchParams.set('list', 'categorymembers');
    url.searchParams.set('cmtitle', category.startsWith('Category:') ? category : `Category:${category}`);
    url.searchParams.set('cmlimit', String(limit));
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': this.userAgent },
    });

    if (!res.ok) {
      throw new Error(`MediaWiki API error ${res.status}: ${res.statusText}`);
    }

    const data: any = await res.json();
    const members = data.query?.categorymembers ?? [];
    return members.map((m: any) => m.title);
  }

  /**
   * Fetches plain text summaries and extracts for given page titles.
   */
  public async fetchPageExtracts(titles: string[]): Promise<RawSourcePage[]> {
    if (titles.length === 0) return [];

    const url = new URL(this.apiEndpoint);
    url.searchParams.set('action', 'query');
    url.searchParams.set('prop', 'extracts|info');
    url.searchParams.set('exintro', '1');
    url.searchParams.set('explaintext', '1');
    url.searchParams.set('titles', titles.slice(0, 20).join('|'));
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': this.userAgent },
    });

    if (!res.ok) {
      throw new Error(`MediaWiki API error ${res.status}: ${res.statusText}`);
    }

    const data: any = await res.json();
    const pages = Object.values(data.query?.pages ?? {}) as any[];

    return pages.map(p => ({
      pageid: p.pageid,
      title: p.title,
      extract: p.extract ?? '',
    }));
  }
}
