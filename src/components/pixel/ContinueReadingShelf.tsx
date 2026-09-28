'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProgressStore, UniverseReadingProgress } from '../../domain/user-progress';
import { UserProgressService } from '../../lib/user-progress';
import { getUniverseTheme } from '../../domain/themes';
import { 
  BookOpen, 
  Bookmark, 
  ArrowRight, 
  Plus, 
  Minus, 
  Clock, 
  Star, 
  Sparkles,
  Compass,
  Check
} from 'lucide-react';

interface ContinueReadingShelfProps {
  onOpenBookmarksModal?: () => void;
}

export function ContinueReadingShelf({ onOpenBookmarksModal }: ContinueReadingShelfProps) {
  const [store, setStore] = useState<UserProgressStore | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    // Initial load from client localStorage
    setStore(UserProgressService.getProgress());

    const handleUpdate = (e: any) => {
      setStore(e.detail ?? UserProgressService.getProgress());
    };

    window.addEventListener('omnilore-progress-updated', handleUpdate);
    return () => window.removeEventListener('omnilore-progress-updated', handleUpdate);
  }, []);

  if (!store) {
    // Avoid SSR hydration flash
    return null;
  }

  const activeUniverses = Object.values(store.universes).sort((a, b) => {
    return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
  });

  const handleNudgeChapter = (slug: string, delta: number) => {
    const item = store.universes[slug];
    if (!item) return;
    const newCh = Math.max(1, Math.min(item.totalChapters, item.currentChapter + delta));
    UserProgressService.saveChapter(slug, newCh, item.totalChapters, item.activeTab);
  };

  const renderMeter = (current: number, total: number) => {
    const percent = Math.min(100, Math.round((current / total) * 100));
    const totalSegments = 10;
    const filled = Math.min(totalSegments, Math.max(1, Math.round((percent / 100) * totalSegments)));
    const empty = totalSegments - filled;
    return {
      bar: '█'.repeat(filled) + '░'.repeat(empty),
      percent
    };
  };

  return (
    <div className="rounded-xl border-2 border-slate-800 bg-[#070b16] p-5 shadow-2xl space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-pixel text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>CONTINUE YOUR SAGA</span>
              <span className="text-[10px] text-amber-400 font-mono font-normal">
                ({activeUniverses.length} ACTIVE EXPEDITIONS)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Auto-saved chapter bookmarks across your personal lore expeditions
            </p>
          </div>
        </div>

        {onOpenBookmarksModal && (
          <button
            onClick={onOpenBookmarksModal}
            className="px-2.5 py-1 text-xs font-pixel rounded bg-slate-900 border border-slate-700 hover:border-amber-400/60 text-slate-300 hover:text-amber-300 transition flex items-center gap-1.5"
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>ALL BOOKMARKS ({store.pinnedCharacters.length + store.savedDuels.length})</span>
          </button>
        )}
      </div>

      {/* Universe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeUniverses.map((univ) => {
          const theme = getUniverseTheme(univ.slug);
          const { bar, percent } = renderMeter(univ.currentChapter, univ.totalChapters);
          const pinnedForThis = store.pinnedCharacters.filter(p => p.universeSlug === univ.slug);

          return (
            <div
              key={univ.slug}
              className="rounded-lg border border-slate-800 bg-[#0a0f1e] p-4 flex flex-col justify-between hover:border-slate-700 transition space-y-3 group"
            >
              <div className="space-y-2">
                {/* Title & Rune */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{theme.runeSymbol}</span>
                    <span className="font-pixel text-xs font-bold text-white group-hover:text-amber-300 transition">
                      {univ.slug.split('-').map(w => w.toUpperCase()).join(' ')}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {percent}% EXPLORED
                  </span>
                </div>

                {/* Chapter Counter with Nudge Buttons */}
                <div className="flex items-center justify-between bg-[#040814] p-2 rounded border border-slate-800/80">
                  <div className="font-mono text-xs text-amber-400 font-bold">
                    CH. {univ.currentChapter} <span className="text-[10px] text-slate-500 font-normal">/ {univ.totalChapters}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleNudgeChapter(univ.slug, -1)}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-mono transition"
                      title="Step back 1 chapter"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => handleNudgeChapter(univ.slug, 1)}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-mono transition"
                      title="Advance 1 chapter"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                    <button
                      onClick={() => handleNudgeChapter(univ.slug, 10)}
                      className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-mono transition"
                      title="Advance 10 chapters"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Retro ASCII Meter */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-slate-400 tracking-wider">
                    {bar}
                  </div>
                </div>

                {/* Pinned Figures Preview */}
                {pinnedForThis.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[9px] font-mono text-slate-500">PINNED:</span>
                    {pinnedForThis.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      >
                        ★ {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  href={`/${univ.slug}?ch=${univ.currentChapter}&tab=${univ.activeTab ?? 'journey'}`}
                  className="w-full py-1.5 px-3 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-pixel flex items-center justify-center gap-2 transition"
                >
                  <span>RESUME SAGA</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
