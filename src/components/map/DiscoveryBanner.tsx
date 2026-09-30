'use client';

import React, { useEffect } from 'react';
import { BANNER_DURATION_MS, BannerState } from './atlas-ui-state';

export interface DiscoveryBannerProps {
  state: BannerState | null;
  onDone: () => void;
  accentColor: string;
}

export function DiscoveryBanner({ state, onDone, accentColor }: DiscoveryBannerProps) {
  const key = state?.key;
  useEffect(() => {
    if (key === undefined) return;
    const timer = setTimeout(onDone, BANNER_DURATION_MS);
    return () => clearTimeout(timer);
  }, [key, onDone]);

  if (!state) return null;
  const extra = state.total - 1;

  return (
    <div
      data-testid="discovery-banner"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2 text-center motion-safe:animate-[fadeIn_200ms_ease-out]"
    >
      <div
        className="border-y-2 px-10 py-2 bg-gradient-to-r from-transparent via-black/85 to-transparent"
        style={{ borderColor: `${accentColor}99` }}
      >
        <div className="font-pixel text-[10px] tracking-[0.3em]" style={{ color: accentColor }}>
          NEW AREA DISCOVERED
        </div>
        <div className="font-pixel text-base text-amber-100 drop-shadow-[0_2px_0_#000]">{state.latest}</div>
        {extra > 0 && <div className="font-mono text-[10px] text-slate-400">+{extra} MORE</div>}
      </div>
    </div>
  );
}

export default DiscoveryBanner;
