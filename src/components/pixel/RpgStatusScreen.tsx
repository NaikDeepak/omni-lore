import React from 'react';
import { PixelAvatar } from './PixelAvatar';
import { PixelGauge } from './PixelGauge';
import { Shield, MapPin, Sparkles, EyeOff, Swords } from 'lucide-react';

interface RpgStatusScreenProps {
  characterId: string;
  name: string;
  displayName: string;
  isMasked: boolean;
  avatarUrl?: string;
  realmName: string;
  realmOrder: number;
  factionName?: string;
  locationName?: string;
  userChapter: number;
  themeAccent?: string;
  relationshipsCount?: number;
  onChallengeInDuel?: (characterId: string) => void;
}

export function RpgStatusScreen({
  characterId,
  name,
  displayName,
  isMasked,
  avatarUrl,
  realmName,
  realmOrder,
  factionName = 'Unaligned Wanderer',
  locationName = 'Unknown Region',
  userChapter,
  themeAccent = '#f59e0b',
  relationshipsCount = 0,
  onChallengeInDuel,
}: RpgStatusScreenProps) {
  // Compute normalized power level from realmOrder (1 to 10)
  const powerScore = Math.min(Math.max(realmOrder, 1), 10);
  const influenceScore = Math.min(Math.max(relationshipsCount * 2.5 + 2, 2), 10);

  return (
    <div className="font-mono rounded-xl border-2 border-slate-700 bg-[#0a0d18] p-5 shadow-2xl relative overflow-hidden max-w-md w-full">
      {/* Retro Header Bracket */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-pixel text-xs tracking-wider">STATUS PROFILE</span>
          {isMasked && (
            <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              <EyeOff className="w-3 h-3" /> MASKED
            </span>
          )}
        </div>
        <span className="text-[11px] font-pixel text-slate-400">CH {userChapter}</span>
      </div>

      {/* Main Avatar & Core Info Row */}
      <div className="flex items-start gap-4 mb-5">
        <div className="shrink-0">
          <PixelAvatar 
            id={characterId} 
            name={displayName} 
            size={72} 
            isMasked={isMasked} 
            avatarUrl={avatarUrl}
          />
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <h3 className="font-pixel text-sm sm:text-base font-bold text-white truncate tracking-tight">
            {displayName}
          </h3>
          {isMasked && (
            <p className="text-[10px] text-slate-500 italic">
              True identity concealed from reader
            </p>
          )}

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>{realmName}</span>
          </div>
        </div>
      </div>

      {/* Stats & Attributes Grid */}
      <div className="space-y-3.5 pt-3 border-t border-slate-800/80">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-pixel flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> FACTION
            </div>
            <div className="text-slate-200 font-semibold truncate mt-0.5">{factionName}</div>
          </div>

          <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-pixel flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" /> LOCATION
            </div>
            <div className="text-slate-200 font-semibold truncate mt-0.5">{locationName}</div>
          </div>
        </div>

        {/* Pixel Gauges */}
        <div className="space-y-2.5 pt-1">
          <PixelGauge label="⚔ POWER RATING" value={powerScore} max={10} colorClass="text-amber-400" />
          <PixelGauge label="✦ INFLUENCE & TIES" value={influenceScore} max={10} colorClass="text-indigo-400" />
        </div>

        {/* Challenge in Duel Button */}
        {onChallengeInDuel && (
          <button
            onClick={() => onChallengeInDuel(characterId)}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-pixel text-xs transition border border-rose-400 shadow-md flex items-center justify-center gap-2"
          >
            <Swords className="w-3.5 h-3.5" />
            <span>CHALLENGE IN DUEL ARENA</span>
          </button>
        )}
      </div>

      {/* Bottom CRT line */}
      <div className="mt-4 pt-2 border-t border-slate-900 text-right">
        <span className="text-[9px] text-slate-600 font-pixel">OMNILORE KNOWLEDGE ENGINE</span>
      </div>
    </div>
  );
}
