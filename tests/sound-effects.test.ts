import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoundEngine } from '../src/lib/sound-effects';

describe('SoundEngine (Procedural 8-Bit Web Audio Synthesizer)', () => {
  beforeEach(() => {
    if (SoundEngine.getMuted()) {
      SoundEngine.toggleMute();
    }
  });

  it('initializes in unmuted state by default', () => {
    expect(SoundEngine.getMuted()).toBe(false);
  });

  it('toggles mute state and notifies listeners', () => {
    const listener = vi.fn();
    const unsubscribe = SoundEngine.subscribe(listener);

    const mutedState = SoundEngine.toggleMute();
    expect(mutedState).toBe(true);
    expect(SoundEngine.getMuted()).toBe(true);
    expect(listener).toHaveBeenCalledWith(true);

    const unmutedState = SoundEngine.toggleMute();
    expect(unmutedState).toBe(false);
    expect(SoundEngine.getMuted()).toBe(false);
    expect(listener).toHaveBeenCalledWith(false);

    unsubscribe();
  });

  it('safely executes all procedural sound methods without throwing in Node environment', () => {
    expect(() => {
      SoundEngine.playScrubberTick();
      SoundEngine.playMenuSelect();
      SoundEngine.playBreakthroughFanfare();
      SoundEngine.playCombatHit();
      SoundEngine.playCombatCrit();
      SoundEngine.playVictoryJingle();
      SoundEngine.playPlaneWarp();
    }).not.toThrow();
  });

  it('respects muted state by not throwing and returning cleanly', () => {
    SoundEngine.toggleMute();
    expect(SoundEngine.getMuted()).toBe(true);

    expect(() => {
      SoundEngine.playScrubberTick();
      SoundEngine.playMenuSelect();
      SoundEngine.playBreakthroughFanfare();
      SoundEngine.playCombatHit();
      SoundEngine.playCombatCrit();
      SoundEngine.playVictoryJingle();
      SoundEngine.playPlaneWarp();
    }).not.toThrow();
  });
});
