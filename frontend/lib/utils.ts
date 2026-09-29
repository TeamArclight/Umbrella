import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { HazardLevel, PriorityLevel, ProvenanceMode } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function getHazardColor(level: HazardLevel): {
  text: string;
  bg: string;
  border: string;
  badge: string;
  hex: string;
} {
  switch (level) {
    case 'LOW':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-800/40',
        badge: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
        hex: '#10b981',
      };
    case 'MODERATE':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-950/40',
        border: 'border-amber-800/40',
        badge: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
        hex: '#f59e0b',
      };
    case 'HIGH':
      return {
        text: 'text-orange-400',
        bg: 'bg-orange-950/40',
        border: 'border-orange-800/40',
        badge: 'bg-orange-900/30 text-orange-300 border-orange-700/50',
        hex: '#f97316',
      };
    case 'SEVERE':
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-950/40',
        border: 'border-rose-800/40',
        badge: 'bg-rose-900/30 text-rose-300 border-rose-700/50',
        hex: '#ef4444',
      };
  }
}

export function getPriorityColor(level: PriorityLevel): {
  text: string;
  bg: string;
  border: string;
  badge: string;
  hex: string;
} {
  switch (level) {
    case 'LOW':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-800/40',
        badge: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50',
        hex: '#10b981',
      };
    case 'MEDIUM':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-950/40',
        border: 'border-amber-800/40',
        badge: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
        hex: '#f59e0b',
      };
    case 'HIGH':
      return {
        text: 'text-orange-400',
        bg: 'bg-orange-950/40',
        border: 'border-orange-800/40',
        badge: 'bg-orange-900/30 text-orange-300 border-orange-700/50',
        hex: '#f97316',
      };
    case 'CRITICAL':
      return {
        text: 'text-rose-400',
        bg: 'bg-rose-950/40',
        border: 'border-rose-800/40',
        badge: 'bg-rose-900/30 text-rose-300 border-rose-700/50',
        hex: '#ef4444',
      };
  }
}

export function getProvenanceStyle(mode: ProvenanceMode | string): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (mode) {
    case 'LIVE':
      return {
        label: 'LIVE FORECAST',
        bg: 'bg-emerald-950/50',
        text: 'text-emerald-400',
        border: 'border-emerald-700/60',
      };
    case 'REANALYSIS':
    case 'RETROSPECTIVE_REANALYSIS':
      return {
        label: 'RETROSPECTIVE REANALYSIS (ERA5)',
        bg: 'bg-sky-950/50',
        text: 'text-sky-400',
        border: 'border-sky-700/60',
      };
    case 'OBSERVATION':
      return {
        label: 'SATELLITE OBSERVATION',
        bg: 'bg-purple-950/50',
        text: 'text-purple-400',
        border: 'border-purple-700/60',
      };
    case 'DERIVED':
      return {
        label: 'DERIVED MODEL',
        bg: 'bg-indigo-950/50',
        text: 'text-indigo-400',
        border: 'border-indigo-700/60',
      };
    case 'LOCAL_DATASET':
      return {
        label: 'LOCAL CLIMATOLOGY (CHIRPS)',
        bg: 'bg-cyan-950/50',
        text: 'text-cyan-400',
        border: 'border-cyan-700/60',
      };
    case 'SYNTHETIC':
      return {
        label: 'SYNTHETIC DEMO PORTFOLIO',
        bg: 'bg-amber-950/60',
        text: 'text-amber-400',
        border: 'border-amber-700/60',
      };
    case 'MOCK':
      return {
        label: 'DEMO / MOCK DATA',
        bg: 'bg-red-950/50',
        text: 'text-red-400',
        border: 'border-red-700/60',
      };
    default:
      return {
        label: String(mode),
        bg: 'bg-slate-800',
        text: 'text-slate-300',
        border: 'border-slate-700',
      };
  }
}
