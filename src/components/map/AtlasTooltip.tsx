'use client';

import React, { useState } from 'react';
import { DANGER_COLORS } from '../../engine/map/scene/pixel-palette';
import { placeTooltip, TooltipModel } from './atlas-ui-state';

export interface AtlasTooltipProps {
  model: TooltipModel | null;
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
  accentColor: string;
}

const WIDTH = 240;
const HEIGHT = 170;

export function AtlasTooltip({ model, x, y, viewportWidth, viewportHeight, accentColor }: AtlasTooltipProps) {
  const [brokenPortrait, setBrokenPortrait] = useState<string | null>(null);
  if (!model) return null;
  const { left, top } = placeTooltip(x, y, WIDTH, HEIGHT, viewportWidth, viewportHeight);
  const showPortrait = model.portraitUrl && brokenPortrait !== model.portraitUrl;

  return (
    <div
      data-testid="atlas-tooltip"
      role="tooltip"
      className="pointer-events-none absolute z-40 w-60 border-2 bg-[#0b0a0d]/95 shadow-[0_0_0_2px_#000,0_8px_24px_rgba(0,0,0,0.7)] [image-rendering:pixelated]"
      style={{ left, top, borderColor: `${accentColor}aa` }}
    >
      <div
        className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b-2 border-black"
        style={{ background: `linear-gradient(180deg, ${accentColor}40, ${accentColor}10)` }}
      >
        <span className={`font-pixel text-[11px] leading-tight ${model.masked ? 'text-slate-400' : 'text-white'}`}>
          {model.title}
        </span>
        {model.isWaypoint && (
          <span className="font-pixel text-[8px] px-1 py-0.5 border border-cyan-400/60 text-cyan-300 bg-cyan-950/60">
            WAYPOINT
          </span>
        )}
      </div>

      <div className="flex gap-2 px-2.5 py-2">
        {showPortrait && (
          <img
            src={model.portraitUrl}
            alt=""
            width={44}
            height={44}
            className="w-11 h-11 border border-black bg-black/40 [image-rendering:pixelated]"
            onError={() => setBrokenPortrait(model.portraitUrl ?? null)}
          />
        )}
        <dl className="flex-1 space-y-1 font-mono text-[10px] text-slate-300">
          <div className="flex justify-between">
            <dt className="text-slate-500">TYPE</dt>
            <dd>{model.typeLabel}</dd>
          </div>
          {model.danger && (
            <div className="flex justify-between">
              <dt className="text-slate-500">DANGER</dt>
              <dd className="font-pixel text-[9px]" style={{ color: DANGER_COLORS[model.danger] }}>
                {model.danger}
              </dd>
            </div>
          )}
          {model.factionName && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">HELD BY</dt>
              <dd className="truncate text-right">{model.factionName}</dd>
            </div>
          )}
          {model.firstSeen !== undefined && (
            <div className="flex justify-between">
              <dt className="text-slate-500">FIRST SEEN</dt>
              <dd>CH {model.firstSeen}</dd>
            </div>
          )}
          {model.kind === 'location' && !model.masked && (
            <div className="flex justify-between">
              <dt className="text-slate-500">EVENTS</dt>
              <dd>{model.eventCount}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="px-2.5 py-1 border-t border-black/80 font-pixel text-[8px] tracking-wider" style={{ color: accentColor }}>
        {model.hint}
      </div>
    </div>
  );
}

export default AtlasTooltip;
