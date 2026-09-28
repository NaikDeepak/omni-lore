export type ShieldLevel = 'SAFE' | 'CONTEXT' | 'FULL';

export interface ChapterContext {
  seriesTitle: string;
  seriesSlug: string;
  chapterNumber: number;
  chapterLabel: string;
  source: string;
  url: string;
  confidence: number; // 0.0 to 1.0
}

export interface ReaderDetector {
  name: string;
  canHandle(url: URL): boolean;
  detect(doc: Document, url: URL): Promise<ChapterContext | null>;
}

export interface SnapshotCharacter {
  id: string;
  name: string;
  displayName: string;
  isMasked: boolean;
  realmName: string;
  realmOrder: number;
  factionName: string;
  locationName: string;
  status: string;
  firstAppearance: number;
  avatarUrl?: string;
  aliases: string[];
  powerScore: number;
  title?: string;
  notableAbilities?: string[];
}

export interface SnapshotTier {
  id: string;
  order: number;
  name: string;
  description: string;
  characters: SnapshotCharacter[];
}

export interface SnapshotRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  sourceName?: string;
  targetName: string;
  label: string;
  type?: string;
  category: 'master' | 'disciple' | 'ally' | 'rival' | 'enemy' | 'family' | 'faction';
  description?: string;
}

export interface SnapshotMilestone {
  id: string;
  title: string;
  chapter: number;
  eventType: string;
  description: string;
  category?: string;
  involvedCharacters?: string[];
}

export interface TemporalSnapshot {
  seriesSlug: string;
  seriesTitle: string;
  chapter: number;
  totalChapters: number;
  shieldLevel: ShieldLevel;
  characters: SnapshotCharacter[];
  powerTiers: SnapshotTier[];
  relationships: SnapshotRelationship[];
  milestones: SnapshotMilestone[];
  unrevealedCount: number;
}

export interface MiniDuelResult {
  fighterA: SnapshotCharacter;
  fighterB: SnapshotCharacter;
  winner: SnapshotCharacter;
  chapter: number;
  rounds: {
    roundNumber: number;
    attackerName: string;
    actionDescription: string;
    damage: number;
  }[];
  verdict: string;
  disclaimer?: string;
}

