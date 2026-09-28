'use client';

/**
 * OmniLore Retro 8-Bit Web Audio Synthesizer Engine
 * Pure procedural synthesis without external audio files.
 * Zero bandwidth footprint, instant response, and browser autoplay compliant.
 */

class WebAudioSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastTickTime: number = 0;
  private listeners: Set<(muted: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('omnilore_sfx_muted');
        this.isMuted = saved === 'true';
      } catch {
        this.isMuted = false;
      }
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('omnilore_sfx_muted', String(this.isMuted));
      } catch {}
    }
    this.notifyListeners();
    return this.isMuted;
  }

  public subscribe(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l(this.isMuted));
  }

  // 1. Scrubber Tick (gentle short square blip)
  public playScrubberTick() {
    if (this.isMuted) return;
    const now = Date.now();
    // Throttle to avoid audio clipping during rapid dragging
    if (now - this.lastTickTime < 45) return;
    this.lastTickTime = now;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(820, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  // 2. Menu Click / Tab Select (crisp dual-tone chirp)
  public playMenuSelect() {
    if (this.isMuted) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(780, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {}
  }

  // 3. Breakthrough Fanfare (ascending celebratory arpeggio)
  public playBreakthroughFanfare() {
    if (this.isMuted) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      // C5 -> E5 -> G5 -> C6 -> E6
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      const noteDuration = 0.06;

      notes.forEach((freq, idx) => {
        const startTime = ctx.currentTime + idx * noteDuration;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === notes.length - 1 ? 'triangle' : 'square';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration + (idx === notes.length - 1 ? 0.15 : 0.02));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + noteDuration + (idx === notes.length - 1 ? 0.15 : 0.02));
      });
    } catch {}
  }

  // 4. Combat Hit (crunchy 8-bit strike)
  public playCombatHit() {
    if (this.isMuted) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      // Low pitch square drop + short noise pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  // 5. Combat Crit (resonant dual-tone explosion)
  public playCombatCrit() {
    if (this.isMuted) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'square';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2);

      osc2.frequency.setValueAtTime(1100, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.2);
      osc2.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  // 6. Victory Jingle (triumphant 8-bit fanfare)
  public playVictoryJingle() {
    if (this.isMuted) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      // G4, G4, G4, C5, E5, G5
      const notes = [
        { f: 392.00, d: 0.1 },
        { f: 392.00, d: 0.1 },
        { f: 392.00, d: 0.1 },
        { f: 523.25, d: 0.25 },
        { f: 659.25, d: 0.25 },
        { f: 783.99, d: 0.5 },
      ];

      let elapsed = 0;
      notes.forEach((note) => {
        const startTime = ctx.currentTime + elapsed;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.d);

        elapsed += note.d + 0.03;
      });
    } catch {}
  }

  // 7. Plane Warp / Dimension Shift (cosmic frequency glide)
  public playPlaneWarp() {
    if (this.isMuted) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(980, ctx.currentTime + 0.15);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }
}

// Singleton export
export const SoundEngine = new WebAudioSoundEngine();

// React hook for mute state
import { useState, useEffect } from 'react';

export function useSoundEffects() {
  const [muted, setMuted] = useState<boolean>(() => SoundEngine.getMuted());

  useEffect(() => {
    return SoundEngine.subscribe((newMuted) => {
      setMuted(newMuted);
    });
  }, []);

  const toggle = () => {
    const next = SoundEngine.toggleMute();
    setMuted(next);
  };

  return {
    isMuted: muted,
    toggleMute: toggle,
    playScrubberTick: () => SoundEngine.playScrubberTick(),
    playMenuSelect: () => SoundEngine.playMenuSelect(),
    playBreakthroughFanfare: () => SoundEngine.playBreakthroughFanfare(),
    playCombatHit: () => SoundEngine.playCombatHit(),
    playCombatCrit: () => SoundEngine.playCombatCrit(),
    playVictoryJingle: () => SoundEngine.playVictoryJingle(),
    playPlaneWarp: () => SoundEngine.playPlaneWarp(),
  };
}
