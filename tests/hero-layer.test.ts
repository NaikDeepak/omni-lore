import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { HeroWalker, heroTrailPoints, HERO_JUMP_WAYPOINTS } from '../src/engine/map/layers/hero-walker';
import { HeroLayer } from '../src/engine/map/layers/hero-layer';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TileAtlas } from '../src/engine/map/scene/tile-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme } from '../src/domain/map-themes';
import { projectTemporalMap } from '../src/projections/temporal-map';
import { diffMapSnapshots } from '../src/projections/map-snapshot-diff';
import { WorldMapDefinition } from '../src/domain/map-types';

describe('HeroWalker', () => {
  it('walks at minimum speed and ends exactly at the target', () => {
    const w = new HeroWalker();
    w.teleport({ x: 0, y: 0 });
    w.walk([{ x: 0, y: 0 }, { x: 110, y: 0 }]);
    expect(w.isWalking).toBe(true);
    w.tick(250);
    expect(w.position!.x).toBeCloseTo(55);
    w.tick(1000);
    expect(w.position).toEqual({ x: 110, y: 0 });
    expect(w.isWalking).toBe(false);
  });

  it('caps long walks to the max duration', () => {
    const w = new HeroWalker();
    w.teleport({ x: 0, y: 0 });
    w.walk([{ x: 0, y: 0 }, { x: 5000, y: 0 }]);
    w.tick(1600);
    expect(w.position).toEqual({ x: 5000, y: 0 });
  });

  it('retargets from its current mid-walk position', () => {
    const w = new HeroWalker();
    w.teleport({ x: 0, y: 0 });
    w.walk([{ x: 0, y: 0 }, { x: 110, y: 0 }]);
    w.tick(250);
    w.walk([{ x: 110, y: 0 }, { x: 110, y: 100 }]);
    expect(w.isWalking).toBe(true);
    w.tick(2000);
    expect(w.position).toEqual({ x: 110, y: 100 });
  });

  it('teleports for single-point paths and reports the traveled prefix', () => {
    const w = new HeroWalker();
    w.walk([{ x: 5, y: 5 }]);
    expect(w.position).toEqual({ x: 5, y: 5 });
    expect(w.isWalking).toBe(false);
    w.walk([{ x: 5, y: 5 }, { x: 5, y: 105 }]);
    w.tick(250);
    const trail = w.traveledPath;
    expect(trail[0]).toEqual({ x: 5, y: 5 });
    expect(trail[trail.length - 1].y).toBeCloseTo(60);
  });
});

const def: WorldMapDefinition = {
  id: 'hero', universeId: 'reverend-insanity', coordinateSystem: 'world', width: 1000, height: 1000,
  terrain: [], regions: [], routes: [], territories: [], events: [],
  locations: Array.from({ length: 16 }, (_, i) => ({
    id: `l${i}`, name: `L${i}`, x: 50 + i * 50, y: 100, type: 'village' as const, importance: 'minor' as const,
    firstAppearanceChapter: i * 10 + 1, revealedAtChapter: i * 10 + 1,
  })),
  characterPaths: [{
    characterId: 'hero', characterName: 'Hero',
    waypoints: Array.from({ length: 16 }, (_, i) => ({ chapter: i * 10 + 1, locationId: `l${i}`, x: 50 + i * 50, y: 100 })),
  }],
};

function layer(reducedMotion = false) {
  const theme = getMapTheme('reverend-insanity');
  return new HeroLayer(new Container(), { theme, atlas: new IconAtlas(null, theme), tiles: new TileAtlas(null), tweens: new TweenManager(), reducedMotion });
}

describe('HeroLayer', () => {
  it('extracts the trail points for the active character', () => {
    expect(heroTrailPoints(projectTemporalMap(def, 25))).toEqual([
      { x: 50, y: 100 }, { x: 100, y: 100 }, { x: 150, y: 100 },
    ]);
  });

  it('teleports on the first snapshot and walks on forward scrubs', () => {
    const hero = layer();
    const a = projectTemporalMap(def, 21);
    hero.sync(a, diffMapSnapshots(null, a));
    expect(hero.tokenVisible).toBe(true);
    expect(hero.walker.isWalking).toBe(false);
    expect(hero.walker.position).toEqual({ x: 150, y: 100 });

    const b = projectTemporalMap(def, 41);
    hero.sync(b, diffMapSnapshots(a, b));
    expect(hero.walker.isWalking).toBe(true);
    hero.update(2000);
    expect(hero.tokenPosition).toEqual({ x: 250, y: 100 });
  });

  it('teleports instead of walking for huge jumps', () => {
    const hero = layer();
    const a = projectTemporalMap(def, 1);
    hero.sync(a, diffMapSnapshots(null, a));
    const b = projectTemporalMap(def, 151);
    const diff = diffMapSnapshots(a, b);
    expect(diff.hero.path.length).toBeGreaterThan(HERO_JUMP_WAYPOINTS);
    hero.sync(b, diff);
    expect(hero.walker.isWalking).toBe(false);
    expect(hero.walker.position).toEqual({ x: 800, y: 100 });
  });

  it('teleports under reduced motion', () => {
    const hero = layer(true);
    const a = projectTemporalMap(def, 21);
    hero.sync(a, diffMapSnapshots(null, a));
    const b = projectTemporalMap(def, 41);
    hero.sync(b, diffMapSnapshots(a, b));
    expect(hero.walker.isWalking).toBe(false);
    expect(hero.walker.position).toEqual({ x: 250, y: 100 });
  });

  it('hides the token when the selected character has no path', () => {
    const hero = layer();
    const snap = projectTemporalMap(def, 50, { activeCharacterId: 'nobody' });
    hero.sync(snap, diffMapSnapshots(null, snap));
    expect(hero.tokenVisible).toBe(false);
    expect(hero.tokenPosition).toBeNull();
  });

  it('keeps the full journey trail when a hero walk completes', () => {
    const hero = layer();
    const a = projectTemporalMap(def, 21);
    hero.sync(a, diffMapSnapshots(null, a));

    const b = projectTemporalMap(def, 41);
    hero.sync(b, diffMapSnapshots(a, b));
    expect(hero.walker.isWalking).toBe(true);

    // Mid-walk: the last trail point should equal walker position
    hero.update(50);
    expect(hero.trailPoints[hero.trailPoints.length - 1]).toEqual(hero.walker.position);

    // Complete the walk
    hero.update(2000);
    expect(hero.walker.isWalking).toBe(false);
    // Full trail should be visible after walk completes
    expect(hero.trailPoints).toEqual([
      { x: 50, y: 100 },
      { x: 100, y: 100 },
      { x: 150, y: 100 },
      { x: 200, y: 100 },
      { x: 250, y: 100 },
    ]);
  });
});
