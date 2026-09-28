import React, { useState } from 'react';
import { SnapshotRelationship } from '../../shared/types';

interface RelationshipsViewProps {
  relationships: SnapshotRelationship[];
  chapter: number;
}

export function RelationshipsView({ relationships, chapter }: RelationshipsViewProps) {
  const [filter, setFilter] = useState<string>('all');

  const filtered = relationships.filter((r) => {
    if (filter === 'all') return true;
    return r.category === filter;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'master':
      case 'disciple':
        return '#c084fc';
      case 'ally':
      case 'family':
        return '#38bdf8';
      case 'rival':
      case 'enemy':
        return '#f87171';
      default:
        return '#fbbf24';
    }
  };

  return (
    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['all', 'ally', 'master', 'rival', 'enemy', 'family'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="pixel-btn"
            style={{
              padding: '3px 7px',
              fontSize: '9px',
              borderRadius: '3px',
              background: filter === cat ? '#1e293b' : '#070b14',
              border: filter === cat ? '1px solid #f59e0b' : '1px solid #1e293b',
              color: filter === cat ? '#f59e0b' : '#94a3b8',
              textTransform: 'uppercase'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.map((rel) => (
          <div
            key={rel.id}
            style={{
              background: '#070b16',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '8px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#94a3b8' }}>•</span>
              <span className="font-pixel" style={{ color: '#e2e8f0' }}>{rel.targetName}</span>
            </div>

            <span
              style={{
                fontSize: '9px',
                fontFamily: 'Silkscreen',
                color: getCategoryColor(rel.category),
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '2px 6px',
                borderRadius: '3px',
                border: `1px solid ${getCategoryColor(rel.category)}40`
              }}
            >
              {rel.label.toUpperCase()}
            </span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: '11px', fontFamily: 'Silkscreen' }}>
            ░ NO ACTIVE TIES IN THIS CATEGORY AT CH. {chapter} ░
          </div>
        )}
      </div>
    </div>
  );
}
