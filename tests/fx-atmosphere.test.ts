import { describe, it, expect } from 'vitest';
import { Container } from 'pixi.js';
import { FxLayer } from '../src/engine/map/layers/fx-layer';
import { AtmosphereLayer, particleStyleFor } from '../src/engine/map/layers/atmosphere-layer';
import { IconAtlas } from '../src/engine/map/scene/icon-atlas';
import { TileAtlas } from '../src/engine/map/scene/tile-atlas';
import { TweenManager } from '../src/engine/map/anim/tween';
import { getMapTheme, UNIVERSE_MAP_THEMES } from '../src/domain/map-themes';

const ctx = (slug = 'coiling-dragon', reducedMotion = false) => {
  const theme = getMapTheme(slug);
  return { theme, atlas: new IconAtlas(null, theme), tiles: new TileAtlas(null), tweens: new TweenManager(), reducedMotion };
};

describe('FxLayer', () => {
  it('spawns and expires burst effects', () => {
    const fx = new FxLayer(new Container(), ctx());
    fx.burst(100, 100, 70, '#10b981');
    expect(fx.activeCount).toBe(25);
    fx.update(500);
    expect(fx.activeCount).toBeGreaterThan(0);
    fx.update(1200);
    expect(fx.activeCount).toBe(0);
  });

  it('spawns warp spirals that finish quickly', () => {
    const fx = new FxLayer(new Container(), ctx());
    fx.warp(0, 0, '#ffffff');
    expect(fx.activeCount).toBe(37);
    fx.update(400);
    expect(fx.activeCount).toBe(0);
  });

  it('does nothing under reduced motion', () => {
    const fx = new FxLayer(new Container(), ctx('coiling-dragon', true));
    fx.burst(0, 0, 50, '#fff');
    fx.warp(0, 0, '#fff');
    expect(fx.activeCount).toBe(0);
  });
});

describe('AtmosphereLayer', () => {
  it('derives a capped particle style for every theme', () => {
    for (const theme of Object.values(UNIVERSE_MAP_THEMES)) {
      const style = particleStyleFor(theme);
      expect(style.count).toBeGreaterThan(0);
      expect(style.count).toBeLessThanOrEqual(120);
      expect(style.minSize).toBeLessThanOrEqual(style.maxSize);
    }
    expect(particleStyleFor(getMapTheme('coiling-dragon')).motion).toBe('rise');
    expect(particleStyleFor(getMapTheme('demonic-emperor')).motion).toBe('fall');
  });

  it('keeps particles inside the world while updating', () => {
    const atm = new AtmosphereLayer(new Container(), ctx());
    atm.reset(400, 300, 42);
    expect(atm.particles.length).toBe(particleStyleFor(getMapTheme('coiling-dragon')).count);
    expect(atm.clouds.length).toBe(4);
    for (let i = 0; i < 200; i++) atm.update(50);
    for (const p of atm.particles) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(400);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(300);
    }
  });

  it('spawns nothing under reduced motion', () => {
    const atm = new AtmosphereLayer(new Container(), ctx('coiling-dragon', true));
    atm.reset(400, 300, 1);
    expect(atm.particles.length).toBe(0);
    expect(atm.clouds.length).toBe(0);
  });
});
