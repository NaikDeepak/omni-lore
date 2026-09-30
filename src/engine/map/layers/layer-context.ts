import { MapTheme } from '../../../domain/map-themes';
import { TweenManager } from '../anim/tween';
import { IconAtlas } from '../scene/icon-atlas';
import { TileAtlas } from '../scene/tile-atlas';

/** Shared dependencies handed to every renderer layer. */
export interface LayerContext {
  theme: MapTheme;
  /** Code-drawn textures: fallback icons, landmark glyphs, pylon, soft disc. */
  atlas: IconAtlas;
  /** Tileset sprites (props); may be not-ready in tests or before load. */
  tiles: TileAtlas;
  tweens: TweenManager;
  reducedMotion: boolean;
}
