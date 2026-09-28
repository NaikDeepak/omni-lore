import React from 'react';
import { SnapshotCharacter, ShieldLevel } from '../../shared/types';

interface WhoIsThisDrawerProps {
  query: string;
  character: SnapshotCharacter | null;
  chapter: number;
  universeSlug: string;
  shieldLevel: ShieldLevel;
  onClose: () => void;
  onOpenDuel?: (charId: string) => void;
}

export function WhoIsThisDrawer({
  query,
  character,
  chapter,
  universeSlug,
  shieldLevel,
  onClose,
  onOpenDuel
}: WhoIsThisDrawerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#090d1a',
        borderTop: '2px solid #38bdf8',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.85)',
        padding: '14px',
        zIndex: 100,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: '#38bdf8', fontSize: '13px' }}>🔍</span>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            TEXT SELECTION LOOKUP
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'monospace',
            padding: '2px 6px'
          }}
          title="Close lookup drawer"
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '10px', background: '#030712', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e293b' }}>
        <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>QUERY: </span>
        <span style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 'bold' }}>"{query}"</span>
      </div>

      {character ? (
        <div style={{ background: '#0d1527', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                background: '#030712',
                border: '1.5px solid #38bdf8',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                overflow: 'hidden'
              }}
            >
              {character.avatarUrl ? (
                <img
                  src={character.avatarUrl}
                  alt={character.displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated' }}
                />
              ) : (
                '👤'
              )}
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#f8fafc', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {character.displayName}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                {character.title}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', fontFamily: 'monospace', marginBottom: '10px' }}>
            <div style={{ background: '#070b16', padding: '6px 8px', borderRadius: '4px' }}>
              <span style={{ color: '#64748b' }}>REALM: </span>
              <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{character.realmName}</span>
            </div>
            <div style={{ background: '#070b16', padding: '6px 8px', borderRadius: '4px' }}>
              <span style={{ color: '#64748b' }}>FACTION: </span>
              <span style={{ color: '#38bdf8' }}>{character.factionName}</span>
            </div>
            <div style={{ background: '#070b16', padding: '6px 8px', borderRadius: '4px' }}>
              <span style={{ color: '#64748b' }}>LOCATION: </span>
              <span style={{ color: '#e2e8f0' }}>{character.locationName}</span>
            </div>
            <div style={{ background: '#070b16', padding: '6px 8px', borderRadius: '4px' }}>
              <span style={{ color: '#64748b' }}>STATUS: </span>
              <span style={{ color: character.status.toLowerCase().includes('alive') ? '#34d399' : '#f87171' }}>
                {character.status}
              </span>
            </div>
          </div>

          {character.notableAbilities && character.notableAbilities.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace', marginBottom: '4px' }}>
                KNOWN TECHNIQUES AT CH. {chapter}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {character.notableAbilities.map((ab, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#131d36',
                      border: '1px solid #1e293b',
                      color: '#cbd5e1',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontFamily: 'monospace'
                    }}
                  >
                    {ab}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            {onOpenDuel && (
              <button
                onClick={() => onOpenDuel(character.id)}
                style={{
                  flex: 1,
                  background: '#f59e0b',
                  color: '#05070f',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontFamily: 'monospace'
                }}
              >
                ⚔️ LAUNCH IN DUEL
              </button>
            )}
            <a
              href={`https://omnilore.dev/${universeSlug}?char=${character.id}&ch=${chapter}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                background: '#1e293b',
                color: '#e2e8f0',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '10px',
                textAlign: 'center',
                textDecoration: 'none',
                fontFamily: 'monospace'
              }}
            >
              🌐 ATLAS LORE ↗
            </a>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#070b16',
            border: '1px dashed #334155',
            borderRadius: '6px',
            padding: '14px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '20px', marginBottom: '6px' }}>🛡️</div>
          <div style={{ fontSize: '11px', color: '#f1f5f9', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '4px' }}>
            NO CANON DEBUT AT CH. {chapter}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.4', marginBottom: '10px' }}>
            OmniLore's Spoiler Shield is active ({shieldLevel.toUpperCase()}). Either this entity debuts in a future chapter, or the name does not match a recorded canonical figure in {universeSlug.replace('-', ' ').toUpperCase()}.
          </div>
          <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace' }}>
            ADVANCE CHAPTER SCRUBBER IF YOU ARE FURTHER AHEAD
          </div>
        </div>
      )}
    </div>
  );
}
