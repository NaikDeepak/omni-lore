/**
 * Loads the tileset sheets once (Pixi Assets) and serves:
 *  - nearest-filtered sub-textures for live layers (markers, props)
 *  - raw sheet images for the Canvas 2D plane painter
 *
 * The sheet Textures are owned by Pixi's shared Assets cache (Assets.load deduplicates by URL),
 * so destroy() does NOT unload them — only clears local caches. This prevents double-unload
 * when React StrictMode double-mounts a second renderer instance.
 */

import { Assets, Rectangle, Texture } from 'pixi.js';
import { SheetId, SHEETS, SpriteName, SPRITES } from './sprite-catalog';

export interface SheetLoader {
  load(url: string): Promise<Texture>;
}

export const assetsLoader: SheetLoader = {
  load: (url) => Assets.load<Texture>(url),
};

export class TileAtlas {
  private readonly sheets = new Map<SheetId, Texture>();
  private readonly cache = new Map<SpriteName, Texture>();

  constructor(private readonly loader: SheetLoader | null) {}

  public get ready(): boolean {
    return this.sheets.size === Object.keys(SHEETS).length;
  }

  public async load(): Promise<void> {
    if (!this.loader || this.ready) return;
    const loader = this.loader;
    await Promise.all(
      (Object.keys(SHEETS) as SheetId[]).map(async (id) => {
        const texture = await loader.load(SHEETS[id].url);
        texture.source.scaleMode = 'nearest';
        this.sheets.set(id, texture);
      })
    );
  }

  public texture(name: SpriteName): Texture {
    const cached = this.cache.get(name);
    if (cached) return cached;
    const def = SPRITES[name];
    const sheet = this.sheets.get(def.sheet);
    if (!sheet) return Texture.EMPTY;
    const texture = new Texture({ source: sheet.source, frame: new Rectangle(def.x, def.y, def.w, def.h) });
    this.cache.set(name, texture);
    return texture;
  }

  public image(sheet: SheetId): CanvasImageSource | null {
    const resource = this.sheets.get(sheet)?.source.resource as CanvasImageSource | undefined;
    return resource ?? null;
  }

  public destroy(): void {
    for (const texture of this.cache.values()) texture.destroy(false);
    this.cache.clear();
    this.sheets.clear();
  }
}
