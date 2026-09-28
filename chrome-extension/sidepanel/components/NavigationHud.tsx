import React from 'react';

export type ActiveNavTab = 'characters' | 'power' | 'secrets' | 'relationships' | 'duel' | 'ask';

interface NavigationHudProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  unrevealedCount: number;
}

export function NavigationHud({ activeTab, onTabChange, unrevealedCount }: NavigationHudProps) {
  const tabs = [
    { id: 'characters', label: '👤 ROSTER' },
    { id: 'power', label: '⚡ POWER' },
    { id: 'secrets', label: '🔐 SECRETS' },
    { id: 'relationships', label: '🕸 TIES' },
    { id: 'duel', label: '⚔ DUEL' },
    { id: 'ask', label: '💬 ASK' }
  ] as const;

  return (
    <div
      style={{
        display: 'flex',
        overflowX: 'auto',
        borderBottom: '1px solid #1e293b',
        background: '#040814',
        padding: '6px 8px',
        gap: '4px'
      }}
    >
      {tabs.map((t) => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className="pixel-btn"
            style={{
              padding: '5px 8px',
              fontSize: '10px',
              borderRadius: '4px',
              border: isActive ? '1px solid #f59e0b' : '1px solid #1e293b',
              background: isActive ? 'rgba(245, 158, 11, 0.2)' : '#070b16',
              color: isActive ? '#fbbf24' : '#94a3b8',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
