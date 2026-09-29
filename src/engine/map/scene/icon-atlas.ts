/**
 * Cached texture factory for pixel sprites. Bakes each Graphics-drawn grid
 * into a nearest-filtered texture exactly once per theme.
 */

import { Container, Graphics, Rectangle, Renderer, Texture } from 'pixi.js';
import { MapTheme } from '../../../domain/map-themes';
import { LandmarkGlyphKind, LocationType } from '../../../domain/map-types';
import { PixelSpritePalette, shade, silhouettePalette, spritePalette } from './pixel-palette';
import {
  LANDMARK_SPRITES,
  LOCATION_ICONS,
  WAYPOINT_PYLON,
  drawPixelGrid,
} from './pixel-sprites';

export const SOFT_DISC_RADIUS = 64;

export interface TextureBaker {
  generateTexture(target: Container, width: number, height: number): Texture;
}

export function createRendererBaker(renderer: Renderer): TextureBaker {
  return {
    generateTexture(target, width, height) {
      const texture = renderer.generateTexture({
        target,
        frame: new Rectangle(0, 0, width, height),
        resolution: 1,
        antialias: false,
      });
      texture.source.scaleMode = 'nearest';
      return texture;
    },
  };
}

export class IconAtlas {
  private readonly cache = new Map<string, Texture>();
  private readonly palette: PixelSpritePalette;
  private readonly silhouette: PixelSpritePalette;
  private readonly unlitPylon: PixelSpritePalette;

  constructor(private readonly baker: TextureBaker | null, private readonly theme: MapTheme) {
    this.palette = spritePalette(theme);
    this.silhouette = silhouettePalette(shade(theme.palette.background, -0.2));
    this.unlitPylon = { ...this.palette, a: shade(this.palette.s, -0.35) };
  }

  public get canBake(): boolean {
    return this.baker !== null;
  }

  public location(type: LocationType, variant: 'lit' | 'silhouette' = 'lit'): Texture {
    const grid = LOCATION_ICONS[type];
    return this.bake(`loc:${type}:${variant}`, grid[0].length, grid.length, (g) =>
      drawPixelGrid(g, grid, variant === 'lit' ? this.palette : this.silhouette)
    );
  }

  public landmark(kind: LandmarkGlyphKind): Texture {
    const grid = LANDMARK_SPRITES[kind];
    return this.bake(`landmark:${kind}`, grid[0].length, grid.length, (g) =>
      drawPixelGrid(g, grid, this.palette)
    );
  }

  public pylon(lit: boolean): Texture {
    return this.bake(`pylon:${lit}`, WAYPOINT_PYLON[0].length, WAYPOINT_PYLON.length, (g) =>
      drawPixelGrid(g, WAYPOINT_PYLON, lit ? this.palette : this.unlitPylon)
    );
  }

  /** White radial disc: solid core to 55% radius, 8 stepped bands to transparent. */
  public softDisc(): Texture {
    const r = SOFT_DISC_RADIUS;
    return this.bake('soft-disc', r * 2, r * 2, (g) => {
      const bands = 8;
      for (let i = 0; i < bands; i++) {
        const radius = r - (i * (r * 0.45)) / bands;
        g.circle(r, r, radius).fill({ color: '#ffffff', alpha: 1 / bands });
      }
      g.circle(r, r, r * 0.55).fill({ color: '#ffffff', alpha: 1 });
    });
  }

  public destroy(): void {
    for (const texture of this.cache.values()) texture.destroy(true);
    this.cache.clear();
  }

  private bake(key: string, width: number, height: number, draw: (g: Graphics) => void): Texture {
    const cached = this.cache.get(key);
    if (cached) return cached;
    if (!this.baker) return Texture.EMPTY;
    const g = new Graphics();
    draw(g);
    const texture = this.baker.generateTexture(g, width, height);
    g.destroy();
    this.cache.set(key, texture);
    return texture;
  }
}
