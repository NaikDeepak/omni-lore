import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ChapterContext, ShieldLevel, SnapshotCharacter } from '../shared/types';
import { DEFAULT_SERIES_SLUG, DEFAULT_CHAPTER } from '../shared/constants';
import { ExtensionTemporalClient } from '../temporal/temporal-client';
import { HeaderHud } from './components/HeaderHud';
import { SpoilerShieldBadge } from './components/SpoilerShieldBadge';
import { NavigationHud, ActiveNavTab } from './components/NavigationHud';
import { CharacterView } from './components/CharacterView';
import { PowerView } from './components/PowerView';
import { SecretsView } from './components/SecretsView';
import { RelationshipsView } from './components/RelationshipsView';
import { DuelView } from './components/DuelView';
import { AskChapterView } from './components/AskChapterView';
import { WhoIsThisDrawer } from './components/WhoIsThisDrawer';

export function App() {
  const [seriesSlug, setSeriesSlug] = useState<string>(DEFAULT_SERIES_SLUG);
  const [chapter, setChapter] = useState<number>(DEFAULT_CHAPTER);
  const [shieldLevel, setShieldLevel] = useState<ShieldLevel>('SAFE');
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('characters');
  const [detectedContext, setDetectedContext] = useState<ChapterContext | null>(null);
  const [duelInitialFighter, setDuelInitialFighter] = useState<string | undefined>(undefined);
  const [whoIsThisData, setWhoIsThisData] = useState<{
    query: string;
    character: SnapshotCharacter | null;
  } | null>(null);

  // Compute Temporal Snapshot reactively
  const snapshot = useMemo(() => {
    return ExtensionTemporalClient.getSnapshot(seriesSlug, chapter, shieldLevel);
  }, [seriesSlug, chapter, shieldLevel]);

  // Initial load from chrome.storage.session
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.session) {
      chrome.storage.session.get(['activeContext', 'lastSelection'], (data) => {
        if (data.activeContext) {
          const ctx = data.activeContext as ChapterContext;
          setDetectedContext(ctx);
          if (ctx.seriesSlug) setSeriesSlug(ctx.seriesSlug);
          if (ctx.chapterNumber) setChapter(ctx.chapterNumber);
        }
        if (data.lastSelection && typeof data.lastSelection === 'string') {
          handleWhoIsThisLookup(data.lastSelection, seriesSlug, chapter, shieldLevel);
          // clear lastSelection to prevent re-opening on reload
          chrome.storage.session.remove('lastSelection');
        }
      });

      // Storage change listener
      const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'session') {
          if (changes.activeContext?.newValue) {
            const newCtx = changes.activeContext.newValue as ChapterContext;
            setDetectedContext(newCtx);
            if (newCtx.seriesSlug) setSeriesSlug(newCtx.seriesSlug);
            if (newCtx.chapterNumber) setChapter(newCtx.chapterNumber);
          }
          if (changes.lastSelection?.newValue) {
            handleWhoIsThisLookup(changes.lastSelection.newValue, seriesSlug, chapter, shieldLevel);
            chrome.storage.session.remove('lastSelection');
          }
        }
      };

      chrome.storage.onChanged.addListener(storageListener);
      return () => chrome.storage.onChanged.removeListener(storageListener);
    }
  }, [seriesSlug, chapter, shieldLevel]);

  // Message listener for runtime messages
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const messageListener = (msg: any) => {
        if (msg.type === 'CHAPTER_DETECTED' && msg.payload) {
          const ctx = msg.payload as ChapterContext;
          setDetectedContext(ctx);
          if (ctx.seriesSlug) setSeriesSlug(ctx.seriesSlug);
          if (ctx.chapterNumber) setChapter(ctx.chapterNumber);
        } else if (msg.type === 'WHO_IS_THIS' && msg.payload?.text) {
          handleWhoIsThisLookup(msg.payload.text, seriesSlug, chapter, shieldLevel);
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);
      return () => chrome.runtime.onMessage.removeListener(messageListener);
    }
  }, [seriesSlug, chapter, shieldLevel]);

  const handleWhoIsThisLookup = (query: string, currentSeries: string, currentChapter: number, currentShield: ShieldLevel) => {
    const matched = ExtensionTemporalClient.searchCharacter(currentSeries, query, currentChapter, currentShield);
    setWhoIsThisData({
      query,
      character: matched
    });
  };

  const handleLaunchDuel = (charId: string) => {
    setDuelInitialFighter(charId);
    setActiveTab('duel');
    setWhoIsThisData(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#040814',
        color: '#e2e8f0',
        fontFamily: "'JetBrains Mono', monospace",
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top HUD with Series Switcher & Chapter Controls */}
      <HeaderHud
        seriesSlug={seriesSlug}
        chapter={chapter}
        detectedContext={detectedContext}
        onSeriesChange={(slug) => {
          setSeriesSlug(slug);
          setWhoIsThisData(null);
          setDuelInitialFighter(undefined);
        }}
        onChapterChange={(ch) => setChapter(ch)}
      />

      {/* Spoiler Shield Badge Selector */}
      <div style={{ padding: '6px 14px', borderBottom: '1px solid #1e293b', background: '#060a18' }}>
        <SpoilerShieldBadge
          level={shieldLevel}
          chapter={chapter}
          onLevelChange={(lvl) => setShieldLevel(lvl)}
        />
      </div>

      {/* Tab Navigation */}
      <NavigationHud
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        unrevealedCount={snapshot.unrevealedCount}
      />

      {/* Tab Content Body (Scrollable) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: '#040814'
        }}
      >
        {activeTab === 'characters' && (
          <CharacterView
            key={seriesSlug}
            characters={snapshot.characters}
            chapter={chapter}
            onSelectForDuel={handleLaunchDuel}
          />
        )}
        {activeTab === 'power' && (
          <PowerView
            key={seriesSlug}
            tiers={snapshot.powerTiers}
            chapter={chapter}
          />
        )}
        {activeTab === 'secrets' && (
          <SecretsView
            key={seriesSlug}
            milestones={snapshot.milestones}
            chapter={chapter}
          />
        )}
        {activeTab === 'relationships' && (
          <RelationshipsView
            key={seriesSlug}
            relationships={snapshot.relationships}
            chapter={chapter}
          />
        )}
        {activeTab === 'duel' && (
          <DuelView
            key={seriesSlug}
            characters={snapshot.characters}
            seriesSlug={seriesSlug}
            chapter={chapter}
            initialFighterAId={duelInitialFighter}
          />
        )}
        {activeTab === 'ask' && (
          <AskChapterView
            key={seriesSlug}
            snapshot={snapshot}
            onSelectCharacter={handleLaunchDuel}
          />
        )}
      </div>

      {/* Who Is This? Selection Bottom Drawer */}
      {whoIsThisData && (
        <WhoIsThisDrawer
          query={whoIsThisData.query}
          character={whoIsThisData.character}
          chapter={chapter}
          universeSlug={seriesSlug}
          shieldLevel={shieldLevel}
          onClose={() => setWhoIsThisData(null)}
          onOpenDuel={handleLaunchDuel}
        />
      )}
    </div>
  );
}

// Mount React Root
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
