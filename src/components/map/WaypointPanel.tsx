'use client';

import React from 'react';
import { X } from 'lucide-react';
import { ProjectedWaypoint } from '../../projections/temporal-map';
import { WaypointGroup } from './atlas-ui-state';

export interface WaypointPanelProps {
  groups: WaypointGroup[];
  activePlaneId: string;
  onTravel: (waypoint: ProjectedWaypoint) => void;
  onClose: () => void;
  accentColor: string;
}

export function WaypointPanel({ groups, activePlaneId, onTravel, onClose, accentColor }: WaypointPanelProps) {
  return (
    <div
      data-testid="waypoint-panel"
      role="dialog"
      aria-label="Waypoints"
      className="pointer-events-auto absolute left-4 top-24 bottom-24 z-30 flex w-64 flex-col border-2 bg-[#0b0a0d]/95 shadow-[0_0_0_2px_#000]"
      style={{ borderColor: `${accentColor}aa` }}
    >
      <div className="flex items-center justify-between border-b-2 border-black px-3 py-2">
        <span className="font-pixel text-xs tracking-widest" style={{ color: accentColor }}>
          WAYPOINTS
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white"
          aria-label="Close waypoints"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {groups.length === 0 && (
          <p className="px-2 py-6 text-center font-pixel text-[10px] text-slate-500">NO WAYPOINTS DISCOVERED YET</p>
        )}
        {groups.map((group) => (
          <section key={group.planeId}>
            <h3 className="px-1 pb-1 font-pixel text-[10px] text-slate-300 border-b border-slate-800">
              {group.planeName}
              {group.planeId === activePlaneId && <span className="ml-2 text-slate-500">(HERE)</span>}
            </h3>
            {group.regions.map((region) => (
              <div key={region.regionId ?? 'none'} className="mt-1.5">
                <div className="px-1 font-mono text-[9px] uppercase text-slate-500">{region.regionName}</div>
                {region.waypoints.map((wp) => (
                  <button
                    key={wp.locationId}
                    type="button"
                    onClick={() => onTravel(wp)}
                    className="flex w-full items-center justify-between px-2 py-1 text-left font-mono text-[11px] text-slate-200 hover:bg-white/5"
                  >
                    <span className="truncate">{wp.name}</span>
                    {wp.isCurrent && <span className="font-pixel text-[8px] text-amber-300">CURRENT</span>}
                  </button>
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
      <div className="border-t border-black/80 px-3 py-1 font-mono text-[9px] text-slate-500">[M] toggle · [Esc] close</div>
    </div>
  );
}

export default WaypointPanel;
