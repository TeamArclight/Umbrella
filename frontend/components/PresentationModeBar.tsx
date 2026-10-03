'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Play, ChevronLeft, ChevronRight, X, MonitorPlay } from 'lucide-react';
import { cn } from '../lib/utils';

export interface DemoStep {
  step: number;
  id: string;
  name: string;
  route: string;
  cue: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    id: 'command-center',
    name: '01 Command Center',
    route: '/dashboard',
    cue: 'Show Darbhanga pilot district, 10 clusters, and decoupled hazard vs exposure.',
  },
  {
    step: 2,
    id: 'explain-risk',
    name: '02 Explain Risk',
    route: '/live-risk',
    cue: 'Demonstrate Open-Meteo multi-model forecast and 5-factor Flood Hazard Model v1.0 explainability.',
  },
  {
    step: 3,
    id: 'historical-replay',
    name: '03 Historical Replay',
    route: '/historical-replay',
    cue: 'Scrub July 2020 disaster replay (T-7 to T0); show ERA5 reanalysis and Sentinel-1 SAR evidence.',
  },
  {
    step: 4,
    id: 'portfolio-exposure',
    name: '04 Portfolio Exposure',
    route: '/portfolio',
    cue: 'Inspect synthetic MFI loan book, JLG borrower groups, and capital at risk by cluster.',
  },
  {
    step: 5,
    id: 'action-center',
    name: '05 Action Center',
    route: '/actions',
    cue: 'Review Operational Priority triage ranking (60% Hazard + 40% Exposure).',
  },
  {
    step: 6,
    id: 'adaptation',
    name: '06 Adaptation',
    route: '/green-finance#recommendations',
    cue: 'Explore rule-based adaptation recommendations (Hermetic Silos, Solar Pumps) matching livelihoods.',
  },
  {
    step: 7,
    id: 'finance',
    name: '07 Finance',
    route: '/green-finance#calculator',
    cue: 'Run reducing-balance loan calculator, transparent interest, and operational payback estimates.',
  },
  {
    step: 8,
    id: 'human-decision',
    name: '08 Human Decision',
    route: '/green-finance#applications',
    cue: 'Emphasize human credit officer authorization requirement. Autonomous AI lending is prohibited.',
  },
  {
    step: 9,
    id: 'field-verification',
    name: '09 Field Verification',
    route: '/field-officer',
    cue: 'Demonstrate mobile field inspection, GPS geofencing, and SHA-256 duplicate image detection.',
  },
  {
    step: 10,
    id: 'impact',
    name: '10 Impact',
    route: '/impact',
    cue: 'Present Dual-Track Impact: Track 1 Resilience Metrics and Track 2 Activity-Based Emissions Avoided.',
  },
  {
    step: 11,
    id: 'traceability',
    name: '11 Traceability',
    route: '/assets/AST-DAR-HAY-001',
    cue: 'Walk through full end-to-end audit trail from climate trigger to verified asset impact.',
  },
];

export function PresentationModeBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);

  // Initialize from localStorage or sync with current pathname
  useEffect(() => {
    const savedActive = localStorage.getItem('umbrella_presentation_active');
    if (savedActive === 'true') {
      setIsActive(true);
    }

    const savedIdx = localStorage.getItem('umbrella_presentation_step');
    if (savedIdx !== null) {
      const idx = parseInt(savedIdx, 10);
      if (!isNaN(idx) && idx >= 0 && idx < DEMO_STEPS.length) {
        setCurrentStepIdx(idx);
      }
    }
  }, []);

  // Update step index when pathname changes if it matches a step
  useEffect(() => {
    if (!pathname) return;
    const matchIdx = DEMO_STEPS.findIndex((s) => pathname === s.route || pathname.startsWith(s.route.split('#')[0]));
    if (matchIdx !== -1 && isActive) {
      setCurrentStepIdx(matchIdx);
      localStorage.setItem('umbrella_presentation_step', matchIdx.toString());
    }
  }, [pathname, isActive]);

  const togglePresentationMode = () => {
    const nextState = !isActive;
    setIsActive(nextState);
    localStorage.setItem('umbrella_presentation_active', nextState ? 'true' : 'false');
    if (nextState) {
      localStorage.setItem('umbrella_presentation_step', currentStepIdx.toString());
    }
  };

  const goToStep = (newIdx: number) => {
    if (newIdx < 0 || newIdx >= DEMO_STEPS.length) return;
    setCurrentStepIdx(newIdx);
    localStorage.setItem('umbrella_presentation_step', newIdx.toString());
    router.push(DEMO_STEPS[newIdx].route);
  };

  const currentStep = DEMO_STEPS[currentStepIdx];

  return (
    <>
      {/* Floating Toggle Button (visible when bar is closed) */}
      {!isActive && (
        <button
          onClick={togglePresentationMode}
          className="fixed bottom-12 right-6 z-40 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white px-3.5 py-2 rounded-full shadow-lg shadow-sky-950/60 border border-sky-400/40 text-xs font-semibold flex items-center gap-2 transition-all hover:scale-105 select-none"
          title="Enter 3-Minute Presentation Mode"
        >
          <MonitorPlay className="w-4 h-4 text-sky-200" />
          <span>Presentation Mode</span>
        </button>
      )}

      {/* Persistent Presentation Mode Bar */}
      {isActive && (
        <aside
          aria-label="Presentation Mode Controls"
          className="fixed top-0 left-0 md:left-64 right-0 z-50 bg-[#080d1a]/95 backdrop-blur-md border-b border-sky-500/40 px-6 py-2.5 flex items-center justify-between text-xs shadow-2xl shadow-black/80 animate-in fade-in duration-200"
        >
          {/* Left: Step Info & Narrative Cue */}
          <div className="flex items-center gap-4 flex-1 mr-4 overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 rounded text-[11px]">
                STEP {currentStep.step.toString().padStart(2, '0')} / {DEMO_STEPS.length}
              </span>
              <span className="font-bold text-white whitespace-nowrap">{currentStep.name}</span>
            </div>

            <div className="h-4 w-px bg-slate-800 shrink-0 hidden md:block" />

            <p className="text-[11px] text-slate-300 truncate hidden md:block italic">
              &ldquo;{currentStep.cue}&rdquo;
            </p>
          </div>

          {/* Right: Controls (Previous, Next, Exit) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => goToStep(currentStepIdx - 1)}
              disabled={currentStepIdx === 0}
              className={cn(
                'px-2.5 py-1 rounded border text-[11px] font-semibold flex items-center gap-1 transition-all',
                currentStepIdx === 0
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-900/40'
                  : 'border-slate-700 text-slate-200 hover:bg-slate-800 bg-slate-900'
              )}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => goToStep(currentStepIdx + 1)}
              disabled={currentStepIdx === DEMO_STEPS.length - 1}
              className={cn(
                'px-3 py-1 rounded border text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm',
                currentStepIdx === DEMO_STEPS.length - 1
                  ? 'border-slate-800 text-slate-600 cursor-not-allowed bg-slate-900/40'
                  : 'border-sky-500/60 bg-sky-500 text-slate-950 hover:bg-sky-400'
              )}
            >
              <span>Next Demo Step</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-800 mx-1" />

            <button
              onClick={togglePresentationMode}
              className="px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
              title="Exit Presentation Mode"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
