/**
 * Universe Map Theme Registry & Atmospheric Styling
 *
 * Defines visual theme configurations, color palettes, marker styles,
 * fog-of-war shaders/overlays, and atmospheric ambient particle settings
 * for each canonical universe supported by OmniLore Map Engine v2.
 */

import {
  MapTheme,
  MapThemePalette,
  MapThemeMarkerStyle,
  MapThemeFogStyle,
  MapAtmosphereParticles
} from './map-types';

export type {
  MapTheme,
  MapThemePalette,
  MapThemeMarkerStyle,
  MapThemeFogStyle,
  MapAtmosphereParticles
};

export const UNIVERSE_MAP_THEMES: Record<string, MapTheme> = {
  'reverend-insanity': {
    slug: 'reverend-insanity',
    name: 'Reverend Insanity',
    palette: {
      background: '#0a1712',
      primaryAccent: '#10b981',
      secondaryAccent: '#dc2626',
      territoryAlpha: 0.22,
      routeColor: '#10b981',
      textColor: '#a7f3d0',
      gridColor: 'rgba(16, 185, 129, 0.12)',
      landColor: '#0b251b',
      seaColor: '#04100c',
      mountainColor: '#154231'
    },
    markerStyle: {
      shape: 'diamond',
      glowColor: '#10b981',
      defaultSize: 8,
      criticalSize: 14
    },
    fogStyle: {
      style: 'ink_mist',
      color: '#020705',
      opacity: 0.85,
      blur: 4
    },
    atmosphereParticles: {
      type: 'ink_mist',
      count: 30,
      color: '#10b981'
    }
  },

  'coiling-dragon': {
    slug: 'coiling-dragon',
    name: 'Coiling Dragon',
    palette: {
      background: '#0a1024',
      primaryAccent: '#f59e0b',
      secondaryAccent: '#60a5fa',
      territoryAlpha: 0.22,
      routeColor: '#f59e0b',
      textColor: '#fde68a',
      gridColor: 'rgba(245, 158, 11, 0.12)',
      landColor: '#17233d',
      seaColor: '#0a1024',
      mountainColor: '#2a3b63'
    },
    markerStyle: {
      shape: 'diamond',
      glowColor: '#f59e0b',
      defaultSize: 8,
      criticalSize: 14
    },
    fogStyle: {
      style: 'celestial_shimmer',
      color: '#050711',
      opacity: 0.8,
      blur: 4
    },
    atmosphereParticles: {
      type: 'elemental_spark',
      count: 25,
      color: '#f59e0b'
    }
  },

  'solo-leveling': {
    slug: 'solo-leveling',
    name: 'Solo Leveling',
    palette: {
      background: '#040b17',
      primaryAccent: '#38bdf8',
      secondaryAccent: '#a855f7',
      territoryAlpha: 0.22,
      routeColor: '#38bdf8',
      textColor: '#bae6fd',
      gridColor: 'rgba(56, 189, 248, 0.15)',
      landColor: '#0d213a',
      seaColor: '#040b17',
      mountainColor: '#163861'
    },
    markerStyle: {
      shape: 'circle',
      glowColor: '#38bdf8',
      defaultSize: 8,
      criticalSize: 14
    },
    fogStyle: {
      style: 'dungeon_shadow',
      color: '#02050b',
      opacity: 0.85,
      blur: 4
    },
    atmosphereParticles: {
      type: 'shadow_wisp',
      count: 35,
      color: '#38bdf8'
    }
  },

  'lord-of-the-mysteries': {
    slug: 'lord-of-the-mysteries',
    name: 'Lord of the Mysteries',
    palette: {
      background: '#0d0918',
      primaryAccent: '#c084fc',
      secondaryAccent: '#d97706',
      territoryAlpha: 0.22,
      routeColor: '#c084fc',
      textColor: '#e9d5ff',
      gridColor: 'rgba(192, 132, 252, 0.15)',
      landColor: '#201833',
      seaColor: '#0d0918',
      mountainColor: '#362a54'
    },
    markerStyle: {
      shape: 'diamond',
      glowColor: '#c084fc',
      defaultSize: 8,
      criticalSize: 14
    },
    fogStyle: {
      style: 'cosmic_haze',
      color: '#06040c',
      opacity: 0.85,
      blur: 5
    },
    atmosphereParticles: {
      type: 'cosmic_star',
      count: 30,
      color: '#c084fc'
    }
  },

  'one-piece': {
    slug: 'one-piece',
    name: 'One Piece',
    palette: {
      background: '#051221',
      primaryAccent: '#0284c7',
      secondaryAccent: '#fbbf24',
      territoryAlpha: 0.22,
      routeColor: '#fbbf24',
      textColor: '#fef08a',
      gridColor: 'rgba(250, 204, 21, 0.15)',
      landColor: '#162e45',
      seaColor: '#051221',
      mountainColor: '#234a6e'
    },
    markerStyle: {
      shape: 'circle',
      glowColor: '#fbbf24',
      defaultSize: 8,
      criticalSize: 14
    },
    fogStyle: {
      style: 'sea_fog',
      color: '#03080e',
      opacity: 0.8,
      blur: 4
    },
    atmosphereParticles: {
      type: 'sea_spray',
      count: 25,
      color: '#38bdf8'
    }
  },

  'demonic-emperor': {
    slug: 'demonic-emperor',
    name: 'Demonic Emperor',
    palette: {
      background: '#150a0f',
      primaryAccent: '#ef4444',
      secondaryAccent: '#f97316',
      territoryAlpha: 0.22,
      routeColor: '#ef4444',
      textColor: '#fecaca',
      gridColor: 'rgba(239, 68, 68, 0.15)',
      landColor: '#2b101b',
      seaColor: '#11050a',
      mountainColor: '#45192c'
    },
    markerStyle: {
      shape: 'diamond',
      glowColor: '#ef4444',
      defaultSize: 8,
      criticalSize: 14
    },
    fogStyle: {
      style: 'demonic_miasma',
      color: '#080205',
      opacity: 0.85,
      blur: 4
    },
    atmosphereParticles: {
      type: 'demonic_ember',
      count: 30,
      color: '#ef4444'
    }
  }
};

/**
 * Retrieve the active MapTheme for a universe slug with safe fallback.
 */
export function getMapTheme(slug: string): MapTheme {
  return UNIVERSE_MAP_THEMES[slug] ?? UNIVERSE_MAP_THEMES['coiling-dragon'];
}
