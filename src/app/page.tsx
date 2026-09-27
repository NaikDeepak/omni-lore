import Link from 'next/link';
import * as path from 'path';
import { LocalGitDataStore } from '../datastore/local-git-store';
import { Sparkles, ArrowRight, Book, Flame, Shield, Map, Clock } from 'lucide-react';

export const revalidate = 0; // Dynamic server component

export default async function HomePage() {
  const store = new LocalGitDataStore(path.resolve(process.cwd(), 'data'));
  const seriesList = await store.listSeries();

  return (
    <div className="space-y-10 py-4">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden border border-cosmic-700 bg-gradient-to-br from-cosmic-800 via-cosmic-900 to-cosmic-800 p-8 sm:p-12 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Temporal Knowledge Graph Platform</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Explore Fictional Worlds Without Spoilers.
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Move the chapter scrubber to your current reading spot. Cultivation ladders, 
            secret identities, faction webs, and world maps instantly calibrate to what you're allowed to know.
          </p>
        </div>
      </div>

      {/* Series Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Book className="w-5 h-5 text-amber-400" />
            <span>Featured Fictional Universes</span>
          </h2>
          <span className="text-xs text-slate-400">
            {seriesList.length} Series Indexed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList.map((series) => {
            const isReady = series.slug === 'coiling-dragon';

            return (
              <div
                key={series.slug}
                className="group relative rounded-xl border border-cosmic-700 bg-cosmic-800/60 hover:bg-cosmic-800 p-6 flex flex-col justify-between transition-all duration-200 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cosmic-700 text-amber-300 border border-cosmic-600">
                      {series.type}
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      series.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {series.status === 'completed' ? 'Completed' : 'Ongoing'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    {series.title}
                  </h3>

                  <p className="text-sm text-slate-400">
                    {series.total_chapters} Total Chapters • Knowledge indexed through chapter {series.knowledge_boundary.latest_processed_chapter}
                  </p>

                  {/* Feature preview tags */}
                  <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1 bg-cosmic-900/60 px-2 py-1 rounded">
                      <Flame className="w-3 h-3 text-orange-400" /> Power Ladder
                    </span>
                    <span className="inline-flex items-center gap-1 bg-cosmic-900/60 px-2 py-1 rounded">
                      <Shield className="w-3 h-3 text-emerald-400" /> Factions
                    </span>
                    <span className="inline-flex items-center gap-1 bg-cosmic-900/60 px-2 py-1 rounded">
                      <Map className="w-3 h-3 text-cyan-400" /> Multi-Planes
                    </span>
                    <span className="inline-flex items-center gap-1 bg-cosmic-900/60 px-2 py-1 rounded">
                      <Clock className="w-3 h-3 text-purple-400" /> Timeline Scrubber
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-cosmic-700/60 flex items-center justify-between">
                  {isReady ? (
                    <Link
                      href={`/${series.slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-cosmic-900 font-bold text-sm shadow-md shadow-amber-500/20 transition-all hover:gap-3"
                    >
                      <span>Launch World Explorer</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-slate-400 italic">
                        Registry seeded • Ready for extraction
                      </span>
                      <Link
                        href={`/${series.slug}`}
                        className="text-xs text-slate-400 hover:text-slate-200 underline"
                      >
                        Inspect Preview
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
