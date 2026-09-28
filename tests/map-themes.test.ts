import { describe, it, expect } from 'vitest';
import { getMapTheme, UNIVERSE_MAP_THEMES, MapTheme } from '../src/domain/map-themes';

describe('Universe Map Theme Registry', () => {
  const slugs = [
    'reverend-insanity',
    'coiling-dragon',
    'solo-leveling',
    'lord-of-the-mysteries',
    'one-piece',
    'demonic-emperor'
  ];

  it('retrieves distinct theme configurations for all 6 universes', () => {
    slugs.forEach(slug => {
      const theme = getMapTheme(slug);
      expect(theme).toBeDefined();
      expect(theme.slug).toBe(slug);
      expect(theme.palette).toBeDefined();
      expect(theme.palette.background).toBeDefined();
      expect(theme.palette.primaryAccent).toBeDefined();
      expect(theme.markerStyle).toBeDefined();
      expect(theme.fogStyle).toBeDefined();
      expect(theme.atmosphereParticles).toBeDefined();
    });
  });

  it('contains all 6 universes in UNIVERSE_MAP_THEMES map', () => {
    slugs.forEach(slug => {
      expect(UNIVERSE_MAP_THEMES[slug]).toBeDefined();
      expect(UNIVERSE_MAP_THEMES[slug].slug).toBe(slug);
    });
  });

  it('configures Reverend Insanity with ink-brush and jade palette', () => {
    const riTheme = getMapTheme('reverend-insanity');
    expect(riTheme.palette.primaryAccent).toBe('#10b981');
    expect(riTheme.fogStyle.style).toBe('ink_mist');
    expect(riTheme.palette.secondaryAccent).toBe('#dc2626');
    expect(riTheme.atmosphereParticles?.type).toBe('ink_mist');
  });

  it('configures Coiling Dragon with celestial gold & navy palette', () => {
    const cdTheme = getMapTheme('coiling-dragon');
    expect(cdTheme.palette.primaryAccent).toBe('#f59e0b');
    expect(cdTheme.fogStyle.style).toBe('celestial_shimmer');
    expect(cdTheme.atmosphereParticles?.type).toBe('elemental_spark');
  });

  it('configures Solo Leveling with dark dungeon hunter cyan palette', () => {
    const slTheme = getMapTheme('solo-leveling');
    expect(slTheme.palette.primaryAccent).toBe('#38bdf8');
    expect(slTheme.palette.secondaryAccent).toBe('#a855f7');
    expect(slTheme.fogStyle.style).toBe('dungeon_shadow');
    expect(slTheme.atmosphereParticles?.type).toBe('shadow_wisp');
  });

  it('configures Lord of the Mysteries with Victorian occult purple & antique brass', () => {
    const lotmTheme = getMapTheme('lord-of-the-mysteries');
    expect(lotmTheme.palette.primaryAccent).toBe('#c084fc');
    expect(lotmTheme.palette.secondaryAccent).toBe('#d97706');
    expect(lotmTheme.fogStyle.style).toBe('cosmic_haze');
    expect(lotmTheme.atmosphereParticles?.type).toBe('cosmic_star');
  });

  it('configures One Piece with nautical blue & parchment sand', () => {
    const opTheme = getMapTheme('one-piece');
    expect(opTheme.palette.primaryAccent).toBe('#0284c7');
    expect(opTheme.palette.secondaryAccent).toBe('#fbbf24');
    expect(opTheme.fogStyle.style).toBe('sea_fog');
    expect(opTheme.atmosphereParticles?.type).toBe('sea_spray');
  });

  it('configures Demonic Emperor with Nine Serenities crimson & obsidian', () => {
    const deTheme = getMapTheme('demonic-emperor');
    expect(deTheme.palette.primaryAccent).toBe('#ef4444');
    expect(deTheme.fogStyle.style).toBe('demonic_miasma');
    expect(deTheme.atmosphereParticles?.type).toBe('demonic_ember');
  });

  it('safely falls back to default theme for unknown or invalid universe slug', () => {
    const fallback = getMapTheme('unknown-non-existent-universe');
    expect(fallback).toBeDefined();
    expect(fallback.slug).toBe('coiling-dragon');
    expect(fallback.palette.primaryAccent).toBe('#f59e0b');

    const emptyFallback = getMapTheme('');
    expect(emptyFallback).toBeDefined();
    expect(emptyFallback.slug).toBe('coiling-dragon');
  });
});
