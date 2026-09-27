'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { GraphNode, GraphEdge } from '@/projections/relationship-web';
import { ZoomIn, ZoomOut, RotateCcw, Shield, Users, Sparkles, Info } from 'lucide-react';

interface PixelNetworkCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onDoubleSelectCharacter?: (characterId: string) => void;
  seriesSlug: string;
  userChapter: number;
}

interface NodePosition {
  x: number;
  y: number;
  node: GraphNode;
}

export function PixelNetworkCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onDoubleSelectCharacter,
  seriesSlug,
  userChapter,
}: PixelNetworkCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & Zoom Engine State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Coordinate dimensions (Zero distortion 1000x650 viewport)
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 650;
  const CENTER_X = CANVAS_WIDTH / 2;
  const CENTER_Y = CANVAS_HEIGHT / 2;

  // Compute deterministic orbital graph coordinates
  const nodePositions = useMemo(() => {
    const positions = new Map<string, NodePosition>();
    const factions = nodes.filter((n) => n.type === 'faction');
    const characters = nodes.filter((n) => n.type === 'character');

    // 1. Position Factions as gravitational anchor centers in an elliptical ring
    const numFactions = Math.max(factions.length, 1);
    const factionRadiusX = 330;
    const factionRadiusY = 190;

    factions.forEach((fac, idx) => {
      const angle = (idx / numFactions) * 2 * Math.PI - Math.PI / 2;
      const x = CENTER_X + factionRadiusX * Math.cos(angle);
      const y = CENTER_Y + factionRadiusY * Math.sin(angle);
      positions.set(fac.id, { x, y, node: fac });
    });

    // 2. Position affiliated characters in satellites around their respective factions
    const factionMemberMap = new Map<string, GraphNode[]>();
    const independentChars: GraphNode[] = [];

    characters.forEach((char) => {
      if (char.faction_id && positions.has(char.faction_id)) {
        const list = factionMemberMap.get(char.faction_id) || [];
        list.push(char);
        factionMemberMap.set(char.faction_id, list);
      } else {
        independentChars.push(char);
      }
    });

    // Arrange members around each faction
    factionMemberMap.forEach((members, facId) => {
      const facPos = positions.get(facId)!;
      const memberCount = members.length;
      const baseOrbit = 65 + Math.min(memberCount * 4, 35);

      members.forEach((member, mIdx) => {
        // Subtle offset based on index
        const angle = (mIdx / memberCount) * 2 * Math.PI;
        // Jitter radius slightly for multi-rings if > 8 members
        const orbit = memberCount > 8 && mIdx % 2 === 1 ? baseOrbit + 30 : baseOrbit;
        const x = facPos.x + orbit * Math.cos(angle);
        const y = facPos.y + orbit * Math.sin(angle);
        positions.set(member.id, { x, y, node: member });
      });
    });

    // 3. Position independent / wanderer characters in an outer perimeter constellation
    const numIndependents = Math.max(independentChars.length, 1);
    const outerRadiusX = 440;
    const outerRadiusY = 270;

    independentChars.forEach((char, idx) => {
      const angle = (idx / numIndependents) * 2 * Math.PI;
      const x = CENTER_X + outerRadiusX * Math.cos(angle);
      const y = CENTER_Y + outerRadiusY * Math.sin(angle);
      positions.set(char.id, { x, y, node: char });
    });

    return positions;
  }, [nodes, CENTER_X, CENTER_Y]);

  // Connected edges and neighbor IDs for selection highlight
  const { incidentEdges, neighborNodeIds } = useMemo(() => {
    if (!selectedNodeId) {
      return { incidentEdges: new Set<string>(), neighborNodeIds: new Set<string>() };
    }
    const edgeSet = new Set<string>();
    const neighborSet = new Set<string>();
    edges.forEach((e) => {
      if (e.source === selectedNodeId) {
        edgeSet.add(e.id);
        neighborSet.add(e.target);
      } else if (e.target === selectedNodeId) {
        edgeSet.add(e.id);
        neighborSet.add(e.source);
      }
    });
    return { incidentEdges: edgeSet, neighborNodeIds: neighborSet };
  }, [edges, selectedNodeId]);

  // Color mapping by relationship predicate
  const getEdgeColor = (predicate: string, label?: string) => {
    const p = (predicate + ' ' + (label || '')).toLowerCase();
    if (p.includes('ally') || p.includes('sworn') || p.includes('friend') || p.includes('comrade')) {
      return '#10b981'; // Emerald Green
    }
    if (p.includes('enemy') || p.includes('rival') || p.includes('clash') || p.includes('target') || p.includes('extortion')) {
      return '#ef4444'; // Red
    }
    if (p.includes('subordinate') || p.includes('command') || p.includes('master') || p.includes('mentor') || p.includes('member_of')) {
      return '#06b6d4'; // Cyan
    }
    if (p.includes('parent') || p.includes('child') || p.includes('brother') || p.includes('kin') || p.includes('lover')) {
      return '#ec4899'; // Pink
    }
    return '#f59e0b'; // Amber
  };

  // Mouse Handlers for Pan & Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on canvas background
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'network-bg') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.5));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    onSelectNode(null);
  };

  const hoveredNode = hoveredNodeId ? nodePositions.get(hoveredNodeId)?.node : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[620px] rounded-2xl border-2 border-slate-700 bg-[#070b14] overflow-hidden select-none shadow-2xl"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Background Starfield / Celestial Grid */}
      <div 
        id="network-bg"
        className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* Floating Viewport HUD Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
          title="Zoom In"
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
          title="Zoom Out"
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset View"
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono font-bold text-amber-400 px-2 select-none border-l border-slate-700">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Floating Lore Legend */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg text-[10px] font-pixel backdrop-blur-md">
        <span className="text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> TIE CODEX:
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> ALLY
        </span>
        <span className="flex items-center gap-1 text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> RIVAL/ENEMY
        </span>
        <span className="flex items-center gap-1 text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-500 inline-block" /> COMMAND/MEMBER
        </span>
        <span className="flex items-center gap-1 text-pink-400">
          <span className="w-2 h-2 rounded-full bg-pink-500 inline-block" /> KINSHIP
        </span>
      </div>

      {/* Primary SVG Rendering Canvas */}
      <svg
        viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <defs>
          {/* Subtle Glow Filter for Selected Nodes & Ties */}
          <filter id="node-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Faction Ring Radiant Gradient */}
          <radialGradient id="faction-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Faction Gravitational Orbit Boundaries */}
          {Array.from(nodePositions.values())
            .filter((p) => p.node.type === 'faction')
            .map((pos) => (
              <g key={`orbit-${pos.node.id}`} pointerEvents="none">
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={85}
                  fill="url(#faction-glow)"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  strokeOpacity="0.25"
                />
              </g>
            ))}

          {/* 1. Render Relationship Edges */}
          <g id="edges-layer">
            {edges.map((edge) => {
              const src = nodePositions.get(edge.source);
              const tgt = nodePositions.get(edge.target);
              if (!src || !tgt) return null;

              const isIncident = incidentEdges.has(edge.id);
              const hasSelection = Boolean(selectedNodeId);

              // Dim edges not connected to currently selected node
              const opacity = hasSelection ? (isIncident ? 1 : 0.08) : 0.45;
              const strokeWidth = isIncident ? 2.5 : 1.2;
              const color = getEdgeColor(edge.predicate, edge.label);

              // Calculate quadratic bezier curve offset so lines don't stack directly
              const dx = tgt.x - src.x;
              const dy = tgt.y - src.y;
              const midX = (src.x + tgt.x) / 2;
              const midY = (src.y + tgt.y) / 2;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const curveFactor = Math.min(dist * 0.1, 24);
              // Perpendicular vector
              const cx = midX - (dy / dist) * curveFactor;
              const cy = midY + (dx / dist) * curveFactor;

              return (
                <g key={edge.id} className="transition-opacity duration-300">
                  <path
                    d={`M ${src.x} ${src.y} Q ${cx} ${cy} ${tgt.x} ${tgt.y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeOpacity={opacity}
                    strokeDasharray={isIncident ? 'none' : '3 3'}
                  />
                  {/* Active Relationship Dot Marker */}
                  {isIncident && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill={color}
                      filter="url(#node-glow)"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* 2. Render Graph Nodes (Characters & Factions) */}
          <g id="nodes-layer">
            {Array.from(nodePositions.values()).map(({ x, y, node }) => {
              const isSelected = selectedNodeId === node.id;
              const isNeighbor = neighborNodeIds.has(node.id);
              const isHovered = hoveredNodeId === node.id;
              const isFaction = node.type === 'faction';

              const hasSelection = Boolean(selectedNodeId);
              const isRelevant = !hasSelection || isSelected || isNeighbor;
              const opacity = isRelevant ? 1 : 0.25;

              const radius = isFaction ? 24 : 17;

              return (
                <g
                  key={node.id}
                  transform={`translate(${x}, ${y})`}
                  opacity={opacity}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(isSelected ? null : node.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isFaction && onDoubleSelectCharacter) {
                      onDoubleSelectCharacter(node.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Selection Pulse Ring */}
                  {isSelected && (
                    <circle
                      r={radius + 7}
                      fill="none"
                      stroke={isFaction ? '#fbbf24' : '#38bdf8'}
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      className="animate-spin"
                      style={{ transformOrigin: '0 0' }}
                    />
                  )}

                  {/* Node Background Halo */}
                  <circle
                    r={radius}
                    fill={isFaction ? '#1e1b4b' : '#0f172a'}
                    stroke={
                      isSelected
                        ? '#fbbf24'
                        : isHovered
                        ? '#38bdf8'
                        : isFaction
                        ? '#f59e0b'
                        : '#334155'
                    }
                    strokeWidth={isFaction ? 2.5 : 1.8}
                    filter={isSelected || isHovered ? 'url(#node-glow)' : undefined}
                  />

                  {/* Pixel Avatar / Emblem Clip */}
                  <clipPath id={`clip-${node.id}`}>
                    <circle r={radius - 2} />
                  </clipPath>

                  {node.avatar_url ? (
                    <image
                      href={node.avatar_url}
                      x={-(radius - 2)}
                      y={-(radius - 2)}
                      width={(radius - 2) * 2}
                      height={(radius - 2) * 2}
                      clipPath={`url(#clip-${node.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  ) : (
                    <g clipPath={`url(#clip-${node.id})`}>
                      <text
                        textAnchor="middle"
                        dy="4"
                        fontSize={isFaction ? '12' : '9'}
                        fill="#f8fafc"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {node.label.slice(0, 2).toUpperCase()}
                      </text>
                    </g>
                  )}

                  {/* Name Pill Label below Node */}
                  <g transform={`translate(0, ${radius + 12})`}>
                    <rect
                      x={-(node.label.length * 3.3 + 8)}
                      y="-8"
                      width={node.label.length * 6.6 + 16}
                      height="16"
                      rx="4"
                      fill="#090d16"
                      stroke={isSelected ? '#fbbf24' : isFaction ? '#f59e0b' : '#1e293b'}
                      strokeWidth="1"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fontSize="9"
                      fill={isSelected ? '#fbbf24' : isFaction ? '#fcd34d' : '#e2e8f0'}
                      fontFamily="monospace"
                      fontWeight={isFaction || isSelected ? 'bold' : 'normal'}
                      pointerEvents="none"
                    >
                      {node.label}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Floating Hover Tooltip HUD */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none bg-slate-900/95 p-3 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md max-w-[280px]">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-pixel uppercase ${
                hoveredNode.type === 'faction'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {hoveredNode.type}
            </span>
            <span className="font-pixel text-xs text-white truncate">{hoveredNode.label}</span>
          </div>
          {hoveredNode.description && (
            <p className="text-[11px] font-mono text-slate-400 line-clamp-2">
              {hoveredNode.description}
            </p>
          )}
          <div className="mt-2 text-[9px] font-pixel text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" /> Click node to open dossier
          </div>
        </div>
      )}
    </div>
  );
}
