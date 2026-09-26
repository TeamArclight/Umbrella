'use client';

import React from 'react';
import { Radio, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  horizon: number;
  onHorizonChange: (h: number) => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  lastUpdated?: string;
  sourceMode?: string;
  title?: string;
}

export function Navbar({
  horizon,
  onHorizonChange,
  isRefreshing = false,
  onRefresh,
  lastUpdated,
  sourceMode = 'LIVE',
  title = 'Climate Risk Command Center',
}: NavbarProps) {
  return (
    <header className="h-14 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Title & Pilot */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white tracking-tight">{title}</h1>
        <div className="h-4 w-px bg-slate-800" />
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-slate-300">Darbhanga District, Bihar</span>
          <span className="text-[11px] text-slate-400">· 10 Operational Clusters</span>
        </div>
      </div>

      {/* Right Controls: Horizon Toggle & Live State */}
      <div className="flex items-center gap-4">
        {/* Forecast Horizon Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
          <span className="text-[11px] font-semibold text-slate-400 px-2 uppercase tracking-wider">
            Horizon:
          </span>
          {[3, 5, 7].map((h) => (
            <button
              key={h}
              onClick={() => onHorizonChange(h)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-semibold transition-all',
                horizon === h
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              {h}D
            </button>
          ))}
        </div>

        {/* Refresh / Re-evaluate Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            title="Re-run pipeline evaluation"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 text-sky-400', isRefreshing && 'animate-spin')} />
            <span>{isRefreshing ? 'Evaluating...' : 'Refresh'}</span>
          </button>
        )}

        {/* Live sync / time */}
        {lastUpdated && (
          <div className="text-[11px] text-slate-400 font-mono hidden md:block">
            Updated: {lastUpdated}
          </div>
        )}
      </div>
    </header>
  );
}
