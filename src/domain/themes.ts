export interface UniverseTheme {
  id: string;
  name: string;
  tagline: string;
  accentColor: string;          // Hex for primary glow
  accentBorder: string;         // Tailwind border
  badgeBg: string;              // Badge background
  badgeText: string;            // Badge text color
  cardBg: string;               // Panel background
  crtTint: string;              // Ambient CRT tone
  runeSymbol: string;           // Iconic thematic rune / glyph
  primaryStat: string;          // e.g. "⚔ Power", "✦ Soul Qi", "⚔ Combat Class"
  secondaryStat: string;        // e.g. "✦ Influence", "👁 Dao Insight", "👑 Shadow Rank"
  mapTerrain: {
    seaColor: string;
    landColor: string;
    mountainColor: string;
    fogColor: string;
    gridLine: string;
  };
}

export const UNIVERSE_THEMES: Record<string, UniverseTheme> = {
  'coiling-dragon': {
    id: 'coiling-dragon',
    name: 'Coiling Dragon',
    tagline: 'Multi-planar elemental laws & ancient dragonblood sovereignty',
    accentColor: '#f59e0b',
    accentBorder: 'border-amber-500/60',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    cardBg: 'bg-[#0e1320]',
    crtTint: 'rgba(245, 158, 11, 0.03)',
    runeSymbol: '🐉',
    primaryStat: '⚔ Planar Power',
    secondaryStat: '✦ Elemental Mystery',
    mapTerrain: {
      seaColor: '#0a1024',
      landColor: '#17233d',
      mountainColor: '#2a3b63',
      fogColor: '#050711',
      gridLine: 'rgba(245, 158, 11, 0.12)',
    },
  },
  'demonic-emperor': {
    id: 'demonic-emperor',
    name: 'Demonic Emperor',
    tagline: 'Nine Serenities demonic arts, cold scheming, and blood avatars',
    accentColor: '#ef4444',
    accentBorder: 'border-red-600/70',
    badgeBg: 'bg-red-500/20',
    badgeText: 'text-red-400',
    cardBg: 'bg-[#150a0f]',
    crtTint: 'rgba(239, 68, 68, 0.04)',
    runeSymbol: '🩸',
    primaryStat: '⚔ Demonic Might',
    secondaryStat: '✦ Scheme Intellect',
    mapTerrain: {
      seaColor: '#11050a',
      landColor: '#2b101b',
      mountainColor: '#45192c',
      fogColor: '#080205',
      gridLine: 'rgba(239, 68, 68, 0.15)',
    },
  },
  'solo-leveling': {
    id: 'solo-leveling',
    name: 'Solo Leveling',
    tagline: 'System awakened hunters, dungeon gates, and shadow monarch legions',
    accentColor: '#38bdf8',
    accentBorder: 'border-cyan-500/60',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    cardBg: 'bg-[#09111e]',
    crtTint: 'rgba(56, 189, 248, 0.03)',
    runeSymbol: '👑',
    primaryStat: '⚔ Hunter Class',
    secondaryStat: '✦ Mana Reserve',
    mapTerrain: {
      seaColor: '#040b17',
      landColor: '#0d213a',
      mountainColor: '#163861',
      fogColor: '#02050b',
      gridLine: 'rgba(56, 189, 248, 0.15)',
    },
  },
  'lord-of-the-mysteries': {
    id: 'lord-of-the-mysteries',
    name: 'Lord of the Mysteries',
    tagline: 'Victorian occult mystery, 22 Beyonder pathways, and the Tarot Club',
    accentColor: '#c084fc',
    accentBorder: 'border-purple-500/60',
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-300',
    cardBg: 'bg-[#110e1c]',
    crtTint: 'rgba(192, 132, 252, 0.04)',
    runeSymbol: '🃏',
    primaryStat: '⚔ Sequence Level',
    secondaryStat: '✦ Spirit Digestion',
    mapTerrain: {
      seaColor: '#0d0918',
      landColor: '#201833',
      mountainColor: '#362a54',
      fogColor: '#06040c',
      gridLine: 'rgba(192, 132, 252, 0.15)',
    },
  },
  'one-piece': {
    id: 'one-piece',
    name: 'One Piece',
    tagline: 'Grand line nautical charts, ancient void centuries, and pirate dreams',
    accentColor: '#facc15',
    accentBorder: 'border-amber-400/60',
    badgeBg: 'bg-amber-400/20',
    badgeText: 'text-amber-300',
    cardBg: 'bg-[#0b1622]',
    crtTint: 'rgba(250, 204, 21, 0.03)',
    runeSymbol: '⚓',
    primaryStat: '⚔ Bounty Rating',
    secondaryStat: '✦ Haki Mastery',
    mapTerrain: {
      seaColor: '#051221',
      landColor: '#162e45',
      mountainColor: '#234a6e',
      fogColor: '#03080e',
      gridLine: 'rgba(250, 204, 21, 0.15)',
    },
  },
};

export function getUniverseTheme(slug: string): UniverseTheme {
  return UNIVERSE_THEMES[slug] ?? UNIVERSE_THEMES['coiling-dragon'];
}
