import React from 'react';
import { SnapshotTier } from '../../shared/types';

interface PowerViewProps {
  tiers: SnapshotTier[];
  chapter: number;
}

export function PowerView({ tiers, chapter }: PowerViewProps) {
  const renderPowerGauge = (score: number) => {
    const totalSegments = 10;
    const filled = Math.min(totalSegments, Math.max(1, Math.round((score / 100) * totalSegments)));
    const empty = totalSegments - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
        <span>POWER TIER HIERARCHY (CH. {chapter})</span>
        <span>HIGHEST $\rightarrow$ LOWEST</span>
      </div>

      {tiers.map((tier) => {
        const hasOccupants = tier.characters.length > 0;
        return (
          <div
            key={tier.id}
            style={{
              background: hasOccupants ? '#080d1a' : '#040711',
              border: hasOccupants ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1px solid #1e293b',
              borderRadius: '6px',
              padding: '10px',
              opacity: hasOccupants ? 1 : 0.6
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '9px', fontFamily: 'Silkscreen', color: '#f59e0b', background: '#1e293b', padding: '2px 5px', borderRadius: '3px' }}>
                  T{tier.order}
                </span>
                <span className="font-pixel" style={{ fontSize: '11px', color: '#ffffff', fontWeight: 'bold' }}>
                  {tier.name}
                </span>
              </div>
              <span style={{ fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>
                {tier.characters.length} OCCUPANT{tier.characters.length === 1 ? '' : 'S'}
              </span>
            </div>

            <p style={{ fontSize: '9.5px', color: '#64748b', marginBottom: '6px' }}>
              {tier.description}
            </p>

            {hasOccupants && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', borderTop: '1px solid #1e293b', paddingTop: '6px' }}>
                {tier.characters.map((char) => (
                  <div
                    key={char.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#040814',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}
                  >
                    <span className="font-pixel" style={{ color: char.isMasked ? '#f59e0b' : '#cbd5e1' }}>
                      {char.displayName}
                    </span>
                    <span style={{ fontFamily: 'monospace', color: '#38bdf8', letterSpacing: '1px', fontSize: '9px' }}>
                      {renderPowerGauge(char.powerScore)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
