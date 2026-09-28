import React, { useState } from 'react';
import { ShieldLevel } from '../../shared/types';

interface SpoilerShieldBadgeProps {
  level: ShieldLevel;
  chapter: number;
  onLevelChange: (level: ShieldLevel) => void;
}

export function SpoilerShieldBadge({ level, chapter, onLevelChange }: SpoilerShieldBadgeProps) {
  const [showModal, setShowModal] = useState(false);

  const getBadgeStyle = () => {
    switch (level) {
      case 'SAFE':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          text: '#6ee7b7',
          icon: '🛡️',
          label: 'SHIELD: SAFE'
        };
      case 'CONTEXT':
        return {
          bg: 'rgba(234, 179, 8, 0.15)',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          text: '#fde047',
          icon: '⚠️',
          label: 'SHIELD: CONTEXT'
        };
      case 'FULL':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          text: '#fca5a5',
          icon: '🔥',
          label: 'SHIELD: OFF (FULL LORE)'
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="pixel-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: badge.bg,
          border: badge.border,
          color: badge.text,
          fontSize: '10px',
          cursor: 'pointer'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{badge.icon}</span>
          <span className="font-pixel">{badge.label}</span>
        </span>
        <span style={{ fontSize: '9px', opacity: 0.8, fontFamily: 'monospace' }}>
          [CHANGE LEVEL ⚙]
        </span>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#0c1220',
              border: '1.5px solid #334155',
              borderRadius: '8px',
              padding: '16px',
              maxWidth: '320px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-pixel" style={{ color: '#f59e0b', fontSize: '12px' }}>
                SPOILER SHIELD LEVEL
              </span>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              Controls what information is visible in the side panel while reading Chapter {chapter}:
            </p>

            {/* Level 1: SAFE */}
            <div
              onClick={() => { onLevelChange('SAFE'); setShowModal(false); }}
              className="pixel-btn"
              style={{
                padding: '10px',
                borderRadius: '6px',
                background: level === 'SAFE' ? 'rgba(16, 185, 129, 0.2)' : '#070b14',
                border: level === 'SAFE' ? '1.5px solid #10b981' : '1px solid #1e293b',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6ee7b7', fontSize: '11px' }}>
                <span>🛡️</span>
                <strong className="font-pixel">SAFE (Recommended)</strong>
              </div>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                Strict zero spoilers. Hides any character, power breakthrough, or event after Ch. {chapter}.
              </p>
            </div>

            {/* Level 2: CONTEXT */}
            <div
              onClick={() => { onLevelChange('CONTEXT'); setShowModal(false); }}
              className="pixel-btn"
              style={{
                padding: '10px',
                borderRadius: '6px',
                background: level === 'CONTEXT' ? 'rgba(234, 179, 8, 0.2)' : '#070b14',
                border: level === 'CONTEXT' ? '1.5px solid #eab308' : '1px solid #1e293b',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fde047', fontSize: '11px' }}>
                <span>⚠️</span>
                <strong className="font-pixel">CONTEXT</strong>
              </div>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                Includes world lore and background history prior to Ch. {chapter}.
              </p>
            </div>

            {/* Level 3: FULL */}
            <div
              onClick={() => { onLevelChange('FULL'); setShowModal(false); }}
              className="pixel-btn"
              style={{
                padding: '10px',
                borderRadius: '6px',
                background: level === 'FULL' ? 'rgba(239, 68, 68, 0.2)' : '#070b14',
                border: level === 'FULL' ? '1.5px solid #ef4444' : '1px solid #1e293b',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fca5a5', fontSize: '11px' }}>
                <span>🔥</span>
                <strong className="font-pixel">FULL LORE (SPOILERS)</strong>
              </div>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                Unmasks all secrets, future forms, and final battle outcomes.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
