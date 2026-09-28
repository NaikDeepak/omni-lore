'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CanonicalLoreGraph, CharacterEntity } from '@/domain/types';
import { PixelAvatar } from './PixelAvatar';
import { PixelGauge } from './PixelGauge';
import {
  simulateDuel,
  getCanonPresets,
  DuelResult,
  DuelPreset,
} from '@/engine/duel-simulator';
import { SoundEngine } from '@/lib/sound-effects';
import {
  Swords,
  Trophy,
  Zap,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Flame,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface RpgDuelSimulatorProps {
  graph: CanonicalLoreGraph;
  userChapter: number;
  initialFighterA?: string;
  initialFighterB?: string;
  onChapterChange?: (chapter: number) => void;
  onSelectCharacter?: (characterId: string) => void;
}

export function RpgDuelSimulator({
  graph,
  userChapter,
  initialFighterA,
  initialFighterB,
  onChapterChange,
  onSelectCharacter,
}: RpgDuelSimulatorProps) {
  const characters = useMemo(() => {
    return Object.values(graph.entities)
      .filter((e): e is CharacterEntity => e.type === 'character')
      .sort((a, b) => a.first_appearance - b.first_appearance);
  }, [graph.entities]);

  // Default initial fighters
  const defaultFighterA =
    initialFighterA ||
    (graph.series.slug === 'one-piece'
      ? 'luffy'
      : graph.series.slug === 'demonic-emperor'
      ? 'zhuo-fan'
      : 'linley-baruch');

  const defaultFighterB =
    initialFighterB ||
    (graph.series.slug === 'one-piece'
      ? 'arlong'
      : graph.series.slug === 'demonic-emperor'
      ? 'huangpu-qingtian'
      : 'clayde');

  const [fighterAId, setFighterAId] = useState<string>(defaultFighterA);
  const [fighterBId, setFighterBId] = useState<string>(defaultFighterB);
  const [activeRoundIndex, setActiveRoundIndex] = useState<number>(-1);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Universe Canon Showdowns
  const presets = useMemo(() => getCanonPresets(graph.series.slug), [graph.series.slug]);

  // Run the simulation
  const duelResult: DuelResult = useMemo(() => {
    return simulateDuel(fighterAId, fighterBId, userChapter, graph);
  }, [fighterAId, fighterBId, userChapter, graph]);

  // Reset rounds when fighters or chapter changes
  useEffect(() => {
    setActiveRoundIndex(-1);
    setIsSimulating(false);
  }, [fighterAId, fighterBId, userChapter]);

  // Step-by-step playback handler
  const handleInitiateDuel = () => {
    setIsSimulating(true);
    setActiveRoundIndex(0);

    // Initial strike sound
    if (duelResult.rounds[0]?.isCritical) {
      SoundEngine.playCombatCrit();
    } else {
      SoundEngine.playCombatHit();
    }

    let round = 0;
    const interval = setInterval(() => {
      round++;
      if (round < duelResult.rounds.length) {
        setActiveRoundIndex(round);
        const r = duelResult.rounds[round];
        if (r?.isCritical) {
          SoundEngine.playCombatCrit();
        } else {
          SoundEngine.playCombatHit();
        }
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        SoundEngine.playVictoryJingle();
      }
    }, 1100);
  };

  const handleApplyPreset = (preset: DuelPreset) => {
    SoundEngine.playMenuSelect();
    setFighterAId(preset.fighterA);
    setFighterBId(preset.fighterB);
    if (onChapterChange) {
      onChapterChange(preset.chapter);
    }
    setActiveRoundIndex(-1);
    setIsSimulating(false);
  };

  // Compute current display HP based on activeRoundIndex
  const currentHpA =
    activeRoundIndex >= 0
      ? duelResult.fighterA.hpLog[
          Math.min(activeRoundIndex + 1, duelResult.fighterA.hpLog.length - 1)
        ]
      : duelResult.fighterA.maxHp;

  const currentHpB =
    activeRoundIndex >= 0
      ? duelResult.fighterB.hpLog[
          Math.min(activeRoundIndex + 1, duelResult.fighterB.hpLog.length - 1)
        ]
      : duelResult.fighterB.maxHp;

  const isCompleted =
    activeRoundIndex >= duelResult.rounds.length - 1 && !isSimulating;

  return (
    <div className="space-y-6 font-mono select-none">
      {/* 1. Header & Canon Showdown Presets Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-pixel font-bold text-amber-400 flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              <span>HEAD-TO-HEAD RPG DUEL ARENA</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate turn-based canon clashes and hypothetical matchups scaled at Chapter {userChapter}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-pixel text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              SCRUBBER AT: <span className="text-amber-400 font-bold">CH {userChapter}</span>
            </span>
          </div>
        </div>

        {/* Canon Showdowns Quick Presets */}
        {presets.length > 0 && (
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-pixel text-slate-500 flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> CANON PRESETS:
            </span>
            {presets.map((p) => {
              const isActive =
                fighterAId === p.fighterA &&
                fighterBId === p.fighterB &&
                userChapter === p.chapter;
              return (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-pixel transition border ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {p.title} (Ch. {p.chapter})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Side-by-Side Duel Arena Cards */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Fighter 1 (Left / Player 1) */}
        <div className="md:col-span-5 p-5 rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-b from-[#0c1428] to-[#070b14] shadow-2xl relative space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-pixel text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-600">
              CHALLENGER 1
            </span>
            {duelResult.fighterA.factionName && (
              <span className="text-[10px] font-pixel text-slate-400 truncate max-w-[150px]">
                {duelResult.fighterA.factionName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <PixelAvatar
              id={fighterAId}
              name={duelResult.fighterA.name}
              size={64}
              avatarUrl={duelResult.fighterA.avatarUrl}
            />
            <div className="flex-1 min-w-0">
              <select
                value={fighterAId}
                onChange={(e) => {
                  setFighterAId(e.target.value);
                  SoundEngine.playMenuSelect();
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-pixel text-white focus:outline-none focus:border-cyan-400"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Ch. {c.first_appearance}+)
                  </option>
                ))}
              </select>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-pixel">
                  {duelResult.fighterA.stageName}
                </span>
              </div>
            </div>
          </div>

          {/* HP Gauge */}
          <PixelGauge
            label="HEALTH POINTS"
            value={currentHpA}
            max={duelResult.fighterA.maxHp}
            colorClass="text-emerald-400"
          />

          {/* Combat Matrix */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1 border-t border-slate-800">
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">ATK</span>
              <span className="font-bold text-white text-xs">{duelResult.fighterA.attack}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">DEF</span>
              <span className="font-bold text-white text-xs">{duelResult.fighterA.defense}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">SPD</span>
              <span className="font-bold text-white text-xs">{duelResult.fighterA.speed}</span>
            </div>
          </div>
        </div>

        {/* Center VS Indicator & Duel Action Button */}
        <div className="md:col-span-1 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-400/80 flex items-center justify-center text-amber-400 font-pixel font-bold shadow-lg shadow-amber-500/20 text-xs">
            VS
          </div>

          <div className="text-[9px] font-pixel text-slate-400 whitespace-nowrap text-center">
            <span className="text-cyan-400">{duelResult.fighterAAdvantage}%</span>
            <span className="text-slate-600 px-1">:</span>
            <span className="text-rose-400">{duelResult.fighterBAdvantage}%</span>
          </div>

          <button
            onClick={handleInitiateDuel}
            disabled={isSimulating}
            className={`w-full py-2.5 px-3 rounded-xl font-pixel text-xs transition border flex items-center justify-center gap-1.5 shadow-xl ${
              isSimulating
                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-amber-500/30'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'BATTLING...' : 'INITIATE'}</span>
          </button>
        </div>

        {/* Fighter 2 (Right / Opponent) */}
        <div className="md:col-span-5 p-5 rounded-2xl border-2 border-rose-500/40 bg-gradient-to-b from-[#200c14] to-[#070b14] shadow-2xl relative space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-pixel text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-600">
              CHALLENGER 2
            </span>
            {duelResult.fighterB.factionName && (
              <span className="text-[10px] font-pixel text-slate-400 truncate max-w-[150px]">
                {duelResult.fighterB.factionName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <PixelAvatar
              id={fighterBId}
              name={duelResult.fighterB.name}
              size={64}
              avatarUrl={duelResult.fighterB.avatarUrl}
            />
            <div className="flex-1 min-w-0">
              <select
                value={fighterBId}
                onChange={(e) => {
                  setFighterBId(e.target.value);
                  SoundEngine.playMenuSelect();
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-pixel text-white focus:outline-none focus:border-rose-400"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Ch. {c.first_appearance}+)
                  </option>
                ))}
              </select>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/30 text-rose-300 text-[10px] font-pixel">
                  {duelResult.fighterB.stageName}
                </span>
              </div>
            </div>
          </div>

          {/* HP Gauge */}
          <PixelGauge
            label="HEALTH POINTS"
            value={currentHpB}
            max={duelResult.fighterB.maxHp}
            colorClass="text-emerald-400"
          />

          {/* Combat Matrix */}
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1 border-t border-slate-800">
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">ATK</span>
              <span className="font-bold text-white text-xs">{duelResult.fighterB.attack}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">DEF</span>
              <span className="font-bold text-white text-xs">{duelResult.fighterB.defense}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block">SPD</span>
              <span className="font-bold text-white text-xs">{duelResult.fighterB.speed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Turn-by-Turn Combat Log Stream */}
      {activeRoundIndex >= 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-pixel text-xs text-amber-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" /> COMBAT LOG STREAM
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              ROUND {activeRoundIndex + 1} OF {duelResult.rounds.length}
            </span>
          </div>

          <div className="space-y-2">
            {duelResult.rounds.slice(0, activeRoundIndex + 1).map((round, idx) => {
              const isFighterA = round.attackerId === fighterAId;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                    isFighterA
                      ? 'bg-cyan-950/20 border-cyan-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div
                    className={`px-2 py-0.5 rounded text-[10px] font-pixel shrink-0 ${
                      isFighterA
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    R{round.roundNumber}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-pixel text-xs text-white">
                        {round.techniqueName}
                      </span>
                      {round.isCritical && (
                        <span className="text-[9px] font-pixel px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                          CRITICAL STRIKE!
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">{round.narrative}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-pixel text-xs text-rose-400">
                      -{round.damage} HP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Victory Banner upon battle conclusion */}
          {isCompleted && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 border-2 border-amber-400/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-pixel text-amber-400 tracking-wider">
                    DECISIVE SHOWDOWN CONCLUSION
                  </div>
                  <h3 className="font-pixel text-base font-bold text-white">
                    🏆 VICTORY: {duelResult.winnerId === fighterAId ? duelResult.fighterA.name : duelResult.fighterB.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Finishing Strike: <span className="text-amber-300 font-pixel">{duelResult.decisiveTechnique}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveRoundIndex(-1);
                  SoundEngine.playMenuSelect();
                }}
                className="py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-pixel flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> REPLAY
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
