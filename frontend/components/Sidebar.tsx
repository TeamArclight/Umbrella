'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CloudRain,
  History,
  Briefcase,
  CheckSquare,
  Leaf,
  BookOpen,
  Umbrella,
  MapPin,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  {
    href: '/dashboard',
    label: 'Command Center',
    icon: LayoutDashboard,
    badge: 'Real-time',
  },
  {
    href: '/live-risk',
    label: 'Live Risk Monitor',
    icon: CloudRain,
    badge: 'Monsoon',
  },
  {
    href: '/historical-replay',
    label: 'Historical Replay',
    icon: History,
    badge: 'July 2020',
  },
  {
    href: '/portfolio',
    label: 'Portfolio Exposure',
    icon: Briefcase,
    badge: 'Synthetic',
  },
  {
    href: '/actions',
    label: 'Action Center',
    icon: CheckSquare,
    badge: 'Review',
  },
  {
    href: '/green-finance',
    label: 'Green Adaptation',
    icon: Leaf,
    badge: 'Resilience',
  },
  {
    href: '/methodology',
    label: 'Model & Attribution',
    icon: BookOpen,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-800 flex flex-col justify-between h-screen fixed left-0 top-0 z-40 select-none">
      {/* Top Header */}
      <div>
        <div className="p-5 border-b border-slate-800/80">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/20 transition-colors">
              <Umbrella className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                UMBRELLA
                <span className="text-[10px] px-1.5 py-0.2 font-mono font-semibold bg-sky-500/20 text-sky-300 rounded border border-sky-400/30">
                  MFI
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium tracking-tight">
                Climate Risk Command Center
              </div>
            </div>
          </Link>
        </div>

        {/* Pilot District Profile Badge */}
        <div className="mx-3 mt-4 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-sky-400" />
              Pilot District
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">10 Clusters</span>
          </div>
          <div className="font-semibold text-slate-200">Darbhanga, Bihar</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Bagmati & Kamla Basins</div>
        </div>

        {/* Navigation links */}
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group',
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-mono',
                      isActive
                        ? 'bg-sky-500/30 text-sky-200'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60 text-slate-400">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Institutional Architecture</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
          Hazard ≠ Exposure ≠ Default
        </p>
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
          <span>Model v1.0</span>
          <span>FastAPI Port: 8000</span>
        </div>
      </div>
    </aside>
  );
}
