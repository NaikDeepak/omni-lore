'use client';

import React, { useState, useMemo } from 'react';
import { CanonicalLoreGraph, CharacterEntity } from '../../domain/types';
import { CharacterJourneyProjection } from '../../projections/character-journey';
import { PixelAvatar } from './PixelAvatar';
import { PixelGauge } from './PixelGauge';
import {
  Sparkles,
  Shield,
  MapPin,
  Swords,
  EyeOff,
  Users,
  Compass,
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface CharacterExplorerProps {
  journey: CharacterJourneyProjection | null;
  graph: CanonicalLoreGraph;
  userChapter: number;
  onSelectCharacter: (charId: string) => void;
  onNavigateToTab: (tab: 'ladder' | 'web' | 'map' | 'timeline' | 'journey' | 'duel', locationId?: string) => void;
  onChallengeInDuel: (charId: string) => void;
}

export function CharacterExplorer({
  journey,
  graph,
  userChapter,
  onSelectCharacter,
  onNavigateToTab,
  onChallengeInDuel,
}: CharacterExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [relFilter, setRelFilter] = useState<'all' | 'ally' | 'master' | 'rival' | 'enemy' | 'family'>('all');

  // All characters sorted
  const characterList = useMemo(() => {
    return Object.values(graph.entities)
      .filter((e): e is CharacterEntity => e.type === 'character')
      .sort((a, b) => a.first_appearance - b.first_appearance);
  }, [graph]);

  // Featured protagonist shortcuts
  const featuredIds = useMemo(() => {
    const slug = graph.series.slug;
    if (slug === 'coiling-dragon') return ['linley-baruch', 'bebe', 'doehring-cowart', 'beirut', 'augusta', 'hongmeng'];
    if (slug === 'demonic-emperor') return ['zhuo-fan', 'chu-qingcheng', 'huangpu-qingtian', 'leng-wuchang', 'gu-santong'];
    if (slug === 'one-piece') return ['luffy', 'zoro', 'sanji', 'shanks', 'whitebeard', 'imu', 'gorosei-saturn'];
    if (slug === 'solo-leveling') return ['sung-jin-woo', 'cha-hae-in', 'igris', 'beru', 'thomas-andre', 'antares'];
    if (slug === 'lord-of-the-mysteries') return ['klein-moretti', 'audrey-hall', 'alger-wilson', 'amon', 'adam'];
    return characterList.slice(0, 6).map(c => c.id);
  }, [graph.series.slug, characterList]);

  // Filtered character list for dropdown/search
  const filteredChars = useMemo(() => {
    if (!searchQuery.trim()) return characterList;
    const q = searchQuery.toLowerCase();
    return characterList.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.aliases.some(a => a.toLowerCase().includes(q))
    );
  }, [characterList, searchQuery]);

  if (!journey) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl font-mono text-slate-500">
        No character selected. Choose a hero or villain from the roster above.
      </div>
    );
  }

  // Filter relationships
  const filteredRelationships = journey.relationships.filter(r => {
    if (relFilter === 'all') return true;
    return r.category === relFilter;
  });

  return (
    <div className="space-y-6 font-mono">
      {/* 1. Character Selector & Search Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#070b14] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs text-amber-400">CHOOSE CHARACTER:</span>
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search character name or alias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={journey.characterId}
              onChange={(e) => onSelectCharacter(e.target.value)}
              className="w-full sm:w-auto bg-slate-900 text-white font-pixel text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400 truncate"
            >
              <optgroup label={`Available at Ch. ${userChapter}`}>
                {filteredChars
                  .filter((c) => c.first_appearance <= userChapter)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </optgroup>
              {filteredChars.some((c) => c.first_appearance > userChapter) && (
                <optgroup label="Upcoming / Later in Story">
                  {filteredChars
                    .filter((c) => c.first_appearance > userChapter)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        🔒 {c.name} (Ch. {c.first_appearance}+)
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Quick Protagonist Jump Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <span className="text-[10px] font-pixel text-slate-500">QUICK SELECT:</span>
          {featuredIds.map((fid) => {
            const fChar = graph.entities[fid] as CharacterEntity | undefined;
            if (!fChar) return null;
            const isSelected = journey.characterId === fid;
            const isDiscovered = fChar.first_appearance <= userChapter;

            return (
              <button
                key={fid}
                type="button"
                onClick={() => onSelectCharacter(fid)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-pixel transition border ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                    : isDiscovered
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                      : 'bg-slate-950/60 border-slate-900 text-slate-600'
                }`}
              >
                <PixelAvatar id={fid} name={fChar.name} size={16} avatarUrl={fChar.avatar_url} />
                <span>{fChar.name.split(' ')[0]}</span>
                {!isDiscovered && <span className="text-[9px] text-amber-500/70">🔒</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Character Layout: Left Dossier Card + Right Multi-Tracks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: RPG Character Screen (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border-2 border-slate-700 bg-[#080d1a] p-5 shadow-2xl relative overflow-hidden">
            {/* Header with Name & Masking Banner */}
            <div className="border-b border-slate-800 pb-3 mb-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-pixel text-amber-400 tracking-wider">
                  DOSSIER ARCHIVE
                </span>
                <span className="text-[10px] font-pixel px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  CH {userChapter}
                </span>
              </div>

              <h2 className="text-xl font-pixel font-bold text-white tracking-tight">
                {journey.displayName}
              </h2>

              {journey.isMasked && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] font-pixel">
                  <EyeOff className="w-3 h-3" />
                  <span>CONCEALED IDENTITY</span>
                </div>
              )}

              {journey.character.aliases.length > 0 && !journey.isMasked && (
                <p className="text-xs text-slate-400 italic">
                  "{journey.character.aliases[0]}"
                </p>
              )}
            </div>

            {/* Pixel Character Portrait */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 relative mb-4">
              <div className="relative p-2 rounded-2xl border-2 border-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-[#050811]">
                <PixelAvatar
                  id={journey.characterId}
                  name={journey.displayName}
                  size={96}
                  isMasked={journey.isMasked}
                  avatarUrl={journey.character.avatar_url}
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-pixel">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {journey.status}
                </span>
                <span className="text-[10px] font-pixel text-slate-500">
                  DEBUT: CH {journey.character.first_appearance}
                </span>
              </div>
            </div>

            {/* Core Vitals Grid */}
            <div className="space-y-3 pt-1">
              {/* Realm / Power Stage */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-pixel text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>CURRENT REALM</span>
                  </div>
                  <div className="text-sm font-pixel font-bold text-amber-300">
                    {journey.currentStage?.name ?? 'Mortal / Unranked'}
                  </div>
                </div>
                {journey.currentStage && (
                  <span className="font-pixel text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    T{journey.currentStage.order}
                  </span>
                )}
              </div>

              {/* Faction */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-pixel text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>FACTION ALLEGIANCE</span>
                  </div>
                  <div className="text-xs font-pixel text-slate-200 truncate max-w-[200px]">
                    {journey.currentFaction?.name ?? 'Unaligned Wanderer'}
                  </div>
                </div>
                {journey.currentFaction?.emblemUrl && (
                  <img
                    src={journey.currentFaction.emblemUrl}
                    alt="Emblem"
                    className="w-6 h-6 object-contain rounded"
                  />
                )}
              </div>

              {/* Current Location */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-pixel text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>CURRENT PRESENCE</span>
                  </div>
                  <div className="text-xs font-pixel text-slate-200 truncate max-w-[190px]">
                    {journey.currentLocation?.name ?? 'Unknown Plane / Wandering'}
                  </div>
                  {journey.currentLocation?.planeName && (
                    <div className="text-[10px] text-slate-400">
                      {journey.currentLocation.planeName}
                    </div>
                  )}
                </div>

                {journey.currentLocation && (
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('map', journey.currentLocation?.id)}
                    className="p-1.5 rounded hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition"
                    title="View on World Map"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Duel Arena Action */}
              <button
                type="button"
                onClick={() => onChallengeInDuel(journey.characterId)}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-pixel text-xs font-bold transition border border-rose-400 shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 mt-2"
              >
                <Swords className="w-4 h-4" />
                <span>CHALLENGE IN DUEL ARENA</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The 4 Journey Tracks (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* TRACK 1: POWER JOURNEY STEPPED RAIL */}
          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-pixel text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>POWER JOURNEY PROGRESSION (UP TO CH {userChapter})</span>
              </h3>
              <span className="text-[10px] font-pixel text-slate-500">
                {journey.powerJourney.filter(p => p.isAchieved).length} / {journey.powerJourney.length} TIERS UNLOCKED
              </span>
            </div>

            {/* Visual Stepped Horizontal Rail */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {journey.powerJourney.map((step) => {
                  return (
                    <div
                      key={step.id}
                      className={`relative rounded-xl p-3 border transition-all ${
                        step.isCurrent
                          ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                          : step.isAchieved
                            ? 'bg-slate-900/90 border-emerald-500/40 text-slate-200'
                            : 'bg-slate-950/60 border-slate-800/80 opacity-50'
                      }`}
                    >
                      {step.isCurrent && (
                        <div className="absolute -top-2.5 left-2 px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-pixel text-[8px] font-bold shadow animate-pulse">
                          ▲ CURRENT
                        </div>
                      )}

                      <div className="text-[10px] font-pixel text-slate-400 flex items-center justify-between mb-1">
                        <span>T{step.order}</span>
                        {step.isAchieved ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Lock className="w-3 h-3 text-slate-600" />
                        )}
                      </div>

                      <div className="font-pixel text-xs font-bold truncate text-white">
                        {step.name}
                      </div>

                      <div className="text-[10px] font-mono mt-1">
                        {step.isAchieved ? (
                          <span className="text-amber-400">Ch. {step.achievedAt}</span>
                        ) : (
                          <span className="text-slate-600 italic">Locked</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 font-sans italic">
                * As you move the chapter scrubber, completed breakthroughs light up while future realms remain shrouded.
              </p>
            </div>
          </div>

          {/* TRACK 2: RELATIONSHIPS & SOCIAL TIES */}
          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-pixel text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>KNOWN RELATIONSHIPS AT CH {userChapter} ({journey.relationships.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any ally, rival, master, or enemy to inspect their dossier.
                </p>
              </div>

              {/* Relationship Filter Tabs */}
              <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['all', 'master', 'ally', 'rival', 'enemy', 'family'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setRelFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[10px] font-pixel uppercase transition ${
                      relFilter === cat
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredRelationships.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredRelationships.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onSelectCharacter(rel.otherId)}
                    className="cursor-pointer group flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-amber-400/80 hover:bg-slate-900 transition-all shadow-sm"
                  >
                    <PixelAvatar
                      id={rel.otherId}
                      name={rel.otherName}
                      size={40}
                      avatarUrl={rel.otherAvatarUrl}
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="font-pixel text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {rel.otherName}
                      </div>

                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-pixel border uppercase ${
                        rel.category === 'master' || rel.category === 'disciple'
                          ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                          : rel.category === 'enemy' || rel.category === 'rival'
                            ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                            : rel.category === 'family'
                              ? 'bg-blue-950/60 border-blue-500/50 text-blue-300'
                              : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      }`}>
                        {rel.label}
                      </span>

                      <div className="text-[9px] text-slate-500 font-mono">
                        Valid: Ch {rel.validFrom}{rel.validTo ? `–${rel.validTo}` : '+'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs font-pixel text-slate-600">
                ░░ NO RELATIONSHIPS MATCHING THIS FILTER BY CH {userChapter} ░░
              </div>
            )}
          </div>

          {/* TRACK 3: GEOGRAPHIC TRAIL & LOCATIONS VISITED */}
          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-pixel text-xs sm:text-sm font-bold text-cyan-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>GEOGRAPHIC FOOTPRINT ({journey.locationsVisited.length} LANDMARKS)</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateToTab('map')}
                className="text-xs font-pixel text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
              >
                <span>OPEN FULL WORLD MAP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {journey.locationsVisited.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {journey.locationsVisited.map((visit, idx) => (
                  <div
                    key={`${visit.locationId}-${idx}`}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-pixel text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/60">
                        CH {visit.chapter}
                      </span>
                      {visit.planeName && (
                        <span className="text-[9px] font-pixel text-slate-500 uppercase truncate max-w-[120px]">
                          {visit.planeName}
                        </span>
                      )}
                    </div>

                    <div className="font-pixel text-xs text-white font-bold truncate">
                      {visit.locationName}
                    </div>

                    {visit.eventTitle && (
                      <p className="text-[11px] text-slate-400 font-sans line-clamp-1">
                        {visit.eventTitle}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl text-xs font-pixel text-slate-600">
                ░░ NO RECORDED LANDMARK TRAVELS PRIOR TO CH {userChapter} ░░
              </div>
            )}
          </div>

          {/* TRACK 4: KEY STORY EVENTS & BREAKTHROUGHS */}
          <div className="rounded-2xl border border-slate-800 bg-[#070b14] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-pixel text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>CHRONOLOGICAL MILESTONES (UP TO CH {userChapter})</span>
              </h3>
              <span className="text-[10px] font-pixel text-slate-500">
                {journey.milestones.length} EVENTS RECORDED
              </span>
            </div>

            {journey.milestones.length > 0 ? (
              <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {journey.milestones.map((m, idx) => (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div className={`absolute -left-6 top-2 w-2.5 h-2.5 rounded-full border border-slate-950 ${
                      m.type === 'power_breakthrough'
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                        : m.type === 'relationship_formed'
                          ? 'bg-indigo-400'
                          : 'bg-emerald-400'
                    }`} />
                    <div className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-pixel text-xs text-white">{m.title}</span>
                        <span className="text-[10px] font-pixel text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          CH {m.chapter}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs font-pixel text-slate-600 p-6 rounded-xl border border-slate-800 text-center">
                ░░ NO MILESTONES RECORDED PRIOR TO CH {userChapter} ░░
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
