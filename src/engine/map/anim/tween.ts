/**
 * Minimal ticker-driven numeric tween system.
 *
 * Keyed tweens retarget from their current value when restarted, so rapid
 * chapter scrubbing never builds an animation queue.
 */

export type Easing = (t: number) => number;

export const Ease = {
  linear: ((t) => t) as Easing,
  outCubic: ((t) => 1 - Math.pow(1 - t, 3)) as Easing,
  inOutCubic: ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)) as Easing,
  outBack: ((t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }) as Easing,
};

export interface TweenSpec {
  from?: number;
  to: number;
  durationMs: number;
  ease?: Easing;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

interface ActiveTween {
  from: number;
  to: number;
  durationMs: number;
  elapsedMs: number;
  ease: Easing;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

export class TweenManager {
  private readonly tweens = new Map<string, ActiveTween>();
  private readonly values = new Map<string, number>();

  public get size(): number {
    return this.tweens.size;
  }

  public to(key: string, spec: TweenSpec): void {
    const from = spec.from ?? this.values.get(key) ?? spec.to;
    if (spec.durationMs <= 0) {
      this.tweens.delete(key);
      this.values.set(key, spec.to);
      spec.onUpdate(spec.to);
      spec.onComplete?.();
      return;
    }
    this.values.set(key, from);
    this.tweens.set(key, {
      from,
      to: spec.to,
      durationMs: spec.durationMs,
      elapsedMs: 0,
      ease: spec.ease ?? Ease.outCubic,
      onUpdate: spec.onUpdate,
      onComplete: spec.onComplete,
    });
  }

  public value(key: string): number | undefined {
    return this.values.get(key);
  }

  public isActive(key: string): boolean {
    return this.tweens.has(key);
  }

  public cancel(key: string): void {
    this.tweens.delete(key);
  }

  public tick(dtMs: number): void {
    for (const [key, tween] of Array.from(this.tweens.entries())) {
      if (this.tweens.get(key) !== tween) continue;
      tween.elapsedMs += dtMs;
      const t = Math.min(1, tween.elapsedMs / tween.durationMs);
      const value = tween.from + (tween.to - tween.from) * tween.ease(t);
      this.values.set(key, value);
      tween.onUpdate(value);
      if (t >= 1) {
        this.tweens.delete(key);
        tween.onComplete?.();
      }
    }
  }

  public clear(): void {
    this.tweens.clear();
    this.values.clear();
  }
}
