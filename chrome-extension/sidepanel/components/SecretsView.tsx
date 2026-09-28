import React from 'react';
import { SnapshotMilestone } from '../../shared/types';

interface SecretsViewProps {
  milestones: SnapshotMilestone[];
  chapter: number;
}

export function SecretsView({ milestones, chapter }: SecretsViewProps) {
  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Protected Banner */}
      <div
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '6px',
          padding: '8px 10px',
          fontSize: '10px',
          color: '#fde047',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span>🔒</span>
        <span>
          CANONICAL REVELATIONS UP TO CH. {chapter}. Future plot twists remain locked.
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {milestones.map((m) => (
          <div
            key={m.id}
            style={{
              background: '#070b16',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-pixel" style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>
                {m.title}
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  padding: '2px 5px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: '#f59e0b',
                  borderRadius: '3px'
                }}
              >
                CH. {m.chapter}
              </span>
            </div>

            <p style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>
              {m.description}
            </p>
          </div>
        ))}

        {milestones.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '11px', fontFamily: 'Silkscreen' }}>
            ░ NO REVELATIONS RECORDED PRIOR TO CH. {chapter} ░
          </div>
        )}
      </div>
    </div>
  );
}
