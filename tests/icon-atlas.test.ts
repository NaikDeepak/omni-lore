import { describe, it, expect, vi } from 'vitest';
import { Container, Texture } from 'pixi.js';
import { IconAtlas, TextureBaker, SOFT_DISC_RADIUS } from '../src/engine/map/scene/icon-atlas';
import { getMapTheme } from '../src/domain/map-themes';

function fakeBaker() {
  const made: Array<{ width: number; height: number; destroy: ReturnType<typeof vi.fn> }> = [];
  const baker: TextureBaker = {
    generateTexture: vi.fn((_target: Container, width: number, height: number) => {
      const tex = { width, height, destroy: vi.fn() };
      made.push(tex);
      return tex as unknown as Texture;
    }),
  };
  return { baker, made };
}

describe('IconAtlas', () => {
  const theme = getMapTheme('reverend-insanity');

  it('returns Texture.EMPTY without a baker', () => {
    const atlas = new IconAtlas(null, theme);
    expect(atlas.canBake).toBe(false);
    expect(atlas.location('city')).toBe(Texture.EMPTY);
    expect(atlas.softDisc()).toBe(Texture.EMPTY);
  });

  it('bakes each sprite once and caches it', () => {
    const { baker } = fakeBaker();
    const atlas = new IconAtlas(baker, theme);
    const a = atlas.location('city');
    const b = atlas.location('city');
    expect(a).toBe(b);
    atlas.location('city', 'silhouette');
    atlas.landmark('volcano');
    atlas.pylon(true);
    atlas.pylon(false);
    atlas.landmark('volcano');
    expect(baker.generateTexture).toHaveBeenCalledTimes(5);
  });

  it('bakes sprites with their full grid frame size', () => {
    const { baker, made } = fakeBaker();
    const atlas = new IconAtlas(baker, theme);
    atlas.location('village');
    atlas.landmark('spire');
    atlas.pylon(true);
    atlas.softDisc();
    expect(made.map((t) => [t.width, t.height])).toEqual([
      [12, 12],
      [12, 12],
      [8, 9],
      [SOFT_DISC_RADIUS * 2, SOFT_DISC_RADIUS * 2],
    ]);
  });

  it('destroys every baked texture', () => {
    const { baker, made } = fakeBaker();
    const atlas = new IconAtlas(baker, theme);
    atlas.location('city');
    atlas.softDisc();
    atlas.destroy();
    for (const t of made) expect(t.destroy).toHaveBeenCalledWith(true);
    atlas.location('city');
    expect(baker.generateTexture).toHaveBeenCalledTimes(3);
  });
});
