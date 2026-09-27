'use client';

import React from 'react';
import { PowerLadderTier } from '@/projections/power-ladder';
import { PixelAvatar } from './PixelAvatar';
import { X, Flame, ShieldAlert, Sparkles, ScrollText, Users, ArrowRight } from 'lucide-react';

interface RealmLoreModalProps {
  tier: PowerLadderTier;
  userChapter: number;
  onClose: () => void;
  onSelectCharacter?: (characterId: string) => void;
}

export function RealmLoreModal({
  tier,
  userChapter,
  onClose,
  onSelectCharacter,
}: RealmLoreModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-mono">
      <div className="relative w-full max-w-xl rounded-2xl border-2 border-amber-500/80 bg-[#0a0f1d] shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 font-pixel font-bold text-sm shadow-lg shadow-amber-500/20">
              T{tier.order}
            </div>
            <div>
              <span className="text-[10px] font-pixel text-amber-400 uppercase tracking-widest">
                CANONICAL REALM CODEX
              </span>
              <h2 className="text-lg font-pixel font-bold text-white mt-0.5">
                {tier.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close Codex"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Synopsis */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
          {tier.description}
        </p>

        {/* Codex Lore Sections */}
        <div className="space-y-3">
          {/* Breakthrough Criteria */}
          {tier.breakthrough_criteria && (
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-pixel text-xs">
                <ScrollText className="w-4 h-4" />
                <span>BREAKTHROUGH CRITERIA & ADVANCEMENT</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {tier.breakthrough_criteria}
              </p>
            </div>
          )}

          {/* Canonical Phenomena */}
          {tier.canonical_phenomena && (
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 font-pixel text-xs">
                <Sparkles className="w-4 h-4" />
                <span>CANONICAL PHENOMENA & MANIFESTATION</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {tier.canonical_phenomena}
              </p>
            </div>
          )}

          {/* Tribulation / Mortality Risk */}
          {tier.mortality_risk && (
            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1">
              <div className="flex items-center gap-2 text-rose-400 font-pixel text-xs">
                <ShieldAlert className="w-4 h-4" />
                <span>TRIBULATION & MORTALITY RISK</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {tier.mortality_risk}
              </p>
            </div>
          )}
        </div>

        {/* Active Occupants at User Chapter */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-pixel text-[11px] text-amber-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> CURRENT OCCUPANTS ({tier.characters.length})
            </span>
            <span className="text-[10px] text-slate-500">AT CH {userChapter}</span>
          </div>

          {tier.characters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {tier.characters.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    if (onSelectCharacter) onSelectCharacter(c.id);
                    onClose();
                  }}
                  className="cursor-pointer flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-400 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PixelAvatar id={c.id} name={c.displayName} size={28} avatarUrl={c.avatar_url} />
                    <div className="min-w-0">
                      <div className="font-pixel text-xs text-white truncate">{c.displayName}</div>
                      <div className="text-[10px] text-amber-400/80 font-mono">
                        Ch. {c.achieved_at_chapter}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-xs text-slate-500 font-pixel bg-slate-950 rounded-xl border border-slate-850">
              ░░ NO CHARACTERS AT THIS REALM AS OF CH {userChapter} ░░
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
