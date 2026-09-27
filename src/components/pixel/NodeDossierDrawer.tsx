'use client';

import React from 'react';
import { GraphNode, GraphEdge } from '@/projections/relationship-web';
import { PixelAvatar } from './PixelAvatar';
import { X, Shield, Swords, Compass, ArrowRight, ArrowLeft, ArrowRightLeft, Users, ExternalLink } from 'lucide-react';

interface NodeDossierDrawerProps {
  node: GraphNode;
  allNodes: GraphNode[];
  edges: GraphEdge[];
  userChapter: number;
  seriesSlug: string;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  onJumpToJourney?: (characterId: string) => void;
  onSelectForDuel?: (characterId: string) => void;
}

export function NodeDossierDrawer({
  node,
  allNodes,
  edges,
  userChapter,
  seriesSlug,
  onClose,
  onSelectNode,
  onJumpToJourney,
  onSelectForDuel,
}: NodeDossierDrawerProps) {
  const isFaction = node.type === 'faction';

  // Find all incident edges
  const incidentEdges = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );

  // Find affiliated members if this is a faction
  const factionMembers = isFaction
    ? allNodes.filter((n) => n.type === 'character' && n.faction_id === node.id)
    : [];

  // Find parent faction node if this is a character
  const parentFaction = !isFaction && node.faction_id
    ? allNodes.find((n) => n.id === node.faction_id)
    : null;

  return (
    <div className="rounded-2xl border-2 border-slate-700 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md space-y-4 font-mono animate-in fade-in slide-in-from-right duration-200">
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <PixelAvatar
            id={node.id}
            name={node.label}
            size={48}
            isMasked={node.isMasked}
            avatarUrl={node.avatar_url}
          />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[9px] font-pixel px-2 py-0.5 rounded border uppercase ${
                  isFaction
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                }`}
              >
                {isFaction ? 'FACTION POWER' : 'CHARACTER DOSSIER'}
              </span>
              {node.isMasked && (
                <span className="text-[9px] font-pixel text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-600">
                  MASKED IDENTITY
                </span>
              )}
            </div>
            <h3 className="text-base font-pixel font-bold text-white mt-1">
              {node.label}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Close Dossier"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      {node.description && (
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          {node.description}
        </p>
      )}

      {/* Character Specific: Affiliated Faction & Action Buttons */}
      {!isFaction && (
        <div className="space-y-3">
          {parentFaction && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
              <div className="flex items-center gap-2 text-xs">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400 text-[11px]">FACTION:</span>
                <span className="font-pixel text-amber-300 text-xs">{parentFaction.label}</span>
              </div>
              <button
                onClick={() => onSelectNode(parentFaction.id)}
                className="text-[10px] font-pixel text-amber-400 hover:text-amber-200 transition underline flex items-center gap-1"
              >
                VIEW FACTION <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {onJumpToJourney && (
              <button
                onClick={() => onJumpToJourney(node.id)}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-pixel text-xs transition border border-indigo-400 shadow-md"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>VIEW JOURNEY</span>
              </button>
            )}

            {onSelectForDuel && (
              <button
                onClick={() => onSelectForDuel(node.id)}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-pixel text-xs transition border border-amber-400 shadow-md"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>SELECT IN DUEL</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Faction Specific: Roster of Members */}
      {isFaction && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-1">
            <span className="font-pixel text-[11px] text-amber-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> ACTIVE ROSTER ({factionMembers.length})
            </span>
          </div>

          {factionMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {factionMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onSelectNode(member.id)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition text-left"
                >
                  <PixelAvatar
                    id={member.id}
                    name={member.label}
                    size={28}
                    avatarUrl={member.avatar_url}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-pixel text-xs text-white truncate">{member.label}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-[11px] font-pixel text-slate-500 py-3 text-center bg-slate-950/40 rounded-xl border border-slate-800">
              ░░ NO MEMBERS DISCLOSED AS OF CH {userChapter} ░░
            </div>
          )}
        </div>
      )}

      {/* Active Relationship Ties */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
          <span className="font-pixel text-[11px] text-cyan-400">
            ACTIVE LORE TIES ({incidentEdges.length})
          </span>
          <span className="text-[10px] text-slate-500">AT CH {userChapter}</span>
        </div>

        {incidentEdges.length > 0 ? (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {incidentEdges.map((edge) => {
              const isOutgoing = edge.source === node.id;
              const otherPartyId = isOutgoing ? edge.target : edge.source;
              const otherParty = allNodes.find((n) => n.id === otherPartyId);
              if (!otherParty) return null;

              return (
                <div
                  key={edge.id}
                  onClick={() => onSelectNode(otherParty.id)}
                  className="cursor-pointer flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-600 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PixelAvatar
                      id={otherParty.id}
                      name={otherParty.label}
                      size={26}
                      avatarUrl={otherParty.avatar_url}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-pixel text-white truncate">
                        {otherParty.label}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {edge.label || edge.predicate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500 shrink-0">
                    {isOutgoing ? (
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] font-pixel text-slate-500 py-3 text-center bg-slate-950/40 rounded-xl border border-slate-800">
            ░░ NO ACTIVE CONNECTIONS AT CH {userChapter} ░░
          </div>
        )}
      </div>
    </div>
  );
}
