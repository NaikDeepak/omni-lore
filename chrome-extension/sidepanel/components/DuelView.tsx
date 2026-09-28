import React, { useState } from 'react';
import { SnapshotCharacter, MiniDuelResult } from '../../shared/types';
import { ExtensionTemporalClient } from '../../temporal/temporal-client';

interface DuelViewProps {
  characters: SnapshotCharacter[];
  seriesSlug: string;
  chapter: number;
  initialFighterAId?: string;
}

export function DuelView({ characters, seriesSlug, chapter, initialFighterAId }: DuelViewProps) {
  const [fighterAId, setFighterAId] = useState<string>(initialFighterAId ?? (characters[0]?.id ?? ''));
  const [fighterBId, setFighterBId] = useState<string>(characters[1]?.id ?? (characters[0]?.id ?? ''));
  const [duelResult, setDuelResult] = useState<MiniDuelResult | null>(null);

  const fighterA = characters.find(c => c.id === fighterAId);
  const fighterB = characters.find(c => c.id === fighterBId);

  const handleSimulate = () => {
    if (!fighterAId || !fighterBId) return;
    const result = ExtensionTemporalClient.runMiniDuel(seriesSlug, fighterAId, fighterBId, chapter);
    setDuelResult(result);
  };

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Disclaimer Banner */}
      <div
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          padding: '8px 10px',
          fontSize: '9.5px',
          color: '#fca5a5',
          textAlign: 'center'
        }}
      >
        <span className="font-pixel" style={{ display: 'block', fontWeight: 'bold' }}>
          ⚔ MINI DUEL ARENA (NON-CANON)
        </span>
        <span>
          Simulation evaluates strictly abilities & realms known at Chapter {chapter}.
        </span>
      </div>

      {/* Fighter Pickers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Fighter A */}
        <div style={{ background: '#070b16', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px' }}>
          <span style={{ fontSize: '9px', color: '#38bdf8', fontFamily: 'monospace' }}>COMBATANT A:</span>
          <select
            value={fighterAId}
            onChange={(e) => setFighterAId(e.target.value)}
            style={{
              width: '100%',
              background: '#040814',
              color: '#ffffff',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '4px',
              fontSize: '10px',
              marginTop: '4px',
              fontFamily: 'monospace'
            }}
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
          {fighterA && (
            <div style={{ marginTop: '6px', fontSize: '9px', color: '#94a3b8' }}>
              <div>{fighterA.realmName}</div>
              <div style={{ color: '#38bdf8' }}>PWR: {fighterA.powerScore}</div>
            </div>
          )}
        </div>

        {/* Fighter B */}
        <div style={{ background: '#070b16', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px' }}>
          <span style={{ fontSize: '9px', color: '#f59e0b', fontFamily: 'monospace' }}>COMBATANT B:</span>
          <select
            value={fighterBId}
            onChange={(e) => setFighterBId(e.target.value)}
            style={{
              width: '100%',
              background: '#040814',
              color: '#ffffff',
              border: '1px solid #334155',
              borderRadius: '4px',
              padding: '4px',
              fontSize: '10px',
              marginTop: '4px',
              fontFamily: 'monospace'
            }}
          >
            {characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
          {fighterB && (
            <div style={{ marginTop: '6px', fontSize: '9px', color: '#94a3b8' }}>
              <div>{fighterB.realmName}</div>
              <div style={{ color: '#f59e0b' }}>PWR: {fighterB.powerScore}</div>
            </div>
          )}
        </div>
      </div>

      {/* Simulate Button */}
      <button
        onClick={handleSimulate}
        className="pixel-btn"
        style={{
          width: '100%',
          padding: '8px',
          background: 'linear-gradient(90deg, #dc2626, #b91c1c)',
          color: '#ffffff',
          border: '1px solid #f87171',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '1px'
        }}
      >
        ⚔ SIMULATE CLASH (CH. {chapter} PARITY)
      </button>

      {/* Duel Combat Log */}
      {duelResult && (
        <div
          style={{
            background: '#070b16',
            border: '1.5px solid #ef4444',
            borderRadius: '6px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ textAlign: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
            <span className="font-pixel" style={{ color: '#fbbf24', fontSize: '11px' }}>
              VICTORY: {duelResult.winner.displayName.toUpperCase()}
            </span>
            <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
              {duelResult.verdict}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '9.5px', fontFamily: 'monospace' }}>
            {duelResult.rounds.map((r) => (
              <div
                key={r.roundNumber}
                style={{
                  background: '#040814',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid #1e293b'
                }}
              >
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>ROUND {r.roundNumber}: </span>
                <span style={{ color: '#e2e8f0' }}>{r.attackerName} {r.actionDescription}</span>
                <span style={{ color: '#f87171', marginLeft: '6px' }}>(-{r.damage} HP)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
