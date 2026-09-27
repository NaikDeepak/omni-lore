import React, { useState } from 'react';

interface PixelAvatarProps {
  id: string;
  name: string;
  size?: number;
  isMasked?: boolean;
  avatarUrl?: string;
}

export function PixelAvatar({ 
  id, 
  name, 
  size = 64, 
  isMasked = false,
  avatarUrl
}: PixelAvatarProps) {
  const [imgError, setImgError] = useState(false);

  // Signature pixel color schemes per character
  let primaryColor = '#f59e0b'; // Amber default
  let secondaryColor = '#4338ca'; // Indigo
  let accentColor = '#e0e7ff';

  if (isMasked) {
    primaryColor = '#64748b'; // Slate mask
    secondaryColor = '#1e293b';
    accentColor = '#f59e0b';
  } else if (id.includes('zhuo')) {
    primaryColor = '#dc2626'; // Demonic Blood Red
    secondaryColor = '#0f172a'; // Obsidian
    accentColor = '#f87171';
  } else if (id.includes('linley')) {
    primaryColor = '#059669'; // Dragonblood Emerald
    secondaryColor = '#1e3a8a'; // Law Azure
    accentColor = '#fbbf24'; // Dragon Horn Gold
  } else if (id.includes('bebe')) {
    primaryColor = '#1e293b'; // Shadow Rat Black
    secondaryColor = '#3b82f6';
    accentColor = '#facc15'; // Crown Gold
  } else if (id.includes('doehring')) {
    primaryColor = '#06b6d4'; // Spirit Magus Cyan
    secondaryColor = '#e2e8f0'; // White Beard
    accentColor = '#38bdf8';
  } else if (id.includes('qingcheng')) {
    primaryColor = '#ec4899'; // Floral Pink
    secondaryColor = '#8b5cf6'; // Drifting Flowers Violet
    accentColor = '#fbcfe8';
  }

  const hasCustomAvatar = Boolean(avatarUrl && !isMasked && !imgError);

  return (
    <div 
      className="relative flex items-center justify-center rounded-lg bg-black border-2 border-slate-700/80 shadow-md select-none overflow-hidden"
      style={{ width: size, height: size }}
    >
      {hasCustomAvatar ? (
        <img 
          src={avatarUrl} 
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
          style={{ 
            imageRendering: 'pixelated',
            shapeRendering: 'crispEdges'
          } as React.CSSProperties}
        />
      ) : (
        /* 8x8 Pixel Grid Character Sprite Fallback */
        <svg 
          viewBox="0 0 8 8" 
          className="w-full h-full"
          style={{ shapeRendering: 'crispEdges' }}
        >
          {/* Hair / Headgear */}
          <rect x="2" y="1" width="4" height="2" fill={secondaryColor} />
          <rect x="1" y="2" width="1" height="2" fill={secondaryColor} />
          <rect x="6" y="2" width="1" height="2" fill={secondaryColor} />
          
          {/* Face */}
          <rect x="2" y="2" width="4" height="3" fill="#fed7aa" />
          
          {/* Eyes (or Mask) */}
          {isMasked ? (
            <rect x="2" y="3" width="4" height="1" fill="#334155" />
          ) : (
            <>
              <rect x="2" y="3" width="1" height="1" fill={primaryColor} />
              <rect x="5" y="3" width="1" height="1" fill={primaryColor} />
            </>
          )}

          {/* Accents: Dragon Horns / Demonic Crown / Hat */}
          <rect x="2" y="0" width="1" height="1" fill={accentColor} />
          <rect x="5" y="0" width="1" height="1" fill={accentColor} />

          {/* Body / Cloak */}
          <rect x="1" y="5" width="6" height="3" fill={primaryColor} />
          <rect x="3" y="5" width="2" height="3" fill={secondaryColor} />
        </svg>
      )}

      {/* Tiny corner bracket pixel overlay */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-amber-400/80 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-amber-400/80 pointer-events-none" />
    </div>
  );
}
