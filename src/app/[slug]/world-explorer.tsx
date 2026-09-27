'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CanonicalLoreGraph } from '../../domain/types';
import { getUniverseTheme } from '../../domain/themes';
import { 
  projectPowerLadder, 
  projectRelationshipWeb, 
  projectTimeline, 
  projectWorldMap, 
  projectCharacterJourney 
} from '../../projections';
import { PixelAvatar } from '../../components/pixel/PixelAvatar';
import { PixelGauge } from '../../components/pixel/PixelGauge';
import { RpgStatusScreen } from '../../components/pixel/RpgStatusScreen';
import { PixelMapCanvas } from '../../components/pixel/PixelMapCanvas';
import { 
  Flame, 
  Share2, 
  Map as MapIcon, 
  Clock, 
  User, 
  Lock, 
  ArrowLeft, 
  Info,
  EyeOff,
  Sparkles,
  Compass
} from 'lucide-react';

interface WorldExplorerProps {
  graph: CanonicalLoreGraph;
}

export function WorldExplorer({ graph }: WorldExplorerProps) {
  const totalChapters = graph.series.total_chapters;
  const theme = getUniverseTheme(graph.series.slug);

  // Scrubber state
  const [userChapter, setUserChapter] = useState<number>(150);
  const [activeTab, setActiveTab] = useState<'ladder' | 'web' | 'map' | 'timeline' | 'journey'>('map');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    graph.series.slug === 'demonic-emperor'
      ? 'zhuo-fan'
      : graph.series.slug === 'one-piece'
        ? 'luffy'
        : 'linley-baruch'
  );

  // Computed projections strictly driven by userChapter
  const powerLadder = useMemo(() => projectPowerLadder(graph, userChapter), [graph, userChapter]);
  const relationshipWeb = useMemo(() => projectRelationshipWeb(graph, userChapter), [graph, userChapter]);
  const timeline = useMemo(() => projectTimeline(graph, userChapter), [graph, userChapter]);
  const worldMap = useMemo(() => projectWorldMap(graph, userChapter), [graph, userChapter]);
  const characterJourney = useMemo(
    () => projectCharacterJourney(selectedCharacterId, graph, userChapter), 
    [selectedCharacterId, graph, userChapter]
  );

  // Selected character details for RPG Status Screen
  const selectedCharacter = graph.entities[selectedCharacterId];
  const activeStageFact = powerLadder.tiers.find(t => 
    t.characters.some(c => c.id === selectedCharacterId)
  );

  // Milestones per series
  const milestones = useMemo(() => {
    if (graph.series.slug === 'one-piece') {
      return [
        { label: 'Ch 1: Romance Dawn', chapter: 1 },
        { label: 'Ch 100: Grand Line', chapter: 100 },
        { label: 'Ch 218: Sky Island', chapter: 218 },
        { label: 'Ch 390: Gear Second', chapter: 390 },
        { label: 'Ch 574: Marineford', chapter: 574 },
        { label: 'Ch 1044: Gear 5th Sun God', chapter: 1044 },
        { label: 'Ch 1110: Egghead', chapter: 1110 },
      ];
    }
    if (graph.series.slug === 'demonic-emperor') {
      return [
        { label: 'Ch 1: Rebirth', chapter: 1 },
        { label: 'Ch 25: Blood Infant', chapter: 25 },
        { label: 'Ch 140: Pill Contest', chapter: 140 },
        { label: 'Ch 315: Huangpu Duel', chapter: 315 },
        { label: 'Ch 350: 8th Noble House', chapter: 350 },
        { label: 'Ch 1315: Emperor Peak', chapter: 1315 },
      ];
    }
    return [
      { label: 'Ch 1: Genesis', chapter: 1 },
      { label: 'Ch 8: Bebe Enters', chapter: 8 },
      { label: 'Ch 115: Saint Rank', chapter: 115 },
      { label: 'Ch 200: Infernal Plane', chapter: 200 },
      { label: 'Ch 450: God Rank', chapter: 450 },
      { label: 'Ch 500: Identity Unveiled', chapter: 500 },
      { label: 'Ch 842: Finale', chapter: 842 },
    ];
  }, [graph.series.slug]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-pixel text-slate-400 hover:text-amber-300 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> [ ESC TO UNIVERSES ]
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-2xl select-none">{theme.runeSymbol}</span>
            <h1 className="text-2xl sm:text-3xl font-pixel font-bold text-white tracking-tight">
              {graph.series.title}
            </h1>
            <span className={`text-[10px] font-pixel px-2.5 py-1 rounded border uppercase ${theme.badgeBg} ${theme.badgeText} ${theme.accentBorder}`}>
              {graph.series.type}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 italic font-mono">{theme.tagline}</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Knowledge Boundary: Ch {graph.series.knowledge_boundary.latest_processed_chapter}</span>
        </div>
      </div>

      {/* Global Spoiler Scrubber (RPG Timeline Console) */}
      <div className="rounded-2xl border-2 border-slate-700 bg-slate-950 p-5 shadow-2xl relative space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-pixel text-amber-400 tracking-wider">
                SPOILER SCRUBBER CONSOLE
              </div>
              <div className="text-lg font-mono font-bold text-white flex items-center gap-2">
                READING CHAPTER: <span className="text-amber-400 text-xl font-pixel">[{userChapter}]</span> / {totalChapters}
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            {userChapter >= totalChapters ? (
              <span className="text-emerald-400 font-pixel text-[11px]">✦ FULL LORE REVEALED ✦</span>
            ) : (
              <span className="text-amber-300 font-mono">░░ HIDING FUTURE EVENTS PAST CH {userChapter} ░░</span>
            )}
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-1 pt-1">
          <input
            type="range"
            min={1}
            max={totalChapters}
            value={userChapter}
            onChange={(e) => setUserChapter(Number(e.target.value))}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer border border-slate-700"
          />
          <div className="flex justify-between text-[10px] font-pixel text-slate-500">
            <span>CH 1</span>
            <span>CH {Math.round(totalChapters / 2)}</span>
            <span>CH {totalChapters}</span>
          </div>
        </div>

        {/* Quick Jump Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-pixel text-slate-400 mr-1">ARC JUMP:</span>
          {milestones.map((m) => (
            <button
              key={m.chapter}
              onClick={() => setUserChapter(m.chapter)}
              className={`text-[11px] font-pixel px-2.5 py-1 rounded transition border ${
                userChapter === m.chapter
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Retro Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-pixel text-xs transition border ${
            activeTab === 'map'
              ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>PIXEL WORLD MAP</span>
        </button>

        <button
          onClick={() => setActiveTab('ladder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-pixel text-xs transition border ${
            activeTab === 'ladder'
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>POWER LADDER</span>
        </button>

        <button
          onClick={() => setActiveTab('journey')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-pixel text-xs transition border ${
            activeTab === 'journey'
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>RPG STATUS SHEET</span>
        </button>

        <button
          onClick={() => setActiveTab('web')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-pixel text-xs transition border ${
            activeTab === 'web'
              ? 'bg-indigo-500 text-white font-bold border-indigo-400 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>FACTION WEB</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-pixel text-xs transition border ${
            activeTab === 'timeline'
              ? 'bg-purple-500 text-white font-bold border-purple-400 shadow-lg'
              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>STORY TIMELINE</span>
        </button>

        <Link
          href="/pixel-studio"
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl font-pixel text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>PIXEL STUDIO ↗</span>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {/* VIEW 1: PIXEL WORLD MAP (SHOWSTOPPER) */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <PixelMapCanvas
              planes={worldMap.planes}
              userChapter={userChapter}
              totalChapters={totalChapters}
            />
          </div>
        )}

        {/* VIEW 2: POWER LADDER */}
        {activeTab === 'ladder' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-pixel font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>{powerLadder.system_name}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Realm tiers active at Chapter {userChapter}. Characters dynamically advance as you slide the scrubber.
                </p>
              </div>
            </div>

            <div className="space-y-3 font-mono">
              {powerLadder.tiers
                .slice()
                .reverse()
                .map((tier) => {
                  const hasCharacters = tier.characters.length > 0;

                  return (
                    <div
                      key={tier.id}
                      className={`rounded-xl border p-4 transition-all ${
                        hasCharacters
                          ? 'border-amber-500/60 bg-[#0c1220] shadow-md'
                          : 'border-slate-800 bg-slate-950/60 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-pixel text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-amber-400">
                            T{tier.order}
                          </span>
                          <div>
                            <h3 className="font-pixel text-sm text-white">
                              {tier.name}
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">{tier.description}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-pixel px-2 py-0.5 rounded ${
                          hasCharacters ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {tier.characters.length} OCCUPANT{tier.characters.length === 1 ? '' : 'S'}
                        </span>
                      </div>

                      {hasCharacters ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                          {tier.characters.map((char) => (
                            <div
                              key={char.id}
                              onClick={() => {
                                setSelectedCharacterId(char.id);
                                setActiveTab('journey');
                              }}
                              className="cursor-pointer flex items-center gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-amber-400 transition"
                            >
                              <PixelAvatar id={char.id} name={char.displayName} size={36} />
                              <div>
                                <div className="font-pixel text-xs text-white hover:text-amber-300">
                                  {char.displayName}
                                </div>
                                <div className="text-[10px] text-amber-400/80 font-mono">
                                  Achieved Ch {char.achieved_at_chapter}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 font-pixel py-1">
                          ░░ NO CHARACTERS AT THIS REALM BY CH {userChapter} ░░
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* VIEW 3: RPG STATUS SCREEN & CHARACTER JOURNEY */}
        {activeTab === 'journey' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Left Column: Authentic Retro RPG Status Screen */}
              <div className="w-full lg:w-auto shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-xs text-slate-400">SELECT CHARACTER:</span>
                  <select
                    value={selectedCharacterId}
                    onChange={(e) => setSelectedCharacterId(e.target.value)}
                    className="bg-slate-900 text-white font-pixel text-xs px-3 py-1.5 rounded border border-slate-700 focus:outline-none focus:border-amber-400"
                  >
                    {Object.values(graph.entities)
                      .filter((e) => e.type === 'character')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <RpgStatusScreen
                  characterId={selectedCharacterId}
                  name={selectedCharacter?.name ?? selectedCharacterId}
                  displayName={characterJourney?.displayName ?? selectedCharacter?.name ?? selectedCharacterId}
                  isMasked={characterJourney?.displayName !== selectedCharacter?.name}
                  avatarUrl={(selectedCharacter as any)?.avatar_url}
                  realmName={activeStageFact?.name ?? 'Mortal / Unranked'}
                  realmOrder={activeStageFact?.order ?? 1}
                  factionName={selectedCharacter?.provenance.source.series.toUpperCase()}
                  locationName="Active Domain"
                  userChapter={userChapter}
                  relationshipsCount={relationshipWeb.edges.filter(
                    (e) => e.source === selectedCharacterId || e.target === selectedCharacterId
                  ).length}
                />
              </div>

              {/* Right Column: Character Biographical Journey */}
              <div className="flex-1 w-full space-y-4 font-mono">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <h3 className="font-pixel text-xs text-amber-300">
                    BIOGRAPHICAL CHRONICLE (UP TO CH {userChapter})
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Combined roadmap of breakthroughs, relationships, and key events experienced by {characterJourney?.displayName}.
                  </p>
                </div>

                {characterJourney && characterJourney.milestones.length > 0 ? (
                  <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                    {characterJourney.milestones.map((m, idx) => (
                      <div key={idx} className="relative flex items-start gap-3">
                        <div className="absolute -left-6 top-2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-950" />
                        <div className="w-full rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-pixel text-xs text-white">{m.title}</span>
                            <span className="text-[10px] font-pixel text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              CH {m.chapter}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">{m.description}</p>
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
        )}

        {/* VIEW 4: RELATIONSHIP WEB */}
        {activeTab === 'web' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-pixel font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>CHARACTER & FACTION NETWORK</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Active alliances, master-disciple ties, and rivalries at Chapter {userChapter}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
              {relationshipWeb.nodes.map((node) => {
                const nodeEdges = relationshipWeb.edges.filter(
                  (e) => e.source === node.id || e.target === node.id
                );

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      if (node.type === 'character') {
                        setSelectedCharacterId(node.id);
                        setActiveTab('journey');
                      }
                    }}
                    className="cursor-pointer rounded-xl border border-slate-800 bg-[#0c1220] p-4 hover:border-amber-400 transition shadow"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <PixelAvatar id={node.id} name={node.label} size={42} isMasked={node.isMasked} />
                      <div>
                        <div className="font-pixel text-xs text-white flex items-center gap-1.5">
                          {node.label}
                          {node.isMasked && <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <span className="text-[10px] uppercase font-mono text-slate-500">
                          {node.type}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      {nodeEdges.length > 0 ? (
                        nodeEdges.map((edge) => {
                          const isSource = edge.source === node.id;
                          const otherId = isSource ? edge.target : edge.source;
                          const otherNode = relationshipWeb.nodes.find((n) => n.id === otherId);

                          return (
                            <div
                              key={edge.id}
                              className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-slate-900 border border-slate-800/60"
                            >
                              <span className="text-amber-300 font-pixel text-[9px]">
                                {edge.label}
                              </span>
                              <span className="text-slate-400">
                                → {otherNode?.label ?? otherId}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-[10px] text-slate-600 font-pixel">
                          ░░ NO ACTIVE TIES ░░
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 5: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-pixel font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>STORY ARCS & EVENT CHRONOLOGY</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Events and breakthroughs occurring strictly prior to Chapter {userChapter}.
                </p>
              </div>
            </div>

            <div className="space-y-4 font-mono">
              {timeline.arcs.map((arc) => (
                <div
                  key={arc.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-pixel text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                        ARC {arc.order}
                      </span>
                      <h3 className="font-pixel text-sm text-white mt-1">{arc.name}</h3>
                      <p className="text-xs text-slate-400">
                        Chapters {arc.chapter_start} – {arc.chapter_end}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    {arc.events.length > 0 ? (
                      arc.events.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800"
                        >
                          <div className="w-10 h-10 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 font-pixel text-[10px]">
                            CH{ev.chapter}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-pixel text-xs text-slate-200">{ev.title}</span>
                              <span className="text-[9px] uppercase font-pixel px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                {ev.event_type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{ev.description}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs font-pixel text-slate-600 py-1">
                        ░░ FUTURE EVENTS IN THIS ARC HIDDEN BY SPOILER FILTER ░░
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
