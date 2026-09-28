import React, { useState } from 'react';
import { ChapterContext } from '../../shared/types';
import { SUPPORTED_SERIES, CONFIDENCE_THRESHOLD } from '../../shared/constants';

interface HeaderHudProps {
  seriesSlug: string;
  chapter: number;
  detectedContext: ChapterContext | null;
  onSeriesChange: (slug: string) => void;
  onChapterChange: (ch: number) => void;
}

export function HeaderHud({
  seriesSlug,
  chapter,
  detectedContext,
  onSeriesChange,
  onChapterChange
}: HeaderHudProps) {
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [tempChapter, setTempChapter] = useState(String(chapter));

  const currentSeries = SUPPORTED_SERIES.find(s => s.slug === seriesSlug) ?? SUPPORTED_SERIES[0];
  const isLowConfidence = detectedContext && detectedContext.confidence < CONFIDENCE_THRESHOLD;

  const handleChapterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(tempChapter, 10);
    if (!isNaN(val) && val > 0) {
      onChapterChange(val);
    }
    setIsEditingChapter(false);
  };

  const openWebAtlas = () => {
    chrome.tabs.create({
      url: `http://localhost:3000/${seriesSlug}?ch=${chapter}&tab=journey`
    });
  };

  return (
    <div style={{ padding: '12px 14px', borderBottom: '1.5px solid #1e293b', backgroundColor: '#070b16' }}>
      {/* Brand & Web Atlas Link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>{currentSeries.rune}</span>
          <span className="font-pixel glow-amber" style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold' }}>
            OMNILORE READER
          </span>
          <span
            style={{
              fontSize: '8px',
              color: '#38bdf8',
              fontFamily: 'monospace',
              padding: '1px 4px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '3px'
            }}
          >
            v{typeof chrome !== 'undefined' && chrome.runtime?.getManifest ? chrome.runtime.getManifest().version : '1.0.1'}
          </span>
        </div>

        <button
          onClick={openWebAtlas}
          className="pixel-btn"
          style={{
            fontSize: '9px',
            padding: '3px 7px',
            borderRadius: '4px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fde047'
          }}
          title="Open deep OmniLore world explorer in browser tab"
        >
          ATLAS ↗
        </button>
      </div>

      {/* Series Selector & Reader Tag */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <select
          value={seriesSlug}
          onChange={(e) => onSeriesChange(e.target.value)}
          className="font-pixel"
          style={{
            background: '#0c1220',
            color: '#ffffff',
            border: '1px solid #334155',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            outline: 'none',
            flex: 1
          }}
        >
          {SUPPORTED_SERIES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.rune} {s.title}
            </option>
          ))}
        </select>

        {detectedContext && (
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: '3px',
              background: '#0f172a',
              border: '1px solid #1e293b',
              color: '#38bdf8'
            }}
          >
            {detectedContext.source} ({Math.round(detectedContext.confidence * 100)}%)
          </span>
        )}
      </div>

      {/* Chapter Scrubber Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#030712', border: '1px solid #1e293b', padding: '6px 10px', borderRadius: '6px' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>CHAPTER:</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onChapterChange(Math.max(1, chapter - 1))}
            className="pixel-btn"
            style={{ background: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: '3px', width: '22px', height: '22px', fontSize: '12px' }}
          >
            -
          </button>

          {isEditingChapter ? (
            <form onSubmit={handleChapterSubmit} style={{ display: 'inline' }}>
              <input
                type="number"
                value={tempChapter}
                onChange={(e) => setTempChapter(e.target.value)}
                onBlur={handleChapterSubmit}
                autoFocus
                style={{
                  width: '50px',
                  background: '#0f172a',
                  color: '#f59e0b',
                  border: '1px solid #f59e0b',
                  textAlign: 'center',
                  fontFamily: 'Silkscreen',
                  fontSize: '13px'
                }}
              />
            </form>
          ) : (
            <span
              onClick={() => { setTempChapter(String(chapter)); setIsEditingChapter(true); }}
              className="font-pixel"
              style={{ color: '#f59e0b', fontSize: '14px', cursor: 'pointer', padding: '0 4px' }}
              title="Click to manually edit chapter"
            >
              [{chapter}]
            </span>
          )}

          <button
            onClick={() => onChapterChange(chapter + 1)}
            className="pixel-btn"
            style={{ background: '#1e293b', color: '#e2e8f0', border: 'none', borderRadius: '3px', width: '22px', height: '22px', fontSize: '12px' }}
          >
            +
          </button>
        </div>

        <span style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>
          / {currentSeries.totalChapters}
        </span>
      </div>

      {/* Low Confidence Reader Notice */}
      {isLowConfidence && (
        <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', fontSize: '10px', color: '#fef08a' }}>
          ⚠ Detected {detectedContext?.seriesTitle} Ch. {detectedContext?.chapterNumber}. Adjust above if reading another chapter.
        </div>
      )}
    </div>
  );
}
