'use client';

import React, { useEffect, useState } from 'react';
import type { CameraView } from '../../engine/map/pixi-world-renderer';

export interface AtlasMinimapProps {
  imageUrl: string | null;
  worldWidth: number;
  worldHeight: number;
  fogCircles: Array<{ x: number; y: number; r: number }>;
  hero: { x: number; y: number } | null;
  subscribe: (listener: (view: CameraView) => void) => () => void;
  onPan: (worldX: number, worldY: number) => void;
  accentColor: string;
  fogColor: string;
}

const WIDTH = 180;

export function AtlasMinimap({
  imageUrl,
  worldWidth,
  worldHeight,
  fogCircles,
  hero,
  subscribe,
  onPan,
  accentColor,
  fogColor,
}: AtlasMinimapProps) {
  const [view, setView] = useState<CameraView | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => subscribe(setView), [subscribe]);

  const height = Math.round((WIDTH * worldHeight) / worldWidth);
  const scale = WIDTH / worldWidth;
  const frustum = view
    ? {
        x: (view.x - view.viewWidth / 2 / view.zoom) * scale,
        y: (view.y - view.viewHeight / 2 / view.zoom) * scale,
        w: (view.viewWidth / view.zoom) * scale,
        h: (view.viewHeight / view.zoom) * scale,
      }
    : null;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onPan((e.clientX - rect.left) / scale, (e.clientY - rect.top) / scale);
  };

  return (
    <div
      data-testid="atlas-minimap"
      className="pointer-events-auto absolute bottom-28 right-4 z-20 border-2 bg-black shadow-[0_0_0_2px_#000]"
      style={{ borderColor: `${accentColor}88` }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="block w-full border-b border-black px-2 py-0.5 text-left font-pixel text-[8px] tracking-widest"
        style={{ color: accentColor }}
      >
        {collapsed ? '▸ RADAR' : '▾ RADAR'}
      </button>
      {!collapsed && (
        <div className="relative cursor-crosshair" style={{ width: WIDTH, height }} onClick={handleClick}>
          {imageUrl && (
            <img src={imageUrl} alt="" width={WIDTH} height={height} className="absolute inset-0 h-full w-full [image-rendering:pixelated]" />
          )}
          <svg className="absolute inset-0" width={WIDTH} height={height} viewBox={`0 0 ${worldWidth} ${worldHeight}`}>
            <defs>
              <mask id="minimap-fog-mask">
                <rect width={worldWidth} height={worldHeight} fill="white" />
                {fogCircles.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="black" />
                ))}
              </mask>
            </defs>
            <rect width={worldWidth} height={worldHeight} fill={fogColor} opacity="0.85" mask="url(#minimap-fog-mask)" />
            {hero && <rect x={hero.x - 12} y={hero.y - 12} width={24} height={24} fill="#ffb347" />}
          </svg>
          {frustum && (
            <div
              className="pointer-events-none absolute border"
              style={{ left: frustum.x, top: frustum.y, width: frustum.w, height: frustum.h, borderColor: accentColor }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default AtlasMinimap;
