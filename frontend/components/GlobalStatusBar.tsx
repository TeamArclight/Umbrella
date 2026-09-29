'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Activity, CheckCircle, Database, Radio, Satellite, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export function GlobalStatusBar() {
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [lastCheck, setLastCheck] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await api.getHealth();
        if (mounted) {
          setApiStatus('online');
          setLastCheck(new Date().toLocaleTimeString());
        }
      } catch {
        if (mounted) {
          setApiStatus('offline');
        }
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <footer className="h-8 bg-[#070a10] border-t border-slate-800/80 fixed bottom-0 left-64 right-0 z-30 px-6 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
      <div className="flex items-center gap-5">
        {/* Backend API status */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              apiStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            )}
          />
          <span className="text-slate-300 font-sans font-medium">Umbrella API:</span>
          <span className={apiStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}>
            {apiStatus === 'online' ? 'Connected (8000)' : 'Offline'}
          </span>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        {/* Upstream Feeds */}
        <div className="flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-sky-400" />
          <span className="text-slate-400">Weather:</span>
          <span className="text-sky-300">Open-Meteo (Live / Fallback)</span>
        </div>

        <div className="h-3 w-px bg-slate-800 hidden lg:block" />

        <div className="hidden lg:flex items-center gap-1.5">
          <Database className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-400">Baseline:</span>
          <span className="text-cyan-300">CGIAR / CHIRPS Normal</span>
        </div>

        <div className="h-3 w-px bg-slate-800 hidden xl:block" />

        <div className="hidden xl:flex items-center gap-1.5">
          <Satellite className="w-3 h-3 text-purple-400" />
          <span className="text-slate-400">Satellite SAR:</span>
          <span className="text-purple-300">Sentinel-1 (July 2020)</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-slate-400">
        <span className="hidden md:inline">Model: Flood Hazard Model v1.0</span>
        <span className="text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          Portfolio: SYNTHETIC
        </span>
      </div>
    </footer>
  );
}
