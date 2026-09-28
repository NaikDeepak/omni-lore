export const SUPPORTED_SERIES = [
  {
    slug: 'one-piece',
    title: 'One Piece',
    aliases: ['one piece', 'op', 'straw hat', 'luffy', 'eiichiro oda'],
    totalChapters: 1110,
    themeColor: '#f59e0b',
    rune: '☠'
  },
  {
    slug: 'coiling-dragon',
    title: 'Coiling Dragon',
    aliases: ['coiling dragon', 'panlong', 'linley baruch', 'i eat tomatoes'],
    totalChapters: 842,
    themeColor: '#10b981',
    rune: '🐉'
  },
  {
    slug: 'solo-leveling',
    title: 'Solo Leveling',
    aliases: ['solo leveling', 'i alone level up', 'sung jin woo', 'chugong', 'shadow monarch'],
    totalChapters: 270,
    themeColor: '#06b6d4',
    rune: '⚔'
  },
  {
    slug: 'lord-of-the-mysteries',
    title: 'Lord of the Mysteries',
    aliases: ['lord of the mysteries', 'lotm', 'klein moretti', 'cuttlefish that loves diving', 'fool'],
    totalChapters: 1432,
    themeColor: '#a855f7',
    rune: '👁'
  },
  {
    slug: 'demonic-emperor',
    title: 'Demonic Emperor',
    aliases: ['demonic emperor', 'magic emperor', 'zhuo fan', 'the steward demonic emperor'],
    totalChapters: 1315,
    themeColor: '#ef4444',
    rune: '🦅'
  }
] as const;

export const CONFIDENCE_THRESHOLD = 0.80;

export const DEFAULT_SHIELD_LEVEL = 'SAFE';

export const DEFAULT_SERIES_SLUG = 'coiling-dragon';
export const DEFAULT_CHAPTER = 250;

export function normalizeSeriesTitle(rawText: string): { slug: string; title: string } | null {
  const clean = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
  for (const s of SUPPORTED_SERIES) {
    if (clean.includes(s.slug.replace('-', ' '))) return { slug: s.slug, title: s.title };
    for (const a of s.aliases) {
      if (clean.includes(a)) return { slug: s.slug, title: s.title };
    }
  }
  return null;
}
