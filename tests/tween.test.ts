import { describe, it, expect, vi } from 'vitest';
import { TweenManager, Ease } from '../src/engine/map/anim/tween';

describe('TweenManager', () => {
  it('interpolates linearly and completes once', () => {
    const tm = new TweenManager();
    const values: number[] = [];
    const done = vi.fn();
    tm.to('a', { from: 0, to: 100, durationMs: 100, ease: Ease.linear, onUpdate: (v) => values.push(v), onComplete: done });
    tm.tick(50);
    expect(values[values.length - 1]).toBeCloseTo(50);
    tm.tick(60);
    expect(values[values.length - 1]).toBe(100);
    expect(done).toHaveBeenCalledTimes(1);
    expect(tm.isActive('a')).toBe(false);
    tm.tick(50);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('retargets from the current value instead of queuing', () => {
    const tm = new TweenManager();
    let last = 0;
    tm.to('a', { from: 0, to: 100, durationMs: 100, ease: Ease.linear, onUpdate: (v) => (last = v) });
    tm.tick(50);
    tm.to('a', { to: 0, durationMs: 100, ease: Ease.linear, onUpdate: (v) => (last = v) });
    tm.tick(50);
    expect(last).toBeCloseTo(25);
    tm.tick(50);
    expect(last).toBe(0);
    expect(tm.size).toBe(0);
  });

  it('applies zero-duration tweens synchronously', () => {
    const tm = new TweenManager();
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    tm.to('a', { from: 3, to: 7, durationMs: 0, onUpdate, onComplete });
    expect(onUpdate).toHaveBeenCalledWith(7);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(tm.value('a')).toBe(7);
    expect(tm.isActive('a')).toBe(false);
  });

  it('cancels without further updates and keeps the last value', () => {
    const tm = new TweenManager();
    const onUpdate = vi.fn();
    tm.to('a', { from: 0, to: 10, durationMs: 100, ease: Ease.linear, onUpdate });
    tm.tick(50);
    tm.cancel('a');
    tm.tick(100);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(tm.value('a')).toBeCloseTo(5);
  });

  it('allows onComplete to chain a new tween on the same key', () => {
    const tm = new TweenManager();
    let last = 0;
    tm.to('pulse', {
      from: 0,
      to: 1,
      durationMs: 10,
      ease: Ease.linear,
      onUpdate: (v) => (last = v),
      onComplete: () => tm.to('pulse', { to: 0, durationMs: 10, ease: Ease.linear, onUpdate: (v) => (last = v) }),
    });
    tm.tick(10);
    expect(last).toBe(1);
    expect(tm.isActive('pulse')).toBe(true);
    tm.tick(10);
    expect(last).toBe(0);
  });

  it('provides easings that start at 0 and end at 1', () => {
    for (const ease of Object.values(Ease)) {
      expect(ease(0)).toBeCloseTo(0);
      expect(ease(1)).toBeCloseTo(1);
    }
    expect(Ease.outCubic(0.5)).toBeGreaterThan(0.5);
  });

  it('clears everything', () => {
    const tm = new TweenManager();
    tm.to('a', { from: 0, to: 1, durationMs: 100, onUpdate: () => {} });
    tm.to('b', { from: 0, to: 1, durationMs: 100, onUpdate: () => {} });
    tm.clear();
    expect(tm.size).toBe(0);
    expect(tm.value('a')).toBeUndefined();
  });
});
