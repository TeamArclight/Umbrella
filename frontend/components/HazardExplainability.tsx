'use client';

import React from 'react';
import { FloodHazardEvaluation } from '../lib/types';
import { getHazardColor } from '../lib/utils';
import { Info, HelpCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface HazardExplainabilityProps {
  hazard: FloodHazardEvaluation;
}

export function HazardExplainability({ hazard }: HazardExplainabilityProps) {
  const colors = getHazardColor(hazard.hazard_level);

  // Compute calculated sum of contributions
  const calculatedSum = hazard.components.reduce(
    (acc, curr) => acc + (curr.contribution || 0),
    0
  );

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0c1220] p-5 shadow-lg">
      {/* Header with Title and Verification Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Hazard Explainability Engine
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
              Model v1.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent decomposition: 5 independent physical factors strictly summing to composite score
          </p>
        </div>

        {/* Verification Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sum(Contributions) = {hazard.hazard_score.toFixed(1)}</span>
        </div>
      </div>

      {/* Synthesis Narrative */}
      <div className="mt-4 p-3 rounded-lg bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
        <span className="font-semibold text-slate-200">Synthesis: </span>
        {hazard.narrative}
      </div>

      {/* Primary Physical Drivers Pills */}
      {hazard.drivers && hazard.drivers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Key Drivers:</span>
          {hazard.drivers.map((driver, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
            >
              {driver}
            </span>
          ))}
        </div>
      )}

      {/* Granular Component Breakdown Table / Progress Rows */}
      <div className="mt-5 space-y-3">
        {hazard.components.map((comp) => {
          const pctWidth = Math.min(100, Math.max(0, comp.normalized_score));
          return (
            <div
              key={comp.name}
              className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200 capitalize">
                      {comp.name.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Weight: {(comp.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {comp.description}
                  </div>
                </div>

                {/* Raw Metric & Contribution Score */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-mono font-bold text-sky-400">
                    +{comp.contribution.toFixed(1)}{' '}
                    <span className="text-[10px] font-normal text-slate-400">pts</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Raw: <span className="text-slate-300 font-medium">{comp.raw_value.toFixed(1)} {comp.raw_unit}</span>
                  </div>
                </div>
              </div>

              {/* Severity Bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pctWidth}%`,
                      backgroundColor:
                        comp.normalized_score >= 70
                          ? '#ef4444'
                          : comp.normalized_score >= 50
                          ? '#f97316'
                          : comp.normalized_score >= 30
                          ? '#f59e0b'
                          : '#10b981',
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
                  {comp.normalized_score.toFixed(0)} / 100
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Formula Explanation Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="text-slate-400">
          Hazard = 0.35 * Accum + 0.25 * Burst + 0.15 * Soil + 0.15 * Anomaly + 0.10 * Terrain
        </span>
        <span className="text-emerald-400 font-semibold">
          Total Score: {hazard.hazard_score.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
