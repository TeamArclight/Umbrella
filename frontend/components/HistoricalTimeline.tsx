'use client';

import React, { useEffect, useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

export interface TimelineStep {
  date: string;
  offsetDays: number;
  label: string;
  description: string;
  isPeak?: boolean;
}

export const JULY_2020_TIMELINE_STEPS: TimelineStep[] = [
  {
    date: '2020-07-18',
    offsetDays: -7,
    label: 'T-7',
    description: 'Initial Monsoon Rains in Nepal foothills',
  },
  {
    date: '2020-07-20',
    offsetDays: -5,
    label: 'T-5',
    description: 'Soil saturation escalating across Bagmati basin',
  },
  {
    date: '2020-07-22',
    offsetDays: -3,
    label: 'T-3',
    description: 'Intense heavy precipitation burst (>75mm)',
  },
  {
    date: '2020-07-24',
    offsetDays: -1,
    label: 'T-1',
    description: 'CWC Hayaghat river gauge crosses Danger Level',
  },
  {
    date: '2020-07-25',
    offsetDays: 0,
    label: 'T0 (Peak)',
    description: 'Event Peak Crest: 50.82m (+2.14m above Danger Level)',
    isPeak: true,
  },
  {
    date: '2020-07-28',
    offsetDays: 3,
    label: 'T+3',
    description: 'Post-peak recession and drainage phase',
  },
];

interface HistoricalTimelineProps {
  currentDate: string;
  onSelectDate: (date: string) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
}

export function HistoricalTimeline({
  currentDate,
  onSelectDate,
  isPlaying = false,
  onTogglePlay,
}: HistoricalTimelineProps) {
  const currentIndex = JULY_2020_TIMELINE_STEPS.findIndex((s) => s.date === currentDate);
  const activeIndex = currentIndex >= 0 ? currentIndex : 4; // default to peak (index 4)

  const handlePrev = () => {
    if (activeIndex > 0) {
      onSelectDate(JULY_2020_TIMELINE_STEPS[activeIndex - 1].date);
    }
  };

  const handleNext = () => {
    if (activeIndex < JULY_2020_TIMELINE_STEPS.length - 1) {
      onSelectDate(JULY_2020_TIMELINE_STEPS[activeIndex + 1].date);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090d16] p-4 shadow-xl">
      {/* Header with Title and Anti-leakage Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Chronological Replay Timeline
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            North Bihar Flood (July 2020)
          </span>
        </div>

        {/* Strict Anti-leakage Guarantee Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950/40 border border-sky-800/40 text-[10px] font-mono text-sky-300">
          <ShieldAlert className="w-3 h-3 text-sky-400" />
          <span>Strict Anti-Leakage Lookback (Zero Future Peeking)</span>
        </div>
      </div>

      {/* Timeline Progression Bar */}
      <div className="mt-5 px-2">
        <div className="relative">
          {/* Background Track Line */}
          <div className="absolute top-3.5 left-4 right-4 h-1 bg-slate-800 rounded-full" />

          {/* Active Highlight Line */}
          <div
            className="absolute top-3.5 left-4 h-1 bg-sky-500 rounded-full transition-all duration-300"
            style={{
              width: `${(activeIndex / (JULY_2020_TIMELINE_STEPS.length - 1)) * 92}%`,
            }}
          />

          {/* Milestone Step Nodes */}
          <div className="relative flex justify-between">
            {JULY_2020_TIMELINE_STEPS.map((step, idx) => {
              const isActive = step.date === currentDate;
              const isPast = idx <= activeIndex;

              return (
                <button
                  key={step.date}
                  onClick={() => onSelectDate(step.date)}
                  className="flex flex-col items-center group focus:outline-none"
                >
                  {/* Node Circle */}
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all border-2',
                      isActive
                        ? step.isPeak
                          ? 'bg-rose-500 border-white text-white scale-110 shadow-lg shadow-rose-500/50'
                          : 'bg-sky-500 border-white text-slate-950 scale-110 shadow-lg shadow-sky-500/50'
                        : isPast
                        ? step.isPeak
                          ? 'bg-rose-950 border-rose-500 text-rose-300'
                          : 'bg-sky-950 border-sky-600 text-sky-300'
                        : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                    )}
                  >
                    {step.label}
                  </div>

                  {/* Date Label */}
                  <span
                    className={cn(
                      'mt-2 text-[11px] font-mono transition-colors',
                      isActive
                        ? 'text-white font-bold'
                        : isPast
                        ? 'text-slate-300'
                        : 'text-slate-400 group-hover:text-slate-400'
                    )}
                  >
                    {step.date.slice(5)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Timeline Controls and Description */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Play/Pause & Step Buttons */}
        <div className="flex items-center gap-2">
          {onTogglePlay && (
            <button
              onClick={onTogglePlay}
              className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-colors"
              title={isPlaying ? 'Pause auto replay' : 'Play chronological replay'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={handlePrev}
            disabled={activeIndex === 0}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={activeIndex === JULY_2020_TIMELINE_STEPS.length - 1}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-slate-400 font-mono text-[11px] ml-2">
            Selected Snapshot: <strong className="text-white">{JULY_2020_TIMELINE_STEPS[activeIndex].date}</strong>
          </span>
        </div>

        {/* Phase Context Description */}
        <div className="text-[11px] text-slate-300 font-medium">
          Phase Context: <span className="text-sky-300">{JULY_2020_TIMELINE_STEPS[activeIndex].description}</span>
        </div>
      </div>
    </div>
  );
}
