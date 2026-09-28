import { describe, it, expect } from 'vitest';
import { mangaplusDetector } from '../chrome-extension/content/detectors/mangaplus';
import { webnovelDetector } from '../chrome-extension/content/detectors/webnovel';
import { wuxiaworldDetector } from '../chrome-extension/content/detectors/wuxiaworld';
import { tapasDetector } from '../chrome-extension/content/detectors/tapas';
import { normalizeSeriesTitle } from '../chrome-extension/shared/constants';
import { ExtensionTemporalClient } from '../chrome-extension/temporal/temporal-client';

describe('Chrome Extension: Detector Adapters & Title Normalization', () => {
  it('identifies MangaPlus reader URLs and extracts context', () => {
    const validUrl = new URL('https://mangaplus.shueisha.co.jp/viewer/1018567');
    expect(mangaplusDetector.canHandle(validUrl)).toBe(true);

    const invalidUrl = new URL('https://example.com/manga');
    expect(mangaplusDetector.canHandle(invalidUrl)).toBe(false);
  });

  it('correctly extracts chapter 3 from MangaPlus viewer instead of 7-digit ID 1000488', async () => {
    const mockDoc = {
      title: '#003 Morgan versus Luffy - ONE PIECE | MANGA Plus by SHUEISHA',
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { innerText: 'Some chapter content' }
    } as unknown as Document;

    const viewerUrl = new URL('https://mangaplus.shueisha.co.jp/viewer/1000488');
    const result = await mangaplusDetector.detect(mockDoc, viewerUrl);

    expect(result).not.toBeNull();
    expect(result?.seriesSlug).toBe('one-piece');
    expect(result?.chapterNumber).toBe(3);
    expect(result?.chapterNumber).not.toBe(1000488);
  });

  it('identifies Webnovel reader URLs', () => {
    const url = new URL('https://www.webnovel.com/book/coiling-dragon_12345/chapter-250_67890');
    expect(webnovelDetector.canHandle(url)).toBe(true);
  });

  it('identifies Wuxiaworld reader URLs', () => {
    const url = new URL('https://www.wuxiaworld.com/novel/coiling-dragon/cd-chapter-250');
    expect(wuxiaworldDetector.canHandle(url)).toBe(true);
  });

  it('identifies Tapas reader URLs', () => {
    const url = new URL('https://tapas.io/episode/123456');
    expect(tapasDetector.canHandle(url)).toBe(true);
  });

  it('normalizes series titles accurately across aliases', () => {
    expect(normalizeSeriesTitle('Read One Piece 1110 Online Free')?.slug).toBe('one-piece');
    expect(normalizeSeriesTitle('Coiling Dragon - Book 9 Chapter 25')?.slug).toBe('coiling-dragon');
    expect(normalizeSeriesTitle('Solo Leveling Chapter 170 (Shadow Monarch)')?.slug).toBe('solo-leveling');
    expect(normalizeSeriesTitle('Lord of the Mysteries Klein Moretti Apotheosis')?.slug).toBe('lord-of-the-mysteries');
    expect(normalizeSeriesTitle('Demonic Emperor Zhuo Fan Chapter 450')?.slug).toBe('demonic-emperor');
    expect(normalizeSeriesTitle('Random Cooking Book')).toBeNull();
  });
});

describe('Chrome Extension: Temporal Client & Zero-Spoiler Snapshot', () => {
  it('generates zero-spoiler snapshot for Coiling Dragon at Chapter 250', () => {
    const snapshot = ExtensionTemporalClient.getSnapshot('coiling-dragon', 250, 'SAFE');
    expect(snapshot.chapter).toBe(250);
    expect(snapshot.seriesSlug).toBe('coiling-dragon');
    expect(snapshot.characters.length).toBeGreaterThan(0);

    // Linley should be present with alias masked prior to Ch 500 unmasking
    const linley = snapshot.characters.find((c) => c.id === 'linley-baruch');
    expect(linley).toBeDefined();
    expect(linley?.name).toBe('Linley Baruch');
    expect(linley?.displayName).toBe('Mysterious Sovereign Envoy');
    expect(linley?.isMasked).toBe(true);

    // Future milestones past chapter 250 should NOT be included in SAFE snapshot
    const futureMilestones = snapshot.milestones.filter((m) => m.chapter > 250);
    expect(futureMilestones.length).toBe(0);
  });

  it('honors full unmasking when shield level is FULL', () => {
    const safeSnapshot = ExtensionTemporalClient.getSnapshot('lord-of-the-mysteries', 50, 'SAFE');
    const fullSnapshot = ExtensionTemporalClient.getSnapshot('lord-of-the-mysteries', 50, 'FULL');

    expect(fullSnapshot.characters.length).toBeGreaterThanOrEqual(safeSnapshot.characters.length);
  });

  it('executes 1v1 Mini Duel simulation deterministically at chapter parity', () => {
    const result = ExtensionTemporalClient.runMiniDuel('coiling-dragon', 'linley-baruch', 'bebe', 250);
    expect(result.fighterA.name).toBe('Linley Baruch');
    expect(result.fighterB.name).toBe('Bebe');
    expect(['linley-baruch', 'bebe']).toContain(result.winner.id);
    expect(result.rounds.length).toBeGreaterThan(0);
    expect(result.disclaimer).toContain('Simulation — not canon');
  });

  it('searches for characters with fuzzy matching', () => {
    const found = ExtensionTemporalClient.searchCharacter('one-piece', 'Luffy', 450, 'SAFE');
    expect(found).not.toBeNull();
    expect(found?.displayName.toLowerCase()).toContain('luffy');

    const notFound = ExtensionTemporalClient.searchCharacter('one-piece', 'NonExistentWarrior999', 450, 'SAFE');
    expect(notFound).toBeNull();
  });
});
