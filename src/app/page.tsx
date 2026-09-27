import Link from 'next/link';
import * as path from 'path';
import { LocalGitDataStore } from '../datastore/local-git-store';
import { getUniverseTheme } from '../domain/themes';
import { PixelGauge } from '../components/pixel/PixelGauge';
import { Sparkles, ArrowRight, Book, Flame, Shield, Map as MapIcon, Clock, Compass } from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  const store = new LocalGitDataStore(path.resolve(process.cwd(), 'data'));
  const seriesList = await store.listSeries();

  return (
    <div className="space-y-12 py-6 font-mono">
      {/* Retro RPG Hero Screen */}
      <div className="relative rounded-2xl border-2 border-slate-700 bg-[#070b16] p-8 sm:p-14 shadow-2xl text-center space-y-6 overflow-hidden">
        {/* Subtle Ambient Scanline Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-pixel text-xs">
            <Compass className="w-3.5 h-3.5 animate-spin" />
            <span>MODERN PIXEL FANTASY ATLAS</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-6xl font-pixel font-bold tracking-tight text-white">
              OMNILORE
            </h1>
            <div className="text-xs sm:text-sm font-pixel text-amber-400 tracking-widest uppercase">
              ─── EXPLORE THE UNKNOWN ───
            </div>
          </div>

          <p className="text-slate-300 text-sm sm:text-base font-sans max-w-xl mx-auto leading-relaxed">
            Every world has a story. Move the chapter scrubber to lift the fog of war. 
            Cultivation ladders, pixel maps, secret identities, and faction webs calibrate 
            strictly to what you're allowed to know.
          </p>

          <div className="pt-2 flex flex-wrap justify-center gap-3 text-[11px] font-pixel text-slate-400">
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">
              🏰 PIXEL MAPS
            </span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">
              ⚡ POWER LADDERS
            </span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">
              🛡️ RPG STATUS SCREENS
            </span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800">
              🔒 SPOILER SCRUBBER
            </span>
          </div>
        </div>
      </div>

      {/* Universe Portal Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-pixel text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Book className="w-4 h-4 text-amber-400" />
            <span>AVAILABLE FICTIONAL UNIVERSES</span>
          </h2>
          <span className="text-xs font-pixel text-slate-400">
            {seriesList.length} PORTALS INDEXED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList.map((series) => {
            const isReady = series.slug === 'coiling-dragon' || series.slug === 'demonic-emperor';
            const theme = getUniverseTheme(series.slug);

            return (
              <div
                key={series.slug}
                className="group relative rounded-xl border-2 border-slate-800 bg-[#0a0f1c] hover:border-amber-400/80 p-6 flex flex-col justify-between transition-all duration-200 shadow-xl"
              >
                <div className="space-y-4">
                  {/* Top Bar with Universe Rune */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none">{theme.runeSymbol}</span>
                      <span className={`text-[10px] font-pixel px-2 py-0.5 rounded border uppercase ${theme.badgeBg} ${theme.badgeText} ${theme.accentBorder}`}>
                        {series.type}
                      </span>
                    </div>

                    <span className={`text-[10px] font-pixel px-2 py-0.5 rounded border ${
                      series.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}>
                      {series.status.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-pixel text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {series.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-sans line-clamp-2">
                      {theme.tagline}
                    </p>
                  </div>

                  {/* Lore Index Gauge */}
                  <div className="pt-1">
                    <PixelGauge
                      label={`INDEXED CHAPTERS: ${series.knowledge_boundary.latest_processed_chapter} / ${series.total_chapters}`}
                      value={Math.round((series.knowledge_boundary.latest_processed_chapter / series.total_chapters) * 10)}
                      max={10}
                      colorClass="text-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  {isReady ? (
                    <Link
                      href={`/${series.slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-xs font-bold shadow-lg shadow-amber-500/20 transition-all group-hover:gap-3"
                    >
                      <span>ENTER REALM</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] text-slate-500 font-pixel">
                        ░░ QUEUED FOR INGESTION ░░
                      </span>
                      <Link
                        href={`/${series.slug}`}
                        className="text-[11px] text-slate-400 hover:text-white underline font-pixel"
                      >
                        PREVIEW
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
