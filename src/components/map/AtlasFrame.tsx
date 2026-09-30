'use client';

import React from 'react';

export interface AtlasFrameProps {
  accentColor: string;
  rune: string;
  /** Art attribution (CC-BY requires it); rendered as small links in the bottom-left corner. */
  credits?: Array<{ label: string; url: string }>;
}

const CORNERS = [
  { key: 'tl', className: 'left-0 top-0', transform: '' },
  { key: 'tr', className: 'right-0 top-0', transform: 'scale(-1,1)' },
  { key: 'bl', className: 'left-0 bottom-0', transform: 'scale(1,-1)' },
  { key: 'br', className: 'right-0 bottom-0', transform: 'scale(-1,-1)' },
] as const;

/** Ornate iron-and-bone pixel frame with the universe rune in each corner. */
export function AtlasFrame({ accentColor, rune, credits = [] }: AtlasFrameProps) {
  return (
    <div data-testid="atlas-frame" className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 border-[6px] border-[#16131a]"
          style={{ boxShadow: `inset 0 0 0 1px ${accentColor}66, inset 0 0 0 3px #000, inset 0 0 60px rgba(0,0,0,0.85)` }}
        />
        {CORNERS.map((corner) => (
          <div key={corner.key} className={`absolute ${corner.className} h-10 w-10`}>
            <svg viewBox="0 0 20 20" className="h-10 w-10" shapeRendering="crispEdges" style={{ transform: corner.transform }}>
              <rect x="0" y="0" width="20" height="4" fill="#16131a" />
              <rect x="0" y="0" width="4" height="20" fill="#16131a" />
              <rect x="4" y="4" width="8" height="2" fill={accentColor} opacity="0.7" />
              <rect x="4" y="4" width="2" height="8" fill={accentColor} opacity="0.7" />
              <rect x="8" y="8" width="3" height="3" fill="#d8d0bc" opacity="0.8" />
            </svg>
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] opacity-80">{rune}</span>
          </div>
        ))}
      </div>
      {credits.length > 0 && (
        <div className="pointer-events-auto absolute bottom-2 left-12 flex gap-2 font-mono text-[8px] text-slate-400/80">
          <span>Art:</span>
          {credits.map((credit) => (
            <a key={credit.url} href={credit.url} target="_blank" rel="noreferrer" className="underline hover:text-white">
              {credit.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default AtlasFrame;
