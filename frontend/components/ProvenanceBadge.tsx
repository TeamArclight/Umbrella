'use client';

import React from 'react';
import { ProvenanceMode } from '../lib/types';
import { getProvenanceStyle, cn } from '../lib/utils';
import { ShieldAlert, Database, Radio, Satellite, Cpu, AlertTriangle } from 'lucide-react';

interface ProvenanceBadgeProps {
  mode: ProvenanceMode | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function ProvenanceBadge({
  mode,
  size = 'md',
  showIcon = true,
  className,
}: ProvenanceBadgeProps) {
  const style = getProvenanceStyle(mode);

  const getIcon = () => {
    switch (mode) {
      case 'LIVE':
        return <Radio className="w-3 h-3 animate-pulse" />;
      case 'REANALYSIS':
      case 'RETROSPECTIVE_REANALYSIS':
        return <Database className="w-3 h-3" />;
      case 'OBSERVATION':
        return <Satellite className="w-3 h-3" />;
      case 'DERIVED':
      case 'LOCAL_DATASET':
        return <Cpu className="w-3 h-3" />;
      case 'SYNTHETIC':
      case 'MOCK':
        return <AlertTriangle className="w-3 h-3 text-amber-400" />;
      default:
        return <ShieldAlert className="w-3 h-3" />;
    }
  };

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 font-medium tracking-wider',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
    lg: 'text-sm px-3.5 py-1.5 font-bold tracking-wider',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border uppercase select-none transition-colors',
        style.bg,
        style.text,
        style.border,
        sizeClasses[size],
        className
      )}
      title={`Data Provenance: ${mode}`}
    >
      {showIcon && getIcon()}
      <span>{style.label}</span>
    </span>
  );
}
