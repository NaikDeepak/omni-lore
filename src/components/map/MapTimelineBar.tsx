'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, Sparkles, ChevronRight, Swords, Skull, Award, Compass } from 'lucide-react';
import { MapEvent, MapEventType } from '../../domain/map-types';
import { SoundEngine } from '../../lib/sound-effects';

export interface MapTimelineBarProps {
  currentChapter: number;
  totalChapters?: number;
  maxChapter?: number;
  minChapter?: number;
  onChapterChange: (chapter: number) => void;
  events?: MapEvent[];
  activeCharacterName?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  accentColor?: string;
  className?: string;
}

function getEventIcon(type: MapEventType) {
  switch (type) {
    case 'battle':
    case 'war':
      return Swords;
    case 'death':
      return Skull;
    case 'breakthrough':
    case 'ascension':
      return Award;
    case 'discovery':
    case 'reveal':
    default:
      return Sparkles;
  }
}

export function MapTimelineBar({
  currentChapter,
  totalChapters = 1000,
  maxChapter: maxChapterProp,
  minChapter = 1,
  onChapterChange,
  events = [],
  activeCharacterName = 'Protagonist',
  isPlaying: controlledIsPlaying,
  onTogglePlay: controlledOnTogglePlay,
  playbackSpeed: controlledPlaybackSpeed,
  onSpeedChange: controlledOnSpeedChange,
  accentColor = '#10b981',
  className = '',
}: MapTimelineBarProps) {
  const maxChapter = maxChapterProp ?? totalChapters;

  // Internal playback state if uncontrolled
  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const [internalSpeed, setInternalSpeed] = useState(1);
  const [hoveredEvent, setHoveredEvent] = useState<MapEvent | null>(null);

  const isPlaying = controlledIsPlaying !== undefined ? controlledIsPlaying : internalIsPlaying;
  const playbackSpeed = controlledPlaybackSpeed !== undefined ? controlledPlaybackSpeed : internalSpeed;

  const currentChapterRef = useRef(currentChapter);
  currentChapterRef.current = currentChapter;

  // Playback timer effect
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(80, Math.floor(400 / playbackSpeed));
    const timer = setInterval(() => {
      const nextChapter = currentChapterRef.current + 1;
      if (nextChapter > maxChapter) {
        if (controlledOnTogglePlay) {
          controlledOnTogglePlay();
        } else {
          setInternalIsPlaying(false);
        }
        return;
      }
      SoundEngine.playScrubberTick();
      onChapterChange(nextChapter);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, maxChapter, onChapterChange, controlledOnTogglePlay]);

  const togglePlay = () => {
    SoundEngine.playMenuSelect();
    if (controlledOnTogglePlay) {
      controlledOnTogglePlay();
    } else {
      setInternalIsPlaying(!isPlaying);
    }
  };

  const handleSpeedSelect = (speed: number) => {
    SoundEngine.playMenuSelect();
    if (controlledOnSpeedChange) {
      controlledOnSpeedChange(speed);
    } else {
      setInternalSpeed(speed);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      SoundEngine.playScrubberTick();
      onChapterChange(val);
    }
  };

  // Progress percentage (0 - 100)
  const rangeSpan = Math.max(1, maxChapter - minChapter);
  const progressPct = Math.min(100, Math.max(0, ((currentChapter - minChapter) / rangeSpan) * 100));

  // Filter canonical key events up to maxChapter
  const visibleEvents = events.filter((ev) => ev.chapter >= minChapter && ev.chapter <= maxChapter);

  return (
    <div
      className={`pointer-events-auto flex flex-col gap-2 p-3 bg-slate-950/95 border border-slate-800/90 rounded-2xl backdrop-blur-md shadow-2xl font-mono text-xs ${className}`}
    >
      {/* Top Status Row: Active Character, Event Badge & Chapter Readout */}
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-cyan-400" />
            JOURNEY: <span className="text-white font-bold">{activeCharacterName}</span>
          </span>

          {hoveredEvent && (
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300 font-pixel text-[9px] animate-in fade-in">
              <Sparkles className="w-2.5 h-2.5" />
              <span>
                CH.{hoveredEvent.chapter}: {hoveredEvent.name}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-mono text-[11px]">
            CHAPTER <span className="text-emerald-400 font-bold">{currentChapter}</span> / {maxChapter}
          </span>
          <span className="text-[10px] font-pixel text-slate-500">
            ({Math.round(progressPct)}%)
          </span>
        </div>
      </div>

      {/* Center Row: Play/Pause, Slider Track with Event Pins, and Speed Multipliers */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          data-testid="timeline-play-btn"
          className={`flex items-center justify-center p-2 rounded-xl border transition-all font-pixel text-[10px] ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md animate-pulse'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
          title={isPlaying ? 'Pause Timeline Playback' : 'Play Protagonist Journey'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Speed Multipliers */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {[1, 2, 5].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => handleSpeedSelect(speed)}
              data-testid={`speed-btn-${speed}x`}
              className={`px-1.5 py-0.5 rounded text-[10px] font-pixel transition ${
                playbackSpeed === speed
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Scrubber Timeline Track with Event Nodes */}
        <div className="relative flex-1 flex items-center h-8 group">
          {/* Custom Styled Progress Rail */}
          <div className="absolute inset-x-0 h-2 bg-slate-900 rounded-full border border-slate-800 overflow-hidden pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400 transition-all duration-75"
              style={{ width: `${progressPct}%`, backgroundColor: accentColor }}
            />
          </div>

          {/* Event Pins along Track */}
          <div className="absolute inset-x-0 h-full pointer-events-none">
            {visibleEvents.map((ev) => {
              const evPct = ((ev.chapter - minChapter) / rangeSpan) * 100;
              const isPast = ev.chapter <= currentChapter;
              const Icon = getEventIcon(ev.eventType);

              return (
                <div
                  key={ev.id}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer"
                  style={{ left: `${evPct}%` }}
                  onMouseEnter={() => setHoveredEvent(ev)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    SoundEngine.playBreakthroughFanfare();
                    onChapterChange(ev.chapter);
                  }}
                  data-testid={`event-pin-${ev.id}`}
                  title={`Chapter ${ev.chapter}: ${ev.name} (${ev.eventType})`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-transform hover:scale-125 ${
                      isPast
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm shadow-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-600'
                    }`}
                  >
                    <Icon className="w-2 h-2" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Native Range Input Scrubber */}
          <input
            type="range"
            min={minChapter}
            max={maxChapter}
            value={currentChapter}
            onChange={handleSliderChange}
            data-testid="timeline-scrubber-slider"
            className="w-full h-8 opacity-0 cursor-pointer z-10"
            aria-label="Chapter Scrubber"
          />

          {/* Thumb Position Indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full border-2 border-emerald-500 shadow-lg pointer-events-none transition-all duration-75"
            style={{ left: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
