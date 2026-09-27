import React from 'react';

interface PixelGaugeProps {
  label: string;
  value: number; // 0 to 10
  max?: number;
  colorClass?: string;
}

export function PixelGauge({ 
  label, 
  value, 
  max = 10,
  colorClass = 'text-amber-400' 
}: PixelGaugeProps) {
  const safeValue = Math.min(Math.max(0, value), max);
  const filledCount = Math.round((safeValue / max) * 10);
  const emptyCount = 10 - filledCount;

  const filledBlocks = '█'.repeat(filledCount);
  const emptyBlocks = '░'.repeat(emptyCount);

  return (
    <div className="font-mono text-xs space-y-1">
      <div className="flex items-center justify-between text-slate-400 text-[11px]">
        <span className="font-pixel text-[10px] tracking-wide text-slate-300">{label}</span>
        <span className="font-bold text-slate-200">{Math.round((safeValue / max) * 100)}%</span>
      </div>
      <div className="flex items-center gap-1 tracking-tighter">
        <span className={`${colorClass} font-bold text-sm tracking-widest select-none`}>
          {filledBlocks}
        </span>
        <span className="text-slate-600 font-bold text-sm tracking-widest select-none">
          {emptyBlocks}
        </span>
      </div>
    </div>
  );
}
