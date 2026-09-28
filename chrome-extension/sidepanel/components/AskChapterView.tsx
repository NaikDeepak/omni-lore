import React, { useState } from 'react';
import { TemporalSnapshot, SnapshotCharacter } from '../../shared/types';

interface AskChapterViewProps {
  snapshot: TemporalSnapshot;
  onSelectCharacter?: (charId: string) => void;
}

interface QAPair {
  question: string;
  answer: string;
  source: string;
  timestamp: string;
}

export function AskChapterView({ snapshot, onSelectCharacter }: AskChapterViewProps) {
  const [customQuery, setCustomQuery] = useState('');
  const [history, setHistory] = useState<QAPair[]>([
    {
      question: `Who is the strongest figure known at Chapter ${snapshot.chapter}?`,
      answer: computeStrongest(snapshot),
      source: 'Temporal Power Tier Registry',
      timestamp: 'NOW'
    }
  ]);

  const suggestedQuestions = [
    `Who is the strongest figure at Ch. ${snapshot.chapter}?`,
    `What factions are most active right now?`,
    `What major breakthrough happened recently?`,
    `Are there any unmasked secrets at this point?`,
    `Who are the top allies of the main protagonist?`
  ];

  function handleAsk(query: string) {
    if (!query.trim()) return;

    let answer = '';
    let source = 'Temporal Knowledge Graph';
    const qLower = query.toLowerCase();

    if (qLower.includes('strongest') || qLower.includes('power') || qLower.includes('rank') || qLower.includes('tier')) {
      answer = computeStrongest(snapshot);
      source = 'Power Ladder Engine';
    } else if (qLower.includes('faction') || qLower.includes('sect') || qLower.includes('guild') || qLower.includes('clan')) {
      answer = computeFactions(snapshot);
      source = 'Faction Web Registry';
    } else if (qLower.includes('breakthrough') || qLower.includes('event') || qLower.includes('recent') || qLower.includes('history')) {
      answer = computeRecentEvent(snapshot);
      source = 'Story Timeline Engine';
    } else if (qLower.includes('secret') || qLower.includes('mystery') || qLower.includes('hidden') || qLower.includes('mask')) {
      answer = computeSecrets(snapshot);
      source = 'Identity Unmasking Ledger';
    } else if (qLower.includes('all') || qLower.includes('friend') || qLower.includes('partner') || qLower.includes('disciple')) {
      answer = computeAllies(snapshot);
      source = 'Relationship Web';
    } else {
      // Search for specific character in query
      const matchedChar = snapshot.characters.find(c => 
        qLower.includes(c.displayName.toLowerCase()) || 
        qLower.includes(c.name.toLowerCase()) ||
        c.aliases.some(a => qLower.includes(a.toLowerCase()))
      );

      if (matchedChar) {
        answer = `${matchedChar.displayName} (${matchedChar.realmName}): Member of ${matchedChar.factionName}, currently active in ${matchedChar.locationName}. Status: ${matchedChar.status}. Power rating: ${matchedChar.powerScore}/100.`;
        if (matchedChar.isMasked) {
          answer += ` Note: True identity remains canonically unrevealed at Chapter ${snapshot.chapter}.`;
        }
        source = `Character Dossier (${matchedChar.id})`;
      } else {
        answer = `Based on canon up to Chapter ${snapshot.chapter}, no direct match was found for "${query}". Future events or debut entities past Chapter ${snapshot.chapter} remain shielded to preserve zero-spoiler integrity.`;
        source = 'Zero-Spoiler Boundary Gate';
      }
    }

    setHistory(prev => [
      {
        question: query,
        answer,
        source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ]);
    setCustomQuery('');
  }

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* HUD Header */}
      <div style={{ background: '#070b16', border: '1px solid #1e293b', borderRadius: '6px', padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold' }}>
            🔮 OMNILORE ORACLE · CH. {snapshot.chapter}
          </div>
          <div style={{ fontSize: '9px', background: '#064e3b', color: '#6ee7b7', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>
            STRICT ZERO-SPOILER
          </div>
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.4' }}>
          Ask questions grounded exclusively in lore revealed through Chapter {snapshot.chapter}. Future developments are sealed behind the temporal fog of war.
        </div>
      </div>

      {/* Suggested Questions Quick Chips */}
      <div>
        <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace', marginBottom: '6px' }}>
          SUGGESTED CHAPTER QUERIES
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              style={{
                background: '#0c1224',
                border: '1px solid #1e293b',
                borderRadius: '4px',
                padding: '6px 10px',
                textAlign: 'left',
                color: '#cbd5e1',
                fontSize: '10px',
                cursor: 'pointer',
                fontFamily: 'monospace',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{q}</span>
              <span style={{ color: '#10b981' }}>↵</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(customQuery);
        }}
        style={{ display: 'flex', gap: '6px' }}
      >
        <input
          type="text"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder={`Ask about characters, factions, or powers at Ch. ${snapshot.chapter}...`}
          style={{
            flex: 1,
            background: '#030712',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: '#f8fafc',
            padding: '7px 10px',
            fontSize: '11px',
            fontFamily: 'monospace',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!customQuery.trim()}
          style={{
            background: customQuery.trim() ? '#10b981' : '#1e293b',
            color: customQuery.trim() ? '#04150e' : '#64748b',
            border: 'none',
            borderRadius: '4px',
            padding: '7px 12px',
            fontWeight: 'bold',
            fontSize: '10px',
            fontFamily: 'monospace',
            cursor: customQuery.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          ASK
        </button>
      </form>

      {/* Q&A Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>
          GROUNDED REVELATIONS ({history.length})
        </div>
        {history.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: '#0c1322',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', fontFamily: 'monospace' }}>
                Q: {item.question}
              </span>
              <span style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>
                {item.timestamp}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: '1.45', fontFamily: 'sans-serif' }}>
              {item.answer}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #131d36' }}>
              <span style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>
                SOURCE: {item.source}
              </span>
              <span style={{ fontSize: '9px', color: '#10b981', fontFamily: 'monospace' }}>
                🛡️ ZERO-SPOILER VERIFIED
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helpers
function computeStrongest(snapshot: TemporalSnapshot): string {
  if (snapshot.characters.length === 0) return 'No characters recorded at this chapter.';
  const sorted = [...snapshot.characters].sort((a, b) => b.powerScore - a.powerScore);
  const top = sorted.slice(0, 3);
  const names = top.map(c => `${c.displayName} (${c.realmName} · Rating ${c.powerScore})`).join(', ');
  return `The highest-ranking canonical figures known at Chapter ${snapshot.chapter} are: ${names}.`;
}

function computeFactions(snapshot: TemporalSnapshot): string {
  const factionCounts: Record<string, number> = {};
  snapshot.characters.forEach(c => {
    factionCounts[c.factionName] = (factionCounts[c.factionName] || 0) + 1;
  });
  const entries = Object.entries(factionCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  if (entries.length === 0) return 'No dominant factions established yet.';
  const desc = entries.map(([name, count]) => `${name} (${count} active figures)`).join(', ');
  return `Prominent active factions at Chapter ${snapshot.chapter}: ${desc}.`;
}

function computeRecentEvent(snapshot: TemporalSnapshot): string {
  if (snapshot.milestones.length === 0) return `No major recorded world breakthroughs occur before Chapter ${snapshot.chapter}.`;
  const sorted = [...snapshot.milestones].sort((a, b) => b.chapter - a.chapter);
  const recent = sorted[0];
  return `Most pivotal historical event by Chapter ${snapshot.chapter}: [Ch. ${recent.chapter}] "${recent.title}" — ${recent.description}`;
}

function computeSecrets(snapshot: TemporalSnapshot): string {
  const masked = snapshot.characters.filter(c => c.isMasked);
  if (masked.length === 0) {
    return `All currently debuted characters at Chapter ${snapshot.chapter} have public canonical identities. ${snapshot.unrevealedCount} characters have not yet made their first canonical appearance.`;
  }
  const maskedNames = masked.map(c => `"${c.displayName}"`).join(', ');
  return `${masked.length} entity operating under concealed identity at Chapter ${snapshot.chapter}: ${maskedNames}. True identity will only unlock at canonical unmasking chapters.`;
}

function computeAllies(snapshot: TemporalSnapshot): string {
  const allyTies = snapshot.relationships.filter(r => r.category === 'ally' || r.category === 'disciple' || r.category === 'master' || r.category === 'family');
  if (allyTies.length === 0) return `No formal alliance pacts recorded in the active relationship ledger for Chapter ${snapshot.chapter}.`;
  const sample = allyTies.slice(0, 3).map(r => `${r.sourceName ?? r.sourceId} ↔ ${r.targetName} (${r.label})`).join('; ');
  return `Known friendly bonds at Chapter ${snapshot.chapter}: ${sample}.`;
}
