import React, { useState, useEffect } from 'react';
import { SnapshotCharacter } from '../../shared/types';

interface CharacterViewProps {
  characters: SnapshotCharacter[];
  chapter: number;
  onSelectForDuel?: (charId: string) => void;
}

export function CharacterView({ characters, chapter, onSelectForDuel }: CharacterViewProps) {
  const [search, setSearch] = useState('');
  const [selectedChar, setSelectedChar] = useState<SnapshotCharacter | null>(null);

  // Auto-close selected character and clear search whenever series/characters change
  useEffect(() => {
    setSelectedChar(null);
    setSearch('');
  }, [characters]);

  const filtered = characters.filter((c) =>
    c.displayName.toLowerCase().includes(search.toLowerCase()) ||
    c.factionName.toLowerCase().includes(search.toLowerCase()) ||
    c.realmName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search character or faction..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '6px 10px',
          background: '#070b16',
          border: '1px solid #1e293b',
          borderRadius: '4px',
          color: '#e2e8f0',
          fontSize: '11px',
          outline: 'none',
          fontFamily: 'monospace'
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
        <span>KNOWN AT CH. {chapter} ({filtered.length} FIGURES)</span>
        <span>SPOILERS PROTECTED</span>
      </div>

      {/* Selected Character Drawer / Card */}
      {selectedChar && (
        <div
          style={{
            background: '#0c1224',
            border: '1.5px solid #f59e0b',
            borderRadius: '6px',
            padding: '12px',
            position: 'relative'
          }}
        >
          <button
            onClick={() => setSelectedChar(null)}
            style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                border: '1px solid #f59e0b'
              }}
            >
              {selectedChar.isMasked ? '👁' : '👤'}
            </div>

            <div>
              <div className="font-pixel" style={{ color: '#ffffff', fontSize: '13px', fontWeight: 'bold' }}>
                {selectedChar.displayName}
              </div>
              <div style={{ fontSize: '10px', color: '#f59e0b', fontFamily: 'monospace' }}>
                {selectedChar.realmName}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px', marginTop: '6px', background: '#040814', padding: '8px', borderRadius: '4px' }}>
            <div>
              <span style={{ color: '#64748b' }}>FACTION:</span>
              <div style={{ color: '#cbd5e1' }}>{selectedChar.factionName}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>LOCATION:</span>
              <div style={{ color: '#cbd5e1' }}>{selectedChar.locationName}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>DEBUT:</span>
              <div style={{ color: '#cbd5e1' }}>Chapter {selectedChar.firstAppearance}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>STATUS:</span>
              <div style={{ color: '#10b981' }}>{selectedChar.status}</div>
            </div>
          </div>

          {onSelectForDuel && (
            <button
              onClick={() => onSelectForDuel(selectedChar.id)}
              className="pixel-btn"
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '6px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                fontSize: '10px',
                borderRadius: '4px'
              }}
            >
              ⚔ CHALLENGE IN MINI DUEL
            </button>
          )}
        </div>
      )}

      {/* Character Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.map((char) => {
          const isSelected = selectedChar?.id === char.id;
          return (
            <div
              key={char.id}
              onClick={() => setSelectedChar(char)}
              className="pixel-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: isSelected ? '#0f172a' : '#070b16',
                border: isSelected ? '1px solid #f59e0b' : '1px solid #1e293b',
                borderRadius: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>
                  {char.isMasked ? '👁' : '👤'}
                </span>
                <div>
                  <div className="font-pixel" style={{ fontSize: '11px', color: char.isMasked ? '#f59e0b' : '#ffffff' }}>
                    {char.displayName}
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {char.realmName} • {char.factionName}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    padding: '2px 5px',
                    background: '#0f172a',
                    borderRadius: '3px',
                    border: '1px solid #334155',
                    color: '#38bdf8'
                  }}
                >
                  PWR {char.powerScore}
                </span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '11px', fontFamily: 'Silkscreen' }}>
            ░ NO CHARACTERS FOUND AT CH. {chapter} ░
          </div>
        )}
      </div>
    </div>
  );
}
