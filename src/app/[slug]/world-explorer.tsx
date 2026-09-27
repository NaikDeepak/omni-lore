'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { CanonicalLoreGraph } from '../../domain/types';
import { 
  projectPowerLadder, 
  projectRelationshipWeb, 
  projectTimeline, 
  projectWorldMap, 
  projectCharacterJourney 
} from '../../projections';
import { 
  Flame, 
  Share2, 
  Map as MapIcon, 
  Clock, 
  User, 
  Lock, 
  ArrowLeft, 
  Info,
  EyeOff
} from 'lucide-react';

interface WorldExplorerProps {
  graph: CanonicalLoreGraph;
}

export function WorldExplorer({ graph }: WorldExplorerProps) {
  const totalChapters = graph.series.total_chapters;
  
  // Scrubber state
  const [userChapter, setUserChapter] = useState<number>(150);
  const [activeTab, setActiveTab] = useState<'ladder' | 'web' | 'map' | 'timeline' | 'journey'>('ladder');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('linley-baruch');

  // Computed projections strictly driven by userChapter
  const powerLadder = useMemo(() => projectPowerLadder(graph, userChapter), [graph, userChapter]);
  const relationshipWeb = useMemo(() => projectRelationshipWeb(graph, userChapter), [graph, userChapter]);
  const timeline = useMemo(() => projectTimeline(graph, userChapter), [graph, userChapter]);
  const worldMap = useMemo(() => projectWorldMap(graph, userChapter), [graph, userChapter]);
  const characterJourney = useMemo(
    () => projectCharacterJourney(selectedCharacterId, graph, userChapter), 
    [selectedCharacterId, graph, userChapter]
  );

  // Quick milestone shortcuts
  const milestones = [
    { label: 'Ch 1: Genesis', chapter: 1 },
    { label: 'Ch 8: Bebe Meets Linley', chapter: 8 },
    { label: 'Ch 115: Saint Breakthrough', chapter: 115 },
    { label: 'Ch 200: Infernal Realm Revealed', chapter: 200 },
    { label: 'Ch 450: God Breakthrough', chapter: 450 },
    { label: 'Ch 500: Identity Unveiled', chapter: 500 },
    { label: 'Ch 842: Finale', chapter: 842 },
  ];

  return (
    <div className="space-y-6">
      {/* Back button and series title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-300 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Universes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {graph.series.title}
            </h1>
            <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              {graph.series.type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-cosmic-800/80 px-3 py-1.5 rounded-lg border border-cosmic-700">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Knowledge boundary: Ch {graph.series.knowledge_boundary.latest_processed_chapter}</span>
        </div>
      </div>

      {/* Global Spoiler Scrubber Card */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-cosmic-800 via-cosmic-800/90 to-cosmic-800 p-5 shadow-xl shadow-amber-500/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Global Spoiler Scrubber
              </div>
              <div className="text-lg font-bold text-white">
                Reading Chapter: <span className="text-amber-400 font-mono text-xl">{userChapter}</span> / {totalChapters}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            {userChapter >= totalChapters ? (
              <span className="text-emerald-400 font-medium">All Spoilers Unlocked (Completed Story)</span>
            ) : (
              <span className="text-amber-300/90">Hiding events, deaths & breakthroughs after Ch {userChapter}</span>
            )}
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={1}
            max={totalChapters}
            value={userChapter}
            onChange={(e) => setUserChapter(Number(e.target.value))}
            className="w-full h-2.5 bg-cosmic-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Ch 1</span>
            <span>Ch {Math.round(totalChapters / 2)}</span>
            <span>Ch {totalChapters}</span>
          </div>
        </div>

        {/* Quick Jump Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-400 font-medium mr-1">Key Arcs:</span>
          {milestones.map((m) => (
            <button
              key={m.chapter}
              onClick={() => setUserChapter(m.chapter)}
              className={`text-xs px-2.5 py-1 rounded-md transition font-medium ${
                userChapter === m.chapter
                  ? 'bg-amber-500 text-cosmic-900 font-bold shadow'
                  : 'bg-cosmic-700/60 hover:bg-cosmic-700 text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projection Views Tab Switcher */}
      <div className="flex flex-wrap gap-2 border-b border-cosmic-700 pb-3">
        <button
          onClick={() => setActiveTab('ladder')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'ladder'
              ? 'bg-amber-500 text-cosmic-900 shadow-md shadow-amber-500/20'
              : 'bg-cosmic-800 text-slate-300 hover:bg-cosmic-700 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Cultivation Ladder</span>
        </button>

        <button
          onClick={() => setActiveTab('web')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'web'
              ? 'bg-amber-500 text-cosmic-900 shadow-md shadow-amber-500/20'
              : 'bg-cosmic-800 text-slate-300 hover:bg-cosmic-700 hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Relationship Web</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'map'
              ? 'bg-amber-500 text-cosmic-900 shadow-md shadow-amber-500/20'
              : 'bg-cosmic-800 text-slate-300 hover:bg-cosmic-700 hover:text-white'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Cosmology & Map</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'timeline'
              ? 'bg-amber-500 text-cosmic-900 shadow-md shadow-amber-500/20'
              : 'bg-cosmic-800 text-slate-300 hover:bg-cosmic-700 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Story Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('journey')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
            activeTab === 'journey'
              ? 'bg-amber-500 text-cosmic-900 shadow-md shadow-amber-500/20'
              : 'bg-cosmic-800 text-slate-300 hover:bg-cosmic-700 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Character Journey</span>
        </button>
      </div>

      {/* Projection Content Area */}
      <div className="bg-cosmic-800/40 rounded-2xl border border-cosmic-700 p-6 min-h-[500px]">
        {/* VIEW 1: POWER LADDER */}
        {activeTab === 'ladder' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span>{powerLadder.system_name}</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Active power tier positions at Chapter {userChapter}. Characters dynamically advance as you slide the scrubber.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {powerLadder.tiers
                .slice()
                .reverse()
                .map((tier) => {
                  const hasCharacters = tier.characters.length > 0;

                  return (
                    <div
                      key={tier.id}
                      className={`rounded-xl border p-5 transition-all ${
                        hasCharacters
                          ? 'border-amber-500/40 bg-gradient-to-r from-cosmic-800 to-cosmic-800/80 shadow-lg'
                          : 'border-cosmic-700/60 bg-cosmic-900/40 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-cosmic-700 flex items-center justify-center font-bold text-amber-400 text-sm border border-cosmic-600">
                            {tier.order}
                          </span>
                          <div>
                            <h3 className="font-extrabold text-lg text-white">
                              {tier.name}
                            </h3>
                            <p className="text-xs text-slate-400">{tier.description}</p>
                          </div>
                        </div>

                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          hasCharacters ? 'bg-amber-500/20 text-amber-300' : 'bg-cosmic-700 text-slate-400'
                        }`}>
                          {tier.characters.length} {tier.characters.length === 1 ? 'Occupant' : 'Occupants'}
                        </span>
                      </div>

                      {hasCharacters ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                          {tier.characters.map((char) => (
                            <div
                              key={char.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-cosmic-900/80 border border-cosmic-700/80 hover:border-amber-500/40 transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                                  {char.displayName[0]}
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-slate-100">{char.displayName}</div>
                                  <div className="text-[11px] text-amber-400/80 font-mono">
                                    Achieved Ch {char.achieved_at_chapter}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic py-1">
                          No known characters at this tier by Chapter {userChapter}.
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* VIEW 2: RELATIONSHIP WEB */}
        {activeTab === 'web' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-400" />
                <span>Character & Faction Network</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Visual relationship graph active at Chapter {userChapter}. Expired ties fade; future allies remain locked.
              </p>
            </div>

            <div className="relative rounded-xl border border-cosmic-700 bg-cosmic-900/90 p-8 min-h-[350px] flex flex-col items-center justify-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                {relationshipWeb.nodes.map((node) => {
                  const nodeEdges = relationshipWeb.edges.filter(
                    (e) => e.source === node.id || e.target === node.id
                  );

                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        if (node.type === 'character') setSelectedCharacterId(node.id);
                      }}
                      className="cursor-pointer rounded-xl border border-cosmic-700 bg-cosmic-800 p-4 hover:border-amber-500 transition shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            node.type === 'faction' 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-indigo-600 text-white'
                          }`}>
                            {node.label[0]}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-white flex items-center gap-1.5">
                              {node.label}
                              {node.isMasked && (
                                <span title="Secret Identity Masked" className="inline-flex items-center text-amber-400">
                                  <EyeOff className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] uppercase text-slate-400 tracking-wider">
                              {node.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-cosmic-700/60">
                        {nodeEdges.length > 0 ? (
                          nodeEdges.map((edge) => {
                            const isSource = edge.source === node.id;
                            const otherId = isSource ? edge.target : edge.source;
                            const otherNode = relationshipWeb.nodes.find((n) => n.id === otherId);

                            return (
                              <div
                                key={edge.id}
                                className="flex items-center justify-between text-xs py-1 px-2 rounded bg-cosmic-900/60"
                              >
                                <span className="font-medium text-amber-300">
                                  {edge.label}
                                </span>
                                <span className="text-slate-400">
                                  → {otherNode?.label ?? otherId}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-[11px] text-slate-500 italic">
                            No active relationships at Ch {userChapter}.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: COSMOLOGY & MAP */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-cyan-400" />
                <span>Cosmology & Known Geography</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Discovered planar realms and territories known by Chapter {userChapter}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {worldMap.planes.map((plane) => (
                <div
                  key={plane.id}
                  className="rounded-xl border border-cosmic-700 bg-cosmic-800 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                        Tier {plane.tier_order} Plane
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">{plane.name}</h3>
                      <p className="text-xs text-slate-400">{plane.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-cosmic-700/60">
                    <div className="text-xs font-semibold text-slate-300">
                      Discovered Locations ({plane.locations.length})
                    </div>
                    {plane.locations.length > 0 ? (
                      plane.locations.map((loc) => (
                        <div
                          key={loc.id}
                          className="p-3 rounded-lg bg-cosmic-900/70 border border-cosmic-700/70 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-200">{loc.name}</span>
                            {loc.coordinates && (
                              <span className="text-[10px] font-mono text-cyan-400">
                                ({loc.coordinates.x}, {loc.coordinates.y})
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{loc.description}</p>
                          <div className="text-[10px] text-slate-500">
                            First visited in Chapter {loc.first_appearance}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic p-3 rounded bg-cosmic-900/40">
                        Uncharted territory. No locations discovered yet by Chapter {userChapter}.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span>Story Arcs & Event Roadmap</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Major battles, breakthroughs, and world events occurring up to Chapter {userChapter}.
              </p>
            </div>

            <div className="space-y-6">
              {timeline.arcs.map((arc) => (
                <div
                  key={arc.id}
                  className="rounded-xl border border-cosmic-700 bg-cosmic-800 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                        Arc {arc.order}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-1">{arc.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Chapters {arc.chapter_start} – {arc.chapter_end}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-cosmic-700/60">
                    {arc.events.length > 0 ? (
                      arc.events.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-start gap-3 p-3.5 rounded-lg bg-cosmic-900/70 border border-cosmic-700/80"
                        >
                          <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                            Ch {ev.chapter}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-100">{ev.title}</span>
                              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cosmic-700 text-slate-300">
                                {ev.event_type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{ev.description}</p>
                            {ev.involved_characters.length > 0 && (
                              <div className="text-[11px] text-amber-400/90 pt-1">
                                Involved: {ev.involved_characters.map((c) => c.name).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 italic p-3">
                        Events in this arc have not occurred yet by Chapter {userChapter}.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: CHARACTER JOURNEY */}
        {activeTab === 'journey' && characterJourney && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  <span>{characterJourney.displayName}'s Biography</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Individual timeline combining breakthroughs, key events, and relationship transitions up to Chapter {userChapter}.
                </p>
              </div>

              {/* Character Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Select Character:</span>
                <select
                  value={selectedCharacterId}
                  onChange={(e) => setSelectedCharacterId(e.target.value)}
                  className="bg-cosmic-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-cosmic-600 focus:outline-none focus:border-amber-400"
                >
                  <option value="linley-baruch">Linley Baruch</option>
                  <option value="doehring-cowart">Doehring Cowart</option>
                  <option value="bebe">Bebe</option>
                </select>
              </div>
            </div>

            {/* Milestones list */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-cosmic-700">
              {characterJourney.milestones.map((m, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-cosmic-900 ring-2 ring-amber-500/30" />
                  <div className="w-full rounded-xl border border-cosmic-700 bg-cosmic-800 p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{m.title}</span>
                      <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        Chapter {m.chapter}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{m.description}</p>
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
