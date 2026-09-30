import { describe, it, expect } from 'vitest';
import { Graphics } from 'pixi.js';
import {
  LOCATION_ICONS,
  LANDMARK_SPRITES,
  WAYPOINT_PYLON,
  PIXEL_GRID_CHARS,
  drawPixelGrid,
} from '../src/engine/map/scene/pixel-sprites';
import { silhouettePalette } from '../src/engine/map/scene/pixel-palette';
import { LocationType, LandmarkGlyphKind } from '../src/domain/map-types';

const LOCATION_TYPES: LocationType[] = ['city', 'village', 'sect', 'clan', 'castle', 'ruin', 'dungeon', 'mountain', 'cave', 'battlefield', 'temple', 'ocean', 'island', 'portal', 'landmark', 'lake'];
const LANDMARK_KINDS: LandmarkGlyphKind[] = ['volcano', 'spire', 'ruin', 'great-tree', 'citadel', 'crater', 'monolith', 'shipwreck', 'portal-arch', 'skull-rock'];

function expectGrid(grid: string[], width: number, height: number, label: string) {
  expect(grid, label).toHaveLength(height);
  for (const row of grid) {
    expect(row.length, `${label}: "${row}"`).toBe(width);
    for (const ch of row) expect(PIXEL_GRID_CHARS.has(ch), `${label}: bad char "${ch}"`).toBe(true);
  }
  expect(grid.join('').replace(/\./g, '').length, `${label} is empty`).toBeGreaterThan(0);
}

describe('pixel sprites', () => {
  it('defines a 12x12 icon for every location type', () => {
    for (const type of LOCATION_TYPES) expectGrid(LOCATION_ICONS[type], 12, 12, `icon ${type}`);
  });

  it('defines a 12x12 sprite for every landmark glyph kind', () => {
    for (const kind of LANDMARK_KINDS) expectGrid(LANDMARK_SPRITES[kind], 12, 12, `landmark ${kind}`);
  });

  it('defines the waypoint pylon', () => {
    expectGrid(WAYPOINT_PYLON, 8, 9, 'pylon');
  });

  it('draws one rect per opaque cell into a Graphics', () => {
    const g = new Graphics();
    const grid = ['o.', '.b'];
    drawPixelGrid(g, grid, silhouettePalette('#123456'), 10, 20, 2);
    const bounds = g.getLocalBounds();
    expect(bounds.x).toBe(10);
    expect(bounds.y).toBe(20);
    expect(bounds.width).toBe(4);
    expect(bounds.height).toBe(4);
  });
});
