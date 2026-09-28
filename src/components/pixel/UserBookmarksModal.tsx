'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserProgressStore, PinnedCharacter, SavedDuelMatch } from '../../domain/user-progress';
import { UserProgressService } from '../../lib/user-progress';
import { getUniverseTheme } from '../../domain/themes';
import {
  Bookmark,
  Star,
  Swords,
  Trash2,
  Download,
  Upload,
  Check,
  X,
  ArrowRight,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface UserBookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserBookmarksModal({ isOpen, onClose }: UserBookmarksModalProps) {
  const [store, setStore] = useState<UserProgressStore>(UserProgressService.getProgress());
  const [activeTab, setActiveTab] = useState<'universes' | 'characters' | 'duels' | 'data'>('universes');
  const [copiedJson, setCopiedJson] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStore(UserProgressService.getProgress());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnpinCharacter = (slug: string, charId: string, name: string) => {
    UserProgressService.togglePinCharacter(slug, charId, name);
    setStore(UserProgressService.getProgress());
  };

  const handleRemoveDuel = (id: string) => {
    UserProgressService.removeDuel(id);
    setStore(UserProgressService.getProgress());
  };

  const handleExport = async () => {
    const json = UserProgressService.exportJson();
    try {
      await navigator.clipboard.writeText(json);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = UserProgressService.importJson(importText);
    if (ok) {
      setStore(UserProgressService.getProgress());
      setImportStatus('Progress imported successfully!');
      setImportText('');
      setTimeout(() => setImportStatus(null), 3000);
    } else {
      setImportStatus('Invalid JSON format. Please check backup data.');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Reset all reading progress, pinned characters, and saved duel matchups?')) {
      UserProgressService.clearAll();
      setStore(UserProgressService.getProgress());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border-2 border-slate-700 bg-[#070b16] p-6 shadow-2xl text-slate-200 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-pixel text-base font-bold text-white flex items-center gap-2">
                <span>OMNILORE SAGA LOG</span>
                <span className="text-[10px] text-amber-400 font-mono">LOCAL ARCHIVE</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Your point-in-time universe bookmarks, favorite figures, and combat records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-pixel">
          <button
            onClick={() => setActiveTab('universes')}
            className={`px-3 py-1.5 rounded transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'universes'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>EXPEDITIONS ({Object.keys(store.universes).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-3 py-1.5 rounded transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'characters'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>PINNED FIGURES ({store.pinnedCharacters.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('duels')}
            className={`px-3 py-1.5 rounded transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'duels'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span>SAVED DUELS ({store.savedDuels.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3 py-1.5 rounded transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span>BACKUP / DATA</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono text-xs">
          {/* 1. Universes Tab */}
          {activeTab === 'universes' && (
            <div className="space-y-3">
              {Object.values(store.universes).map((u) => {
                const theme = getUniverseTheme(u.slug);
                const percent = Math.round((u.currentChapter / u.totalChapters) * 100);
                return (
                  <div
                    key={u.slug}
                    className="p-3.5 rounded-lg border border-slate-800 bg-[#0c1220] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{theme.runeSymbol}</span>
                      <div>
                        <div className="font-pixel text-xs font-bold text-white uppercase">
                          {u.slug.replace('-', ' ')}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Chapter <span className="text-amber-400 font-bold">{u.currentChapter}</span> of {u.totalChapters} ({percent}%)
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/${u.slug}?ch=${u.currentChapter}&tab=${u.activeTab ?? 'journey'}`}
                      onClick={onClose}
                      className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 flex items-center gap-1.5 transition font-pixel text-[11px]"
                    >
                      <span>RESUME</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Pinned Characters Tab */}
          {activeTab === 'characters' && (
            <div className="space-y-2">
              {store.pinnedCharacters.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono">
                  No pinned figures yet. Click the ★ Pin button on any character dossier to save them here.
                </div>
              ) : (
                store.pinnedCharacters.map((char) => {
                  const theme = getUniverseTheme(char.universeSlug);
                  const univProgress = store.universes[char.universeSlug];
                  const ch = univProgress?.currentChapter ?? 100;
                  return (
                    <div
                      key={`${char.universeSlug}-${char.id}`}
                      className="p-3 rounded-lg border border-slate-800 bg-[#0c1220] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{theme.runeSymbol}</span>
                        <div>
                          <div className="font-pixel text-xs text-white flex items-center gap-2">
                            <span>{char.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-slate-400 uppercase font-mono">
                              {char.universeSlug.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            Pinned on {new Date(char.pinnedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${char.universeSlug}?ch=${ch}&tab=journey&char=${char.id}`}
                          onClick={onClose}
                          className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 text-[10px] font-pixel flex items-center gap-1 transition"
                        >
                          <span>DOSSIER</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => handleUnpinCharacter(char.universeSlug, char.id, char.name)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          title="Unpin character"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 3. Saved Duels Tab */}
          {activeTab === 'duels' && (
            <div className="space-y-2">
              {store.savedDuels.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono">
                  No bookmarked duel clashes yet. Save any 1v1 showdown in the Duel Arena to re-run simulations here.
                </div>
              ) : (
                store.savedDuels.map((duel) => {
                  const theme = getUniverseTheme(duel.universeSlug);
                  return (
                    <div
                      key={duel.id}
                      className="p-3 rounded-lg border border-slate-800 bg-[#0c1220] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{theme.runeSymbol}</span>
                        <div>
                          <div className="font-pixel text-xs text-white">
                            {duel.fighterAName} <span className="text-rose-400">VS</span> {duel.fighterBName}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Ch. {duel.chapter} Parity {duel.verdict && `• ${duel.verdict}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${duel.universeSlug}?ch=${duel.chapter}&tab=duel`}
                          onClick={onClose}
                          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-pixel flex items-center gap-1 transition"
                        >
                          <span>RE-RUN</span>
                          <Swords className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => handleRemoveDuel(duel.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          title="Remove saved duel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 4. Data / Backup Tab */}
          {activeTab === 'data' && (
            <div className="space-y-4 pt-1">
              <div className="p-3 rounded-lg border border-slate-800 bg-[#090e1c] space-y-2">
                <div className="font-pixel text-xs text-white">EXPORT LOCAL PROGRESS</div>
                <p className="text-[11px] text-slate-400">
                  Copy your full reading log, bookmarks, and battle history to your clipboard as JSON.
                </p>
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 text-xs font-pixel flex items-center gap-1.5 transition"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{copiedJson ? 'COPIED TO CLIPBOARD!' : 'COPY JSON BACKUP'}</span>
                </button>
              </div>

              <div className="p-3 rounded-lg border border-slate-800 bg-[#090e1c] space-y-2">
                <div className="font-pixel text-xs text-white">IMPORT PROGRESS BACKUP</div>
                <p className="text-[11px] text-slate-400">
                  Paste previously exported JSON to restore your reading progress.
                </p>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste JSON here..."
                  className="w-full h-20 p-2 rounded bg-[#030611] border border-slate-800 text-slate-200 text-xs font-mono outline-none focus:border-amber-400/60"
                />
                {importStatus && (
                  <div className={`text-[11px] ${importStatus.includes('success') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {importStatus}
                  </div>
                )}
                <button
                  onClick={handleImport}
                  className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-pixel flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>RESTORE PROGRESS</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center">
                <span className="text-[11px] text-slate-500">Need to start fresh?</span>
                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/40 text-[10px] font-pixel flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET ALL DATA</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
